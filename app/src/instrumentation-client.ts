/**
 * Runs before hydration (Next instrumentation-client).
 *
 * React 19.2 logs a dev-only error whenever it client-creates any executable
 * <script> — e.g. next-themes' pre-hydration theme script and our layouts'
 * lite-boot during soft navigations across root layouts. Those scripts are
 * SSR-only by design: lite-boot gates first paint on full loads and
 * next-themes re-applies the theme via effects, so nothing relies on
 * client-created script execution. Filter exactly that false positive;
 * keep everything else loud. ponytail: revisit if React ships an opt-out.
 */
if (process.env.NODE_ENV === "development") {
  const origError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return
    }
    origError(...args)
  }
}
