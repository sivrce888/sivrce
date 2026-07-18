import type { ReactNode } from "react";
import "./globals.css";

/**
 * Root CSS entry. next/font CSS is emitted by the segment layouts that own
 * <html>; Tailwind/globals must live here — a CSS import only in
 * app/[lang]/layout is dropped from the production <link> tags (auth, a
 * static segment, still got the 151KB chunk; / and /en did not).
 *
 * ponytail: children-only root. [lang] + auth each own <html>/<body>.
 * Ceiling: if Next tightens the multi-root rule, fold into route groups.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
