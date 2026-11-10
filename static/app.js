/* TOPSPIN · Liga de ping pong — interfaz (JS sin dependencias) */
"use strict";

// ---------------------------------------------------------------- utilidades
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const guardar = (k, v) => { try { localStorage.setItem("topspin." + k, JSON.stringify(v)); } catch {} };
const leer = (k, d) => { try { const v = localStorage.getItem("topspin." + k); return v == null ? d : JSON.parse(v); } catch { return d; } };

const SIN_CONEXION = "Sin conexión con TOPSPIN: la app está cerrada. Ábrela de nuevo (iniciar.bat) y vuelve a guardar; lo que escribiste sigue aquí.";

async function api(metodo, url, cuerpo) {
  let r;
  try {
    r = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error(SIN_CONEXION);
  }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || "Algo salió mal.");
  return datos;
}

const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  user: P('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>'),
  users: P('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  score: P('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 5v14M7 10v4M17 10v4"/>'),
  trophy: P('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>'),
  chev: P('<path d="m6 9 6 6 6-6"/>'),
  x: P('<path d="M18 6 6 18M6 6l12 12"/>'),
  check: P('<path d="M20 6 9 17l-5-5"/>'),
  alert: P('<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>'),
  edit: P('<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  trash: P('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
  moon: P('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  up: P('<path d="m18 15-6-6-6 6"/>'),
  down: P('<path d="m6 9 6 6 6-6"/>'),
  coffee: P('<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>'),
  refresh: P('<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>'),
  download: P('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  arrow: P('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  info: P('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
  bolt: P('<path d="M13 2 3 14h9l-1 8 10-12h-9Z"/>'),
  table: P('<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18"/>'),
  cal: P('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>'),
  // ilustraciones de formato
  rr2: P('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6h7M8.5 18h7M6 8.5v7M18 8.5v7M8 8l8 8M16 8l-8 8"/>'),
  rr1: P('<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M10.7 7.2 6.3 15.8M13.3 7.2l4.4 8.6M7.5 18h9"/>'),
  ko: P('<path d="M3 4h5v6H3M3 14h5v6H3M8 7h4v10H8M12 12h5M17 9h4v6h-4z"/>'),
  suizo: P('<path d="M4 6h6M14 6h6M4 12h6M14 12h6M4 18h6M14 18h6"/><path d="m10 6 4 6M10 12l4 6M10 18l4-12" opacity=".5"/>'),
};

const tono = (nombre) => { let h = 0; for (const c of nombre || "") h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const iniciales = (n) => (n || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const avatar = (nombre, cls = "") => nombre
  ? `<span class="av ${cls}" style="--h:${tono(nombre)}" aria-hidden="true">${esc(iniciales(nombre))}</span>`
  : `<span class="av tbd ${cls}" aria-hidden="true">?</span>`;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// ---------------------------------------------------------------- estado
const S = {
  meta: null,
  ligas: [],
  liga: null,
  tab: leer("tab", "tabla"),
  filtro: "todos",
  jugadorFiltro: "",
  abiertas: new Set(),
  borrador: null, // ajustes sin guardar
};

const nombreDe = (id) => S.liga?.jugadores.find((j) => j.id === id)?.nombre;
const ganadorLado = (p) => p.wo || (p.marcador ? (p.marcador[0] > p.marcador[1] ? "a" : "b") : null);
const terminado = (p) => p.bye || !!p.marcador;
const esKO = () => S.liga?.config.formato === "ko";

// ---------------------------------------------------------------- toasts
function toast(texto, { error = false, accion, alHacer, ms = 3800 } = {}) {
  const el = document.createElement("div");
  el.className = "toast" + (error ? " err" : "");
  el.innerHTML = `${error ? I.alert : I.check}<span>${esc(texto)}</span>${accion ? `<button>${esc(accion)}</button>` : ""}`;
  $("#toasts").append(el);
  const cerrar = () => { el.classList.add("out"); setTimeout(() => el.remove(), 200); };
  if (accion) el.querySelector("button").onclick = () => { alHacer?.(); cerrar(); };
  setTimeout(cerrar, ms);
}
const fallo = (e) => toast(e.message || String(e), { error: true, ms: e.message === SIN_CONEXION ? 8000 : 3800 });

// ---------------------------------------------------------------- modales
let alCerrarModal = null;
function abrirModal(html, { ancho = false, alMontar, alCerrar } = {}) {
  cerrarModal();
  const root = $("#modal-root");
  root.innerHTML = `<div class="overlay" data-overlay><div class="modal ${ancho ? "wide" : ""}" role="dialog" aria-modal="true">${html}</div></div>`;
  const modal = $(".modal", root);
  root.firstChild.addEventListener("mousedown", (e) => { if (e.target.dataset.overlay !== undefined) cerrarModal(); });
  alCerrarModal = alCerrar || null;
  alMontar?.(modal);
  const foco = modal.querySelector("[autofocus]") || modal.querySelector("input, button.btn-primary");
  setTimeout(() => foco?.focus(), 30);
  return modal;
}
function cerrarModal() {
  const root = $("#modal-root");
  if (!root.firstChild) return;
  root.innerHTML = "";
  const cb = alCerrarModal; alCerrarModal = null; cb?.();
}
const hayModal = () => !!$("#modal-root").firstChild;

function confirmar({ titulo, texto, ok = "Confirmar", peligro = false }) {
  return new Promise((resolver) => {
    let respuesta = false;
    abrirModal(`
      <div class="modal-head"><h2>${esc(titulo)}</h2></div>
      <div class="modal-body"><p style="margin:0;color:var(--muted);font-size:15px">${texto}</p></div>
      <div class="modal-foot"><span class="spacer"></span>
        <button class="btn btn-ghost" data-no>Cancelar</button>
        <button class="btn ${peligro ? "btn-danger" : "btn-primary"}" data-si autofocus>${esc(ok)}</button>
      </div>`, {
      alMontar: (m) => {
        m.querySelector("[data-no]").onclick = () => cerrarModal();
        m.querySelector("[data-si]").onclick = () => { respuesta = true; cerrarModal(); };
      },
      alCerrar: () => resolver(respuesta),
    });
  });
}

// ---------------------------------------------------------------- carga
async function iniciar() {
  document.documentElement.dataset.theme = leer("tema", "dark");
  S.meta = await api("GET", "/api/meta");
  S.ligas = await api("GET", "/api/ligas");
  const ultima = leer("liga", null);
  const id = location.hash.slice(1) || ultima;
  if (id && S.ligas.some((l) => l.id === id)) await abrirLiga(id, false);
  else render();
}

async function abrirLiga(id, cambiarHash = true) {
  try {
    S.liga = await api("GET", `/api/ligas/${id}`);
    S.borrador = null;
    S.abiertas = new Set();
    guardar("liga", id);
    if (cambiarHash) history.replaceState(null, "", "#" + id);
    render();
    window.scrollTo({ top: 0 });
  } catch (e) { fallo(e); irInicio(); }
}

function irInicio() {
  S.liga = null;
  guardar("liga", null);
  history.replaceState(null, "", location.pathname);
  render();
}

async function refrescarLista() { S.ligas = await api("GET", "/api/ligas"); }

function actualizar(vista) {
  S.liga = vista;
  render();
  refrescarLista().then(renderSwitcher);
}

// ---------------------------------------------------------------- render
function render() {
  renderSwitcher();
  renderAcciones();
  renderTicker();
  const app = $("#app");
  app.innerHTML = S.liga ? vistaLiga() : vistaInicio();
  if (S.liga) montarPestana();
}

function renderSwitcher() {
  const el = $("#switcher");
  if (!S.ligas.length) { el.innerHTML = ""; return; }
  const l = S.liga;
  el.innerHTML = `<button class="league-pick" data-action="menu-ligas" aria-haspopup="menu">
      <span class="dot">${l ? esc(iniciales(l.nombre)) : I.trophy}</span>
      <span class="name">${l ? esc(l.nombre) : "Mis ligas"}</span>${I.chev}
    </button>`;
}

function renderAcciones() {
  const tema = document.documentElement.dataset.theme;
  const el = $("#top-actions");
  if (!S.liga) {
    el.innerHTML = `
      <button class="btn btn-icon btn-ghost" data-action="tema" title="Cambiar tema">${tema === "dark" ? I.sun : I.moon}</button>
      ${S.ligas.length ? `<button class="btn btn-primary" data-action="nueva-liga">${I.plus}<span class="lbl">Nueva liga</span> <kbd>N</kbd></button>` : ""}`;
    return;
  }
  el.innerHTML = `
    <button class="btn" data-action="agregar-jugadores" title="Agregar jugadores (J)">${I.user}<span class="lbl">Jugador</span> <kbd>J</kbd></button>
    <button class="btn btn-primary" data-action="siguiente-resultado" title="Registrar resultado (R)">${I.score}<span class="lbl">Resultado</span> <kbd>R</kbd></button>
    <button class="btn btn-icon btn-ghost" data-action="tema" title="Cambiar tema">${tema === "dark" ? I.sun : I.moon}</button>`;
}

function renderTicker() {
  const el = $("#ticker");
  const l = S.liga;
  const jugados = l ? l.partidos.filter((p) => p.marcador).sort((a, b) => (b.jugado || "").localeCompare(a.jugado || "")).slice(0, 12) : [];
  if (!jugados.length) { el.hidden = true; document.body.classList.add("no-ticker"); return; }
  document.body.classList.remove("no-ticker");
  el.hidden = false;
  const item = (p) => {
    const g = ganadorLado(p);
    const [sa, sb] = p.marcador;
    return `<span class="tick"><span class="tag">${esc(l.nombres_ronda[p.ronda] || "")}</span>
      <span class="${g === "a" ? "w" : "l"}">${esc(nombreDe(p.a))}</span> <b>${sa}–${sb}</b>
      <span class="${g === "b" ? "w" : "l"}">${esc(nombreDe(p.b))}</span>${p.wo ? '<span class="tag">W.O.</span>' : ""}</span>`;
  };
  const fila = jugados.map(item).join("");
  el.innerHTML = `<div class="ticker-label"><i></i>Resultados</div>
    <div class="ticker-track"><div class="ticker-run" style="--dur:${Math.max(20, jugados.length * 7)}s">${fila}${fila}</div></div>`;
}

// ---------------------------------------------------------------- inicio
function vistaInicio() {
  const atajos = `<div class="shortcuts"><span><kbd>N</kbd> nueva liga</span><span><kbd>J</kbd> agregar jugador</span><span><kbd>R</kbd> registrar resultado</span><span><kbd>1</kbd>–<kbd>4</kbd> pestañas</span></div>`;
  if (!S.ligas.length) {
    return `
      <section class="home-hero">
        <span class="ball" aria-hidden="true"></span>
        <div class="eyebrow">Temporada ${new Date().getFullYear()}</div>
        <h1 class="display">Tu liga de<br><em>ping pong</em></h1>
        <p>Suma jugadores, elige el formato y genera todos los partidos en segundos. Tabla, racha y cuadro al instante.</p>
        <button class="btn btn-primary btn-lg" data-action="nueva-liga">${I.plus} Crear mi liga</button>
        ${atajos}
      </section>
      <div class="feature-row">
        <div class="feature">${I.users}<h3>Alta rápida</h3><p>Pega una lista de nombres o escríbelos con Enter. Sin formularios eternos.</p></div>
        <div class="feature">${I.rr2}<h3>4 formatos</h3><p>Todos contra todos ida y vuelta, solo ida, eliminación directa o sistema suizo.</p></div>
        <div class="feature">${I.gear}<h3>Tus reglas</h3><p>Puntos por victoria, derrota, W.O., bonus y desempates a tu medida.</p></div>
      </div>`;
  }
  return `
    <h2 class="section-title">Mis ligas <span class="sub">${plural(S.ligas.length, "liga", "ligas")}</span></h2>
    <div class="leagues">
      ${S.ligas.map((l) => {
        const pct = l.total ? Math.round((l.jugados / l.total) * 100) : 0;
        return `<button class="lcard" data-action="abrir-liga" data-id="${l.id}">
          <div class="badges"><span class="badge">${esc(l.formato_nombre)}</span></div>
          <div class="display">${esc(l.nombre)}</div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="foot"><span>${plural(l.jugadores, "jugador", "jugadores")}</span><span>${l.jugados}/${l.total} partidos</span></div>
        </button>`;
      }).join("")}
      <button class="lcard new" data-action="nueva-liga">${I.plus}<b>Nueva liga</b><span>Arma otra competencia</span></button>
    </div>
    ${atajos}`;
}

// ---------------------------------------------------------------- liga
function vistaLiga() {
  const l = S.liga;
  const pct = l.total_partidos ? Math.round((l.jugados / l.total_partidos) * 100) : 0;
  const actual = rondaActual();
  const sets = l.partidos.reduce((t, p) => t + (p.marcador && !p.wo ? p.marcador[0] + p.marcador[1] : 0), 0);
  const tabs = [
    ["tabla", esKO() ? "Cuadro" : "Tabla", esKO() ? I.ko : I.table, ""],
    ["partidos", "Partidos", I.cal, l.total_partidos - l.jugados],
    ["jugadores", "Jugadores", I.users, l.jugadores.length],
    ["ajustes", "Ajustes", I.gear, ""],
  ];
  if (!tabs.some((t) => t[0] === S.tab)) S.tab = "tabla";
  return `
    <section class="hero">
      <div>
        <div class="badges">
          <span class="badge red">${I[l.config.formato]} ${esc(l.formato_nombre)}</span>
          <span class="badge">Al mejor de ${l.config.mejor_de}</span>
          <span class="badge">Sets a ${l.config.puntos_set}</span>
          ${l.campeon ? `<span class="badge gold">${I.trophy} Finalizada</span>` : ""}
        </div>
        <h1 class="display">${esc(l.nombre)}</h1>
        <div class="progress">
          <div class="progress-head">
            <span class="eyebrow">${l.generado ? (l.campeon ? "Temporada terminada" : actual != null ? esc(l.nombres_ronda[actual]) + " en juego" : "En juego") : "Sin calendario"}</span>
            <b>${pct}%</b>
          </div>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>
        <div class="kpis">
          <div class="kpi"><b>${l.jugadores.length}</b><span>Jugadores</span></div>
          <div class="kpi"><b>${l.jugados}<small style="font-size:16px;color:var(--muted)">/${l.total_partidos}</small></b><span>Partidos</span></div>
          <div class="kpi"><b>${l.total_rondas}</b><span>${esKO() || l.config.formato === "suizo" ? "Rondas" : "Jornadas"}</span></div>
          <div class="kpi"><b>${sets}</b><span>Sets jugados</span></div>
        </div>
      </div>
      ${tarjetaLider()}
    </section>
    <div class="tabs-wrap">
      <div class="tabs" role="tablist">
        ${tabs.map(([id, txt, ico, n], i) => `<button class="tab ${S.tab === id ? "active" : ""}" role="tab" aria-selected="${S.tab === id}" data-action="tab" data-tab="${id}" title="Atajo: ${i + 1}">${txt}${n !== "" && n > 0 ? `<span class="count">${n}</span>` : ""}</button>`).join("")}
      </div>
    </div>
    <section id="pestana"></section>`;
}

function tarjetaLider() {
  const l = S.liga;
  const lider = l.campeon ? l.tabla.find((f) => f.id === l.campeon) || { nombre: nombreDe(l.campeon) } : l.tabla[0];
  const hayJuego = l.jugados > 0;
  if (!lider || (!hayJuego && !l.campeon)) {
    return `<div class="leader empty">
      <div class="eyebrow">${I.trophy} Líder</div>
      <div class="display" style="font-size:30px">Por definirse</div>
      <p>${l.generado ? "Registra el primer resultado y aquí aparecerá quien manda." : "Agrega al menos 2 jugadores para generar los partidos."}</p>
      ${l.generado ? `<button class="btn btn-primary" data-action="siguiente-resultado">${I.score} Primer resultado</button>` : `<button class="btn btn-primary" data-action="agregar-jugadores">${I.user} Agregar jugadores</button>`}
    </div>`;
  }
  const titulo = l.campeon ? "Campeón" : esKO() ? "Mejor récord" : "Líder";
  const stats = esKO() || l.campeon && esKO()
    ? `<div><b>${lider.g ?? 0}</b><span>Victorias</span></div><div><b>${lider.sf ?? 0}</b><span>Sets ganados</span></div>`
    : `<div><b>${lider.pts}</b><span>Puntos</span></div><div><b>${lider.g}-${lider.p}</b><span>Récord</span></div><div><b>${lider.ds > 0 ? "+" : ""}${lider.ds}</b><span>Dif. sets</span></div>`;
  return `<div class="leader">
    <div class="eyebrow">${I.trophy} ${titulo}</div>
    <div class="leader-name">${avatar(lider.nombre, "xl")}<div class="display">${esc(lider.nombre)}</div></div>
    <div class="leader-stats">${stats}</div>
  </div>`;
}

function rondaActual() {
  const l = S.liga;
  for (let r = 0; r < l.total_rondas; r++) {
    const de = l.partidos.filter((p) => p.ronda === r);
    if (de.some((p) => !terminado(p))) return r;
  }
  return null;
}

function montarPestana() {
  const el = $("#pestana");
  const fn = { tabla: pestanaTabla, partidos: pestanaPartidos, jugadores: pestanaJugadores, ajustes: pestanaAjustes }[S.tab];
  fn(el);
}

// ---------- Tabla
function pestanaTabla(el) {
  const l = S.liga;
  if (!l.generado) { el.innerHTML = vacioSinCalendario(); return; }
  if (esKO()) { el.innerHTML = cuadro(); return; }
  const filas = l.tabla;
  const chips = (r) => { const c = [...r]; while (c.length < 5) c.unshift(null); return c.map((x) => `<i class="${x || "n"}">${x || "·"}</i>`).join(""); };
  const mov = (m) => m == null ? "" : m > 0 ? `<span class="mov up">▲${m}</span>` : m < 0 ? `<span class="mov down">▼${-m}</span>` : `<span class="mov same">=</span>`;
  const dif = (n) => `<span class="${n > 0 ? "diff-pos" : n < 0 ? "diff-neg" : ""}">${n > 0 ? "+" : ""}${n}</span>`;
  const suizo = l.config.formato === "suizo";
  el.innerHTML = `
    ${suizo && l.puede_avanzar ? bannerSuizo() : ""}
    ${l.campeon ? `<div class="banner gold">${I.trophy}<span><b>${esc(nombreDe(l.campeon))}</b> es campeón de ${esc(l.nombre)}.</span></div>` : ""}
    <div class="panel" style="overflow:auto">
      <table class="standings">
        <thead><tr>
          <th>#</th><th class="left">Jugador</th>
          <th title="Partidos jugados">PJ</th><th title="Ganados">G</th><th title="Perdidos">P</th>
          <th class="hide-sm" title="Sets a favor">SF</th><th class="hide-sm" title="Sets en contra">SC</th><th title="Diferencia de sets">DS</th>
          <th class="hide-md" title="Puntos a favor">PF</th><th class="hide-md" title="Puntos en contra">PC</th>
          <th class="pts" title="Puntos de tabla">PTS</th><th class="hide-sm">Racha</th>
        </tr></thead>
        <tbody>
          ${filas.map((f) => `<tr class="p${f.pos}" data-action="ver-jugador" data-id="${f.id}">
            <td class="pos"><b>${f.pos}</b>${mov(f.mov)}</td>
            <td class="left"><div class="player-cell">${avatar(f.nombre)}<span class="nm">${esc(f.nombre)}</span>${l.campeon === f.id ? `<span class="champ" title="Campeón">${I.trophy}</span>` : ""}</div></td>
            <td>${f.pj}</td><td>${f.g}</td><td>${f.p}</td>
            <td class="hide-sm">${f.sf}</td><td class="hide-sm">${f.sc}</td><td>${dif(f.ds)}</td>
            <td class="hide-md">${f.pf}</td><td class="hide-md">${f.pc}</td>
            <td class="pts">${f.pts}</td>
            <td class="hide-sm"><span class="form">${chips(f.racha)}</span></td>
          </tr>`).join("")}
        </tbody>
      </table>
      <div class="legend">
        <span><i style="background:var(--gold)"></i>1.º</span><span><i style="background:var(--silver)"></i>2.º</span><span><i style="background:var(--bronze)"></i>3.º</span>
        <span>Victoria ${l.config.pts_victoria} pts · Derrota ${l.config.pts_derrota} pts${l.config.bonus_barrida ? ` · Bonus barrida +${l.config.bonus_barrida}` : ""}${l.config.bonus_derrota_ajustada ? ` · Derrota ajustada +${l.config.bonus_derrota_ajustada}` : ""}</span>
        <span>Desempate: ${l.config.desempate.map((c) => S.meta.criterios[c]).join(" › ")}</span>
      </div>
    </div>`;
}

function bannerSuizo() {
  return `<div class="banner">${I.info}<span>Ronda completa. Empareja la siguiente según la tabla actual.</span><span class="spacer"></span>
    <button class="btn btn-primary btn-sm" data-action="ronda-suizo">${I.bolt} Generar ronda ${rondaSiguienteNum()}</button></div>`;
}
const rondaSiguienteNum = () => Math.max(0, ...S.liga.partidos.map((p) => p.ronda + 1)) + 1;

function vacioSinCalendario() {
  const n = S.liga.jugadores.length;
  return `<div class="panel empty-state">${I.cal}
    <h3>${n < 2 ? "Faltan jugadores" : "Calendario sin generar"}</h3>
    <p>${n < 2 ? `Necesitas al menos 2 jugadores. Llevas ${n}.` : `Tienes ${n} jugadores listos. Genera los partidos con el formato elegido.`}</p>
    ${n < 2 ? `<button class="btn btn-primary" data-action="agregar-jugadores">${I.user} Agregar jugadores</button>` : `<button class="btn btn-primary" data-action="generar">${I.bolt} Generar partidos</button>`}
  </div>`;
}

function cuadro() {
  const l = S.liga;
  const cols = [];
  for (let r = 0; r < l.total_rondas; r++) {
    const ps = l.partidos.filter((p) => p.ronda === r).sort((a, b) => a.orden - b.orden);
    cols.push(`<div class="b-col"><h3>${esc(l.nombres_ronda[r])}</h3><div class="b-list">
      ${ps.map((p) => {
        const g = p.bye ? (p.a ? "a" : "b") : ganadorLado(p);
        const listo = p.a && p.b && !p.bye;
        const fila = (lado) => {
          const id = p[lado];
          const nm = id ? nombreDe(id) : p.bye ? "Pase directo" : "Por definir";
          const cls = !id ? "tbd" : g ? (g === lado ? "win" : "lose") : "";
          const sc = p.marcador ? p.marcador[lado === "a" ? 0 : 1] : "";
          return `<div class="row ${cls}">${avatar(id ? nm : null, "sm")}<span class="nm">${esc(nm)}</span><b>${sc}</b></div>`;
        };
        return `<button class="b-match" ${listo ? `data-action="resultado" data-id="${p.id}"` : "disabled"} title="${listo ? "Registrar o editar resultado" : ""}">${fila("a")}${fila("b")}</button>`;
      }).join("")}
    </div></div>`);
  }
  const campeon = l.campeon ? `<div class="champion">${I.trophy}<span class="eyebrow">Campeón</span>${avatar(nombreDe(l.campeon), "lg")}<div class="display">${esc(nombreDe(l.campeon))}</div></div>` : "";
  return `<div class="panel panel-pad"><div class="bracket-wrap"><div class="bracket">${cols.join("")}${campeon}</div></div></div>`;
}

// ---------- Partidos
function pestanaPartidos(el) {
  const l = S.liga;
  if (!l.generado) { el.innerHTML = vacioSinCalendario(); return; }
  const actual = rondaActual();
  if (!S.abiertas.size) S.abiertas.add(actual ?? l.total_rondas - 1);
  const pasa = (p) => {
    if (S.jugadorFiltro && p.a !== S.jugadorFiltro && p.b !== S.jugadorFiltro) return false;
    if (p.bye) return S.filtro === "todos" && !esKO();
    if (S.filtro === "pendientes") return !p.marcador;
    if (S.filtro === "jugados") return !!p.marcador;
    return true;
  };
  const filtrando = S.filtro !== "todos" || S.jugadorFiltro;
  const rondas = [];
  const maxRonda = Math.max(-1, ...l.partidos.map((p) => p.ronda));
  for (let r = 0; r <= maxRonda; r++) {
    const todos = l.partidos.filter((p) => p.ronda === r).sort((a, b) => a.orden - b.orden);
    const ps = todos.filter(pasa);
    if (!ps.length && filtrando) continue;
    const reales = todos.filter((p) => !p.bye);
    const hechos = reales.filter((p) => p.marcador).length;
    const abierta = filtrando || S.abiertas.has(r);
    let descanso = "";
    if (!esKO() && !filtrando) {
      const juegan = new Set(reales.flatMap((p) => [p.a, p.b]));
      const libres = l.jugadores.filter((j) => !juegan.has(j.id));
      if (libres.length && l.config.formato !== "suizo") descanso = `<div class="rest-note">${I.coffee} Descansa: ${libres.map((j) => esc(j.nombre)).join(", ")}</div>`;
    }
    rondas.push(`<div class="round ${abierta ? "open" : ""} ${r === actual ? "current" : ""}" data-ronda="${r}">
      <button class="round-head" data-action="ronda" data-r="${r}" aria-expanded="${abierta}">
        <span class="display">${esc(l.nombres_ronda[r] || `Ronda ${r + 1}`)}</span>
        <span class="rmeta">${hechos}/${reales.length} jugados</span>
        ${r === actual ? '<span class="live">EN JUEGO</span>' : hechos === reales.length && reales.length ? '<span class="done">COMPLETA</span>' : ""}
        ${I.chev.replace("<svg", '<svg class="chev"')}
      </button>
      <div class="round-body">${ps.map(tarjetaPartido).join("")}${descanso}</div>
    </div>`);
  }
  const avanzar = l.config.formato === "suizo" && l.puede_avanzar ? bannerSuizo() : "";
  el.innerHTML = `
    ${avanzar}
    <div class="toolbar">
      <div class="seg" role="group" aria-label="Filtrar partidos">
        ${[["todos", "Todos"], ["pendientes", "Pendientes"], ["jugados", "Jugados"]].map(([k, t]) => `<button class="${S.filtro === k ? "on" : ""}" data-action="filtro" data-f="${k}">${t}</button>`).join("")}
      </div>
      <select class="select" data-change="filtro-jugador" aria-label="Filtrar por jugador">
        <option value="">Todos los jugadores</option>
        ${l.jugadores.map((j) => `<option value="${j.id}" ${S.jugadorFiltro === j.id ? "selected" : ""}>${esc(j.nombre)}</option>`).join("")}
      </select>
      <span style="flex:1"></span>
      ${!filtrando ? `<button class="btn btn-ghost btn-sm" data-action="expandir">${S.abiertas.size > 1 ? "Contraer todo" : "Expandir todo"}</button>` : ""}
    </div>
    ${rondas.join("") || `<div class="panel empty-state">${I.check}<h3>Nada por aquí</h3><p>No hay partidos con ese filtro.</p></div>`}`;
}

function tarjetaPartido(p) {
  if (p.bye) {
    const id = p.a || p.b;
    return `<div class="match disabled"><div class="side a">${avatar(nombreDe(id))}<span class="nm">${esc(nombreDe(id))}</span></div>
      <div class="score vs">BYE</div><div class="side b"><span class="nm" style="color:var(--muted)">Descansa · suma victoria</span></div></div>`;
  }
  const g = ganadorLado(p);
  const listo = p.a && p.b;
  const lado = (k) => {
    const id = p[k];
    const nm = id ? nombreDe(id) : "Por definir";
    return `<div class="side ${k} ${g ? (g === k ? "win" : "lose") : ""}">${avatar(id ? nm : null)}<span class="nm">${esc(nm)}</span></div>`;
  };
  let centro, linea;
  if (p.marcador) {
    const [sa, sb] = p.marcador;
    centro = `<div class="score"><span class="${g === "a" ? "w" : "l"}">${sa}</span><i>-</i><span class="${g === "b" ? "w" : "l"}">${sb}</span></div>`;
    linea = p.wo ? `<span class="final wo">W.O.</span>` : `<span class="final">FINAL</span>${p.sets.length ? `<span>${p.sets.map((s) => s.join("-")).join(" · ")}</span>` : ""}`;
  } else {
    centro = `<div class="score vs">VS</div>`;
    linea = listo ? `<span class="cta">Registrar resultado ${I.arrow.replace("<svg", '<svg width="14" height="14"')}</span>` : `<span>Esperando rivales</span>`;
  }
  return `<button class="match ${p.marcador ? "played" : "pending"} ${listo ? "" : "disabled"}" ${listo ? `data-action="resultado" data-id="${p.id}"` : "disabled"}>
    ${lado("a")}${centro}${lado("b")}<div class="tagline">${linea}</div></button>`;
}

// ---------- Jugadores
function pestanaJugadores(el) {
  const l = S.liga;
  const pos = Object.fromEntries(l.tabla.map((f) => [f.id, f]));
  const aviso = avisoAltas();
  el.innerHTML = `
    <form class="quick-add" data-submit="alta-rapida" autocomplete="off">
      ${I.user.replace("<svg", '<svg class="ico"')}
      <input name="nombre" placeholder="Escribe un nombre y pulsa Enter… (puedes pegar varios separados por coma)" aria-label="Nombre del jugador" autofocus>
      <button class="btn btn-primary" type="submit">${I.plus}<span class="hide-sm">Agregar</span></button>
    </form>
    <p class="hint">${aviso}</p>
    ${l.jugadores.length ? `<div class="players">
      ${l.jugadores.map((j, i) => {
        const f = pos[j.id] || {};
        const rk = esKO() ? "" : f.pos;
        return `<div class="pcard" style="animation-delay:${Math.min(i, 12) * 25}ms" data-pid="${j.id}">
          <span class="rk">${rk || ""}</span>${avatar(j.nombre)}
          <div class="info"><div class="nm">${esc(j.nombre)}</div>
            <div class="rec">${f.pj ? `${f.g}G · ${f.p}P${esKO() ? "" : ` · ${f.pts} pts`}` : "Sin partidos jugados"}</div></div>
          <div class="acts">
            <button class="btn btn-ghost btn-icon btn-sm" data-action="renombrar" data-id="${j.id}" title="Renombrar">${I.edit}</button>
            <button class="btn btn-ghost btn-icon btn-sm btn-danger" data-action="quitar-jugador" data-id="${j.id}" title="Eliminar">${I.trash}</button>
          </div></div>`;
      }).join("")}</div>` : `<div class="panel empty-state">${I.users}<h3>Sin jugadores</h3><p>Escribe arriba el primer nombre. Con 2 ya puedes generar partidos.</p></div>`}`;
}

function avisoAltas() {
  const l = S.liga;
  if (!l.generado) return l.jugadores.length >= 1 ? "Al llegar a 2 jugadores se genera el calendario automáticamente." : "Agrega al menos 2 jugadores para empezar.";
  return {
    rr1: "Al sumar a alguien se agregan sus partidos y se conservan los resultados ya cargados.",
    rr2: "Al sumar a alguien se agregan sus partidos de ida y vuelta; se conservan los resultados ya cargados.",
    ko: "Ojo: en eliminación directa, sumar o quitar jugadores rehace el cuadro y borra sus resultados.",
    suizo: "En suizo, quien se suma entra desde la próxima ronda.",
  }[l.config.formato];
}

// ---------- Ajustes
function pestanaAjustes(el) {
  const l = S.liga;
  if (!S.borrador) S.borrador = structuredClone(l.config);
  const b = S.borrador;
  const cambios = JSON.stringify(b) !== JSON.stringify(l.config);
  const regenera = l.generado && (b.formato !== l.config.formato || b.mejor_de !== l.config.mejor_de || b.puntos_set !== l.config.puntos_set);
  el.innerHTML = `
    <div class="stack">
      <div class="panel panel-pad">
        <div class="field"><label for="nombre-liga">Nombre de la liga</label>
          <input id="nombre-liga" class="input big" value="${esc(l.nombre)}" data-change="nombre-liga" maxlength="60"></div>
      </div>
      <div class="panel panel-pad">
        <h3 class="section-title">Formato</h3>
        <div id="cfg-formatos"></div>
      </div>
      <div class="panel panel-pad">
        <h3 class="section-title">Reglas y puntuación</h3>
        <div id="cfg-reglas"></div>
      </div>
      <div class="panel panel-pad danger-zone">
        <h3 class="section-title">Herramientas</h3>
        <div class="rule-row"><div class="lbl">Regenerar calendario<small>Rehace todos los cruces${l.config.sorteo ? " con un nuevo sorteo" : ""}. Se pierden los resultados.</small></div>
          <button class="btn" data-action="regenerar">${I.refresh} Regenerar</button></div>
        <div class="rule-row"><div class="lbl">Exportar datos<small>Descarga la liga completa en JSON.</small></div>
          <button class="btn" data-action="exportar">${I.download} Exportar</button></div>
        <div class="rule-row"><div class="lbl">Eliminar liga<small>No se puede deshacer.</small></div>
          <button class="btn btn-danger" data-action="eliminar-liga">${I.trash} Eliminar</button></div>
      </div>
    </div>
    ${cambios ? `<div class="save-bar"><span>${regenera ? "⚠ Cambiar formato, sets o puntos por set regenera el calendario y borra los resultados." : "Tienes cambios sin guardar. La tabla se recalcula al guardar."}</span>
      <button class="btn btn-ghost" data-action="descartar" style="color:#fff">Descartar</button>
      <button class="btn btn-primary" data-action="guardar-ajustes">${I.check} Guardar</button></div>` : ""}`;
  montarFormatos($("#cfg-formatos"), b, l.jugadores.length, () => pestanaAjustes(el));
  montarReglas($("#cfg-reglas"), b, () => pestanaAjustes(el));
}

// ---------------------------------------------------------------- componentes de configuración
function calcFormato(fmt, n, cfg) {
  if (n < 2) return "Necesita al menos 2 jugadores";
  const par = n % 2 === 0;
  switch (fmt) {
    case "rr2": return `${n * (n - 1)} partidos en ${2 * (par ? n - 1 : n)} jornadas`;
    case "rr1": return `${(n * (n - 1)) / 2} partidos en ${par ? n - 1 : n} jornadas`;
    case "ko": { const r = Math.ceil(Math.log2(n)); return `${n - 1} partidos en ${r} rondas`; }
    case "suizo": { const r = cfg.rondas_suizo || Math.max(1, Math.ceil(Math.log2(n))); return `${r} rondas · ${Math.floor(n / 2) * r} partidos`; }
  }
}

function montarFormatos(cont, cfg, n, alCambiar) {
  const desc = {
    rr2: "Cada jugador enfrenta a todos dos veces. La más justa.",
    rr1: "Cada jugador enfrenta a todos una vez. Más corta.",
    ko: "Pierdes y quedas fuera. Cuadro con cabezas de serie.",
    suizo: "Rondas emparejando por tabla, sin revanchas.",
  };
  cont.innerHTML = `<div class="formats">
    ${Object.entries(S.meta.formatos).map(([k, nombre]) => `<button type="button" class="fmt ${cfg.formato === k ? "on" : ""}" data-fmt="${k}" aria-pressed="${cfg.formato === k}">
      <span class="ill">${I[k]}</span>
      <span><h4>${esc(nombre.replace("Todos contra todos · ", "Liga · "))}</h4><p>${desc[k]}</p><div class="calc">${calcFormato(k, n, cfg)}</div></span>
      ${k === "rr2" ? '<span class="badge tagd">Por defecto</span>' : ""}
      <span class="check">${I.check}</span>
    </button>`).join("")}
  </div>
  <div class="rule-card" style="margin-top:14px">
    <div class="rule-row"><div class="lbl">Sortear el orden<small>Mezcla jugadores al generar (cabezas de serie, localía y cruces).</small></div>
      <button type="button" class="switch ${cfg.sorteo ? "on" : ""}" data-toggle="sorteo" aria-pressed="${cfg.sorteo}" aria-label="Sortear"></button></div>
    ${cfg.formato === "suizo" ? `<div class="rule-row"><div class="lbl">Rondas del suizo<small>0 = automático (${Math.max(1, Math.ceil(Math.log2(Math.max(2, n))))} para ${n} jugadores)</small></div>${stepper("rondas_suizo", cfg.rondas_suizo, 0, 20)}</div>` : ""}
  </div>`;
  cont.onclick = (e) => {
    const f = e.target.closest("[data-fmt]");
    if (f) { cfg.formato = f.dataset.fmt; alCambiar(); return; }
    const t = e.target.closest("[data-toggle]");
    if (t) { cfg[t.dataset.toggle] = !cfg[t.dataset.toggle]; alCambiar(); return; }
    manejarStepper(e, cfg, alCambiar);
  };
  cont.onchange = (e) => manejarStepperInput(e, cfg, alCambiar);
}

function stepper(clave, valor, min, max) {
  return `<span class="stepper" data-stepper="${clave}" data-min="${min}" data-max="${max}">
    <button type="button" data-delta="-1" aria-label="Restar">−</button>
    <input type="number" value="${valor}" min="${min}" max="${max}" aria-label="${clave}">
    <button type="button" data-delta="1" aria-label="Sumar">+</button></span>`;
}
function manejarStepper(e, cfg, alCambiar) {
  const btn = e.target.closest("[data-delta]");
  if (!btn) return false;
  const st = btn.closest("[data-stepper]");
  const k = st.dataset.stepper;
  cfg[k] = Math.min(+st.dataset.max, Math.max(+st.dataset.min, (+cfg[k] || 0) + +btn.dataset.delta));
  alCambiar();
  return true;
}
function manejarStepperInput(e, cfg, alCambiar) {
  const st = e.target.closest("[data-stepper]");
  if (!st) return;
  const v = parseInt(e.target.value, 10);
  cfg[st.dataset.stepper] = Number.isNaN(v) ? 0 : Math.min(+st.dataset.max, Math.max(+st.dataset.min, v));
  alCambiar();
}

const PRESETS = {
  clasico: { nombre: "Clásico 3·0", v: { pts_victoria: 3, pts_derrota: 0, pts_wo_ganador: 3, pts_wo_perdedor: 0, bonus_barrida: 0, bonus_derrota_ajustada: 0 } },
  ittf: { nombre: "Estilo ITTF 2·1", v: { pts_victoria: 2, pts_derrota: 1, pts_wo_ganador: 2, pts_wo_perdedor: 0, bonus_barrida: 0, bonus_derrota_ajustada: 0 } },
  bonus: { nombre: "Con bonus", v: { pts_victoria: 3, pts_derrota: 0, pts_wo_ganador: 3, pts_wo_perdedor: 0, bonus_barrida: 1, bonus_derrota_ajustada: 1 } },
  simple: { nombre: "1 por victoria", v: { pts_victoria: 1, pts_derrota: 0, pts_wo_ganador: 1, pts_wo_perdedor: 0, bonus_barrida: 0, bonus_derrota_ajustada: 0 } },
};
const presetActivo = (cfg) => Object.keys(PRESETS).find((k) => Object.entries(PRESETS[k].v).every(([c, v]) => cfg[c] === v));

function montarReglas(cont, cfg, alCambiar) {
  const pre = presetActivo(cfg);
  const necesarios = Math.floor(cfg.mejor_de / 2) + 1;
  const ej = [];
  ej.push(`Ganar ${necesarios}-0 <b>${cfg.pts_victoria + cfg.bonus_barrida} pts</b>`);
  if (necesarios > 1) ej.push(`Ganar ${necesarios}-${necesarios - 1} <b>${cfg.pts_victoria} pts</b>`);
  if (necesarios > 1) ej.push(`Perder ${necesarios - 1}-${necesarios} <b>${cfg.pts_derrota + cfg.bonus_derrota_ajustada} pts</b>`);
  ej.push(`W.O. <b>${cfg.pts_wo_ganador}/${cfg.pts_wo_perdedor} pts</b>`);
  const todos = Object.keys(S.meta.criterios);
  const activos = cfg.desempate;
  const inactivos = todos.filter((c) => !activos.includes(c));
  cont.innerHTML = `<div class="rules">
    <div class="rule-card">
      <h4>${I.score} Partido</h4>
      <div class="rule-row"><div class="lbl">Al mejor de<small>Gana quien llega a ${necesarios} ${necesarios === 1 ? "set" : "sets"}</small></div>
        <div class="seg">${[1, 3, 5, 7].map((n) => `<button type="button" class="${cfg.mejor_de === n ? "on" : ""}" data-set="mejor_de" data-v="${n}">${n}</button>`).join("")}</div></div>
      <div class="rule-row"><div class="lbl">Puntos por set<small>Con empate al final, se gana por 2</small></div>
        <div style="display:flex;gap:8px;align-items:center"><div class="seg">${[11, 21].map((n) => `<button type="button" class="${cfg.puntos_set === n ? "on" : ""}" data-set="puntos_set" data-v="${n}">${n}</button>`).join("")}</div>${![11, 21].includes(cfg.puntos_set) ? stepper("puntos_set", cfg.puntos_set, 3, 50) : `<button type="button" class="btn btn-ghost btn-sm" data-set="puntos_set" data-v="15">Otro</button>`}</div></div>
      <div class="rule-row"><div class="lbl">Cargar marcador<small>${cfg.marcador === "detallado" ? "Punto a punto de cada set (más estadísticas)" : "Solo sets ganados (más rápido)"}</small></div>
        <div class="seg"><button type="button" class="${cfg.marcador === "detallado" ? "on" : ""}" data-set="marcador" data-v="detallado">Por set</button><button type="button" class="${cfg.marcador === "sets" ? "on" : ""}" data-set="marcador" data-v="sets">Solo sets</button></div></div>
    </div>
    <div class="rule-card">
      <h4>${I.trophy} Puntos de tabla</h4>
      <div class="presets">${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="preset ${pre === k ? "on" : ""}" data-preset="${k}">${p.nombre}</button>`).join("")}<button type="button" class="preset ${pre ? "" : "on"}" disabled>Personalizado</button></div>
      <div class="rule-row"><div class="lbl">Victoria</div>${stepper("pts_victoria", cfg.pts_victoria, -10, 20)}</div>
      <div class="rule-row"><div class="lbl">Derrota</div>${stepper("pts_derrota", cfg.pts_derrota, -10, 20)}</div>
      <div class="rule-row"><div class="lbl">W.O. ganador / perdedor<small>No presentarse</small></div><div style="display:flex;gap:6px">${stepper("pts_wo_ganador", cfg.pts_wo_ganador, -10, 20)}${stepper("pts_wo_perdedor", cfg.pts_wo_perdedor, -10, 20)}</div></div>
      <div class="rule-row"><div class="lbl">Bonus por barrida<small>Ganar sin ceder sets</small></div>${stepper("bonus_barrida", cfg.bonus_barrida, 0, 10)}</div>
      <div class="rule-row"><div class="lbl">Bonus derrota ajustada<small>Perder por un solo set</small></div>${stepper("bonus_derrota_ajustada", cfg.bonus_derrota_ajustada, 0, 10)}</div>
      <div class="example">${ej.join("")}</div>
    </div>
    <div class="rule-card" style="grid-column:1/-1">
      <h4>${I.table} Orden de desempate</h4>
      <ol class="tiebreak">
        ${activos.map((c, i) => `<li><span>${esc(S.meta.criterios[c])}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-tb="up" data-c="${c}" ${i === 0 ? "disabled" : ""} aria-label="Subir">${I.up}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-tb="down" data-c="${c}" ${i === activos.length - 1 ? "disabled" : ""} aria-label="Bajar">${I.down}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-tb="off" data-c="${c}" ${activos.length === 1 ? "disabled" : ""} aria-label="Quitar">${I.x}</button></li>`).join("")}
        ${inactivos.map((c) => `<li class="off"><span>${esc(S.meta.criterios[c])}</span><button type="button" class="btn btn-ghost btn-sm" data-tb="on" data-c="${c}" aria-label="Agregar">${I.plus}</button></li>`).join("")}
      </ol>
    </div>
  </div>`;
  cont.onclick = (e) => {
    const s = e.target.closest("[data-set]");
    if (s) { const v = s.dataset.v; cfg[s.dataset.set] = /^\d+$/.test(v) ? +v : v; alCambiar(); return; }
    const p = e.target.closest("[data-preset]");
    if (p) { Object.assign(cfg, PRESETS[p.dataset.preset].v); alCambiar(); return; }
    const t = e.target.closest("[data-tb]");
    if (t) {
      const c = t.dataset.c, lista = cfg.desempate, i = lista.indexOf(c);
      if (t.dataset.tb === "up") [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]];
      if (t.dataset.tb === "down") [lista[i + 1], lista[i]] = [lista[i], lista[i + 1]];
      if (t.dataset.tb === "off") lista.splice(i, 1);
      if (t.dataset.tb === "on") lista.push(c);
      alCambiar(); return;
    }
    manejarStepper(e, cfg, alCambiar);
  };
  cont.onchange = (e) => manejarStepperInput(e, cfg, alCambiar);
}

// ---------------------------------------------------------------- asistente de nueva liga
function asistente() {
  const W = { paso: 1, nombre: "", jugadores: [], config: structuredClone(S.meta.config) };
  const pasos = ["Liga y jugadores", "Formato", "Reglas"];
  const dibujar = (modal) => {
    const n = W.jugadores.length;
    modal.innerHTML = `
      <div class="modal-head">
        <div class="steps">${pasos.map((t, i) => `<div class="step ${W.paso === i + 1 ? "on" : W.paso > i + 1 ? "ok" : ""}"><i>${W.paso > i + 1 ? "✓" : i + 1}</i><span>${t}</span></div>`).join("")}</div>
        <span style="flex:1"></span>
        <button class="btn btn-ghost btn-icon" data-cerrar aria-label="Cerrar">${I.x}</button>
      </div>
      <div class="modal-body" id="w-body"></div>
      <div class="modal-foot">
        ${W.paso > 1 ? `<button class="btn btn-ghost" data-atras>Atrás</button>` : ""}
        <span class="spacer"></span>
        <span class="muted">${plural(n, "jugador", "jugadores")}${n >= 2 ? " · " + calcFormato(W.config.formato, n, W.config) : ""}</span>
        ${W.paso < 3 ? `<button class="btn btn-primary" data-siguiente>Siguiente ${I.arrow}</button>` : `<button class="btn btn-primary" data-crear>${I.bolt} Crear liga</button>`}
        ${W.paso === 1 ? `<button class="btn" data-rapido title="Crear con todos contra todos, ida y vuelta">Crear ya</button>` : ""}
      </div>`;
    const body = $("#w-body", modal);
    if (W.paso === 1) {
      body.innerHTML = `
        <div class="field"><label for="w-nombre">Nombre de la liga</label>
          <input id="w-nombre" class="input big" placeholder="Liga de la oficina" value="${esc(W.nombre)}" maxlength="60" autofocus></div>
        <div class="field"><span class="label">Jugadores</span><div id="w-chips"></div>
          <span class="hint" style="margin:0">Enter para agregar · pega una lista separada por comas o renglones · Retroceso borra el último</span></div>`;
      const nombre = $("#w-nombre", body);
      nombre.oninput = () => { W.nombre = nombre.value; };
      nombre.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); $("#w-chips input", body).focus(); } };
      chipsInput($("#w-chips", body), W.jugadores, () => {
        $(".modal-foot .muted", modal).textContent = plural(W.jugadores.length, "jugador", "jugadores") + (W.jugadores.length >= 2 ? " · " + calcFormato(W.config.formato, W.jugadores.length, W.config) : "");
      });
      setTimeout(() => (W.nombre ? $("#w-chips input", body) : nombre).focus(), 30);
    } else if (W.paso === 2) {
      montarFormatos(body, W.config, n, () => dibujar(modal));
    } else {
      montarReglas(body, W.config, () => { const y = body.scrollTop; dibujar(modal); $("#w-body", modal).scrollTop = y; });
    }
    modal.querySelector("[data-cerrar]").onclick = cerrarModal;
    modal.querySelector("[data-atras]")?.addEventListener("click", () => { W.paso--; dibujar(modal); });
    modal.querySelector("[data-siguiente]")?.addEventListener("click", () => { if (validarPaso1(modal)) { W.paso++; dibujar(modal); } });
    modal.querySelector("[data-crear]")?.addEventListener("click", () => crear());
    modal.querySelector("[data-rapido]")?.addEventListener("click", () => { if (validarPaso1(modal)) crear(); });
  };
  const validarPaso1 = (modal) => {
    if (W.paso !== 1) return true;
    const pendiente = $("#w-chips input", modal)?.value.trim();
    if (pendiente) { W.jugadores.push(...partirNombres(pendiente).filter((x) => !W.jugadores.some((y) => y.toLowerCase() === x.toLowerCase()))); }
    if (!W.nombre.trim()) { toast("Ponle nombre a la liga.", { error: true }); $("#w-nombre", modal).focus(); return false; }
    return true;
  };
  const crear = async () => {
    try {
      const vista = await api("POST", "/api/ligas", { nombre: W.nombre, jugadores: W.jugadores, config: W.config });
      cerrarModal();
      S.tab = vista.generado ? "partidos" : "jugadores";
      await refrescarLista();
      await abrirLiga(vista.id);
      toast(vista.generado ? `Liga creada · ${vista.total_partidos} partidos generados` : "Liga creada · agrega jugadores para generar el calendario");
    } catch (e) { fallo(e); }
  };
  abrirModal("", { ancho: true, alMontar: dibujar });
}

const partirNombres = (txt) => txt.split(/[\n,;]+/).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);

function chipsInput(cont, lista, alCambiar) {
  const dibujar = () => {
    cont.innerHTML = `<div class="chips-input">
      ${lista.map((n, i) => `<span class="chip">${avatar(n)}${esc(n)}<button type="button" data-i="${i}" aria-label="Quitar ${esc(n)}">${I.x}</button></span>`).join("")}
      <input placeholder="${lista.length ? "Otro jugador…" : "Nombre del primer jugador…"}" aria-label="Agregar jugador">
    </div>`;
    const input = $("input", cont);
    const agregar = (txt) => {
      let nuevos = 0;
      for (const n of partirNombres(txt)) {
        if (!lista.some((x) => x.toLowerCase() === n.toLowerCase())) { lista.push(n.slice(0, 40)); nuevos++; }
        else toast(`«${n}» ya está en la lista.`, { error: true, ms: 2200 });
      }
      if (nuevos) { dibujar(); alCambiar(); $("input", cont).focus(); }
    };
    input.onkeydown = (e) => {
      if ((e.key === "Enter" || e.key === ",") && input.value.trim()) { e.preventDefault(); agregar(input.value); }
      else if (e.key === "Enter") e.preventDefault();
      else if (e.key === "Backspace" && !input.value && lista.length) { lista.pop(); dibujar(); alCambiar(); $("input", cont).focus(); }
    };
    input.onpaste = (e) => {
      const t = e.clipboardData.getData("text");
      if (/[\n,;]/.test(t)) { e.preventDefault(); agregar(t); }
    };
    cont.querySelector(".chips-input").onclick = (e) => {
      const b = e.target.closest("[data-i]");
      if (b) { lista.splice(+b.dataset.i, 1); dibujar(); alCambiar(); }
      $("input", cont).focus();
    };
  };
  dibujar();
}

// ---------------------------------------------------------------- agregar jugadores (modal rápido)
function modalJugadores() {
  const l = S.liga;
  const lista = [];
  const generarAuto = !l.generado;
  abrirModal(`
    <div class="modal-head"><h2>Agregar jugadores</h2><button class="btn btn-ghost btn-icon" data-cerrar aria-label="Cerrar">${I.x}</button></div>
    <div class="modal-body">
      <div id="m-chips"></div>
      <div class="warn">${I.info}<span>${avisoAltas()}</span></div>
    </div>
    <div class="modal-foot"><span class="muted" id="m-count">Ya hay ${plural(l.jugadores.length, "jugador", "jugadores")}</span><span class="spacer"></span>
      <button class="btn btn-ghost" data-cerrar>Cancelar</button>
      <button class="btn btn-primary" data-ok disabled>${I.plus} Agregar</button></div>`, {
    alMontar: (m) => {
      const ok = m.querySelector("[data-ok]");
      const refrescar = () => {
        ok.disabled = !lista.length && !$("#m-chips input", m)?.value.trim();
        ok.innerHTML = `${I.plus} Agregar${lista.length ? " " + lista.length : ""}`;
      };
      chipsInput($("#m-chips", m), lista, refrescar);
      m.addEventListener("input", refrescar);
      $$("[data-cerrar]", m).forEach((b) => (b.onclick = cerrarModal));
      ok.onclick = async () => {
        const pendiente = $("#m-chips input", m).value.trim();
        if (pendiente) lista.push(...partirNombres(pendiente));
        if (!lista.length) return;
        try {
          const vista = await api("POST", `/api/ligas/${l.id}/jugadores`, { nombres: lista, generar: generarAuto });
          cerrarModal();
          const antes = S.liga.jugadores.length;
          actualizar(vista);
          toast(`${plural(vista.jugadores.length - antes, "jugador agregado", "jugadores agregados")}${!l.generado && vista.generado ? " · calendario generado" : ""}`);
        } catch (e) { fallo(e); }
      };
      setTimeout(() => $("#m-chips input", m).focus(), 40);
    },
  });
}

// ---------------------------------------------------------------- resultado
function siguientePendiente(despuesDe) {
  const l = S.liga;
  const pend = l.partidos.filter((p) => !p.bye && !p.marcador && p.a && p.b).sort((a, b) => a.ronda - b.ronda || a.orden - b.orden);
  if (!despuesDe) return pend[0];
  const ref = l.partidos.find((p) => p.id === despuesDe);
  return pend.find((p) => ref && (p.ronda > ref.ronda || (p.ronda === ref.ronda && p.orden > ref.orden))) || pend[0];
}

function validarSet(x, y, meta) {
  if (x === "" || y === "" || x == null || y == null) return null;
  x = +x; y = +y;
  if (x < 0 || y < 0) return "Sin negativos";
  const alto = Math.max(x, y), bajo = Math.min(x, y);
  if (alto < meta) return `Se gana llegando a ${meta}`;
  if (bajo >= meta - 1) { if (alto - bajo !== 2) return `Desde ${meta - 1} iguales se gana por 2`; }
  else if (alto !== meta) return `Termina en ${meta}`;
  return "";
}

function modalResultado(mid) {
  const l = S.liga;
  const p = l.partidos.find((x) => x.id === mid);
  if (!p) return;
  const cfg = l.config;
  const nec = Math.floor(cfg.mejor_de / 2) + 1;
  const na = nombreDe(p.a), nb = nombreDe(p.b);
  const R = {
    modo: p.marcador && !p.sets.length && !p.wo ? "sets" : p.sets.length ? "detallado" : cfg.marcador,
    sets: Array.from({ length: cfg.mejor_de }, (_, i) => p.sets[i] ? [String(p.sets[i][0]), String(p.sets[i][1])] : ["", ""]),
    marcador: p.marcador && !p.wo ? [...p.marcador] : null,
  };
  const quedan = l.partidos.filter((x) => !x.bye && !x.marcador && x.a && x.b && x.id !== p.id).length;

  const estado = () => {
    let ga = 0, gb = 0, error = "", decidido = false, completas = true;
    const filas = R.sets.map(([x, y], i) => {
      if (decidido) return { idle: true, extra: x !== "" || y !== "" };
      const v = validarSet(x, y, cfg.puntos_set);
      if (v === null) { completas = false; return { v: null }; }
      if (v) { error ||= `Set ${i + 1}: ${v}`; return { v }; }
      if (+x > +y) ga++; else gb++;
      if (ga === nec || gb === nec) decidido = true;
      return { v: "", win: +x > +y ? "a" : "b" };
    });
    if (R.modo === "sets") {
      const m = R.marcador;
      return { ga: m ? m[0] : 0, gb: m ? m[1] : 0, listo: !!m, filas, error: "" };
    }
    return { ga, gb, listo: decidido && !error, filas, error, completas };
  };

  const dibujarCuerpo = (modal) => {
    const e = estado();
    const lead = e.ga > e.gb ? "a" : e.gb > e.ga ? "b" : "";
    $("#r-board", modal).innerHTML = `
      <div class="who ${lead === "a" ? "lead" : lead ? "trail" : ""}">${avatar(na, "lg")}<span class="display">${esc(na)}</span></div>
      <div class="big"><span class="${lead === "a" ? "lead" : ""}">${e.ga}</span><i>:</i><span class="${lead === "b" ? "lead" : ""}">${e.gb}</span></div>
      <div class="who ${lead === "b" ? "lead" : lead ? "trail" : ""}">${avatar(nb, "lg")}<span class="display">${esc(nb)}</span></div>
      <div class="mini ${e.listo ? "ok" : ""}">${e.listo ? `✓ Gana ${esc(e.ga > e.gb ? na : nb)}` : R.modo === "sets" ? "Elige el marcador final" : `Primero a ${nec} ${nec === 1 ? "set" : "sets"}`}</div>`;
    const zona = $("#r-zona", modal);
    if (R.modo === "detallado") {
      if (!zona.querySelector(".sets")) {
        zona.innerHTML = `<div class="sets">${R.sets.map((s, i) => `
          <div class="set-row" data-i="${i}"><span class="sl">Set ${i + 1}</span>
            <input type="number" inputmode="numeric" min="0" max="99" data-i="${i}" data-k="0" value="${s[0]}" aria-label="Set ${i + 1} ${esc(na)}">
            <span class="dash">–</span>
            <input type="number" inputmode="numeric" min="0" max="99" data-i="${i}" data-k="1" value="${s[1]}" aria-label="Set ${i + 1} ${esc(nb)}">
            <span class="st"></span></div>`).join("")}</div><p class="set-err" id="r-err"></p>`;
      }
      e.filas.forEach((f, i) => {
        const row = zona.querySelector(`.set-row[data-i="${i}"]`);
        row.classList.toggle("idle", !!f.idle);
        const [ia, ib] = row.querySelectorAll("input");
        ia.classList.toggle("win", f.win === "a"); ib.classList.toggle("win", f.win === "b");
        ia.tabIndex = ib.tabIndex = f.idle ? -1 : 0;
        const st = row.querySelector(".st");
        st.className = "st " + (f.v === "" ? "ok" : f.v ? "bad" : "");
        st.innerHTML = f.v === "" ? I.check : f.v ? I.alert : "";
        st.title = f.v || "";
      });
      $("#r-err", zona).textContent = e.error;
    } else {
      const opciones = (lado) => Array.from({ length: nec }, (_, k) => lado === "a" ? [nec, k] : [k, nec]);
      zona.innerHTML = `<div class="quick-scores">
        ${["a", "b"].map((lado) => `<div class="col"><span class="label">Gana ${esc(lado === "a" ? na : nb)}</span>
          ${opciones(lado).map(([x, y]) => `<button type="button" class="qs ${R.marcador && R.marcador[0] === x && R.marcador[1] === y ? "on" : ""}" data-qs="${x}-${y}">${x} – ${y}</button>`).join("")}</div>`).join("")}
      </div>`;
    }
    const btn = $("[data-guardar]", modal), btn2 = $("[data-guardar-sig]", modal);
    btn.disabled = !e.listo; if (btn2) btn2.disabled = !e.listo;
  };

  const enviar = async (datos, siguiente) => {
    try {
      const vista = await api("PUT", `/api/ligas/${l.id}/partidos/${p.id}`, datos);
      const r = vista.partidos.find((x) => x.id === p.id);
      cerrarModal();
      actualizar(vista);
      const g = ganadorLado(r);
      toast(`${g === "a" ? na : nb} gana ${Math.max(...r.marcador)}–${Math.min(...r.marcador)}${r.wo ? " por W.O." : ""}`);
      resaltar(p.id);
      if (vista.campeon && !l.campeon) setTimeout(() => toast(`🏆 ${nombreDe(vista.campeon)} es campeón`, { ms: 6000 }), 400);
      if (siguiente) { const s = siguientePendiente(p.id); if (s) setTimeout(() => modalResultado(s.id), 120); }
    } catch (e) { fallo(e); }
  };
  const datosActuales = () => {
    if (R.modo === "sets") return { marcador: R.marcador };
    const e = estado();
    const cuantos = e.filas.findIndex((f) => f.idle);
    return { sets: R.sets.slice(0, cuantos === -1 ? R.sets.length : cuantos).map(([x, y]) => [+x, +y]) };
  };

  abrirModal(`
    <div class="modal-head">
      <div style="flex:1;min-width:0"><div class="eyebrow">${esc(l.nombres_ronda[p.ronda] || "")} · al mejor de ${cfg.mejor_de} · sets a ${cfg.puntos_set}</div>
        <h2 style="margin-top:2px">Resultado</h2></div>
      <div class="seg"><button type="button" data-modo="detallado" class="${R.modo === "detallado" ? "on" : ""}">Por set</button><button type="button" data-modo="sets" class="${R.modo === "sets" ? "on" : ""}">Solo sets</button></div>
      <button class="btn btn-ghost btn-icon" data-cerrar aria-label="Cerrar">${I.x}</button>
    </div>
    <div class="modal-body">
      <div class="board" id="r-board"></div>
      <div id="r-zona"></div>
      <div class="wo-row">No se presentó:
        <button type="button" class="btn btn-sm" data-wo="b">W.O. a favor de ${esc(na)}</button>
        <button type="button" class="btn btn-sm" data-wo="a">W.O. a favor de ${esc(nb)}</button>
      </div>
    </div>
    <div class="modal-foot">
      ${p.marcador ? `<button class="btn btn-ghost btn-danger" data-borrar>${I.trash} Borrar resultado</button>` : ""}
      <span class="spacer"></span>
      ${quedan ? `<button class="btn" data-guardar-sig title="Guardar y abrir el siguiente pendiente (Shift+Enter)">Guardar y siguiente</button>` : ""}
      <button class="btn btn-primary" data-guardar title="Enter">${I.check} Guardar</button>
    </div>`, {
    alMontar: (m) => {
      m.classList.add("result-modal");
      dibujarCuerpo(m);
      $$("[data-cerrar]", m).forEach((b) => (b.onclick = cerrarModal));
      m.querySelectorAll("[data-modo]").forEach((b) => b.onclick = () => {
        R.modo = b.dataset.modo;
        m.querySelectorAll("[data-modo]").forEach((x) => x.classList.toggle("on", x === b));
        $("#r-zona", m).innerHTML = "";
        dibujarCuerpo(m);
        if (R.modo === "detallado") $("#r-zona input", m)?.focus();
      });
      m.addEventListener("input", (e) => {
        const inp = e.target.closest("input[data-i]");
        if (!inp) return;
        R.sets[+inp.dataset.i][+inp.dataset.k] = inp.value.replace(/\D/g, "").slice(0, 2);
        dibujarCuerpo(m);
        // salto automático: tras completar un set válido, enfoca el siguiente
        const i = +inp.dataset.i, [x, y] = R.sets[i];
        const puedeCrecer = y.length < 2 && [...Array(10).keys()].some((d) => validarSet(x, y + d, cfg.puntos_set) === "");
        if (inp.dataset.k === "1" && validarSet(x, y, cfg.puntos_set) === "" && !puedeCrecer) {
          const sig = m.querySelector(`input[data-i="${i + 1}"][data-k="0"]`);
          if (sig && sig.tabIndex !== -1 && !R.sets[i + 1][0]) sig.focus();
        }
      });
      m.addEventListener("click", (e) => {
        const q = e.target.closest("[data-qs]");
        if (q) { R.marcador = q.dataset.qs.split("-").map(Number); dibujarCuerpo(m); return; }
        const w = e.target.closest("[data-wo]");
        if (w) { enviar({ wo: w.dataset.wo === "a" ? "b" : "a" }); return; }
      });
      $("[data-guardar]", m).onclick = () => enviar(datosActuales(), false);
      $("[data-guardar-sig]", m)?.addEventListener("click", () => enviar(datosActuales(), true));
      $("[data-borrar]", m)?.addEventListener("click", async () => {
        try {
          const vista = await api("DELETE", `/api/ligas/${l.id}/partidos/${p.id}`);
          cerrarModal(); actualizar(vista); toast("Resultado borrado");
        } catch (e) { fallo(e); }
      });
      m.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.target.closest("button")) {
          e.preventDefault();
          const b = e.shiftKey ? $("[data-guardar-sig]", m) : $("[data-guardar]", m);
          if (b && !b.disabled) b.click();
        }
      });
      setTimeout(() => {
        const primero = R.modo === "detallado" ? m.querySelector('input[data-i]:not([tabindex="-1"])') : m.querySelector(".qs");
        primero?.focus();
      }, 40);
    },
  });
}

function resaltar(mid) {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-id="${mid}"].match, [data-id="${mid}"].b-match`);
    if (el) { el.classList.add("flash"); }
  });
}

// ---------------------------------------------------------------- jugador (ficha rápida)
function fichaJugador(pid) {
  const l = S.liga;
  const f = l.tabla.find((x) => x.id === pid);
  const ps = l.partidos.filter((p) => !p.bye && (p.a === pid || p.b === pid)).sort((a, b) => a.ronda - b.ronda);
  abrirModal(`
    <div class="modal-head">${avatar(f.nombre, "lg")}<div style="flex:1;min-width:0"><div class="eyebrow">${esKO() ? "Jugador" : `${f.pos}.º en la tabla`}</div><h2>${esc(f.nombre)}</h2></div>
      <button class="btn btn-ghost btn-icon" data-cerrar aria-label="Cerrar">${I.x}</button></div>
    <div class="modal-body">
      <div class="kpis" style="margin:0">
        <div class="kpi"><b>${f.pts}</b><span>Puntos</span></div><div class="kpi"><b>${f.g}-${f.p}</b><span>Récord</span></div>
        <div class="kpi"><b>${f.sf}-${f.sc}</b><span>Sets</span></div><div class="kpi"><b>${f.pj ? Math.round((f.g / f.pj) * 100) : 0}%</b><span>Victorias</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">${ps.map(tarjetaPartido).join("") || '<p style="color:var(--muted)">Sin partidos.</p>'}</div>
    </div>`, {
    ancho: true,
    alMontar: (m) => {
      m.querySelector("[data-cerrar]").onclick = cerrarModal;
      m.addEventListener("click", (e) => { const b = e.target.closest('[data-action="resultado"]'); if (b) { e.stopPropagation(); modalResultado(b.dataset.id); } });
    },
  });
}

// ---------------------------------------------------------------- acciones (delegación)
const acciones = {
  inicio: (el, e) => { e.preventDefault(); irInicio(); },
  tema: () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t; guardar("tema", t); renderAcciones();
  },
  "nueva-liga": () => asistente(),
  "abrir-liga": (el) => abrirLiga(el.dataset.id),
  "menu-ligas": (el) => {
    const r = el.getBoundingClientRect();
    const menu = document.createElement("div");
    menu.className = "menu";
    menu.style.top = r.bottom + 8 + "px";
    menu.style.left = Math.max(16, Math.min(r.left, innerWidth - 296)) + "px";
    menu.innerHTML = `${S.ligas.map((l) => `<button data-id="${l.id}" class="${S.liga?.id === l.id ? "active" : ""}">${avatar(l.nombre, "sm")}<span>${esc(l.nombre)}</span><span class="meta">${l.jugados}/${l.total}</span></button>`).join("")}
      <hr><button data-nueva>${I.plus.replace("<svg", '<svg width="18" height="18"')}<span>Nueva liga</span><span class="meta"><kbd>N</kbd></span></button>
      <button data-todas>${I.trophy.replace("<svg", '<svg width="18" height="18"')}<span>Ver todas</span></button>`;
    document.body.append(menu);
    const fuera = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener("mousedown", fuera); } };
    setTimeout(() => document.addEventListener("mousedown", fuera));
    menu.onclick = (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      menu.remove(); document.removeEventListener("mousedown", fuera);
      if (b.dataset.nueva !== undefined) asistente();
      else if (b.dataset.todas !== undefined) irInicio();
      else abrirLiga(b.dataset.id);
    };
  },
  tab: (el) => { S.tab = el.dataset.tab; guardar("tab", S.tab); render(); },
  "agregar-jugadores": () => modalJugadores(),
  "siguiente-resultado": () => {
    if (!S.liga.generado) { toast("Primero genera el calendario.", { error: true }); return; }
    const s = siguientePendiente();
    if (s) modalResultado(s.id);
    else if (S.liga.puede_avanzar) toast("Ronda completa: genera la siguiente desde Partidos.");
    else toast("No quedan partidos pendientes. 🏓");
  },
  resultado: (el) => modalResultado(el.dataset.id),
  "ver-jugador": (el) => fichaJugador(el.dataset.id),
  filtro: (el) => { S.filtro = el.dataset.f; montarPestana(); },
  ronda: (el) => { const r = +el.dataset.r; S.abiertas.has(r) ? S.abiertas.delete(r) : S.abiertas.add(r); el.closest(".round").classList.toggle("open"); el.setAttribute("aria-expanded", S.abiertas.has(r)); },
  expandir: () => {
    if (S.abiertas.size > 1) S.abiertas = new Set([rondaActual() ?? 0]);
    else S.abiertas = new Set(Array.from({ length: S.liga.total_rondas }, (_, i) => i));
    montarPestana();
  },
  generar: async () => { try { actualizar(await api("POST", `/api/ligas/${S.liga.id}/calendario`, {})); toast("Partidos generados"); } catch (e) { fallo(e); } },
  "ronda-suizo": async () => {
    try { const v = await api("POST", `/api/ligas/${S.liga.id}/ronda`); S.abiertas = new Set(); S.tab = "partidos"; actualizar(v); toast("Nueva ronda emparejada"); } catch (e) { fallo(e); }
  },
  renombrar: (el) => {
    const card = el.closest(".pcard");
    const j = S.liga.jugadores.find((x) => x.id === el.dataset.id);
    const nm = card.querySelector(".nm");
    nm.innerHTML = `<input class="rename" value="${esc(j.nombre)}" maxlength="40">`;
    const input = nm.querySelector("input");
    input.focus(); input.select();
    let hecho = false;
    const fin = async (guardarlo) => {
      if (hecho) return; hecho = true;
      const v = input.value.trim();
      if (!guardarlo || !v || v === j.nombre) { montarPestana(); return; }
      try { actualizar(await api("PATCH", `/api/ligas/${S.liga.id}/jugadores/${j.id}`, { nombre: v })); toast("Nombre actualizado"); } catch (e) { fallo(e); montarPestana(); }
    };
    input.onkeydown = (e) => { if (e.key === "Enter") fin(true); if (e.key === "Escape") { e.stopPropagation(); fin(false); } };
    input.onblur = () => fin(true);
  },
  "quitar-jugador": async (el) => {
    const l = S.liga;
    const j = l.jugadores.find((x) => x.id === el.dataset.id);
    const jugados = l.partidos.filter((p) => p.marcador && (p.a === j.id || p.b === j.id)).length;
    const extra = !l.generado ? "" : esKO() ? " El cuadro se rehace y se pierden los resultados." : jugados ? ` Se borran sus ${plural(jugados, "partido jugado", "partidos jugados")} y la tabla se recalcula.` : " Se quitan sus partidos del calendario.";
    if (!(await confirmar({ titulo: `¿Eliminar a ${j.nombre}?`, texto: `Sale de la liga.${extra}`, ok: "Eliminar", peligro: true }))) return;
    try { actualizar(await api("DELETE", `/api/ligas/${l.id}/jugadores/${j.id}`)); toast(`${j.nombre} eliminado`); } catch (e) { fallo(e); }
  },
  regenerar: async () => {
    const l = S.liga;
    if (l.jugados && !(await confirmar({ titulo: "¿Regenerar calendario?", texto: `Se perderán los ${l.jugados} resultados cargados.`, ok: "Regenerar", peligro: true }))) return;
    try { actualizar(await api("POST", `/api/ligas/${l.id}/calendario`, {})); toast("Calendario regenerado"); } catch (e) { fallo(e); }
  },
  exportar: () => {
    const blob = new Blob([JSON.stringify(S.liga, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${S.liga.nombre.replace(/[^\w\-]+/g, "_")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  "eliminar-liga": async () => {
    const l = S.liga;
    if (!(await confirmar({ titulo: `¿Eliminar «${l.nombre}»?`, texto: "Se borran jugadores, partidos y resultados. No se puede deshacer.", ok: "Eliminar liga", peligro: true }))) return;
    try { await api("DELETE", `/api/ligas/${l.id}`); await refrescarLista(); irInicio(); toast("Liga eliminada"); } catch (e) { fallo(e); }
  },
  descartar: () => { S.borrador = null; montarPestana(); },
  "guardar-ajustes": async () => {
    const l = S.liga, b = S.borrador;
    const regenera = l.generado && (b.formato !== l.config.formato || b.mejor_de !== l.config.mejor_de || b.puntos_set !== l.config.puntos_set);
    if (regenera && l.jugados && !(await confirmar({ titulo: "¿Guardar y regenerar?", texto: `El cambio rehace el calendario: se pierden ${plural(l.jugados, "resultado", "resultados")}.`, ok: "Guardar y regenerar", peligro: true }))) return;
    try { const v = await api("PATCH", `/api/ligas/${l.id}`, { config: b }); S.borrador = null; actualizar(v); toast("Ajustes guardados"); } catch (e) { fallo(e); }
  },
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const fn = acciones[el.dataset.action];
  if (fn) fn(el, e);
});

document.addEventListener("change", async (e) => {
  const k = e.target.dataset.change;
  if (k === "filtro-jugador") { S.jugadorFiltro = e.target.value; montarPestana(); }
  if (k === "nombre-liga") {
    const v = e.target.value.trim();
    if (!v || v === S.liga.nombre) return;
    try { const vista = await api("PATCH", `/api/ligas/${S.liga.id}`, { nombre: v }); const b = S.borrador; actualizar(vista); S.borrador = b; toast("Nombre guardado"); } catch (err) { fallo(err); }
  }
});

document.addEventListener("submit", async (e) => {
  if (e.target.dataset.submit !== "alta-rapida") return;
  e.preventDefault();
  const input = e.target.elements.nombre;
  const nombres = partirNombres(input.value);
  if (!nombres.length) { input.focus(); return; }
  try {
    const antes = S.liga.jugadores.length;
    const generadoAntes = S.liga.generado;
    const vista = await api("POST", `/api/ligas/${S.liga.id}/jugadores`, { nombres, generar: true });
    actualizar(vista);
    const n = vista.jugadores.length - antes;
    toast(`${n === 1 ? nombres[0] + " se sumó" : n + " jugadores sumados"}${!generadoAntes && vista.generado ? " · calendario generado" : ""}`);
    $(".quick-add input")?.focus();
  } catch (err) { fallo(err); input.select(); }
});

// Atajos de teclado
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && hayModal()) { cerrarModal(); return; }
  const escribiendo = e.target.closest("input, textarea, select, [contenteditable]");
  if (escribiendo || hayModal() || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "n") { e.preventDefault(); asistente(); }
  if (!S.liga) return;
  if (k === "j") { e.preventDefault(); modalJugadores(); }
  if (k === "r") { e.preventDefault(); acciones["siguiente-resultado"](); }
  if (["1", "2", "3", "4"].includes(k)) { S.tab = ["tabla", "partidos", "jugadores", "ajustes"][+k - 1]; guardar("tab", S.tab); render(); }
});

iniciar().catch(fallo);
