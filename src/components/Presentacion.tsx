import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as m from "../engine/motor";
import { Avatar, Ic } from "../ui";
import { Mesa3D } from "./Mesa";

/**
 * Presentación tipo transmisión: la mesa sube al centro, cada jugador entra
 * desde su lado con sus números y cae el «VS». Desde aquí se registra el resultado.
 */
export function Presentacion({ liga, partidoId, alCerrar, alRegistrar, alOtro }: {
  liga: m.Vista; partidoId: string | null; alCerrar: () => void; alRegistrar: (id: string) => void; alOtro: (id: string) => void;
}) {
  const p = liga.partidos.find((x) => x.id === partidoId);
  const pendientes = liga.partidos.filter((x) => !x.bye && x.a && x.b && !x.marcador).sort((x, y) => x.ronda - y.ronda || x.orden - y.orden);
  const siguiente = p ? pendientes.find((x) => x.id !== p.id && (x.ronda > p.ronda || (x.ronda === p.ronda && x.orden > p.orden))) ?? pendientes.find((x) => x.id !== p.id) : undefined;

  useEffect(() => {
    if (!p) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); alCerrar(); }
      else if (e.key === "Enter" && !p.marcador) { e.preventDefault(); alRegistrar(p.id); }
      else if (e.key === "ArrowRight" && siguiente) alOtro(siguiente.id);
    };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [p, siguiente, alCerrar, alRegistrar, alOtro]);

  return (
    <AnimatePresence>
      {p && <Escena key={p.id} liga={liga} p={p} siguiente={siguiente} alCerrar={alCerrar} alRegistrar={alRegistrar} alOtro={alOtro} />}
    </AnimatePresence>
  );
}

function Escena({ liga, p, siguiente, alCerrar, alRegistrar, alOtro }: {
  liga: m.Vista; p: m.Partido; siguiente?: m.Partido; alCerrar: () => void; alRegistrar: (id: string) => void; alOtro: (id: string) => void;
}) {
  const fila = (id: string | null) => liga.tabla.find((f) => f.id === id);
  const fa = fila(p.a), fb = fila(p.b);
  const g = m.ganador(p);
  const esKO = liga.config.formato === "ko";
  const previos = liga.partidos.filter((x) => x.id !== p.id && x.marcador && new Set([x.a, x.b]).has(p.a) && new Set([x.a, x.b]).has(p.b));
  const ganadosA = previos.filter((x) => (m.ganador(x) === "a" ? x.a : x.b) === p.a).length;
  const indice = liga.partidos.filter((x) => x.ronda === p.ronda && !x.bye).sort((x, y) => x.orden - y.orden).findIndex((x) => x.id === p.id) + 1;

  const tarjeta = (f: m.Fila | undefined, lado: "izq" | "der") => {
    const dir = lado === "izq" ? -1 : 1;
    const gana = g ? (lado === "izq" ? g === "a" : g === "b") : false;
    return (
      <motion.div className={`walk-jug ${lado} ${gana ? "gana" : ""}`}
        initial={{ x: dir * 420, opacity: 0, skewX: dir * -8 }} animate={{ x: 0, opacity: 1, skewX: 0 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 160, damping: 20 }}>
        <Avatar nombre={f?.nombre} size="xl" />
        <span className="walk-nombre">{f?.nombre}</span>
        <div className="walk-stats">
          {!esKO && <span><b>{f?.pos}.º</b>Posición</span>}
          <span><b>{f?.g ?? 0}-{f?.p ?? 0}</b>Récord</span>
          {!esKO && <span><b>{f?.pts ?? 0}</b>Puntos</span>}
        </div>
        <div className="racha">{(f?.racha.length ? f.racha : []).map((r, i) => <i key={i} className={r}>{r}</i>)}{!f?.racha.length && <em>Debut</em>}</div>
      </motion.div>
    );
  };

  return (
    <motion.div className={`walk ${p.fase === "final" ? "es-final" : ""}`} role="dialog" aria-modal="true" aria-label="Presentación del partido"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="walk-barrido" initial={{ x: "-110%" }} animate={{ x: "110%" }} transition={{ duration: 0.9, ease: [0.7, 0, 0.3, 1] }} />
      <div className="walk-top">
        <motion.span className="eyebrow" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {liga.nombre} · {m.etiquetaPartido(liga, p)}{p.fase ? "" : ` · Partido ${indice}`}
        </motion.span>
        <button className="btn btn-ghost btn-icon" onClick={alCerrar} aria-label="Cerrar presentación"><Ic.x /></button>
      </div>

      <div className="walk-centro">
        {tarjeta(fa, "izq")}
        <motion.div className="walk-mesa" initial={{ y: 160, opacity: 0, rotateX: 30 }} animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 120, damping: 18 }}>
          <Mesa3D pelota={!p.marcador} inclinacion={62} className="grande" />
          <motion.div className="walk-vs" initial={{ scale: 3, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: -6 }}
            transition={{ delay: 1.05, type: "spring", stiffness: 380, damping: 16 }}>
            {p.marcador ? <span className="walk-final">{p.marcador[0]}<i>–</i>{p.marcador[1]}</span> : "VS"}
          </motion.div>
        </motion.div>
        {tarjeta(fb, "der")}
      </div>

      <motion.div className="walk-pie" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.3 }}>
        <div className="walk-datos">
          <span>Al mejor de <b>{liga.config.mejor_de}</b> · sets a <b>{liga.config.puntos_set}</b></span>
          <span>{previos.length ? <>Historial: <b>{ganadosA}–{previos.length - ganadosA}</b> en {previos.length} {previos.length === 1 ? "cruce" : "cruces"}</> : "Primer cruce entre ellos"}</span>
          {p.marcador && p.sets.length > 0 && <span>Sets: <b>{p.sets.map((s) => s.join("-")).join(" · ")}</b></span>}
        </div>
        <div className="walk-acciones">
          {siguiente && <button className="btn" onClick={() => alOtro(siguiente.id)}>Siguiente partido <Ic.arrow /></button>}
          <button className="btn btn-primary" onClick={() => alRegistrar(p.id)}><Ic.score /> {p.marcador ? "Editar resultado" : "Registrar resultado"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
