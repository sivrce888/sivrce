import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import CurrencyProvider from "@/components/CurrencyProvider";
import I18nProvider from "@/components/I18nProvider";
import PostHogProvider from "@/components/PostHogProvider";
import ChatShell from "@/components/chat/ChatShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { SWRegister } from "@/app/sw-register";
import { BRAND } from "@/lib/brand";
import { isValidLang, RTL_LANGS, type Lang } from "@/lib/i18n/core";
import { langAlternates, OG_LOCALE, SITE_META } from "@/lib/i18n/server";
import { getCmsOverrides } from "@/lib/cms";
import { jsonLd } from "@/lib/utils";
// globals.css lives in app/layout.tsx — import here is silently dropped from
// production CSS <link>s for the dynamic [lang] segment (see root layout).

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
  // ponytail: optional, not swap — the h1 LCP was re-recorded ~3s after FCP when
  // the 41KB Georgian face swapped in. Fallback paints once and stays; cached
  // font is still used on repeat navs. Brand stack unchanged.
  display: "optional",
  // No preload: keeps the 41KB face off the LCP critical path on slow 4G —
  // it still downloads post-paint and serves from cache on repeat navs.
  preload: false,
});

const SITE_URL = "https://sivrce.ge";
const SITE_NAME = "sivrce";

// Prerender ka/en/ru at build (the migration target); the other six locales
// stay valid via isValidLang below and render on demand (dynamicParams default).
const SSG_LANGS: readonly Lang[] = ["ka", "en", "ru"];

export function generateStaticParams() {
  return SSG_LANGS.map((lang) => ({ lang }));
}

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LangLayoutProps): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Lang = isValidLang(raw) ? raw : "ka";
  // CMS overrides win over coded meta (/admin/content/pages → SEO meta).
  const cms = await getCmsOverrides(lang);
  const siteTitle = cms["seo.site.title"] ?? SITE_META[lang].title;
  const siteDescription = cms["seo.site.description"] ?? SITE_META[lang].description;
  const root = lang === "ka" ? "/" : `/${lang}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template: `%s | sivrce`,
    },
    description: siteDescription,
    keywords: [
      "უძრავი ქონება",
      "განცხადებები",
      "ბინები",
      "ბინები ქირით",
      "იყიდება ბინები",
      "ბინები დღიურად",
      "ქირავდება 1 ოთახიანი ბინა",
      "იყიდება 1 ოთახიანი ბინა",
      "ბინები დღიურად ქობულეთში",
      "ქირავდება 2 ოთახიანი ბინა",
      "იყიდება 2 ოთახიანი ბინა",
      "ქირავდება 3 ოთახიანი ბინა",
      "იყიდება 3 ოთახიანი ბინა",
      "ქირავდება 4 ოთახიანი ბინა",
      "იყიდება 4 ოთახიანი ბინა",
      "ბინა ბაკურიანში",
      "ბინები ქობულეთში",
      "ქირავდება კომერციული ფართი",
      "იყიდება კერძო სახლი",
      "ბინები საბურთალოზე",
      "ბინები ქირით ვარკეთილში",
      "იყიდება მიწა",
      "ბინები ვაკეში",
      "ბინები იყიდება",
      "ბინები ქირავდება",
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
      canonical: root,
      languages: langAlternates("/"),
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[lang],
      url: `${SITE_URL}${root === "/" ? "" : root}`,
      siteName: SITE_NAME,
      title: siteTitle,
      description: siteDescription,
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
      title: siteTitle,
      description: siteDescription,
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
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Notch-safe; no maxScale lock (hurts a11y / Lighthouse).
  viewportFit: "cover",
  colorScheme: "light dark",
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
      logo: `${SITE_URL}/logo/mark.png`,
      email: "hi@sivrce.ge",
      // ponytail: E-E-A-T signals for the YMYL real-estate vertical. Founder
      // kept as brand entity (no named individual to fabricate); foundingDate
      // + knowsAbout anchor expertise without inventing people.
      foundingDate: "2025",
      knowsAbout: [
        "საქართველოს უძრავი ქონების ბაზარი",
        "თბილისის უბნები და ფასები",
        "ბათუმის საკურორტო უძრავი ქონება",
        "იპოთეკა საქართველოში",
        "უცხოელებისთვის ქონების ყიდვა საქართველოში",
        "AI ფასის შეფასება",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "თბილისი",
        addressCountry: "GE",
      },
      areaServed: [
        { "@type": "City", name: "თბილისი" },
        { "@type": "City", name: "ბათუმი" },
        { "@type": "City", name: "ქუთაისი" },
        { "@type": "Country", name: "Georgia" },
      ],
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

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang: raw } = await params;
  // Invalid locale prefix ("/xx/search") → 404 via the root not-found page.
  if (!isValidLang(raw)) notFound();
  const lang = raw;
  // CMS text overrides for this locale (cached; empty when nothing is overridden).
  const cmsOverrides = await getCmsOverrides(lang);

  return (
    <html
      lang={lang}
      dir={RTL_LANGS.has(lang) ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${manrope.variable} ${notoGeorgian.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Critical font preloads (React hoists <link> to <head>).
            ponytail: surgical — only the two chunks the h1/LCP depends on.
            The 42KB Georgian face paints the h1; the 14KB latin chunk was
            discovered ~750ms post-hydration and its late arrival re-recorded
            LCP (~1s observed → ~5.5s simulated). Preloading kills the late
            candidate. Hashed names are stable per next/font version — if a
            bump changes them, update or drop these two lines. */}
        <link
          rel="preload"
          href="/_next/static/media/9a4536d8acff75fc-s.05m5z8ok51pb_.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/060be04954aa38c2-s.2_iuqcuewr555.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
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
          {/* ponytail: no a11y dict keys yet — hardcoded ka until the dicts grow them */}
          მთავარ შინაარსზე გადასვლა
        </a>
        <ThemeProvider>
          {/* URL is the locale source of truth: pin the provider so SSR HTML
              is fully translated for the requested locale (no client flip). */}
          <I18nProvider initialLang={lang} overrides={cmsOverrides}>
            <CurrencyProvider>
              <PostHogProvider>
                <ChatShell>{children}</ChatShell>
              </PostHogProvider>
            </CurrencyProvider>
          </I18nProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
        <SWRegister />
        {/* TOP.GE container lives in Footer, left of terms links */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(siteLd) }}
        />
      </body>
    </html>
  );
}
