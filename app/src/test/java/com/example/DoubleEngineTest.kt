package com.example

import com.example.engine.MegaTroiaCalculator
import com.example.engine.PredictionEngine
import com.example.model.*
import org.junit.Assert.*
import org.junit.Test

class DoubleEngineTest {

    @Test
    fun testColorClassification() {
        assertEquals(DoubleColor.WHITE, DoubleColor.fromNumber(0))
        assertEquals(DoubleColor.RED, DoubleColor.fromNumber(1))
        assertEquals(DoubleColor.RED, DoubleColor.fromNumber(7))
        assertEquals(DoubleColor.BLACK, DoubleColor.fromNumber(8))
        assertEquals(DoubleColor.BLACK, DoubleColor.fromNumber(14))
    }

    @Test
    fun testMegaTroiaCalculatorRows() {
        val rows = MegaTroiaCalculator.calcMegaTroiaRows(targetProfit = 5.0, firstBlack = 2.5, maxEntries = 6)
        assertEquals(6, rows.size)

        // First row checks
        assertEquals(1, rows[0].entry)
        assertEquals(0.0, rows[0].sPrev, 0.01)
        assertEquals(2.5, rows[0].black, 0.01)
        assertTrue(rows[0].white > 0.0)
        assertTrue(rows[0].total > rows[0].black)
        assertTrue(rows[0].sAfter > 0.0)

        // Second row sPrev should equal first row sAfter
        assertEquals(rows[0].sAfter, rows[1].sPrev, 0.01)
    }

    @Test
    fun testPredictionEngineWithSampleRounds() {
        val sampleRounds = (1..20).map { i ->
            val num = if (i % 3 == 0) 1 else 8
            Round(
                id = "round_$i",
                number = num,
                color = DoubleColor.fromNumber(num),
                createdAt = "2026-08-31T10:00:${i}Z",
                source = "test"
            )
        }

        val prefs = AppPreferences()
        val learn = LearnState()
        val pred = PredictionEngine.predict(sampleRounds, prefs, learn)

        assertNotNull(pred)
        assertTrue(pred.confidence in 0.0..1.0)
        assertTrue(pred.probs.containsKey(DoubleColor.RED))
        assertTrue(pred.probs.containsKey(DoubleColor.BLACK))
        assertTrue(pred.probs.containsKey(DoubleColor.WHITE))
    }

    @Test
    fun testVolatilityGaleMultiplier() {
        val volNormal = PredictionEngine.calculateDynamicGaleMultiplier(
            bankroll = 1000.0,
            betAmount = 5.0,
            dayPL = 20.0,
            dayWins = 5,
            dayLosses = 2,
            baseGaleMult = 2.0,
            riskMode = "balanced"
        )
        assertTrue(volNormal.multiplier in 1.5..2.5)

        val volAggressive = PredictionEngine.calculateDynamicGaleMultiplier(
            bankroll = 1000.0,
            betAmount = 5.0,
            dayPL = -100.0,
            dayWins = 1,
            dayLosses = 5,
            baseGaleMult = 2.0,
            riskMode = "aggressive"
        )
        assertEquals("critical", volAggressive.volatilityLevel)
    }
}
