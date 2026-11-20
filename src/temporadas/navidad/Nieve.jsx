// Nieve suave sobre la página. Es un solo <canvas> que no recibe clics.
//  - Se pausa cuando la pestaña no está visible.
//  - No se muestra con "reducir movimiento" ni con ahorro de datos.
//  - En celulares y equipos modestos usa menos copos y se dibuja a ~30 cuadros por segundo.
import { useEffect, useRef } from "react";

const COLORES = ["148,163,184", "148,163,184", "167,139,250"]; // gris azulado y violeta de la marca

export default function Nieve() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const ahorro = navigator.connection?.saveData;
    if (reduce || ahorro) return undefined;

    const ctx = canvas.getContext("2d");
    const modesto = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;

    const nuevo = (arriba = false) => ({
      x: Math.random() * (w || window.innerWidth),
      y: arriba ? -10 : Math.random() * (h || window.innerHeight),
      r: 1.3 + Math.random() * 2.7,
      vy: 0.45 + Math.random() * 0.9,
      sway: 0.25 + Math.random() * 0.55,
      fase: Math.random() * Math.PI * 2,
      dfase: 0.01 + Math.random() * 0.02,
      a: 0.45 + Math.random() * 0.4,
      c: COLORES[(Math.random() * COLORES.length) | 0],
    });

    const ajustar = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ajustar();

    const cantidad = Math.round((w < 640 ? 26 : 52) * (modesto ? 0.6 : 1));
    const copos = Array.from({ length: cantidad }, () => nuevo(false));

    let raf = 0;
    let ultimo = 0;
    const cuadro = (t) => {
      raf = requestAnimationFrame(cuadro);
      if (t - ultimo < 32) return; // ~30 cuadros por segundo
      const dt = Math.min(64, t - ultimo || 16) / 16;
      ultimo = t;
      ctx.clearRect(0, 0, w, h);
      for (const f of copos) {
        f.fase += f.dfase * dt;
        f.y += f.vy * dt;
        f.x += Math.sin(f.fase) * f.sway * dt;
        if (f.y > h + 10) Object.assign(f, nuevo(true));
        if (f.x < -10) f.x = w + 10;
        else if (f.x > w + 10) f.x = -10;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${f.c},${f.a})`;
        ctx.fill();
      }
    };

    const alCambiarVisibilidad = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(cuadro);
    };
    let temporizador = 0;
    const alRedimensionar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(ajustar, 150);
    };

    raf = requestAnimationFrame(cuadro);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("resize", alRedimensionar);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("resize", alRedimensionar);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[45]" />;
}
