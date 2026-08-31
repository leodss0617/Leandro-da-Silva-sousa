package com.example.model

import kotlinx.serialization.Serializable

@Serializable
enum class DoubleColor {
    RED,
    BLACK,
    WHITE,
    SKIP;

    val label: String
        get() = when (this) {
            RED -> "VERMELHO"
            BLACK -> "PRETO"
            WHITE -> "BRANCO"
            SKIP -> "AGUARDAR"
        }

    val ptName: String
        get() = when (this) {
            RED -> "Vermelho"
            BLACK -> "Preto"
            WHITE -> "Branco"
            SKIP -> "Aguardar"
        }

    companion object {
        fun fromNumber(n: Int): DoubleColor {
            return when {
                n == 0 -> WHITE
                n in 1..7 -> RED
                n in 8..14 -> BLACK
                else -> BLACK
            }
        }

        fun fromString(s: String): DoubleColor {
            return when (s.lowercase().trim()) {
                "red", "vermelho" -> RED
                "black", "preto" -> BLACK
                "white", "branco" -> WHITE
                else -> SKIP
            }
        }
    }
}

enum class PredictionAction {
    ENTER,
    SKIP
}

@Serializable
data class Round(
    val id: String,
    val externalId: String? = null,
    val number: Int,
    val color: DoubleColor,
    val createdAt: String,
    val source: String = "blaze"
)

@Serializable
data class SignalRecord(
    val id: Long = System.currentTimeMillis(),
    val color: DoubleColor,
    val confidence: Double,
    val outcome: String, // "win" or "loss"
    val gale: Int,
    val pl: Double,
    val timestamp: String
)

@Serializable
data class AppPreferences(
    val brainEnabled: Boolean = false,
    val brainMaxGales: Int = 2,
    val brainGaleMinConfidence: Double = 0.60,
    val brainGaleMultiplier: Double = 2.0,
    val brainAutoMultiplier: Boolean = false,
    val brainAutoContinue: Boolean = true,
    val brainAlwaysGale: Boolean = true,
    val megaTroiaEnabled: Boolean = false,
    val megaTroiaTargetProfit: Double = 5.0,
    val megaTroiaMaxEntries: Int = 6,
    val megaTroiaBankroll: Double = 1100.0,
    val betAmount: Double = 2.5,
    val dailyProfitTarget: Double = 50.0,
    val dailyProfitTargetEnabled: Boolean = true,
    val dailyProfitTargetAlert80Enabled: Boolean = true,
    val dailyProfitTargetAlertSound: String = "fanfare",
    val bankrollMode: String = "balanced", // "conservative" | "balanced" | "aggressive"
    val whiteOnly: Boolean = false,
    val skipLowConf: Boolean = true,
    val minConfidence: Double = 0.55,
    val useFrequency: Boolean = true,
    val useMarkov: Boolean = true,
    val useStreak: Boolean = true,
    val useWhiteCycle: Boolean = true,
    val usePattern: Boolean = true,
    val showBubble: Boolean = true,
    val collectorShouldRun: Boolean = true,
    val collectorMode: String = "auto", // "auto" | "websocket" | "direct_rest" | "simulation"
    val collectorMirror: String = "Blaze Brasil (bet.br)",
    val keepBackground: Boolean = true,
    val soundEnabled: Boolean = true,
    val voiceEnabled: Boolean = true,
    val soundVolume: Float = 0.8f
)

@Serializable
data class BrainState(
    val state: String = "idle", // "idle" | "waiting" | "in_gale" | "done"
    val galeLevel: Int = 0,
    val lastOutcome: String? = null, // "WIN" | "LOSS"
    val cycles: Int = 0,
    val currentPredColor: DoubleColor? = null,
    val entryAmount: Double = 2.5
)

@Serializable
data class LearnState(
    val signalWeights: Map<String, Double> = mapOf(
        "frequency" to 0.22,
        "markov" to 0.20,
        "streak" to 0.10,
        "white_cycle" to 0.14,
        "pattern" to 0.12,
        "deep" to 0.12,
        "sequence_mem" to 0.10
    ),
    val signalHits: Map<String, HitStats> = emptyMap(),
    val sequenceMemory: Map<String, Map<String, Int>> = emptyMap(),
    val numberAfter: Map<String, Map<String, Int>> = emptyMap(),
    val hourBias: Map<Int, HourBiasStats> = emptyMap(),
    val confCalibration: List<CalibrationPoint> = emptyList(),
    val totalLearned: Int = 0,
    val lastEvolveAt: Long = 0L
)

@Serializable
data class HitStats(val hits: Int, val total: Int)

@Serializable
data class HourBiasStats(val red: Int, val black: Int, val white: Int, val n: Int)

@Serializable
data class CalibrationPoint(val conf: Double, val hit: Int, val color: String, val actual: String)

@Serializable
data class MegaTroiaRow(
    val entry: Int,
    val sPrev: Double,
    val black: Double,
    val white: Double,
    val total: Double,
    val sAfter: Double
)

@Serializable
data class MegaTroiaState(
    val targetProfit: Double = 5.0,
    val firstBlack: Double = 2.5,
    val bankroll: Double = 1100.0,
    val maxEntries: Int = 6,
    val currentEntry: Int = 1,
    val enabled: Boolean = false,
    val rows: List<MegaTroiaRow> = emptyList()
)

data class IntervalsInfo(
    val avg: Double,
    val current: Int,
    val max: Int,
    val list: List<Int>,
    val whites: List<WhiteMeta>
)

data class WhiteMeta(val index: Int, val number: Int, val minute: Int, val terminal: Int)

data class PullerInfo(val number: Int, val count: Int)

data class NumberFrequency(val number: Int, val count: Int, val color: DoubleColor)

data class HotColdInfo(
    val hot: List<NumberFrequency>,
    val cold: List<NumberFrequency>,
    val window: Int
)

data class SequenceSignal(
    val name: String,
    val suggest: DoubleColor,
    val strength: Double
)

data class MinutagemInfo(
    val whiteMinute: Int,
    val afterNumber: Int,
    val targetTerminal: Int,
    val mirrorTerminal: Int,
    val currentTerminal: Int,
    val nearTarget: Boolean
)

data class DeepInsights(
    val reasons: List<String> = emptyList(),
    val boost: Map<DoubleColor, Double> = emptyMap(),
    val intervals: IntervalsInfo? = null,
    val pullers: List<PullerInfo> = emptyList(),
    val hc: HotColdInfo? = null,
    val seqs: List<SequenceSignal> = emptyList(),
    val minu: MinutagemInfo? = null
)

data class PredictionResult(
    val color: DoubleColor,
    val confidence: Double,
    val probs: Map<DoubleColor, Double>,
    val reasons: List<String>,
    val action: PredictionAction,
    val deep: DeepInsights? = null,
    val signalVotes: Map<String, DoubleColor> = emptyMap()
)

data class VolatilityGaleInfo(
    val multiplier: Double,
    val volatilityLevel: String, // "low" | "medium" | "high" | "critical"
    val label: String,
    val reason: String,
    val bankrollRatio: Int,
    val drawdownPct: Double
)

data class CollectorLogItem(
    val id: String = java.util.UUID.randomUUID().toString(),
    val time: String,
    val type: String, // "info" | "success" | "warning" | "error"
    val message: String
)

data class CollectorState(
    val status: String = "connecting", // "offline" | "connecting" | "live" | "error"
    val statusText: String = "Iniciando…",
    val mode: String = "auto",
    val activeSource: String = "Blaze Brasil (bet.br)",
    val lastRound: Round? = null,
    val lastCheckTime: Long = System.currentTimeMillis(),
    val latencyMs: Long = 0L,
    val totalCollectedSession: Int = 0,
    val logs: List<CollectorLogItem> = emptyList()
)

enum class ScreenTab {
    HOME,
    HISTORY,
    BLAZE,
    BRAIN,
    BANKROLL,
    MEGA,
    CONFIG
}
