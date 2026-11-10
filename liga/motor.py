"""Motor de la liga: formatos, calendario, resultados y tabla de posiciones.

Todo es puro (sin E/S): recibe y devuelve diccionarios simples para que el
almacén los guarde en JSON tal cual.
"""
from __future__ import annotations

import math
import random
import uuid
from copy import deepcopy
from datetime import datetime

FORMATOS = {
    "rr2": "Todos contra todos · ida y vuelta",
    "rr1": "Todos contra todos · solo ida",
    "ko": "Eliminación directa",
    "suizo": "Sistema suizo",
}

CRITERIOS = {
    "puntos": "Puntos",
    "h2h": "Enfrentamiento directo",
    "dif_sets": "Diferencia de sets",
    "dif_puntos": "Diferencia de puntos",
    "victorias": "Victorias",
    "sets_favor": "Sets a favor",
    "puntos_favor": "Puntos a favor",
}

CONFIG_DEFECTO = {
    "formato": "rr2",
    "mejor_de": 5,
    "puntos_set": 11,
    "marcador": "detallado",  # "detallado" (punto a punto por set) o "sets"
    "pts_victoria": 3,
    "pts_derrota": 0,
    "pts_wo_ganador": 3,
    "pts_wo_perdedor": 0,
    "bonus_barrida": 0,  # extra al ganador que no cede sets
    "bonus_derrota_ajustada": 0,  # extra al perdedor por un solo set
    "rondas_suizo": 0,  # 0 = automático (log2 de jugadores)
    "sorteo": False,  # mezclar el orden antes de generar
    "desempate": ["puntos", "h2h", "dif_sets", "dif_puntos", "victorias"],
}


class ErrorLiga(ValueError):
    """Error de validación con mensaje listo para mostrar."""


def _id() -> str:
    return uuid.uuid4().hex[:10]


def ahora() -> str:
    return datetime.now().isoformat(timespec="seconds")


# --------------------------------------------------------------------------
# Configuración
# --------------------------------------------------------------------------

def normalizar_config(cfg: dict | None, base: dict | None = None) -> dict:
    """Combina la configuración recibida con la base y valida rangos."""
    final = deepcopy(base or CONFIG_DEFECTO)
    for clave, valor in (cfg or {}).items():
        if clave in CONFIG_DEFECTO:
            final[clave] = valor

    if final["formato"] not in FORMATOS:
        raise ErrorLiga("Formato de liga desconocido.")
    try:
        final["mejor_de"] = int(final["mejor_de"])
        final["puntos_set"] = int(final["puntos_set"])
        final["rondas_suizo"] = int(final["rondas_suizo"])
        for clave in ("pts_victoria", "pts_derrota", "pts_wo_ganador",
                      "pts_wo_perdedor", "bonus_barrida", "bonus_derrota_ajustada"):
            final[clave] = int(final[clave])
    except (TypeError, ValueError):
        raise ErrorLiga("Los valores numéricos de la configuración no son válidos.")
    if final["mejor_de"] < 1 or final["mejor_de"] % 2 == 0 or final["mejor_de"] > 9:
        raise ErrorLiga("«Al mejor de» debe ser un número impar entre 1 y 9.")
    if not 3 <= final["puntos_set"] <= 50:
        raise ErrorLiga("Los puntos por set deben estar entre 3 y 50.")
    if final["marcador"] not in ("detallado", "sets"):
        raise ErrorLiga("Modo de marcador desconocido.")
    final["sorteo"] = bool(final["sorteo"])
    criterios = [c for c in final["desempate"] if c in CRITERIOS]
    criterios = list(dict.fromkeys(criterios))  # sin repetidos, en orden
    final["desempate"] = criterios or list(CONFIG_DEFECTO["desempate"])
    return final


def sets_para_ganar(cfg: dict) -> int:
    return cfg["mejor_de"] // 2 + 1


# --------------------------------------------------------------------------
# Liga y jugadores
# --------------------------------------------------------------------------

def nueva_liga(nombre: str, cfg: dict | None = None, nombres: list[str] | None = None) -> dict:
    nombre = (nombre or "").strip()
    if not nombre:
        raise ErrorLiga("La liga necesita un nombre.")
    liga = {
        "id": _id(),
        "nombre": nombre[:60],
        "creada": ahora(),
        "config": normalizar_config(cfg),
        "jugadores": [],
        "partidos": [],
        "generado": False,
    }
    agregar_jugadores(liga, nombres or [])
    return liga


def limpiar_nombres(nombres: list[str]) -> list[str]:
    salida = []
    for bruto in nombres:
        for parte in str(bruto).replace(";", "\n").replace(",", "\n").splitlines():
            parte = " ".join(parte.split())[:40]
            if parte:
                salida.append(parte)
    return salida


def agregar_jugadores(liga: dict, nombres: list[str]) -> list[dict]:
    """Agrega jugadores (ignora duplicados) y ajusta el calendario si ya existe."""
    existentes = {j["nombre"].casefold() for j in liga["jugadores"]}
    nuevos = []
    for nombre in limpiar_nombres(nombres):
        if nombre.casefold() in existentes:
            continue
        existentes.add(nombre.casefold())
        jugador = {"id": _id(), "nombre": nombre}
        liga["jugadores"].append(jugador)
        nuevos.append(jugador)
    if nuevos and liga["generado"]:
        fmt = liga["config"]["formato"]
        if fmt in ("rr1", "rr2"):
            generar_calendario(liga, conservar=True)
        elif fmt == "ko":
            generar_calendario(liga, conservar=False)
        # en suizo el jugador entra en la próxima ronda
    return nuevos


def renombrar_jugador(liga: dict, pid: str, nombre: str) -> None:
    nombre = " ".join((nombre or "").split())[:40]
    if not nombre:
        raise ErrorLiga("El nombre no puede quedar vacío.")
    for j in liga["jugadores"]:
        if j["id"] != pid and j["nombre"].casefold() == nombre.casefold():
            raise ErrorLiga("Ya hay un jugador con ese nombre.")
    jugador = buscar_jugador(liga, pid)
    jugador["nombre"] = nombre


def eliminar_jugador(liga: dict, pid: str) -> None:
    buscar_jugador(liga, pid)
    liga["jugadores"] = [j for j in liga["jugadores"] if j["id"] != pid]
    if not liga["generado"]:
        return
    fmt = liga["config"]["formato"]
    if fmt == "ko":
        generar_calendario(liga, conservar=False)
    elif fmt in ("rr1", "rr2"):
        generar_calendario(liga, conservar=True)
    else:
        liga["partidos"] = [p for p in liga["partidos"] if pid not in (p["a"], p["b"])]


def buscar_jugador(liga: dict, pid: str) -> dict:
    for j in liga["jugadores"]:
        if j["id"] == pid:
            return j
    raise ErrorLiga("Jugador no encontrado.")


def buscar_partido(liga: dict, mid: str) -> dict:
    for p in liga["partidos"]:
        if p["id"] == mid:
            return p
    raise ErrorLiga("Partido no encontrado.")


# --------------------------------------------------------------------------
# Calendario
# --------------------------------------------------------------------------

def _partido(ronda: int, orden: int, a: str | None, b: str | None, **extra) -> dict:
    return {"id": _id(), "ronda": ronda, "orden": orden, "a": a, "b": b,
            "sets": [], "marcador": None, "wo": None, "jugado": None, **extra}


def round_robin(ids: list[str], ida_y_vuelta: bool) -> list[list[tuple[str, str]]]:
    """Método del círculo. Devuelve jornadas con pares (local, visitante)."""
    jugadores = list(ids)
    if len(jugadores) % 2:
        jugadores.append(None)  # descanso
    n = len(jugadores)
    jornadas = []
    for r in range(n - 1):
        pares = []
        for i in range(n // 2):
            a, b = jugadores[i], jugadores[n - 1 - i]
            if a is None or b is None:
                continue
            if i == 0 and r % 2 == 1:
                a, b = b, a  # alterna localía del jugador fijo
            pares.append((a, b))
        jornadas.append(pares)
        jugadores = [jugadores[0], jugadores[-1]] + jugadores[1:-1]
    if ida_y_vuelta:
        jornadas += [[(b, a) for a, b in jornada] for jornada in jornadas]
    return jornadas


def orden_cuadro(tamano: int) -> list[int]:
    """Orden de cabezas de serie en un cuadro (1 contra el último, etc.)."""
    orden = [1]
    while len(orden) < tamano:
        suma = len(orden) * 2 + 1
        orden = [x for s in orden for x in (s, suma - s)]
    return orden


def rondas_suizo(liga: dict) -> int:
    n = len(liga["jugadores"])
    fijo = liga["config"]["rondas_suizo"]
    if fijo > 0:
        return fijo
    return max(1, math.ceil(math.log2(n))) if n > 1 else 1


def generar_calendario(liga: dict, conservar: bool = False) -> None:
    """Crea los partidos según el formato. En todos contra todos puede conservar
    los resultados de los cruces que siguen existiendo."""
    ids = [j["id"] for j in liga["jugadores"]]
    if len(ids) < 2:
        raise ErrorLiga("Se necesitan al menos 2 jugadores para generar partidos.")
    cfg = liga["config"]
    previos = liga["partidos"] if conservar else []
    if cfg["sorteo"] and not conservar:
        random.shuffle(ids)
    fmt = cfg["formato"]
    partidos: list[dict] = []

    if fmt in ("rr1", "rr2"):
        if conservar:
            # mismo orden estable para que el calendario no se reordene entero
            ids = [j["id"] for j in liga["jugadores"]]
        viejos = {(p["a"], p["b"]): p for p in previos if p.get("marcador")}
        for r, jornada in enumerate(round_robin(ids, fmt == "rr2")):
            for o, (a, b) in enumerate(jornada):
                nuevo = _partido(r, o, a, b)
                antes = viejos.pop((a, b), None)
                girado = False
                if antes is None and fmt == "rr1":
                    antes = viejos.pop((b, a), None)
                    girado = antes is not None
                if antes:
                    nuevo.update(id=antes["id"], jugado=antes["jugado"])
                    if girado:
                        nuevo["sets"] = [[y, x] for x, y in antes["sets"]]
                        nuevo["marcador"] = list(reversed(antes["marcador"]))
                        nuevo["wo"] = {"a": "b", "b": "a"}.get(antes["wo"])
                    else:
                        nuevo.update(sets=antes["sets"], marcador=antes["marcador"], wo=antes["wo"])
                partidos.append(nuevo)

    elif fmt == "ko":
        tamano = 1 << (len(ids) - 1).bit_length()
        casillas = [ids[s - 1] if s <= len(ids) else None for s in orden_cuadro(tamano)]
        total = int(math.log2(tamano))
        for o in range(tamano // 2):
            a, b = casillas[2 * o], casillas[2 * o + 1]
            partidos.append(_partido(0, o, a, b, bye=(a is None or b is None)))
        for r in range(1, total):
            for o in range(tamano >> (r + 1)):
                partidos.append(_partido(r, o, None, None, bye=False))

    elif fmt == "suizo":
        liga["partidos"] = []
        liga["generado"] = True
        liga["orden_inicial"] = ids
        siguiente_ronda_suizo(liga)
        return

    liga["partidos"] = partidos
    liga["generado"] = True
    if fmt == "ko":
        propagar_ko(liga)


def siguiente_ronda_suizo(liga: dict) -> None:
    cfg = liga["config"]
    if cfg["formato"] != "suizo":
        raise ErrorLiga("Esta liga no usa sistema suizo.")
    actual = max((p["ronda"] for p in liga["partidos"]), default=-1)
    if any(p["ronda"] == actual and not terminado(p) for p in liga["partidos"]):
        raise ErrorLiga("Faltan resultados de la ronda actual.")
    if actual + 1 >= rondas_suizo(liga):
        raise ErrorLiga("El torneo ya jugó todas sus rondas.")

    ids_vigentes = {j["id"] for j in liga["jugadores"]}
    if actual < 0:
        base = [i for i in liga.get("orden_inicial", []) if i in ids_vigentes]
        base += [j["id"] for j in liga["jugadores"] if j["id"] not in base]
    else:
        base = [f["id"] for f in tabla(liga)]

    descanso = None
    if len(base) % 2:
        con_descanso = {p["a"] for p in liga["partidos"] if p["b"] is None}
        for pid in reversed(base):
            if pid not in con_descanso:
                descanso = pid
                break
        descanso = descanso or base[-1]
        base = [p for p in base if p != descanso]

    if actual < 0:
        mitad = len(base) // 2
        pares = list(zip(base[:mitad], base[mitad:]))
    else:
        cruzados = {frozenset((p["a"], p["b"])) for p in liga["partidos"] if p["b"]}
        pares = _emparejar(base, cruzados) or list(zip(base[::2], base[1::2]))

    ronda = actual + 1
    for o, (a, b) in enumerate(pares):
        liga["partidos"].append(_partido(ronda, o, a, b))
    if descanso:
        p = _partido(ronda, len(pares), descanso, None, bye=True)
        liga["partidos"].append(p)


def _emparejar(restantes: list[str], cruzados: set) -> list[tuple[str, str]] | None:
    """Empareja en orden de tabla evitando revanchas (búsqueda con retroceso)."""
    if not restantes:
        return []
    p = restantes[0]
    for j in range(1, len(restantes)):
        q = restantes[j]
        if frozenset((p, q)) in cruzados:
            continue
        resto = _emparejar(restantes[1:j] + restantes[j + 1:], cruzados)
        if resto is not None:
            return [(p, q)] + resto
    return None


def nombre_ronda_ko(ronda: int, total: int) -> str:
    faltan = total - ronda
    nombres = {1: "Final", 2: "Semifinales", 3: "Cuartos de final",
               4: "Octavos de final", 5: "Dieciseisavos"}
    return nombres.get(faltan, f"Ronda {ronda + 1}")


def ganador_id(p: dict) -> str | None:
    if p.get("bye"):
        return p["a"] or p["b"]
    lado = ganador(p)
    return p[lado] if lado else None


def propagar_ko(liga: dict) -> None:
    """Pasa a los ganadores a la ronda siguiente y limpia cruces que cambiaron."""
    por_ronda: dict[int, list[dict]] = {}
    for p in liga["partidos"]:
        por_ronda.setdefault(p["ronda"], []).append(p)
    for lista in por_ronda.values():
        lista.sort(key=lambda p: p["orden"])
    for r in range(1, len(por_ronda)):
        for o, p in enumerate(por_ronda[r]):
            a = ganador_id(por_ronda[r - 1][2 * o])
            b = ganador_id(por_ronda[r - 1][2 * o + 1])
            if (p["a"], p["b"]) != (a, b):
                p["a"], p["b"] = a, b
                _limpiar(p)


# --------------------------------------------------------------------------
# Resultados
# --------------------------------------------------------------------------

def _limpiar(p: dict) -> None:
    p.update(sets=[], marcador=None, wo=None, jugado=None)


def terminado(p: dict) -> bool:
    return bool(p.get("bye") or p.get("marcador"))


def ganador(p: dict) -> str | None:
    """'a', 'b' o None."""
    if p.get("wo"):
        return p["wo"]
    m = p.get("marcador")
    if not m:
        return None
    return "a" if m[0] > m[1] else "b"


def validar_set(x: int, y: int, cfg: dict) -> str | None:
    """Devuelve el error del set o None si es válido."""
    meta = cfg["puntos_set"]
    if x < 0 or y < 0:
        return "Los puntos no pueden ser negativos."
    alto, bajo = max(x, y), min(x, y)
    if alto < meta:
        return f"Un set se gana llegando a {meta}."
    if bajo >= meta - 1:
        if alto - bajo != 2:
            return f"Con empate en {meta - 1} se gana por 2 de diferencia."
    elif alto != meta:
        return f"Si el rival no llega a {meta - 1}, el set termina en {meta}."
    return None


def registrar_resultado(liga: dict, mid: str, datos: dict) -> dict:
    p = buscar_partido(liga, mid)
    if p.get("bye"):
        raise ErrorLiga("Este cruce es un descanso, no lleva resultado.")
    if not p["a"] or not p["b"]:
        raise ErrorLiga("El cruce todavía no tiene a sus dos jugadores.")
    cfg = liga["config"]
    necesarios = sets_para_ganar(cfg)

    wo = datos.get("wo")
    if wo:
        if wo not in ("a", "b"):
            raise ErrorLiga("W.O. inválido.")
        marcador = [necesarios, 0] if wo == "a" else [0, necesarios]
        p.update(sets=[], marcador=marcador, wo=wo, jugado=ahora())
    elif datos.get("sets"):
        sets = []
        ga = gb = 0
        for i, par in enumerate(datos["sets"], start=1):
            try:
                x, y = int(par[0]), int(par[1])
            except (TypeError, ValueError, IndexError):
                raise ErrorLiga(f"Set {i}: completa los dos marcadores.")
            if ga == necesarios or gb == necesarios:
                raise ErrorLiga(f"El partido ya estaba decidido antes del set {i}.")
            error = validar_set(x, y, cfg)
            if error:
                raise ErrorLiga(f"Set {i}: {error}")
            sets.append([x, y])
            if x > y:
                ga += 1
            else:
                gb += 1
        if max(ga, gb) != necesarios:
            raise ErrorLiga(f"Al mejor de {cfg['mejor_de']}: alguien debe ganar {necesarios} sets.")
        p.update(sets=sets, marcador=[ga, gb], wo=None, jugado=ahora())
    elif datos.get("marcador"):
        try:
            ga, gb = (int(v) for v in datos["marcador"])
        except (TypeError, ValueError):
            raise ErrorLiga("Marcador inválido.")
        if max(ga, gb) != necesarios or min(ga, gb) >= necesarios or min(ga, gb) < 0:
            raise ErrorLiga(f"Al mejor de {cfg['mejor_de']}: el ganador suma {necesarios} sets.")
        p.update(sets=[], marcador=[ga, gb], wo=None, jugado=ahora())
    else:
        raise ErrorLiga("Indica el resultado del partido.")

    if cfg["formato"] == "ko":
        propagar_ko(liga)
    return p


def borrar_resultado(liga: dict, mid: str) -> None:
    p = buscar_partido(liga, mid)
    _limpiar(p)
    if liga["config"]["formato"] == "ko":
        propagar_ko(liga)


# --------------------------------------------------------------------------
# Tabla de posiciones
# --------------------------------------------------------------------------

def _puntos_partido(p: dict, cfg: dict) -> tuple[int, int]:
    """Puntos de tabla para (a, b) en un partido terminado."""
    lado = ganador(p)
    sa, sb = p["marcador"]
    if p.get("wo"):
        g, d = cfg["pts_wo_ganador"], cfg["pts_wo_perdedor"]
    else:
        g, d = cfg["pts_victoria"], cfg["pts_derrota"]
        perdedor_sets = min(sa, sb)
        if perdedor_sets == 0:
            g += cfg["bonus_barrida"]
        if abs(sa - sb) == 1:
            d += cfg["bonus_derrota_ajustada"]
    return (g, d) if lado == "a" else (d, g)


def tabla(liga: dict, hasta_ronda: int | None = None) -> list[dict]:
    cfg = liga["config"]
    filas = {j["id"]: {"id": j["id"], "nombre": j["nombre"], "pj": 0, "g": 0, "p": 0,
                       "sf": 0, "sc": 0, "pf": 0, "pc": 0, "pts": 0, "wo": 0,
                       "descansos": 0, "racha": []}
             for j in liga["jugadores"]}
    jugados = sorted((p for p in liga["partidos"] if terminado(p)),
                     key=lambda p: (p["ronda"], p["orden"]))
    if hasta_ronda is not None:
        jugados = [p for p in jugados if p["ronda"] <= hasta_ronda]

    for p in jugados:
        if p.get("bye"):
            pid = p["a"] or p["b"]
            if pid in filas and cfg["formato"] == "suizo":
                filas[pid]["pts"] += cfg["pts_victoria"]
                filas[pid]["descansos"] += 1
            continue
        if p["a"] not in filas or p["b"] not in filas:
            continue
        fa, fb = filas[p["a"]], filas[p["b"]]
        sa, sb = p["marcador"]
        pa, pb = _puntos_partido(p, cfg)
        puntos_a = sum(s[0] for s in p["sets"])
        puntos_b = sum(s[1] for s in p["sets"])
        gana_a = ganador(p) == "a"
        for fila, sf, sc, pf, pc, pts, gano in (
            (fa, sa, sb, puntos_a, puntos_b, pa, gana_a),
            (fb, sb, sa, puntos_b, puntos_a, pb, not gana_a),
        ):
            fila["pj"] += 1
            fila["g" if gano else "p"] += 1
            fila["sf"] += sf
            fila["sc"] += sc
            fila["pf"] += pf
            fila["pc"] += pc
            fila["pts"] += pts
            fila["racha"].append("G" if gano else "P")
        if p.get("wo"):
            (fb if gana_a else fa)["wo"] += 1

    for f in filas.values():
        f["ds"] = f["sf"] - f["sc"]
        f["dp"] = f["pf"] - f["pc"]
        f["racha"] = f["racha"][-5:]

    orden = _ordenar(list(filas), cfg["desempate"], filas, jugados, cfg)
    salida = []
    for pos, pid in enumerate(orden, start=1):
        filas[pid]["pos"] = pos
        salida.append(filas[pid])
    return salida


_VALOR = {
    "puntos": lambda f: f["pts"],
    "victorias": lambda f: f["g"],
    "dif_sets": lambda f: f["ds"],
    "sets_favor": lambda f: f["sf"],
    "dif_puntos": lambda f: f["dp"],
    "puntos_favor": lambda f: f["pf"],
}


def _ordenar(ids: list[str], criterios: list[str], filas: dict, jugados: list[dict], cfg: dict) -> list[str]:
    """Ordena por criterios en cascada. El enfrentamiento directo se calcula como
    mini liga solo entre los empatados en ese punto."""
    if len(ids) <= 1:
        return ids
    if not criterios:
        return sorted(ids, key=lambda i: filas[i]["nombre"].casefold())
    criterio, resto = criterios[0], criterios[1:]
    if criterio == "h2h":
        grupo = set(ids)
        valores = dict.fromkeys(ids, 0)
        for p in jugados:
            if p.get("bye") or p["a"] not in grupo or p["b"] not in grupo:
                continue
            pa, pb = _puntos_partido(p, cfg)
            valores[p["a"]] += pa
            valores[p["b"]] += pb
    else:
        valores = {i: _VALOR[criterio](filas[i]) for i in ids}
    salida = []
    for valor in sorted(set(valores.values()), reverse=True):
        empatados = [i for i in ids if valores[i] == valor]
        salida += _ordenar(empatados, resto, filas, jugados, cfg)
    return salida


# --------------------------------------------------------------------------
# Vista para la interfaz
# --------------------------------------------------------------------------

def vista(liga: dict) -> dict:
    """Liga + datos calculados (tabla, progreso, nombres de ronda, campeón)."""
    cfg = liga["config"]
    fmt = cfg["formato"]
    datos = deepcopy(liga)
    reales = [p for p in liga["partidos"] if not p.get("bye")]
    jugados = [p for p in reales if p.get("marcador")]
    total_rondas = 0
    if liga["partidos"]:
        total_rondas = max(p["ronda"] for p in liga["partidos"]) + 1
    if fmt == "suizo":
        total_rondas = rondas_suizo(liga)

    filas = tabla(liga)
    ronda_cerrada = None
    for r in range(total_rondas):
        de_ronda = [p for p in liga["partidos"] if p["ronda"] == r]
        if de_ronda and all(terminado(p) for p in de_ronda):
            ronda_cerrada = r
        else:
            break
    if fmt != "ko" and ronda_cerrada and ronda_cerrada > 0:
        anteriores = {f["id"]: f["pos"] for f in tabla(liga, hasta_ronda=ronda_cerrada - 1)}
        for f in filas:
            f["mov"] = anteriores.get(f["id"], f["pos"]) - f["pos"]

    campeon = None
    if fmt == "ko" and liga["partidos"]:
        final = max(liga["partidos"], key=lambda p: (p["ronda"], -p["orden"]))
        campeon = ganador_id(final) if terminado(final) else None
    elif liga["generado"] and reales and len(jugados) == len(reales):
        if fmt != "suizo" or ronda_cerrada == total_rondas - 1:
            campeon = filas[0]["id"] if filas else None

    nombres_ronda = []
    for r in range(total_rondas):
        if fmt == "ko":
            nombres_ronda.append(nombre_ronda_ko(r, total_rondas))
        elif fmt == "suizo":
            nombres_ronda.append(f"Ronda {r + 1}")
        else:
            nombres_ronda.append(f"Jornada {r + 1}")

    puede_avanzar = False
    if fmt == "suizo" and liga["generado"]:
        actual = max((p["ronda"] for p in liga["partidos"]), default=-1)
        puede_avanzar = (actual + 1 < total_rondas and
                         all(terminado(p) for p in liga["partidos"] if p["ronda"] == actual))

    datos.update(
        tabla=filas,
        formato_nombre=FORMATOS[fmt],
        total_rondas=total_rondas,
        nombres_ronda=nombres_ronda,
        jugados=len(jugados),
        total_partidos=len(reales) if fmt != "suizo" else len(reales),
        campeon=campeon,
        puede_avanzar=puede_avanzar,
        sets_para_ganar=sets_para_ganar(cfg),
    )
    return datos


def resumen(liga: dict) -> dict:
    reales = [p for p in liga["partidos"] if not p.get("bye")]
    return {
        "id": liga["id"],
        "nombre": liga["nombre"],
        "formato": liga["config"]["formato"],
        "formato_nombre": FORMATOS[liga["config"]["formato"]],
        "jugadores": len(liga["jugadores"]),
        "jugados": sum(1 for p in reales if p.get("marcador")),
        "total": len(reales),
        "creada": liga["creada"],
    }


def cambiar_config(liga: dict, cfg: dict) -> None:
    """Cambia reglas. Si cambia el formato o el «al mejor de», se regenera."""
    anterior = liga["config"]
    nueva = normalizar_config(cfg, base=anterior)
    regenerar = liga["generado"] and (
        nueva["formato"] != anterior["formato"] or nueva["mejor_de"] != anterior["mejor_de"]
        or nueva["puntos_set"] != anterior["puntos_set"]
    )
    liga["config"] = nueva
    if regenerar:
        generar_calendario(liga, conservar=False)
