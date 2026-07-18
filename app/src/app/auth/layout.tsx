import type { Metadata } from "next";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import I18nProvider from "@/components/I18nProvider";
import PostHogProvider from "@/components/PostHogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
// globals.css: app/layout.tsx (root). Importing only here used to work; keep
// root as the single CSS entry so [lang] pages never lose the stylesheet.

/**
 * Tiny second root layout for the /auth tree (signin/signup/reset/onboarding).
 * Auth URLs stay unprefixed and locale-stable for OAuth callbacks and email
 * links. ponytail: ka chrome only, no ChatShell/SWRegister/analytics here —
 * the full shell lives in ../[lang]/layout.tsx. Upgrade path: localize auth
 * pages under [lang] once callback URLs are migrated.
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
