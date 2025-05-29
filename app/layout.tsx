import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Summari - Älykkäät yhteenvedot suomeksi | AI-tiivistelmät",
    template: "%s | Summari",
  },
  description:
    "Muuta pitkät tekstit toimintasuunnitelmiksi AI:n avulla. Summari luo automaattisesti yhteenvetoja, poimii vastuuhenkilöt ja deadlinet suomeksi. Ilmainen kokeilu.",
  keywords: [
    "yhteenveto",
    "tiivistelmä",
    "AI",
    "tekoäly",
    "suomi",
    "kokousmuistio",
    "sähköposti",
    "toimintasuunnitelma",
    "vastuuhenkilöt",
    "deadlinet",
    "automaattinen tiivistäminen",
    "tekstin analysointi",
  ],
  authors: [{ name: "Summari" }],
  creator: "Summari",
  publisher: "Summari",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://summari.fi"),
  alternates: {
    canonical: "/",
    languages: {
      "fi-FI": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "fi_FI",
    url: "https://summari.fi",
    title: "Summari - Älykkäät yhteenvedot suomeksi",
    description:
      "Muuta pitkät tekstit toimintasuunnitelmiksi AI:n avulla. Automaattiset yhteenvedot, vastuuhenkilöt ja deadlinet.",
    siteName: "Summari",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Summari - AI-yhteenvedot suomeksi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Summari - Älykkäät yhteenvedot suomeksi",
    description: "Muuta pitkät tekstit toimintasuunnitelmiksi AI:n avulla. Automaattiset yhteenvedot suomeksi.",
    images: ["/og-image.jpg"],
    creator: "@summari_fi",
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
  verification: {
    google: "your-google-verification-code",
  },
  generator: "v0.dev",
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Summari",
  description:
    "AI-pohjainen yhteenvetopalvelu suomeksi. Muuttaa pitkät tekstit toimintasuunnitelmiksi automaattisesti.",
  url: "https://summari.fi",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Ilmainen kokeilu - 3 yhteenvetoa päivässä",
  },
  provider: {
    "@type": "Organization",
    name: "Summari",
    url: "https://summari.fi",
  },
  inLanguage: "fi",
  audience: {
    "@type": "Audience",
    audienceType: "Business professionals, students, researchers",
  },
  featureList: [
    "Automaattiset yhteenvedot",
    "Vastuuhenkilöiden tunnistus",
    "Deadlineiden poiminta",
    "Toimenpidelistojen luonti",
    "Sähköpostivastausten luonnokset",
    "Suomenkielinen käyttöliittymä",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fi">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <link rel="canonical" href="https://summari.fi" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Summari" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  )
}
