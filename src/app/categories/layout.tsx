import { GoogleAdSenseScript } from "@/components/ads/google-adsense-script";

export default function CategoriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <GoogleAdSenseScript />
      {children}
    </>
  );
}
