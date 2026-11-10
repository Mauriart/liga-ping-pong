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
    const l = ligaCon(3, { formato: "rr1", cierre: "tabla", desempate: ["puntos", "h2h", "dif_sets"] });
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

describe("gran final: empates en la mesa", () => {
  /** Liga solo ida donde `gana(x, y)` dice si x le gana a y (por nombre). */
  const liga = (nombres: string[], gana: (x: string, y: string) => boolean) => {
    const l = m.nuevaLiga("Final", { formato: "rr1" }, nombres);
    m.generarCalendario(l);
    const nombre = (id: string | null) => l.jugadores.find((j) => j.id === id)!.nombre;
    for (const p of l.partidos.filter((x) => !x.fase)) {
      m.registrarResultado(l, p.id, { marcador: gana(nombre(p.a), nombre(p.b)) ? [3, 1] : [1, 3] });
    }
    return l;
  };
  const id = (l: m.Liga, n: string) => l.jugadores.find((j) => j.nombre === n)!.id;
  const nombre = (l: m.Liga, i: string | null) => l.jugadores.find((j) => j.id === i)?.nombre;
  const fase = (l: m.Liga, f: m.Fase) => l.partidos.filter((p) => p.fase === f);
  const jugar = (l: m.Liga, p: m.Partido, ganadorNombre: string) =>
    m.registrarResultado(l, p.id, { marcador: nombre(l, p.a) === ganadorNombre ? [3, 0] : [0, 3] });
  const orden = ["A", "B", "C", "D", "E"];
  const porOrden = (x: string, y: string) => orden.indexOf(x) < orden.indexOf(y);

  it("es la regla por defecto en todos contra todos", () => {
    expect(m.CONFIG_DEFECTO.cierre).toBe("gran_final");
    expect(m.conGranFinal({ ...m.CONFIG_DEFECTO, formato: "ko" })).toBe(false);
  });

  it("empate en puntos comparte puesto, sin superioridad por criterios", () => {
    // B, C y D se ganan en círculo: los tres suman 3 puntos
    const ciclo: Record<string, string> = { B: "C", C: "D", D: "B" };
    const l = liga(["A", "B", "C", "D"], (x, y) => x === "A" || (y !== "A" && ciclo[x] === y));
    const t = m.tabla(l);
    expect(t.map((f) => f.pos)).toEqual([1, 2, 2, 2]);
    expect(t.filter((f) => f.empatado).map((f) => f.nombre).sort()).toEqual(["B", "C", "D"]);
  });

  it("no hay fase final hasta terminar la fase regular", () => {
    const l = m.nuevaLiga("X", { formato: "rr1" }, ["A", "B", "C"]);
    m.generarCalendario(l);
    m.registrarResultado(l, l.partidos[0].id, { marcador: [3, 0] });
    expect(l.partidos.some((p) => p.fase)).toBe(false);
    expect(m.vista(l).campeon).toBeNull();
  });

  it("sin empates: gran final 1 vs 2 y el 3.º queda directo", () => {
    const l = liga(["A", "B", "C", "D"], porOrden);
    expect(fase(l, "desempate")).toHaveLength(0);
    expect(fase(l, "tercero")).toHaveLength(0);
    const [final] = fase(l, "final");
    expect([final.a, final.b]).toEqual([id(l, "A"), id(l, "B")]);
    expect(m.faseFinal(l).tercero).toBe(id(l, "C"));
    expect(m.vista(l).campeon).toBeNull();
    jugar(l, final, "B");
    const v = m.vista(l);
    expect(v.campeon).toBe(id(l, "B"));
    expect(v.fase_final!.subcampeon).toBe(id(l, "A"));
  });

  it("empate por el 2.º: desempate en la mesa, luego la final; el que cae al final queda 3.º", () => {
    const ciclo: Record<string, string> = { B: "C", C: "D", D: "B" };
    const l = liga(["A", "B", "C", "D"], (x, y) => x === "A" || (y !== "A" && ciclo[x] === y));
    expect(m.faseFinal(l).empateFinal.map((x) => nombre(l, x)).sort()).toEqual(["B", "C", "D"]);
    expect(fase(l, "final")).toHaveLength(0);
    // 3 empatados por 1 plaza: dos rondas de desempate
    const r1 = fase(l, "desempate");
    expect(r1).toHaveLength(1);
    jugar(l, r1[0], nombre(l, r1[0].a)!);
    const r2 = fase(l, "desempate").filter((p) => !p.marcador);
    expect(r2).toHaveLength(1);
    jugar(l, r2[0], nombre(l, r2[0].b)!);
    const [final] = fase(l, "final");
    expect(final.a).toBe(id(l, "A"));
    expect(final.b).toBe(r2[0].b);
    expect(m.faseFinal(l).tercero).toBe(r2[0].a);
    expect(fase(l, "tercero")).toHaveLength(0);
  });

  it("triple empate arriba: un desempate por las dos plazas y el que cae es 3.º", () => {
    const ciclo: Record<string, string> = { A: "B", B: "C", C: "A" };
    const l = liga(["A", "B", "C", "D"], (x, y) => y === "D" || (x !== "D" && ciclo[x] === y));
    expect(m.tabla(l).map((f) => f.pos)).toEqual([1, 1, 1, 4]);
    const [d] = fase(l, "desempate");
    jugar(l, d, nombre(l, d.a)!);
    const [final] = fase(l, "final");
    const tres = ["A", "B", "C"].map((n) => id(l, n));
    expect([final.a, final.b].every((x) => tres.includes(x!) && x !== d.b)).toBe(true);
    expect(m.faseFinal(l).tercero).toBe(d.b);
  });

  it("empate por el 3.º: partido por el 3.er puesto en paralelo a la gran final", () => {
    const ciclo: Record<string, string> = { C: "D", D: "E", E: "C" };
    const l = liga(["A", "B", "C", "D", "E"], (x, y) =>
      x === "A" || (x === "B" && y !== "A") || (!["A", "B"].includes(x) && !["A", "B"].includes(y) && ciclo[x] === y));
    expect(fase(l, "final")).toHaveLength(1);
    expect(m.faseFinal(l).empateTercero.map((x) => nombre(l, x)).sort()).toEqual(["C", "D", "E"]);
    const t1 = fase(l, "tercero");
    expect(t1).toHaveLength(1);
    jugar(l, t1[0], nombre(l, t1[0].a)!);
    const t2 = fase(l, "tercero").filter((p) => !p.marcador);
    jugar(l, t2[0], nombre(l, t2[0].a)!);
    expect(m.faseFinal(l).tercero).toBe(t2[0].a);
  });

  it("cambiar un resultado regular rehace la fase final", () => {
    const l = liga(["A", "B", "C"], porOrden);
    const [final] = fase(l, "final");
    jugar(l, final, "A");
    const regular = l.partidos.find((p) => !p.fase)!;
    m.borrarResultado(l, regular.id);
    expect(l.partidos.some((p) => p.fase)).toBe(false);
    expect(m.vista(l).campeon).toBeNull();
  });

  it("con cierre por tabla no hay gran final y el líder es campeón", () => {
    const l = m.nuevaLiga("T", { formato: "rr1", cierre: "tabla" }, ["A", "B", "C"]);
    m.generarCalendario(l);
    l.partidos.forEach((p) => m.registrarResultado(l, p.id, { marcador: [3, 0] }));
    expect(l.partidos.some((p) => p.fase)).toBe(false);
    expect(m.vista(l).campeon).toBe(m.tabla(l)[0].id);
  });
});
