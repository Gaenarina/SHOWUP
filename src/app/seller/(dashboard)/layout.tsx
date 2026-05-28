"use client";

import { SellerLayout } from "../../components/SellerLayout";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SellerLayout>{children}</SellerLayout>;
}
