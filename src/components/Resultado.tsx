import { useMemo, useRef, useState } from "react";
import * as m from "../engine/motor";
import { avisar, intentar, useLigas } from "../store";
import { Avatar, Ic, Modal, Seg } from "../ui";

/** Error del set para mostrar en vivo: null = incompleto, "" = válido. */
function errorSet(x: string, y: string, meta: number): string | null {
  if (x === "" || y === "") return null;
  return m.validarSet(+x, +y, meta)?.replace(/\.$/, "") ?? "";
}

export function siguientePendiente(liga: m.Liga, despuesDe?: string): m.Partido | undefined {
  const pend = liga.partidos.filter((p) => !p.bye && !p.marcador && p.a && p.b).sort((x, y) => x.ronda - y.ronda || x.orden - y.orden);
  if (!despuesDe) return pend[0];
  const ref = liga.partidos.find((p) => p.id === despuesDe);
  return pend.find((p) => ref && (p.ronda > ref.ronda || (p.ronda === ref.ronda && p.orden > ref.orden))) ?? pend[0];
}

export function Resultado({ liga, partidoId, alCerrar, alSiguiente }: {
  liga: m.Vista; partidoId: string | null; alCerrar: () => void; alSiguiente: (id: string) => void;
}) {
  return (
    <Modal abierto={!!partidoId} alCerrar={alCerrar} etiqueta="Registrar resultado">
      {partidoId && <Contenido key={partidoId} liga={liga} pid={partidoId} alCerrar={alCerrar} alSiguiente={alSiguiente} />}
    </Modal>
  );
}

function Contenido({ liga, pid, alCerrar, alSiguiente }: { liga: m.Vista; pid: string; alCerrar: () => void; alSiguiente: (id: string) => void }) {
  const editar = useLigas((s) => s.editar);
  const p = liga.partidos.find((x) => x.id === pid)!;
  const cfg = liga.config;
  const nec = m.setsParaGanar(cfg);
  const nombre = (id: string | null) => liga.jugadores.find((j) => j.id === id)?.nombre ?? "?";
  const na = nombre(p.a), nb = nombre(p.b);

  const [modo, setModo] = useState<"detallado" | "sets">(p.marcador && !p.sets.length && !p.wo ? "sets" : p.sets.length ? "detallado" : cfg.marcador);
  const [sets, setSets] = useState<[string, string][]>(() =>
    Array.from({ length: cfg.mejor_de }, (_, i) => (p.sets[i] ? [String(p.sets[i][0]), String(p.sets[i][1])] : ["", ""])));
  const [rapido, setRapido] = useState<[number, number] | null>(p.marcador && !p.wo ? p.marcador : null);
  const zona = useRef<HTMLDivElement>(null);
  const quedan = liga.partidos.some((x) => !x.bye && !x.marcador && x.a && x.b && x.id !== p.id);

  const estado = useMemo(() => {
    let ga = 0, gb = 0, error = "", decidido = false;
    const filas = sets.map(([x, y], i) => {
      if (decidido) return { idle: true as const };
      const v = errorSet(x, y, cfg.puntos_set);
      if (v === null) return { v };
      if (v) { error ||= `Set ${i + 1}: ${v}`; return { v }; }
      if (+x > +y) ga++; else gb++;
      if (ga === nec || gb === nec) decidido = true;
      return { v, gana: +x > +y ? "a" : "b" };
    });
    if (modo === "sets") return { ga: rapido?.[0] ?? 0, gb: rapido?.[1] ?? 0, listo: !!rapido, filas, error: "" };
    return { ga, gb, listo: decidido && !error, filas, error };
  }, [sets, modo, rapido, cfg.puntos_set, nec]);

  const escribir = (i: number, k: 0 | 1, valor: string) => {
    const v = valor.replace(/\D/g, "").slice(0, 2);
    const nuevo = sets.map((s) => [...s] as [string, string]);
    nuevo[i][k] = v;
    setSets(nuevo);
    // salto automático: solo cuando el marcador ya no puede crecer a otro válido
    const [x, y] = nuevo[i];
    const puedeCrecer = y.length < 2 && [...Array(10).keys()].some((d) => errorSet(x, y + d, cfg.puntos_set) === "");
    if (k === 1 && errorSet(x, y, cfg.puntos_set) === "" && !puedeCrecer) {
      let ga = 0, gb = 0;
      for (const [sx, sy] of nuevo.slice(0, i + 1)) if (errorSet(sx, sy, cfg.puntos_set) === "") { if (+sx > +sy) ga++; else gb++; }
      const decidido = ga >= nec || gb >= nec;
      setTimeout(() => {
        const destino = decidido
          ? document.querySelector<HTMLButtonElement>(".modal-foot .btn-primary")
          : !nuevo[i + 1]?.[0] ? zona.current?.querySelector<HTMLInputElement>(`input[data-i="${i + 1}"][data-k="0"]`) : null;
        destino?.focus();
      }, 0);
    }
  };

  const enviar = (datos: m.DatosResultado, siguiente: boolean) => {
    let guardado: m.Partido | undefined;
    const nueva = intentar(() => editar(liga.id, (l) => { guardado = m.registrarResultado(l, p.id, datos); }));
    if (!nueva || !guardado) return;
    const g = m.ganador(guardado);
    avisar(`${g === "a" ? na : nb} gana ${Math.max(...guardado.marcador!)}–${Math.min(...guardado.marcador!)}${guardado.wo ? " por W.O." : ""}`);
    const v = m.vista(nueva);
    if (v.campeon && !liga.campeon) setTimeout(() => avisar(`🏆 ${nombre(v.campeon)} es campeón`), 500);
    const sig = siguiente ? siguientePendiente(nueva, p.id) : undefined;
    if (sig) alSiguiente(sig.id); else alCerrar();
  };
  const datos = (): m.DatosResultado => {
    if (modo === "sets") return { marcador: rapido! };
    const corte = estado.filas.findIndex((f) => "idle" in f);
    return { sets: sets.slice(0, corte === -1 ? sets.length : corte) };
  };
  const borrar = () => {
    if (intentar(() => editar(liga.id, (l) => m.borrarResultado(l, p.id)))) { avisar("Resultado borrado"); alCerrar(); }
  };
  const lider = estado.ga > estado.gb ? "a" : estado.gb > estado.ga ? "b" : "";

  return (
    <div onKeyDown={(e) => {
      if (e.key === "Enter" && !(e.target as HTMLElement).closest("button") && estado.listo) { e.preventDefault(); enviar(datos(), e.shiftKey && quedan); }
    }}>
      <div className="modal-head">
        <div className="col"><span className="eyebrow">{m.etiquetaPartido(liga, p)} · al mejor de {cfg.mejor_de} · sets a {cfg.puntos_set}</span><h2>Resultado</h2></div>
        <span className="spacer" />
        <Seg etiqueta="Modo de carga" opciones={[["detallado", "Por set"], ["sets", "Solo sets"]]} valor={modo} alCambiar={setModo} />
        <button className="btn btn-ghost btn-icon" onClick={alCerrar} aria-label="Cerrar"><Ic.x /></button>
      </div>
      <div className="modal-body">
        <div className="marcador-tv">
          <div className={`mt-jug ${lider === "a" ? "lidera" : lider ? "atras" : ""}`}><Avatar nombre={na} size="lg" /><span>{na}</span></div>
          <div className="mt-num"><b className={lider === "a" ? "lidera" : ""}>{estado.ga}</b><i>:</i><b className={lider === "b" ? "lidera" : ""}>{estado.gb}</b></div>
          <div className={`mt-jug ${lider === "b" ? "lidera" : lider ? "atras" : ""}`}><Avatar nombre={nb} size="lg" /><span>{nb}</span></div>
          <div className={`mt-estado ${estado.listo ? "ok" : ""}`}>
            {estado.listo ? `✓ Gana ${estado.ga > estado.gb ? na : nb}` : modo === "sets" ? "Elige el marcador final" : `Primero a ${nec} ${nec === 1 ? "set" : "sets"}`}
          </div>
        </div>

        <div ref={zona}>
          {modo === "detallado" ? (
            <>
              <div className="sets">
                {sets.map(([x, y], i) => {
                  const f = estado.filas[i];
                  const idle = "idle" in f;
                  const gana = "gana" in f ? f.gana : undefined;
                  const v = "v" in f ? f.v : null;
                  return (
                    <div key={i} className={`set ${idle ? "idle" : ""}`}>
                      <span className="set-n">Set {i + 1}</span>
                      <input data-i={i} data-k={0} inputMode="numeric" value={x} tabIndex={idle ? -1 : 0} className={gana === "a" ? "gana" : ""}
                        aria-label={`Set ${i + 1}, ${na}`} onChange={(e) => escribir(i, 0, e.target.value)} autoFocus={i === 0 && !p.marcador && modo === "detallado"} />
                      <span className="set-guion">–</span>
                      <input data-i={i} data-k={1} inputMode="numeric" value={y} tabIndex={idle ? -1 : 0} className={gana === "b" ? "gana" : ""}
                        aria-label={`Set ${i + 1}, ${nb}`} onChange={(e) => escribir(i, 1, e.target.value)} />
                      <span className={`set-ok ${v === "" ? "ok" : v ? "mal" : ""}`} title={v || ""}>{v === "" ? <Ic.check /> : v ? <Ic.alert /> : null}</span>
                    </div>
                  );
                })}
              </div>
              <p className="set-error" role="status">{estado.error}</p>
            </>
          ) : (
            <div className="rapidos">
              {(["a", "b"] as const).map((lado) => (
                <div key={lado} className="col">
                  <span className="eyebrow">Gana {lado === "a" ? na : nb}</span>
                  {Array.from({ length: nec }, (_, k) => (lado === "a" ? [nec, k] : [k, nec]) as [number, number]).map(([x, y]) => (
                    <button key={`${x}-${y}`} type="button" className={`rapido ${rapido?.[0] === x && rapido?.[1] === y ? "on" : ""}`}
                      onClick={() => setRapido([x, y])} autoFocus={lado === "a" && x === nec && y === 0 && !rapido}>{x} – {y}</button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="wo">No se presentó:
          <button type="button" className="btn btn-sm" onClick={() => enviar({ wo: "a" }, false)}>W.O. a favor de {na}</button>
          <button type="button" className="btn btn-sm" onClick={() => enviar({ wo: "b" }, false)}>W.O. a favor de {nb}</button>
        </div>
      </div>
      <div className="modal-foot">
        {p.marcador && <button className="btn btn-ghost btn-danger" onClick={borrar}><Ic.trash /> Borrar</button>}
        <span className="spacer" />
        {quedan && <button className="btn" disabled={!estado.listo} onClick={() => enviar(datos(), true)} title="Shift+Enter">Guardar y siguiente</button>}
        <button className="btn btn-primary" disabled={!estado.listo} onClick={() => enviar(datos(), false)} title="Enter"><Ic.check /> Guardar</button>
      </div>
    </div>
  );
}
