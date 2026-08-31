package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RestartAlt
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
import com.example.engine.MegaTroiaCalculator
import com.example.model.MegaTroiaState
import com.example.ui.theme.*
import java.util.Locale

@Composable
fun MegaScreen(
    megaState: MegaTroiaState,
    onUpdateMega: (Double, Double, Int) -> Unit,
    onSetEntry: (Int) -> Unit,
    onToggleEnabled: (Boolean) -> Unit
) {
    var targetText by remember(megaState.targetProfit) { mutableStateOf(megaState.targetProfit.toString()) }
    var firstBlackText by remember(megaState.firstBlack) { mutableStateOf(megaState.firstBlack.toString()) }
    var maxEntries by remember(megaState.maxEntries) { mutableStateOf(megaState.maxEntries) }

    val rows = remember(megaState.targetProfit, megaState.firstBlack, megaState.maxEntries) {
        MegaTroiaCalculator.calcMegaTroiaRows(megaState.targetProfit, megaState.firstBlack, megaState.maxEntries)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp)
            .testTag("mega_screen"),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header
        item {
            Column {
                Text(
                    text = "ESTRATÉGIA MEGA TROIA",
                    color = TextWhite,
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    letterSpacing = 0.5.sp
                )
                Text(
                    text = "Sistema matemático de proteção dupla (Preto 2x + Branco 14x)",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }
        }

        // 1. Current Entry Tracker Card
        item {
            val activeRow = rows.find { it.entry == megaState.currentEntry } ?: rows.firstOrNull()
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryRed.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "ENTRADA ATUAL: ${megaState.currentEntry} DE ${megaState.maxEntries}",
                            color = PrimaryRed,
                            fontWeight = FontWeight.Black,
                            fontSize = 14.sp
                        )
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = PrimaryRed.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = "Meta T: R$ ${megaState.targetProfit}",
                                color = PrimaryRed,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    if (activeRow != null) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = ChipBlack,
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    Text(text = "APOSTAR PRETO (2x)", color = TextMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    Text(
                                        text = String.format(Locale.GERMANY, "R$ %.2f", activeRow.black),
                                        color = TextWhite,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 14.sp
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = ChipWhite,
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    Text(text = "APOSTAR BRANCO (14x)", color = Color(0xFF0A0A0C), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    Text(
                                        text = String.format(Locale.GERMANY, "R$ %.2f", activeRow.white),
                                        color = Color(0xFF0A0A0C),
                                        fontWeight = FontWeight.Black,
                                        fontSize = 14.sp
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Aporte Total desta entrada: ${String.format(Locale.GERMANY, "R$ %.2f", activeRow.total)} | Acumulado: ${String.format(Locale.GERMANY, "R$ %.2f", activeRow.sAfter)}",
                            color = TextDim,
                            fontSize = 11.sp
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { onSetEntry(1) },
                                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = "Green! Reset", fontSize = 11.sp, color = Color(0xFF0A0A0C), fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = {
                                    val next = if (megaState.currentEntry < megaState.maxEntries) megaState.currentEntry + 1 else 1
                                    onSetEntry(next)
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark2),
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(text = "Avançar Gale", fontSize = 11.sp, color = TextWhite)
                            }
                        }
                    }
                }
            }
        }

        // 2. Parameters Configuration Card
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "CALIBRAR VALORES DO MEGA TROIA", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = targetText,
                            onValueChange = {
                                targetText = it
                                val t = it.replace(",", ".").toDoubleOrNull()
                                if (t != null && t > 0) {
                                    onUpdateMega(t, megaState.firstBlack, maxEntries)
                                }
                            },
                            label = { Text("Lucro Alvo (T)", fontSize = 10.sp) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedBorderColor = PrimaryRed
                            ),
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = firstBlackText,
                            onValueChange = {
                                firstBlackText = it
                                val b = it.replace(",", ".").toDoubleOrNull()
                                if (b != null && b > 0) {
                                    onUpdateMega(megaState.targetProfit, b, maxEntries)
                                }
                            },
                            label = { Text("1º Preto (R$)", fontSize = 10.sp) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedBorderColor = PrimaryRed
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        // 3. Full Calculation Table Card
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "TABELA DE PROGRESSÃO MATEMÁTICA", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    // Table Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceDark2)
                            .padding(vertical = 6.dp, horizontal = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Nº", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(24.dp))
                        Text(text = "S_prev", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Text(text = "Preto", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Text(text = "Branco", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Text(text = "Total", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Text(text = "S_after", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                    }

                    HorizontalDivider(color = BorderDark, thickness = 1.dp)

                    // Table Rows
                    rows.forEach { row ->
                        val isCurrent = row.entry == megaState.currentEntry
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(if (isCurrent) PrimaryRed.copy(alpha = 0.15f) else Color.Transparent)
                                .clickable { onSetEntry(row.entry) }
                                .padding(vertical = 8.dp, horizontal = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${row.entry}",
                                color = if (isCurrent) PrimaryRed else TextWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                modifier = Modifier.width(24.dp)
                            )
                            Text(text = String.format(Locale.GERMANY, "%.1f", row.sPrev), color = TextMuted, fontSize = 11.sp, modifier = Modifier.weight(1f))
                            Text(text = String.format(Locale.GERMANY, "%.2f", row.black), color = TextWhite, fontWeight = FontWeight.SemiBold, fontSize = 11.sp, modifier = Modifier.weight(1f))
                            Text(text = String.format(Locale.GERMANY, "%.2f", row.white), color = Color(0xFFF1F5F9), fontWeight = FontWeight.SemiBold, fontSize = 11.sp, modifier = Modifier.weight(1f))
                            Text(text = String.format(Locale.GERMANY, "%.2f", row.total), color = WarningOrange, fontWeight = FontWeight.Bold, fontSize = 11.sp, modifier = Modifier.weight(1f))
                            Text(text = String.format(Locale.GERMANY, "%.1f", row.sAfter), color = TextMuted, fontSize = 11.sp, modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}
