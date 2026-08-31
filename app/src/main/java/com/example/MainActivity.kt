package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.model.ScreenTab
import com.example.ui.components.*
import com.example.ui.screens.*
import com.example.ui.theme.BgDark
import com.example.ui.theme.LeandroDoubleTheme
import com.example.ui.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            LeandroDoubleTheme {
                val currentTab by viewModel.currentTab.collectAsState()
                val rounds by viewModel.rounds.collectAsState()
                val signals by viewModel.signals.collectAsState()
                val preferences by viewModel.preferences.collectAsState()
                val brainState by viewModel.brainState.collectAsState()
                val megaState by viewModel.megaState.collectAsState()
                val bankroll by viewModel.bankroll.collectAsState()
                val dayWins by viewModel.dayWins.collectAsState()
                val dayLosses by viewModel.dayLosses.collectAsState()
                val dayPL by viewModel.dayPL.collectAsState()
                val prediction by viewModel.prediction.collectAsState()
                val collectorState by viewModel.collectorState.collectAsState()
                val isCollectorModalOpen by viewModel.isCollectorModalOpen.collectAsState()
                val toastMessage by viewModel.toastMessage.collectAsState()
                val isTargetDismissed by viewModel.isTargetBannerDismissed.collectAsState()

                val snackbarHostState = remember { SnackbarHostState() }

                LaunchedEffect(toastMessage) {
                    toastMessage?.let { msg ->
                        snackbarHostState.showSnackbar(msg)
                        viewModel.clearToast()
                    }
                }

                Scaffold(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(BgDark)
                        .testTag("main_activity_scaffold"),
                    topBar = {
                        Header(
                            collectorState = collectorState,
                            bankroll = bankroll,
                            soundEnabled = preferences.soundEnabled,
                            onToggleSound = {
                                viewModel.updatePreferences(preferences.copy(soundEnabled = !preferences.soundEnabled))
                            },
                            onOpenCollector = { viewModel.setCollectorModalOpen(true) }
                        )
                    },
                    bottomBar = {
                        BottomNav(
                            currentTab = currentTab,
                            onTabSelected = { viewModel.setTab(it) }
                        )
                    },
                    snackbarHost = { SnackbarHost(snackbarHostState) },
                    contentWindowInsets = WindowInsets.systemBars
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                            .background(BgDark)
                    ) {
                        AnimatedContent(
                            targetState = currentTab,
                            label = "tab_transition",
                            transitionSpec = {
                                fadeIn() togetherWith fadeOut()
                            }
                        ) { targetTab ->
                            when (targetTab) {
                                ScreenTab.HOME -> HomeScreen(
                                    rounds = rounds,
                                    prediction = prediction,
                                    preferences = preferences,
                                    bankroll = bankroll,
                                    dayWins = dayWins,
                                    dayLosses = dayLosses,
                                    dayPL = dayPL,
                                    isTargetDismissed = isTargetDismissed,
                                    onDismissTarget = { viewModel.dismissTargetBanner() },
                                    onManualAddRound = { viewModel.addManualRound(it) },
                                    onSyncNow = { viewModel.syncHistoryNow() },
                                    onTestSignal = { viewModel.triggerTestSignal() },
                                    onNavigateToTab = { viewModel.setTab(it) }
                                )
                                ScreenTab.HISTORY -> HistoryScreen(
                                    rounds = rounds,
                                    signals = signals,
                                    onClearHistory = { viewModel.clearAllRounds() }
                                )
                                ScreenTab.BLAZE -> BlazeScreen(
                                    rounds = rounds
                                )
                                ScreenTab.BRAIN -> BrainScreen(
                                    brain = brainState,
                                    preferences = preferences,
                                    bankroll = bankroll,
                                    dayWins = dayWins,
                                    dayLosses = dayLosses,
                                    dayPL = dayPL,
                                    onToggleBrain = { viewModel.toggleBrainEnabled(it) },
                                    onUpdatePrefs = { viewModel.updatePreferences(it) }
                                )
                                ScreenTab.BANKROLL -> BankrollScreen(
                                    bankroll = bankroll,
                                    dayWins = dayWins,
                                    dayLosses = dayLosses,
                                    dayPL = dayPL,
                                    preferences = preferences,
                                    onUpdateBankroll = { viewModel.updateBankroll(it) },
                                    onResetDailyStats = { viewModel.resetDailyStats() },
                                    onUpdatePrefs = { viewModel.updatePreferences(it) }
                                )
                                ScreenTab.MEGA -> MegaScreen(
                                    megaState = megaState,
                                    onUpdateMega = { t, b, m -> viewModel.updateMegaTroia(t, b, m) },
                                    onSetEntry = { viewModel.setMegaEntry(it) },
                                    onToggleEnabled = { viewModel.toggleMegaEnabled(it) }
                                )
                                ScreenTab.CONFIG -> ConfigScreen(
                                    preferences = preferences,
                                    onUpdatePrefs = { viewModel.updatePreferences(it) },
                                    onClearHistory = { viewModel.clearAllRounds() }
                                )
                            }
                        }

                        // Floating Bubble (if enabled and on tabs other than Home)
                        if (preferences.showBubble && currentTab != ScreenTab.HOME) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(end = 16.dp, bottom = 16.dp)
                            ) {
                                FloatingBubble(
                                    prediction = prediction,
                                    show = true,
                                    onClick = { viewModel.setTab(ScreenTab.HOME) }
                                )
                            }
                        }

                        // Collector Modal Dialog
                        CollectorModal(
                            isOpen = isCollectorModalOpen,
                            collectorState = collectorState,
                            onClose = { viewModel.setCollectorModalOpen(false) },
                            onSyncNow = { viewModel.syncHistoryNow() },
                            onSelectMirror = { mirror ->
                                viewModel.updatePreferences(preferences.copy(collectorMirror = mirror))
                            },
                            onSelectMode = { mode ->
                                viewModel.updatePreferences(preferences.copy(collectorMode = mode))
                            }
                        )
                    }
                }
            }
        }
    }
}
