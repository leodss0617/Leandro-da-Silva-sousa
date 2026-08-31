package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.DoubleColor
import com.example.model.PredictionResult
import com.example.ui.theme.*
import kotlin.math.roundToInt

@Composable
fun FloatingBubble(
    prediction: PredictionResult?,
    show: Boolean,
    onClick: () -> Unit
) {
    if (!show || prediction == null) return

    val color = prediction.color
    val chipColor = when (color) {
        DoubleColor.RED -> ChipRed
        DoubleColor.BLACK -> ChipBlack
        DoubleColor.WHITE -> ChipWhite
        else -> TextMuted
    }
    val textColor = if (color == DoubleColor.WHITE) Color(0xFF0A0A0C) else TextWhite
    val confPct = (prediction.confidence * 100).roundToInt()

    Surface(
        shape = RoundedCornerShape(24.dp),
        color = SurfaceDark,
        border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryRed.copy(alpha = 0.5f)),
        modifier = Modifier
            .shadow(12.dp, RoundedCornerShape(24.dp))
            .clickable { onClick() }
            .testTag("floating_prediction_bubble")
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(26.dp)
                    .clip(CircleShape)
                    .background(chipColor)
                    .border(1.dp, TextWhite.copy(alpha = 0.4f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (color == DoubleColor.WHITE) "W" else if (color == DoubleColor.RED) "V" else if (color == DoubleColor.BLACK) "P" else "?",
                    color = textColor,
                    fontWeight = FontWeight.Black,
                    fontSize = 11.sp
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            Column {
                Text(
                    text = color.label,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
                Text(
                    text = "$confPct% conf",
                    color = SuccessGreen,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
