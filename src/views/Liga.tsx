import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import * as m from "../engine/motor";
import { avisar, fallo, intentar, useLigas } from "../store";
import { Avatar, Ic, Modal, confirmar, descargar, haceCuanto, ir, plural } from "../ui";
import { Mesa3D, MiniMesa, Placa } from "../components/Mesa";
import { Resultado, siguientePendiente } from "../components/Resultado";
import { Presentacion } from "../components/Presentacion";
import { AgregarJugadores, avisoAltas, sumarJugadores } from "../components/Asistente";
import { CompartirModal } from "../components/Compartir";
import { Formatos, Reglas } from "../components/Reglas";

const escribiendo = (e: KeyboardEvent) => (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
const hayCapa = () => !!document.querySelector(".overlay, .walk, .intro");

export function LigaView({ id, tab }: { id: string; tab: string }) {
  const liga = useLigas((s) => s.ligas.find((l) => l.id === id));
  const v = useMemo(() => (liga ? m.vista(liga) : null), [liga]);
  const [resultado, setResultado] = useState<string | null>(null);
  const [presenta, setPresenta] = useState<string | null>(null);
  const [alta, setAlta] = useState(false);
  const [compartir, setCompartir] = useState(false);
  const [ficha, setFicha] = useState<string | null>(null);

  const esKO = v?.config.formato === "ko";
  const tabs = esKO ? ["cuadro", "partidos", "jugadores", "ajustes"] : ["tabla", "partidos", "jugadores", "ajustes"];
  const tabActual = tabs.includes(tab) ? tab : tabs[0];
  const irTab = (t: string) => ir(`#/liga/${id}/${t}`);

  const registrarSiguiente = () => {
    if (!v) return;
    if (!v.generado) { fallo("Primero suma jugadores para generar el calendario."); return; }
    const s = siguientePendiente(v);
    if (s) setResultado(s.id);
    else avisar(v.puede_avanzar ? "Ronda completa: genera la siguiente desde Partidos." : "No quedan partidos pendientes. 🏓");
  };
  const presentarSiguiente = () => {
    if (!v) return;
    const s = siguientePendiente(v);
    if (s) setPresenta(s.id); else avisar("No hay partidos por presentar.");
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (escribiendo(e) || hayCapa() || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.key.toLowerCase();
      if (t === "j") { e.preventDefault(); setAlta(true); }
      else if (t === "r") { e.preventDefault(); registrarSiguiente(); }
      else if (t === "p") { e.preventDefault(); presentarSiguiente(); }
      else if (t === "s" && v?.generado) { e.preventDefault(); setCompartir(true); }
      else if (["1", "2", "3", "4"].includes(t)) irTab(tabs[+t - 1]);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!v) {
    return (
      <div className="vacio">
        <Ic.alert size={40} /><h3>Esta liga no existe aquí</h3>
        <p>Puede que se haya borrado o que esté guardada en otro navegador.</p>
        <button className="btn btn-primary" onClick={() => ir("#/")}>Ir al inicio</button>
      </div>
    );
  }

  return (
    <>
      <Ticker v={v} />
      <main className="contenedor">
        <Encabezado v={v} alAlta={() => setAlta(true)} alRegistrar={registrarSiguiente} alCompartir={() => setCompartir(true)} />
        <Escenario v={v} alPresentar={setPresenta} alRegistrar={setResultado} alAlta={() => setAlta(true)} />

        <nav className="tabs" role="tablist" aria-label="Secciones de la liga">
          {tabs.map((t, i) => {
            const n = t === "partidos" ? v.total_partidos - v.jugados : t === "jugadores" ? v.jugadores.length : 0;
            const nombre = { tabla: "Tabla", cuadro: "Cuadro", partidos: "Partidos", jugadores: "Jugadores", ajustes: "Ajustes" }[t];
            return (
              <button key={t} role="tab" aria-selected={tabActual === t} className={`tab ${tabActual === t ? "on" : ""}`} onClick={() => irTab(t)} title={`Atajo: ${i + 1}`}>
                {nombre}{n > 0 && <span className="cuenta">{n}</span>}
                {tabActual === t && <motion.span layoutId="tab-sub" className="tab-sub" />}
              </button>
            );
          })}
        </nav>

        <section className="pestana" key={tabActual}>
          {tabActual === "tabla" && <TablaTab v={v} alFicha={setFicha} alResultado={setResultado} irTab={irTab} />}
          {tabActual === "cuadro" && <CuadroTab v={v} alResultado={setResultado} alPresentar={setPresenta} />}
          {tabActual === "partidos" && <PartidosTab v={v} alResultado={setResultado} alPresentar={setPresenta} />}
          {tabActual === "jugadores" && <JugadoresTab v={v} alFicha={setFicha} />}
          {tabActual === "ajustes" && <AjustesTab v={v} />}
        </section>
      </main>

      <Resultado liga={v} partidoId={resultado} alCerrar={() => setResultado(null)} alSiguiente={(x) => setResultado(x)} />
      <Presentacion liga={v} partidoId={presenta} alCerrar={() => setPresenta(null)}
        alRegistrar={(x) => { setPresenta(null); setResultado(x); }} alOtro={setPresenta} />
      <AgregarJugadores liga={v} abierto={alta} alCerrar={() => setAlta(false)} />
      <CompartirModal liga={v} abierto={compartir} alCerrar={() => setCompartir(false)} />
      <Ficha v={v} id={ficha} alCerrar={() => setFicha(null)} alResultado={(x) => { setFicha(null); setResultado(x); }} />
    </>
  );
}

// ---------------------------------------------------------------- piezas
const nombreDe = (v: m.Liga, id: string | null) => (id ? v.jugadores.find((j) => j.id === id)?.nombre ?? "?" : null);
const rondaActual = (v: m.Vista) => Array.from({ length: v.total_rondas }, (_, r) => r).find((r) => v.partidos.some((p) => p.ronda === r && !m.terminado(p)));

function Ticker({ v }: { v: m.Vista }) {
  const ultimos = v.partidos.filter((p) => p.marcador).sort((a, b) => (b.jugado ?? "").localeCompare(a.jugado ?? "")).slice(0, 12);
  if (!ultimos.length) return null;
  const item = (p: m.Partido, k: string) => {
    const g = m.ganador(p);
    return (
      <span className="tick" key={k}>
        <em>{v.nombres_ronda[p.ronda]}</em>
        <span className={g === "a" ? "w" : ""}>{nombreDe(v, p.a)}</span>
        <b>{p.marcador![0]}–{p.marcador![1]}</b>
        <span className={g === "b" ? "w" : ""}>{nombreDe(v, p.b)}</span>
        {p.wo && <em>W.O.</em>}
      </span>
    );
  };
  return (
    <div className="ticker" aria-label="Últimos resultados">
      <span className="ticker-tag"><i />Resultados</span>
      <div className="ticker-pista"><div className="ticker-corre" style={{ "--dur": `${Math.max(22, ultimos.length * 7)}s` } as React.CSSProperties}>
        {ultimos.map((p) => item(p, p.id))}{ultimos.map((p) => item(p, p.id + "-b"))}
      </div></div>
    </div>
  );
}

function Encabezado({ v, alAlta, alRegistrar, alCompartir }: { v: m.Vista; alAlta: () => void; alRegistrar: () => void; alCompartir: () => void }) {
  const pct = v.total_partidos ? Math.round((v.jugados / v.total_partidos) * 100) : 0;
  const actual = rondaActual(v);
  const sets = v.partidos.reduce((t, p) => t + (p.marcador && !p.wo ? p.marcador[0] + p.marcador[1] : 0), 0);
  const Icono = Ic[v.config.formato];
  return (
    <header className="encabezado">
      <div className="enc-info">
        <div className="etiquetas">
          <span className="etq volt"><Icono size={14} /> {v.formato_nombre}</span>
          <span className="etq">Al mejor de {v.config.mejor_de}</span>
          <span className="etq">Sets a {v.config.puntos_set}</span>
          {v.campeon ? <span className="etq oro"><Ic.trophy size={14} /> Finalizada</span> : v.jugados > 0 && <span className="etq vivo"><i />En juego</span>}
        </div>
        <motion.h1 className="titular" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>{v.nombre}</motion.h1>
        <div className="enc-progreso">
          <span>{v.generado ? (v.campeon ? "Temporada terminada" : actual !== undefined ? `${v.nombres_ronda[actual]} en juego` : "En juego") : "Sin calendario"}</span>
          <div className="barra"><i style={{ width: `${pct}%` }} /></div>
          <b>{pct}%</b>
        </div>
      </div>
      <div className="enc-kpis">
        <div><b>{v.jugadores.length}</b><span>Jugadores</span></div>
        <div><b>{v.jugados}<small>/{v.total_partidos}</small></b><span>Partidos</span></div>
        <div><b>{v.total_rondas}</b><span>{v.config.formato === "rr1" || v.config.formato === "rr2" ? "Jornadas" : "Rondas"}</span></div>
        <div><b>{sets}</b><span>Sets</span></div>
      </div>
      <div className="enc-acciones">
        <button className="btn" onClick={alAlta}><Ic.user /> Jugador <kbd>J</kbd></button>
        <button className="btn" onClick={alCompartir} disabled={!v.generado}><Ic.share /> Compartir <kbd>S</kbd></button>
        <button className="btn btn-primary" onClick={alRegistrar}><Ic.score /> Resultado <kbd>R</kbd></button>
      </div>
    </header>
  );
}

/** La mesa principal: el próximo partido se juega aquí. */
function Escenario({ v, alPresentar, alRegistrar, alAlta }: { v: m.Vista; alPresentar: (id: string) => void; alRegistrar: (id: string) => void; alAlta: () => void }) {
  const prox = siguientePendiente(v);
  const fila = (id: string | null) => v.tabla.find((f) => f.id === id);
  const esKO = v.config.formato === "ko";
  const detalle = (id: string | null) => {
    const f = fila(id);
    if (!f) return null;
    return esKO ? `${f.g}-${f.p}` : `${f.pos}.º · ${f.pts} pts · ${f.g}-${f.p}`;
  };

  if (v.campeon) {
    const c = fila(v.campeon);
    return (
      <section className="escenario campeon">
        <Mesa3D pelota={false} centro={
          <div className="esc-campeon"><Ic.trophy size={40} /><span className="eyebrow">Campeón</span><Avatar nombre={c?.nombre} size="xl" /><b>{c?.nombre}</b>
            {!esKO && c && <small>{c.pts} pts · {c.g}-{c.p}</small>}</div>} />
      </section>
    );
  }
  if (!v.generado || !prox) {
    return (
      <section className="escenario">
        <Mesa3D centro={
          <div className="esc-vacio">
            <span className="eyebrow">{v.generado ? "Ronda completa" : "La mesa está lista"}</span>
            <b>{v.generado ? "Genera la siguiente ronda" : v.jugadores.length < 2 ? "Faltan jugadores" : "Genera el calendario"}</b>
            {!v.generado && <button className="btn btn-primary" onClick={alAlta}><Ic.user /> Sumar jugadores</button>}
          </div>} />
      </section>
    );
  }
  return (
    <section className="escenario" aria-label="Próximo partido">
      <Mesa3D
        izquierda={<Placa lado="izq" nombre={nombreDe(v, prox.a)} detalle={detalle(prox.a)} />}
        derecha={<Placa lado="der" nombre={nombreDe(v, prox.b)} detalle={detalle(prox.b)} />}
        centro={<div className="esc-bug"><span>Próximo partido</span><b>{v.nombres_ronda[prox.ronda]}</b></div>} />
      <div className="esc-acciones">
        <button className="btn btn-volt" onClick={() => alPresentar(prox.id)}><Ic.play size={16} /> Presentar <kbd>P</kbd></button>
        <button className="btn" onClick={() => alRegistrar(prox.id)}><Ic.score /> Registrar resultado</button>
      </div>
    </section>
  );
}

function Racha({ r }: { r: ("G" | "P")[] }) {
  const c = [...Array(Math.max(0, 5 - r.length)).fill(null), ...r];
  return <span className="racha">{c.map((x, i) => <i key={i} className={x ?? "n"}>{x ?? "·"}</i>)}</span>;
}
const dif = (n: number) => <span className={n > 0 ? "pos" : n < 0 ? "neg" : ""}>{n > 0 ? "+" : ""}{n}</span>;

function TablaTab({ v, alFicha, alResultado, irTab }: { v: m.Vista; alFicha: (id: string) => void; alResultado: (id: string) => void; irTab: (t: string) => void }) {
  if (!v.generado) return <SinCalendario v={v} />;
  const ultimos = v.partidos.filter((p) => p.marcador).sort((a, b) => (b.jugado ?? "").localeCompare(a.jugado ?? "")).slice(0, 6);
  return (
    <div className="grid-tabla">
      <div className="stack">
        {v.config.formato === "suizo" && v.puede_avanzar && <BannerSuizo v={v} />}
        <div className="panel desliza">
          <table className="tabla">
            <thead><tr>
              <th>#</th><th className="izq">Jugador</th><th title="Partidos jugados">PJ</th><th title="Ganados">G</th><th title="Perdidos">P</th>
              <th className="hide-sm" title="Sets a favor">SF</th><th className="hide-sm" title="Sets en contra">SC</th><th title="Diferencia de sets">DS</th>
              <th className="hide-md" title="Puntos a favor">PF</th><th className="hide-md" title="Puntos en contra">PC</th>
              <th className="pts">PTS</th><th className="hide-sm">Racha</th>
            </tr></thead>
            <tbody>
              {v.tabla.map((f) => (
                <motion.tr key={f.id} layout className={`p${f.pos} tocable`} onClick={() => alFicha(f.id)}>
                  <td className="pos"><b>{f.pos}</b>{f.mov !== undefined && <small className={f.mov > 0 ? "sube" : f.mov < 0 ? "baja" : "igual"}>{f.mov > 0 ? `▲${f.mov}` : f.mov < 0 ? `▼${-f.mov}` : "="}</small>}</td>
                  <td className="izq"><span className="jug"><Avatar nombre={f.nombre} /><span>{f.nombre}</span>{v.campeon === f.id && <Ic.trophy size={15} className="oro" />}</span></td>
                  <td>{f.pj}</td><td>{f.g}</td><td>{f.p}</td>
                  <td className="hide-sm">{f.sf}</td><td className="hide-sm">{f.sc}</td><td>{dif(f.ds)}</td>
                  <td className="hide-md">{f.pf}</td><td className="hide-md">{f.pc}</td>
                  <td className="pts">{f.pts}</td><td className="hide-sm"><Racha r={f.racha} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="leyenda">
            <span><i className="oro" />1.º</span><span><i className="plata" />2.º</span><span><i className="bronce" />3.º</span>
            <span>Victoria {v.config.pts_victoria} · Derrota {v.config.pts_derrota}{v.config.bonus_barrida ? ` · Barrida +${v.config.bonus_barrida}` : ""}{v.config.bonus_derrota_ajustada ? ` · Ajustada +${v.config.bonus_derrota_ajustada}` : ""}</span>
            <span>Desempate: {v.config.desempate.map((c) => m.CRITERIOS[c]).join(" › ")}</span>
          </div>
        </div>
      </div>
      <aside className="stack">
        <div className="modulo">
          <div className="modulo-cab"><h3>Titulares</h3><button className="enlace-btn" onClick={() => irTab("partidos")}>Ver todo ›</button></div>
          {ultimos.length ? ultimos.map((p) => {
            const g = m.ganador(p);
            return (
              <button key={p.id} className="titular-res tocable" onClick={() => alResultado(p.id)}>
                <span className="tr-meta">{v.nombres_ronda[p.ronda]} · {haceCuanto(p.jugado)}</span>
                <span className="tr-linea"><span className={g === "a" ? "w" : ""}>{nombreDe(v, p.a)}</span><b>{p.marcador![0]}–{p.marcador![1]}</b><span className={g === "b" ? "w" : ""}>{nombreDe(v, p.b)}</span></span>
              </button>
            );
          }) : <p className="muted-text">Aún no hay resultados. El primero aparece aquí.</p>}
        </div>
      </aside>
    </div>
  );
}

function BannerSuizo({ v }: { v: m.Vista }) {
  const editar = useLigas((s) => s.editar);
  const n = Math.max(0, ...v.partidos.map((p) => p.ronda + 1)) + 1;
  return (
    <div className="banner"><Ic.info /><span>Ronda completa. Empareja la siguiente según la tabla actual.</span><span className="spacer" />
      <button className="btn btn-primary btn-sm" onClick={() => intentar(() => { editar(v.id, m.siguienteRondaSuizo); avisar("Nueva ronda emparejada"); })}><Ic.bolt /> Generar ronda {n}</button></div>
  );
}

function SinCalendario({ v }: { v: m.Vista }) {
  const editar = useLigas((s) => s.editar);
  const n = v.jugadores.length;
  return (
    <div className="vacio panel">
      <Ic.cal size={40} />
      <h3>{n < 2 ? "Faltan jugadores" : "Calendario sin generar"}</h3>
      <p>{n < 2 ? `Necesitas al menos 2 jugadores. Llevas ${n}.` : `Tienes ${n} jugadores listos.`}</p>
      {n >= 2 && <button className="btn btn-primary" onClick={() => intentar(() => { editar(v.id, (l) => m.generarCalendario(l)); avisar("Partidos generados"); })}><Ic.bolt /> Generar partidos</button>}
    </div>
  );
}

function TarjetaPartido({ v, p, alResultado, alPresentar }: { v: m.Vista; p: m.Partido; alResultado: (id: string) => void; alPresentar: (id: string) => void }) {
  if (p.bye) {
    return (
      <div className="partido"><MiniMesa a={nombreDe(v, p.a ?? p.b)} b={null} apagada centro={<span className="mm-bug vs">BYE</span>} />
        <div className="partido-pie"><span className="muted-text">{v.config.formato === "suizo" ? "Descansa · suma victoria" : "Pase directo"}</span></div></div>
    );
  }
  const g = m.ganador(p);
  const listo = !!(p.a && p.b);
  return (
    <div className={`partido ${p.marcador ? "jugado" : ""}`}>
      <button className="partido-mesa tocable" disabled={!listo} onClick={() => alResultado(p.id)} aria-label={`${nombreDe(v, p.a) ?? "Por definir"} contra ${nombreDe(v, p.b) ?? "Por definir"}`}>
        <MiniMesa a={nombreDe(v, p.a)} b={nombreDe(v, p.b)} ganador={g} apagada={!listo}
          centro={p.marcador
            ? <span className="mm-bug"><b className={g === "a" ? "w" : ""}>{p.marcador[0]}</b><i>-</i><b className={g === "b" ? "w" : ""}>{p.marcador[1]}</b></span>
            : <span className="mm-bug vs">VS</span>} />
      </button>
      <div className="partido-pie">
        {p.marcador
          ? <><span className={`etq-mini ${p.wo ? "wo" : "final"}`}>{p.wo ? "W.O." : "FINAL"}</span>{p.sets.length > 0 && <span className="muted-text">{p.sets.map((s) => s.join("-")).join(" · ")}</span>}</>
          : <span className="muted-text">{listo ? "Por jugar" : "Esperando rivales"}</span>}
        <span className="spacer" />
        {listo && <button className="btn btn-ghost btn-xs" onClick={() => alPresentar(p.id)} title="Presentar partido"><Ic.play size={14} /> Presentar</button>}
        {listo && !p.marcador && <button className="btn btn-ghost btn-xs volt-txt" onClick={() => alResultado(p.id)}>Registrar <Ic.arrow size={14} /></button>}
      </div>
    </div>
  );
}

function PartidosTab({ v, alResultado, alPresentar }: { v: m.Vista; alResultado: (id: string) => void; alPresentar: (id: string) => void }) {
  const actual = rondaActual(v);
  const [abiertas, setAbiertas] = useState<Set<number>>(() => new Set([actual ?? Math.max(0, v.total_rondas - 1)]));
  const [filtro, setFiltro] = useState<"todos" | "pendientes" | "jugados">("todos");
  const [jugador, setJugador] = useState("");
  if (!v.generado) return <SinCalendario v={v} />;
  const filtrando = filtro !== "todos" || !!jugador;
  const pasa = (p: m.Partido) => {
    if (jugador && p.a !== jugador && p.b !== jugador) return false;
    if (p.bye) return filtro === "todos" && v.config.formato !== "ko";
    if (filtro === "pendientes") return !p.marcador;
    if (filtro === "jugados") return !!p.marcador;
    return true;
  };
  const maxRonda = Math.max(-1, ...v.partidos.map((p) => p.ronda));
  const rondas = Array.from({ length: maxRonda + 1 }, (_, r) => r).map((r) => {
    const todos = v.partidos.filter((p) => p.ronda === r).sort((a, b) => a.orden - b.orden);
    const ps = todos.filter(pasa);
    if (!ps.length && filtrando) return null;
    const reales = todos.filter((p) => !p.bye);
    const hechos = reales.filter((p) => p.marcador).length;
    const abierta = filtrando || abiertas.has(r);
    const juegan = new Set(reales.flatMap((p) => [p.a, p.b]));
    const libres = v.config.formato.startsWith("rr") && !filtrando ? v.jugadores.filter((j) => !juegan.has(j.id)) : [];
    return (
      <div key={r} className={`ronda ${abierta ? "abierta" : ""} ${r === actual ? "actual" : ""}`}>
        <button className="ronda-cab" aria-expanded={abierta} onClick={() => setAbiertas((s) => { const n = new Set(s); n.has(r) ? n.delete(r) : n.add(r); return n; })}>
          <b>{v.nombres_ronda[r] ?? `Ronda ${r + 1}`}</b>
          <span className="muted-text">{hechos}/{reales.length} jugados</span>
          {r === actual ? <span className="etq vivo"><i />En juego</span> : hechos === reales.length && reales.length > 0 && <span className="etq ok">Completa</span>}
          <Ic.chev className="chev" />
        </button>
        {abierta && (
          <div className="ronda-cuerpo">
            {ps.map((p) => <TarjetaPartido key={p.id} v={v} p={p} alResultado={alResultado} alPresentar={alPresentar} />)}
            {libres.length > 0 && <div className="descansa"><Ic.coffee size={15} /> Descansa: {libres.map((j) => j.nombre).join(", ")}</div>}
          </div>
        )}
      </div>
    );
  }).filter(Boolean);

  return (
    <>
      {v.config.formato === "suizo" && v.puede_avanzar && <BannerSuizo v={v} />}
      <div className="barra-herr">
        <div className="seg" role="group" aria-label="Filtrar partidos">
          {(["todos", "pendientes", "jugados"] as const).map((f) => <button key={f} className={filtro === f ? "on" : ""} onClick={() => setFiltro(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}
        </div>
        <select className="select" value={jugador} onChange={(e) => setJugador(e.target.value)} aria-label="Filtrar por jugador">
          <option value="">Todos los jugadores</option>
          {v.jugadores.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
        </select>
        <span className="spacer" />
        {!filtrando && <button className="btn btn-ghost btn-sm" onClick={() => setAbiertas(abiertas.size > 1 ? new Set([actual ?? 0]) : new Set(Array.from({ length: maxRonda + 1 }, (_, i) => i)))}>
          {abiertas.size > 1 ? "Contraer todo" : "Expandir todo"}</button>}
      </div>
      {rondas.length ? rondas : <div className="vacio panel"><Ic.check size={40} /><h3>Nada por aquí</h3><p>No hay partidos con ese filtro.</p></div>}
    </>
  );
}

function CuadroTab({ v, alResultado, alPresentar }: { v: m.Vista; alResultado: (id: string) => void; alPresentar: (id: string) => void }) {
  if (!v.generado) return <SinCalendario v={v} />;
  return (
    <div className="panel cuadro-panel">
      <div className="cuadro">
        {v.nombres_ronda.map((nr, r) => (
          <div key={r} className="cuadro-col">
            <h3>{nr}</h3>
            <div className="cuadro-lista">
              {v.partidos.filter((p) => p.ronda === r).sort((a, b) => a.orden - b.orden).map((p) => {
                const g = p.bye ? (p.a ? "a" : "b") : m.ganador(p);
                const listo = !!(p.a && p.b) && !p.bye;
                const fila = (k: "a" | "b") => {
                  const nm = nombreDe(v, p[k]);
                  return (
                    <div className={`cf ${!nm ? "tbd" : g ? (g === k ? "gana" : "pierde") : ""}`}>
                      <Avatar nombre={nm} size="sm" /><span>{nm ?? (p.bye ? "Pase directo" : "Por definir")}</span><b>{p.marcador?.[k === "a" ? 0 : 1] ?? ""}</b>
                    </div>
                  );
                };
                return (
                  <div key={p.id} className="cuadro-cruce">
                    <button className="cuadro-btn tocable" disabled={!listo} onClick={() => alResultado(p.id)}>{fila("a")}{fila("b")}</button>
                    {listo && !p.marcador && <button className="cuadro-play" onClick={() => alPresentar(p.id)} aria-label="Presentar partido"><Ic.play size={12} /></button>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {v.campeon && (
          <div className="cuadro-campeon"><Ic.trophy size={44} /><span className="eyebrow">Campeón</span><Avatar nombre={nombreDe(v, v.campeon)} size="lg" /><b>{nombreDe(v, v.campeon)}</b></div>
        )}
      </div>
    </div>
  );
}

function JugadoresTab({ v, alFicha }: { v: m.Vista; alFicha: (id: string) => void }) {
  const editar = useLigas((s) => s.editar);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const filas = Object.fromEntries(v.tabla.map((f) => [f.id, f]));
  const esKO = v.config.formato === "ko";

  const quitar = async (j: m.Jugador) => {
    const jugados = v.partidos.filter((p) => p.marcador && (p.a === j.id || p.b === j.id)).length;
    const extra = !v.generado ? "" : esKO ? " El cuadro se rehace y se pierden los resultados."
      : jugados ? ` Se borran sus ${plural(jugados, "partido jugado", "partidos jugados")} y la tabla se recalcula.` : " Se quitan sus partidos del calendario.";
    if (!(await confirmar({ titulo: `¿Eliminar a ${j.nombre}?`, texto: `Sale de la liga.${extra}`, ok: "Eliminar", peligro: true }))) return;
    if (intentar(() => editar(v.id, (l) => m.eliminarJugador(l, j.id)))) avisar(`${j.nombre} eliminado`);
  };
  const renombrar = (j: m.Jugador, nombre: string) => {
    setEditando(null);
    if (!nombre.trim() || nombre.trim() === j.nombre) return;
    if (intentar(() => editar(v.id, (l) => m.renombrarJugador(l, j.id, nombre)))) avisar("Nombre actualizado");
  };

  return (
    <>
      <form className="alta-rapida" onSubmit={(e) => { e.preventDefault(); const n = m.limpiarNombres([texto]); if (n.length && sumarJugadores(v, n)) setTexto(""); }}>
        <Ic.user size={22} />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus aria-label="Nombre del jugador"
          placeholder="Escribe un nombre y pulsa Enter… (o pega varios separados por coma)" />
        <button className="btn btn-primary" type="submit"><Ic.plus /><span className="hide-sm">Agregar</span></button>
      </form>
      <p className="pista">{avisoAltas(v)}</p>
      {v.jugadores.length ? (
        <div className="jugadores">
          {v.jugadores.map((j, i) => {
            const f = filas[j.id];
            return (
              <motion.div key={j.id} className="jcard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.025 }}>
                <span className="jcard-pos">{esKO ? "" : f?.pos}</span>
                <Avatar nombre={j.nombre} />
                <div className="jcard-info">
                  {editando === j.id
                    ? <input className="renombrar" defaultValue={j.nombre} autoFocus maxLength={40} aria-label="Nuevo nombre"
                        onBlur={(e) => renombrar(j, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { e.stopPropagation(); setEditando(null); } }} />
                    : <button className="jcard-nombre tocable" onClick={() => alFicha(j.id)}>{j.nombre}</button>}
                  <span className="muted-text">{f?.pj ? `${f.g}G · ${f.p}P${esKO ? "" : ` · ${f.pts} pts`}` : "Sin partidos jugados"}</span>
                </div>
                <div className="jcard-acc">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditando(j.id)} aria-label={`Renombrar a ${j.nombre}`}><Ic.edit /></button>
                  <button className="btn btn-ghost btn-icon btn-sm btn-danger" onClick={() => quitar(j)} aria-label={`Eliminar a ${j.nombre}`}><Ic.trash /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : <div className="vacio panel"><Ic.users size={40} /><h3>Sin jugadores</h3><p>Escribe arriba el primer nombre. Con 2 ya puedes generar partidos.</p></div>}
    </>
  );
}

function AjustesTab({ v }: { v: m.Vista }) {
  const { editar, borrarLiga } = useLigas();
  const [borrador, setBorrador] = useState<m.Config>(() => structuredClone(v.config));
  const [nombre, setNombre] = useState(v.nombre);
  const cambios = JSON.stringify(borrador) !== JSON.stringify(v.config);
  const regenera = m.requiereRegenerar(v, borrador);

  const guardar = async () => {
    if (regenera && v.jugados && !(await confirmar({ titulo: "¿Guardar y regenerar?", texto: `El cambio rehace el calendario: se pierden ${plural(v.jugados, "resultado", "resultados")}.`, ok: "Guardar y regenerar", peligro: true }))) return;
    if (intentar(() => editar(v.id, (l) => m.cambiarConfig(l, borrador)))) avisar("Ajustes guardados");
  };
  const regenerar = async () => {
    if (v.jugados && !(await confirmar({ titulo: "¿Regenerar calendario?", texto: `Se perderán los ${v.jugados} resultados cargados.`, ok: "Regenerar", peligro: true }))) return;
    if (intentar(() => editar(v.id, (l) => m.generarCalendario(l)))) avisar("Calendario regenerado");
  };
  const eliminar = async () => {
    if (!(await confirmar({ titulo: `¿Eliminar «${v.nombre}»?`, texto: "Se borran jugadores, partidos y resultados. No se puede deshacer.", ok: "Eliminar liga", peligro: true }))) return;
    borrarLiga(v.id); ir("#/"); avisar("Liga eliminada");
  };
  const exportar = () => {
    const { tabla: _t, ...liga } = v;
    void _t;
    const limpia = Object.fromEntries(Object.entries(liga).filter(([k]) => ["id", "nombre", "creada", "config", "jugadores", "partidos", "generado", "orden_inicial"].includes(k)));
    descargar(`${v.nombre.replace(/[^\w\-]+/g, "_")}.json`, JSON.stringify(limpia, null, 2));
  };

  return (
    <div className="stack">
      <div className="panel panel-pad">
        <label className="campo"><span>Nombre de la liga</span>
          <input className="input grande" value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)}
            onBlur={() => { const n = nombre.trim(); if (n && n !== v.nombre && intentar(() => editar(v.id, (l) => { l.nombre = n.slice(0, 60); }))) avisar("Nombre guardado"); else setNombre(v.nombre); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
        </label>
      </div>
      <div className="panel panel-pad"><h3 className="seccion">Formato</h3><Formatos cfg={borrador} n={v.jugadores.length} alCambiar={(c) => setBorrador((b) => ({ ...b, ...c }))} /></div>
      <div className="panel panel-pad"><h3 className="seccion">Reglas y puntuación</h3><Reglas cfg={borrador} alCambiar={(c) => setBorrador((b) => ({ ...b, ...c }))} /></div>
      <div className="panel panel-pad herramientas">
        <h3 className="seccion">Herramientas</h3>
        <div className="fila-regla"><div><b>Regenerar calendario</b><small>Rehace todos los cruces{v.config.sorteo ? " con un nuevo sorteo" : ""}. Se pierden los resultados.</small></div>
          <button className="btn" onClick={regenerar}><Ic.refresh /> Regenerar</button></div>
        <div className="fila-regla"><div><b>Exportar liga</b><small>Descarga un respaldo en JSON (se puede importar desde el inicio).</small></div>
          <button className="btn" onClick={exportar}><Ic.download /> Exportar</button></div>
        <div className="fila-regla"><div><b>Ver la intro</b><small>Reproduce otra vez la animación de entrada.</small></div>
          <button className="btn" onClick={() => window.dispatchEvent(new Event("topspin:intro"))}><Ic.play size={16} /> Reproducir</button></div>
        <div className="fila-regla"><div><b>Eliminar liga</b><small>No se puede deshacer.</small></div>
          <button className="btn btn-danger" onClick={eliminar}><Ic.trash /> Eliminar</button></div>
      </div>
      {cambios && (
        <motion.div className="barra-guardar" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <span>{regenera ? "⚠ Cambiar formato, sets o puntos por set regenera el calendario y borra los resultados." : "Tienes cambios sin guardar. La tabla se recalcula al guardar."}</span>
          <button className="btn btn-ghost" onClick={() => setBorrador(structuredClone(v.config))}>Descartar</button>
          <button className="btn btn-primary" onClick={guardar}><Ic.check /> Guardar</button>
        </motion.div>
      )}
    </div>
  );
}

function Ficha({ v, id, alCerrar, alResultado }: { v: m.Vista; id: string | null; alCerrar: () => void; alResultado: (id: string) => void }) {
  const f = v.tabla.find((x) => x.id === id);
  const ps = f ? v.partidos.filter((p) => !p.bye && (p.a === f.id || p.b === f.id)).sort((a, b) => a.ronda - b.ronda) : [];
  return (
    <Modal abierto={!!f} alCerrar={alCerrar} ancho etiqueta="Ficha del jugador">
      {f && (
        <>
          <div className="modal-head"><Avatar nombre={f.nombre} size="lg" />
            <div className="col"><span className="eyebrow">{v.config.formato === "ko" ? "Jugador" : `${f.pos}.º en la tabla`}</span><h2>{f.nombre}</h2></div>
            <span className="spacer" /><button className="btn btn-ghost btn-icon" onClick={alCerrar} aria-label="Cerrar"><Ic.x /></button></div>
          <div className="modal-body">
            <div className="kpis">
              <div><b>{f.pts}</b><span>Puntos</span></div><div><b>{f.g}-{f.p}</b><span>Récord</span></div>
              <div><b>{f.sf}-{f.sc}</b><span>Sets</span></div><div><b>{f.pj ? Math.round((f.g / f.pj) * 100) : 0}%</b><span>Victorias</span></div>
            </div>
            <div className="ficha-partidos">
              {ps.map((p) => {
                const g = m.ganador(p);
                return (
                  <button key={p.id} className="partido-mesa tocable" disabled={!p.a || !p.b} onClick={() => alResultado(p.id)}>
                    <MiniMesa a={nombreDe(v, p.a)} b={nombreDe(v, p.b)} ganador={g}
                      centro={p.marcador ? <span className="mm-bug"><b className={g === "a" ? "w" : ""}>{p.marcador[0]}</b><i>-</i><b className={g === "b" ? "w" : ""}>{p.marcador[1]}</b></span> : <span className="mm-bug vs">{v.nombres_ronda[p.ronda]}</span>} />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
