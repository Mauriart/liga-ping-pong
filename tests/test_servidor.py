import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest import mock

from liga import almacen as almacen_mod
from liga.almacen import Almacen
from liga.servidor import crear_servidor


class TestAlmacen(unittest.TestCase):
    def test_reintenta_si_onedrive_bloquea_el_archivo(self):
        with tempfile.TemporaryDirectory() as tmp:
            a = Almacen(Path(tmp) / "ligas.json")
            a.ligas.append({"id": "x"})
            real = almacen_mod.os.replace
            llamadas = []

            def bloqueado_una_vez(origen, destino):
                llamadas.append(1)
                if len(llamadas) == 1:
                    raise PermissionError("[WinError 5] Acceso denegado")
                real(origen, destino)

            with mock.patch.object(almacen_mod.os, "replace", bloqueado_una_vez), \
                    mock.patch.object(almacen_mod.time, "sleep"):
                a.guardar()
            self.assertEqual(len(llamadas), 2)
            self.assertEqual(Almacen(Path(tmp) / "ligas.json").ligas, [{"id": "x"}])


class TestApi(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.almacen = Almacen(Path(self.tmp.name) / "ligas.json")
        self.srv = crear_servidor(self.almacen, 0)
        self.base = f"http://127.0.0.1:{self.srv.server_address[1]}"
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def tearDown(self):
        self.srv.shutdown()
        self.srv.server_close()
        self.tmp.cleanup()

    def pedir(self, metodo, ruta, cuerpo=None):
        datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
        req = urllib.request.Request(self.base + ruta, data=datos, method=metodo,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def test_guarda_resultado_al_mejor_de_uno(self):
        _, liga = self.pedir("POST", "/api/ligas", {
            "nombre": "test", "jugadores": ["Sid", "Men"],
            "config": {"mejor_de": 1, "puntos_set": 7, "marcador": "sets"}})
        p = liga["partidos"][0]
        codigo, vista = self.pedir("PUT", f"/api/ligas/{liga['id']}/partidos/{p['id']}", {"marcador": [0, 1]})
        self.assertEqual(codigo, 200)
        self.assertEqual(vista["jugados"], 1)
        guardado = json.loads((Path(self.tmp.name) / "ligas.json").read_text(encoding="utf-8"))
        self.assertEqual(guardado["ligas"][0]["partidos"][0]["marcador"], [0, 1])

    def test_error_al_guardar_responde_json_y_no_corta(self):
        _, liga = self.pedir("POST", "/api/ligas", {"nombre": "test", "jugadores": ["A", "B"]})
        p = liga["partidos"][0]
        with mock.patch.object(self.almacen, "guardar", side_effect=PermissionError("bloqueado")):
            codigo, cuerpo = self.pedir("PUT", f"/api/ligas/{liga['id']}/partidos/{p['id']}", {"marcador": [3, 0]})
        self.assertEqual(codigo, 500)
        self.assertIn("No se pudo guardar", cuerpo["error"])


if __name__ == "__main__":
    unittest.main()
