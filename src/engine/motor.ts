/**
 * Motor de la liga: formatos, calendario, resultados y tabla de posiciones.
 * Funciones puras sobre objetos simples (se guardan tal cual en JSON).
 * Las funciones que cambian una liga la mutan: el store trabaja sobre una copia.
 */

export type Formato = "rr2" | "rr1" | "ko" | "suizo";
export type Criterio = "puntos" | "h2h" | "dif_sets" | "dif_puntos" | "victorias" | "sets_favor" | "puntos_favor";
export type Lado = "a" | "b";

export interface Config {
  formato: Formato;
  mejor_de: number;
  puntos_set: number;
  marcador: "detallado" | "sets";
  pts_victoria: number;
  pts_derrota: number;
  pts_wo_ganador: number;
  pts_wo_perdedor: number;
  bonus_barrida: number;
  bonus_derrota_ajustada: number;
  rondas_suizo: number;
  sorteo: boolean;
  desempate: Criterio[];
}

export interface Jugador { id: string; nombre: string }

export interface Partido {
  id: string;
  ronda: number;
  orden: number;
  a: string | null;
  b: string | null;
  sets: [number, number][];
  marcador: [number, number] | null;
  wo: Lado | null;
  jugado: string | null;
  bye?: boolean;
}

export interface Liga {
  id: string;
  nombre: string;
  creada: string;
  config: Config;
  jugadores: Jugador[];
  partidos: Partido[];
  generado: boolean;
  orden_inicial?: string[];
}

export interface Fila {
  id: string; nombre: string;
  pj: number; g: number; p: number; sf: number; sc: number; pf: number; pc: number;
  pts: number; wo: number; descansos: number; racha: ("G" | "P")[];
  ds: number; dp: number; pos: number; mov?: number;
}

export interface Vista extends Liga {
  tabla: Fila[];
  formato_nombre: string;
  total_rondas: number;
  nombres_ronda: string[];
  jugados: number;
  total_partidos: number;
  campeon: string | null;
  puede_avanzar: boolean;
  sets_para_ganar: number;
}

export const FORMATOS: Record<Formato, string> = {
  rr2: "Todos contra todos · ida y vuelta",
  rr1: "Todos contra todos · solo ida",
  ko: "Eliminación directa",
  suizo: "Sistema suizo",
};

export const CRITERIOS: Record<Criterio, string> = {
  puntos: "Puntos",
  h2h: "Enfrentamiento directo",
  dif_sets: "Diferencia de sets",
  dif_puntos: "Diferencia de puntos",
  victorias: "Victorias",
  sets_favor: "Sets a favor",
  puntos_favor: "Puntos a favor",
};

export const CONFIG_DEFECTO: Config = {
  formato: "rr2",
  mejor_de: 5,
  puntos_set: 11,
  marcador: "detallado",
  pts_victoria: 3,
  pts_derrota: 0,
  pts_wo_ganador: 3,
  pts_wo_perdedor: 0,
  bonus_barrida: 0,
  bonus_derrota_ajustada: 0,
  rondas_suizo: 0,
  sorteo: false,
  desempate: ["puntos", "h2h", "dif_sets", "dif_puntos", "victorias"],
};

export class ErrorLiga extends Error {}

const nuevoId = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2) + Date.now().toString(16)).replace(/-/g, "").slice(0, 10);
export const ahora = () => new Date().toISOString().slice(0, 19);

function mezclar<T>(lista: T[]): T[] {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

// ---------------------------------------------------------------- configuración

export function normalizarConfig(cfg: Partial<Config> | undefined, base: Config = CONFIG_DEFECTO): Config {
  const final: Config = structuredClone(base);
  for (const [k, v] of Object.entries(cfg ?? {})) {
    if (k in CONFIG_DEFECTO) (final as unknown as Record<string, unknown>)[k] = v;
  }
  if (!(final.formato in FORMATOS)) throw new ErrorLiga("Formato de liga desconocido.");
  const numericos = ["mejor_de", "puntos_set", "rondas_suizo", "pts_victoria", "pts_derrota",
    "pts_wo_ganador", "pts_wo_perdedor", "bonus_barrida", "bonus_derrota_ajustada"] as const;
  for (const k of numericos) {
    const n = Number(final[k]);
    if (!Number.isFinite(n)) throw new ErrorLiga("Los valores numéricos de la configuración no son válidos.");
    final[k] = Math.trunc(n);
  }
  if (final.mejor_de < 1 || final.mejor_de % 2 === 0 || final.mejor_de > 9)
    throw new ErrorLiga("«Al mejor de» debe ser un número impar entre 1 y 9.");
  if (final.puntos_set < 3 || final.puntos_set > 50) throw new ErrorLiga("Los puntos por set deben estar entre 3 y 50.");
  if (final.marcador !== "detallado" && final.marcador !== "sets") throw new ErrorLiga("Modo de marcador desconocido.");
  final.sorteo = Boolean(final.sorteo);
  const criterios = [...new Set(final.desempate.filter((c) => c in CRITERIOS))];
  final.desempate = criterios.length ? criterios : [...CONFIG_DEFECTO.desempate];
  return final;
}

export const setsParaGanar = (cfg: Config) => Math.floor(cfg.mejor_de / 2) + 1;

// ---------------------------------------------------------------- liga y jugadores

export function nuevaLiga(nombre: string, cfg?: Partial<Config>, nombres: string[] = []): Liga {
  nombre = (nombre ?? "").trim();
  if (!nombre) throw new ErrorLiga("La liga necesita un nombre.");
  const liga: Liga = {
    id: nuevoId(), nombre: nombre.slice(0, 60), creada: ahora(),
    config: normalizarConfig(cfg), jugadores: [], partidos: [], generado: false,
  };
  agregarJugadores(liga, nombres);
  return liga;
}

export function limpiarNombres(nombres: string[]): string[] {
  const salida: string[] = [];
  for (const bruto of nombres) {
    for (const parte of String(bruto).split(/[\n,;]+/)) {
      const limpio = parte.split(/\s+/).filter(Boolean).join(" ").slice(0, 40);
      if (limpio) salida.push(limpio);
    }
  }
  return salida;
}

const clave = (s: string) => s.toLocaleLowerCase("es");

/** Agrega jugadores (ignora duplicados) y ajusta el calendario si ya existe. */
export function agregarJugadores(liga: Liga, nombres: string[]): Jugador[] {
  const existentes = new Set(liga.jugadores.map((j) => clave(j.nombre)));
  const nuevos: Jugador[] = [];
  for (const nombre of limpiarNombres(nombres)) {
    if (existentes.has(clave(nombre))) continue;
    existentes.add(clave(nombre));
    const j = { id: nuevoId(), nombre };
    liga.jugadores.push(j);
    nuevos.push(j);
  }
  if (nuevos.length && liga.generado) {
    const fmt = liga.config.formato;
    if (fmt === "rr1" || fmt === "rr2") generarCalendario(liga, true);
    else if (fmt === "ko") generarCalendario(liga, false);
    // en suizo el jugador entra en la próxima ronda
  }
  return nuevos;
}

export function renombrarJugador(liga: Liga, pid: string, nombre: string) {
  nombre = (nombre ?? "").split(/\s+/).filter(Boolean).join(" ").slice(0, 40);
  if (!nombre) throw new ErrorLiga("El nombre no puede quedar vacío.");
  if (liga.jugadores.some((j) => j.id !== pid && clave(j.nombre) === clave(nombre)))
    throw new ErrorLiga("Ya hay un jugador con ese nombre.");
  buscarJugador(liga, pid).nombre = nombre;
}

export function eliminarJugador(liga: Liga, pid: string) {
  buscarJugador(liga, pid);
  liga.jugadores = liga.jugadores.filter((j) => j.id !== pid);
  if (!liga.generado) return;
  const fmt = liga.config.formato;
  if (fmt === "ko") {
    if (liga.jugadores.length >= 2) generarCalendario(liga, false);
    else { liga.partidos = []; liga.generado = false; }
  } else if (fmt === "rr1" || fmt === "rr2") {
    if (liga.jugadores.length >= 2) generarCalendario(liga, true);
    else { liga.partidos = []; liga.generado = false; }
  } else {
    liga.partidos = liga.partidos.filter((p) => p.a !== pid && p.b !== pid);
  }
}

export function buscarJugador(liga: Liga, pid: string): Jugador {
  const j = liga.jugadores.find((x) => x.id === pid);
  if (!j) throw new ErrorLiga("Jugador no encontrado.");
  return j;
}

export function buscarPartido(liga: Liga, mid: string): Partido {
  const p = liga.partidos.find((x) => x.id === mid);
  if (!p) throw new ErrorLiga("Partido no encontrado.");
  return p;
}

// ---------------------------------------------------------------- calendario

const crearPartido = (ronda: number, orden: number, a: string | null, b: string | null, extra: Partial<Partido> = {}): Partido =>
  ({ id: nuevoId(), ronda, orden, a, b, sets: [], marcador: null, wo: null, jugado: null, ...extra });

/** Método del círculo. Devuelve jornadas con pares (local, visitante). */
export function roundRobin(ids: string[], idaYVuelta: boolean): [string, string][][] {
  let jug: (string | null)[] = [...ids];
  if (jug.length % 2) jug.push(null);
  const n = jug.length;
  const jornadas: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pares: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      let a = jug[i], b = jug[n - 1 - i];
      if (a === null || b === null) continue;
      if (i === 0 && r % 2 === 1) [a, b] = [b, a];
      pares.push([a, b]);
    }
    jornadas.push(pares);
    jug = [jug[0], jug[n - 1], ...jug.slice(1, n - 1)];
  }
  if (idaYVuelta) return [...jornadas, ...jornadas.map((j) => j.map(([a, b]) => [b, a] as [string, string]))];
  return jornadas;
}

/** Orden de cabezas de serie en un cuadro (1 contra el último, etc.). */
export function ordenCuadro(tamano: number): number[] {
  let orden = [1];
  while (orden.length < tamano) {
    const suma = orden.length * 2 + 1;
    orden = orden.flatMap((s) => [s, suma - s]);
  }
  return orden;
}

export function rondasSuizo(liga: Liga): number {
  const n = liga.jugadores.length;
  if (liga.config.rondas_suizo > 0) return liga.config.rondas_suizo;
  return n > 1 ? Math.max(1, Math.ceil(Math.log2(n))) : 1;
}

export function generarCalendario(liga: Liga, conservar = false) {
  let ids = liga.jugadores.map((j) => j.id);
  if (ids.length < 2) throw new ErrorLiga("Se necesitan al menos 2 jugadores para generar partidos.");
  const cfg = liga.config;
  const previos = conservar ? liga.partidos : [];
  if (cfg.sorteo && !conservar) ids = mezclar(ids);
  const partidos: Partido[] = [];

  if (cfg.formato === "rr1" || cfg.formato === "rr2") {
    const viejos = new Map(previos.filter((p) => p.marcador).map((p) => [`${p.a}|${p.b}`, p]));
    roundRobin(ids, cfg.formato === "rr2").forEach((jornada, r) => {
      jornada.forEach(([a, b], o) => {
        const nuevo = crearPartido(r, o, a, b);
        let antes = viejos.get(`${a}|${b}`);
        if (antes) viejos.delete(`${a}|${b}`);
        let girado = false;
        if (!antes && cfg.formato === "rr1") {
          antes = viejos.get(`${b}|${a}`);
          if (antes) { viejos.delete(`${b}|${a}`); girado = true; }
        }
        if (antes) {
          nuevo.id = antes.id;
          nuevo.jugado = antes.jugado;
          if (girado) {
            nuevo.sets = antes.sets.map(([x, y]) => [y, x]);
            nuevo.marcador = antes.marcador ? [antes.marcador[1], antes.marcador[0]] : null;
            nuevo.wo = antes.wo === "a" ? "b" : antes.wo === "b" ? "a" : null;
          } else {
            nuevo.sets = antes.sets; nuevo.marcador = antes.marcador; nuevo.wo = antes.wo;
          }
        }
        partidos.push(nuevo);
      });
    });
  } else if (cfg.formato === "ko") {
    const tamano = 2 ** Math.ceil(Math.log2(ids.length));
    const casillas = ordenCuadro(tamano).map((s) => (s <= ids.length ? ids[s - 1] : null));
    const total = Math.log2(tamano);
    for (let o = 0; o < tamano / 2; o++) {
      const a = casillas[2 * o], b = casillas[2 * o + 1];
      partidos.push(crearPartido(0, o, a, b, { bye: a === null || b === null }));
    }
    for (let r = 1; r < total; r++)
      for (let o = 0; o < tamano >> (r + 1); o++) partidos.push(crearPartido(r, o, null, null, { bye: false }));
  } else {
    liga.partidos = [];
    liga.generado = true;
    liga.orden_inicial = ids;
    siguienteRondaSuizo(liga);
    return;
  }
  liga.partidos = partidos;
  liga.generado = true;
  if (cfg.formato === "ko") propagarKO(liga);
}

export function siguienteRondaSuizo(liga: Liga) {
  if (liga.config.formato !== "suizo") throw new ErrorLiga("Esta liga no usa sistema suizo.");
  const actual = Math.max(-1, ...liga.partidos.map((p) => p.ronda));
  if (liga.partidos.some((p) => p.ronda === actual && !terminado(p))) throw new ErrorLiga("Faltan resultados de la ronda actual.");
  if (actual + 1 >= rondasSuizo(liga)) throw new ErrorLiga("El torneo ya jugó todas sus rondas.");

  const vigentes = new Set(liga.jugadores.map((j) => j.id));
  let base: string[];
  if (actual < 0) {
    base = (liga.orden_inicial ?? []).filter((i) => vigentes.has(i));
    base.push(...liga.jugadores.map((j) => j.id).filter((i) => !base.includes(i)));
  } else {
    base = tabla(liga).map((f) => f.id);
  }

  let descanso: string | null = null;
  if (base.length % 2) {
    const conDescanso = new Set(liga.partidos.filter((p) => p.b === null).map((p) => p.a));
    descanso = [...base].reverse().find((pid) => !conDescanso.has(pid)) ?? base[base.length - 1];
    base = base.filter((p) => p !== descanso);
  }

  let pares: [string, string][];
  if (actual < 0) {
    const mitad = base.length / 2;
    pares = base.slice(0, mitad).map((a, i) => [a, base[mitad + i]]);
  } else {
    const cruzados = new Set(liga.partidos.filter((p) => p.b).map((p) => [p.a, p.b].sort().join("|")));
    pares = emparejar(base, cruzados) ?? base.filter((_, i) => i % 2 === 0).map((a, i) => [a, base[2 * i + 1]]);
  }
  const ronda = actual + 1;
  pares.forEach(([a, b], o) => liga.partidos.push(crearPartido(ronda, o, a, b)));
  if (descanso) liga.partidos.push(crearPartido(ronda, pares.length, descanso, null, { bye: true }));
}

/** Empareja en orden de tabla evitando revanchas (búsqueda con retroceso). */
function emparejar(restantes: string[], cruzados: Set<string>): [string, string][] | null {
  if (!restantes.length) return [];
  const p = restantes[0];
  for (let j = 1; j < restantes.length; j++) {
    const q = restantes[j];
    if (cruzados.has([p, q].sort().join("|"))) continue;
    const resto = emparejar([...restantes.slice(1, j), ...restantes.slice(j + 1)], cruzados);
    if (resto) return [[p, q], ...resto];
  }
  return null;
}

export function nombreRondaKO(ronda: number, total: number): string {
  const faltan = total - ronda;
  return ({ 1: "Final", 2: "Semifinales", 3: "Cuartos de final", 4: "Octavos de final", 5: "Dieciseisavos" } as Record<number, string>)[faltan]
    ?? `Ronda ${ronda + 1}`;
}

export function ganadorId(p: Partido): string | null {
  if (p.bye) return p.a ?? p.b;
  const lado = ganador(p);
  return lado ? p[lado] : null;
}

/** Pasa a los ganadores a la ronda siguiente y limpia cruces que cambiaron. */
export function propagarKO(liga: Liga) {
  const porRonda: Partido[][] = [];
  for (const p of liga.partidos) (porRonda[p.ronda] ??= []).push(p);
  porRonda.forEach((l) => l.sort((x, y) => x.orden - y.orden));
  for (let r = 1; r < porRonda.length; r++) {
    porRonda[r].forEach((p, o) => {
      const a = ganadorId(porRonda[r - 1][2 * o]);
      const b = ganadorId(porRonda[r - 1][2 * o + 1]);
      if (p.a !== a || p.b !== b) { p.a = a; p.b = b; limpiar(p); }
    });
  }
}

// ---------------------------------------------------------------- resultados

function limpiar(p: Partido) { p.sets = []; p.marcador = null; p.wo = null; p.jugado = null; }

export const terminado = (p: Partido) => Boolean(p.bye || p.marcador);

export function ganador(p: Partido): Lado | null {
  if (p.wo) return p.wo;
  if (!p.marcador) return null;
  return p.marcador[0] > p.marcador[1] ? "a" : "b";
}

/** Devuelve el error del set o null si es válido. */
export function validarSet(x: number, y: number, meta: number): string | null {
  if (x < 0 || y < 0) return "Los puntos no pueden ser negativos.";
  const alto = Math.max(x, y), bajo = Math.min(x, y);
  if (alto < meta) return `Un set se gana llegando a ${meta}.`;
  if (bajo >= meta - 1) { if (alto - bajo !== 2) return `Con empate en ${meta - 1} se gana por 2 de diferencia.`; }
  else if (alto !== meta) return `Si el rival no llega a ${meta - 1}, el set termina en ${meta}.`;
  return null;
}

export interface DatosResultado { wo?: Lado; sets?: (number | string)[][]; marcador?: (number | string)[] }

export function registrarResultado(liga: Liga, mid: string, datos: DatosResultado): Partido {
  const p = buscarPartido(liga, mid);
  if (p.bye) throw new ErrorLiga("Este cruce es un descanso, no lleva resultado.");
  if (!p.a || !p.b) throw new ErrorLiga("El cruce todavía no tiene a sus dos jugadores.");
  const cfg = liga.config;
  const nec = setsParaGanar(cfg);

  if (datos.wo) {
    if (datos.wo !== "a" && datos.wo !== "b") throw new ErrorLiga("W.O. inválido.");
    Object.assign(p, { sets: [], marcador: datos.wo === "a" ? [nec, 0] : [0, nec], wo: datos.wo, jugado: ahora() });
  } else if (datos.sets?.length) {
    const sets: [number, number][] = [];
    let ga = 0, gb = 0;
    datos.sets.forEach((par, idx) => {
      const i = idx + 1;
      const x = Number(par?.[0]), y = Number(par?.[1]);
      if (par?.[0] === "" || par?.[1] === "" || !Number.isInteger(x) || !Number.isInteger(y))
        throw new ErrorLiga(`Set ${i}: completa los dos marcadores.`);
      if (ga === nec || gb === nec) throw new ErrorLiga(`El partido ya estaba decidido antes del set ${i}.`);
      const error = validarSet(x, y, cfg.puntos_set);
      if (error) throw new ErrorLiga(`Set ${i}: ${error}`);
      sets.push([x, y]);
      if (x > y) ga++; else gb++;
    });
    if (Math.max(ga, gb) !== nec) throw new ErrorLiga(`Al mejor de ${cfg.mejor_de}: alguien debe ganar ${nec} sets.`);
    Object.assign(p, { sets, marcador: [ga, gb], wo: null, jugado: ahora() });
  } else if (datos.marcador) {
    const [ga, gb] = datos.marcador.map(Number);
    if (!Number.isInteger(ga) || !Number.isInteger(gb)) throw new ErrorLiga("Marcador inválido.");
    if (Math.max(ga, gb) !== nec || Math.min(ga, gb) >= nec || Math.min(ga, gb) < 0)
      throw new ErrorLiga(`Al mejor de ${cfg.mejor_de}: el ganador suma ${nec} sets.`);
    Object.assign(p, { sets: [], marcador: [ga, gb], wo: null, jugado: ahora() });
  } else {
    throw new ErrorLiga("Indica el resultado del partido.");
  }
  if (cfg.formato === "ko") propagarKO(liga);
  return p;
}

export function borrarResultado(liga: Liga, mid: string) {
  limpiar(buscarPartido(liga, mid));
  if (liga.config.formato === "ko") propagarKO(liga);
}

// ---------------------------------------------------------------- tabla

function puntosPartido(p: Partido, cfg: Config): [number, number] {
  const lado = ganador(p);
  const [sa, sb] = p.marcador!;
  let g: number, d: number;
  if (p.wo) { g = cfg.pts_wo_ganador; d = cfg.pts_wo_perdedor; }
  else {
    g = cfg.pts_victoria; d = cfg.pts_derrota;
    if (Math.min(sa, sb) === 0) g += cfg.bonus_barrida;
    if (Math.abs(sa - sb) === 1) d += cfg.bonus_derrota_ajustada;
  }
  return lado === "a" ? [g, d] : [d, g];
}

export function tabla(liga: Liga, hastaRonda?: number): Fila[] {
  const cfg = liga.config;
  const filas = new Map<string, Fila>(liga.jugadores.map((j) => [j.id, {
    id: j.id, nombre: j.nombre, pj: 0, g: 0, p: 0, sf: 0, sc: 0, pf: 0, pc: 0,
    pts: 0, wo: 0, descansos: 0, racha: [], ds: 0, dp: 0, pos: 0,
  }]));
  let jugados = liga.partidos.filter(terminado).sort((x, y) => x.ronda - y.ronda || x.orden - y.orden);
  if (hastaRonda !== undefined) jugados = jugados.filter((p) => p.ronda <= hastaRonda);

  for (const p of jugados) {
    if (p.bye) {
      const f = filas.get((p.a ?? p.b)!);
      if (f && cfg.formato === "suizo") { f.pts += cfg.pts_victoria; f.descansos++; }
      continue;
    }
    const fa = filas.get(p.a!), fb = filas.get(p.b!);
    if (!fa || !fb) continue;
    const [sa, sb] = p.marcador!;
    const [pa, pb] = puntosPartido(p, cfg);
    const puntosA = p.sets.reduce((t, s) => t + s[0], 0);
    const puntosB = p.sets.reduce((t, s) => t + s[1], 0);
    const ganaA = ganador(p) === "a";
    for (const [f, sf, sc, pf, pc, pts, gano] of [
      [fa, sa, sb, puntosA, puntosB, pa, ganaA], [fb, sb, sa, puntosB, puntosA, pb, !ganaA],
    ] as [Fila, number, number, number, number, number, boolean][]) {
      f.pj++; if (gano) f.g++; else f.p++;
      f.sf += sf; f.sc += sc; f.pf += pf; f.pc += pc; f.pts += pts;
      f.racha.push(gano ? "G" : "P");
    }
    if (p.wo) (ganaA ? fb : fa).wo++;
  }
  for (const f of filas.values()) { f.ds = f.sf - f.sc; f.dp = f.pf - f.pc; f.racha = f.racha.slice(-5); }

  const orden = ordenar([...filas.keys()], cfg.desempate, filas, jugados, cfg);
  return orden.map((id, i) => { const f = filas.get(id)!; f.pos = i + 1; return f; });
}

const VALOR: Record<Exclude<Criterio, "h2h">, (f: Fila) => number> = {
  puntos: (f) => f.pts, victorias: (f) => f.g, dif_sets: (f) => f.ds,
  sets_favor: (f) => f.sf, dif_puntos: (f) => f.dp, puntos_favor: (f) => f.pf,
};

/** Criterios en cascada; el enfrentamiento directo es una mini liga entre empatados. */
function ordenar(ids: string[], criterios: Criterio[], filas: Map<string, Fila>, jugados: Partido[], cfg: Config): string[] {
  if (ids.length <= 1) return ids;
  if (!criterios.length) return [...ids].sort((x, y) => filas.get(x)!.nombre.localeCompare(filas.get(y)!.nombre, "es"));
  const [criterio, ...resto] = criterios;
  const valores = new Map<string, number>();
  if (criterio === "h2h") {
    const grupo = new Set(ids);
    ids.forEach((i) => valores.set(i, 0));
    for (const p of jugados) {
      if (p.bye || !grupo.has(p.a!) || !grupo.has(p.b!)) continue;
      const [pa, pb] = puntosPartido(p, cfg);
      valores.set(p.a!, valores.get(p.a!)! + pa);
      valores.set(p.b!, valores.get(p.b!)! + pb);
    }
  } else {
    ids.forEach((i) => valores.set(i, VALOR[criterio](filas.get(i)!)));
  }
  const distintos = [...new Set(valores.values())].sort((x, y) => y - x);
  return distintos.flatMap((v) => ordenar(ids.filter((i) => valores.get(i) === v), resto, filas, jugados, cfg));
}

// ---------------------------------------------------------------- vista

export function vista(liga: Liga): Vista {
  const cfg = liga.config;
  const fmt = cfg.formato;
  const reales = liga.partidos.filter((p) => !p.bye);
  const jugados = reales.filter((p) => p.marcador);
  let totalRondas = liga.partidos.length ? Math.max(...liga.partidos.map((p) => p.ronda)) + 1 : 0;
  if (fmt === "suizo") totalRondas = rondasSuizo(liga);

  const filas = tabla(liga);
  let cerrada: number | null = null;
  for (let r = 0; r < totalRondas; r++) {
    const de = liga.partidos.filter((p) => p.ronda === r);
    if (de.length && de.every(terminado)) cerrada = r; else break;
  }
  if (fmt !== "ko" && cerrada !== null && cerrada > 0) {
    const anteriores = new Map(tabla(liga, cerrada - 1).map((f) => [f.id, f.pos]));
    filas.forEach((f) => { f.mov = (anteriores.get(f.id) ?? f.pos) - f.pos; });
  }

  let campeon: string | null = null;
  if (fmt === "ko" && liga.partidos.length) {
    const final = liga.partidos.reduce((m, p) => (p.ronda > m.ronda ? p : m));
    campeon = terminado(final) ? ganadorId(final) : null;
  } else if (liga.generado && reales.length && jugados.length === reales.length) {
    if (fmt !== "suizo" || cerrada === totalRondas - 1) campeon = filas[0]?.id ?? null;
  }

  const nombres = Array.from({ length: totalRondas }, (_, r) =>
    fmt === "ko" ? nombreRondaKO(r, totalRondas) : fmt === "suizo" ? `Ronda ${r + 1}` : `Jornada ${r + 1}`);

  let puedeAvanzar = false;
  if (fmt === "suizo" && liga.generado) {
    const actual = Math.max(-1, ...liga.partidos.map((p) => p.ronda));
    puedeAvanzar = actual + 1 < totalRondas && liga.partidos.filter((p) => p.ronda === actual).every(terminado);
  }

  return {
    ...liga, tabla: filas, formato_nombre: FORMATOS[fmt], total_rondas: totalRondas, nombres_ronda: nombres,
    jugados: jugados.length, total_partidos: reales.length, campeon, puede_avanzar: puedeAvanzar,
    sets_para_ganar: setsParaGanar(cfg),
  };
}

/** Cambia reglas. Si cambia el formato, los sets o los puntos por set, se regenera. */
export function cambiarConfig(liga: Liga, cfg: Partial<Config>) {
  const anterior = liga.config;
  const nueva = normalizarConfig(cfg, anterior);
  const regenerar = liga.generado && (nueva.formato !== anterior.formato || nueva.mejor_de !== anterior.mejor_de
    || nueva.puntos_set !== anterior.puntos_set);
  liga.config = nueva;
  if (regenerar) generarCalendario(liga, false);
}

export const requiereRegenerar = (liga: Liga, cfg: Config) =>
  liga.generado && (cfg.formato !== liga.config.formato || cfg.mejor_de !== liga.config.mejor_de || cfg.puntos_set !== liga.config.puntos_set);

/** Valida una liga importada (por ejemplo, de la versión en Python). */
export function validarImportada(x: unknown): Liga {
  const l = x as Liga;
  if (!l || typeof l !== "object" || typeof l.id !== "string" || typeof l.nombre !== "string"
    || !Array.isArray(l.jugadores) || !Array.isArray(l.partidos)) throw new ErrorLiga("El archivo no tiene el formato de una liga.");
  return { ...l, config: normalizarConfig(l.config), generado: Boolean(l.generado) };
}
