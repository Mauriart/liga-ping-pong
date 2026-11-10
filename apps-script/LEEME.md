# Conectar TOPSPIN a Google Sheets

La hoja guarda todos los torneos. Cualquiera que abra la app los ve; solo quien tenga la clave de administrador puede cambiarlos.

## 1. Crear la hoja

1. Entra a [sheets.new](https://sheets.new) con tu cuenta de Google.
2. Ponle nombre, por ejemplo «TOPSPIN · Torneos». La pestaña «Torneos» se crea sola al guardar el primero.

## 2. Pegar el script

1. En la hoja: **Extensiones → Apps Script**.
2. Borra lo que trae `Código.gs` y pega todo el contenido de [`Code.gs`](./Code.gs).
3. En la línea `const CLAVE_ADMIN = "CAMBIA-ESTA-CLAVE";` escribe **tu propia clave** entre las comillas. Es la que usarás en la app para entrar como administrador.
4. Guarda (ícono de disquete).

## 3. Publicarlo como aplicación web

1. **Implementar → Nueva implementación**.
2. En «Tipo», elige **Aplicación web**.
3. **Ejecutar como:** Yo. **Quién tiene acceso:** Cualquier persona.
4. **Implementar** y acepta los permisos (Google avisa que la app no está verificada: es tu propio script; entra en «Configuración avanzada → Ir a…»).
5. Copia la **URL de la aplicación web** (termina en `/exec`).

## 4. Conectar la app

- Pega esa URL en la app: **Inicio → Conectar Google Sheets**. O pásasela a quien mantiene el código para dejarla fija en `.env` (`VITE_SHEETS_URL=…`) y que todos la usen sin configurar nada.
- Entra como administrador con el candado de la barra superior y tu clave.
- Sube tus torneos con **Subir a la nube** en cada tarjeta del inicio.

## Si cambias el script

Después de editar `Code.gs`: **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva versión → Implementar**. La URL no cambia.

## Qué hay en la hoja

| Columna | Contenido |
|---|---|
| id | Identificador del torneo |
| nombre, formato, jugadores | Resumen legible |
| partidos | Jugados / total |
| estado, campeon | Cómo va y quién ganó |
| actualizado | Último cambio |
| datos (y siguientes) | El torneo completo en JSON. **No lo edites a mano.** |
