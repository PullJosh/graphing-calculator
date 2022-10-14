import type { AppProps } from "next/app";
import "../styles/globals.css";

import Script from "next/script";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script src="https://code.jquery.com/jquery-3.6.1.min.js"></Script>
      <Component {...pageProps} />
    </>
  );
}
