import { useRef } from "react";
import { motion } from "framer-motion";
import * as m from "../engine/motor";
import { avisar, fallo, useLigas } from "../store";
import { Ic, ir, plural } from "../ui";
import { Mesa3D } from "../components/Mesa";

export function Inicio({ alNueva }: { alNueva: () => void }) {
  const ligas = useLigas((s) => s.ligas);
  const importar = useLigas((s) => s.importar);
  const archivo = useRef<HTMLInputElement>(null);

  const leer = async (f: File) => {
    try {
      const n = importar(JSON.parse(await f.text()));
      avisar(`${plural(n, "liga importada", "ligas importadas")}`);
    } catch (e) { fallo(e instanceof SyntaxError ? new Error("El archivo no es un JSON válido.") : e); }
  };

  return (
    <main className="contenedor">
      <section className="hero">
        <div className="hero-texto">
          <motion.span className="eyebrow volt-txt" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Temporada {new Date().getFullYear()}</motion.span>
          <motion.h1 className="titular gigante" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 120 }}>
            Cada punto<br /><em>cuenta.</em>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Tu liga de ping pong con cara de transmisión: suma jugadores, elige el formato y genera todos los partidos en segundos.
          </motion.p>
          <motion.div className="fila-btn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button className="btn btn-volt btn-lg" onClick={alNueva}><Ic.plus /> Crear liga <kbd>N</kbd></button>
            <button className="btn btn-lg" onClick={() => archivo.current?.click()}><Ic.upload /> Importar</button>
            <input ref={archivo} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) leer(f); e.target.value = ""; }} />
          </motion.div>
        </div>
        <div className="hero-mesa"><Mesa3D inclinacion={60} className="grande" /></div>
      </section>

      {ligas.length > 0 ? (
        <section>
          <div className="modulo-cab"><h2 className="seccion">Mis ligas</h2><span className="muted-text">{plural(ligas.length, "liga", "ligas")}</span></div>
          <div className="ligas">
            {ligas.map((l, i) => {
              const v = m.vista(l);
              const pct = v.total_partidos ? Math.round((v.jugados / v.total_partidos) * 100) : 0;
              const lideres = v.campeon ? v.tabla.filter((f) => f.id === v.campeon) : v.jugados ? v.tabla.filter((f) => f.pos === 1) : [];
              return (
                <motion.button key={l.id} className="lcard tocable" onClick={() => ir(`#/liga/${l.id}`)}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <span className="lcard-mesa" aria-hidden="true"><i /></span>
                  <span className="etq">{v.formato_nombre}</span>
                  <b className="lcard-nombre">{l.nombre}</b>
                  <span className="lcard-lider">{lideres.length ? <>{v.campeon ? "🏆 Campeón" : lideres.length > 1 ? "Líderes" : "Líder"}: <b>{lideres.map((f) => f.nombre).join(", ")}</b></> : "Sin resultados aún"}</span>
                  <div className="barra"><i style={{ width: `${pct}%` }} /></div>
                  <span className="lcard-pie"><span>{plural(l.jugadores.length, "jugador", "jugadores")}</span><span>{v.jugados}/{v.total_partidos} partidos</span></span>
                </motion.button>
              );
            })}
            <button className="lcard nueva tocable" onClick={alNueva}><Ic.plus size={34} /><b>Nueva liga</b><span>Arma otra competencia</span></button>
          </div>
        </section>
      ) : (
        <section className="rasgos">
          <div><Ic.users size={26} /><h3>Alta rápida</h3><p>Pega una lista de nombres o escríbelos con Enter. Sin formularios eternos.</p></div>
          <div><Ic.rr2 size={26} /><h3>4 formatos</h3><p>Ida y vuelta, solo ida, eliminación directa o sistema suizo.</p></div>
          <div><Ic.play size={26} /><h3>Presentación en mesa</h3><p>Cada partido se presenta como en la tele, con la mesa al centro.</p></div>
          <div><Ic.share size={26} /><h3>Comparte la tabla</h3><p>Enlace de solo lectura o imagen lista para el chat del grupo.</p></div>
        </section>
      )}

      <div className="atajos">
        <span><kbd>N</kbd> nueva liga</span><span><kbd>J</kbd> jugador</span><span><kbd>R</kbd> resultado</span>
        <span><kbd>P</kbd> presentar</span><span><kbd>S</kbd> compartir</span><span><kbd>1</kbd>–<kbd>4</kbd> pestañas</span>
      </div>
    </main>
  );
}
