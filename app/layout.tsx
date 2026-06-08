import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kapruka Gift Mate",
  description:
    "A conversational shopping agent powered by Kapruka MCP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}