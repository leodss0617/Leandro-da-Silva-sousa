package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.DoubleColor
import com.example.model.Round
import com.example.ui.theme.*

@Composable
fun LiveRoundsStrip(
    rounds: List<Round>,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val displayRounds = rounds.takeLast(30).reversed()

    LaunchedEffect(rounds.size) {
        scrollState.scrollTo(0)
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(SurfaceDark2)
            .padding(vertical = 10.dp)
            .testTag("live_rounds_strip")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "ÚLTIMAS RODADAS",
                color = TextMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Text(
                text = "${rounds.size} no histórico",
                color = TextDim,
                fontSize = 11.sp
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(scrollState)
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            displayRounds.forEachIndexed { index, round ->
                val isLatest = index == 0
                val chipColor = when (round.color) {
                    DoubleColor.RED -> ChipRed
                    DoubleColor.BLACK -> ChipBlack
                    DoubleColor.WHITE -> ChipWhite
                    else -> ChipBlack
                }
                val textColor = if (round.color == DoubleColor.WHITE) Color(0xFF0A0A0C) else TextWhite

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(if (isLatest) 38.dp else 32.dp)
                            .clip(CircleShape)
                            .background(chipColor)
                            .border(
                                width = if (isLatest) 2.dp else 1.dp,
                                color = if (isLatest) TextWhite else BorderDark,
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${round.number}",
                            color = textColor,
                            fontSize = if (isLatest) 15.sp else 13.sp,
                            fontWeight = FontWeight.Black
                        )
                    }

                    if (isLatest) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "ATUAL",
                            color = PrimaryRed,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
