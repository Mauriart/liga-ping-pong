import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as m from "./engine/motor";
import * as nube from "./nube";

export type EstadoNube = "apagada" | "cargando" | "ok" | "error";

interface Estado {
  ligas: m.Liga[];
  tema: "oscuro" | "claro";
  /** URL de la hoja guardada en este navegador (si no hay una fija en el build). */
  urlLocal: string;
  /** Clave de administrador de este dispositivo (solo se guarda aquí). */
  clave: string;
  /** Torneos que existen en la hoja (los demás son solo de este navegador). */
  remotas: string[];
  /** Hoja a la que pertenece la lista `remotas` (si cambia la hoja, la lista no vale). */
  remotasUrl: string;
  nube: { estado: EstadoNube; mensaje?: string; hora?: string; guardando: string[] };

  crearLiga: (nombre: string, cfg: Partial<m.Config>, jugadores: string[]) => m.Liga;
  editar: (id: string, fn: (l: m.Liga) => void) => m.Liga;
  borrarLiga: (id: string) => void;
  importar: (datos: unknown) => number;
  setTema: (t: "oscuro" | "claro") => void;
  setUrl: (url: string) => void;
  entrarAdmin: (clave: string) => Promise<void>;
  salirAdmin: () => void;
  cargarNube: () => Promise<void>;
  subir: (id: string) => Promise<void>;
}

export const urlNube = (s: Pick<Estado, "urlLocal">) => nube.URL_FIJA || s.urlLocal;
export const esAdmin = (s: Pick<Estado, "clave" | "urlLocal">) => !!urlNube(s) && !!s.clave;
/** Se puede editar si no hay nube, si eres admin o si el torneo es solo de este navegador. */
/** Torneos de la hoja conectada ahora (ignora listas de otra hoja). */
export const remotasActuales = (s: Pick<Estado, "urlLocal" | "remotas" | "remotasUrl">) =>
  s.remotasUrl && s.remotasUrl === urlNube(s) ? s.remotas : [];
export const puedeEditar = (s: Pick<Estado, "clave" | "urlLocal" | "remotas" | "remotasUrl">, id: string) =>
  !urlNube(s) || !!s.clave || !remotasActuales(s).includes(id);

const temporizadores = new Map<string, ReturnType<typeof setTimeout>>();

/** Ligas guardadas en el navegador y, si hay hoja conectada, sincronizadas con ella. */
export const useLigas = create<Estado>()(
  persist(
    (set, get) => {
      /** Programa la subida de un torneo a la hoja (agrupa cambios seguidos). */
      const programar = (id: string) => {
        const s = get();
        if (!esAdmin(s) || !remotasActuales(s).includes(id)) return;
        clearTimeout(temporizadores.get(id));
        temporizadores.set(id, setTimeout(() => { void get().subir(id); }, 700));
      };
      return {
        ligas: [],
        tema: "oscuro",
        urlLocal: "",
        clave: "",
        remotas: [],
        remotasUrl: "",
        nube: { estado: "apagada", guardando: [] },

        crearLiga: (nombre, cfg, jugadores) => {
          const liga = m.nuevaLiga(nombre, cfg, jugadores);
          if (liga.jugadores.length >= 2) m.generarCalendario(liga);
          liga.actualizado = m.ahora();
          set({ ligas: [...get().ligas, liga] });
          // el admin crea directo en la hoja
          if (esAdmin(get())) void get().subir(liga.id);
          return liga;
        },
        editar: (id, fn) => {
          const actual = get().ligas.find((l) => l.id === id);
          if (!actual) throw new m.ErrorLiga("Liga no encontrada.");
          if (!puedeEditar(get(), id)) throw new m.ErrorLiga("Este torneo está en la nube: entra como administrador para cambiarlo.");
          const copia = structuredClone(actual);
          fn(copia);
          m.actualizarFaseFinal(copia);
          copia.actualizado = m.ahora();
          set({ ligas: get().ligas.map((l) => (l.id === id ? copia : l)) });
          programar(id);
          return copia;
        },
        borrarLiga: (id) => {
          const s = get();
          if (remotasActuales(s).includes(id)) {
            if (!esAdmin(s)) throw new m.ErrorLiga("Solo el administrador puede borrar torneos de la nube.");
            void nube.borrar(urlNube(s), s.clave, id).catch((e) => fallo(e));
          }
          set({ ligas: s.ligas.filter((l) => l.id !== id), remotas: s.remotas.filter((x) => x !== id) });
        },
        importar: (datos) => {
          // acepta {ligas:[...]} (versión Python / exportación completa), una liga suelta o una lista
          const d = datos as { ligas?: unknown[] };
          const lista = Array.isArray(datos) ? datos : Array.isArray(d?.ligas) ? d.ligas : [datos];
          const nuevas = lista.map(m.validarImportada);
          const porId = new Map(get().ligas.map((l) => [l.id, l]));
          nuevas.forEach((l) => porId.set(l.id, { ...l, actualizado: m.ahora() }));
          set({ ligas: [...porId.values()] });
          nuevas.forEach((l) => programar(l.id));
          return nuevas.length;
        },
        setTema: (tema) => set({ tema }),
        setUrl: (url) => {
          set({ urlLocal: url.trim(), remotas: [], remotasUrl: "", nube: { estado: "apagada", guardando: [] } });
          if (urlNube(get())) void get().cargarNube();
        },
        entrarAdmin: async (clave) => {
          const url = urlNube(get());
          if (!url) throw new nube.ErrorNube("Primero conecta la hoja de Google Sheets.");
          await nube.verificar(url, clave);
          set({ clave });
        },
        salirAdmin: () => set({ clave: "" }),
        cargarNube: async () => {
          const s = get();
          const url = urlNube(s);
          if (!url) return;
          set({ nube: { ...s.nube, estado: s.nube.estado === "ok" ? "ok" : "cargando" } });
          try {
            const remotas = await nube.listar(url);
            if (urlNube(get()) !== url) return; // cambiaron de hoja mientras llegaba la respuesta
            const { ligas, pendientes } = nube.fusionar(get().ligas, remotas, remotasActuales(get()));
            set({ ligas, remotas: remotas.map((l) => l.id), remotasUrl: url, nube: { ...get().nube, estado: "ok", mensaje: undefined, hora: new Date().toISOString() } });
            pendientes.forEach(programar);
          } catch (e) {
            if (urlNube(get()) !== url) return;
            set({ nube: { ...get().nube, estado: "error", mensaje: e instanceof Error ? e.message : String(e) } });
          }
        },
        subir: async (id) => {
          const s = get();
          const liga = s.ligas.find((l) => l.id === id);
          if (!liga || !esAdmin(s)) return;
          const url = urlNube(s);
          set({ nube: { ...s.nube, guardando: [...new Set([...s.nube.guardando, id])] } });
          try {
            await nube.guardar(url, s.clave, liga);
            if (urlNube(get()) !== url) return;
            set({ remotas: [...new Set([...remotasActuales(get()), id])], remotasUrl: url, nube: { ...get().nube, estado: "ok", mensaje: undefined, hora: new Date().toISOString() } });
          } catch (e) {
            set({ nube: { ...get().nube, estado: "error", mensaje: e instanceof Error ? e.message : String(e) } });
            fallo(new Error(`No se guardó en la hoja: ${e instanceof Error ? e.message : e}`));
          } finally {
            set({ nube: { ...get().nube, guardando: get().nube.guardando.filter((x) => x !== id) } });
          }
        },
      };
    },
    {
      name: "topspin.v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ligas: s.ligas, tema: s.tema, urlLocal: s.urlLocal, clave: s.clave, remotas: s.remotas, remotasUrl: s.remotasUrl }),
      // al cargar, pone al día ligas guardadas con versiones anteriores (reglas nuevas, fase final)
      merge: (guardado, actual) => {
        const g = (guardado ?? {}) as Partial<Estado>;
        const ligas: m.Liga[] = [];
        for (const l of g.ligas ?? []) { try { ligas.push(m.validarImportada(l)); } catch { /* liga dañada: se omite */ } }
        return { ...actual, ...g, ligas, nube: actual.nube };
      },
    },
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
