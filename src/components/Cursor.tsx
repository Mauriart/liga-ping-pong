import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * Cursor personalizado: una paleta que sigue al mouse con un poco de inercia.
 * Se inclina sobre lo que se puede tocar y hace el golpe al hacer clic.
 * En campos de texto vuelve el cursor normal; en pantallas táctiles no aparece.
 */
export function Cursor() {
  const reducido = useReducedMotion();
  const [activo, setActivo] = useState(false);
  const [estado, setEstado] = useState<"normal" | "listo" | "texto" | "fuera">("fuera");
  const [golpe, setGolpe] = useState(0);
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 50, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 900, damping: 50, mass: 0.4 });
  const punto = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fino = window.matchMedia("(pointer: fine)");
    const actualizar = () => setActivo(fino.matches);
    actualizar();
    fino.addEventListener("change", actualizar);
    return () => fino.removeEventListener("change", actualizar);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("cursor-paleta", activo);
    if (!activo) return;
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX); y.set(e.clientY);
      if (punto.current) punto.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const el = e.target as HTMLElement;
      if (el.closest("input:not([type=range]):not([type=checkbox]), textarea, [contenteditable=true]")) setEstado("texto");
      else if (el.closest("button:not(:disabled), a, [role=button], select, label, .tocable")) setEstado("listo");
      else setEstado("normal");
    };
    const salir = () => setEstado("fuera");
    const clic = () => setGolpe((g) => g + 1);
    window.addEventListener("pointermove", mover);
    document.addEventListener("mouseleave", salir);
    window.addEventListener("pointerdown", clic);
    return () => {
      window.removeEventListener("pointermove", mover);
      document.removeEventListener("mouseleave", salir);
      window.removeEventListener("pointerdown", clic);
    };
  }, [activo, x, y]);

  if (!activo) return null;
  const visible = estado !== "texto" && estado !== "fuera";
  return (
    <>
      {/* punto exacto: precisión al apuntar */}
      <div ref={punto} className="cursor-punto" style={{ opacity: visible ? 1 : 0 }} aria-hidden="true" />
      <motion.div className="cursor-paleta-el" style={{ x: sx, y: sy, opacity: visible ? 1 : 0 }} aria-hidden="true">
        <motion.svg key={golpe} viewBox="0 0 48 48" width="40" height="40"
          initial={reducido || golpe === 0 ? false : { rotate: -55, scale: 0.9 }}
          animate={{ rotate: estado === "listo" ? -10 : -28, scale: estado === "listo" ? 1.15 : 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 18 }}
          style={{ transformOrigin: "30% 30%" }}>
          <rect x="22" y="26" width="7" height="18" rx="3" transform="rotate(-38 25 35)" fill="#c08a4f" />
          <circle cx="18" cy="18" r="14" fill="#e11d2e" stroke="#000" strokeWidth="2" />
          <circle cx="14" cy="13" r="4" fill="rgba(255,255,255,.25)" />
        </motion.svg>
      </motion.div>
    </>
  );
}
