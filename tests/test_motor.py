import unittest
from collections import Counter
from itertools import combinations

from liga import motor


def liga_con(n, **cfg):
    liga = motor.nueva_liga("Prueba", cfg, [f"J{i}" for i in range(1, n + 1)])
    motor.generar_calendario(liga)
    return liga


def ids(liga):
    return [j["id"] for j in liga["jugadores"]]


class TestCalendario(unittest.TestCase):
    def test_defecto_es_ida_y_vuelta(self):
        self.assertEqual(motor.CONFIG_DEFECTO["formato"], "rr2")

    def test_ida_y_vuelta_cubre_cada_cruce_en_ambos_sentidos(self):
        for n in (2, 5, 8):
            liga = liga_con(n)
            pares = Counter((p["a"], p["b"]) for p in liga["partidos"])
            self.assertEqual(len(liga["partidos"]), n * (n - 1))
            for a, b in combinations(ids(liga), 2):
                self.assertEqual(pares[(a, b)], 1)
                self.assertEqual(pares[(b, a)], 1)

    def test_nadie_juega_dos_veces_por_jornada(self):
        liga = liga_con(7)
        for r in range(max(p["ronda"] for p in liga["partidos"]) + 1):
            jugadores = [x for p in liga["partidos"] if p["ronda"] == r for x in (p["a"], p["b"])]
            self.assertEqual(len(jugadores), len(set(jugadores)))

    def test_solo_ida(self):
        liga = liga_con(6, formato="rr1")
        self.assertEqual(len(liga["partidos"]), 15)
        self.assertEqual(len({frozenset((p["a"], p["b"])) for p in liga["partidos"]}), 15)

    def test_eliminacion_con_byes(self):
        liga = liga_con(6, formato="ko")
        primera = [p for p in liga["partidos"] if p["ronda"] == 0]
        self.assertEqual(len(primera), 4)
        self.assertEqual(sum(p["bye"] for p in primera), 2)
        # los byes avanzan solos a semifinales
        semis = [p for p in liga["partidos"] if p["ronda"] == 1]
        self.assertEqual(sum(1 for p in semis for x in (p["a"], p["b"]) if x), 2)

    def test_suizo_sin_revanchas(self):
        liga = liga_con(8, formato="suizo", rondas_suizo=3)
        for _ in range(3):
            r = max(p["ronda"] for p in liga["partidos"])
            for p in liga["partidos"]:
                if p["ronda"] == r and not p.get("bye"):
                    motor.registrar_resultado(liga, p["id"], {"marcador": [3, 1]})
            if r < 2:
                motor.siguiente_ronda_suizo(liga)
        cruces = [frozenset((p["a"], p["b"])) for p in liga["partidos"]]
        self.assertEqual(len(cruces), len(set(cruces)))
        with self.assertRaises(motor.ErrorLiga):
            motor.siguiente_ronda_suizo(liga)


class TestResultados(unittest.TestCase):
    def setUp(self):
        self.liga = liga_con(4)
        self.p = self.liga["partidos"][0]

    def test_sets_validos_con_deuce(self):
        motor.registrar_resultado(self.liga, self.p["id"], {"sets": [[11, 7], [12, 14], [11, 9], [15, 13]]})
        self.assertEqual(self.p["marcador"], [3, 1])

    def test_set_invalido(self):
        for malo in ([[11, 10]], [[12, 8]], [[9, 7]]):
            with self.assertRaises(motor.ErrorLiga):
                motor.registrar_resultado(self.liga, self.p["id"], {"sets": malo})

    def test_sets_de_mas_o_de_menos(self):
        with self.assertRaises(motor.ErrorLiga):
            motor.registrar_resultado(self.liga, self.p["id"], {"sets": [[11, 1], [11, 2]]})
        with self.assertRaises(motor.ErrorLiga):
            motor.registrar_resultado(self.liga, self.p["id"],
                                      {"sets": [[11, 1], [11, 2], [11, 3], [11, 4]]})

    def test_marcador_rapido_y_wo(self):
        motor.registrar_resultado(self.liga, self.p["id"], {"marcador": [2, 3]})
        self.assertEqual(motor.ganador(self.p), "b")
        motor.registrar_resultado(self.liga, self.p["id"], {"wo": "a"})
        self.assertEqual(self.p["marcador"], [3, 0])


class TestTabla(unittest.TestCase):
    def test_puntos_configurables_y_bonus(self):
        liga = liga_con(2, formato="rr1", pts_victoria=2, pts_derrota=1,
                        bonus_barrida=1, bonus_derrota_ajustada=0)
        p = liga["partidos"][0]
        motor.registrar_resultado(liga, p["id"], {"marcador": [3, 0]})
        filas = {f["id"]: f for f in motor.tabla(liga)}
        self.assertEqual(filas[p["a"]]["pts"], 3)
        self.assertEqual(filas[p["b"]]["pts"], 1)

    def test_enfrentamiento_directo_desempata(self):
        liga = liga_con(3, formato="rr1", desempate=["puntos", "h2h", "dif_sets"])
        a, b, c = ids(liga)

        def jugar(x, y, marcador):
            for p in liga["partidos"]:
                if {p["a"], p["b"]} == {x, y}:
                    m = marcador if p["a"] == x else list(reversed(marcador))
                    motor.registrar_resultado(liga, p["id"], {"marcador": m})

        jugar(a, b, [3, 2])   # A gana a B ajustado
        jugar(b, c, [3, 0])   # B arrasa a C
        jugar(c, a, [3, 0])   # C arrasa a A -> todos 3 pts
        # A, B y C empatan en puntos y en mini liga: decide la diferencia de sets
        orden = [f["id"] for f in motor.tabla(liga)]
        self.assertEqual(orden[0], b)

    def test_cambiar_puntos_no_borra_resultados(self):
        liga = liga_con(4)
        p = liga["partidos"][0]
        motor.registrar_resultado(liga, p["id"], {"marcador": [3, 0]})
        motor.cambiar_config(liga, {"pts_victoria": 5})
        self.assertEqual(p["marcador"], [3, 0])
        self.assertEqual(motor.tabla(liga)[0]["pts"], 5)


class TestAltasYBajas(unittest.TestCase):
    def test_sumar_jugador_conserva_resultados(self):
        liga = liga_con(4)
        p = liga["partidos"][0]
        clave = (p["a"], p["b"])
        motor.registrar_resultado(liga, p["id"], {"marcador": [3, 1]})
        motor.agregar_jugadores(liga, ["Nuevo"])
        self.assertEqual(len(liga["partidos"]), 5 * 4)
        conservado = [x for x in liga["partidos"] if (x["a"], x["b"]) == clave][0]
        self.assertEqual(conservado["marcador"], [3, 1])

    def test_duplicados_y_listas_pegadas(self):
        liga = motor.nueva_liga("X", None, ["Ana, Beto\nCarla", "ana"])
        self.assertEqual([j["nombre"] for j in liga["jugadores"]], ["Ana", "Beto", "Carla"])

    def test_ko_propaga_y_limpia(self):
        liga = liga_con(4, formato="ko")
        semi1, semi2 = [p for p in liga["partidos"] if p["ronda"] == 0]
        final = [p for p in liga["partidos"] if p["ronda"] == 1][0]
        motor.registrar_resultado(liga, semi1["id"], {"marcador": [3, 0]})
        motor.registrar_resultado(liga, semi2["id"], {"marcador": [0, 3]})
        self.assertEqual((final["a"], final["b"]), (semi1["a"], semi2["b"]))
        motor.registrar_resultado(liga, final["id"], {"marcador": [3, 2]})
        self.assertEqual(motor.vista(liga)["campeon"], semi1["a"])
        # cambiar una semi saca al finalista y borra la final
        motor.registrar_resultado(liga, semi1["id"], {"marcador": [1, 3]})
        self.assertIsNone(final["marcador"])
        self.assertEqual(final["a"], semi1["b"])


if __name__ == "__main__":
    unittest.main()
