package com.example.engine

import android.os.Handler
import android.os.Looper
import com.example.model.*
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit
import kotlin.math.abs

class BlazeCollectorService(
    private val onNewRoundsReceived: (List<Round>) -> Unit,
    private val onStateUpdated: (CollectorState) -> Unit
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .writeTimeout(8, TimeUnit.SECONDS)
        .build()

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isRunning = false
    private var currentMode = "auto"
    private var activeMirrorName = "Blaze Brasil (bet.br)"
    private var activeRestUrl = "https://blaze.bet.br/api/roulette_games/recent"
    private var activeWsUrl = "wss://api-gaming.blaze.bet.br/replication/?EIO=3&transport=websocket"

    private var webSocket: WebSocket? = null
    private var pollingJob: Job? = null
    private var simulationJob: Job? = null

    private val seenIds = Collections.synchronizedSet(mutableSetOf<String>())
    private var lastAcceptedRound: Round? = null
    private val logs = Collections.synchronizedList(mutableListOf<CollectorLogItem>())
    private var totalCollectedSession = 0

    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    val mirrors = listOf(
        MirrorConfig("Blaze Brasil (bet.br)", "https://blaze.bet.br/api/roulette_games/recent", "wss://api-gaming.blaze.bet.br/replication/?EIO=3&transport=websocket"),
        MirrorConfig("Blaze Global (.com)", "https://blaze.com/api/roulette_games/recent", "wss://api-gaming.blaze.com/replication/?EIO=3&transport=websocket"),
        MirrorConfig("Blaze Espelho 1 (space)", "https://blaze1.space/api/roulette_games/recent", "wss://api-v2.blaze.com/replication/?EIO=3&transport=websocket")
    )

    data class MirrorConfig(val name: String, val rest: String, val ws: String)

    fun start(mode: String = "auto", mirrorName: String = "Blaze Brasil (bet.br)") {
        currentMode = mode
        setMirror(mirrorName)
        isRunning = true
        addLog("info", "Iniciando coletor no modo: $mode ($activeMirrorName)")
        updateState("connecting", "Conectando ao espelho...")

        if (mode == "simulation") {
            startSimulation()
        } else {
            startPolling()
            if (mode == "websocket" || mode == "auto") {
                startWebSocket()
            }
        }
    }

    fun stop() {
        isRunning = false
        pollingJob?.cancel()
        simulationJob?.cancel()
        webSocket?.close(1000, "App closed")
        webSocket = null
        updateState("offline", "Coletor pausado")
        addLog("info", "Coletor pausado pelo usuário")
    }

    fun setMirror(name: String) {
        val found = mirrors.find { it.name == name } ?: mirrors[0]
        activeMirrorName = found.name
        activeRestUrl = found.rest
        activeWsUrl = found.ws
    }

    private fun addLog(type: String, message: String) {
        val now = timeFormat.format(Date())
        val item = CollectorLogItem(
            time = now,
            type = type,
            message = message
        )
        logs.add(0, item)
        if (logs.size > 80) logs.removeAt(logs.size - 1)
    }

    private fun updateState(status: String, statusText: String, latency: Long = 0L) {
        val state = CollectorState(
            status = status,
            statusText = statusText,
            mode = currentMode,
            activeSource = activeMirrorName,
            lastRound = lastAcceptedRound,
            lastCheckTime = System.currentTimeMillis(),
            latencyMs = latency,
            totalCollectedSession = totalCollectedSession,
            logs = ArrayList(logs)
        )
        onStateUpdated(state)
    }

    private fun startPolling() {
        pollingJob?.cancel()
        pollingJob = scope.launch {
            while (isRunning && isActive) {
                if (currentMode != "simulation") {
                    fetchRecentRounds()
                }
                delay(6000) // Poll every 6 seconds
            }
        }
    }

    suspend fun fetchRecentRounds(): List<Round> {
        val startTime = System.currentTimeMillis()
        val request = Request.Builder()
            .url(activeRestUrl)
            .header("User-Agent", "Mozilla/5.0 (Android; Mobile; rv:120.0)")
            .header("Accept", "application/json")
            .build()

        return try {
            val response = client.newCall(request).execute()
            val latency = System.currentTimeMillis() - startTime
            if (response.isSuccessful) {
                val body = response.body?.string() ?: ""
                val rounds = parseBlazeJsonResponse(body)
                if (rounds.isNotEmpty()) {
                    val filtered = filterAndAcceptRounds(rounds)
                    if (filtered.isNotEmpty()) {
                        totalCollectedSession += filtered.size
                        updateState("live", "Sincronizado (${filtered.size} novas)", latency)
                        addLog("success", "Recebidas ${filtered.size} novas rodadas (Latência: ${latency}ms)")
                        withContext(Dispatchers.Main) {
                            onNewRoundsReceived(filtered)
                        }
                    } else {
                        updateState("live", "Monitorando rodadas em tempo real", latency)
                    }
                    filtered
                } else {
                    updateState("live", "Aguardando próxima rodada", latency)
                    emptyList()
                }
            } else {
                val code = response.code
                updateState("error", "Erro HTTP $code no espelho", latency)
                addLog("warning", "Falha HTTP $code em $activeMirrorName. Alternando espelho...")
                tryFailoverMirror()
                emptyList()
            }
        } catch (e: Exception) {
            val latency = System.currentTimeMillis() - startTime
            updateState("error", "Erro de rede: ${e.localizedMessage ?: "timeout"}", latency)
            addLog("error", "Erro de conexão: ${e.message}. Tentando espelho de contingência...")
            tryFailoverMirror()
            emptyList()
        }
    }

    private fun tryFailoverMirror() {
        val nextIdx = (mirrors.indexOfFirst { it.name == activeMirrorName } + 1) % mirrors.size
        val next = mirrors[nextIdx]
        setMirror(next.name)
        addLog("info", "Mudando para espelho alternativo: ${next.name}")
    }

    private fun startWebSocket() {
        try {
            val request = Request.Builder().url(activeWsUrl).build()
            webSocket = client.newWebSocket(request, object : WebSocketListener() {
                override fun onOpen(webSocket: WebSocket, response: Response) {
                    addLog("success", "WebSocket conectado em $activeMirrorName")
                    // Subscribe to double roulette stream
                    webSocket.send("42[\"cmd\",{\"id\":\"subscribe\",\"payload\":{\"room\":\"double\"}}]")
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                    if (text.startsWith("42[\"double\"")) {
                        try {
                            val jsonArray = JSONArray(text.substring(2))
                            if (jsonArray.length() >= 2) {
                                val payload = jsonArray.getJSONObject(1)
                                val round = parseSingleBlazeJson(payload)
                                if (round != null) {
                                    val filtered = filterAndAcceptRounds(listOf(round))
                                    if (filtered.isNotEmpty()) {
                                        totalCollectedSession += filtered.size
                                        updateState("live", "Nova rodada via WebSocket!", 25L)
                                        addLog("success", "WS: Roll #${round.number} (${round.color.ptName})")
                                        Handler(Looper.getMainLooper()).post {
                                            onNewRoundsReceived(filtered)
                                        }
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            // Non-critical parsing error
                        }
                    } else if (text == "2") {
                        webSocket.send("3") // Heartbeat ping-pong
                    }
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                    addLog("warning", "WebSocket desconectado: ${t.message}. Mantendo REST polling ativo.")
                }

                override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                    addLog("info", "WebSocket finalizado ($code)")
                }
            })
        } catch (e: Exception) {
            addLog("warning", "Não foi possível abrir WebSocket (${e.message}). REST polling ativo.")
        }
    }

    private fun startSimulation() {
        simulationJob?.cancel()
        simulationJob = scope.launch {
            val random = Random()
            addLog("info", "Modo Simulação ativado (gerando rodadas a cada 25s)")
            updateState("live", "Simulador Double Ativo")

            while (isRunning && isActive) {
                delay(25000)
                if (currentMode != "simulation") break

                val num = random.nextInt(15)
                val nowStr = isoFormat.format(Date())
                val simRound = Round(
                    id = "sim_${System.currentTimeMillis()}_$num",
                    number = num,
                    color = DoubleColor.fromNumber(num),
                    createdAt = nowStr,
                    source = "simulation"
                )

                val filtered = filterAndAcceptRounds(listOf(simRound))
                if (filtered.isNotEmpty()) {
                    totalCollectedSession += filtered.size
                    updateState("live", "Simulador: Roll #${num} (${simRound.color.ptName})", 5L)
                    addLog("success", "Simulação: Roll #${num} (${simRound.color.ptName})")
                    withContext(Dispatchers.Main) {
                        onNewRoundsReceived(filtered)
                    }
                }
            }
        }
    }

    private fun parseBlazeJsonResponse(jsonString: String): List<Round> {
        val results = mutableListOf<Round>()
        try {
            val array = if (jsonString.trim().startsWith("[")) {
                JSONArray(jsonString)
            } else {
                val obj = JSONObject(jsonString)
                obj.optJSONArray("records") ?: obj.optJSONArray("data") ?: JSONArray()
            }

            for (i in 0 until array.length()) {
                val item = array.getJSONObject(i)
                val round = parseSingleBlazeJson(item)
                if (round != null) results.add(round)
            }
        } catch (e: Exception) {
            // Json parsing failed
        }
        return results
    }

    private fun parseSingleBlazeJson(item: JSONObject): Round? {
        val rollVal = when {
            item.has("roll") -> item.optInt("roll", -1)
            item.has("number") -> item.optInt("number", -1)
            item.has("result") -> item.optInt("result", -1)
            else -> -1
        }
        if (rollVal < 0 || rollVal > 14) return null

        val color = DoubleColor.fromNumber(rollVal)
        val createdAt = item.optString("created_at", isoFormat.format(Date()))
        val id = if (item.has("id")) item.optString("id") else "blaze_${createdAt}_$rollVal"

        return Round(
            id = id,
            externalId = item.optString("id", null),
            number = rollVal,
            color = color,
            createdAt = createdAt,
            source = "blaze"
        )
    }

    private fun filterAndAcceptRounds(incoming: List<Round>): List<Round> {
        val sorted = incoming.sortedBy { PredictionEngine.parseDate(it.createdAt).time }
        val accepted = mutableListOf<Round>()

        for (current in sorted) {
            if (seenIds.contains(current.id)) continue

            val last = lastAcceptedRound
            if (last != null) {
                val tCurrent = PredictionEngine.parseDate(current.createdAt).time
                val tLast = PredictionEngine.parseDate(last.createdAt).time
                val timeDiff = abs(tCurrent - tLast)

                // Distinct Double rounds are spaced ~22s to 35s apart
                // Same number within 14 seconds is a duplicate stream broadcast
                if (last.number == current.number && timeDiff < 14000) {
                    continue
                }
            }

            seenIds.add(current.id)
            lastAcceptedRound = current
            accepted.add(current)
        }

        return accepted
    }
}
