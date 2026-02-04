import { Providers } from "./providers";
import { ConditionalLayout } from "./ConditionalLayout";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://nepalidatepicker.sajanmaharjan.com.np/v5/nepali.datepicker/css/nepali.datepicker.v5.0.6.min.css"
        />
      </head>

      <body className="antialiased">
        <Script
          src="https://nepalidatepicker.sajanmaharjan.com.np/v5/nepali.datepicker/js/nepali.datepicker.v5.0.6.min.js"
          strategy="lazyOnload"
        />

        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>

        <Toaster position="top-right" theme="light" />
      </body>
    </html>
  );
}
