import type { Metadata, Viewport } from "next";
import { Gabarito, Figtree } from "next/font/google";
import { siteUrl } from "@/lib/site";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import "./globals.css";

const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MusiChat — listen together, wherever you are",
    template: "%s · MusiChat",
  },
  description:
    "Chat and play the same song at the same moment, with the one person you'd text at 2am.",
  applicationName: "MusiChat",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MusiChat",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#141128" },
    { media: "(prefers-color-scheme: light)", color: "#f7f4fc" },
  ],
  // The app is a full-height layout; letting it zoom-bounce on iOS makes the
  // fixed chrome drift.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${gabarito.variable} ${figtree.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the saved theme before first paint. Without it every load
            flashes dark before switching. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
