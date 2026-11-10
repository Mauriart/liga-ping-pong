import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as m from "./engine/motor";

interface Estado {
  ligas: m.Liga[];
  tema: "oscuro" | "claro";
  crearLiga: (nombre: string, cfg: Partial<m.Config>, jugadores: string[]) => m.Liga;
  editar: (id: string, fn: (l: m.Liga) => void) => m.Liga;
  borrarLiga: (id: string) => void;
  importar: (datos: unknown) => number;
  setTema: (t: "oscuro" | "claro") => void;
}

/** Ligas guardadas en el navegador. Cada cambio corre el motor sobre una copia. */
export const useLigas = create<Estado>()(
  persist(
    (set, get) => ({
      ligas: [],
      tema: "oscuro",
      crearLiga: (nombre, cfg, jugadores) => {
        const liga = m.nuevaLiga(nombre, cfg, jugadores);
        if (liga.jugadores.length >= 2) m.generarCalendario(liga);
        set({ ligas: [...get().ligas, liga] });
        return liga;
      },
      editar: (id, fn) => {
        const actual = get().ligas.find((l) => l.id === id);
        if (!actual) throw new m.ErrorLiga("Liga no encontrada.");
        const copia = structuredClone(actual);
        fn(copia);
        set({ ligas: get().ligas.map((l) => (l.id === id ? copia : l)) });
        return copia;
      },
      borrarLiga: (id) => set({ ligas: get().ligas.filter((l) => l.id !== id) }),
      importar: (datos) => {
        // acepta {ligas:[...]} (versión Python / exportación completa), una liga suelta o una lista
        const d = datos as { ligas?: unknown[] };
        const lista = Array.isArray(datos) ? datos : Array.isArray(d?.ligas) ? d.ligas : [datos];
        const nuevas = lista.map(m.validarImportada);
        const porId = new Map(get().ligas.map((l) => [l.id, l]));
        nuevas.forEach((l) => porId.set(l.id, l));
        set({ ligas: [...porId.values()] });
        return nuevas.length;
      },
      setTema: (tema) => set({ tema }),
    }),
    { name: "topspin.v2", storage: createJSONStorage(() => localStorage) },
  ),
);

// ---------------------------------------------------------------- avisos
export interface Aviso { id: number; texto: string; error?: boolean }
interface EstadoAvisos { avisos: Aviso[]; avisar: (texto: string, error?: boolean) => void; quitar: (id: number) => void }
let n = 0;
export const useAvisos = create<EstadoAvisos>()((set, get) => ({
  avisos: [],
  avisar: (texto, error) => {
    const id = ++n;
    set({ avisos: [...get().avisos, { id, texto, error }].slice(-3) });
    setTimeout(() => get().quitar(id), error ? 5000 : 3200);
  },
  quitar: (id) => set({ avisos: get().avisos.filter((a) => a.id !== id) }),
}));
export const avisar = (texto: string) => useAvisos.getState().avisar(texto);
export const fallo = (e: unknown) => useAvisos.getState().avisar(e instanceof Error ? e.message : String(e), true);

/** Ejecuta un cambio sobre la liga y muestra el error si el motor lo rechaza. */
export function intentar<T>(fn: () => T): T | undefined {
  try { return fn(); } catch (e) { fallo(e); return undefined; }
}
