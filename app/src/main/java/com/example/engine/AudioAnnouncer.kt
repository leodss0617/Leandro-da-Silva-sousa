package com.example.engine

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.speech.tts.TextToSpeech
import com.example.model.DoubleColor
import java.util.*

class AudioAnnouncer(private val context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var toneGen: ToneGenerator? = null

    init {
        try {
            tts = TextToSpeech(context, this)
            toneGen = ToneGenerator(AudioManager.STREAM_MUSIC, 80)
        } catch (e: Exception) {
            // Audio init fallback
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val ptLocale = Locale("pt", "BR")
            val res = tts?.setLanguage(ptLocale)
            if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.language = Locale.getDefault()
            }
            isTtsReady = true
        }
    }

    fun speak(text: String, voiceEnabled: Boolean) {
        if (!voiceEnabled || !isTtsReady || tts == null) return
        try {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts_${System.currentTimeMillis()}")
        } catch (e: Exception) {
            // Ignore speech failures
        }
    }

    fun playSignalSound(soundEnabled: Boolean, color: DoubleColor) {
        if (!soundEnabled) return
        try {
            when (color) {
                DoubleColor.WHITE -> {
                    toneGen?.startTone(ToneGenerator.TONE_PROP_PROMPT, 300)
                }
                DoubleColor.RED, DoubleColor.BLACK -> {
                    toneGen?.startTone(ToneGenerator.TONE_PROP_BEEP, 200)
                }
                else -> {}
            }
            vibrate(100)
        } catch (e: Exception) {}
    }

    fun playWinSound(soundEnabled: Boolean) {
        if (!soundEnabled) return
        try {
            toneGen?.startTone(ToneGenerator.TONE_PROP_ACK, 250)
            vibrate(150)
        } catch (e: Exception) {}
    }

    fun playLossSound(soundEnabled: Boolean) {
        if (!soundEnabled) return
        try {
            toneGen?.startTone(ToneGenerator.TONE_PROP_NACK, 250)
            vibrate(250)
        } catch (e: Exception) {}
    }

    fun playTarget80PercentAlert(soundEnabled: Boolean, voiceEnabled: Boolean) {
        if (soundEnabled) {
            try {
                toneGen?.startTone(ToneGenerator.TONE_CDMA_ALERT_NETWORK_LITE, 400)
            } catch (e: Exception) {}
        }
        if (voiceEnabled) {
            speak("Atenção: 80% da meta diária atingida!", voiceEnabled = true)
        }
        vibrate(300)
    }

    fun playTargetHitAlert(soundEnabled: Boolean, voiceEnabled: Boolean) {
        if (soundEnabled) {
            try {
                toneGen?.startTone(ToneGenerator.TONE_CDMA_HIGH_L, 600)
            } catch (e: Exception) {}
        }
        if (voiceEnabled) {
            speak("Meta de lucro diária atingida com sucesso! Parabéns!", voiceEnabled = true)
        }
        vibrate(500)
    }

    private fun vibrate(ms: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                val vibrator = vibratorManager?.defaultVibrator
                vibrator?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(ms)
                }
            }
        } catch (e: Exception) {}
    }

    fun release() {
        try {
            tts?.stop()
            tts?.shutdown()
            toneGen?.release()
        } catch (e: Exception) {}
    }
}
