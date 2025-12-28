import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PayMind",
  description: "A friendly payment reminder app.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#1D9BF0" />
      </head>
      <body
        className={cn(
          "font-body bg-gray-900 flex items-center justify-center min-h-screen",
          inter.variable
        )}
      >
        <FirebaseClientProvider>
          <main className="w-full max-w-sm h-[800px] max-h-[90vh] bg-background rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20">
              <div className="w-12 h-1.5 rounded-full bg-gray-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <div className="h-full w-full overflow-y-auto bg-background">
              {children}
            </div>
          </main>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
