import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import Script from "next/script";
import CurrencyProvider from "@/components/CurrencyProvider";
import I18nProvider from "@/components/I18nProvider";
import PostHogProvider from "@/components/PostHogProvider";
import ChatShell from "@/components/chat/ChatShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { SWRegister } from "@/app/sw-register";
import { BRAND } from "@/lib/brand";
import { jsonLd } from "@/lib/utils";
import "./globals.css";

const GTM_ID = "GTM-W5KLL4K3";
const GA_ID = "G-T90P2YSK4B";

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
      ka: "/",
      en: "/en",
      ru: "/ru",
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
          { "@type": "SiteNavigationElement", name: "3D რუკა", url: `${SITE_URL}/map` },
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* Analytics boot on first interaction or 3.5s after load — never inside the LCP window */}
        <Script id="analytics-boot" strategy="lazyOnload">{`
          (function(){
            var loaded=false;
            function boot(){
              if(loaded)return;loaded=true;
              window.dataLayer=window.dataLayer||[];
              window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
              var gtm=document.createElement('script');gtm.async=true;
              gtm.src='https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';
              document.head.appendChild(gtm);
              var g=document.createElement('script');g.async=true;
              g.src='https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
              g.onload=function(){
                function gtag(){dataLayer.push(arguments);}
                gtag('js',new Date());
                gtag('config','${GA_ID}');
              };
              document.head.appendChild(g);
              var c=document.createElement('script');c.async=true;
              c.src='https://counter.top.ge/counter.js';
              document.body.appendChild(c);
            }
            ['pointerdown','keydown','scroll','touchstart'].forEach(function(e){
              window.addEventListener(e,boot,{once:true,passive:true});
            });
            setTimeout(boot,3500);
          })();
        `}</Script>
        <a
          href="#main"
          className="sr-only bg-sv-blue text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:px-4 focus:py-2"
        >
          მთავარ შინაარსზე გადასვლა
        </a>
        <ThemeProvider>
          <I18nProvider>
            <CurrencyProvider>
              <Suspense fallback={null}>
                <PostHogProvider>
                  <ChatShell>{children}</ChatShell>
                </PostHogProvider>
              </Suspense>
            </CurrencyProvider>
          </I18nProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
        <SWRegister />
        {/* TOP.GE async counter — script injected by analytics-boot above */}
        <div id="top-ge-counter-container" data-site-id="117677" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(siteLd) }}
        />
      </body>
    </html>
  );
}
