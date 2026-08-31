package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.window.Dialog
import com.example.model.AppPreferences
import com.example.ui.components.TargetProgressCard
import com.example.ui.theme.*
import java.util.Locale
import kotlin.math.roundToInt

@Composable
fun BankrollScreen(
    bankroll: Double,
    dayWins: Int,
    dayLosses: Int,
    dayPL: Double,
    preferences: AppPreferences,
    onUpdateBankroll: (Double) -> Unit,
    onResetDailyStats: () -> Unit,
    onUpdatePrefs: (AppPreferences) -> Unit
) {
    var isAdjustDialogOpen by remember { mutableStateOf(false) }
    var adjustAmountText by remember { mutableStateOf(String.format(Locale.US, "%.2f", bankroll)) }

    val totalOps = dayWins + dayLosses
    val winRate = if (totalOps > 0) (dayWins.toDouble() / totalOps * 100).roundToInt() else 0

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp)
            .testTag("bankroll_screen"),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header
        item {
            Column {
                Text(
                    text = "GERENCIAMENTO DE BANCA",
                    color = TextWhite,
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    letterSpacing = 0.5.sp
                )
                Text(
                    text = "Controle de saldo, metas diárias e disciplina financeira",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }
        }

        // 1. Bankroll Balance Main Hero Card
        item {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "SALDO ATUAL DA BANCA", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        IconButton(onClick = { isAdjustDialogOpen = true }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Edit, contentDescription = "Editar Saldo", tint = PrimaryRed, modifier = Modifier.size(16.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = String.format(Locale.GERMANY, "R$ %.2f", bankroll),
                        color = TextWhite,
                        fontWeight = FontWeight.Black,
                        fontSize = 28.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider(color = BorderDark, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "LUCRO/PREJUÍZO HOJE", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text(
                                text = String.format(Locale.GERMANY, "%sR$ %.2f", if (dayPL >= 0) "+" else "", dayPL),
                                color = if (dayPL >= 0) SuccessGreen else PrimaryRed,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "ACERTOS (WIN RATE)", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text(
                                text = "$winRate% ($dayWins W - $dayLosses L)",
                                color = SuccessGreen,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                    }
                }
            }
        }

        // 2. Daily Profit Target Card
        item {
            TargetProgressCard(
                dayPL = dayPL,
                dailyTarget = preferences.dailyProfitTarget,
                isEnabled = preferences.dailyProfitTargetEnabled,
                isDismissed = false,
                onDismiss = {}
            )
        }

        // 3. Risk Profile Mode Selection
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "PERFIL DE RISCO DA BANCA", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val modes = listOf(
                            Triple("conservative", "Conservador", "Gale 1.6x"),
                            Triple("balanced", "Equilibrado", "Gale 2.0x"),
                            Triple("aggressive", "Agressivo", "Gale 2.2x")
                        )

                        modes.forEach { (modeKey, title, sub) ->
                            val isSelected = preferences.bankrollMode == modeKey
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (isSelected) PrimaryRed.copy(alpha = 0.2f) else SurfaceDark2,
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (isSelected) PrimaryRed else BorderDark
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { onUpdatePrefs(preferences.copy(bankrollMode = modeKey)) }
                            ) {
                                Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = title,
                                        color = if (isSelected) PrimaryRed else TextWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(text = sub, color = TextDim, fontSize = 9.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. Quick Actions
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onResetDailyStats,
                    colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark2),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.RestartAlt, contentDescription = null, modifier = Modifier.size(16.dp), tint = TextWhite)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "Zerar Estatísticas", fontSize = 11.sp, color = TextWhite)
                }
            }
        }
    }

    // Adjust Bankroll Dialog
    if (isAdjustDialogOpen) {
        Dialog(onDismissRequest = { isAdjustDialogOpen = false }) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "AJUSTAR SALDO DA BANCA", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = adjustAmountText,
                        onValueChange = { adjustAmountText = it },
                        label = { Text("Valor em Reais (R$)") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite,
                            focusedBorderColor = PrimaryRed,
                            unfocusedBorderColor = BorderDark
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = { isAdjustDialogOpen = false }) {
                            Text(text = "Cancelar", color = TextMuted)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                val v = adjustAmountText.replace(",", ".").toDoubleOrNull()
                                if (v != null && v >= 0) {
                                    onUpdateBankroll(v)
                                }
                                isAdjustDialogOpen = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed)
                        ) {
                            Text(text = "Salvar", color = TextWhite)
                        }
                    }
                }
            }
        }
    }
}
