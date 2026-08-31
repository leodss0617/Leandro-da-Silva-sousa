package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.CollectorState
import com.example.ui.theme.*
import java.util.Locale

@Composable
fun Header(
    collectorState: CollectorState,
    bankroll: Double,
    soundEnabled: Boolean,
    onToggleSound: () -> Unit,
    onOpenCollector: () -> Unit
) {
    val statusColor = when (collectorState.status) {
        "live" -> SuccessGreen
        "connecting" -> WarningOrange
        "error" -> PrimaryRed
        else -> TextMuted
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceDark)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // App Title & Collector Pill
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "LEANDRO",
                    color = PrimaryRed,
                    fontWeight = FontWeight.Black,
                    fontSize = 17.sp,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "DOUBLE IA",
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    letterSpacing = 0.5.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = PrimaryRed.copy(alpha = 0.15f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryRed.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = "v2.9",
                        color = PrimaryRed,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(3.dp))

            // Live Collector Status Pill
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onOpenCollector() }
                    .padding(vertical = 2.dp)
                    .testTag("collector_status_button")
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(statusColor)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = collectorState.statusText,
                    color = TextMuted,
                    fontSize = 11.sp,
                    maxLines = 1
                )
                if (collectorState.latencyMs > 0) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "• ${collectorState.latencyMs}ms",
                        color = TextDim,
                        fontSize = 10.sp
                    )
                }
            }
        }

        // Actions: Bankroll badge & Sound Toggle
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Bankroll Pill
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = SurfaceDark2,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                modifier = Modifier.testTag("header_bankroll_pill")
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountBalanceWallet,
                        contentDescription = "Banca",
                        tint = SuccessGreen,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(5.dp))
                    Text(
                        text = String.format(Locale.GERMANY, "R$ %.2f", bankroll),
                        color = TextWhite,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // Sound Toggle Icon Button
            IconButton(
                onClick = onToggleSound,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(SurfaceDark2)
                    .testTag("sound_toggle_button")
            ) {
                Icon(
                    imageVector = if (soundEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                    contentDescription = "Alternar Som",
                    tint = if (soundEnabled) PrimaryRed else TextMuted,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
