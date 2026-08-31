package com.example.engine

import com.example.model.MegaTroiaRow
import kotlin.math.max
import kotlin.math.min

object MegaTroiaCalculator {
    /**
     * Official Mega Troia Mathematical System:
     * - White payout: 14x (1:13 net profit)
     * - Color payout: 2x (1:1 net profit)
     * 1st Entry:
     *   black = firstBlack
     *   white = (T + black) / 13
     * Next entries (i > 1):
     *   black = (7/6) * (T + S_prev)
     *   white = (T + S_prev + black) / 13
     */
    fun calcMegaTroiaRows(targetProfit: Double, firstBlack: Double, maxEntries: Int): List<MegaTroiaRow> {
        val target = if (targetProfit > 0) targetProfit else 5.0
        val initialBlack = if (firstBlack > 0) firstBlack else 2.5
        val entries = min(6, max(1, maxEntries))
        val rows = mutableListOf<MegaTroiaRow>()
        var s = 0.0

        for (i in 1..entries) {
            val black: Double
            val white: Double

            if (i == 1) {
                black = initialBlack
                white = (target + black) / 13.0
            } else {
                black = (7.0 / 6.0) * (target + s)
                white = (target + s + black) / 13.0
            }

            val total = black + white
            val sPrev = s
            s += total

            rows.add(
                MegaTroiaRow(
                    entry = i,
                    sPrev = sPrev,
                    black = black,
                    white = white,
                    total = total,
                    sAfter = s
                )
            )
        }

        return rows
    }
}
