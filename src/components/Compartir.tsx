import { forwardRef, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import * as m from "../engine/motor";
import { crearFoto, enlace, type Foto } from "../compartir";
import { avisar, fallo } from "../store";
import { Avatar, Ic, Modal, descargar } from "../ui";

/** Gráfico de la tabla estilo transmisión. Se usa en la vista compartida y para la imagen. */
export const Grafica = forwardRef<HTMLDivElement, { foto: Foto }>(function Grafica({ foto }, ref) {
  const fecha = new Date(foto.d + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div ref={ref} className="grafica">
      <div className="g-cab">
        <div className="g-marca"><span className="g-barra" />TOPSPIN</div>
        <span className="g-estado">{foto.c ? "FINAL" : "EN VIVO"}</span>
      </div>
      <div className="g-titulo">
        <span className="eyebrow">{foto.fn} · {foto.r}</span>
        <h2>{foto.n}</h2>
        <div className="g-progreso"><i style={{ width: `${foto.j[1] ? (foto.j[0] / foto.j[1]) * 100 : 0}%` }} /></div>
        <span className="g-meta">{foto.j[0]} de {foto.j[1]} partidos jugados</span>
      </div>
      {foto.c && <div className="g-campeon"><Ic.trophy size={22} /> <b>{foto.c}</b> campeón</div>}
      {foto.k ? (
        <div className="g-cuadro">
          {foto.k.map(([ronda, cruces]) => (
            <div key={ronda} className="g-ronda"><span className="eyebrow">{ronda}</span>
              {cruces.map(([a, b, sa, sb], i) => (
                <div key={i} className="g-cruce">
                  <span className={sa !== null && sa > (sb ?? 0) ? "gana" : ""}>{a ?? (b && !a ? "Pase directo" : "—")}<b>{sa ?? ""}</b></span>
                  <span className={sb !== null && sb > (sa ?? 0) ? "gana" : ""}>{b ?? (a && !b ? "Pase directo" : "—")}<b>{sb ?? ""}</b></span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <table className="g-tabla">
          <thead><tr><th>#</th><th className="izq">Jugador</th><th>PJ</th><th>G</th><th>P</th><th>DS</th><th className="pts">PTS</th><th className="hide-xs">Racha</th></tr></thead>
          <tbody>
            {foto.t.map(([nombre, pj, g, p, ds, pts, racha, mov, puesto], i) => (
              <tr key={nombre} className={`p${puesto ?? i + 1}`}>
                <td className="pos">{puesto ?? i + 1}{puesto && foto.t.some((o, k) => k !== i && o[8] === puesto) ? <sup className="emp">=</sup> : null}{mov ? <small className={mov > 0 ? "sube" : "baja"}>{mov > 0 ? "▲" : "▼"}{Math.abs(mov)}</small> : null}</td>
                <td className="izq"><span className="g-jug"><Avatar nombre={nombre} size="sm" />{nombre}</span></td>
                <td>{pj}</td><td>{g}</td><td>{p}</td><td>{ds > 0 ? `+${ds}` : ds}</td><td className="pts">{pts}</td>
                <td className="hide-xs"><span className="racha">{racha.split("").map((r, k) => <i key={k} className={r}>{r}</i>)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {foto.ff && (
        <div className="g-ultimos"><span className="eyebrow">Fase final</span>
          <div>{foto.ff.map(([etq, a, b, sa, sb], i) => (
            <span key={i} className="g-res"><b className="g-etq">{etq}</b> <em className={sa !== null && sa > (sb ?? 0) ? "gana" : ""}>{a}</em> <b>{sa === null ? "vs" : `${sa}–${sb}`}</b> <em className={sb !== null && sb > (sa ?? 0) ? "gana" : ""}>{b}</em></span>
          ))}</div>
        </div>
      )}
      {foto.u.length > 0 && (
        <div className="g-ultimos"><span className="eyebrow">Últimos resultados</span>
          <div>{foto.u.map(([a, b, sa, sb], i) => (
            <span key={i} className="g-res"><em className={sa > sb ? "gana" : ""}>{a}</em> <b>{sa}–{sb}</b> <em className={sb > sa ? "gana" : ""}>{b}</em></span>
          ))}</div>
        </div>
      )}
      <div className="g-pie">Actualizado el {fecha}</div>
    </div>
  );
});

export function CompartirModal({ liga, abierto, alCerrar }: { liga: m.Vista; abierto: boolean; alCerrar: () => void }) {
  return (
    <Modal abierto={abierto} alCerrar={alCerrar} ancho etiqueta="Compartir tabla">
      {abierto && <Contenido liga={liga} alCerrar={alCerrar} />}
    </Modal>
  );
}

function Contenido({ liga, alCerrar }: { liga: m.Vista; alCerrar: () => void }) {
  const foto = useMemo(() => crearFoto(liga), [liga]);
  const url = useMemo(() => enlace(foto), [foto]);
  const ref = useRef<HTMLDivElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const local = /^(localhost|127\.|\[::1\])/.test(location.hostname);
  const archivo = `${liga.nombre.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, "").trim().replace(/\s+/g, "-") || "tabla"}.png`;

  const imagen = async (): Promise<Blob | null> => {
    if (!ref.current) return null;
    const opciones = { pixelRatio: 2, backgroundColor: "#000", cacheBust: true };
    let datos: string;
    try { datos = await toPng(ref.current, opciones); }
    catch { datos = await toPng(ref.current, { ...opciones, skipFonts: true }); }
    return (await fetch(datos)).blob();
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(url); avisar("Enlace copiado"); }
    catch { fallo("No se pudo copiar. Selecciona el enlace y cópialo a mano."); }
  };
  const bajar = async () => {
    setOcupado(true);
    try { const b = await imagen(); if (b) { descargar(archivo, b); avisar("Imagen descargada"); } }
    catch (e) { fallo(e); } finally { setOcupado(false); }
  };
  const nativo = async () => {
    setOcupado(true);
    try {
      const b = await imagen();
      const file = b ? new File([b], archivo, { type: "image/png" }) : null;
      const datos: ShareData = { title: liga.nombre, text: `Tabla de ${liga.nombre}`, url };
      if (file && navigator.canShare?.({ files: [file] })) datos.files = [file];
      await navigator.share(datos);
    } catch (e) { if ((e as Error).name !== "AbortError") fallo(e); } finally { setOcupado(false); }
  };

  return (
    <>
      <div className="modal-head"><div className="col"><span className="eyebrow">Estado al día de hoy</span><h2>Compartir tabla</h2></div>
        <span className="spacer" /><button className="btn btn-ghost btn-icon" onClick={alCerrar} aria-label="Cerrar"><Ic.x /></button></div>
      <div className="modal-body compartir">
        <div className="compartir-vista"><Grafica ref={ref} foto={foto} /></div>
        <div className="compartir-acciones">
          <label className="campo"><span>Enlace de solo lectura</span>
            <div className="enlace"><input className="input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Enlace para compartir" />
              <button className="btn btn-primary" onClick={copiar}><Ic.link /> Copiar</button></div>
          </label>
          <div className="fila-btn">
            <button className="btn" onClick={bajar} disabled={ocupado}><Ic.image /> Descargar imagen</button>
            {"share" in navigator && <button className="btn" onClick={nativo} disabled={ocupado}><Ic.share /> Compartir…</button>}
            <button className="btn btn-ghost" onClick={() => window.open(url, "_blank")}><Ic.arrow /> Ver como invitado</button>
          </div>
          <div className="aviso"><Ic.info size={16} />
            <span>{local
              ? "Estás en tu compu (localhost): el enlace solo abre aquí. Publica la app en GitHub Pages para que lo abra cualquiera; la imagen sí sirve para WhatsApp desde ya."
              : "El enlace lleva la tabla dentro: quien lo abra ve este momento, sin cuenta ni instalación. Si cambian los resultados, comparte uno nuevo."}</span>
          </div>
        </div>
      </div>
    </>
  );
}
