import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import I18nProvider from "@/components/I18nProvider";
import PostHogProvider from "@/components/PostHogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleTags } from "@/components/GoogleTags";
import ConsentBanner from "@/components/consent/ConsentBanner";
import { NativeShell } from "@/components/native/NativeShell";
import { BRAND } from "@/lib/brand";
import { apexOriginFor, hostKind } from "@/lib/site-host";
// globals.css: app/layout.tsx (root). Importing only here used to work; keep
// root as the single CSS entry so [lang] pages never lose the stylesheet.

/**
 * Tiny second root layout for the /auth tree (signin/signup/reset/onboarding).
 * Auth URLs stay unprefixed and locale-stable for OAuth callbacks and email
 * links. ponytail: ka chrome only, no ChatShell/SWRegister — full shell in
 * ../[lang]/layout.tsx. GA/GTM included for sign-in funnel attribution.
 */

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  // ponytail: optional like [lang]/layout — swap caused late-swap jank on auth LCP
  display: "optional",
  preload: false,
});

const notoGeorgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  variable: "--font-noto-georgian",
  display: "optional",
  preload: false,
});

// Host-aware: /auth serves on both origins (sivrce.ge signups and sivrce.com
// signups) — relative icons/og must resolve against the serving origin.
export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0]!;
  const origin = apexOriginFor(hostKind(host, process.env.VERCEL_ENV)) ?? "https://sivrce.ge";
  return {
    metadataBase: new URL(origin),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icons/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.colors.navy },
    { media: "(prefers-color-scheme: dark)", color: BRAND.colors.navy },
  ],
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ka"
      suppressHydrationWarning
      className={`${manrope.variable} ${notoGeorgian.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* No lite-boot here: auth has no data-reveal/heavy content to gate,
            and isLiteDevice() covers JS-side checks. A React-rendered script
            can't execute on client-mounted navigations anyway (React 19). */}
        {/* No GTM <noscript> iframe: without JS there is no way to collect
            consent, so firing the tag would be an unlawful pre-consent load. */}
        <GoogleTags />
        <ThemeProvider>
          <I18nProvider>
            <PostHogProvider>{children}</PostHogProvider>
            <ConsentBanner />
          </I18nProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
        {/* Android hardware back + status-bar theming must work on auth screens
            too — without it, pressing back in the native app exits instead of
            returning to where the user came from. */}
        <NativeShell />
      </body>
    </html>
  );
}
