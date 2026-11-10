# TOPSPIN · Liga de ping pong

Liga de ping pong con estética de transmisión deportiva: jugadores, calendario 1 contra 1, resultados, tabla y presentación de cada partido sobre una mesa.

Hecha con **React + TypeScript + Vite**. Es un sitio estático: no necesita servidor ni base de datos. Las ligas se guardan en el navegador y la tabla se comparte por enlace o como imagen.

## Usarla

```bash
npm install
npm run dev        # http://localhost:5180
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run verificar` | Tipos, pruebas y build (correr antes de subir cambios) |
| `npm test` | Pruebas del motor de liga |
| `npm run build` | Genera el sitio en `dist/` |

## Qué trae

- **Intro animada**: la mesa se dibuja, la pelota pelotea y el último golpe revela la marca (se ve una vez por sesión; se puede saltar y repetir desde Ajustes).
- **Cursor de paleta**: sigue al mouse, se inclina sobre lo clicable y hace el golpe al hacer clic. En campos de texto vuelve el cursor normal y en pantallas táctiles no aparece.
- **El torneo vive en la mesa**: el próximo partido se juega en una mesa 3D con cada jugador en su mitad; cada partido de la lista es su propia mini mesa.
- **Presentación del partido** (`P`): entrada tipo transmisión con la mesa al centro, los dos jugadores con sus números, historial y «VS». Desde ahí se registra el resultado.
- **Alta rápida** (`J`): Enter para sumar, o pega una lista separada por comas o renglones.
- **Formatos**: todos contra todos ida y vuelta (por defecto), solo ida, eliminación directa con cuadro y sistema suizo.
- **Gran final** (por defecto en «todos contra todos»): empate en puntos = mismo puesto, sin criterios que pongan a uno sobre otro. Al cerrar la fase regular se juega la gran final 1.º vs 2.º; si hay empate por la final se desempata en la mesa, y si hay empate por el 3.er puesto se juega el partido por el tercero. Se puede cambiar a «Tabla» (criterios de desempate) en Ajustes.
- **Reglas propias**: al mejor de 1/3/5/7, sets a 11, 21 u otro; puntos por victoria, derrota y W.O.; bonus por barrida y por derrota ajustada; orden de desempate (incluye enfrentamiento directo).
- **Resultados** (`R`): set por set con validación en vivo o solo el marcador de sets; «Guardar y siguiente» encadena los pendientes.
- **Compartir la tabla** (`S`): enlace de solo lectura que lleva la tabla dentro (sin servidor), imagen PNG para el chat y botón de compartir del celular.
- Tema oscuro y claro, diseño para móvil, respeta «reducir movimiento».

## Datos

- Se guardan en el navegador (`localStorage`). Para pasar ligas a otra compu: **Ajustes → Exportar** y luego **Importar** en el inicio.
- **Importar** acepta también el `ligas.json` de la primera versión en Python.

## Publicar en GitHub Pages

El flujo `.github/workflows/pages.yml` compila y publica en cada push a `main`. Hay que activarlo una vez en **Settings → Pages → Source: GitHub Actions**. En el plan gratis, Pages requiere que el repositorio sea público.

Con la app publicada, el enlace de «Compartir tabla» lo puede abrir cualquiera.

## Atajos

| Tecla | Acción |
|---|---|
| `N` | Nueva liga |
| `J` | Agregar jugadores |
| `R` | Registrar el siguiente resultado |
| `P` | Presentar el siguiente partido |
| `S` | Compartir la tabla |
| `1`–`4` | Cambiar de pestaña |
| `Enter` / `Shift+Enter` | Guardar / guardar y seguir (en el resultado) |

## Estructura

```
src/engine/motor.ts       formatos, calendario, validación de sets y tabla (puro, con pruebas)
src/store.ts              ligas en el navegador (zustand + localStorage)
src/compartir.ts          foto de la tabla comprimida en el enlace
src/components/           mesa 3D, intro, cursor, presentación, resultado, reglas…
src/views/                inicio, liga y vista compartida
src/styles/app.css        estilos (lienzo negro, acento voltio, rojo en vivo)
```
