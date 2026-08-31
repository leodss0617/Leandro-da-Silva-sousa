package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.model.AppPreferences
import com.example.ui.theme.*
import kotlin.math.roundToInt

@Composable
fun ConfigScreen(
    preferences: AppPreferences,
    onUpdatePrefs: (AppPreferences) -> Unit,
    onClearHistory: () -> Unit
) {
    var targetProfitText by remember(preferences.dailyProfitTarget) { mutableStateOf(preferences.dailyProfitTarget.toString()) }
    var baseBetText by remember(preferences.betAmount) { mutableStateOf(preferences.betAmount.toString()) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp)
            .testTag("config_screen"),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header
        item {
            Column {
                Text(
                    text = "CONFIGURAÇÕES & IA",
                    color = TextWhite,
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    letterSpacing = 0.5.sp
                )
                Text(
                    text = "Ajuste fino dos modelos matemáticos, sons e coletor",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }
        }

        // 1. Prediction Models Toggle Card
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "MODELOS MATEMÁTICOS ATIVOS", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    ConfigSwitchRow("Frequência Multi-Horizonte (30/80/200/1000)", preferences.useFrequency) {
                        onUpdatePrefs(preferences.copy(useFrequency = it))
                    }
                    ConfigSwitchRow("Cadeias de Markov 1ª e 2ª Ordem", preferences.useMarkov) {
                        onUpdatePrefs(preferences.copy(useMarkov = it))
                    }
                    ConfigSwitchRow("Pressão de Sequências (Streak)", preferences.useStreak) {
                        onUpdatePrefs(preferences.copy(useStreak = it))
                    }
                    ConfigSwitchRow("Ciclo e Densidade do Branco", preferences.useWhiteCycle) {
                        onUpdatePrefs(preferences.copy(useWhiteCycle = it))
                    }
                    ConfigSwitchRow("Detecção de Padrões (1x1, 2x2, VPV)", preferences.usePattern) {
                        onUpdatePrefs(preferences.copy(usePattern = it))
                    }
                }
            }
        }

        // 2. Sensitivity & Confidence Threshold
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    val confPct = (preferences.minConfidence * 100).roundToInt()
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "CONFIANÇA MÍNIMA PARA ENTRADA", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text(text = "$confPct%", color = PrimaryRed, fontWeight = FontWeight.Black, fontSize = 14.sp)
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Slider(
                        value = preferences.minConfidence.toFloat(),
                        onValueChange = { onUpdatePrefs(preferences.copy(minConfidence = it.toDouble())) },
                        valueRange = 0.40f..0.85f,
                        steps = 8,
                        colors = SliderDefaults.colors(
                            thumbColor = PrimaryRed,
                            activeTrackColor = PrimaryRed,
                            inactiveTrackColor = SurfaceDark2
                        )
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    ConfigSwitchRow("Modo Somente Branco (ignora cores)", preferences.whiteOnly) {
                        onUpdatePrefs(preferences.copy(whiteOnly = it))
                    }
                }
            }
        }

        // 3. Audio & Voice Settings
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "ÁUDIO, VOZ & NOTIFICAÇÕES", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    ConfigSwitchRow("Efeitos Sonoros e Beeps", preferences.soundEnabled) {
                        onUpdatePrefs(preferences.copy(soundEnabled = it))
                    }
                    ConfigSwitchRow("Voz em Português (Sinais e Metas)", preferences.voiceEnabled) {
                        onUpdatePrefs(preferences.copy(voiceEnabled = it))
                    }
                    ConfigSwitchRow("Exibir Bubble Flutuante de Previsão", preferences.showBubble) {
                        onUpdatePrefs(preferences.copy(showBubble = it))
                    }
                }
            }
        }

        // 4. Collector Mode & Espelho
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "MODO DE COLETA DE DADOS", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    val collectorModes = listOf(
                        Pair("auto", "Automático (WebSocket + REST)"),
                        Pair("websocket", "WebSocket em Tempo Real"),
                        Pair("direct_rest", "Polling REST Direto"),
                        Pair("simulation", "Modo Simulação (Offline)")
                    )

                    collectorModes.forEach { (modeKey, label) ->
                        val isSelected = preferences.collectorMode == modeKey
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { onUpdatePrefs(preferences.copy(collectorMode = modeKey)) }
                                .padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { onUpdatePrefs(preferences.copy(collectorMode = modeKey)) },
                                colors = RadioButtonDefaults.colors(selectedColor = PrimaryRed)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = label, color = if (isSelected) TextWhite else TextMuted, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // 5. Daily Profit Target Input
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "META DE LUCRO DIÁRIO", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = targetProfitText,
                            onValueChange = {
                                targetProfitText = it
                                val t = it.replace(",", ".").toDoubleOrNull()
                                if (t != null && t >= 0) {
                                    onUpdatePrefs(preferences.copy(dailyProfitTarget = t))
                                }
                            },
                            label = { Text("Meta Diária (R$)") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedBorderColor = PrimaryRed
                            ),
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = baseBetText,
                            onValueChange = {
                                baseBetText = it
                                val b = it.replace(",", ".").toDoubleOrNull()
                                if (b != null && b > 0) {
                                    onUpdatePrefs(preferences.copy(betAmount = b))
                                }
                            },
                            label = { Text("Entrada Base (R$)") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedBorderColor = PrimaryRed
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    ConfigSwitchRow("Aviso Sonoro aos 80% da Meta", preferences.dailyProfitTargetAlert80Enabled) {
                        onUpdatePrefs(preferences.copy(dailyProfitTargetAlert80Enabled = it))
                    }
                }
            }
        }

        // 6. Reset Database Action
        item {
            Button(
                onClick = onClearHistory,
                colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark2),
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryRed.copy(alpha = 0.5f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("reset_database_button")
            ) {
                Icon(Icons.Default.Delete, contentDescription = null, tint = PrimaryRed, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = "Restaurar Banco de Dados e Histórico", color = PrimaryRed, fontSize = 12.sp)
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun ConfigSwitchRow(title: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, color = TextWhite, fontSize = 12.sp, modifier = Modifier.weight(1f))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(checkedThumbColor = TextWhite, checkedTrackColor = PrimaryRed)
        )
    }
}
