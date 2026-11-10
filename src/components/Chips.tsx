import { useRef, useState } from "react";
import { limpiarNombres } from "../engine/motor";
import { avisar } from "../store";
import { Avatar, Ic } from "../ui";

/** Campo de alta rápida: Enter o coma agregan, pegar una lista suma a todos, Retroceso borra el último. */
export function Chips({ lista, alCambiar, existentes = [], autoFocus, placeholder }: {
  lista: string[]; alCambiar: (l: string[]) => void; existentes?: string[]; autoFocus?: boolean; placeholder?: string;
}) {
  const [texto, setTexto] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const agregar = (bruto: string) => {
    const usados = new Set([...lista, ...existentes].map((x) => x.toLocaleLowerCase("es")));
    const nuevos: string[] = [];
    for (const n of limpiarNombres([bruto])) {
      if (usados.has(n.toLocaleLowerCase("es"))) { avisar(`«${n}» ya está en la liga.`); continue; }
      usados.add(n.toLocaleLowerCase("es"));
      nuevos.push(n);
    }
    if (nuevos.length) alCambiar([...lista, ...nuevos]);
    setTexto("");
  };
  return (
    <div className="chips tocable" onClick={() => ref.current?.focus()}>
      {lista.map((n, i) => (
        <span className="chip" key={n}>
          <Avatar nombre={n} size="sm" />{n}
          <button type="button" aria-label={`Quitar ${n}`} onClick={(e) => { e.stopPropagation(); alCambiar(lista.filter((_, k) => k !== i)); }}><Ic.x size={12} /></button>
        </span>
      ))}
      <input ref={ref} value={texto} autoFocus={autoFocus} aria-label="Agregar jugador"
        placeholder={placeholder ?? (lista.length ? "Otro jugador…" : "Nombre del primer jugador…")}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && texto.trim()) { e.preventDefault(); agregar(texto); }
          else if (e.key === "Enter") e.preventDefault();
          else if (e.key === "Backspace" && !texto && lista.length) alCambiar(lista.slice(0, -1));
        }}
        onBlur={() => { if (texto.trim()) agregar(texto); }}
        onPaste={(e) => { const t = e.clipboardData.getData("text"); if (/[\n,;]/.test(t)) { e.preventDefault(); agregar(t); } }} />
    </div>
  );
}
