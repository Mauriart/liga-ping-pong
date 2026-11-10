/**
 * Base de datos en Google Sheets (vía Apps Script publicado como aplicación web).
 * Leer es público; guardar y borrar piden la clave de administrador.
 */
import * as m from "./engine/motor";

/** Dirección fija del despliegue (se define en .env para que todos la usen). */
export const URL_FIJA: string = (import.meta.env?.VITE_SHEETS_URL as string | undefined)?.trim() ?? "";

export class ErrorNube extends Error {}

async function leerJson(r: Response) {
  let d: { ok?: boolean; error?: string; ligas?: unknown[] };
  try { d = await r.json(); } catch { throw new ErrorNube("La hoja respondió algo que no es JSON. ¿La URL es la de la aplicación web (/exec)?"); }
  if (!d.ok) throw new ErrorNube(d.error || "La hoja rechazó el pedido.");
  return d;
}

export async function listar(url: string): Promise<m.Liga[]> {
  let r: Response;
  try { r = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`); }
  catch { throw new ErrorNube("Sin conexión con Google Sheets."); }
  const d = await leerJson(r);
  const ligas: m.Liga[] = [];
  for (const l of d.ligas ?? []) { try { ligas.push(m.validarImportada(l)); } catch { /* fila dañada */ } }
  return ligas;
}

async function enviar(url: string, cuerpo: object) {
  let r: Response;
  // text/plain evita la consulta previa (CORS) que Apps Script no responde
  try { r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) }); }
  catch { throw new ErrorNube("Sin conexión con Google Sheets."); }
  return leerJson(r);
}

export const verificar = (url: string, clave: string) => enviar(url, { accion: "verificar", clave });

export function resumen(l: m.Liga) {
  const v = m.vista(l);
  const nombre = (id: string | null) => l.jugadores.find((j) => j.id === id)?.nombre ?? "";
  return {
    formato: v.formato_nombre,
    estado: !l.generado ? "Sin calendario" : v.campeon ? "Terminado" : v.fase_final?.activa ? "Fase final" : "En juego",
    campeon: nombre(v.campeon),
  };
}

export const guardar = (url: string, clave: string, liga: m.Liga) => enviar(url, { accion: "guardar", clave, liga, resumen: resumen(liga) });
export const borrar = (url: string, clave: string, id: string) => enviar(url, { accion: "borrar", clave, id });

/**
 * Junta lo local con lo que hay en la hoja:
 * - un torneo de la hoja reemplaza al local salvo que el local tenga un cambio más nuevo;
 * - un torneo que estaba en la hoja y ya no está (lo borraron) desaparece de aquí;
 * - los torneos que solo existen en este navegador se conservan.
 */
export function fusionar(locales: m.Liga[], remotas: m.Liga[], remotasAntes: string[]): { ligas: m.Liga[]; pendientes: string[] } {
  const porId = new Map(locales.map((l) => [l.id, l]));
  const idsRemotos = new Set(remotas.map((l) => l.id));
  const pendientes: string[] = [];
  const ligas: m.Liga[] = remotas.map((r) => {
    const local = porId.get(r.id);
    if (local && (local.actualizado ?? "") > (r.actualizado ?? "")) { pendientes.push(r.id); return local; }
    return r;
  });
  for (const l of locales) {
    if (idsRemotos.has(l.id)) continue;
    if (remotasAntes.includes(l.id)) continue; // la borraron de la hoja
    ligas.push(l);
  }
  return { ligas, pendientes };
}
