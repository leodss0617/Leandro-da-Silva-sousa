package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.model.DoubleColor
import com.example.model.Round
import com.example.model.SignalRecord

@Entity(tableName = "rounds")
data class RoundEntity(
    @PrimaryKey val id: String,
    val externalId: String?,
    val number: Int,
    val color: String,
    val createdAt: String,
    val source: String,
    val timestamp: Long
) {
    fun toModel(): Round {
        return Round(
            id = id,
            externalId = externalId,
            number = number,
            color = DoubleColor.fromString(color),
            createdAt = createdAt,
            source = source
        )
    }

    companion object {
        fun fromModel(r: Round, ts: Long = System.currentTimeMillis()): RoundEntity {
            return RoundEntity(
                id = r.id,
                externalId = r.externalId,
                number = r.number,
                color = r.color.name.lowercase(),
                createdAt = r.createdAt,
                source = r.source,
                timestamp = ts
            )
        }
    }
}

@Entity(tableName = "signals")
data class SignalEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val color: String,
    val confidence: Double,
    val outcome: String,
    val gale: Int,
    val pl: Double,
    val timestamp: String,
    val createdAtMs: Long
) {
    fun toModel(): SignalRecord {
        return SignalRecord(
            id = id,
            color = DoubleColor.fromString(color),
            confidence = confidence,
            outcome = outcome,
            gale = gale,
            pl = pl,
            timestamp = timestamp
        )
    }

    companion object {
        fun fromModel(s: SignalRecord): SignalEntity {
            return SignalEntity(
                id = if (s.id > 0) s.id else 0,
                color = s.color.name.lowercase(),
                confidence = s.confidence,
                outcome = s.outcome,
                gale = s.gale,
                pl = s.pl,
                timestamp = s.timestamp,
                createdAtMs = System.currentTimeMillis()
            )
        }
    }
}

@Entity(tableName = "app_config")
data class AppConfigEntity(
    @PrimaryKey val key: String,
    val value: String
)
