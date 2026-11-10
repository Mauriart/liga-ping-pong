import { useRef, useState } from "react";
import { motion } from "framer-motion";
import * as m from "../engine/motor";
import { avisar, esAdmin, fallo, remotasActuales, urlNube, useLigas } from "../store";
import { Ic, ir, plural } from "../ui";
import { Mesa3D } from "../components/Mesa";
import { ConectarModal, EstadoNubeChip, hayUrlFija } from "../components/Nube";

export function Inicio({ alNueva }: { alNueva: () => void }) {
  const s = useLigas();
  const { ligas, importar } = s;
  const remotas = remotasActuales(s);
  const archivo = useRef<HTMLInputElement>(null);
  const [conectar, setConectar] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "curso" | "terminados">("todos");
  const conNube = !!urlNube(s);
  const admin = esAdmin(s);
  const cargando = conNube && s.nube.estado === "cargando" && !ligas.length;

  const leer = async (f: File) => {
    try { avisar(`${plural(importar(JSON.parse(await f.text())), "liga importada", "ligas importadas")}`); }
    catch (e) { fallo(e instanceof SyntaxError ? new Error("El archivo no es un JSON válido.") : e); }
  };

  const vistas = ligas.map((l) => ({ l, v: m.vista(l) }));
  const visibles = vistas.filter(({ v }) => filtro === "todos" || (filtro === "terminados" ? !!v.campeon : !v.campeon));
  const locales = ligas.filter((l) => !remotas.includes(l.id));

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
            {ligas.length > 0 && <button className="btn btn-volt btn-lg" onClick={() => document.getElementById("torneos")?.scrollIntoView({ behavior: "smooth" })}><Ic.trophy /> Ver torneos</button>}
            <button className={`btn btn-lg ${ligas.length ? "" : "btn-volt"}`} onClick={alNueva}><Ic.plus /> Crear liga <kbd>N</kbd></button>
            <button className="btn btn-lg btn-ghost" onClick={() => archivo.current?.click()}><Ic.upload /> Importar</button>
            <input ref={archivo} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void leer(f); e.target.value = ""; }} />
          </motion.div>
        </div>
        <div className="hero-mesa"><Mesa3D inclinacion={60} className="grande" /></div>
      </section>

      <section id="torneos" className="torneos">
        <div className="modulo-cab">
          <h2 className="seccion">Torneos</h2>
          <div className="fila-btn">
            {conNube && <EstadoNubeChip />}
            {conNube && !hayUrlFija() && <button className="btn btn-ghost btn-sm" onClick={() => setConectar(true)}><Ic.gear size={15} /> Hoja</button>}
          </div>
        </div>

        {!conNube && (
          <div className="conectar-nube">
            <Ic.cloud size={28} />
            <div><b>Guarda los torneos en Google Sheets</b>
              <span>Hoy viven solo en este navegador. Conecta una hoja para que cualquiera los vea desde el enlace y tú los administres con tu clave.</span></div>
            <button className="btn btn-primary" onClick={() => setConectar(true)}><Ic.link /> Conectar Google Sheets</button>
          </div>
        )}
        {conNube && s.nube.estado === "error" && <div className="aviso error-nube"><Ic.alert size={16} /><span>{s.nube.mensaje}</span></div>}
        {admin && locales.length > 0 && (
          <div className="banner"><Ic.cloud /><span>{plural(locales.length, "torneo está", "torneos están")} solo en este navegador.</span><span className="spacer" />
            <button className="btn btn-primary btn-sm" onClick={() => { locales.forEach((l) => void s.subir(l.id)); avisar("Subiendo a la hoja…"); }}><Ic.upload size={15} /> Subir todos</button></div>
        )}

        {ligas.length > 0 && (
          <div className="barra-herr">
            <div className="seg" role="group" aria-label="Filtrar torneos">
              {([["todos", "Todos"], ["curso", "En curso"], ["terminados", "Terminados"]] as const).map(([k, t]) => (
                <button key={k} className={filtro === k ? "on" : ""} onClick={() => setFiltro(k)}>{t}</button>
              ))}
            </div>
            <span className="muted-text">{plural(visibles.length, "torneo", "torneos")}</span>
          </div>
        )}

        {cargando ? <div className="vacio panel"><Ic.cloud size={40} /><h3>Cargando torneos…</h3><p>Leyendo la hoja de Google Sheets.</p></div>
          : ligas.length === 0 ? (
            <section className="rasgos">
              <div><Ic.users size={26} /><h3>Alta rápida</h3><p>Pega una lista de nombres o escríbelos con Enter. Sin formularios eternos.</p></div>
              <div><Ic.rr2 size={26} /><h3>4 formatos</h3><p>Ida y vuelta, solo ida, eliminación directa o sistema suizo.</p></div>
              <div><Ic.play size={26} /><h3>Presentación en mesa</h3><p>Cada partido se presenta como en la tele, con la mesa al centro.</p></div>
              <div><Ic.share size={26} /><h3>Comparte la tabla</h3><p>Enlace de solo lectura o imagen lista para el chat del grupo.</p></div>
            </section>
          ) : (
            <div className="ligas">
              {visibles.map(({ l, v }, i) => {
                const pct = v.total_partidos ? Math.round((v.jugados / v.total_partidos) * 100) : 0;
                const lideres = v.campeon ? v.tabla.filter((f) => f.id === v.campeon) : v.jugados ? v.tabla.filter((f) => f.pos === 1) : [];
                const enNube = remotas.includes(l.id);
                const subiendo = s.nube.guardando.includes(l.id);
                const estado = !l.generado ? "Sin calendario" : v.campeon ? "Terminado" : v.fase_final?.activa ? "Fase final" : "En curso";
                return (
                  <motion.article key={l.id} className="lcard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.05 }}>
                    <span className="lcard-mesa" aria-hidden="true"><i /></span>
                    <div className="etiquetas">
                      <span className={`etq ${v.campeon ? "oro" : v.fase_final?.activa ? "volt" : ""}`}>{estado}</span>
                      {conNube && (enNube ? <span className="etq nube"><Ic.cloud size={12} /> En la nube</span> : <span className="etq">Solo este navegador</span>)}
                    </div>
                    <button className="lcard-nombre tocable" onClick={() => ir(`#/liga/${l.id}`)}>{l.nombre}</button>
                    <span className="lcard-lider">{v.formato_nombre}</span>
                    <span className="lcard-lider">{lideres.length ? <>{v.campeon ? "🏆 Campeón" : lideres.length > 1 ? "Líderes" : "Líder"}: <b>{lideres.map((f) => f.nombre).join(", ")}</b></> : "Sin resultados aún"}</span>
                    <div className="barra"><i style={{ width: `${pct}%` }} /></div>
                    <span className="lcard-pie"><span>{plural(l.jugadores.length, "jugador", "jugadores")}</span><span>{v.jugados}/{v.total_partidos} partidos</span></span>
                    <div className="lcard-botones">
                      <button className="btn btn-volt btn-sm" onClick={() => ir(`#/liga/${l.id}`)}><Ic.play size={14} /> Ver torneo</button>
                      <button className="btn btn-sm" onClick={() => ir(`#/liga/${l.id}/${l.config.formato === "ko" ? "cuadro" : "tabla"}`)}><Ic.table size={15} /> {l.config.formato === "ko" ? "Cuadro" : "Tabla"}</button>
                      <button className="btn btn-sm" onClick={() => ir(`#/liga/${l.id}/partidos`)}><Ic.cal size={15} /> Partidos</button>
                      {admin && !enNube && <button className="btn btn-sm btn-ghost" disabled={subiendo} onClick={() => void s.subir(l.id)}><Ic.upload size={15} /> {subiendo ? "Subiendo…" : "Subir a la nube"}</button>}
                    </div>
                  </motion.article>
                );
              })}
              {<button className="lcard nueva tocable" onClick={alNueva}><Ic.plus size={34} /><b>Nueva liga</b><span>{conNube && !admin ? "Se guarda solo en este navegador" : "Arma otra competencia"}</span></button>}
            </div>
          )}
      </section>

      <div className="atajos">
        <span><kbd>N</kbd> nueva liga</span><span><kbd>J</kbd> jugador</span><span><kbd>R</kbd> resultado</span>
        <span><kbd>P</kbd> presentar</span><span><kbd>S</kbd> compartir</span><span><kbd>1</kbd>–<kbd>4</kbd> pestañas</span>
      </div>
      <ConectarModal abierto={conectar} alCerrar={() => setConectar(false)} />
    </main>
  );
}
