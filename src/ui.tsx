import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";

// ---------------------------------------------------------------- router por hash
export type Ruta =
  | { vista: "inicio" }
  | { vista: "liga"; id: string; tab: string }
  | { vista: "ver"; datos: string };

const leerRuta = (): Ruta => {
  const h = location.hash.replace(/^#\/?/, "");
  const [a, b, c] = h.split("/");
  if (a === "liga" && b) return { vista: "liga", id: b, tab: c || "tabla" };
  if (a === "ver" && b) return { vista: "ver", datos: h.slice(4) };
  return { vista: "inicio" };
};
let rutaActual = leerRuta();
const oyentes = new Set<() => void>();
window.addEventListener("hashchange", () => { rutaActual = leerRuta(); oyentes.forEach((f) => f()); });
export const useRuta = () => useSyncExternalStore((f) => { oyentes.add(f); return () => oyentes.delete(f); }, () => rutaActual);
export const ir = (hash: string) => { if (location.hash !== hash) location.hash = hash; };

// ---------------------------------------------------------------- íconos
const P = (d: ReactNode) => (p: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 18} height={p.size ?? 18} className={p.className} fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
export const Ic = {
  plus: P(<path d="M12 5v14M5 12h14" />),
  user: P(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>),
  users: P(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
  score: P(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 5v14M7 10v4M17 10v4" /></>),
  trophy: P(<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />),
  chev: P(<path d="m6 9 6 6 6-6" />),
  x: P(<path d="M18 6 6 18M6 6l12 12" />),
  check: P(<path d="M20 6 9 17l-5-5" />),
  alert: P(<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>),
  edit: P(<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />),
  trash: P(<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />),
  sun: P(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>),
  moon: P(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />),
  up: P(<path d="m18 15-6-6-6 6" />),
  down: P(<path d="m6 9 6 6 6-6" />),
  coffee: P(<><path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><path d="M6 2v2M10 2v2M14 2v2" /></>),
  refresh: P(<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />),
  download: P(<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />),
  upload: P(<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />),
  arrow: P(<path d="M5 12h14M13 6l6 6-6 6" />),
  info: P(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>),
  bolt: P(<path d="M13 2 3 14h9l-1 8 10-12h-9Z" />),
  table: P(<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18" />),
  cal: P(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  gear: P(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>),
  play: P(<path d="M6 4l14 8-14 8z" />),
  share: P(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>),
  link: P(<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />),
  image: P(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" /></>),
  rr2: P(<><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M8.5 18h7M6 8.5v7M18 8.5v7M8 8l8 8M16 8l-8 8" /></>),
  rr1: P(<><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path d="M10.7 7.2 6.3 15.8M13.3 7.2l4.4 8.6M7.5 18h9" /></>),
  ko: P(<path d="M3 4h5v6H3M3 14h5v6H3M8 7h4v10H8M12 12h5M17 9h4v6h-4z" />),
  suizo: P(<><path d="M4 6h6M14 6h6M4 12h6M14 12h6M4 18h6M14 18h6" /><path d="m10 6 4 6M10 12l4 6M10 18l4-12" opacity=".5" /></>),
};

// ---------------------------------------------------------------- avatar
const tono = (n: string) => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
export const iniciales = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
export function Avatar({ nombre, size = "md" }: { nombre?: string | null; size?: "sm" | "md" | "lg" | "xl" }) {
  if (!nombre) return <span className={`av av-${size} tbd`} aria-hidden="true">?</span>;
  return <span className={`av av-${size}`} style={{ "--h": tono(nombre) } as React.CSSProperties} aria-hidden="true">{iniciales(nombre)}</span>;
}

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export function haceCuanto(iso: string | null): string {
  if (!iso) return "";
  const seg = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seg < 60) return "ahora";
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`;
  return `hace ${Math.floor(seg / 86400)} d`;
}

// ---------------------------------------------------------------- modal
export function Modal({ abierto, alCerrar, children, ancho, etiqueta }: {
  abierto: boolean; alCerrar: () => void; children: ReactNode; ancho?: boolean; etiqueta: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // la función puede cambiar en cada render del padre: se lee por ref para no
  // reiniciar el efecto (que robaría el foco del campo donde se escribe)
  const cerrar = useRef(alCerrar);
  cerrar.current = alCerrar;
  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); cerrar.current(); } };
    window.addEventListener("keydown", k, true);
    setTimeout(() => {
      const f = ref.current?.querySelector<HTMLElement>("[autofocus], [data-foco]") ?? ref.current?.querySelector<HTMLElement>("input, button.btn-primary");
      f?.focus();
    }, 40);
    return () => { window.removeEventListener("keydown", k, true); previo?.focus?.(); };
  }, [abierto]);
  return (
    <AnimatePresence>
      {abierto && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) alCerrar(); }}>
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={etiqueta} className={`modal ${ancho ? "wide" : ""}`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Confirmación imperativa: `await confirmar({...})`. */
export function confirmar(o: { titulo: string; texto: string; ok?: string; peligro?: boolean }): Promise<boolean> {
  return new Promise((resolver) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const Dialogo = () => {
      const [abierto, setAbierto] = useState(true);
      const fin = (v: boolean) => { setAbierto(false); resolver(v); setTimeout(() => { root.unmount(); host.remove(); }, 300); };
      return (
        <Modal abierto={abierto} alCerrar={() => fin(false)} etiqueta={o.titulo}>
          <div className="modal-head"><h2>{o.titulo}</h2></div>
          <div className="modal-body"><p className="muted-text">{o.texto}</p></div>
          <div className="modal-foot"><span className="spacer" />
            <button className="btn btn-ghost" onClick={() => fin(false)}>Cancelar</button>
            <button className={`btn ${o.peligro ? "btn-danger" : "btn-primary"}`} data-foco onClick={() => fin(true)}>{o.ok ?? "Confirmar"}</button>
          </div>
        </Modal>
      );
    };
    root.render(<Dialogo />);
  });
}

// ---------------------------------------------------------------- controles
export function Stepper({ valor, min, max, alCambiar, etiqueta }: { valor: number; min: number; max: number; alCambiar: (n: number) => void; etiqueta: string }) {
  const [texto, setTexto] = useState(String(valor));
  useEffect(() => setTexto(String(valor)), [valor]);
  const fijar = (n: number) => alCambiar(Math.min(max, Math.max(min, n)));
  return (
    <span className="stepper">
      <button type="button" onClick={() => fijar(valor - 1)} aria-label={`Restar ${etiqueta}`} disabled={valor <= min}>−</button>
      <input inputMode="numeric" value={texto} aria-label={etiqueta}
        onChange={(e) => setTexto(e.target.value.replace(/[^\d-]/g, ""))}
        onBlur={() => { const n = parseInt(texto, 10); if (Number.isNaN(n)) setTexto(String(valor)); else fijar(n); }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
      <button type="button" onClick={() => fijar(valor + 1)} aria-label={`Sumar ${etiqueta}`} disabled={valor >= max}>+</button>
    </span>
  );
}

export function Seg<T extends string | number>({ opciones, valor, alCambiar, etiqueta }: {
  opciones: [T, string][]; valor: T; alCambiar: (v: T) => void; etiqueta: string;
}) {
  return (
    <div className="seg" role="group" aria-label={etiqueta}>
      {opciones.map(([v, t]) => (
        <button type="button" key={String(v)} className={v === valor ? "on" : ""} aria-pressed={v === valor} onClick={() => alCambiar(v)}>{t}</button>
      ))}
    </div>
  );
}

export function Switch({ on, alCambiar, etiqueta }: { on: boolean; alCambiar: (v: boolean) => void; etiqueta: string }) {
  return <button type="button" className={`switch ${on ? "on" : ""}`} aria-pressed={on} aria-label={etiqueta} onClick={() => alCambiar(!on)} />;
}

/** Descarga un archivo generado en el navegador. */
export function descargar(nombre: string, contenido: Blob | string, tipo = "application/json") {
  const blob = typeof contenido === "string" ? new Blob([contenido], { type: tipo }) : contenido;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
