package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.ScreenTab
import com.example.ui.theme.*

data class NavItem(
    val tab: ScreenTab,
    val title: String,
    val icon: ImageVector,
    val testTag: String
)

@Composable
fun BottomNav(
    currentTab: ScreenTab,
    onTabSelected: (ScreenTab) -> Unit
) {
    val items = listOf(
        NavItem(ScreenTab.HOME, "Início", Icons.Default.Home, "tab_home"),
        NavItem(ScreenTab.HISTORY, "Histórico", Icons.Default.History, "tab_history"),
        NavItem(ScreenTab.BLAZE, "Blaze", Icons.Default.Analytics, "tab_blaze"),
        NavItem(ScreenTab.BRAIN, "Brain IA", Icons.Default.Psychology, "tab_brain"),
        NavItem(ScreenTab.BANKROLL, "Banca", Icons.Default.AccountBalanceWallet, "tab_bankroll"),
        NavItem(ScreenTab.MEGA, "Mega Troia", Icons.Default.Calculate, "tab_mega"),
        NavItem(ScreenTab.CONFIG, "Config", Icons.Default.Settings, "tab_config")
    )

    NavigationBar(
        containerColor = SurfaceDark,
        tonalElevation = 8.dp,
        modifier = Modifier
            .fillMaxWidth()
            .testTag("bottom_navigation_bar")
    ) {
        items.forEach { item ->
            val selected = currentTab == item.tab
            NavigationBarItem(
                selected = selected,
                onClick = { onTabSelected(item.tab) },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.title,
                        modifier = Modifier.size(20.dp)
                    )
                },
                label = {
                    Text(
                        text = item.title,
                        fontSize = 9.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                        maxLines = 1
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PrimaryRed,
                    selectedTextColor = PrimaryRed,
                    unselectedIconColor = TextMuted,
                    unselectedTextColor = TextMuted,
                    indicatorColor = PrimaryRed.copy(alpha = 0.12f)
                ),
                modifier = Modifier.testTag(item.testTag)
            )
        }
    }
}
