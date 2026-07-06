import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pensieve Memory Dashboard",
  description: "A local dashboard plugin for inspecting and lightly governing structured LLM memory."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
