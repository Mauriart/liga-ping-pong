import { useMemo } from "react";
import { decodificar } from "../compartir";
import { Grafica } from "../components/Compartir";
import { Ic, ir } from "../ui";

/** Vista de solo lectura que abre quien recibe el enlace. */
export function Compartido({ datos }: { datos: string }) {
  const foto = useMemo(() => decodificar(datos), [datos]);
  if (!foto) {
    return (
      <main className="contenedor"><div className="vacio panel"><Ic.alert size={40} /><h3>Enlace dañado</h3>
        <p>No se pudo leer la tabla. Pide que te lo compartan de nuevo.</p>
        <button className="btn btn-primary" onClick={() => ir("#/")}>Ir al inicio</button></div></main>
    );
  }
  return (
    <main className="contenedor compartido">
      <div className="compartido-aviso"><Ic.info size={16} /> Estás viendo una tabla compartida (solo lectura).</div>
      <Grafica foto={foto} />
      <div className="fila-btn centro">
        <button className="btn btn-volt" onClick={() => ir("#/")}><Ic.plus /> Crea tu propia liga</button>
      </div>
    </main>
  );
}
