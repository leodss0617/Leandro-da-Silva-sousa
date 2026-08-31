package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import com.example.model.SignalRecord
import com.example.ui.theme.*
import java.util.Locale
import kotlin.math.roundToInt

@Composable
fun HistoryScreen(
    rounds: List<Round>,
    signals: List<SignalRecord>,
    onClearHistory: () -> Unit
) {
    var selectedSubTab by remember { mutableStateOf(0) } // 0 = Rodadas, 1 = Sinais IA
    var selectedColorFilter by remember { mutableStateOf<DoubleColor?>(null) }
    var searchQuery by remember { mutableStateOf("") }

    val filteredRounds = remember(rounds, selectedColorFilter, searchQuery) {
        rounds.reversed().filter { r ->
            (selectedColorFilter == null || r.color == selectedColorFilter) &&
            (searchQuery.isEmpty() || r.number.toString().contains(searchQuery))
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp)
            .testTag("history_screen")
    ) {
        // Sub-Tabs: Rodadas vs Sinais IA
        TabRow(
            selectedTabIndex = selectedSubTab,
            containerColor = SurfaceDark,
            contentColor = PrimaryRed,
            modifier = Modifier.clip(RoundedCornerShape(10.dp))
        ) {
            Tab(
                selected = selectedSubTab == 0,
                onClick = { selectedSubTab = 0 },
                text = { Text("Rodadas (${rounds.size})", fontWeight = FontWeight.Bold, fontSize = 13.sp) }
            )
            Tab(
                selected = selectedSubTab == 1,
                onClick = { selectedSubTab = 1 },
                text = { Text("Sinais IA (${signals.size})", fontWeight = FontWeight.Bold, fontSize = 13.sp) }
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (selectedSubTab == 0) {
            // Filter Chips for Colors
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                FilterChip(
                    selected = selectedColorFilter == null,
                    onClick = { selectedColorFilter = null },
                    label = { Text("Todos", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = PrimaryRed,
                        selectedLabelColor = TextWhite
                    )
                )
                FilterChip(
                    selected = selectedColorFilter == DoubleColor.RED,
                    onClick = { selectedColorFilter = DoubleColor.RED },
                    label = { Text("Vermelho", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = ChipRed,
                        selectedLabelColor = TextWhite
                    )
                )
                FilterChip(
                    selected = selectedColorFilter == DoubleColor.BLACK,
                    onClick = { selectedColorFilter = DoubleColor.BLACK },
                    label = { Text("Preto", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = ChipBlack,
                        selectedLabelColor = TextWhite
                    )
                )
                FilterChip(
                    selected = selectedColorFilter == DoubleColor.WHITE,
                    onClick = { selectedColorFilter = DoubleColor.WHITE },
                    label = { Text("Branco", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = ChipWhite,
                        selectedLabelColor = Color(0xFF0A0A0C)
                    )
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Rounds List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(filteredRounds) { round ->
                    val chipColor = when (round.color) {
                        DoubleColor.RED -> ChipRed
                        DoubleColor.BLACK -> ChipBlack
                        DoubleColor.WHITE -> ChipWhite
                        else -> ChipBlack
                    }
                    val textColor = if (round.color == DoubleColor.WHITE) Color(0xFF0A0A0C) else TextWhite

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = SurfaceDark,
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(chipColor),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${round.number}",
                                        color = textColor,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 15.sp
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column {
                                    Text(
                                        text = round.color.ptName,
                                        color = TextWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        text = "Fonte: ${round.source}",
                                        color = TextDim,
                                        fontSize = 10.sp
                                    )
                                }
                            }

                            Text(
                                text = round.createdAt.takeLast(8).replace("Z", ""),
                                color = TextMuted,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        } else {
            // Sinais IA List
            val winsCount = signals.count { it.outcome == "win" }
            val lossesCount = signals.count { it.outcome == "loss" }
            val totalPL = signals.sumOf { it.pl }

            // Summary bar
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = SurfaceDark2,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Acertos: $winsCount / $lossesCount", color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Text(
                        text = "P/L Acumulado: ${String.format(Locale.GERMANY, "%sR$ %.2f", if (totalPL >= 0) "+" else "", totalPL)}",
                        color = if (totalPL >= 0) SuccessGreen else PrimaryRed,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }

            if (signals.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = "Nenhum sinal registrado ainda nesta sessão", color = TextDim, fontSize = 13.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(signals) { signal ->
                        val isWin = signal.outcome == "win"
                        val chipColor = when (signal.color) {
                            DoubleColor.RED -> ChipRed
                            DoubleColor.BLACK -> ChipBlack
                            DoubleColor.WHITE -> ChipWhite
                            else -> ChipBlack
                        }

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = SurfaceDark,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isWin) SuccessGreen.copy(alpha = 0.3f) else PrimaryRed.copy(alpha = 0.3f)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(chipColor),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = if (signal.color == DoubleColor.RED) "V" else if (signal.color == DoubleColor.WHITE) "W" else "P",
                                            color = if (signal.color == DoubleColor.WHITE) Color.Black else TextWhite,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(10.dp))

                                    Column {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = if (isWin) "GREEN" else "RED",
                                                color = if (isWin) SuccessGreen else PrimaryRed,
                                                fontWeight = FontWeight.Black,
                                                fontSize = 13.sp
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "• Gale ${signal.gale}",
                                                color = TextMuted,
                                                fontSize = 11.sp
                                            )
                                        }
                                        Text(
                                            text = "Conf: ${(signal.confidence * 100).roundToInt()}% • ${signal.timestamp}",
                                            color = TextDim,
                                            fontSize = 10.sp
                                        )
                                    }
                                }

                                Text(
                                    text = String.format(Locale.GERMANY, "%sR$ %.2f", if (signal.pl >= 0) "+" else "", signal.pl),
                                    color = if (signal.pl >= 0) SuccessGreen else PrimaryRed,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
