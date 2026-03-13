import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { Footer } from "./components/Footer";

const themeStorageKey = "stripe-ez-theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(themeStorageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [hasManualTheme, setHasManualTheme] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === "light" || stored === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (hasManualTheme) {
      window.localStorage.setItem(themeStorageKey, theme);
    } else {
      window.localStorage.removeItem(themeStorageKey);
    }
  }, [theme, hasManualTheme]);

  useEffect(() => {
    if (hasManualTheme) {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", syncTheme);
    return () => media.removeEventListener("change", syncTheme);
  }, [hasManualTheme]);

  const toggleTheme = () => {
    setHasManualTheme(true);
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return (
    <div className="site-shell">
      <Header onToggleTheme={toggleTheme} theme={theme} />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}