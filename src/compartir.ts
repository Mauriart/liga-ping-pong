import LZString from "lz-string";
import * as m from "./engine/motor";

/**
 * Foto de la tabla para compartir. Viaja comprimida dentro del enlace, así que
 * no necesita servidor: quien abre el enlace ve el estado del momento en que se compartió.
 */
export interface Foto {
  v: 1;
  n: string;                 // nombre de la liga
  f: m.Formato;
  fn: string;                // formato legible
  r: string;                 // estado: «Jornada 4 en juego», «Final», …
  j: [number, number];       // jugados / total
  c: string | null;          // campeón
  t: [string, number, number, number, number, number, string, number, number?][]; // nombre, pj, g, p, ds, pts, racha, mov, puesto
  ff?: [string, string | null, string | null, number | null, number | null][]; // fase final: etiqueta, a, b, marcador
  u: [string, string, number, number][];          // últimos resultados
  k?: [string, [string | null, string | null, number | null, number | null][]][]; // cuadro (eliminación)
  d: string;                 // fecha
}

export function crearFoto(l: m.Vista): Foto {
  const nombre = (id: string | null) => (id ? l.jugadores.find((j) => j.id === id)?.nombre ?? "?" : null);
  const actual = Array.from({ length: l.total_rondas }, (_, r) => r).find((r) => l.partidos.some((p) => p.ronda === r && !m.terminado(p)));
  const foto: Foto = {
    v: 1, n: l.nombre, f: l.config.formato, fn: l.formato_nombre,
    r: l.campeon ? "Temporada terminada" : actual !== undefined ? (l.partidos.some((p) => p.ronda === actual && p.fase) ? "Fase final en juego" : `${l.nombres_ronda[actual]} en juego`) : "En juego",
    j: [l.jugados, l.total_partidos], c: nombre(l.campeon),
    t: l.tabla.map((f) => [f.nombre, f.pj, f.g, f.p, f.ds, f.pts, f.racha.join(""), f.mov ?? 0, f.pos]),
    u: l.partidos.filter((p) => p.marcador).sort((a, b) => (b.jugado ?? "").localeCompare(a.jugado ?? "")).slice(0, 6)
      .map((p) => [nombre(p.a)!, nombre(p.b)!, p.marcador![0], p.marcador![1]]),
    d: new Date().toLocaleDateString("sv"), // AAAA-MM-DD en hora local
  };
  const fase = l.partidos.filter((p) => p.fase).sort((a, b) => a.orden - b.orden);
  if (fase.length) foto.ff = fase.map((p) => [m.etiquetaPartido(l, p), nombre(p.a), nombre(p.b), p.marcador?.[0] ?? null, p.marcador?.[1] ?? null]);
  if (l.config.formato === "ko") {
    foto.k = l.nombres_ronda.map((nr, r) => [nr, l.partidos.filter((p) => p.ronda === r).sort((a, b) => a.orden - b.orden)
      .map((p) => [nombre(p.a), nombre(p.b), p.marcador?.[0] ?? null, p.marcador?.[1] ?? null])]);
  }
  return foto;
}

export const codificar = (f: Foto) => LZString.compressToEncodedURIComponent(JSON.stringify(f));

export function decodificar(texto: string): Foto | null {
  try {
    const f = JSON.parse(LZString.decompressFromEncodedURIComponent(texto) ?? "") as Foto;
    return f && f.v === 1 && Array.isArray(f.t) ? f : null;
  } catch { return null; }
}

export const enlace = (f: Foto) => `${location.origin}${location.pathname}#/ver/${codificar(f)}`;
