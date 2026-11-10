import { useState } from "react";
import * as m from "../engine/motor";
import { avisar, fallo, intentar, useLigas } from "../store";
import { Ic, Modal, ir, plural } from "../ui";
import { Chips } from "./Chips";
import { Formatos, Reglas, calcFormato } from "./Reglas";

const PASOS = ["Liga y jugadores", "Formato", "Reglas"];

export function Asistente({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  return (
    <Modal abierto={abierto} alCerrar={alCerrar} ancho etiqueta="Nueva liga">
      {abierto && <Contenido alCerrar={alCerrar} />}
    </Modal>
  );
}

function Contenido({ alCerrar }: { alCerrar: () => void }) {
  const crearLiga = useLigas((s) => s.crearLiga);
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState("");
  const [jugadores, setJugadores] = useState<string[]>([]);
  const [cfg, setCfg] = useState<m.Config>(structuredClone(m.CONFIG_DEFECTO));
  const cambiar = (c: Partial<m.Config>) => setCfg((x) => ({ ...x, ...c }));
  const n = jugadores.length;

  const validar = () => {
    if (!nombre.trim()) { fallo("Ponle nombre a la liga."); document.getElementById("w-nombre")?.focus(); return false; }
    return true;
  };
  const crear = () => {
    if (!validar()) return;
    const liga = intentar(() => crearLiga(nombre, cfg, jugadores));
    if (!liga) return;
    alCerrar();
    ir(`#/liga/${liga.id}/${liga.generado ? "partidos" : "jugadores"}`);
    avisar(liga.generado ? `Liga creada · ${liga.partidos.filter((p) => !p.bye).length} partidos generados` : "Liga creada · suma jugadores para generar el calendario");
  };

  return (
    <>
      <div className="modal-head">
        <ol className="pasos">
          {PASOS.map((t, i) => (
            <li key={t} className={paso === i + 1 ? "on" : paso > i + 1 ? "ok" : ""}><i>{paso > i + 1 ? "✓" : i + 1}</i><span>{t}</span></li>
          ))}
        </ol>
        <span className="spacer" />
        <button className="btn btn-ghost btn-icon" onClick={alCerrar} aria-label="Cerrar"><Ic.x /></button>
      </div>
      <div className="modal-body">
        {paso === 1 && (
          <>
            <label className="campo"><span>Nombre de la liga</span>
              <input id="w-nombre" className="input grande" placeholder="Liga de la oficina" value={nombre} maxLength={60} autoFocus
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.querySelector<HTMLInputElement>(".chips input")?.focus(); } }} />
            </label>
            <div className="campo"><span>Jugadores</span>
              <Chips lista={jugadores} alCambiar={setJugadores} />
              <small className="pista">Enter para agregar · pega una lista separada por comas o renglones · Retroceso borra el último</small>
            </div>
          </>
        )}
        {paso === 2 && <Formatos cfg={cfg} n={n} alCambiar={cambiar} />}
        {paso === 3 && <Reglas cfg={cfg} alCambiar={cambiar} />}
      </div>
      <div className="modal-foot">
        {paso > 1 && <button className="btn btn-ghost" onClick={() => setPaso(paso - 1)}>Atrás</button>}
        <span className="spacer" />
        <span className="muted-text hide-sm">{plural(n, "jugador", "jugadores")}{n >= 2 ? ` · ${calcFormato(cfg.formato, n, cfg)}` : ""}</span>
        {paso === 1 && <button className="btn" onClick={crear} title="Todos contra todos, ida y vuelta">Crear ya</button>}
        {paso < 3
          ? <button className="btn btn-primary" onClick={() => validar() && setPaso(paso + 1)}>Siguiente <Ic.arrow /></button>
          : <button className="btn btn-primary" onClick={crear}><Ic.bolt /> Crear liga</button>}
      </div>
    </>
  );
}

export function avisoAltas(liga: m.Liga): string {
  if (!liga.generado) return liga.jugadores.length >= 1 ? "Al llegar a 2 jugadores se genera el calendario automáticamente." : "Suma al menos 2 jugadores para empezar.";
  return {
    rr1: "Al sumar a alguien se agregan sus partidos y se conservan los resultados ya cargados.",
    rr2: "Al sumar a alguien se agregan sus partidos de ida y vuelta; se conservan los resultados ya cargados.",
    ko: "Ojo: en eliminación directa, sumar o quitar jugadores rehace el cuadro y borra sus resultados.",
    suizo: "En suizo, quien se suma entra desde la próxima ronda.",
  }[liga.config.formato];
}

/** Suma jugadores a una liga y genera el calendario al llegar a 2 si aún no existe. */
export function sumarJugadores(liga: m.Liga, nombres: string[]): number {
  const editar = useLigas.getState().editar;
  let nuevos = 0;
  const generadoAntes = liga.generado;
  const r = intentar(() => editar(liga.id, (l) => {
    nuevos = m.agregarJugadores(l, nombres).length;
    if (!nuevos) throw new m.ErrorLiga("No hay nombres nuevos para agregar (¿ya estaban?).");
    if (!l.generado && l.jugadores.length >= 2) m.generarCalendario(l);
  }));
  if (r) avisar(`${nuevos === 1 ? `${nombres[0]} se sumó` : `${nuevos} jugadores sumados`}${!generadoAntes && r.generado ? " · calendario generado" : ""}`);
  return r ? nuevos : 0;
}

export function AgregarJugadores({ liga, abierto, alCerrar }: { liga: m.Liga; abierto: boolean; alCerrar: () => void }) {
  return (
    <Modal abierto={abierto} alCerrar={alCerrar} etiqueta="Agregar jugadores">
      {abierto && <AltaContenido liga={liga} alCerrar={alCerrar} />}
    </Modal>
  );
}

function AltaContenido({ liga, alCerrar }: { liga: m.Liga; alCerrar: () => void }) {
  const [lista, setLista] = useState<string[]>([]);
  const guardar = () => {
    const pendiente = document.querySelector<HTMLInputElement>(".modal .chips input")?.value ?? "";
    const todos = [...lista, ...m.limpiarNombres([pendiente])];
    if (!todos.length) return;
    if (sumarJugadores(liga, todos)) alCerrar();
  };
  return (
    <>
      <div className="modal-head"><h2>Agregar jugadores</h2><span className="spacer" />
        <button className="btn btn-ghost btn-icon" onClick={alCerrar} aria-label="Cerrar"><Ic.x /></button></div>
      <div className="modal-body">
        <Chips lista={lista} alCambiar={setLista} existentes={liga.jugadores.map((j) => j.nombre)} autoFocus />
        <div className="aviso"><Ic.info size={16} /><span>{avisoAltas(liga)}</span></div>
      </div>
      <div className="modal-foot"><span className="muted-text">Ya hay {plural(liga.jugadores.length, "jugador", "jugadores")}</span><span className="spacer" />
        <button className="btn btn-ghost" onClick={alCerrar}>Cancelar</button>
        <button className="btn btn-primary" onClick={guardar}><Ic.plus /> Agregar{lista.length ? ` ${lista.length}` : ""}</button>
      </div>
    </>
  );
}
