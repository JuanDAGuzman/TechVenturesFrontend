import { useEffect, useState } from "react";

// Altura realmente visible (iOS: vh/dvh no descuentan bien las barras del navegador)
export default function useVisibleHeight() {
  const read = () => Math.round(window.visualViewport?.height ?? window.innerHeight);
  const [h, setH] = useState(read);
  useEffect(() => {
    const upd = () => setH(read());
    const vv = window.visualViewport;
    window.addEventListener("resize", upd);
    vv?.addEventListener("resize", upd);
    return () => {
      window.removeEventListener("resize", upd);
      vv?.removeEventListener("resize", upd);
    };
  }, []);
  return h;
}
