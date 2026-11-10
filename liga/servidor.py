"""Servidor HTTP local (solo biblioteca estándar): API JSON + archivos estáticos."""
from __future__ import annotations

import json
import mimetypes
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from . import motor
from .almacen import Almacen

ESTATICOS = Path(__file__).resolve().parent.parent / "static"


def crear_servidor(almacen: Almacen, puerto: int) -> ThreadingHTTPServer:
    rutas = []

    def ruta(metodo: str, patron: str):
        def deco(fn):
            rutas.append((metodo, re.compile(f"^{patron}$"), fn))
            return fn
        return deco

    def liga_o_404(lid):
        liga = almacen.buscar(lid)
        if not liga:
            raise LookupError("Liga no encontrada.")
        return liga

    # ---- Ligas ----------------------------------------------------------
    @ruta("GET", r"/api/meta")
    def meta(_c):
        return {"formatos": motor.FORMATOS, "criterios": motor.CRITERIOS,
                "config": motor.CONFIG_DEFECTO}

    @ruta("GET", r"/api/ligas")
    def listar(_c):
        return [motor.resumen(l) for l in almacen.ligas]

    @ruta("POST", r"/api/ligas")
    def crear(c):
        liga = motor.nueva_liga(c.get("nombre"), c.get("config"), c.get("jugadores"))
        if len(liga["jugadores"]) >= 2 and c.get("generar", True):
            motor.generar_calendario(liga)
        almacen.ligas.append(liga)
        return motor.vista(liga)

    @ruta("GET", r"/api/ligas/(\w+)")
    def obtener(_c, lid):
        return motor.vista(liga_o_404(lid))

    @ruta("PATCH", r"/api/ligas/(\w+)")
    def editar(c, lid):
        liga = liga_o_404(lid)
        if "nombre" in c:
            nombre = (c["nombre"] or "").strip()
            if not nombre:
                raise motor.ErrorLiga("La liga necesita un nombre.")
            liga["nombre"] = nombre[:60]
        if "config" in c:
            motor.cambiar_config(liga, c["config"])
        return motor.vista(liga)

    @ruta("DELETE", r"/api/ligas/(\w+)")
    def borrar(_c, lid):
        liga = liga_o_404(lid)
        almacen.ligas.remove(liga)
        return {"ok": True}

    @ruta("POST", r"/api/ligas/(\w+)/calendario")
    def calendario(c, lid):
        liga = liga_o_404(lid)
        motor.generar_calendario(liga, conservar=bool(c.get("conservar")))
        return motor.vista(liga)

    @ruta("POST", r"/api/ligas/(\w+)/ronda")
    def ronda(_c, lid):
        liga = liga_o_404(lid)
        motor.siguiente_ronda_suizo(liga)
        return motor.vista(liga)

    # ---- Jugadores ------------------------------------------------------
    @ruta("POST", r"/api/ligas/(\w+)/jugadores")
    def agregar(c, lid):
        liga = liga_o_404(lid)
        nuevos = motor.agregar_jugadores(liga, c.get("nombres") or [])
        if not nuevos:
            raise motor.ErrorLiga("No hay nombres nuevos para agregar (¿ya estaban?).")
        if not liga["generado"] and len(liga["jugadores"]) >= 2 and c.get("generar"):
            motor.generar_calendario(liga)
        return motor.vista(liga)

    @ruta("PATCH", r"/api/ligas/(\w+)/jugadores/(\w+)")
    def renombrar(c, lid, pid):
        liga = liga_o_404(lid)
        motor.renombrar_jugador(liga, pid, c.get("nombre"))
        return motor.vista(liga)

    @ruta("DELETE", r"/api/ligas/(\w+)/jugadores/(\w+)")
    def quitar(_c, lid, pid):
        liga = liga_o_404(lid)
        motor.eliminar_jugador(liga, pid)
        return motor.vista(liga)

    # ---- Partidos -------------------------------------------------------
    @ruta("PUT", r"/api/ligas/(\w+)/partidos/(\w+)")
    def resultado(c, lid, mid):
        liga = liga_o_404(lid)
        motor.registrar_resultado(liga, mid, c)
        return motor.vista(liga)

    @ruta("DELETE", r"/api/ligas/(\w+)/partidos/(\w+)")
    def anular(_c, lid, mid):
        liga = liga_o_404(lid)
        motor.borrar_resultado(liga, mid)
        return motor.vista(liga)

    class Manejador(BaseHTTPRequestHandler):
        server_version = "LigaPingPong/1.0"

        def log_message(self, *_):  # consola limpia
            pass

        def _responder(self, codigo: int, cuerpo: bytes, tipo: str):
            self.send_response(codigo)
            self.send_header("Content-Type", tipo)
            self.send_header("Content-Length", str(len(cuerpo)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(cuerpo)

        def _json(self, codigo: int, datos):
            self._responder(codigo, json.dumps(datos, ensure_ascii=False).encode("utf-8"),
                            "application/json; charset=utf-8")

        def _api(self, metodo: str):
            camino = self.path.split("?", 1)[0]
            for m, patron, fn in rutas:
                coincide = patron.match(camino)
                if m == metodo and coincide:
                    break
            else:
                return self._json(404, {"error": "Ruta no encontrada."})
            try:
                largo = int(self.headers.get("Content-Length") or 0)
                cuerpo = json.loads(self.rfile.read(largo) or b"{}") if largo else {}
                with almacen.candado:
                    datos = fn(cuerpo, *coincide.groups())
                    if metodo != "GET":
                        almacen.guardar()
                self._json(200, datos)
            except motor.ErrorLiga as e:
                self._json(400, {"error": str(e)})
            except LookupError as e:
                self._json(404, {"error": str(e)})
            except json.JSONDecodeError:
                self._json(400, {"error": "Cuerpo JSON inválido."})
            except OSError as e:
                print(f"Error al guardar: {e}")
                self._json(500, {"error": "No se pudo guardar en el disco. Revisa que la carpeta "
                                          "«datos» no esté bloqueada e inténtalo de nuevo."})
            except Exception as e:  # nunca cortar la conexión sin respuesta
                print(f"Error inesperado: {e!r}")
                self._json(500, {"error": "Error inesperado en la app. Inténtalo de nuevo."})

        def _estatico(self):
            camino = self.path.split("?", 1)[0]
            if camino == "/":
                camino = "/index.html"
            archivo = (ESTATICOS / camino.lstrip("/")).resolve()
            if ESTATICOS not in archivo.parents or not archivo.is_file():
                return self._responder(404, b"No encontrado", "text/plain; charset=utf-8")
            tipo = mimetypes.guess_type(archivo.name)[0] or "application/octet-stream"
            if tipo.startswith("text/") or tipo.endswith("javascript"):
                tipo += "; charset=utf-8"
            self._responder(200, archivo.read_bytes(), tipo)

        def do_GET(self):
            if self.path.startswith("/api/"):
                return self._api("GET")
            self._estatico()

        def do_POST(self):
            self._api("POST")

        def do_PUT(self):
            self._api("PUT")

        def do_PATCH(self):
            self._api("PATCH")

        def do_DELETE(self):
            self._api("DELETE")

    return ThreadingHTTPServer(("127.0.0.1", puerto), Manejador)
