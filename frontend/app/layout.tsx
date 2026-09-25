import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "StudyPath AI",
  description:
    "An adaptive AI-powered learning companion.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body>
        {children}
      </body>

    </html>
  );
}