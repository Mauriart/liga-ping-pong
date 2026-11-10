import * as m from "../engine/motor";
import { Ic, Seg, Stepper, Switch } from "../ui";

export function calcFormato(fmt: m.Formato, n: number, cfg: m.Config): string {
  if (n < 2) return "Necesita al menos 2 jugadores";
  const par = n % 2 === 0;
  switch (fmt) {
    case "rr2": return `${n * (n - 1)} partidos en ${2 * (par ? n - 1 : n)} jornadas`;
    case "rr1": return `${(n * (n - 1)) / 2} partidos en ${par ? n - 1 : n} jornadas`;
    case "ko": return `${n - 1} partidos en ${Math.ceil(Math.log2(n))} rondas`;
    case "suizo": {
      const r = cfg.rondas_suizo || Math.max(1, Math.ceil(Math.log2(n)));
      return `${r} rondas · ${Math.floor(n / 2) * r} partidos`;
    }
  }
}

const DESC: Record<m.Formato, [string, string]> = {
  rr2: ["Liga · ida y vuelta", "Cada jugador enfrenta a todos dos veces. La más justa."],
  rr1: ["Liga · solo ida", "Cada jugador enfrenta a todos una vez. Más corta."],
  ko: ["Eliminación directa", "Pierdes y quedas fuera. Cuadro con cabezas de serie."],
  suizo: ["Sistema suizo", "Rondas emparejando por tabla, sin revanchas."],
};

type Cambio = (c: Partial<m.Config>) => void;

export function Formatos({ cfg, n, alCambiar }: { cfg: m.Config; n: number; alCambiar: Cambio }) {
  const auto = Math.max(1, Math.ceil(Math.log2(Math.max(2, n))));
  return (
    <div className="stack-sm">
      <div className="formatos">
        {(Object.keys(DESC) as m.Formato[]).map((k) => {
          const Icono = Ic[k];
          return (
            <button type="button" key={k} className={`fmt ${cfg.formato === k ? "on" : ""}`} aria-pressed={cfg.formato === k} onClick={() => alCambiar({ formato: k })}>
              <span className="fmt-ico"><Icono size={28} /></span>
              <span className="fmt-txt">
                <b>{DESC[k][0]}</b>
                <span>{DESC[k][1]}</span>
                <em>{calcFormato(k, n, cfg)}</em>
              </span>
              {k === "rr2" && <span className="tag">Por defecto</span>}
            </button>
          );
        })}
      </div>
      <div className="tarjeta">
        <div className="fila-regla"><div><b>Sortear el orden</b><small>Mezcla jugadores al generar (cabezas de serie, localía y cruces).</small></div>
          <Switch on={cfg.sorteo} alCambiar={(v) => alCambiar({ sorteo: v })} etiqueta="Sortear el orden" /></div>
        {cfg.formato === "suizo" && (
          <div className="fila-regla"><div><b>Rondas del suizo</b><small>0 = automático ({auto} para {n} jugadores)</small></div>
            <Stepper valor={cfg.rondas_suizo} min={0} max={20} alCambiar={(v) => alCambiar({ rondas_suizo: v })} etiqueta="rondas" /></div>
        )}
      </div>
    </div>
  );
}

const PRESETS: Record<string, [string, Partial<m.Config>]> = {
  clasico: ["Clásico 3·0", { pts_victoria: 3, pts_derrota: 0, pts_wo_ganador: 3, pts_wo_perdedor: 0, bonus_barrida: 0, bonus_derrota_ajustada: 0 }],
  ittf: ["Estilo ITTF 2·1", { pts_victoria: 2, pts_derrota: 1, pts_wo_ganador: 2, pts_wo_perdedor: 0, bonus_barrida: 0, bonus_derrota_ajustada: 0 }],
  bonus: ["Con bonus", { pts_victoria: 3, pts_derrota: 0, pts_wo_ganador: 3, pts_wo_perdedor: 0, bonus_barrida: 1, bonus_derrota_ajustada: 1 }],
  simple: ["1 por victoria", { pts_victoria: 1, pts_derrota: 0, pts_wo_ganador: 1, pts_wo_perdedor: 0, bonus_barrida: 0, bonus_derrota_ajustada: 0 }],
};

export function Reglas({ cfg, alCambiar }: { cfg: m.Config; alCambiar: Cambio }) {
  const nec = m.setsParaGanar(cfg);
  const activo = Object.keys(PRESETS).find((k) => Object.entries(PRESETS[k][1]).every(([c, v]) => cfg[c as keyof m.Config] === v));
  const inactivos = (Object.keys(m.CRITERIOS) as m.Criterio[]).filter((c) => !cfg.desempate.includes(c));
  const mover = (c: m.Criterio, d: -1 | 1) => {
    const l = [...cfg.desempate]; const i = l.indexOf(c);
    [l[i], l[i + d]] = [l[i + d], l[i]];
    alCambiar({ desempate: l });
  };
  const num = (k: keyof m.Config, etiqueta: string, min = -10, max = 20) =>
    <Stepper valor={cfg[k] as number} min={min} max={max} alCambiar={(v) => alCambiar({ [k]: v })} etiqueta={etiqueta} />;

  return (
    <div className="reglas">
      <div className="tarjeta">
        <h4><Ic.score /> Partido</h4>
        <div className="fila-regla"><div><b>Al mejor de</b><small>Gana quien llega a {nec} {nec === 1 ? "set" : "sets"}</small></div>
          <Seg etiqueta="Al mejor de" opciones={[[1, "1"], [3, "3"], [5, "5"], [7, "7"]]} valor={cfg.mejor_de} alCambiar={(v) => alCambiar({ mejor_de: v })} /></div>
        <div className="fila-regla"><div><b>Puntos por set</b><small>Con empate al final, se gana por 2</small></div>
          <div className="fila-ctrl">
            <Seg etiqueta="Puntos por set" opciones={[[11, "11"], [21, "21"]]} valor={cfg.puntos_set} alCambiar={(v) => alCambiar({ puntos_set: v })} />
            {[11, 21].includes(cfg.puntos_set)
              ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => alCambiar({ puntos_set: 15 })}>Otro</button>
              : <Stepper valor={cfg.puntos_set} min={3} max={50} alCambiar={(v) => alCambiar({ puntos_set: v })} etiqueta="puntos por set" />}
          </div></div>
        <div className="fila-regla"><div><b>Cargar marcador</b><small>{cfg.marcador === "detallado" ? "Punto a punto de cada set (más estadísticas)" : "Solo sets ganados (más rápido)"}</small></div>
          <Seg etiqueta="Modo de marcador" opciones={[["detallado", "Por set"], ["sets", "Solo sets"]]} valor={cfg.marcador} alCambiar={(v) => alCambiar({ marcador: v })} /></div>
      </div>

      <div className="tarjeta">
        <h4><Ic.trophy /> Puntos de tabla</h4>
        <div className="presets">
          {Object.entries(PRESETS).map(([k, [nombre, v]]) => (
            <button type="button" key={k} className={`preset ${activo === k ? "on" : ""}`} onClick={() => alCambiar(v)}>{nombre}</button>
          ))}
          <span className={`preset ${activo ? "" : "on"}`} aria-hidden={!!activo}>Personalizado</span>
        </div>
        <div className="fila-regla"><b>Victoria</b>{num("pts_victoria", "puntos por victoria")}</div>
        <div className="fila-regla"><b>Derrota</b>{num("pts_derrota", "puntos por derrota")}</div>
        <div className="fila-regla"><div><b>W.O. ganador / perdedor</b><small>No presentarse</small></div>
          <div className="fila-ctrl">{num("pts_wo_ganador", "W.O. ganador")}{num("pts_wo_perdedor", "W.O. perdedor")}</div></div>
        <div className="fila-regla"><div><b>Bonus por barrida</b><small>Ganar sin ceder sets</small></div>{num("bonus_barrida", "bonus por barrida", 0, 10)}</div>
        <div className="fila-regla"><div><b>Bonus derrota ajustada</b><small>Perder por un solo set</small></div>{num("bonus_derrota_ajustada", "bonus derrota ajustada", 0, 10)}</div>
        <div className="ejemplo">
          <span>Ganar {nec}-0 <b>{cfg.pts_victoria + cfg.bonus_barrida} pts</b></span>
          {nec > 1 && <span>Ganar {nec}-{nec - 1} <b>{cfg.pts_victoria} pts</b></span>}
          {nec > 1 && <span>Perder {nec - 1}-{nec} <b>{cfg.pts_derrota + cfg.bonus_derrota_ajustada} pts</b></span>}
          <span>W.O. <b>{cfg.pts_wo_ganador}/{cfg.pts_wo_perdedor} pts</b></span>
        </div>
      </div>

      <div className="tarjeta ancho-total">
        <h4><Ic.table /> Orden de desempate</h4>
        <ol className="desempate">
          {cfg.desempate.map((c, i) => (
            <li key={c}><span>{m.CRITERIOS[c]}</span>
              <button type="button" className="btn btn-ghost btn-xs" disabled={i === 0} onClick={() => mover(c, -1)} aria-label={`Subir ${m.CRITERIOS[c]}`}><Ic.up /></button>
              <button type="button" className="btn btn-ghost btn-xs" disabled={i === cfg.desempate.length - 1} onClick={() => mover(c, 1)} aria-label={`Bajar ${m.CRITERIOS[c]}`}><Ic.down /></button>
              <button type="button" className="btn btn-ghost btn-xs" disabled={cfg.desempate.length === 1} onClick={() => alCambiar({ desempate: cfg.desempate.filter((x) => x !== c) })} aria-label={`Quitar ${m.CRITERIOS[c]}`}><Ic.x /></button>
            </li>
          ))}
          {inactivos.map((c) => (
            <li key={c} className="off"><span>{m.CRITERIOS[c]}</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => alCambiar({ desempate: [...cfg.desempate, c] })} aria-label={`Agregar ${m.CRITERIOS[c]}`}><Ic.plus /></button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
