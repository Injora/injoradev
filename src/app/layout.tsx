import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Manrope } from "next/font/google";
import { identity } from "@/content/profile";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const title = "Injora — Full-Stack Developer · Open-Source Contributor";
const description =
  "Injora builds full-stack systems — React, Node/Express and PostgreSQL — and contributes to open source, with merged work in cBioPortal and Sugar Labs. Currently mastering Java + Spring Boot, expanding toward AI/ML.";

export const metadata: Metadata = {
  metadataBase: new URL(identity.site),
  title,
  description,
  applicationName: "Injora",
  authors: [{ name: "Injora", url: identity.github }],
  keywords: ["Injora", "full-stack developer", "open source", "cBioPortal", "React", "Node.js", "PostgreSQL", "TypeScript", "portfolio"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: identity.site,
    title,
    description,
    siteName: "Injora",
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b4f66",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Injora",
  url: identity.site,
  jobTitle: "Full-Stack Developer",
  email: `mailto:${identity.email}`,
  sameAs: [identity.github, identity.linkedin],
  knowsAbout: ["JavaScript", "TypeScript", "React", "Node.js", "Express", "PostgreSQL", "Supabase", "Java", "Spring Boot"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-dvh">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
