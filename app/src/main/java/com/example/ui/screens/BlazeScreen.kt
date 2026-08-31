package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
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
import java.util.Calendar
import kotlin.math.roundToInt

@Composable
fun BlazeScreen(
    rounds: List<Round>
) {
    val intervals = remember(rounds) { PredictionEngine.analyzeWhiteIntervals(rounds) }
    val hotCold = remember(rounds) { PredictionEngine.analyzeHotCold(rounds, 100) }
    val pullers = remember(rounds) { PredictionEngine.analyzePullers(rounds) }
    val seqs = remember(rounds) { PredictionEngine.detectSequences(rounds.map { it.color }) }
    val minu = remember(rounds) { PredictionEngine.minutagemSignal(rounds) }

    val currentMinuteTerminal = remember { Calendar.getInstance().get(Calendar.MINUTE) % 10 }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp)
            .testTag("blaze_screen"),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Screen Header
        item {
            Column {
                Text(
                    text = "ESTUDO E PADRÕES BLAZE",
                    color = TextWhite,
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    letterSpacing = 0.5.sp
                )
                Text(
                    text = "Mapeamento em tempo real de minutos, puxadores e intervalos",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }
        }

        // 1. White Intervals Meter Card
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
                        Text(
                            text = "INTERVALO DO BRANCO (14X)",
                            color = TextWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = if (intervals.current >= 20) PrimaryRed.copy(alpha = 0.2f) else SuccessGreen.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = if (intervals.current >= 20) "BRANCO PRÓXIMO" else "INTERVALO NORMAL",
                                color = if (intervals.current >= 20) PrimaryRed else SuccessGreen,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricBox(label = "Sem Branco", value = "${intervals.current} rodadas", highlight = intervals.current >= 20, modifier = Modifier.weight(1f))
                        MetricBox(label = "Média Histórica", value = "${intervals.avg.roundToInt()} rodadas", highlight = false, modifier = Modifier.weight(1f))
                        MetricBox(label = "Maior Intervalo", value = "${intervals.max} rodadas", highlight = false, modifier = Modifier.weight(1f))
                    }
                }
            }
        }

        // 2. Minutagem Map (0-9 Terminais)
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
                        Text(
                            text = "MAPA DE MINUTAGEM (TERMINAIS 0-9)",
                            color = TextWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                        Text(
                            text = "Minuto Atual: *$currentMinuteTerminal",
                            color = WarningOrange,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Grid 0-9
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        (0..9).forEach { terminal ->
                            val isCurrent = terminal == currentMinuteTerminal
                            val isTarget = minu != null && terminal == minu.targetTerminal
                            val isMirror = minu != null && terminal == minu.mirrorTerminal

                            val bgColor = when {
                                isTarget -> PrimaryRed
                                isMirror -> WarningOrange
                                isCurrent -> ChipWhite
                                else -> SurfaceDark2
                            }
                            val txtColor = if (isCurrent) Color.Black else TextWhite

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(bgColor)
                                    .border(
                                        1.dp,
                                        if (isCurrent) TextWhite else BorderDark,
                                        RoundedCornerShape(6.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "$terminal",
                                        color = txtColor,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 13.sp
                                    )
                                    if (isTarget) {
                                        Text(text = "ALVO", color = TextWhite, fontSize = 7.sp, fontWeight = FontWeight.Bold)
                                    } else if (isMirror) {
                                        Text(text = "ESP", color = TextWhite, fontSize = 7.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    if (minu != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Último Branco no min ${minu.whiteMinute} com puxador #${minu.afterNumber} → Alvo terminal ${minu.targetTerminal} (Espelho ${minu.mirrorTerminal})",
                            color = TextDim,
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }

        // 3. Hot & Cold Numbers Table
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "NÚMEROS QUENTES & FRIOS (ÚLTIMAS 100 RODADAS)",
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(text = "Mais Frequentes (Quentes 🔥):", color = PrimaryRed, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        hotCold.hot.forEach { item ->
                            NumberStatBadge(num = item.number, count = item.count, color = item.color, modifier = Modifier.weight(1f))
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(text = "Menos Frequentes (Frios ❄️):", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        hotCold.cold.forEach { item ->
                            NumberStatBadge(num = item.number, count = item.count, color = item.color, modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        // 4. Pullers Ranking & Active Sequences
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Top Pullers
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = SurfaceDark,
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(text = "TOP PUXADORES DE BRANCO", color = TextWhite, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        if (pullers.isEmpty()) {
                            Text(text = "Aguardando histórico...", color = TextDim, fontSize = 11.sp)
                        } else {
                            pullers.take(4).forEach { p ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = "#${p.number}", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                    Text(text = "${p.count}x puxou", color = SuccessGreen, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }

                // Active Patterns
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = SurfaceDark,
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(text = "PADRÕES DETECTADOS", color = TextWhite, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        if (seqs.isEmpty()) {
                            Text(text = "Fluxo aleatório", color = TextDim, fontSize = 11.sp)
                        } else {
                            seqs.take(3).forEach { s ->
                                Column(modifier = Modifier.padding(vertical = 2.dp)) {
                                    Text(text = s.name, color = WarningOrange, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                    Text(text = "Indica ${s.suggest.ptName}", color = TextWhite, fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MetricBox(label: String, value: String, highlight: Boolean, modifier: Modifier = Modifier) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = SurfaceDark2,
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(8.dp)) {
            Text(text = label, color = TextDim, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                color = if (highlight) PrimaryRed else TextWhite,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
fun NumberStatBadge(num: Int, count: Int, color: DoubleColor, modifier: Modifier = Modifier) {
    val chipColor = when (color) {
        DoubleColor.RED -> ChipRed
        DoubleColor.BLACK -> ChipBlack
        DoubleColor.WHITE -> ChipWhite
        else -> ChipBlack
    }
    val txtColor = if (color == DoubleColor.WHITE) Color.Black else TextWhite

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = SurfaceDark2,
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(chipColor),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "$num", color = txtColor, fontWeight = FontWeight.Black, fontSize = 11.sp)
            }
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = "${count}x", color = TextDim, fontSize = 9.sp)
        }
    }
}
