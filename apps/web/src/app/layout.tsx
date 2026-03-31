import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthInitializer } from "@/components/auth-initializer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://saasifyy.tech"),
  title: {
    default: "Saasifyy - Discover & Subscribe to SaaS Products",
    template: "%s | Saasifyy",
  },
  description:
    "A multi-tenant marketplace platform for discovering, subscribing to, and managing SaaS products.",
  openGraph: {
    type: "website",
    siteName: "Saasifyy",
    title: "Saasifyy - Discover & Subscribe to SaaS Products",
    description: "A multi-tenant marketplace platform for discovering, subscribing to, and managing SaaS products.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthInitializer />
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
