'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

import { BRAND } from '@/lib/brand'
import { isNative } from '@/lib/native'

/**
 * Bridge between the Capacitor shell (iOS/Android) and the web app.
 *
 * Every plugin import is dynamic and only reached when `isNative()` is true,
 * so the browser bundle never downloads Capacitor code. Handles the three
 * things a WebView app gets wrong without help:
 *  - Android hardware back button (history first, exit at root)
 *  - status bar style following the app theme (light content on light theme)
 *  - splash screen dismissed as soon as the app is interactive
 */
export function NativeShell() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!isNative()) return
    let disposed = false
    let removeBack: (() => void) | undefined

    void (async () => {
      try {
        // @capacitor/app, not @capacitor/core: core has no App export, so the
        // destructure left App undefined, the throw landed in the catch below
        // and Android's hardware back button silently did nothing.
        const [{ App }, { SplashScreen }] = await Promise.all([
          import('@capacitor/app'),
          import('@capacitor/splash-screen'),
        ])
        SplashScreen.hide().catch(() => {})
        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) window.history.back()
          else void App.exitApp()
        })
        if (disposed) void listener.remove()
        else removeBack = () => void listener.remove()
      } catch {
        // ponytail: native plugin missing — degrade to WebView defaults
      }
    })()

    return () => {
      disposed = true
      removeBack?.()
    }
  }, [])

  useEffect(() => {
    if (!isNative() || !resolvedTheme) return
    void (async () => {
      try {
        const [{ Capacitor }, { StatusBar, Style }] = await Promise.all([
          import('@capacitor/core'),
          import('@capacitor/status-bar'),
        ])
        await StatusBar.setStyle({ style: resolvedTheme === 'dark' ? Style.Dark : Style.Light })
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: BRAND.colors.navy }).catch(() => {})
        }
      } catch {
        // iOS pre-13 / plugin absent — status bar stays at Info.plist default
      }
    })()
  }, [resolvedTheme])

  return null
}
