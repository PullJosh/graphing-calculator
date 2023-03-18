import type { AppProps } from "next/app";
import { Noto_Sans, Noto_Serif } from "@next/font/google";
import "../styles/globals.css";

import Script from "next/script";
import { createContext, Dispatch, SetStateAction, useState } from "react";
import classNames from "classnames";

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

type ColorTheme = "light" | "dark";

interface ThemeContext {
  theme: ColorTheme;
  setTheme: Dispatch<SetStateAction<ColorTheme>>;
}

export const ThemeContext = createContext<ThemeContext>({
  theme: "light",
  setTheme: () => {},
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<ColorTheme>("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        className={classNames(
          noto_sans.variable,
          noto_serif.variable,
          "font-sans",
          { dark: theme === "dark" }
        )}
      >
        <Script src="https://code.jquery.com/jquery-3.6.1.min.js"></Script>
        <Component {...pageProps} />
      </div>
    </ThemeContext.Provider>
  );
}
