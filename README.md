# TOPSPIN · Liga de ping pong

App local en Python para llevar una liga de ping pong: jugadores, calendario 1 contra 1, resultados y tabla, con estética de transmisión deportiva.

**Sin dependencias**: solo Python 3.10+ (biblioteca estándar). La interfaz es una página web que sirve la propia app.

## Iniciar

- Doble clic en `iniciar.bat` (Windows), o
- `py app.py` (abre el navegador en `http://127.0.0.1:8765`)

Opciones: `--puerto 9000`, `--sin-navegador`, `--datos ruta/ligas.json`.

Los datos se guardan en `datos/ligas.json`.

## Qué hace

- **Alta rápida de jugadores**: escribe y pulsa Enter, o pega una lista separada por comas o renglones. Atajo `J` desde cualquier pantalla.
- **Formatos**:
  - Todos contra todos, ida y vuelta (**por defecto**)
  - Todos contra todos, solo ida
  - Eliminación directa (cuadro con cabezas de serie y pases directos)
  - Sistema suizo (empareja por tabla sin revanchas; rondas automáticas o fijas)
- **Reglas a tu medida**: al mejor de 1/3/5/7, sets a 11, 21 u otro, puntos por victoria, derrota y W.O., bonus por barrida y por derrota ajustada, y orden de desempate (incluye enfrentamiento directo). Trae plantillas: Clásico 3·0, Estilo ITTF 2·1, Con bonus y 1 por victoria.
- **Carga de resultados**: punto a punto por set con validación en vivo (deuce, sets de más) o solo el marcador de sets. «Guardar y siguiente» encadena los partidos pendientes. Atajo `R`.
- Tabla con movimiento de posiciones, racha de los últimos 5, ficha de cada jugador, ticker de resultados, tema claro/oscuro y diseño para móvil.
- Sumar jugadores a mitad de liga conserva los resultados en todos contra todos; en suizo entran en la próxima ronda.

## Atajos

| Tecla | Acción |
|---|---|
| `N` | Nueva liga |
| `J` | Agregar jugadores |
| `R` | Registrar el siguiente resultado pendiente |
| `1`–`4` | Tabla · Partidos · Jugadores · Ajustes |
| `Enter` / `Shift+Enter` | Guardar / guardar y abrir el siguiente (en el resultado) |

## Pruebas

```bash
py -m unittest discover -s tests -t .
```

## Estructura

```
app.py              arranque del servidor local
liga/motor.py       formatos, calendario, validación de sets y tabla
liga/almacen.py     guardado en JSON (escritura atómica)
liga/servidor.py    API JSON + archivos estáticos
static/             interfaz (HTML, CSS y JS sin dependencias)
tests/              pruebas del motor
```
