import type { CapacitorConfig } from '@capacitor/cli'

const isDev = process.env.NODE_ENV === 'development'

const config: CapacitorConfig = {
  appId: 'ge.sivrce.app',
  appName: 'sivrce',
  webDir: 'mobile',
  // ponytail: dev loads local dev server; prod loads deployed site via WebView
  server: isDev
    ? {
        url: 'http://localhost:3000',
        cleartext: true,
      }
    : {
        url: 'https://sivrce.ge',
        cleartext: false,
      },
  ios: {
    contentInset: 'automatic',
    scheme: 'sivrce',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#050B26',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#050B26',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
}

export default config
