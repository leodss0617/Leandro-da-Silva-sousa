package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.engine.PredictionEngine
import com.example.model.*
import com.example.ui.components.LiveRoundsStrip
import com.example.ui.components.TargetProgressCard
import com.example.ui.theme.*
import java.util.Locale
import kotlin.math.roundToInt

@Composable
fun HomeScreen(
    rounds: List<Round>,
    prediction: PredictionResult?,
    preferences: AppPreferences,
    bankroll: Double,
    dayWins: Int,
    dayLosses: Int,
    dayPL: Double,
    isTargetDismissed: Boolean,
    onDismissTarget: () -> Unit,
    onManualAddRound: (Int) -> Unit,
    onSyncNow: () -> Unit,
    onTestSignal: () -> Unit,
    onNavigateToTab: (ScreenTab) -> Unit
) {
    var isManualDialogOpen by remember { mutableStateOf(false) }

    val volInfo = remember(bankroll, preferences.betAmount, dayPL, dayWins, dayLosses, preferences.brainGaleMultiplier, preferences.bankrollMode) {
        PredictionEngine.calculateDynamicGaleMultiplier(
            bankroll,
            preferences.betAmount,
            dayPL,
            dayWins,
            dayLosses,
            preferences.brainGaleMultiplier,
            preferences.bankrollMode
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .testTag("home_screen")
    ) {
        // Live Rounds Strip
        item {
            LiveRoundsStrip(rounds = rounds)
        }

        // Daily Target Progress Card
        item {
            TargetProgressCard(
                dayPL = dayPL,
                dailyTarget = preferences.dailyProfitTarget,
                isEnabled = preferences.dailyProfitTargetEnabled,
                isDismissed = isTargetDismissed,
                onDismiss = onDismissTarget
            )
        }

        // Hero Prediction Card
        item {
            PredictionHeroCard(
                prediction = prediction,
                volInfo = volInfo,
                onTestSignal = onTestSignal
            )
        }

        // Quick Stats & Action Cards
        item {
            QuickStatsRow(
                bankroll = bankroll,
                dayWins = dayWins,
                dayLosses = dayLosses,
                dayPL = dayPL,
                onNavigateToBankroll = { onNavigateToTab(ScreenTab.BANKROLL) }
            )
        }

        // Action Buttons Row (Manual Input, Sync, Test Signal)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { isManualDialogOpen = true },
                    colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark2),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("manual_round_button")
                ) {
                    Icon(Icons.Default.AddCircleOutline, contentDescription = null, modifier = Modifier.size(16.dp), tint = TextWhite)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Inserir Roll", fontSize = 11.sp, color = TextWhite)
                }

                Button(
                    onClick = onSyncNow,
                    colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark2),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("sync_now_button")
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp), tint = SuccessGreen)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Sincronizar", fontSize = 11.sp, color = TextWhite)
                }

                Button(
                    onClick = onTestSignal,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed.copy(alpha = 0.2f)),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryRed.copy(alpha = 0.5f)),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("test_signal_button")
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp), tint = PrimaryRed)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Testar Sinal", fontSize = 11.sp, color = PrimaryRed)
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }

    // Manual Round Input Dialog (0 to 14 buttons)
    if (isManualDialogOpen) {
        Dialog(onDismissRequest = { isManualDialogOpen = false }) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("manual_input_dialog")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "INSERIR RESULTADO MANUAL",
                            color = TextWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        IconButton(onClick = { isManualDialogOpen = false }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Close, contentDescription = "Fechar", tint = TextMuted)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "Selecione o número sorteado na roleta:", color = TextMuted, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(12.dp))

                    // White button 0
                    Button(
                        onClick = {
                            onManualAddRound(0)
                            isManualDialogOpen = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ChipWhite),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                    ) {
                        Text(text = "#0 BRANCO (14x)", color = Color(0xFF0A0A0C), fontWeight = FontWeight.Black)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Reds 1-7
                    Text(text = "Vermelhos (1-7):", color = PrimaryRed, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        (1..7).forEach { num ->
                            Button(
                                onClick = {
                                    onManualAddRound(num)
                                    isManualDialogOpen = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ChipRed),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(0.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(36.dp)
                            ) {
                                Text(text = "$num", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Blacks 8-14
                    Text(text = "Pretos (8-14):", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        (8..14).forEach { num ->
                            Button(
                                onClick = {
                                    onManualAddRound(num)
                                    isManualDialogOpen = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ChipBlack),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(0.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(36.dp)
                            ) {
                                Text(text = "$num", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PredictionHeroCard(
    prediction: PredictionResult?,
    volInfo: VolatilityGaleInfo,
    onTestSignal: () -> Unit
) {
    val color = prediction?.color ?: DoubleColor.SKIP
    val conf = prediction?.confidence ?: 0.0
    val confPct = (conf * 100).roundToInt()
    val isEnter = prediction?.action == PredictionAction.ENTER

    val chipBg = when (color) {
        DoubleColor.RED -> ChipRed
        DoubleColor.BLACK -> ChipBlack
        DoubleColor.WHITE -> ChipWhite
        else -> SurfaceDark2
    }
    val textColor = if (color == DoubleColor.WHITE) Color(0xFF0A0A0C) else TextWhite

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = SurfaceDark,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isEnter) PrimaryRed.copy(alpha = 0.5f) else BorderDark
        ),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .testTag("prediction_hero_card")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row: Status tag & Volatility pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (isEnter) SuccessGreen else WarningOrange)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isEnter) "ENTRADA RECOMENDADA" else "AGUARDANDO OPORTUNIDADE",
                        color = if (isEnter) SuccessGreen else WarningOrange,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        letterSpacing = 0.5.sp
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = SurfaceDark2
                ) {
                    Text(
                        text = "Gale: ${volInfo.multiplier}x",
                        color = WarningOrange,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Main Prediction Center Banner
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "PALPITE DA IA", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = color.label,
                        color = if (color == DoubleColor.RED) PrimaryRed else if (color == DoubleColor.WHITE) Color(0xFFF1F5F9) else TextWhite,
                        fontWeight = FontWeight.Black,
                        fontSize = 26.sp,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = if (isEnter) "Cobrir o Branco (14x)" else "Aguardar padrão consistente",
                        color = TextDim,
                        fontSize = 11.sp
                    )
                }

                // Color badge circle with confidence gauge
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(chipBg)
                        .border(2.dp, TextWhite.copy(alpha = 0.3f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "$confPct%",
                            color = textColor,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = "CONF",
                            color = textColor.copy(alpha = 0.8f),
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Probability Distribution Bars (Red, Black, White)
            val redProb = ((prediction?.probs?.get(DoubleColor.RED) ?: 0.46) * 100).toInt()
            val blackProb = ((prediction?.probs?.get(DoubleColor.BLACK) ?: 0.46) * 100).toInt()
            val whiteProb = ((prediction?.probs?.get(DoubleColor.WHITE) ?: 0.08) * 100).toInt()

            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Probabilidades por cor:", color = TextMuted, fontSize = 11.sp)
                    Text(text = "V: $redProb% | P: $blackProb% | B: $whiteProb%", color = TextWhite, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                ) {
                    Box(modifier = Modifier.weight(maxOf(1f, redProb.toFloat())).fillMaxHeight().background(ChipRed))
                    Spacer(modifier = Modifier.width(2.dp))
                    Box(modifier = Modifier.weight(maxOf(1f, blackProb.toFloat())).fillMaxHeight().background(ChipBlack))
                    Spacer(modifier = Modifier.width(2.dp))
                    Box(modifier = Modifier.weight(maxOf(1f, whiteProb.toFloat())).fillMaxHeight().background(ChipWhite))
                }
            }

            // Reasons / AI Consensus Breakdown
            if (!prediction?.reasons.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = BorderDark, thickness = 1.dp)
                Spacer(modifier = Modifier.height(10.dp))

                Text(text = "MOTIVOS DO SINAL", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))

                prediction?.reasons?.take(3)?.forEach { reason ->
                    Row(modifier = Modifier.padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = reason, color = TextWhite, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun QuickStatsRow(
    bankroll: Double,
    dayWins: Int,
    dayLosses: Int,
    dayPL: Double,
    onNavigateToBankroll: () -> Unit
) {
    val total = dayWins + dayLosses
    val winRate = if (total > 0) (dayWins.toDouble() / total * 100).roundToInt() else 0

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = SurfaceDark,
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
            modifier = Modifier
                .weight(1f)
                .clickable { onNavigateToBankroll() }
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(text = "SALDO DA BANCA", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = String.format(Locale.GERMANY, "R$ %.2f", bankroll),
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
        }

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = SurfaceDark,
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
            modifier = Modifier
                .weight(1f)
                .clickable { onNavigateToBankroll() }
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(text = "LUCRO DO DIA", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = String.format(Locale.GERMANY, "%sR$ %.2f", if (dayPL >= 0) "+" else "", dayPL),
                    color = if (dayPL >= 0) SuccessGreen else PrimaryRed,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
        }

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = SurfaceDark,
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
            modifier = Modifier
                .weight(1f)
                .clickable { onNavigateToBankroll() }
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(text = "TAXA DE ACERTO", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "$winRate% ($dayWins W)",
                    color = SuccessGreen,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
        }
    }
}
