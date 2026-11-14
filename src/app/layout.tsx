import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Khmer, Space_Grotesk } from "next/font/google";
import { AppProvider } from "@/components/AppState";
import { Shell } from "@/components/Shell";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const khmer = Noto_Sans_Khmer({ variable: "--font-khmer", subsets: ["khmer"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "PROJECT: Terratoria",
  description:
    "Find Earth sites that are analogues of specific Moon and Mars regions, with explainable similarity scores built on open NASA and ESA data. Made by Aspensia. Code written with AI assistance.",
  authors: [{ name: "Aspensia" }],
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.png` },
  other: { generator: "Built with AI assistance (Claude) from the team's concept" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${geistSans.variable} ${geistMono.variable} ${khmer.variable} ${display.variable} antialiased`}>
      <body className="min-h-screen">
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
