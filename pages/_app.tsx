import type { AppProps } from "next/app";
import { Noto_Sans, Noto_Serif } from "@next/font/google";
import "../styles/globals.css";

import Script from "next/script";

const noto_sans = Noto_Sans({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

const noto_serif = Noto_Serif({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${noto_sans.variable} ${noto_serif.variable} font-sans`}>
      <Script src="https://code.jquery.com/jquery-3.6.1.min.js"></Script>
      <Component {...pageProps} />
    </div>
  );
}
