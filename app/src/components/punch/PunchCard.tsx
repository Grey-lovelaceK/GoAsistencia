import type { PunchType } from "@/types";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

const PUNCH_SEQ: PunchType[] = ["entrada", "salida_colacion", "entrada_colacion", "salida"];

export const PUNCH_META: Record<PunchType, { label: string; short: string; step: number }> = {
  entrada:          { label: "Entrada",            short: "Entrada",       step: 1 },
  salida_colacion:  { label: "Salida a colación",  short: "Sal. Colación", step: 2 },
  entrada_colacion: { label: "Regreso de colación",short: "Ent. Colación", step: 3 },
  salida:           { label: "Salida",             short: "Salida",        step: 4 },
};

interface PunchRecord { type: PunchType; time: string }

interface Props {
  next: PunchType;
  lastPunch: PunchRecord | null;
  canPunch: boolean;
  loading: boolean;
  punchStep: string | null;
  error: string | null;
  geo: { isWithin: boolean; distanceMeters: number };
  shift: { start: string; end: string; breakMinutes: number } | null;
  onPunch: (t: PunchType) => void;
}

const STEP_ICONS = [
  {
    key: "geo",
    label: "Geofence",
    d: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
  },
  {
    key: "bio",
    label: "Biometría",
    d: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4",
  },
  {
    key: "cam",
    label: "Foto",
    d: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
  },
];

export default function PunchCard({
  next, lastPunch, canPunch, loading, punchStep, error, geo, shift, onPunch,
}: Props) {
  const meta = PUNCH_META[next];

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{
        background: "#060E1D",
        border: "1px solid rgba(41,137,216,0.18)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03)",
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold text-white"
            style={{ background: G.btn }}>
            {meta.step}
          </div>
          <span className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">/ 4 pasos</span>
        </div>
        <div className="flex items-center gap-2">
          {STEP_ICONS.map(({ key, label, d }, idx) => {
            const done = idx === 0 ? geo.isWithin : false;
            return (
              <div key={key} title={label}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                style={{
                  background: done ? "rgba(41,137,216,0.18)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${done ? "rgba(41,137,216,0.4)" : "rgba(255,255,255,0.06)"}`,
                }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: done ? "#7db9e8" : "rgba(255,255,255,0.2)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-5 pb-5">
        {/* Fuera del área */}
        {!geo.isWithin && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>Estás a {geo.distanceMeters}m — radio máximo 500m</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Progreso */}
        {loading && punchStep && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4 text-sm"
            style={{ background: "rgba(41,137,216,0.08)", border: "1px solid rgba(41,137,216,0.18)", color: "#7db9e8" }}>
            <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-medium">{punchStep}</span>
          </div>
        )}

        {/* Etiqueta */}
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-1">
          Siguiente marcación
        </p>
        <p className="text-white font-bold mb-1"
          style={{ fontSize: "1.75rem", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          {meta.label}
        </p>
        {lastPunch ? (
          <p className="text-white/25 text-xs mb-4 font-light">
            Anterior: {PUNCH_META[lastPunch.type].short} · {lastPunch.time}
          </p>
        ) : (
          <p className="text-white/20 text-xs mb-4 font-light">
            {shift ? `Turno ${shift.start} – ${shift.end}` : "Cargando turno..."}
          </p>
        )}

        {/* Barra de progreso */}
        <div className="flex gap-1 mb-5">
          {PUNCH_SEQ.map((t) => {
            const done    = lastPunch ? PUNCH_SEQ.indexOf(t) <= PUNCH_SEQ.indexOf(lastPunch.type) : false;
            const current = !lastPunch ? t === next : PUNCH_SEQ.indexOf(t) === PUNCH_SEQ.indexOf(lastPunch.type) + 1;
            return (
              <div key={t} className="flex-1 h-1 rounded-full transition-all"
                style={{
                  background: done
                    ? "#2989d8"
                    : current
                    ? "rgba(41,137,216,0.45)"
                    : "rgba(255,255,255,0.07)",
                }} />
            );
          })}
        </div>

        {/* Botón */}
        <button
          onClick={() => onPunch(next)}
          disabled={!canPunch}
          className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background:    canPunch ? G.btn : "rgba(255,255,255,0.05)",
            boxShadow:     canPunch ? "0 4px 24px rgba(41,137,216,0.50), 0 1px 0 rgba(255,255,255,0.08) inset" : "none",
            border:        canPunch ? "none" : "1px solid rgba(255,255,255,0.08)",
            letterSpacing: "0.03em",
          }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Procesando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Marcar {meta.short}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
