import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CookieTracker } from "@/components/CookieTracker";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polokaz",
  description:
    "Polokaz connects members with curated deals, rewards, and referral experiences.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.className} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <CookieTracker />
        {children}
        <SubscriptionModal />
        <ThemeToggle />
      </body>
    </html>
  );
}
