import { describe, expect, it } from "vitest";
import * as m from "./motor";

const ligaCon = (n: number, cfg: Partial<m.Config> = {}) => {
  const liga = m.nuevaLiga("Prueba", cfg, Array.from({ length: n }, (_, i) => `J${i + 1}`));
  m.generarCalendario(liga);
  return liga;
};
const ids = (l: m.Liga) => l.jugadores.map((j) => j.id);
const marcar = (l: m.Liga, x: string, y: string, marcador: [number, number]) => {
  for (const p of l.partidos)
    if (new Set([p.a, p.b]).has(x) && new Set([p.a, p.b]).has(y))
      m.registrarResultado(l, p.id, { marcador: p.a === x ? marcador : [marcador[1], marcador[0]] });
};

describe("calendario", () => {
  it("el formato por defecto es ida y vuelta", () => expect(m.CONFIG_DEFECTO.formato).toBe("rr2"));

  it("ida y vuelta cubre cada cruce en ambos sentidos", () => {
    for (const n of [2, 5, 8]) {
      const l = ligaCon(n);
      expect(l.partidos).toHaveLength(n * (n - 1));
      const pares = new Set(l.partidos.map((p) => `${p.a}|${p.b}`));
      for (const a of ids(l)) for (const b of ids(l)) if (a !== b) expect(pares.has(`${a}|${b}`)).toBe(true);
    }
  });

  it("nadie juega dos veces por jornada", () => {
    const l = ligaCon(7);
    const rondas = Math.max(...l.partidos.map((p) => p.ronda));
    for (let r = 0; r <= rondas; r++) {
      const js = l.partidos.filter((p) => p.ronda === r).flatMap((p) => [p.a, p.b]);
      expect(new Set(js).size).toBe(js.length);
    }
  });

  it("solo ida", () => {
    const l = ligaCon(6, { formato: "rr1" });
    expect(l.partidos).toHaveLength(15);
    expect(new Set(l.partidos.map((p) => [p.a, p.b].sort().join())).size).toBe(15);
  });

  it("eliminación directa con pases directos", () => {
    const l = ligaCon(6, { formato: "ko" });
    const primera = l.partidos.filter((p) => p.ronda === 0);
    expect(primera).toHaveLength(4);
    expect(primera.filter((p) => p.bye)).toHaveLength(2);
    const semis = l.partidos.filter((p) => p.ronda === 1);
    expect(semis.flatMap((p) => [p.a, p.b]).filter(Boolean)).toHaveLength(2);
  });

  it("suizo sin revanchas y con tope de rondas", () => {
    const l = ligaCon(8, { formato: "suizo", rondas_suizo: 3 });
    for (let k = 0; k < 3; k++) {
      const r = Math.max(...l.partidos.map((p) => p.ronda));
      l.partidos.filter((p) => p.ronda === r && !p.bye).forEach((p) => m.registrarResultado(l, p.id, { marcador: [3, 1] }));
      if (r < 2) m.siguienteRondaSuizo(l);
    }
    const cruces = l.partidos.map((p) => [p.a, p.b].sort().join());
    expect(new Set(cruces).size).toBe(cruces.length);
    expect(() => m.siguienteRondaSuizo(l)).toThrow(m.ErrorLiga);
  });
});

describe("resultados", () => {
  it("sets válidos con empate al final", () => {
    const l = ligaCon(4); const p = l.partidos[0];
    m.registrarResultado(l, p.id, { sets: [[11, 7], [12, 14], [11, 9], [15, 13]] });
    expect(p.marcador).toEqual([3, 1]);
  });

  it("rechaza sets inválidos", () => {
    const l = ligaCon(4); const p = l.partidos[0];
    for (const malo of [[[11, 10]], [[12, 8]], [[9, 7]]])
      expect(() => m.registrarResultado(l, p.id, { sets: malo })).toThrow(m.ErrorLiga);
  });

  it("rechaza sets de más o de menos", () => {
    const l = ligaCon(4); const p = l.partidos[0];
    expect(() => m.registrarResultado(l, p.id, { sets: [[11, 1], [11, 2]] })).toThrow(m.ErrorLiga);
    expect(() => m.registrarResultado(l, p.id, { sets: [[11, 1], [11, 2], [11, 3], [11, 4]] })).toThrow(m.ErrorLiga);
  });

  it("marcador rápido, W.O. y al mejor de 1 a 7 puntos", () => {
    const l = ligaCon(2, { mejor_de: 1, puntos_set: 7, marcador: "sets" }); const p = l.partidos[0];
    m.registrarResultado(l, p.id, { marcador: [0, 1] });
    expect(m.ganador(p)).toBe("b");
    m.registrarResultado(l, p.id, { sets: [[9, 7]] });
    expect(p.marcador).toEqual([1, 0]);
    m.registrarResultado(l, p.id, { wo: "b" });
    expect(p.marcador).toEqual([0, 1]);
  });
});

describe("tabla", () => {
  it("puntos configurables y bonus por barrida", () => {
    const l = ligaCon(2, { formato: "rr1", pts_victoria: 2, pts_derrota: 1, bonus_barrida: 1 });
    const p = l.partidos[0];
    m.registrarResultado(l, p.id, { marcador: [3, 0] });
    const f = Object.fromEntries(m.tabla(l).map((x) => [x.id, x]));
    expect(f[p.a!].pts).toBe(3);
    expect(f[p.b!].pts).toBe(1);
  });

  it("empate triple: mini liga igualada, decide diferencia de sets", () => {
    const l = ligaCon(3, { formato: "rr1", desempate: ["puntos", "h2h", "dif_sets"] });
    const [a, b, c] = ids(l);
    marcar(l, a, b, [3, 2]); marcar(l, b, c, [3, 0]); marcar(l, c, a, [3, 0]);
    expect(m.tabla(l)[0].id).toBe(b);
  });

  it("cambiar puntos no borra resultados", () => {
    const l = ligaCon(4); const p = l.partidos[0];
    m.registrarResultado(l, p.id, { marcador: [3, 0] });
    m.cambiarConfig(l, { pts_victoria: 5 });
    expect(p.marcador).toEqual([3, 0]);
    expect(m.tabla(l)[0].pts).toBe(5);
  });

  it("marca movimiento de posiciones tras cerrar jornadas", () => {
    const l = ligaCon(4);
    l.partidos.filter((p) => p.ronda <= 1).forEach((p) => m.registrarResultado(l, p.id, { marcador: [3, 0] }));
    expect(m.vista(l).tabla.every((f) => typeof f.mov === "number")).toBe(true);
  });
});

describe("altas, bajas y cuadro", () => {
  it("sumar un jugador conserva resultados", () => {
    const l = ligaCon(4); const p = l.partidos[0]; const k = `${p.a}|${p.b}`;
    m.registrarResultado(l, p.id, { marcador: [3, 1] });
    m.agregarJugadores(l, ["Nuevo"]);
    expect(l.partidos).toHaveLength(20);
    expect(l.partidos.find((x) => `${x.a}|${x.b}` === k)!.marcador).toEqual([3, 1]);
  });

  it("limpia duplicados y listas pegadas", () => {
    const l = m.nuevaLiga("X", undefined, ["Ana, Beto\nCarla", "ana"]);
    expect(l.jugadores.map((j) => j.nombre)).toEqual(["Ana", "Beto", "Carla"]);
  });

  it("el cuadro propaga ganadores y limpia si cambia una semi", () => {
    const l = ligaCon(4, { formato: "ko" });
    const [s1, s2] = l.partidos.filter((p) => p.ronda === 0);
    const final = l.partidos.find((p) => p.ronda === 1)!;
    m.registrarResultado(l, s1.id, { marcador: [3, 0] });
    m.registrarResultado(l, s2.id, { marcador: [0, 3] });
    expect([final.a, final.b]).toEqual([s1.a, s2.b]);
    m.registrarResultado(l, final.id, { marcador: [3, 2] });
    expect(m.vista(l).campeon).toBe(s1.a);
    m.registrarResultado(l, s1.id, { marcador: [1, 3] });
    expect(final.marcador).toBeNull();
    expect(final.a).toBe(s1.b);
  });

  it("importa una liga de la versión en Python", () => {
    const l = ligaCon(3);
    const copia = JSON.parse(JSON.stringify(l));
    delete copia.config.desempate;
    expect(m.validarImportada(copia).config.desempate).toEqual(m.CONFIG_DEFECTO.desempate);
    expect(() => m.validarImportada({ nombre: "x" })).toThrow(m.ErrorLiga);
  });
});
