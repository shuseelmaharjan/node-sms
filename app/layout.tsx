import { Providers } from "./providers";
import { ConditionalLayout } from "./ConditionalLayout";
import "./globals.css";
import "react-nepali-datetime-picker/dist/style.css";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
        <Toaster position="top-right" theme="light" />
      </body>
    </html>
  );
}
