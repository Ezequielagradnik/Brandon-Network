import type { Metadata } from "next";
import { Instrument_Serif, Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";
import { getLang } from "@/lib/lang";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://brandon-network.vercel.app"),
  title: "Brandon Network",
  description:
    "Tu asistente de IA para finanzas, temas legales y datos tributarios. Un producto de Brandon Latam.",
  openGraph: {
    title: "Brandon Network",
    description:
      "Tu asistente de IA para finanzas, temas legales y datos tributarios.",
    siteName: "Brandon Network",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brandon Network",
    description:
      "Tu asistente de IA para finanzas, temas legales y datos tributarios.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${instrumentSerif.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
