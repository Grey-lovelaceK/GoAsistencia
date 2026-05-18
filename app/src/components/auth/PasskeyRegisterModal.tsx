import { useState } from "react";
import { registerPasskey } from "@/lib/webauthn";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

interface Props {
  rut: string;
  password: string;
  onDone: () => void;
}

export default function PasskeyRegisterModal({ rut, password, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await registerPasskey(rut, password);
      onDone();
    } catch {
      setError("No se pudo registrar. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm mb-8 mx-4 rounded-2xl p-6"
        style={{
          background: "rgba(10,17,30,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(41,137,216,0.12)", border: "1px solid rgba(41,137,216,0.22)" }}>
          <svg className="w-7 h-7" fill="none" stroke="#7db9e8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>

        <h2 className="text-white text-center text-base font-semibold mb-1">
          Activar acceso biométrico
        </h2>
        <p className="text-white/40 text-center text-xs mb-5 leading-relaxed">
          Registra tu huella o Face ID para marcar asistencia de forma segura sin contraseña.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-xs text-red-300"
            style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}>
            {error}
          </div>
        )}

        <button onClick={handleRegister} disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white mb-3 flex items-center justify-center gap-2 transition-all disabled:opacity-55"
          style={{ background: G.btn, boxShadow: "0 4px 20px rgba(41,137,216,0.35)" }}>
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Registrando...
            </>
          ) : "Registrar huella / Face ID"}
        </button>

        <button onClick={onDone}
          className="w-full py-2.5 text-xs transition-colors"
          style={{ color: "rgba(255,255,255,0.30)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.30)")}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
