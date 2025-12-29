import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
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
        <meta name="theme-color" content="#7984D7" />
      </head>
      <body
        className={cn(
          "font-body bg-background flex items-center justify-center min-h-screen",
          ptSans.variable
        )}
      >
        <main className="w-full max-w-sm h-[800px] max-h-[90vh] bg-background rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20">
            <div className="w-12 h-1.5 rounded-full bg-gray-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          <div className="h-full w-full overflow-y-auto bg-background">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
