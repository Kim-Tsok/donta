import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const text = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-text",
});

const heading = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: `donta · ${site.headline}`,
  description: `${site.headline} ${site.description}`,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#14161f" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
  ],
};

// Runs before paint so the saved or system theme applies without a flash.
const themeScript = `(function(){try{var t=localStorage.getItem("donta-theme");}catch(e){}if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.dataset.theme=t;})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${text.variable} ${heading.variable}`} suppressHydrationWarning>
      <head>
        {/* Executable on the server render only; React warns about live scripts on the client. */}
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
