import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import I18nProvider from "@/components/I18nProvider";
import PostHogProvider from "@/components/PostHogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { GoogleTags } from "@/components/GoogleTags";
import { GTM_ID } from "@/lib/analytics";
import { BRAND } from "@/lib/brand";
import { LITE_BOOT } from "@/lib/device-budget";
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
  display: "swap",
  preload: false,
});

const notoGeorgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  variable: "--font-noto-georgian",
  display: "optional",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sivrce.ge"),
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
        <Script id="lite-boot" strategy="beforeInteractive">
          {LITE_BOOT}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <GoogleTags />
        <ThemeProvider>
          <I18nProvider>
            <PostHogProvider>{children}</PostHogProvider>
          </I18nProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
