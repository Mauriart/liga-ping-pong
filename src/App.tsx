import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { esAdmin, urlNube, useAvisos, useLigas } from "./store";
import { Avatar, Ic, ir, useRuta } from "./ui";
import { Intro } from "./components/Intro";
import { Cursor } from "./components/Cursor";
import { Asistente } from "./components/Asistente";
import { Inicio } from "./views/Inicio";
import { LigaView } from "./views/Liga";
import { Compartido } from "./views/Compartido";
import { AdminModal, EstadoNubeChip } from "./components/Nube";

const INTRO_VISTA = "topspin.intro";
const leerSesion = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };

export function App() {
  const ruta = useRuta();
  const tema = useLigas((s) => s.tema);
  const [intro, setIntro] = useState(() => ruta.vista !== "ver" && !leerSesion(INTRO_VISTA));
  const [nueva, setNueva] = useState(false);

  const terminarIntro = useCallback(() => {
    setIntro(false);
    try { sessionStorage.setItem(INTRO_VISTA, "1"); } catch { /* sin almacenamiento */ }
  }, []);

  useEffect(() => { document.documentElement.dataset.tema = tema; }, [tema]);
  // sincronización con la hoja: al abrir, al volver a la pestaña y cada 45 s
  const url = useLigas((s) => urlNube(s));
  useEffect(() => {
    if (!url) return;
    const cargar = () => { if (document.visibilityState === "visible") void useLigas.getState().cargarNube(); };
    cargar();
    const t = setInterval(cargar, 45000);
    window.addEventListener("focus", cargar);
    document.addEventListener("visibilitychange", cargar);
    return () => { clearInterval(t); window.removeEventListener("focus", cargar); document.removeEventListener("visibilitychange", cargar); };
  }, [url]);
  useEffect(() => {
    const ver = () => setIntro(true);
    window.addEventListener("topspin:intro", ver);
    return () => window.removeEventListener("topspin:intro", ver);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select") || document.querySelector(".overlay, .walk, .intro") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toLowerCase() === "n" && ruta.vista !== "ver") { e.preventDefault(); setNueva(true); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [ruta.vista]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [ruta.vista, ruta.vista === "liga" ? ruta.id : ""]);

  return (
    <>
      <Cursor />
      <AnimatePresence>{intro && <Intro key="intro" alTerminar={terminarIntro} />}</AnimatePresence>
      <BarraSuperior alNueva={() => setNueva(true)} compartido={ruta.vista === "ver"} />
      {ruta.vista === "inicio" && <Inicio alNueva={() => setNueva(true)} />}
      {ruta.vista === "liga" && <LigaView id={ruta.id} tab={ruta.tab} />}
      {ruta.vista === "ver" && <Compartido datos={ruta.datos} />}
      <Asistente abierto={nueva} alCerrar={() => setNueva(false)} />
      <Avisos />
    </>
  );
}

function BarraSuperior({ alNueva, compartido }: { alNueva: () => void; compartido: boolean }) {
  const estado = useLigas();
  const { ligas, tema, setTema } = estado;
  const [admin, setAdmin] = useState(false);
  const conNube = !!urlNube(estado);
  const soyAdmin = esAdmin(estado);
  const ruta = useRuta();
  const actual = ruta.vista === "liga" ? ligas.find((l) => l.id === ruta.id) : undefined;
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const fuera = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [menu]);

  return (
    <header className="topbar">
      <a className="marca" href="#/" aria-label="TOPSPIN, inicio">
        <span className="marca-ico" aria-hidden="true"><span /></span>
        <b>TOPSPIN</b>
      </a>
      {!compartido && ligas.length > 0 && (
        <div className="selector" ref={ref}>
          <button className="selector-btn" onClick={() => setMenu(!menu)} aria-haspopup="menu" aria-expanded={menu}>
            {actual ? <Avatar nombre={actual.nombre} size="sm" /> : <Ic.trophy size={16} />}
            <span>{actual?.nombre ?? "Mis ligas"}</span><Ic.chev size={14} />
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div className="menu" role="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                {ligas.map((l) => (
                  <button key={l.id} role="menuitem" className={actual?.id === l.id ? "on" : ""} onClick={() => { setMenu(false); ir(`#/liga/${l.id}`); }}>
                    <Avatar nombre={l.nombre} size="sm" /><span>{l.nombre}</span>
                  </button>
                ))}
                <hr />
                <button role="menuitem" onClick={() => { setMenu(false); alNueva(); }}><Ic.plus /><span>Nueva liga</span><kbd>N</kbd></button>
                <button role="menuitem" onClick={() => { setMenu(false); ir("#/"); }}><Ic.trophy /><span>Ver todas</span></button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <span className="spacer" />
      {!compartido && <span className="hide-sm"><EstadoNubeChip /></span>}
      {!compartido && conNube && (
        <button className={`btn btn-icon ${soyAdmin ? "btn-admin" : "btn-ghost"}`} onClick={() => setAdmin(true)}
          aria-label={soyAdmin ? "Modo administrador activo" : "Entrar como administrador"} title={soyAdmin ? "Administrador" : "Entrar como administrador"}>
          {soyAdmin ? <Ic.unlock /> : <Ic.lock />}
        </button>
      )}
      <AdminModal abierto={admin} alCerrar={() => setAdmin(false)} />
      <button className="btn btn-ghost btn-icon" onClick={() => setTema(tema === "oscuro" ? "claro" : "oscuro")} aria-label={tema === "oscuro" ? "Usar tema claro" : "Usar tema oscuro"}>
        {tema === "oscuro" ? <Ic.sun /> : <Ic.moon />}
      </button>
      {!compartido && <button className="btn btn-primary hide-sm" onClick={alNueva}><Ic.plus /> Nueva liga</button>}
    </header>
  );
}

function Avisos() {
  const { avisos, quitar } = useAvisos();
  return (
    <div className="avisos" aria-live="polite">
      <AnimatePresence>
        {avisos.map((a) => (
          <motion.div key={a.id} className={`toast ${a.error ? "error" : ""}`} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
            onClick={() => quitar(a.id)}>
            {a.error ? <Ic.alert /> : <Ic.check />}<span>{a.texto}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
