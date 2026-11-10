import { describe, expect, it } from "vitest";
import * as m from "./engine/motor";
import { fusionar, resumen } from "./nube";

const liga = (nombre: string, actualizado?: string): m.Liga => ({ ...m.nuevaLiga(nombre, {}, ["A", "B"]), actualizado });

describe("fusión con la hoja", () => {
  it("la hoja manda si su versión es igual o más nueva", () => {
    const local = liga("Local", "2026-11-09T10:00:00");
    const remota = { ...local, nombre: "Desde la hoja", actualizado: "2026-11-09T11:00:00" };
    const { ligas, pendientes } = fusionar([local], [remota], []);
    expect(ligas.map((l) => l.nombre)).toEqual(["Desde la hoja"]);
    expect(pendientes).toEqual([]);
  });

  it("conserva el cambio local más nuevo y lo marca para subir", () => {
    const remota = liga("Hoja", "2026-11-09T10:00:00");
    const local = { ...remota, nombre: "Editada aquí", actualizado: "2026-11-09T12:00:00" };
    const { ligas, pendientes } = fusionar([local], [remota], [remota.id]);
    expect(ligas[0].nombre).toBe("Editada aquí");
    expect(pendientes).toEqual([remota.id]);
  });

  it("mantiene los torneos que solo están en este navegador", () => {
    const solo = liga("Solo aquí");
    const remota = liga("Hoja", "2026-11-09T10:00:00");
    expect(fusionar([solo], [remota], []).ligas.map((l) => l.nombre)).toEqual(["Hoja", "Solo aquí"]);
  });

  it("quita los que estaban en la hoja y los borraron", () => {
    const borrada = liga("Borrada", "2026-11-09T10:00:00");
    expect(fusionar([borrada], [], [borrada.id]).ligas).toEqual([]);
  });

  it("resume el estado para las columnas legibles de la hoja", () => {
    const l = liga("R");
    m.generarCalendario(l);
    expect(resumen(l)).toMatchObject({ estado: "En juego", campeon: "" });
  });
});

describe("lista de torneos atada a la hoja", () => {
  it("una lista de otra hoja no cuenta (no borra torneos al cambiar de hoja)", async () => {
    const { remotasActuales } = await import("./store");
    const base = { remotas: ["x1", "x2"], remotasUrl: "https://script.google.com/macros/s/VIEJA/exec" };
    expect(remotasActuales({ ...base, urlLocal: "https://script.google.com/macros/s/VIEJA/exec" })).toEqual(["x1", "x2"]);
    expect(remotasActuales({ ...base, urlLocal: "https://script.google.com/macros/s/NUEVA/exec" })).toEqual([]);
    expect(remotasActuales({ ...base, urlLocal: "" })).toEqual([]);
    // con la lista vacía, una hoja nueva sin esos torneos no los quita de aquí
    const local = liga("Mía");
    expect(fusionar([local], [], []).ligas).toHaveLength(1);
  });
});
