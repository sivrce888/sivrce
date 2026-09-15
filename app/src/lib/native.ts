/**
 * Capacitor native-shell detection.
 *
 * Reads the `window.Capacitor` global the Capacitor runtime injects into its
 * own WebView, so callers never import `@capacitor/core` on the web path —
 * the web bundle pays zero bytes for the native bridge.
 */
interface CapacitorGlobal {
  isNativePlatform?: boolean
  getPlatform?: () => string
}

export function isNative(win?: { Capacitor?: CapacitorGlobal }): boolean {
  const g =
    win ??
    (typeof window === 'undefined' ? undefined : (window as unknown as { Capacitor?: CapacitorGlobal }))
  return g?.Capacitor?.isNativePlatform === true
}
