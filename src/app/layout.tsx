import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Khmer, Space_Grotesk } from "next/font/google";
import { AppProvider } from "@/components/AppState";
import { Shell } from "@/components/Shell";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "lenis/dist/lenis.css";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const khmer = Noto_Sans_Khmer({ variable: "--font-khmer", subsets: ["khmer"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "PROJECT: Terratoria",
  description:
    "Find Earth sites that are analogues of specific Moon and Mars regions, with explainable similarity scores built on open NASA and ESA data. Made by Aspensia. Code written with AI assistance.",
  authors: [{ name: "Aspensia" }],
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.png` },
  other: { generator: "Built with AI assistance (Claude) from the team's concept" },
};

// Runs before first paint, so 3D scenes start in the chosen mode and colours never flash.
// Lite Mode is the default only on devices that report 2 GB of memory or less.
const PREFS = `try{var d=document.documentElement,s=localStorage,p=s.getItem("terratoria.perf");if(p!=="lite"&&p!=="base"){var m=navigator.deviceMemory;p=m&&m<=2?"lite":"base"}d.dataset.perf=p;var v=s.getItem("terratoria.vision");if(v)d.dataset.vision=v}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="science" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${khmer.variable} ${display.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS }} />
      </head>
      <body className="min-h-screen">
        <SmoothScroll />
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
