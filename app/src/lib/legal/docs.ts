/**
 * German-market legal document registry.
 *
 * Content is DRAFT scaffolding: structure + factual platform behavior only.
 * Every doc carries legalReviewRequired until German counsel (Fachanwalt für
 * IT-Recht) signs off — the page renders a visible review banner from it.
 * Never present these as final legal advice; never remove the banner while
 * legalReviewRequired is true.
 *
 * Impressum entity fields use explicit [TODO-OWNER] markers — never invent
 * company registration data.
 */

export type LegalSection = { title: string; body: string[] }
export type LegalLocale = { title: string; description: string; sections: LegalSection[] }
export type LegalDoc = {
  slug: string
  /** de is canonical for this family; en fallback serves all other locales */
  de: LegalLocale
  en: LegalLocale
  legalReviewRequired: boolean
}

const CONTACT = 'hi@sivrce.ge'

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'impressum',
    legalReviewRequired: true,
    de: {
      title: 'Impressum',
      description: 'Anbieterkennzeichnung von sivrce gemäß § 5 DDG (ehemals § 5 TMG).',
      sections: [
        {
          title: 'Angaben gemäß § 5 DDG',
          body: [
            'Anbieter: sivrce — [TODO-OWNER: rechtstragende Gesellschaft]',
            'Vertreten durch: [TODO-OWNER: Geschäftsführung]',
            'Anschrift: [TODO-OWNER: ladungsfähige Anschrift]',
            'Kontakt: ' + CONTACT,
            'Umsatzsteuer-ID: [TODO-OWNER: USt-IdNr., falls vorhanden]',
          ],
        },
        {
          title: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV',
          body: ['[TODO-OWNER: Name und Anschrift des Verantwortlichen]'],
        },
        {
          title: 'Streitschlichtung',
          body: [
            'Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. LEGAL_REVIEW_REQUIRED: Teilnahmebereitschaft vom Betreiber bestätigen lassen.',
          ],
        },
      ],
    },
    en: {
      title: 'Imprint',
      description: 'Provider identification for sivrce under German law (§ 5 DDG).',
      sections: [
        {
          title: 'Provider information (§ 5 DDG)',
          body: [
            'Provider: sivrce — [TODO-OWNER: legal entity]',
            'Represented by: [TODO-OWNER: management]',
            'Address: [TODO-OWNER: serviceable address]',
            'Contact: ' + CONTACT,
            'VAT ID: [TODO-OWNER: VAT ID, if applicable]',
          ],
        },
        {
          title: 'Responsible for content (§ 18 (2) MStV)',
          body: ['[TODO-OWNER: name and address of the responsible person]'],
        },
        {
          title: 'Dispute resolution',
          body: [
            'We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board. LEGAL_REVIEW_REQUIRED: confirm participation stance with the owner.',
          ],
        },
      ],
    },
  },
  {
    slug: 'datenschutz',
    legalReviewRequired: true,
    de: {
      title: 'Datenschutzerklärung',
      description: 'Wie sivrce personenbezogene Daten verarbeitet — Erhebung, Nutzung, Speicherung und Ihre Rechte.',
      sections: [
        {
          title: '1. Verantwortlicher',
          body: [
            'Verantwortlich für die Datenverarbeitung: sivrce — [TODO-OWNER: rechtstragende Gesellschaft, Anschrift]. Kontakt: ' + CONTACT + '. LEGAL_REVIEW_REQUIRED: Benennung eines Datenschutzbeauftragten prüfen.',
          ],
        },
        {
          title: '2. Welche Daten wir verarbeiten',
          body: [
            'Suchanfragen, von Ihnen freiwillig angegebene Kontaktdaten (Name, E-Mail, Telefon), technische Geräte- und Browserinformationen sowie Inhalten, die Sie aktiv veröffentlichen (z. B. Inserate). Favoriten bleiben lokal auf Ihrem Gerät und werden nicht an unsere Server gesendet.',
          ],
        },
        {
          title: '3. Zwecke und Rechtsgrundlagen',
          body: [
            'Bereitstellung der Plattform und Verbesserung von Suchergebnissen (Art. 6 Abs. 1 lit. b/f DSGVO), Betrugsprävention (lit. f), rechtliche Pflichten (lit. c). Marketing-E-Mails nur mit Einwilligung (lit. a).',
          ],
        },
        {
          title: '4. Cookies und lokale Speicherung',
          body: [
            'Technisch notwendige Speicherung (Karteneinstellung „sivrce_map_ui“, Sitzung) sowie — nur nach Einwilligung — Reichweitenmessung. Details: Cookie-Richtlinie. LEGAL_REVIEW_REQUIRED: Einwilligungslösung (Consent-Banner) vor Analytics-Aktivierung im DE-Markt abschalten/ergänzen.',
          ],
        },
        {
          title: '5. Empfänger und Auftragsverarbeiter',
          body: [
            'Hosting und Datenbank ([TODO-OWNER: Anbieter benennen]), E-Mail-Versand, SMS-Telefonverifizierung, Zahlungsdienstleister. Kein Verkauf personenbezogener Daten.',
          ],
        },
        {
          title: '6. Speicherdauer und Ihre Rechte',
          body: [
            'Speicherung nur solange betriebsnotwendig oder gesetzlich erforderlich. Rechte: Auskunft (Art. 15), Berichtigung (16), Löschung (17), Einschränkung (18), Datenübertragbarkeit (20), Widerspruch (21), Beschwerde bei einer Aufsichtsbehörde. Anfragen: ' + CONTACT + '. Konto-Löschung ist direkt in den Einstellungen möglich.',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy Policy (Germany)',
      description: 'How sivrce processes personal data — collection, use, storage and your rights.',
      sections: [
        {
          title: '1. Controller',
          body: [
            'Controller: sivrce — [TODO-OWNER: legal entity, address]. Contact: ' + CONTACT + '. LEGAL_REVIEW_REQUIRED: assess whether a data protection officer must be designated.',
          ],
        },
        {
          title: '2. Data we process',
          body: [
            'Search queries, contact details you provide voluntarily (name, email, phone), technical device and browser information, and content you actively publish (e.g. listings). Favorites stay local on your device and are never sent to our servers.',
          ],
        },
        {
          title: '3. Purposes and legal bases',
          body: [
            'Providing the platform and improving search results (Art. 6 (1)(b/f) GDPR), fraud prevention ((f)), legal obligations ((c)). Marketing emails only with consent ((a)).',
          ],
        },
        {
          title: '4. Cookies and local storage',
          body: [
            'Technically necessary storage (map preference “sivrce_map_ui”, session) and — only with consent — analytics. See the Cookie Policy. LEGAL_REVIEW_REQUIRED: gate analytics behind a consent banner for the DE market before activation.',
          ],
        },
        {
          title: '5. Recipients and processors',
          body: [
            'Hosting and database ([TODO-OWNER: name providers]), email delivery, SMS phone verification, payment provider. We never sell personal data.',
          ],
        },
        {
          title: '6. Retention and your rights',
          body: [
            'Retention only as long as operationally necessary or legally required. Rights: access (Art. 15), rectification (16), erasure (17), restriction (18), portability (20), objection (21), complaint to a supervisory authority. Requests: ' + CONTACT + '. Account deletion is available directly in settings.',
          ],
        },
      ],
    },
  },
  {
    slug: 'agb',
    legalReviewRequired: true,
    de: {
      title: 'Allgemeine Geschäftsbedingungen',
      description: 'Nutzungsbedingungen der sivrce-Plattform.',
      sections: [
        {
          title: '1. Geltungsbereich',
          body: [
            'Diese Bedingungen regeln die Nutzung der sivrce-Plattform. Mit der Nutzung akzeptieren Sie sie. LEGAL_REVIEW_REQUIRED: vollständige AGB-Pflichtklauseln (Laufzeit, Preisdarstellung, Haftung, Gerichtsstand) durch Rechtstext-Anwalt erstellen.',
          ],
        },
        {
          title: '2. Vertragsgegenstand',
          body: [
            'sivrce ist eine Immobilien-Informationsplattform: Inserate, Projekt- und Gebäudedaten sowie Marktdaten. sivrce ist selbst kein Makler im Sinne des § 34c GewO und schließt keine Maklerverträge für Nutzer ab, es sei denn dies ist an anderer Stelle ausdrücklich geregelt.',
          ],
        },
        {
          title: '3. Pflichten der Nutzer',
          body: [
            'Nutzer stellen nur wahrheitsgemäße Inhalte ein, beachten Urheber- und Persönlichkeitsrechte und missbrauchen die Plattform nicht. Verstöße können zur Sperrung führen.',
          ],
        },
        {
          title: '4. Inhalte Dritter',
          body: [
            'Inserate und Projektangaben stammen von Nutzern, Entwicklern und öffentlichen Quellen. Trotz sorgfältiger Prüfung keine Gewähr für Vollständigkeit und Richtigkeit; Quellen und Prüfstatus werden auf den jeweiligen Seiten angegeben.',
          ],
        },
        {
          title: '5. Entgelte und Vertragsschluss',
          body: [
            'Grundfunktionen sind kostenlos. Kostenpflichtige Produkte (z. B. hervorgehobene Inserate) werden vor Buchung ausgewiesen; Details siehe Werben-Seite. Widerrufsrecht: siehe Widerrufsbelehrung.',
          ],
        },
      ],
    },
    en: {
      title: 'Terms of Use (Germany)',
      description: 'Terms and conditions for the sivrce platform.',
      sections: [
        {
          title: '1. Scope',
          body: [
            'These terms govern use of the sivrce platform; by using it you accept them. LEGAL_REVIEW_REQUIRED: have complete AGB clauses (term, pricing, liability, jurisdiction) drafted by legal counsel.',
          ],
        },
        {
          title: '2. Subject matter',
          body: [
            'sivrce is a real-estate information platform: listings, project and building data, market data. sivrce is not itself a broker under § 34c GewO and does not conclude brokerage agreements for users unless explicitly stated elsewhere.',
          ],
        },
        {
          title: '3. User obligations',
          body: [
            'Users publish only truthful content, respect copyright and personality rights, and do not abuse the platform. Violations may lead to suspension.',
          ],
        },
        {
          title: '4. Third-party content',
          body: [
            'Listings and project data come from users, developers and public sources. Despite careful review no guarantee of completeness or accuracy; sources and verification status are shown on the respective pages.',
          ],
        },
        {
          title: '5. Fees and conclusion of contract',
          body: [
            'Core features are free. Paid products (e.g. promoted listings) are displayed before booking; see the advertise page. Right of withdrawal: see the withdrawal notice.',
          ],
        },
      ],
    },
  },
  {
    slug: 'cookies',
    legalReviewRequired: true,
    de: {
      title: 'Cookie-Richtlinie',
      description: 'Welche Cookies und lokale Speicherungen sivrce nutzt und wie Sie sie steuern.',
      sections: [
        {
          title: 'Technisch notwendige Speicherung',
          body: [
            'Karteneinstellung (sivrce_map_ui: Straßen/Hybrid/Minimal, 2D/3D), Sitzungs- und Sicherheits-Cookies sowie lokale Favoriten (localStorage, nur auf Ihrem Gerät). Ohne diese Speicherung funktioniert die Plattform nicht.',
          ],
        },
        {
          title: 'Einwilligungspflichtige Cookies',
          body: [
            'Reichweitenmessung (z. B. Google Analytics über den Google Tag Manager) lädt nur, soweit Sie eingewilligt haben. LEGAL_REVIEW_REQUIRED: Consent-Management-Plattform vor Produktivstart im DE-Markt anschließen; bis dahin Analytics im DE-Markt deaktiviert lassen.',
          ],
        },
        {
          title: 'Cookies verwalten',
          body: [
            'Sie können Cookies in den Browsereinstellungen löschen oder blockieren; einzelne Funktionen können dann eingeschränkt sein.',
          ],
        },
      ],
    },
    en: {
      title: 'Cookie Policy',
      description: 'Which cookies and local storage sivrce uses and how you control them.',
      sections: [
        {
          title: 'Technically necessary storage',
          body: [
            'Map preference (sivrce_map_ui: streets/hybrid/minimal, 2D/3D), session and security cookies, and local favorites (localStorage, on your device only). The platform cannot work without them.',
          ],
        },
        {
          title: 'Consent-required cookies',
          body: [
            'Analytics (e.g. Google Analytics via Google Tag Manager) loads only with your consent. LEGAL_REVIEW_REQUIRED: connect a consent-management platform before DE launch; keep analytics disabled for the DE market until then.',
          ],
        },
        {
          title: 'Managing cookies',
          body: [
            'You can delete or block cookies in your browser settings; some features may then be limited.',
          ],
        },
      ],
    },
  },
  {
    slug: 'widerruf',
    legalReviewRequired: true,
    de: {
      title: 'Widerrufsbelehrung',
      description: 'Widerrufsrecht für Verbraucher bei kostenpflichtigen sivrce-Produkten.',
      sections: [
        {
          title: 'Widerrufsrecht',
          body: [
            'Verbraucher haben bei Verträgen über kostenpflichtige sivrce-Dienstleistungen ein vierzehntägiges Widerrufsrecht ab Vertragsschluss. LEGAL_REVIEW_REQUIRED: exakte Belehrung (Muster der Anlage 1 zu Art. 246a EGBGB) anwaltlich erstellen und prüfen, welche Produkte als digitale Leistungen mit vorzeitigem Einwilligungsverzicht gelten.',
          ],
        },
        {
          title: 'Ausübung des Widerrufs',
          body: [
            'Der Widerruf erfolgt in Textform, z. B. per E-Mail an ' + CONTACT + ', ohne Angabe von Gründen.',
          ],
        },
        {
          title: 'Folgen des Widerrufs',
          body: [
            'Im Falle eines wirksamen Widerrufs erstatten wir bereits geleistete Zahlungen zurück. LEGAL_REVIEW_REQUIRED: Wertersatz-Regelungen für angefangene digitale Leistungen klären.',
          ],
        },
      ],
    },
    en: {
      title: 'Right of Withdrawal',
      description: 'Consumers’ withdrawal right for paid sivrce products.',
      sections: [
        {
          title: 'Withdrawal right',
          body: [
            'Consumers have a fourteen-day withdrawal right from conclusion of contracts for paid sivrce services. LEGAL_REVIEW_REQUIRED: have the exact statutory notice drafted by counsel and determine which products count as digital services with early consent to performance.',
          ],
        },
        {
          title: 'Exercising withdrawal',
          body: [
            'Withdraw in text form (e.g. email to ' + CONTACT + '), no reason required.',
          ],
        },
        {
          title: 'Consequences',
          body: [
            'Upon effective withdrawal we refund payments already made. LEGAL_REVIEW_REQUIRED: clarify value-replacement rules for partially consumed digital services.',
          ],
        },
      ],
    },
  },
  {
    slug: 'verbraucherinformationen',
    legalReviewRequired: true,
    de: {
      title: 'Verbraucherinformationen',
      description: 'Informationen nach den Artikeln 246 ff. EGBGB und Verbraucherstreitbeilegung.',
      sections: [
        {
          title: 'Identität des Unternehmers',
          body: ['Siehe Impressum.'],
        },
        {
          title: 'Preise und Steuern',
          body: [
            'Alle Preise für kostenpflichtige Produkte verstehen sich — soweit ausgewiesen — inklusive Umsatzsteuer. Grunderwerbsteuer und Notarkosten bei Immobiliengeschäften trägt der Käufer; sivrce vermittelt keine Kaufverträge.',
          ],
        },
        {
          title: 'Verbraucherstreitbeilegung',
          body: [
            'Plattform der EU zur Online-Streitbeilegung: ec.europa.eu/consumers/odr. LEGAL_REVIEW_REQUIRED: Teilnahmebereitschaft an Verbraucherschlichtungsverfahren final festlegen.',
          ],
        },
      ],
    },
    en: {
      title: 'Consumer Information',
      description: 'Information under German consumer law (Art. 246 ff. EGBGB) and dispute resolution.',
      sections: [
        {
          title: 'Trader identity',
          body: ['See the Imprint.'],
        },
        {
          title: 'Prices and taxes',
          body: [
            'Prices for paid products include VAT where indicated. Real-estate transfer tax and notary costs are borne by the buyer; sivrce does not broker purchase contracts.',
          ],
        },
        {
          title: 'Consumer dispute resolution',
          body: [
            'EU online dispute resolution platform: ec.europa.eu/consumers/odr. LEGAL_REVIEW_REQUIRED: finalize stance on consumer arbitration participation.',
          ],
        },
      ],
    },
  },
  {
    slug: 'partner-disclosures',
    legalReviewRequired: true,
    de: {
      title: 'Partner- und Werbe-Kennzeichnungen',
      description: 'Transparenz über kommerzielle Partnerschaften und bezahlte Platzierungen.',
      sections: [
        {
          title: 'Grundsatz',
          body: [
            'Redaktionelle Inhalte und Werbung sind getrennt. Bezahlt platzierte Inserate oder Profile sind klar als „Gesponsert“ gekennzeichnet. Die Reihenfolge unbezahlter Suchergebnisse wird nicht gegen Geld verändert.',
          ],
        },
        {
          title: 'Provisionen',
          body: [
            'sivrce kann von Partnern (z. B. Entwicklern, Zahlungsdienstleistern) vergütet werden, ohne dass sich dies auf redaktionelle Darstellung auswirkt. LEGAL_REVIEW_REQUIRED: Schwellenwerte der Kennzeichnungspflicht nach UWG (§ 5a) prüfen.',
          ],
        },
      ],
    },
    en: {
      title: 'Partner & Advertising Disclosures',
      description: 'Transparency about commercial partnerships and paid placements.',
      sections: [
        {
          title: 'Principle',
          body: [
            'Editorial content and advertising are separate. Paid listings or profiles are clearly labeled “Sponsored”. The order of unpaid search results is never changed for money.',
          ],
        },
        {
          title: 'Commissions',
          body: [
            'sivrce may be compensated by partners (e.g. developers, payment providers) without affecting editorial presentation. LEGAL_REVIEW_REQUIRED: review UWG (§ 5a) labeling thresholds.',
          ],
        },
      ],
    },
  },
  {
    slug: 'data-sources',
    legalReviewRequired: false,
    de: {
      title: 'Datenquellen',
      description: 'Öffentliche und offizielle Quellen der sivrce-Immobilieninformationen.',
      sections: [
        {
          title: 'Grundsatz der Quellenangabe',
          body: [
            'Jede wichtige Faktenseite nennt Quelle, Stand der Prüfung und Konfidenz. Wir erfinden keine Daten; was unbelegt ist, wird als unbelegt markiert.',
          ],
        },
        {
          title: 'Verwendete Quellen (Auswahl)',
          body: [
            'Offizielle/open-data-Quellen: Datenportal Berlin (daten.berlin.de), Liegenschaftskataster ALKIS, Bodenrichtwerte (BORIS), Bauleitplanung (B-Pläne), Statistik Berlin-Brandenburg, Destatis, Handelsregister.',
            'Geodaten: OpenStreetMap (ODbL).',
            'Anbieterquellen: offizielle Projektseiten von Entwicklern und Kommunen.',
          ],
        },
        {
          title: 'Lizenzen',
          body: [
            'Open-Data-Lizenzen (z. B. dl-de/by-2.0, ODbL) werden beachtet und je Quelle im Quellenregister geführt. Bei Unklarheiten hält eine Quelle „LEGAL_REVIEW_REQUIRED“-Status, bis die Lizenz geklärt ist.',
          ],
        },
      ],
    },
    en: {
      title: 'Data Sources',
      description: 'Public and official sources behind sivrce real-estate information.',
      sections: [
        {
          title: 'Attribution principle',
          body: [
            'Every important fact page names its source, last-verified date and confidence. We invent no data; anything unsourced is marked as such.',
          ],
        },
        {
          title: 'Sources used (selection)',
          body: [
            'Official/open data: Berlin data portal (daten.berlin.de), cadastre ALKIS, land value maps (BORIS), development plans (B-Pläne), Statistics Berlin-Brandenburg, Destatis, commercial register.',
            'Geodata: OpenStreetMap (ODbL).',
            'Provider sources: official project pages of developers and municipalities.',
          ],
        },
        {
          title: 'Licenses',
          body: [
            'Open-data licenses (e.g. dl-de/by-2.0, ODbL) are respected and tracked per source in the source registry. Unclear cases hold LEGAL_REVIEW_REQUIRED status until the license is clarified.',
          ],
        },
      ],
    },
  },
  {
    slug: 'content-policy',
    legalReviewRequired: false,
    de: {
      title: 'Inhaltsrichtlinie',
      description: 'Regeln für von Nutzern eingestellte Inhalte und deren Moderation.',
      sections: [
        {
          title: 'Erlaubte Inhalte',
          body: [
            'Echte Immobilienangebote, wahrheitsgemäße Angaben, eigene oder lizenzierte Bilder. Fiktive Projekte, erfundene Preise oder irreführende Standorte sind untersagt.',
          ],
        },
        {
          title: 'Verbotene Inhalte',
          body: [
            'Rechtswidrige, diskriminierende, täuschende oder betrügerische Inhalte sowie personenbezogene Daten Dritter ohne deren Einwilligung.',
          ],
        },
        {
          title: 'Moderation',
          body: [
            'Meldungen werden geprüft; Inhalte können bei Verstößen entfernt und Konten gesperrt werden. Da wir keine Kenntnis der Rechtswidrigkeit haben müssen (§ 7 Abs. 3 DDG), zählt Ihre Meldung: siehe Takedown-Seite.',
          ],
        },
      ],
    },
    en: {
      title: 'Content Policy',
      description: 'Rules for user-submitted content and its moderation.',
      sections: [
        {
          title: 'Allowed content',
          body: [
            'Genuine property offers, truthful information, owned or licensed images. Fictional projects, invented prices or misleading locations are prohibited.',
          ],
        },
        {
          title: 'Prohibited content',
          body: [
            'Unlawful, discriminatory, deceptive or fraudulent content, and third-party personal data without consent.',
          ],
        },
        {
          title: 'Moderation',
          body: [
            'Reports are reviewed; violating content may be removed and accounts suspended. As we need no knowledge of illegality (§ 7 (3) DDG), your report matters: see the Takedown page.',
          ],
        },
      ],
    },
  },
  {
    slug: 'takedown',
    legalReviewRequired: false,
    de: {
      title: 'Takedown / Beschwerde',
      description: 'Rechtsverletzungen melden — Urheberrecht, Persönlichkeitsrechte, Missbrauch.',
      sections: [
        {
          title: 'Meldung einer Rechtsverletzung',
          body: [
            'Schreiben Sie an ' + CONTACT + ' mit: (1) betroffene URL, (2) Beschreibung der Verletzung, (3) Ihre Begründung/Rechtsgrundlage, (4) Kontaktdaten. Bei Urheberrechtsverletzungen genügt eine kurze Inhaberbestätigung.',
          ],
        },
        {
          title: 'Verfahren',
          body: [
            'Wir prüfen jede Meldung zeitnah und entfernen eindeutig rechtswidrige Inhalte. Bei berechtigten Einwänden gegen Inserate wird das Angebot gesperrt, bis die Sache geklärt ist. Antwort in der Regel innerhalb weniger Werktage.',
          ],
        },
        {
          title: 'Hinweis',
          body: [
            'Bewusst falsche Takedown-Meldungen können selbst rechtliche Folgen haben. LEGAL_REVIEW_REQUIRED: Prozessbeschleunigung gemäß DSA (Fristen, Beschwerdeinstanz) anwaltlich prüfen.',
          ],
        },
      ],
    },
    en: {
      title: 'Takedown / Report',
      description: 'Report legal violations — copyright, personal rights, abuse.',
      sections: [
        {
          title: 'Reporting a violation',
          body: [
            'Email ' + CONTACT + ' with: (1) the affected URL, (2) a description of the violation, (3) your justification/legal basis, (4) your contact details. For copyright issues a brief rights-holder confirmation suffices.',
          ],
        },
        {
          title: 'Process',
          body: [
            'Every report is reviewed promptly; clearly unlawful content is removed. For justified objections to listings, the offer is locked until resolved. Response usually within a few business days.',
          ],
        },
        {
          title: 'Note',
          body: [
            'Knowingly false takedown notices can carry legal consequences themselves. LEGAL_REVIEW_REQUIRED: have DSA process requirements (deadlines, complaint instance) reviewed by counsel.',
          ],
        },
      ],
    },
  },
  {
    slug: 'privacy-request',
    legalReviewRequired: false,
    de: {
      title: 'Anfrage zu Ihren Daten (DSGVO)',
      description: 'Auskunft, Berichtigung, Löschung, Übertragbarkeit — so stellen Sie einen Antrag.',
      sections: [
        {
          title: 'So stellen Sie einen Antrag',
          body: [
            'E-Mail an ' + CONTACT + ' mit dem Betreff „DSGVO-Antrag“ und der Angabe, welche Rechte Sie ausüben (Auskunft, Berichtigung, Löschung, Datenübertragbarkeit, Einschränkung, Widerspruch).',
          ],
        },
        {
          title: 'Was Sie erwarten können',
          body: [
            'Antwort innerhalb eines Monats (Art. 12 Abs. 3 DSGVO). Identitätsprüfung nur soweit nötig (z. B. Antwort an die hinterlegte E-Mail).',
          ],
        },
        {
          title: 'Selbst-Service',
          body: [
            'Konto samt Daten lässt sich direkt unter Einstellungen löschen; Profiländerungen ebenfalls. Favoriten liegen nur lokal auf Ihrem Gerät — Löschen der Browserdaten entfernt sie.',
          ],
        },
        {
          title: 'Beschwerderecht',
          body: [
            'Sie können sich bei jeder Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), z. B. bei der für den Betreiber zuständigen Behörde. [TODO-OWNER: zuständige Behörde nach Firmensitz eintragen]',
          ],
        },
      ],
    },
    en: {
      title: 'Data Subject Request (GDPR)',
      description: 'Access, rectification, erasure, portability — how to submit a request.',
      sections: [
        {
          title: 'How to submit',
          body: [
            'Email ' + CONTACT + ' with subject “GDPR request”, stating which rights you exercise (access, rectification, erasure, portability, restriction, objection).',
          ],
        },
        {
          title: 'What to expect',
          body: [
            'Response within one month (Art. 12 (3) GDPR). Identity checks only where necessary (e.g. replying to the stored email address).',
          ],
        },
        {
          title: 'Self-service',
          body: [
            'You can delete your account and its data directly in settings; profile edits likewise. Favorites live only in your browser — clearing site data removes them.',
          ],
        },
        {
          title: 'Right to complain',
          body: [
            'You may complain to any data protection authority (Art. 77 GDPR). [TODO-OWNER: insert the authority responsible for the operator’s seat]',
          ],
        },
      ],
    },
  },
  {
    slug: 'accessibility',
    legalReviewRequired: true,
    de: {
      title: 'Barrierefreiheitserklärung',
      description: 'Erklärung zur Barrierefreiheit gemäß BFSG.',
      sections: [
        {
          title: 'Bemühungen um Barrierefreiheit',
          body: [
            'sivrce zielt auf WCAG 2.2 AA: Tastaturbedienbarkeit, Screenreader-Semantik, sichtbarer Fokus, ausreichende Kontraste, „Bewegung reduzieren“-Unterstützung. Karten-Ansichten bieten Text-Alternativen (Listenansichten).',
          ],
        },
        {
          title: 'Bekannte Einschränkungen',
          body: [
            'Ältere Karten-Interaktionen und einzelne eingebettete Inhalte sind noch nicht vollständig barrierefrei. LEGAL_REVIEW_REQUIRED: BFSG-Anwendungsbereich (Diensteanbieter-Pflichten seit Juni 2025) und Überwachungsstelle-Anforderungen anwaltlich prüfen; Überprüfungsverfahren und -datum ergänzen.',
          ],
        },
        {
          title: 'Feedback',
          body: [
            'Stellen Sie Barrieren fest: ' + CONTACT + '. Wir bemühen uns um zeitnahe Abhilfe und nennen Alternativen.',
          ],
        },
      ],
    },
    en: {
      title: 'Accessibility Statement',
      description: 'Accessibility statement under German law (BFSG).',
      sections: [
        {
          title: 'Commitment to accessibility',
          body: [
            'sivrce targets WCAG 2.2 AA: keyboard operability, screen-reader semantics, visible focus, sufficient contrast, reduced-motion support. Map views offer text alternatives (list views).',
          ],
        },
        {
          title: 'Known limitations',
          body: [
            'Some map interactions and embedded content are not yet fully accessible. LEGAL_REVIEW_REQUIRED: have BFSG scope (service-provider duties since June 2025) and monitoring-authority requirements reviewed by counsel; add audit method and date.',
          ],
        },
        {
          title: 'Feedback',
          body: [
            'Report barriers to ' + CONTACT + '. We aim for prompt fixes and name alternatives.',
          ],
        },
      ],
    },
  },
]

export const LEGAL_SLUGS = LEGAL_DOCS.map((d) => d.slug)

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug)
}
