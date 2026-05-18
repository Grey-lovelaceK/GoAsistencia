import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api";
import { detectIdentifierType, normalizeIdentifier } from "@/lib/auth";

const G = {
  btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)",
} as const;

const FEATURES = [
  {
    d: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
    label: "Geofence 500m en tiempo real",
  },
  {
    d: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4",
    label: "Biometría WebAuthn step-up",
  },
  {
    d: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    label: "Reportes y exportación Excel",
  },
];

const STATS = [
  { value: "99.9%", label: "Uptime" },
  { value: "<200ms", label: "Latencia" },
  { value: "±5m", label: "Precisión GPS" },
];

export default function DesktopLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const result = await authService.login({
        identifier: normalizeIdentifier(identifier),
        password,
      });
      authLogin(result.token, result.user);
      navigate(result.user.role === "admin" ? "/admin" : "/punch", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "INVALID_CREDENTIALS"
          ? "Credenciales incorrectas"
          : "Error al conectar con el servidor",
      );
    } finally {
      setLoading(false);
    }
  };

  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#2989d8";
    e.target.style.boxShadow = "0 0 0 3px rgba(41,137,216,0.10)";
    e.target.style.background = "#fff";
  };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#E2E8F0";
    e.target.style.boxShadow = "none";
    e.target.style.background = "#F8FAFD";
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── Panel izquierdo — brand ── */}
      <div
        className="hidden lg:flex w-[45%] flex-col justify-between py-12 px-12 relative overflow-hidden"
        style={{ background: "#070F1E" }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(41,137,216,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        {/* Hexágono decorativo — top-right */}
        <div className="absolute -top-12 -right-12 w-80 h-80 pointer-events-none opacity-25">
          <svg viewBox="0 0 200 230" fill="none" className="w-full h-full">
            <polygon points="100,5 195,55 195,175 100,225 5,175 5,55"
              stroke="#2989d8" strokeWidth="1.5" fill="none" />
            <polygon points="100,35 168,73 168,157 100,195 32,157 32,73"
              stroke="#2989d8" strokeWidth="0.75" fill="none" />
          </svg>
        </div>

        {/* Línea diagonal */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="100%" x2="100%" y2="0"
              stroke="rgba(41,137,216,0.06)" strokeWidth="1" />
          </svg>
        </div>

        {/* Diamante — bottom-left */}
        <div className="absolute bottom-20 left-6 w-24 h-24 pointer-events-none">
          <svg viewBox="0 0 96 96" fill="none">
            <rect x="48" y="6" width="60" height="60" transform="rotate(45 48 48)"
              stroke="rgba(41,137,216,0.18)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="GO Tecnología"
            className="h-10 w-auto object-contain brightness-0 invert" />
        </div>

        {/* Contenido central */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
            style={{ background: "rgba(41,137,216,0.10)", border: "1px solid rgba(41,137,216,0.22)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-white/55 font-semibold tracking-widest uppercase">
              Plataforma activa
            </span>
          </div>

          <h2 className="text-white text-[2rem] font-bold leading-tight">
            Control de asistencia<br />
            <span className="font-extralight" style={{ color: "#7db9e8" }}>
              con precisión milimétrica.
            </span>
          </h2>

          <div className="mt-8 flex flex-col gap-3">
            {FEATURES.map(({ d, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(41,137,216,0.10)",
                    border: "1px solid rgba(41,137,216,0.22)",
                  }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="#7db9e8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
                  </svg>
                </div>
                <span className="text-white/55 text-sm font-light">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-7 pt-7"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-white font-semibold text-lg tabular-nums">{value}</p>
                <p className="text-white/30 text-[11px] font-light mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs font-light">
          © 2026 GO Tecnología · v1.0.0
        </p>
      </div>

      {/* ── Panel derecho — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: "#F6F9FD" }}>

        {/* Logo mobile (solo <lg) */}
        <div className="lg:hidden mb-8">
          <img src="/logo.png" alt="GO Tecnología" className="h-14 w-auto object-contain" />
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl px-8 py-8"
          style={{
            border: "1px solid #E4EDF6",
            boxShadow: "0 4px 24px rgba(30,87,153,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          }}>

          <div className="flex items-start gap-3 mb-7">
            <div className="mt-1 w-1 h-10 rounded-full flex-shrink-0" style={{ background: G.btn }} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Iniciar sesión</h1>
              <p className="text-gray-400 text-xs mt-0.5 font-light">
                Accede con tu RUT o correo corporativo
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Identificador */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  {idType === "rut" ? "RUT" : idType === "email" ? "Correo" : "RUT o Correo"}
                </label>
                {idType !== "unknown" && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(41,137,216,0.08)", color: "#2989d8" }}>
                    {idType === "rut" ? "RUT detectado" : "Email detectado"}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {idType === "email" ? (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none transition-all"
                  style={{ background: "#F8FAFD", border: "1.5px solid #E2E8F0", fontFamily: "Poppins, sans-serif" }}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  Contraseña
                </label>
                <button type="button"
                  className="text-xs font-medium transition-colors"
                  style={{ color: "#2989d8" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#1e5799")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#2989d8")}>
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full rounded-xl pl-10 pr-11 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none transition-all"
                  style={{ background: "#F8FAFD", border: "1.5px solid #E2E8F0", fontFamily: "Poppins, sans-serif" }}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
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

            {/* Recordarme */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div onClick={() => setRemember((v) => !v)}
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: remember ? G.btn : "white",
                  border: remember ? "none" : "1.5px solid #CBD5E1",
                }}>
                {remember && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-400 font-light">Recordar sesión</span>
            </label>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{ background: "#FFF5F5", color: "#9B1C1C", border: "1px solid #FED7D7" }}>
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
              className="w-full text-white font-semibold py-3.5 rounded-xl text-sm
                         transition-all active:scale-[0.98] disabled:opacity-60 mt-1
                         flex items-center justify-center gap-2"
              style={{
                background: G.btn,
                boxShadow: loading ? "none" : "0 4px 20px rgba(41,137,216,0.35), 0 1px 4px rgba(30,87,153,0.3)",
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

        <p className="mt-6 text-gray-300 text-xs font-light">
          © 2026 GO Tecnología · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
