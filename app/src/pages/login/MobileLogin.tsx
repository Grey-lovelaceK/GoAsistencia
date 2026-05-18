import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api";
import { detectIdentifierType, normalizeIdentifier } from "@/lib/auth";
import PasskeyRegisterModal from "@/components/auth/PasskeyRegisterModal";

const G = {
  btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)",
} as const;

export default function MobileLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyPending, setPasskeyPending] = useState<{ rut: string; password: string } | null>(null);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const idType = detectIdentifierType(identifier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Completa todos los campos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const normalizedId = normalizeIdentifier(identifier);
      const result = await authService.login({ identifier: normalizedId, password });
      authLogin(result.token, result.user);
      if (result.user.role === "employee" && result.user.passkey === false) {
        setPasskeyPending({ rut: normalizedId, password });
      } else {
        navigate(result.user.role === "admin" ? "/admin" : "/punch", { replace: true });
      }
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "INVALID_CREDENTIALS"
          ? "Credenciales incorrectas. Verifica e intenta de nuevo."
          : "Error al conectar con el servidor.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {passkeyPending && (
      <PasskeyRegisterModal
        rut={passkeyPending.rut}
        password={passkeyPending.password}
        onDone={() => navigate("/punch", { replace: true })}
      />
    )}
    <div
      className="flex flex-col items-center justify-center px-5 relative overflow-hidden"
      style={{ background: "#050E1D", fontFamily: "Poppins, sans-serif", height: "100dvh" }}
    >
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(41,137,216,0.14) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(41,137,216,0.10) 0%, transparent 70%)" }} />

      {/* Hexágono — top right */}
      <div className="absolute -top-10 -right-10 w-56 h-56 pointer-events-none opacity-20">
        <svg viewBox="0 0 200 230" fill="none" className="w-full h-full">
          <polygon points="100,5 195,55 195,175 100,225 5,175 5,55"
            stroke="#2989d8" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Diamante — bottom left */}
      <div className="absolute -bottom-8 -left-8 w-40 h-40 pointer-events-none opacity-15">
        <svg viewBox="0 0 96 96" fill="none">
          <rect x="48" y="4" width="62" height="62" transform="rotate(45 48 48)"
            stroke="#2989d8" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Logo */}
      <img
        src="/logo.png"
        alt="GO Tecnología"
        className="h-9 w-auto object-contain brightness-0 invert mb-5 relative z-10"
      />

      {/* Glass card */}
      <div
        className="w-full max-w-sm relative z-10 rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="h-6 w-0.5 rounded-full" style={{ background: G.btn }} />
          <div>
            <h1 className="text-white text-lg font-semibold leading-tight">Iniciar sesión</h1>
            <p className="text-white/35 text-[11px] font-light">RUT o correo corporativo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Identificador */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
                {idType === "rut" ? "RUT" : idType === "email" ? "Correo" : "RUT o Correo"}
              </label>
              {idType !== "unknown" && identifier.length > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(41,137,216,0.15)", color: "#7db9e8" }}>
                  {idType === "rut" ? "RUT" : "Email"}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {idType === "email" ? (
                  <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </span>
              <input
                type="text"
                placeholder="12345678-9  ó  usuario@empresa.cl"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontFamily: "Poppins, sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(41,137,216,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(41,137,216,0.12)";
                  e.target.style.background = "rgba(255,255,255,0.09)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.10)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "rgba(255,255,255,0.06)";
                }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
                Contraseña
              </label>
              <button type="button"
                className="text-[11px] font-medium text-white/35 hover:text-white/60 transition-colors">
                ¿Olvidaste tu clave?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontFamily: "Poppins, sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(41,137,216,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(41,137,216,0.12)";
                  e.target.style.background = "rgba(255,255,255,0.09)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.10)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "rgba(255,255,255,0.06)";
                }}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")}>
                {showPwd ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.25)" }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3.5 rounded-xl text-sm text-white mt-1
                       transition-all active:scale-[0.98] disabled:opacity-55
                       flex items-center justify-center gap-2"
            style={{
              background: G.btn,
              boxShadow: loading ? "none" : "0 4px 20px rgba(41,137,216,0.4), 0 0 0 1px rgba(41,137,216,0.3)",
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verificando...
              </>
            ) : (
              <>
                Ingresar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-5 text-white/20 text-xs font-light relative z-10">
        © 2026 GO Tecnología · v1.0.0
      </p>
    </div>
    </>
  );
}
