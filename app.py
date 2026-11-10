"""TOPSPIN · Liga de ping pong.

Uso:  py app.py            (abre el navegador)
      py app.py --puerto 9000 --sin-navegador
"""
from __future__ import annotations

import argparse
import socket
import threading
import webbrowser
from pathlib import Path

from liga.almacen import Almacen
from liga.servidor import crear_servidor

RAIZ = Path(__file__).resolve().parent


def puerto_libre(inicial: int) -> int:
    for puerto in range(inicial, inicial + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", puerto)) != 0:
                return puerto
    raise RuntimeError("No encontré un puerto libre.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Liga de ping pong")
    parser.add_argument("--puerto", type=int, default=8765)
    parser.add_argument("--datos", type=Path, default=RAIZ / "datos" / "ligas.json")
    parser.add_argument("--sin-navegador", action="store_true")
    args = parser.parse_args()

    puerto = puerto_libre(args.puerto)
    servidor = crear_servidor(Almacen(args.datos), puerto)
    url = f"http://127.0.0.1:{puerto}"
    print(f"\n  TOPSPIN · Liga de ping pong\n  Abierto en {url}\n  Ctrl+C para cerrar\n")
    if not args.sin_navegador:
        threading.Timer(0.6, webbrowser.open, args=(url,)).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("  Hasta la próxima.")
    finally:
        servidor.server_close()


if __name__ == "__main__":
    main()
