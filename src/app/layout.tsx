import type { Metadata, Viewport } from "next";
import { Gabarito, Figtree } from "next/font/google";
import { siteUrl } from "@/lib/site";
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
  themeColor: "#141128",
  colorScheme: "dark",
  // The app is a full-height layout; letting it zoom-bounce on iOS makes the
  // fixed chrome drift.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${gabarito.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
