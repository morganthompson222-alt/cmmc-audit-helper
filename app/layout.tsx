import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "CMMC Audit Helper — Self-Assessment Preparation Tool",
  description:
    "A self-assessment preparation tool for small DoD contractors working toward CMMC compliance. Walk through CMMC Level 1 and Level 2 controls, upload evidence, and generate compliance documentation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <Header />
          <main className="flex-1 max-w-[1100px] mx-auto py-7 px-5 pb-16 w-full">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
