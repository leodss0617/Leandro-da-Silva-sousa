package com.example.engine

import com.example.model.*
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

object PredictionEngine {
    val COLORS = listOf(DoubleColor.RED, DoubleColor.BLACK, DoubleColor.WHITE)

    val BASE_RATES = mapOf(
        DoubleColor.RED to 7.0 / 15.0,
        DoubleColor.BLACK to 7.0 / 15.0,
        DoubleColor.WHITE to 1.0 / 15.0
    )

    private val isoDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    fun parseDate(dateStr: String): Date {
        return try {
            val clean = dateStr.replace("Z", "").substringBefore(".")
            isoDateFormat.parse(clean) ?: Date()
        } catch (e: Exception) {
            Date()
        }
    }

    fun getRoundMeta(r: Round): WhiteMeta {
        val d = parseDate(r.createdAt)
        val cal = Calendar.getInstance().apply { time = d }
        val minute = cal.get(Calendar.MINUTE)
        return WhiteMeta(
            index = 0,
            number = r.number,
            minute = minute,
            terminal = minute % 10
        )
    }

    fun analyzeWhiteIntervals(rounds: List<Round>): IntervalsInfo {
        val whites = mutableListOf<WhiteMeta>()
        rounds.forEachIndexed { i, r ->
            if (r.color == DoubleColor.WHITE) {
                val meta = getRoundMeta(r).copy(index = i)
                whites.add(meta)
            }
        }

        if (whites.size < 2) {
            return IntervalsInfo(
                avg = 15.0,
                current = rounds.size,
                max = 0,
                list = emptyList(),
                whites = whites
            )
        }

        val intervals = mutableListOf<Int>()
        for (i in 1 until whites.size) {
            intervals.add(whites[i].index - whites[i - 1].index)
        }

        val avg = intervals.sum().toDouble() / intervals.size
        val maxInterval = intervals.maxOrNull() ?: 0
        val lastWhiteIdx = whites.lastOrNull()?.index ?: -1
        val current = if (rounds.isNotEmpty() && lastWhiteIdx >= 0) rounds.size - 1 - lastWhiteIdx else rounds.size

        return IntervalsInfo(
            avg = avg,
            current = current,
            max = maxInterval,
            list = intervals.takeLast(20),
            whites = whites
        )
    }

    fun analyzePullers(rounds: List<Round>): List<PullerInfo> {
        val pullers = mutableMapOf<Int, Int>()
        for (i in 1 until rounds.size) {
            if (rounds[i].color == DoubleColor.WHITE) {
                val prev = rounds[i - 1].number
                pullers[prev] = (pullers[prev] ?: 0) + 1
            }
        }
        return pullers.entries
            .sortedByDescending { it.value }
            .take(5)
            .map { PullerInfo(it.key, it.value) }
    }

    fun analyzeHotCold(rounds: List<Round>, window: Int = 100): HotColdInfo {
        val w = rounds.takeLast(window)
        val counts = mutableMapOf<Int, Int>()
        for (n in 0..14) counts[n] = 0
        w.forEach { r ->
            counts[r.number] = (counts[r.number] ?: 0) + 1
        }

        val sorted = counts.entries
            .map { NumberFrequency(it.key, it.value, DoubleColor.fromNumber(it.key)) }
            .sortedByDescending { it.count }

        return HotColdInfo(
            hot = sorted.take(5),
            cold = sorted.takeLast(5).reversed(),
            window = w.size
        )
    }

    fun detectSequences(colors: List<DoubleColor>): List<SequenceSignal> {
        val signals = mutableListOf<SequenceSignal>()
        if (colors.size < 4) return signals

        val last4 = colors.takeLast(4).joinToString("") { it.name.lowercase() }
        val last3 = colors.takeLast(3).joinToString("") { it.name.lowercase() }

        if (last4 == "redblackredblack" || last4 == "blackredblackred") {
            val last = colors.last()
            val suggest = if (last == DoubleColor.RED) DoubleColor.BLACK else DoubleColor.RED
            signals.add(SequenceSignal("1x1 Alternando", suggest, 0.12))
        }

        if (last4 == "redredblackblack" || last4 == "blackblackredred") {
            signals.add(SequenceSignal("2x2 Dobradinha", colors.last(), 0.10))
        }

        if (colors.last() == DoubleColor.WHITE) {
            signals.add(SequenceSignal("Pós-Branco", DoubleColor.SKIP, 0.05))
        }

        if (last3 == "redblackred") signals.add(SequenceSignal("VPV", DoubleColor.BLACK, 0.08))
        if (last3 == "blackredblack") signals.add(SequenceSignal("PVP", DoubleColor.RED, 0.08))

        return signals
    }

    fun minutagemSignal(rounds: List<Round>): MinutagemInfo? {
        val whites = rounds.filter { it.color == DoubleColor.WHITE }
        if (whites.isEmpty() || rounds.size < 2) return null
        val lastW = whites.last()
        val idx = rounds.indexOf(lastW)
        if (idx < 0 || idx >= rounds.size - 1) return null
        val after = rounds[idx + 1]
        val wm = getRoundMeta(lastW)
        val targetTerminal = (wm.terminal + (after.number % 10)) % 10
        val cal = Calendar.getInstance()
        val currentTerminal = cal.get(Calendar.MINUTE) % 10
        val mirror = (wm.terminal + 5) % 10

        return MinutagemInfo(
            whiteMinute = wm.minute,
            afterNumber = after.number,
            targetTerminal = targetTerminal,
            mirrorTerminal = mirror,
            currentTerminal = currentTerminal,
            nearTarget = currentTerminal == targetTerminal || currentTerminal == mirror
        )
    }

    fun deepContext(rounds: List<Round>): DeepInsights {
        if (rounds.isEmpty()) return DeepInsights(reasons = listOf("Sem dados suficientes"), boost = emptyMap())
        val intervals = analyzeWhiteIntervals(rounds)
        val pullers = analyzePullers(rounds)
        val hc = analyzeHotCold(rounds)
        val seqs = detectSequences(rounds.map { it.color })
        val minu = minutagemSignal(rounds)
        val reasons = mutableListOf<String>()
        val boost = mutableMapOf(DoubleColor.RED to 0.0, DoubleColor.BLACK to 0.0, DoubleColor.WHITE to 0.0)

        if (intervals.current >= intervals.avg * 1.3) {
            boost[DoubleColor.WHITE] = (boost[DoubleColor.WHITE] ?: 0.0) + 0.04
            reasons.add("Intervalo branco atual ${intervals.current} > média ${intervals.avg.roundToInt()}")
        }
        if (intervals.current >= 25) {
            boost[DoubleColor.WHITE] = (boost[DoubleColor.WHITE] ?: 0.0) + 0.06
            reasons.add("Longo sem branco (${intervals.current} rodadas)")
        }

        seqs.forEach { s ->
            if (s.suggest != DoubleColor.SKIP) {
                boost[s.suggest] = (boost[s.suggest] ?: 0.0) + s.strength
                reasons.add("Padrão ${s.name} → ${s.suggest.ptName}")
            }
        }

        if (hc.hot.isNotEmpty()) {
            val top = hc.hot[0]
            boost[top.color] = (boost[top.color] ?: 0.0) + 0.03
            reasons.add("Número Quente #${top.number} (${top.count}x/${hc.window})")
        }

        if (minu != null && minu.nearTarget) {
            boost[DoubleColor.WHITE] = (boost[DoubleColor.WHITE] ?: 0.0) + 0.05
            reasons.add("Minutagem: terminal ${minu.currentTerminal} próximo do alvo ${minu.targetTerminal}")
        }

        if (pullers.isNotEmpty()) {
            reasons.add("Top puxadores: ${pullers.take(3).joinToString(", ") { "#${it.number}" }}")
        }

        return DeepInsights(
            reasons = reasons,
            boost = boost,
            intervals = intervals,
            pullers = pullers,
            hc = hc,
            seqs = seqs,
            minu = minu
        )
    }

    fun freqMulti(rounds: List<DoubleColor>): Map<DoubleColor, Double> {
        if (rounds.isEmpty()) return BASE_RATES
        val horizons = listOf(
            Pair(rounds.takeLast(30), 0.38),
            Pair(rounds.takeLast(80), 0.22),
            Pair(rounds.takeLast(200), 0.18),
            Pair(rounds.takeLast(1000), 0.12),
            Pair(rounds, 0.10)
        )

        val out = mutableMapOf(DoubleColor.RED to 0.0, DoubleColor.BLACK to 0.0, DoubleColor.WHITE to 0.0)
        var tw = 0.0
        for ((w, weight) in horizons) {
            if (w.size < 5) continue
            val counts = mutableMapOf(DoubleColor.RED to 0, DoubleColor.BLACK to 0, DoubleColor.WHITE to 0)
            w.forEach { counts[it] = (counts[it] ?: 0) + 1 }
            val t = w.size.toDouble()
            COLORS.forEach { c ->
                out[c] = (out[c] ?: 0.0) + weight * ((counts[c] ?: 0) / t)
            }
            tw += weight
        }

        if (tw == 0.0) return BASE_RATES
        COLORS.forEach { c -> out[c] = (out[c] ?: 0.0) / tw }
        val n = rounds.size
        val shrink = max(0.0, 1.0 - n / 60.0) * 0.5
        COLORS.forEach { c ->
            out[c] = (1.0 - shrink) * (out[c] ?: 0.0) + shrink * (BASE_RATES[c] ?: 0.0)
        }
        val s = COLORS.sumOf { out[it] ?: 0.0 }.let { if (it <= 0) 1.0 else it }
        COLORS.forEach { c -> out[c] = (out[c] ?: 0.0) / s }
        return out
    }

    fun markov(rounds: List<DoubleColor>): Map<DoubleColor, Double> {
        if (rounds.size < 2) return BASE_RATES
        val last1 = rounds.last()
        val t1 = mutableMapOf(DoubleColor.RED to 0, DoubleColor.BLACK to 0, DoubleColor.WHITE to 0)
        for (i in 0 until rounds.size - 1) {
            if (rounds[i] == last1) {
                val next = rounds[i + 1]
                t1[next] = (t1[next] ?: 0) + 1
            }
        }
        val n1 = (t1[DoubleColor.RED] ?: 0) + (t1[DoubleColor.BLACK] ?: 0) + (t1[DoubleColor.WHITE] ?: 0)
        val m1 = if (n1 >= 5) {
            mapOf(
                DoubleColor.RED to (t1[DoubleColor.RED] ?: 0).toDouble() / n1,
                DoubleColor.BLACK to (t1[DoubleColor.BLACK] ?: 0).toDouble() / n1,
                DoubleColor.WHITE to (t1[DoubleColor.WHITE] ?: 0).toDouble() / n1
            )
        } else BASE_RATES

        var m2 = BASE_RATES
        if (rounds.size >= 3) {
            val last2 = listOf(rounds[rounds.size - 2], rounds[rounds.size - 1])
            val t2 = mutableMapOf(DoubleColor.RED to 0, DoubleColor.BLACK to 0, DoubleColor.WHITE to 0)
            for (i in 0 until rounds.size - 2) {
                if (rounds[i] == last2[0] && rounds[i + 1] == last2[1]) {
                    val next = rounds[i + 2]
                    t2[next] = (t2[next] ?: 0) + 1
                }
            }
            val n2 = (t2[DoubleColor.RED] ?: 0) + (t2[DoubleColor.BLACK] ?: 0) + (t2[DoubleColor.WHITE] ?: 0)
            if (n2 >= 5) {
                m2 = mapOf(
                    DoubleColor.RED to (t2[DoubleColor.RED] ?: 0).toDouble() / n2,
                    DoubleColor.BLACK to (t2[DoubleColor.BLACK] ?: 0).toDouble() / n2,
                    DoubleColor.WHITE to (t2[DoubleColor.WHITE] ?: 0).toDouble() / n2
                )
            }
        }

        val w2 = if (rounds.size >= 40) 0.45 else 0.30
        val w1 = 1.0 - w2
        val out = mutableMapOf<DoubleColor, Double>()
        COLORS.forEach { c ->
            out[c] = w1 * (m1[c] ?: 0.0) + w2 * (m2[c] ?: 0.0)
        }
        val s = COLORS.sumOf { out[it] ?: 0.0 }.let { if (it <= 0) 1.0 else it }
        COLORS.forEach { c -> out[c] = (out[c] ?: 0.0) / s }
        return out
    }

    fun streakPressure(rounds: List<DoubleColor>): Map<DoubleColor, Double> {
        if (rounds.isEmpty()) return mapOf(DoubleColor.RED to 1.0/3, DoubleColor.BLACK to 1.0/3, DoubleColor.WHITE to 1.0/3)
        val last = rounds.last()
        var streak = 0
        for (i in rounds.indices.reversed()) {
            if (rounds[i] == last) streak++ else break
        }

        val out = BASE_RATES.toMutableMap()
        if (last == DoubleColor.WHITE) {
            out[DoubleColor.RED] = (out[DoubleColor.RED] ?: 0.0) + 0.02
            out[DoubleColor.BLACK] = (out[DoubleColor.BLACK] ?: 0.0) + 0.02
            out[DoubleColor.WHITE] = (out[DoubleColor.WHITE] ?: 0.0) - 0.04
            val s = max(0.0, out[DoubleColor.RED] ?: 0.0) + max(0.0, out[DoubleColor.BLACK] ?: 0.0) + max(0.0, out[DoubleColor.WHITE] ?: 0.0)
            val denom = if (s <= 0) 1.0 else s
            return mapOf(
                DoubleColor.RED to max(0.0, out[DoubleColor.RED] ?: 0.0) / denom,
                DoubleColor.BLACK to max(0.0, out[DoubleColor.BLACK] ?: 0.0) / denom,
                DoubleColor.WHITE to max(0.0, out[DoubleColor.WHITE] ?: 0.0) / denom
            )
        }

        if (streak < 3) return out
        val bonus = min(0.14, 0.05 + 0.03 * (streak - 3))
        val opposite = if (last == DoubleColor.RED) DoubleColor.BLACK else DoubleColor.RED
        out[opposite] = (out[opposite] ?: 0.0) + bonus
        out[last] = max(0.0, (out[last] ?: 0.0) - bonus * 0.7)
        val s = COLORS.sumOf { out[it] ?: 0.0 }.let { if (it <= 0) 1.0 else it }
        COLORS.forEach { c -> out[c] = (out[c] ?: 0.0) / s }
        return out
    }

    fun whiteCycle(rounds: List<DoubleColor>): Map<DoubleColor, Double> {
        if (rounds.isEmpty()) return BASE_RATES
        var since = 0
        for (i in rounds.indices.reversed()) {
            if (rounds[i] == DoubleColor.WHITE) break
            since++
        }
        val out = BASE_RATES.toMutableMap()
        var boost = 0.0
        if (since >= 30) boost = min(0.18, 0.10 + (since - 30) * 0.005)
        else if (since >= 18) boost = (since - 18) * 0.008
        else if (since >= 10) boost = (since - 10) * 0.003

        out[DoubleColor.WHITE] = max(0.005, (out[DoubleColor.WHITE] ?: 0.0) + boost)
        val left = 1.0 - (out[DoubleColor.WHITE] ?: 0.0)
        out[DoubleColor.RED] = left / 2.0
        out[DoubleColor.BLACK] = left - (out[DoubleColor.RED] ?: 0.0)
        val s = COLORS.sumOf { out[it] ?: 0.0 }.let { if (it <= 0) 1.0 else it }
        COLORS.forEach { c -> out[c] = (out[c] ?: 0.0) / s }
        return out
    }

    fun patternMatch(rounds: List<DoubleColor>, window: Int = 4): Map<DoubleColor, Double> {
        if (rounds.size < window + 5) return BASE_RATES
        val seq = rounds.takeLast(window)
        val after = mutableMapOf(DoubleColor.RED to 0, DoubleColor.BLACK to 0, DoubleColor.WHITE to 0)
        var hits = 0

        for (i in 0..rounds.size - window - 1) {
            var match = true
            for (j in 0 until window) {
                if (rounds[i + j] != seq[j]) {
                    match = false
                    break
                }
            }
            if (match) {
                val next = rounds[i + window]
                after[next] = (after[next] ?: 0) + 1
                hits++
            }
        }

        if (hits < 3) return BASE_RATES
        val s = (after[DoubleColor.RED] ?: 0) + (after[DoubleColor.BLACK] ?: 0) + (after[DoubleColor.WHITE] ?: 0)
        val denom = if (s <= 0) 1.0 else s.toDouble()
        return mapOf(
            DoubleColor.RED to (after[DoubleColor.RED] ?: 0) / denom,
            DoubleColor.BLACK to (after[DoubleColor.BLACK] ?: 0) / denom,
            DoubleColor.WHITE to (after[DoubleColor.WHITE] ?: 0) / denom
        )
    }

    fun sequenceMemoryPredict(colors: List<DoubleColor>, learn: LearnState): Map<DoubleColor, Double> {
        val out = mutableMapOf(DoubleColor.RED to 0.0, DoubleColor.BLACK to 0.0, DoubleColor.WHITE to 0.0)
        var tw = 0.0

        for (n in 5 downTo 2) {
            if (colors.size < n) continue
            val key = colors.takeLast(n).joinToString(",") { it.name.lowercase() }
            val mem = learn.sequenceMemory[key] ?: continue
            val rCount = mem["red"] ?: 0
            val bCount = mem["black"] ?: 0
            val wCount = mem["white"] ?: 0
            val t = rCount + bCount + wCount
            if (t < 2) continue
            val w = n * 0.15 * min(1.0, t / 5.0)
            out[DoubleColor.RED] = (out[DoubleColor.RED] ?: 0.0) + w * (rCount.toDouble() / t)
            out[DoubleColor.BLACK] = (out[DoubleColor.BLACK] ?: 0.0) + w * (bCount.toDouble() / t)
            out[DoubleColor.WHITE] = (out[DoubleColor.WHITE] ?: 0.0) + w * (wCount.toDouble() / t)
            tw += w
        }

        if (tw < 0.01) return BASE_RATES
        COLORS.forEach { c -> out[c] = (out[c] ?: 0.0) / tw }
        return out
    }

    fun numberAfterPredict(rounds: List<Round>, learn: LearnState): Map<DoubleColor, Double> {
        if (rounds.isEmpty()) return BASE_RATES
        val last = rounds.last()
        val mem = learn.numberAfter[last.number.toString()] ?: return BASE_RATES
        val rCount = mem["red"] ?: 0
        val bCount = mem["black"] ?: 0
        val wCount = mem["white"] ?: 0
        val t = rCount + bCount + wCount
        if (t < 3) return BASE_RATES
        return mapOf(
            DoubleColor.RED to rCount.toDouble() / t,
            DoubleColor.BLACK to bCount.toDouble() / t,
            DoubleColor.WHITE to wCount.toDouble() / t
        )
    }

    fun hourBiasPredict(learn: LearnState): Map<DoubleColor, Double> {
        val h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val mem = learn.hourBias[h] ?: return BASE_RATES
        if (mem.n < 10) return BASE_RATES
        return mapOf(
            DoubleColor.RED to mem.red.toDouble() / mem.n,
            DoubleColor.BLACK to mem.black.toDouble() / mem.n,
            DoubleColor.WHITE to mem.white.toDouble() / mem.n
        )
    }

    fun evolveWeights(learn: LearnState): LearnState {
        val hits = learn.signalHits
        val weights = learn.signalWeights.toMutableMap()
        var changed = false

        weights.keys.forEach { name ->
            val h = hits[name]
            if (h != null && h.total >= 8) {
                val rate = h.hits.toDouble() / h.total
                val target = 0.05 + rate * 0.25
                val cur = weights[name] ?: 0.1
                weights[name] = cur * 0.85 + target * 0.15
                changed = true
            }
        }

        if (changed) {
            val sum = weights.values.sum().let { if (it <= 0) 1.0 else it }
            weights.keys.forEach { n ->
                weights[n] = (weights[n] ?: 0.1) / sum
            }
            return learn.copy(signalWeights = weights, lastEvolveAt = System.currentTimeMillis())
        }

        return learn
    }

    fun predict(
        rounds: List<Round>,
        prefs: AppPreferences,
        learn: LearnState
    ): PredictionResult {
        val roundsColors = rounds.map { it.color }
        val W = learn.signalWeights
        val signals = mutableListOf<Map<DoubleColor, Double>>()
        val weights = mutableListOf<Double>()
        val votes = mutableMapOf<String, DoubleColor>()

        fun addSignal(name: String, dist: Map<DoubleColor, Double>, enabled: Boolean) {
            if (!enabled) return
            val w = W[name] ?: 0.1
            if (w <= 0.001) return
            signals.add(dist)
            weights.add(w)
            val top = COLORS.maxByOrNull { dist[it] ?: 0.0 } ?: DoubleColor.RED
            votes[name] = top
        }

        if (prefs.useFrequency) addSignal("frequency", freqMulti(roundsColors), true)
        if (prefs.useMarkov) addSignal("markov", markov(roundsColors), true)
        if (prefs.useStreak) addSignal("streak", streakPressure(roundsColors), true)
        if (prefs.useWhiteCycle) addSignal("white_cycle", whiteCycle(roundsColors), true)
        if (prefs.usePattern) addSignal("pattern", patternMatch(roundsColors), true)

        addSignal("sequence_mem", sequenceMemoryPredict(roundsColors, learn), true)
        addSignal("number_after", numberAfterPredict(rounds, learn), true)
        addSignal("hour_bias", hourBiasPredict(learn), true)

        val deep = deepContext(rounds)
        if (deep.boost.isNotEmpty()) {
            val base = BASE_RATES.toMutableMap()
            COLORS.forEach { c ->
                base[c] = max(0.01, (base[c] ?: 0.0) + (deep.boost[c] ?: 0.0))
            }
            val s = COLORS.sumOf { base[it] ?: 0.0 }.let { if (it <= 0) 1.0 else it }
            COLORS.forEach { c -> base[c] = (base[c] ?: 0.0) / s }
            addSignal("deep", base, true)
        }

        if (signals.isEmpty()) {
            return PredictionResult(
                color = DoubleColor.SKIP,
                confidence = 0.0,
                probs = BASE_RATES,
                reasons = listOf("Nenhum modelo preditivo ativo"),
                action = PredictionAction.SKIP,
                deep = deep,
                signalVotes = votes
            )
        }

        val tw = weights.sum().let { if (it <= 0) 1.0 else it }
        val probs = mutableMapOf(DoubleColor.RED to 0.0, DoubleColor.BLACK to 0.0, DoubleColor.WHITE to 0.0)
        signals.forEachIndexed { i, sig ->
            COLORS.forEach { c ->
                probs[c] = (probs[c] ?: 0.0) + (weights[i] / tw) * (sig[c] ?: 0.0)
            }
        }

        val s = COLORS.sumOf { probs[it] ?: 0.0 }.let { if (it <= 0) 1.0 else it }
        COLORS.forEach { c -> probs[c] = (probs[c] ?: 0.0) / s }

        val top = COLORS.maxByOrNull { probs[it] ?: 0.0 } ?: DoubleColor.RED
        var agreement = 0
        signals.forEach { sig ->
            val sigTop = COLORS.maxByOrNull { sig[it] ?: 0.0 } ?: DoubleColor.RED
            if (sigTop == top) agreement++
        }

        val agreeRatio = agreement.toDouble() / signals.size
        val dataFactor = min(1.0, roundsColors.size / 80.0)
        val learnFactor = min(1.0, learn.totalLearned / 200.0)
        var confidence = 0.28 + 0.30 * agreeRatio + 0.22 * dataFactor + 0.12 * learnFactor + 0.08 * max(0.0, (probs[top] ?: 0.0) - (BASE_RATES[top] ?: 0.0))

        val cal = learn.confCalibration
        if (cal.size >= 20) {
            val high = cal.filter { it.conf >= 0.6 }
            if (high.size >= 8) {
                val hr = high.sumOf { it.hit }.toDouble() / high.size
                if (hr < 0.4) confidence *= 0.85
                if (hr > 0.55) confidence = min(0.95, confidence * 1.08)
            }
        }
        confidence = max(0.18, min(0.95, confidence))

        val reasons = mutableListOf<String>()
        val topPct = String.format(Locale.US, "%.1f", (probs[top] ?: 0.0) * 100)
        reasons.add("Consenso $agreement/${signals.size} · IA ${top.ptName} $topPct%")

        val topW = learn.signalWeights.entries.maxByOrNull { it.value }
        if (topW != null) {
            reasons.add("Peso líder: ${topW.key} (${(topW.value * 100).roundToInt()}%)")
        }
        if (deep.reasons.isNotEmpty()) {
            reasons.addAll(deep.reasons.take(3))
        }

        if (prefs.whiteOnly) {
            if (top != DoubleColor.WHITE || confidence < prefs.minConfidence) {
                return PredictionResult(
                    color = DoubleColor.SKIP,
                    confidence = confidence,
                    probs = probs,
                    reasons = listOf("Modo Somente Branco ativo: sem entrada clara"),
                    action = PredictionAction.SKIP,
                    deep = deep,
                    signalVotes = votes
                )
            }
        }

        if (prefs.skipLowConf && confidence < prefs.minConfidence) {
            val confPct = (confidence * 100).roundToInt()
            val minPct = (prefs.minConfidence * 100).roundToInt()
            return PredictionResult(
                color = DoubleColor.SKIP,
                confidence = confidence,
                probs = probs,
                reasons = listOf("Confiança baixa ($confPct% < $minPct%)") + reasons,
                action = PredictionAction.SKIP,
                deep = deep,
                signalVotes = votes
            )
        }

        return PredictionResult(
            color = top,
            confidence = confidence,
            probs = probs,
            reasons = reasons,
            action = PredictionAction.ENTER,
            deep = deep,
            signalVotes = votes
        )
    }

    fun calculateDynamicGaleMultiplier(
        bankroll: Double,
        betAmount: Double,
        dayPL: Double,
        dayWins: Int,
        dayLosses: Int,
        baseMultiplier: Double = 2.0,
        bankrollMode: String = "balanced"
    ): VolatilityGaleInfo {
        val baseBet = max(betAmount, 0.5)
        val currentBankroll = max(bankroll, 0.0)
        val coverageRounds = if (baseBet > 0) currentBankroll / baseBet else 100.0

        val totalRounds = dayWins + dayLosses
        val lossRate = if (totalRounds > 0) dayLosses.toDouble() / totalRounds else 0.45

        val drawdown = if (dayPL < 0) -dayPL else 0.0
        val totalEquity = currentBankroll + drawdown
        val drawdownPct = if (totalEquity > 0) (drawdown / totalEquity) * 100.0 else 0.0

        var targetMult = baseMultiplier
        val volatilityLevel: String
        val label: String
        val reason: String

        if (coverageRounds < 15 || drawdownPct > 25 || (totalRounds >= 4 && lossRate > 0.65)) {
            volatilityLevel = "critical"
            targetMult = max(1.5, min(baseMultiplier, 1.6))
            label = "Alta Volatilidade (Proteção de Capital)"
            reason = "Banca sob oscilação alta (Drawdown ${drawdownPct.roundToInt()}% / ${coverageRounds.roundToInt()}x coberturas). Multiplicador reduzido para proteger saldo."
        } else if (coverageRounds < 40 || drawdownPct > 12 || (totalRounds >= 3 && lossRate > 0.5)) {
            volatilityLevel = "high"
            targetMult = max(1.6, min(baseMultiplier, 1.8))
            label = "Volatilidade Elevada"
            reason = "Oscilação moderada detectada. Multiplicador ajustado para 1.8x para diminuir o risco de exposição."
        } else if (coverageRounds > 80 && drawdownPct < 5 && lossRate < 0.4) {
            volatilityLevel = "low"
            val boost = if (bankrollMode == "aggressive") 0.2 else if (bankrollMode == "conservative") 0.0 else 0.1
            targetMult = min(2.3, max(baseMultiplier, 2.0 + boost))
            label = "Baixa Volatilidade (Banca Saudável)"
            reason = "Banca saudável (${coverageRounds.roundToInt()}x coberturas) com baixa oscilação. Recuperação otimizada."
        } else {
            volatilityLevel = "medium"
            targetMult = min(2.1, max(1.8, baseMultiplier))
            label = "Volatilidade Estável"
            reason = "Condições equilibradas. Multiplicador calibrado em ${String.format(Locale.US, "%.1f", targetMult)}x."
        }

        val finalMultiplier = (targetMult * 10.0).roundToInt() / 10.0

        return VolatilityGaleInfo(
            multiplier = finalMultiplier,
            volatilityLevel = volatilityLevel,
            label = label,
            reason = reason,
            bankrollRatio = coverageRounds.roundToInt(),
            drawdownPct = (drawdownPct * 10.0).roundToInt() / 10.0
        )
    }
}
