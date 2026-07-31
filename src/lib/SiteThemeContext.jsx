import { createContext, useContext, useState } from "react";
import { brandFromColor } from "./categoryBrand.js";

// Default: indigo — matches the static brand-indigo used before categories load
const DEFAULT_SITE_BRAND = brandFromColor("#6d28d9");

const SiteThemeContext = createContext({ brand: DEFAULT_SITE_BRAND, setBrand: () => {} });

export function SiteThemeProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT_SITE_BRAND);
  return (
    <SiteThemeContext.Provider value={{ brand, setBrand }}>
      {children}
    </SiteThemeContext.Provider>
  );
}

export function useSiteTheme() {
  return useContext(SiteThemeContext);
}
