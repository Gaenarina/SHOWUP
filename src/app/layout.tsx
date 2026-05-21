import type { Metadata } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "SHOWUP",
  description: "SHOWUP reservation app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
