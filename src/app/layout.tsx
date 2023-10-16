import "./globals.css";
import { Inter } from "next/font/google";

import { AppProvider } from "@/contexts/app";
import { Loader } from "@/components/Loader";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          <Loader>{children}</Loader>
        </AppProvider>
      </body>
    </html>
  );
}
