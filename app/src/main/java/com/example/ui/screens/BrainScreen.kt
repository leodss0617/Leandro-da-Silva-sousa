package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
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
import com.example.engine.PredictionEngine
import com.example.model.*
import com.example.ui.theme.*
import java.util.Locale

@Composable
fun BrainScreen(
    brain: BrainState,
    preferences: AppPreferences,
    bankroll: Double,
    dayWins: Int,
    dayLosses: Int,
    dayPL: Double,
    onToggleBrain: (Boolean) -> Unit,
    onUpdatePrefs: (AppPreferences) -> Unit
) {
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
            .padding(16.dp)
            .testTag("brain_screen"),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header
        item {
            Column {
                Text(
                    text = "CÉREBRO IA / AUTO-GALE",
                    color = TextWhite,
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    letterSpacing = 0.5.sp
                )
                Text(
                    text = "Gerenciamento autônomo de entradas, ciclos e martingales",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }
        }

        // 1. Brain Master Power Switch Card
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (preferences.brainEnabled) PrimaryRed.copy(alpha = 0.5f) else BorderDark
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(if (preferences.brainEnabled) PrimaryRed else SurfaceDark2),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Psychology,
                                contentDescription = null,
                                tint = if (preferences.brainEnabled) TextWhite else TextMuted,
                                modifier = Modifier.size(24.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Text(
                                text = if (preferences.brainEnabled) "CÉREBRO IA ATIVO" else "CÉREBRO IA PAUSADO",
                                color = TextWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "Estado: ${brain.state.uppercase()} • Ciclos: ${brain.cycles}",
                                color = TextMuted,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Switch(
                        checked = preferences.brainEnabled,
                        onCheckedChange = { onToggleBrain(it) },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = TextWhite,
                            checkedTrackColor = PrimaryRed
                        ),
                        modifier = Modifier.testTag("brain_master_switch")
                    )
                }
            }
        }

        // 2. Active Gale Step Tracker Card
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "PROGRESSÃO DE GALE NO CICLO",
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val maxGales = preferences.brainMaxGales
                        for (g in 0..maxGales) {
                            val isActive = brain.galeLevel == g && preferences.brainEnabled
                            val isPast = brain.galeLevel > g && preferences.brainEnabled

                            val bg = when {
                                isActive -> PrimaryRed
                                isPast -> WarningOrange.copy(alpha = 0.3f)
                                else -> SurfaceDark2
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(54.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(bg)
                                    .border(
                                        1.dp,
                                        if (isActive) TextWhite else BorderDark,
                                        RoundedCornerShape(8.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = if (g == 0) "ENTRADA" else "GALE $g",
                                        color = if (isActive) TextWhite else TextMuted,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 11.sp
                                    )
                                    Text(
                                        text = if (g == 0) String.format(Locale.GERMANY, "R$ %.2f", preferences.betAmount)
                                        else String.format(Locale.GERMANY, "R$ %.2f", preferences.betAmount * (g * preferences.brainGaleMultiplier)),
                                        color = if (isActive) TextWhite else TextDim,
                                        fontSize = 9.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Dynamic Volatility Multiplier Card
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "CALIBRAÇÃO DINÂMICA DE VOLATILIDADE",
                                color = TextWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                            Text(
                                text = volInfo.label,
                                color = if (volInfo.volatilityLevel == "critical") PrimaryRed else if (volInfo.volatilityLevel == "low") SuccessGreen else WarningOrange,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            )
                        }

                        Text(
                            text = "${volInfo.multiplier}x",
                            color = WarningOrange,
                            fontWeight = FontWeight.Black,
                            fontSize = 20.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = volInfo.reason, color = TextDim, fontSize = 11.sp)

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Drawdown da Banca: ${volInfo.drawdownPct}%", color = TextMuted, fontSize = 11.sp)
                        Text(text = "Coberturas: ${volInfo.bankrollRatio}x entradas", color = TextMuted, fontSize = 11.sp)
                    }
                }
            }
        }

        // 4. Configuration Controls
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "PARÂMETROS DO CÉREBRO", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Multiplicador Gale Automático", color = TextWhite, fontSize = 13.sp)
                        Switch(
                            checked = preferences.brainAutoMultiplier,
                            onCheckedChange = { onUpdatePrefs(preferences.copy(brainAutoMultiplier = it)) },
                            colors = SwitchDefaults.colors(checkedThumbColor = TextWhite, checkedTrackColor = PrimaryRed)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Continuar Ciclos Automaticamente", color = TextWhite, fontSize = 13.sp)
                        Switch(
                            checked = preferences.brainAutoContinue,
                            onCheckedChange = { onUpdatePrefs(preferences.copy(brainAutoContinue = it)) },
                            colors = SwitchDefaults.colors(checkedThumbColor = TextWhite, checkedTrackColor = PrimaryRed)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Máximo de Gales Permitidos", color = TextWhite, fontSize = 13.sp)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            (1..3).forEach { g ->
                                val isSelected = preferences.brainMaxGales == g
                                Button(
                                    onClick = { onUpdatePrefs(preferences.copy(brainMaxGales = g)) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isSelected) PrimaryRed else SurfaceDark2
                                    ),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier
                                        .padding(horizontal = 2.dp)
                                        .size(36.dp),
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text(text = "G$g", color = TextWhite, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
