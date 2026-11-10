"""Guarda las ligas en un archivo JSON local (escritura atómica)."""
from __future__ import annotations

import json
import os
import threading
import time
from pathlib import Path

REINTENTOS = 6


class Almacen:
    def __init__(self, ruta: Path):
        self.ruta = Path(ruta)
        self.candado = threading.RLock()
        self.datos = {"ligas": []}
        if self.ruta.exists():
            try:
                self.datos = json.loads(self.ruta.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                respaldo = self.ruta.with_suffix(".corrupto.json")
                self.ruta.replace(respaldo)
                print(f"Aviso: el archivo de datos estaba dañado; se movió a {respaldo.name}")
        self.datos.setdefault("ligas", [])

    @property
    def ligas(self) -> list[dict]:
        return self.datos["ligas"]

    def buscar(self, lid: str) -> dict | None:
        return next((l for l in self.ligas if l["id"] == lid), None)

    def guardar(self) -> None:
        with self.candado:
            self.ruta.parent.mkdir(parents=True, exist_ok=True)
            temporal = self.ruta.with_suffix(".tmp")
            temporal.write_text(json.dumps(self.datos, ensure_ascii=False, indent=1), encoding="utf-8")
            # OneDrive o el antivirus pueden bloquear el archivo un instante
            for intento in range(REINTENTOS):
                try:
                    os.replace(temporal, self.ruta)
                    return
                except PermissionError:
                    if intento == REINTENTOS - 1:
                        raise
                    time.sleep(0.1 * (intento + 1))
