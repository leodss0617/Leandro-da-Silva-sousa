package com.example.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface RoundDao {
    @Query("SELECT * FROM rounds ORDER BY timestamp ASC")
    fun getAllRoundsFlow(): Flow<List<RoundEntity>>

    @Query("SELECT * FROM rounds ORDER BY timestamp ASC")
    suspend fun getAllRounds(): List<RoundEntity>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertRounds(rounds: List<RoundEntity>)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertRound(round: RoundEntity)

    @Query("DELETE FROM rounds")
    suspend fun clearRounds()

    @Query("SELECT COUNT(*) FROM rounds")
    suspend fun getRoundsCount(): Int
}

@Dao
interface SignalDao {
    @Query("SELECT * FROM signals ORDER BY createdAtMs DESC")
    fun getAllSignalsFlow(): Flow<List<SignalEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSignal(signal: SignalEntity): Long

    @Query("DELETE FROM signals")
    suspend fun clearSignals()
}

@Dao
interface AppConfigDao {
    @Query("SELECT value FROM app_config WHERE `key` = :key")
    suspend fun getConfig(key: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setConfig(entity: AppConfigEntity)

    @Query("DELETE FROM app_config")
    suspend fun clearConfig()
}
