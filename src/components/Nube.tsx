import { useState } from "react";
import { URL_FIJA } from "../nube";
import { avisar, esAdmin, urlNube, useLigas } from "../store";
import { Ic, Modal, haceCuanto } from "../ui";

const GUIA = "https://github.com/Mauriart/liga-ping-pong/blob/main/apps-script/LEEME.md";

/** Pegar la URL de la aplicación web de Apps Script (si no viene fija en el build). */
export function ConectarModal({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  return <Modal abierto={abierto} alCerrar={alCerrar} etiqueta="Conectar Google Sheets">{abierto && <Conectar alCerrar={alCerrar} />}</Modal>;
}

function Conectar({ alCerrar }: { alCerrar: () => void }) {
  const { urlLocal, setUrl } = useLigas();
  const [url, setTexto] = useState(urlLocal);
  const valida = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec\/?$/.test(url.trim());
  return (
    <>
      <div className="modal-head"><div className="col"><span className="eyebrow">Base de datos</span><h2>Conectar Google Sheets</h2></div>
        <span className="spacer" /><button className="btn btn-ghost btn-icon" onClick={alCerrar} aria-label="Cerrar"><Ic.x /></button></div>
      <div className="modal-body">
        <ol className="pasos-guia">
          <li>Crea una hoja en <b>sheets.new</b> y abre <b>Extensiones → Apps Script</b>.</li>
          <li>Pega el script <code>apps-script/Code.gs</code> y escribe tu clave de administrador.</li>
          <li><b>Implementar → Aplicación web</b> · ejecutar como tú · acceso: cualquier persona.</li>
          <li>Copia la URL que termina en <code>/exec</code> y pégala aquí.</li>
        </ol>
        <a className="enlace-btn" href={GUIA} target="_blank" rel="noreferrer">Ver la guía paso a paso ›</a>
        <label className="campo"><span>URL de la aplicación web</span>
          <input className="input" value={url} autoFocus placeholder="https://script.google.com/macros/s/…/exec" onChange={(e) => setTexto(e.target.value)} />
        </label>
        {url && !valida && <p className="set-error">La URL debe ser la de la aplicación web de Apps Script (termina en /exec).</p>}
      </div>
      <div className="modal-foot">
        {urlLocal && <button className="btn btn-ghost btn-danger" onClick={() => { setUrl(""); alCerrar(); avisar("Hoja desconectada"); }}>Desconectar</button>}
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={alCerrar}>Cancelar</button>
        <button className="btn btn-primary" disabled={!valida} onClick={() => { setUrl(url); alCerrar(); avisar("Hoja conectada"); }}><Ic.link /> Conectar</button>
      </div>
    </>
  );
}

/** Entrar como administrador con la clave definida en el script de la hoja. */
export function AdminModal({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  return <Modal abierto={abierto} alCerrar={alCerrar} etiqueta="Modo administrador">{abierto && <Admin alCerrar={alCerrar} />}</Modal>;
}

function Admin({ alCerrar }: { alCerrar: () => void }) {
  const s = useLigas();
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const admin = esAdmin(s);
  const entrar = async () => {
    setOcupado(true); setError("");
    try { await s.entrarAdmin(clave); avisar("Modo administrador activo"); alCerrar(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setOcupado(false); }
  };
  return (
    <>
      <div className="modal-head"><div className="col"><span className="eyebrow">Google Sheets</span><h2>{admin ? "Administrador" : "Entrar como admin"}</h2></div>
        <span className="spacer" /><button className="btn btn-ghost btn-icon" onClick={alCerrar} aria-label="Cerrar"><Ic.x /></button></div>
      <div className="modal-body">
        {admin ? (
          <p className="muted-text">Estás editando los torneos de la hoja desde este dispositivo. Cada cambio se guarda solo en la nube.</p>
        ) : (
          <>
            <p className="muted-text">Con la clave puedes crear torneos y cargar resultados en la hoja. Sin ella, la app muestra los torneos en solo lectura.</p>
            <label className="campo"><span>Clave de administrador</span>
              <input className="input" type="password" value={clave} autoFocus autoComplete="current-password"
                onChange={(e) => setClave(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && clave) void entrar(); }} />
            </label>
            {error && <p className="set-error" role="alert">{error}</p>}
          </>
        )}
      </div>
      <div className="modal-foot"><span className="spacer" />
        {admin
          ? <button className="btn btn-danger" onClick={() => { s.salirAdmin(); alCerrar(); avisar("Saliste del modo administrador"); }}>Salir del modo admin</button>
          : <button className="btn btn-primary" disabled={!clave || ocupado} onClick={() => void entrar()}><Ic.check /> {ocupado ? "Verificando…" : "Entrar"}</button>}
      </div>
    </>
  );
}

/** Indicador del estado de la conexión con la hoja. */
export function EstadoNubeChip() {
  const s = useLigas();
  if (!urlNube(s)) return null;
  const { estado, hora, mensaje, guardando } = s.nube;
  const texto = guardando.length ? "Guardando…" : estado === "error" ? "Sin conexión" : estado === "cargando" ? "Conectando…" : `Sincronizado ${haceCuanto(hora ?? null)}`;
  return (
    <button className={`nube-chip ${guardando.length ? "guardando" : estado}`} onClick={() => void s.cargarNube()} title={mensaje ?? "Actualizar desde Google Sheets"}>
      <i />{texto}
    </button>
  );
}

export const hayUrlFija = () => !!URL_FIJA;
