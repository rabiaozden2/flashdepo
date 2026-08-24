import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/providers/StoreProvider";
import { ChakraProvider } from "@/providers/ChakraProvider";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/Toast";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300","400","500","600","700"] });

export const metadata: Metadata = {
  title: "FlashDepo",
  description: "Dağıtık depolarda anlık flash sale kampanyaları",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={spaceGrotesk.className}>
        <StoreProvider>
          <ChakraProvider>
            <Navbar />
            {children}
            <ToastContainer />
          </ChakraProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
