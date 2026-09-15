import type { Metadata } from "next";
import { Gabarito, Figtree } from "next/font/google";
import "./globals.css";

const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

// The one place the base URL lives — ARCHITECTURE.md §9.1.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MusiChat — listen together, wherever you are",
    template: "%s · MusiChat",
  },
  description:
    "Chat and play the same song at the same moment, with the one person you'd text at 2am.",
  applicationName: "MusiChat",
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
