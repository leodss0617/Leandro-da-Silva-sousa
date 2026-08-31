package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.AppDatabase
import com.example.data.repository.DoubleRepository
import com.example.engine.*
import com.example.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.roundToInt

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = DoubleRepository(AppDatabase.getDatabase(application))
    private val audioAnnouncer = AudioAnnouncer(application)

    private val _currentTab = MutableStateFlow(ScreenTab.HOME)
    val currentTab: StateFlow<ScreenTab> = _currentTab.asStateFlow()

    val rounds: StateFlow<List<Round>> = repository.roundsFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val signals: StateFlow<List<SignalRecord>> = repository.signalsFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    private val _preferences = MutableStateFlow(AppPreferences())
    val preferences: StateFlow<AppPreferences> = _preferences.asStateFlow()

    private val _brainState = MutableStateFlow(BrainState())
    val brainState: StateFlow<BrainState> = _brainState.asStateFlow()

    private val _megaState = MutableStateFlow(
        MegaTroiaState(
            targetProfit = 5.0,
            firstBlack = 2.5,
            bankroll = 1100.0,
            maxEntries = 6,
            currentEntry = 1,
            enabled = false,
            rows = MegaTroiaCalculator.calcMegaTroiaRows(5.0, 2.5, 6)
        )
    )
    val megaState: StateFlow<MegaTroiaState> = _megaState.asStateFlow()

    private val _learnState = MutableStateFlow(LearnState())
    val learnState: StateFlow<LearnState> = _learnState.asStateFlow()

    private val _bankroll = MutableStateFlow(1100.0)
    val bankroll: StateFlow<Double> = _bankroll.asStateFlow()

    private val _dayWins = MutableStateFlow(0)
    val dayWins: StateFlow<Int> = _dayWins.asStateFlow()

    private val _dayLosses = MutableStateFlow(0)
    val dayLosses: StateFlow<Int> = _dayLosses.asStateFlow()

    private val _dayPL = MutableStateFlow(0.0)
    val dayPL: StateFlow<Double> = _dayPL.asStateFlow()

    private val _prediction = MutableStateFlow<PredictionResult?>(null)
    val prediction: StateFlow<PredictionResult?> = _prediction.asStateFlow()

    private val _collectorState = MutableStateFlow(CollectorState())
    val collectorState: StateFlow<CollectorState> = _collectorState.asStateFlow()

    private val _isCollectorModalOpen = MutableStateFlow(false)
    val isCollectorModalOpen: StateFlow<Boolean> = _isCollectorModalOpen.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    private val _isTargetBannerDismissed = MutableStateFlow(false)
    val isTargetBannerDismissed: StateFlow<Boolean> = _isTargetBannerDismissed.asStateFlow()

    private var hasAnnounced80Percent = false
    private var hasAnnouncedTargetHit = false
    private var lastProcessedRoundId: String? = null

    private lateinit var collectorService: BlazeCollectorService

    init {
        initCollector()
        loadInitialData()
    }

    private fun initCollector() {
        collectorService = BlazeCollectorService(
            onNewRoundsReceived = { newRounds ->
                viewModelScope.launch {
                    repository.insertRounds(newRounds)
                }
            },
            onStateUpdated = { newState ->
                _collectorState.value = newState
            }
        )
    }

    private fun loadInitialData() {
        viewModelScope.launch {
            val prefs = repository.loadPreferences()
            _preferences.value = prefs

            val brain = repository.loadBrain()
            _brainState.value = brain

            val mega = repository.loadMega()
            val rows = MegaTroiaCalculator.calcMegaTroiaRows(mega.targetProfit, mega.firstBlack, mega.maxEntries)
            _megaState.value = mega.copy(rows = rows)

            val learn = repository.loadLearn()
            _learnState.value = learn

            val bankrollSnap = repository.loadBankrollData()
            _bankroll.value = bankrollSnap.bankroll
            _dayWins.value = bankrollSnap.dayWins
            _dayLosses.value = bankrollSnap.dayLosses
            _dayPL.value = bankrollSnap.dayPL

            repository.seedInitialRoundsIfEmpty()

            if (prefs.collectorShouldRun) {
                collectorService.start(prefs.collectorMode, prefs.collectorMirror)
            }

            // Observe rounds and update prediction / brain state
            rounds.collect { list ->
                if (list.isNotEmpty()) {
                    val pred = PredictionEngine.predict(list, _preferences.value, _learnState.value)
                    _prediction.value = pred

                    val latest = list.last()
                    if (latest.id != lastProcessedRoundId) {
                        lastProcessedRoundId = latest.id
                        processNewRound(latest, pred)
                    }
                }
            }
        }
    }

    private fun processNewRound(round: Round, pred: PredictionResult) {
        val currentBrain = _brainState.value
        val prefs = _preferences.value

        // Check if brain was waiting for result
        if (currentBrain.state == "waiting" || currentBrain.state == "in_gale") {
            val targetColor = currentBrain.currentPredColor
            if (targetColor != null) {
                val isWin = round.color == targetColor || round.color == DoubleColor.WHITE
                val entryBet = currentBrain.entryAmount
                val mult = if (prefs.brainAutoMultiplier) {
                    val vol = PredictionEngine.calculateDynamicGaleMultiplier(
                        _bankroll.value,
                        prefs.betAmount,
                        _dayPL.value,
                        _dayWins.value,
                        _dayLosses.value,
                        prefs.brainGaleMultiplier,
                        prefs.bankrollMode
                    )
                    vol.multiplier
                } else prefs.brainGaleMultiplier

                if (isWin) {
                    // WIN
                    val profit = if (round.color == DoubleColor.WHITE) entryBet * 13.0 else entryBet
                    val newPL = _dayPL.value + profit
                    val newWins = _dayWins.value + 1
                    val newBankroll = _bankroll.value + profit

                    _dayPL.value = newPL
                    _dayWins.value = newWins
                    _bankroll.value = newBankroll

                    val signalRecord = SignalRecord(
                        color = targetColor,
                        confidence = pred.confidence,
                        outcome = "win",
                        gale = currentBrain.galeLevel,
                        pl = profit,
                        timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
                    )
                    viewModelScope.launch {
                        repository.insertSignal(signalRecord)
                        repository.saveBankrollData(newBankroll, newWins, _dayLosses.value, newPL)
                    }

                    audioAnnouncer.playWinSound(prefs.soundEnabled)
                    audioAnnouncer.speak("Green no ${targetColor.ptName}!", prefs.voiceEnabled)

                    val nextState = if (prefs.brainAutoContinue) "waiting" else "idle"
                    val nextPredColor = if (pred.action == PredictionAction.ENTER) pred.color else null
                    updateBrain(
                        currentBrain.copy(
                            state = nextState,
                            galeLevel = 0,
                            lastOutcome = "WIN",
                            cycles = currentBrain.cycles + 1,
                            currentPredColor = nextPredColor,
                            entryAmount = prefs.betAmount
                        )
                    )
                    checkDailyTargetGoal(newPL)
                } else {
                    // LOSS on this step -> check Gale
                    val nextGale = currentBrain.galeLevel + 1
                    if (nextGale <= prefs.brainMaxGales && prefs.brainAlwaysGale) {
                        // Advance to next Gale
                        val nextBet = entryBet * mult
                        _bankroll.value = _bankroll.value - entryBet
                        _dayPL.value = _dayPL.value - entryBet

                        audioAnnouncer.playLossSound(prefs.soundEnabled)
                        audioAnnouncer.speak("Gale $nextGale no ${targetColor.ptName}", prefs.voiceEnabled)

                        updateBrain(
                            currentBrain.copy(
                                state = "in_gale",
                                galeLevel = nextGale,
                                entryAmount = nextBet
                            )
                        )
                    } else {
                        // FULL LOSS of cycle
                        val lossAmount = entryBet
                        val newPL = _dayPL.value - lossAmount
                        val newLosses = _dayLosses.value + 1
                        val newBankroll = _bankroll.value - lossAmount

                        _dayPL.value = newPL
                        _dayLosses.value = newLosses
                        _bankroll.value = newBankroll

                        val signalRecord = SignalRecord(
                            color = targetColor,
                            confidence = pred.confidence,
                            outcome = "loss",
                            gale = currentBrain.galeLevel,
                            pl = -lossAmount,
                            timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
                        )
                        viewModelScope.launch {
                            repository.insertSignal(signalRecord)
                            repository.saveBankrollData(newBankroll, _dayWins.value, newLosses, newPL)
                        }

                        audioAnnouncer.playLossSound(prefs.soundEnabled)
                        audioAnnouncer.speak("Red confirmado no ciclo.", prefs.voiceEnabled)

                        val nextState = if (prefs.brainAutoContinue) "waiting" else "idle"
                        val nextPredColor = if (pred.action == PredictionAction.ENTER) pred.color else null
                        updateBrain(
                            currentBrain.copy(
                                state = nextState,
                                galeLevel = 0,
                                lastOutcome = "LOSS",
                                cycles = currentBrain.cycles + 1,
                                currentPredColor = nextPredColor,
                                entryAmount = prefs.betAmount
                            )
                        )
                    }
                }
            }
        }
    }

    private fun checkDailyTargetGoal(currentPL: Double) {
        val prefs = _preferences.value
        if (!prefs.dailyProfitTargetEnabled || prefs.dailyProfitTarget <= 0) return

        val target = prefs.dailyProfitTarget
        val pct = (currentPL / target) * 100.0

        if (pct >= 80.0 && pct < 100.0 && !hasAnnounced80Percent && prefs.dailyProfitTargetAlert80Enabled) {
            hasAnnounced80Percent = true
            audioAnnouncer.playTarget80PercentAlert(prefs.soundEnabled, prefs.voiceEnabled)
            showToast("Meta em 80%! Atenção para proteção de lucro.")
        } else if (pct >= 100.0 && !hasAnnouncedTargetHit) {
            hasAnnouncedTargetHit = true
            audioAnnouncer.playTargetHitAlert(prefs.soundEnabled, prefs.voiceEnabled)
            showToast("🎉 META DIÁRIA ATINGIDA COM SUCESSO!")
        }
    }

    fun setTab(tab: ScreenTab) {
        _currentTab.value = tab
    }

    fun updatePreferences(newPrefs: AppPreferences) {
        _preferences.value = newPrefs
        viewModelScope.launch {
            repository.savePreferences(newPrefs)
            if (newPrefs.collectorShouldRun) {
                collectorService.start(newPrefs.collectorMode, newPrefs.collectorMirror)
            } else {
                collectorService.stop()
            }
        }
        recalculatePrediction()
    }

    fun updateBrain(newBrain: BrainState) {
        _brainState.value = newBrain
        viewModelScope.launch {
            repository.saveBrain(newBrain)
        }
    }

    fun toggleBrainEnabled(enabled: Boolean) {
        val prefs = _preferences.value.copy(brainEnabled = enabled)
        updatePreferences(prefs)
        val curBrain = _brainState.value
        val nextState = if (enabled) {
            val pred = _prediction.value
            val targetColor = if (pred?.action == PredictionAction.ENTER) pred.color else null
            curBrain.copy(state = "waiting", currentPredColor = targetColor, entryAmount = prefs.betAmount)
        } else {
            curBrain.copy(state = "idle", galeLevel = 0)
        }
        updateBrain(nextState)
    }

    fun updateMegaTroia(targetProfit: Double, firstBlack: Double, maxEntries: Int) {
        val rows = MegaTroiaCalculator.calcMegaTroiaRows(targetProfit, firstBlack, maxEntries)
        val next = _megaState.value.copy(
            targetProfit = targetProfit,
            firstBlack = firstBlack,
            maxEntries = maxEntries,
            rows = rows
        )
        _megaState.value = next
        viewModelScope.launch {
            repository.saveMega(next)
        }
    }

    fun setMegaEntry(entry: Int) {
        val next = _megaState.value.copy(currentEntry = entry)
        _megaState.value = next
        viewModelScope.launch {
            repository.saveMega(next)
        }
    }

    fun toggleMegaEnabled(enabled: Boolean) {
        val next = _megaState.value.copy(enabled = enabled)
        _megaState.value = next
        viewModelScope.launch {
            repository.saveMega(next)
        }
    }

    fun updateBankroll(newVal: Double) {
        _bankroll.value = newVal
        viewModelScope.launch {
            repository.saveBankrollData(newVal, _dayWins.value, _dayLosses.value, _dayPL.value)
        }
    }

    fun resetDailyStats() {
        _dayWins.value = 0
        _dayLosses.value = 0
        _dayPL.value = 0.0
        hasAnnounced80Percent = false
        hasAnnouncedTargetHit = false
        _isTargetBannerDismissed.value = false
        viewModelScope.launch {
            repository.saveBankrollData(_bankroll.value, 0, 0, 0.0)
            repository.clearSignals()
        }
        showToast("Estatísticas do dia resetadas")
    }

    fun addManualRound(number: Int) {
        if (number !in 0..14) return
        val color = DoubleColor.fromNumber(number)
        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val round = Round(
            id = "manual_${System.currentTimeMillis()}_$number",
            number = number,
            color = color,
            createdAt = isoFormat.format(Date()),
            source = "manual"
        )
        viewModelScope.launch {
            repository.insertRound(round)
        }
        showToast("Número #$number (${color.ptName}) inserido")
    }

    fun clearAllRounds() {
        viewModelScope.launch {
            repository.clearRounds()
            repository.seedInitialRoundsIfEmpty()
        }
        showToast("Histórico de rodadas restaurado")
    }

    fun syncHistoryNow() {
        viewModelScope.launch {
            collectorService.fetchRecentRounds()
            showToast("Sincronizando espelho...")
        }
    }

    fun triggerTestSignal() {
        val pred = _prediction.value ?: return
        audioAnnouncer.playSignalSound(_preferences.value.soundEnabled, pred.color)
        audioAnnouncer.speak("Sinal IA: Entrada no ${pred.color.ptName} com ${(pred.confidence * 100).roundToInt()}% de confiança", _preferences.value.voiceEnabled)
        showToast("Sinal de teste executado: ${pred.color.ptName}")
    }

    fun setCollectorModalOpen(open: Boolean) {
        _isCollectorModalOpen.value = open
    }

    fun dismissTargetBanner() {
        _isTargetBannerDismissed.value = true
    }

    fun showToast(msg: String) {
        _toastMessage.value = msg
    }

    fun clearToast() {
        _toastMessage.value = null
    }

    private fun recalculatePrediction() {
        val list = rounds.value
        if (list.isNotEmpty()) {
            _prediction.value = PredictionEngine.predict(list, _preferences.value, _learnState.value)
        }
    }

    override fun onCleared() {
        super.onCleared()
        collectorService.stop()
        audioAnnouncer.release()
    }
}
