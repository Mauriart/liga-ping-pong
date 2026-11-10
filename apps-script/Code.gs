/**
 * TOPSPIN · base de datos en Google Sheets
 *
 * Cada torneo es una fila de la hoja «Torneos»: resumen legible en las primeras
 * columnas y el torneo completo (JSON) en «datos» (y columnas siguientes si es largo).
 *
 * - Leer (GET) es público: cualquiera con la dirección ve los torneos.
 * - Guardar o borrar (POST) pide la clave de administrador.
 *
 * Instalación: ver apps-script/LEEME.md
 */

// Elige tu clave de administrador (la escribes tú; no la compartas).
const CLAVE_ADMIN = "CAMBIA-ESTA-CLAVE";

const HOJA = "Torneos";
const COLUMNAS = ["id", "nombre", "formato", "jugadores", "partidos", "estado", "campeon", "actualizado", "datos"];
const RESUMEN = 8;      // columnas de resumen antes de «datos»
const TROZO = 45000;    // una celda admite hasta 50.000 caracteres

function hoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName(HOJA);
  if (!h) {
    h = libro.insertSheet(HOJA);
    h.appendRow(COLUMNAS);
    h.setFrozenRows(1);
    h.getRange(1, 1, 1, COLUMNAS.length).setFontWeight("bold");
  }
  return h;
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function leerTodas_() {
  const valores = hoja_().getDataRange().getDisplayValues();
  const ligas = [];
  for (let i = 1; i < valores.length; i++) {
    const fila = valores[i];
    if (!fila[0]) continue;
    try { ligas.push(JSON.parse(fila.slice(RESUMEN).join(""))); } catch (e) { /* fila dañada: se omite */ }
  }
  return ligas;
}

function doGet() {
  return responder_({ ok: true, ligas: leerTodas_(), hora: new Date().toISOString() });
}

function doPost(e) {
  let cuerpo;
  try { cuerpo = JSON.parse(e.postData.contents); } catch (err) { return responder_({ ok: false, error: "Pedido inválido." }); }
  if (!cuerpo || cuerpo.clave !== CLAVE_ADMIN || CLAVE_ADMIN === "CAMBIA-ESTA-CLAVE") {
    return responder_({ ok: false, error: "Clave de administrador incorrecta." });
  }
  const candado = LockService.getScriptLock();
  candado.waitLock(10000);
  try {
    if (cuerpo.accion === "verificar") return responder_({ ok: true });
    if (cuerpo.accion === "guardar") { guardar_(cuerpo.liga, cuerpo.resumen || {}); return responder_({ ok: true }); }
    if (cuerpo.accion === "borrar") { borrar_(cuerpo.id); return responder_({ ok: true }); }
    return responder_({ ok: false, error: "Acción desconocida." });
  } catch (err) {
    return responder_({ ok: false, error: String(err && err.message || err) });
  } finally {
    candado.releaseLock();
  }
}

function filaDe_(h, id) {
  const ultima = h.getLastRow();
  if (ultima < 2) return 0;
  const ids = h.getRange(2, 1, ultima - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}

function guardar_(liga, resumen) {
  if (!liga || typeof liga.id !== "string") throw new Error("Torneo inválido.");
  const h = hoja_();
  const json = JSON.stringify(liga);
  const trozos = [];
  for (let i = 0; i < json.length; i += TROZO) trozos.push(json.slice(i, i + TROZO));
  const reales = (liga.partidos || []).filter(function (p) { return !p.bye; });
  const fila = [
    liga.id,
    liga.nombre || "",
    resumen.formato || (liga.config && liga.config.formato) || "",
    (liga.jugadores || []).map(function (j) { return j.nombre; }).join(", "),
    reales.filter(function (p) { return p.marcador; }).length + " / " + reales.length,
    resumen.estado || "",
    resumen.campeon || "",
    liga.actualizado || new Date().toISOString(),
  ].concat(trozos);
  let n = filaDe_(h, liga.id);
  if (!n) n = h.getLastRow() + 1;
  const ancho = Math.max(h.getLastColumn(), fila.length);
  h.getRange(n, 1, 1, ancho).clearContent();
  // texto plano: evita que un nombre o un trozo de JSON se lea como fórmula o número
  h.getRange(n, 1, 1, fila.length).setNumberFormat("@").setValues([fila]);
}

function borrar_(id) {
  const h = hoja_();
  const n = filaDe_(h, id);
  if (n) h.deleteRow(n);
}
