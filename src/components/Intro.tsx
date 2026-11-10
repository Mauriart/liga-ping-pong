import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Intro animada: la mesa se dibuja, la pelota pelotea entre dos paletas,
 * el último golpe viene a cámara y revela la marca.
 */
const DUR = 3.6;
const t = (s: number) => s / DUR; // segundos -> fracción

// Pelota en perspectiva: lejos (arriba, chica) / cerca (abajo, grande)
const PELOTA = {
  cx: [620, 760, 900, 1010, 900, 760, 640, 800, 800],
  cy: [330, 470, 360, 600, 380, 470, 330, 520, 520],
  r: [9, 11, 12, 17, 12, 11, 9, 60, 1400],
  times: [0, t(0.45), t(0.75), t(1.1), t(1.45), t(1.75), t(2.1), t(2.55), t(2.95)],
};

export function Intro({ alTerminar }: { alTerminar: () => void }) {
  const reducido = useReducedMotion();

  useEffect(() => {
    if (reducido) { alTerminar(); return; }
    const fin = setTimeout(alTerminar, DUR * 1000 + 250);
    const saltar = (e: KeyboardEvent) => { if (e.key) alTerminar(); };
    window.addEventListener("keydown", saltar);
    return () => { clearTimeout(fin); window.removeEventListener("keydown", saltar); };
  }, [alTerminar, reducido]);

  if (reducido) return null;
  const ease = "easeInOut";

  return (
    <motion.div className="intro" onClick={alTerminar} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      role="presentation" aria-label="Intro de TOPSPIN">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="intro-svg" aria-hidden="true">
        <defs>
          <radialGradient id="foco" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#1b3a66" stopOpacity=".55" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tablero" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d4c8c" />
            <stop offset="100%" stopColor="#0a3360" />
          </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="#000" />
        <motion.rect width="1600" height="900" fill="url(#foco)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />

        {/* mesa en perspectiva */}
        <motion.g initial={{ opacity: 0, y: 40 }} animate={{ opacity: [0, 1, 1, 0], y: [40, 0, 0, 0] }}
          transition={{ duration: DUR, times: [0, t(0.4), t(2.5), t(2.8)] }}>
          <polygon points="560,380 1040,380 1300,700 300,700" fill="url(#tablero)" />
          <motion.polygon points="560,380 1040,380 1300,700 300,700" fill="none" stroke="#fff" strokeWidth="5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease }} />
          <motion.line x1="800" y1="380" x2="800" y2="700" stroke="#fff" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} />
          <polygon points="300,700 1300,700 1300,716 300,716" fill="#06223f" />
          {/* red */}
          <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.35, duration: 0.3 }} style={{ transformOrigin: "800px 520px" }}>
            <polygon points="452,520 1148,520 1148,486 452,486" fill="rgba(255,255,255,.18)" stroke="#fff" strokeWidth="3" />
            {Array.from({ length: 24 }, (_, i) => <line key={i} x1={452 + i * 29} y1="486" x2={452 + i * 29} y2="520" stroke="rgba(255,255,255,.3)" strokeWidth="1" />)}
          </motion.g>
          {/* paletas */}
          <motion.g initial={{ x: 0, rotate: 0 }} animate={{ rotate: [0, 0, -18, 0, 0, -18, 0] }}
            transition={{ duration: DUR, times: [0, t(0.05), t(0.12), t(0.3), t(1.95), t(2.08), t(2.3)] }} style={{ transformOrigin: "600px 300px" }}>
            <ellipse cx="590" cy="300" rx="34" ry="40" fill="#e11d2e" />
            <rect x="584" y="334" width="12" height="34" rx="5" fill="#c08a4f" />
          </motion.g>
          <motion.g animate={{ rotate: [0, 0, 22, 0], x: [0, 0, -20, 0] }}
            transition={{ duration: DUR, times: [0, t(0.95), t(1.12), t(1.4)] }} style={{ transformOrigin: "1060px 640px" }}>
            <ellipse cx="1060" cy="630" rx="62" ry="72" fill="#111" stroke="#e11d2e" strokeWidth="6" />
            <rect x="1050" y="690" width="22" height="70" rx="9" fill="#c08a4f" />
          </motion.g>
        </motion.g>

        {/* sombra y pelota */}
        <motion.ellipse fill="rgba(0,0,0,.45)" initial={{ opacity: 0, cx: 620, cy: 370, rx: 11, ry: 3 }}
          animate={{ cx: PELOTA.cx, cy: PELOTA.cy.map((y) => y + 40), rx: PELOTA.r.map((r) => r * 1.2), ry: PELOTA.r.map((r) => r * 0.35), opacity: [0, 1, 1, 1, 1, 1, 1, 0, 0] }}
          transition={{ duration: DUR, times: PELOTA.times, ease }} />
        <motion.circle fill="#fff" initial={{ cx: 620, cy: 330, r: 9 }}
          animate={{ cx: PELOTA.cx, cy: PELOTA.cy, r: PELOTA.r }}
          transition={{ duration: DUR, times: PELOTA.times, ease }} />
        {/* destello del golpe a cámara */}
        <motion.rect width="1600" height="900" fill="#e6ff00" initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0] }} transition={{ duration: DUR, times: [0, t(2.85), t(2.95), t(3.15)] }} />
      </svg>

      {/* marca */}
      <motion.div className="intro-marca" initial={{ opacity: 0, scale: 1.4, skewX: -12 }}
        animate={{ opacity: [0, 0, 1, 1], scale: [1.4, 1.4, 1, 1], skewX: [-12, -12, -8, -8] }}
        transition={{ duration: DUR, times: [0, t(2.95), t(3.15), 1] }}>
        <span className="intro-barra" />
        <b>TOPSPIN</b>
        <small>Liga de ping pong</small>
      </motion.div>

      <button className="intro-saltar" onClick={(e) => { e.stopPropagation(); alTerminar(); }}>Saltar ›</button>
    </motion.div>
  );
}
