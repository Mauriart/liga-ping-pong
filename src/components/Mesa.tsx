import type { ReactNode } from "react";
import { Avatar } from "../ui";

/**
 * Mesa de ping pong en 3D (CSS). El torneo «vive» aquí: los jugadores se paran
 * en cada mitad y la pelota peloteando marca que el partido está por jugarse.
 */
export function Mesa3D({ izquierda, derecha, centro, pelota = true, inclinacion = 58, className = "" }: {
  izquierda?: ReactNode; derecha?: ReactNode; centro?: ReactNode; pelota?: boolean; inclinacion?: number; className?: string;
}) {
  return (
    <div className={`mesa3d ${className}`}>
      <div className="mesa3d-escena" style={{ "--inc": `${inclinacion}deg` } as React.CSSProperties}>
        <div className="mesa3d-tablero">
          <span className="mesa3d-linea-central" />
          <span className="mesa3d-red"><i /></span>
          <span className="mesa3d-canto" />
          {pelota && (<><span className="mesa3d-sombra" /><span className="mesa3d-pelota" /></>)}
        </div>
        <span className="mesa3d-patas" />
      </div>
      {izquierda && <div className="mesa3d-lado izq">{izquierda}</div>}
      {derecha && <div className="mesa3d-lado der">{derecha}</div>}
      {centro && <div className="mesa3d-centro">{centro}</div>}
    </div>
  );
}

/** Placa de jugador sobre la mesa (nombre grande estilo transmisión). */
export function Placa({ nombre, detalle, lado, ganador }: { nombre?: string | null; detalle?: ReactNode; lado: "izq" | "der"; ganador?: boolean }) {
  return (
    <div className={`placa ${lado} ${ganador ? "gana" : ""}`}>
      <Avatar nombre={nombre} size="lg" />
      <div className="placa-texto">
        <span className="placa-nombre">{nombre ?? "Por definir"}</span>
        {detalle && <span className="placa-detalle">{detalle}</span>}
      </div>
    </div>
  );
}

/** Mesa vista desde arriba: cada partido de la lista vive en su propia mesa. */
export function MiniMesa({ a, b, ganador, centro, apagada }: {
  a?: string | null; b?: string | null; ganador?: "a" | "b" | null; centro: ReactNode; apagada?: boolean;
}) {
  const lado = (nombre: string | null | undefined, k: "a" | "b") => (
    <div className={`mm-lado ${k} ${ganador ? (ganador === k ? "gana" : "pierde") : ""}`}>
      <Avatar nombre={nombre} />
      <span className="mm-nombre">{nombre ?? "Por definir"}</span>
    </div>
  );
  return (
    <div className={`minimesa ${apagada ? "apagada" : ""}`}>
      <span className="mm-linea" aria-hidden="true" />
      <span className="mm-red" aria-hidden="true" />
      {lado(a, "a")}
      <div className="mm-centro">{centro}</div>
      {lado(b, "b")}
    </div>
  );
}
