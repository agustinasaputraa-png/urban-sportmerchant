import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UrbanSport Merchant",
  description: "Merchant Center untuk tenant UrbanSport",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
