"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_ID } from "@/lib/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function GaPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const gtag = window.gtag;
    if (!gtag) return;
    const qs = searchParams?.size ? `?${searchParams.toString()}` : "";
    gtag("config", GA_ID, { page_path: `${pathname}${qs}` });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GaPageview />
    </Suspense>
  );
}
