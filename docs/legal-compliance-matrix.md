# Sivrce Germany — Legal Compliance Matrix

Status values: `IMPLEMENTED` (code exists + wired) · `SCAFFOLD` (route/page exists,
content is draft) · `MISSING`. Items marked **LEGAL_REVIEW_REQUIRED** need German
counsel before the DE launch. This file is engineering status, not legal advice.

| Area | Requirement | Status | Notes |
|---|---|---|---|
| Impressum | § 5 DDG provider identification | SCAFFOLD | `/legal/impressum` — owner data marked `[TODO-OWNER]`; **LEGAL_REVIEW_REQUIRED** |
| Datenschutz | GDPR/DSGVO privacy policy | SCAFFOLD | `/legal/datenschutz` de/en; **LEGAL_REVIEW_REQUIRED**; DPO designation decision open |
| AGB | Terms of use | SCAFFOLD | `/legal/agb`; full clause set (liability, jurisdiction, digital-content) **LEGAL_REVIEW_REQUIRED** |
| Cookies/ePrivacy | Consent for non-necessary cookies | MISSING | GTM/GA currently loads without a consent gate (`GoogleTags.tsx`); **LEGAL_REVIEW_REQUIRED** — keep analytics OFF for DE hosts until CMP lands |
| TDDDG | Telemedia data protection | SCAFFOLD | covered inside datenschutz/cookies; **LEGAL_REVIEW_REQUIRED** |
| Widerruf | Consumer withdrawal (Art. 246a EGBGB) | SCAFFOLD | `/legal/widerruf`; model text + digital-service carve-outs **LEGAL_REVIEW_REQUIRED** |
| Verbraucherinfo | Art. 246 ff. EGBGB | SCAFFOLD | `/legal/verbraucherinformationen`; OS-Platform link present |
| Partner disclosure | UWG § 5a ad labeling | PARTIAL | "Gesponsert" labeling in product; `/legal/partner-disclosures` drafted; thresholds **LEGAL_REVIEW_REQUIRED** |
| Data sources | Licensing of open data (dl-de, ODbL) | IMPLEMENTED | `/legal/data-sources` + source registry with per-source license fields |
| Content policy | UGC rules | SCAFFOLD | `/legal/content-policy` mirrors existing moderation engine |
| Takedown/DSA | Notice-and-action | PARTIAL | Backend Complaint/ModerationQueue models exist; `/legal/takedown` workflow documented; DSA deadlines **LEGAL_REVIEW_REQUIRED** |
| DSR | GDPR Art. 15–21 requests | PARTIAL | Self-service account deletion in settings; `/legal/privacy-request` mailto workflow; no export API yet |
| Accessibility | BFSG statement | SCAFFOLD | `/legal/accessibility`; WCAG 2.2 AA targeted in code; audit + **LEGAL_REVIEW_REQUIRED** |
| Brokerage | § 34c GewO scope | CLEAR | sivrce positions as platform, not broker; re-review if broker services added |
| Image licensing | No copyrighted scrapes | IMPLEMENTED | media pipeline uses owner-uploaded/derived assets only |
| Data transfers | EU hosting | OPEN | DB/host region decision; **LEGAL_REVIEW_REQUIRED** when DE data subjects onboard |

Owner action list (blocking DE launch): fill `[TODO-OWNER]` fields, engage counsel
for the six LEGAL_REVIEW_REQUIRED rows, decide CMP vendor, confirm analytics
stays dark on sivrce.de until consent exists.
