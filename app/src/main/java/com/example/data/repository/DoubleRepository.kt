package com.example.data.repository

import android.content.Context
import com.example.data.local.*
import com.example.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.*

class DoubleRepository(private val database: AppDatabase) {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true; encodeDefaults = true }
    private val roundDao = database.roundDao()
    private val signalDao = database.signalDao()
    private val configDao = database.appConfigDao()

    val roundsFlow: Flow<List<Round>> = roundDao.getAllRoundsFlow().map { list ->
        list.map { it.toModel() }
    }

    val signalsFlow: Flow<List<SignalRecord>> = signalDao.getAllSignalsFlow().map { list ->
        list.map { it.toModel() }
    }

    suspend fun getRoundsCount(): Int = withContext(Dispatchers.IO) {
        roundDao.getRoundsCount()
    }

    suspend fun getAllRounds(): List<Round> = withContext(Dispatchers.IO) {
        roundDao.getAllRounds().map { it.toModel() }
    }

    suspend fun insertRounds(rounds: List<Round>) = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val entities = rounds.mapIndexed { idx, r ->
            RoundEntity.fromModel(r, now + idx)
        }
        roundDao.insertRounds(entities)
    }

    suspend fun insertRound(round: Round) = withContext(Dispatchers.IO) {
        roundDao.insertRound(RoundEntity.fromModel(round, System.currentTimeMillis()))
    }

    suspend fun clearRounds() = withContext(Dispatchers.IO) {
        roundDao.clearRounds()
    }

    suspend fun insertSignal(signal: SignalRecord): Long = withContext(Dispatchers.IO) {
        signalDao.insertSignal(SignalEntity.fromModel(signal))
    }

    suspend fun clearSignals() = withContext(Dispatchers.IO) {
        signalDao.clearSignals()
    }

    suspend fun savePreferences(prefs: AppPreferences) = withContext(Dispatchers.IO) {
        val str = json.encodeToString(prefs)
        configDao.setConfig(AppConfigEntity("prefs", str))
    }

    suspend fun loadPreferences(): AppPreferences = withContext(Dispatchers.IO) {
        val str = configDao.getConfig("prefs")
        if (str != null) {
            try {
                json.decodeFromString<AppPreferences>(str)
            } catch (e: Exception) {
                AppPreferences()
            }
        } else {
            AppPreferences()
        }
    }

    suspend fun saveBrain(brain: BrainState) = withContext(Dispatchers.IO) {
        val str = json.encodeToString(brain)
        configDao.setConfig(AppConfigEntity("brain", str))
    }

    suspend fun loadBrain(): BrainState = withContext(Dispatchers.IO) {
        val str = configDao.getConfig("brain")
        if (str != null) {
            try {
                json.decodeFromString<BrainState>(str)
            } catch (e: Exception) {
                BrainState()
            }
        } else {
            BrainState()
        }
    }

    suspend fun saveMega(mega: MegaTroiaState) = withContext(Dispatchers.IO) {
        val str = json.encodeToString(mega)
        configDao.setConfig(AppConfigEntity("mega", str))
    }

    suspend fun loadMega(): MegaTroiaState = withContext(Dispatchers.IO) {
        val str = configDao.getConfig("mega")
        if (str != null) {
            try {
                json.decodeFromString<MegaTroiaState>(str)
            } catch (e: Exception) {
                MegaTroiaState()
            }
        } else {
            MegaTroiaState()
        }
    }

    suspend fun saveLearn(learn: LearnState) = withContext(Dispatchers.IO) {
        val str = json.encodeToString(learn)
        configDao.setConfig(AppConfigEntity("learn", str))
    }

    suspend fun loadLearn(): LearnState = withContext(Dispatchers.IO) {
        val str = configDao.getConfig("learn")
        if (str != null) {
            try {
                json.decodeFromString<LearnState>(str)
            } catch (e: Exception) {
                LearnState()
            }
        } else {
            LearnState()
        }
    }

    suspend fun saveBankrollData(bankroll: Double, dayWins: Int, dayLosses: Int, dayPL: Double) = withContext(Dispatchers.IO) {
        configDao.setConfig(AppConfigEntity("bankroll_val", bankroll.toString()))
        configDao.setConfig(AppConfigEntity("day_wins", dayWins.toString()))
        configDao.setConfig(AppConfigEntity("day_losses", dayLosses.toString()))
        configDao.setConfig(AppConfigEntity("day_pl", dayPL.toString()))
    }

    suspend fun loadBankrollData(): BankrollSnapshot = withContext(Dispatchers.IO) {
        val b = configDao.getConfig("bankroll_val")?.toDoubleOrNull() ?: 1100.0
        val dw = configDao.getConfig("day_wins")?.toIntOrNull() ?: 0
        val dl = configDao.getConfig("day_losses")?.toIntOrNull() ?: 0
        val dpl = configDao.getConfig("day_pl")?.toDoubleOrNull() ?: 0.0
        BankrollSnapshot(b, dw, dl, dpl)
    }

    suspend fun seedInitialRoundsIfEmpty() = withContext(Dispatchers.IO) {
        val count = roundDao.getRoundsCount()
        if (count == 0) {
            val initial = generateSeedRounds(50)
            val now = System.currentTimeMillis()
            val entities = initial.mapIndexed { idx, r ->
                RoundEntity.fromModel(r, now - (initial.size - idx) * 30000L)
            }
            roundDao.insertRounds(entities)
        }
    }

    private fun generateSeedRounds(count: Int): List<Round> {
        val list = mutableListOf<Round>()
        val cal = Calendar.getInstance()
        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        // Realistic seed sequence with a nice distribution of colors & numbers
        val sampleNumbers = listOf(
            2, 9, 14, 1, 0, 7, 11, 4, 8, 13, 5, 12, 3, 10, 6,
            8, 1, 14, 0, 2, 7, 9, 3, 12, 5, 11, 4, 13, 6, 10,
            1, 8, 2, 14, 7, 0, 11, 3, 9, 12, 4, 13, 5, 10, 6,
            7, 14, 1, 9, 2
        )

        for (i in 0 until minOf(count, sampleNumbers.size)) {
            val num = sampleNumbers[i]
            cal.add(Calendar.SECOND, -30 * (count - i))
            list.add(
                Round(
                    id = "seed_${cal.timeInMillis}_$num",
                    number = num,
                    color = DoubleColor.fromNumber(num),
                    createdAt = isoFormat.format(cal.time),
                    source = "seed"
                )
            )
        }
        return list
    }
}

data class BankrollSnapshot(
    val bankroll: Double,
    val dayWins: Int,
    val dayLosses: Int,
    val dayPL: Double
)
