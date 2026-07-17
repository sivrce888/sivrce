import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import I18nProvider from "@/components/I18nProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/brand";
import { jsonLd } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  // Latin-only subsets; Georgian text uses Noto below — save the preload slot
  preload: false,
});

const notoGeorgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  variable: "--font-noto-georgian",
  display: "swap",
  preload: true,
});

const SITE_URL = "https://sivrce.ge";
const SITE_NAME = "sivrce";
const SITE_TITLE = "უძრავი ქონება საქართველოში — ბინები, სახლები იყიდება და ქირავდება | sivrce";
const SITE_DESCRIPTION =
  "სივრცე — საქართველოს №1 ტექნოლოგიური უძრავი ქონების პლატფორმა. ბინები, სახლები, აგარაკები, მიწა და კომერციული ფართები იყიდება და ქირავდება — ინტერაქტიული 3D რუკით და AI ფასის შეფასებით.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | sivrce`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "უძრავი ქონება",
    "ბინები იყიდება",
    "ბინები ქირავდება",
    "ბინები დღიურად",
    "დღიური ქირა",
    "ქირავდება ბინა",
    "იყიდება ბინა",
    "სახლები იყიდება",
    "აგარაკები",
    "მიწის ნაკვეთები",
    "კომერციული ფართები",
    "ახალი პროექტები თბილისში",
    "უძრავი ქონება თბილისში",
    "უძრავი ქონება ბათუმში",
    "უძრავი ქონება ქუთაისში",
    "real estate georgia",
    "apartments tbilisi",
    "apartments batumi",
    "sivrce",
    "სივრცე",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Real Estate",
  alternates: {
    canonical: "/",
    languages: {
      "ka-GE": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ka_GE",
    alternateLocale: ["en_US", "ru_RU", "he_IL", "ar_SA", "tr_TR", "uk_UA", "hy_AM", "az_AZ"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "sivrce — უძრავი ქონება ერთ სივრცეში",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/images/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.colors.navy },
    { media: "(prefers-color-scheme: dark)", color: BRAND.colors.navy },
  ],
};

const siteLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: "სივრცე",
      description: SITE_DESCRIPTION,
      inLanguage: "ka",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      // Speakable: marks site identity/headline for voice assistants
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".speakable-lead"],
      },
    },
    {
      "@type": "RealEstateAgent",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: "სივრცე",
      url: SITE_URL,
      logo: `${SITE_URL}/logo/sivrce-mark.svg`,
      email: "info@sivrce.ge",
      address: {
        "@type": "PostalAddress",
        addressLocality: "თბილისი",
        addressCountry: "GE",
      },
      areaServed: {
        "@type": "Country",
        name: "Georgia",
      },
    },
    // SiteNavigationElement — exposes the main menu so Google can render
    // sitelinks in search results.
    {
      "@type": "SiteNavigationElement",
      name: "მთავარი ნავიგაცია",
      url: `${SITE_URL}/`,
      potentialAction: {
        "@type": "ItemList",
        itemListElement: [
          { "@type": "SiteNavigationElement", name: "იყიდება", url: `${SITE_URL}/sale` },
          { "@type": "SiteNavigationElement", name: "ქირავდება", url: `${SITE_URL}/rent` },
          { "@type": "SiteNavigationElement", name: "დღიურად", url: `${SITE_URL}/daily` },
          { "@type": "SiteNavigationElement", name: "ძიება", url: `${SITE_URL}/search` },
          { "@type": "SiteNavigationElement", name: "უბნები", url: `${SITE_URL}/neighborhoods` },
          { "@type": "SiteNavigationElement", name: "ახალი პროექტები", url: `${SITE_URL}/projects` },
          { "@type": "SiteNavigationElement", name: "ბლოგი", url: `${SITE_URL}/blog` },
        ],
      },
    },
  ],
};

export default function RootLayout({
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-sv-blue focus:px-4 focus:py-2 focus:text-white"
        >
          მთავარ შინაარსზე გადასვლა
        </a>
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(siteLd) }}
        />
      </body>
    </html>
  );
}
