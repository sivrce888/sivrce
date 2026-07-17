import type { CapacitorConfig } from '@capacitor/cli'

const isDev = process.env.NODE_ENV === 'development'

const config: CapacitorConfig = {
  appId: 'ge.sivrce.app',
  appName: 'sivrce',
  webDir: 'out',
  // ponytail: dev loads local server, prod loads deployed URL via WebView
  server: isDev
    ? {
        url: 'http://192.168.1.100:3000',
        cleartext: true,
      }
    : {
        hostname: 'sivrce.ge',
        androidScheme: 'https',
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
