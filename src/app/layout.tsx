import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "@/shadcn/styles/globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { TooltipProvider } from "@/shadcn/ui/tooltip";

const outfit = Outfit();

export const metadata: Metadata = {
  title: "Riad Stone",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="fr" className={outfit.className}>
      <body className="antialiased">
        <ServiceWorkerRegistration />
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
