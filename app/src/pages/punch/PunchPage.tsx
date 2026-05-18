import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { checkGeofence } from "@/lib/geofence";
import { stepUpBiometrics } from "@/lib/webauthn";
import { getDeviceId } from "@/lib/device";
import { sitesService } from "@/services/sites.service";
import { punchesService } from "@/services/punches.service";
import { ApiError } from "@/services/api";
import type { Site, PunchType } from "@/types";
import CameraModal from "@/components/punch/CameraModal";
import PunchCard, { PUNCH_META } from "@/components/punch/PunchCard";

const G = {
  btn:  "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)",
  hero: "linear-gradient(160deg, #060F22 0%, #0B1F3E 55%, #102A54 100%)",
} as const;

type Tab = "asistencia" | "historial" | "mas";

interface PunchRecord { type: PunchType; time: string }

const PUNCH_SEQ: PunchType[] = ["entrada", "salida_colacion", "entrada_colacion", "salida"];

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short", year: "numeric" });

function useRealTimeClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function PunchPage() {
  const now = useRealTimeClock();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { canInstall, install } = usePWAInstall();

  const [tab,        setTab]        = useState<Tab>("asistencia");
  const [loading,    setLoading]    = useState(false);
  const [punches,    setPunches]    = useState<PunchRecord[]>([]);
  const [error,      setError]      = useState<string | null>(null);
  const [punchStep,  setPunchStep]  = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [site,       setSite]       = useState<Site | null>(null);

  const captureResolveRef = useRef<((b: Blob) => void) | null>(null);
  const captureRejectRef  = useRef<((e: Error) => void) | null>(null);

  // Load site
  useEffect(() => {
    if (!user?.siteId) return;
    sitesService.getSite(user.siteId).then(setSite).catch(() => null);
  }, [user?.siteId]);

  // Load today's punches
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    punchesService
      .getPunches({ from: today, to: today })
      .then((res) => {
        setPunches(
          res.punches.map((p) => ({
            type: p.type,
            time: new Date(p.recordedAt).toLocaleTimeString("es-CL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        );
      })
      .catch(() => null);
  }, []);

  const geoResult =
    site && geo.lat !== null && geo.lng !== null
      ? checkGeofence({ lat: geo.lat, lng: geo.lng }, site, site.radiusMeters)
      : { isWithin: false, distanceMeters: 0 };

  const lastPunch = punches[punches.length - 1] ?? null;
  const shift     = site?.shifts?.[0] ?? null;
  const canPunch  = geoResult.isWithin && !loading && !!site && !geo.loading;

  const nextType = (): PunchType => {
    if (!lastPunch) return "entrada";
    const i = PUNCH_SEQ.indexOf(lastPunch.type);
    return i < PUNCH_SEQ.length - 1 ? PUNCH_SEQ[i + 1] : "entrada";
  };

  const openCameraModal = useCallback(
    (): Promise<Blob> =>
      new Promise((resolve, reject) => {
        captureResolveRef.current = resolve;
        captureRejectRef.current  = reject;
        setShowCamera(true);
      }),
    [],
  );

  const handleCameraCapture = (blob: Blob) => {
    setShowCamera(false);
    captureResolveRef.current?.(blob);
  };
  const handleCameraCancel = () => {
    setShowCamera(false);
    captureRejectRef.current?.(new Error("CANCELLED"));
  };

  const handlePunch = async (type: PunchType) => {
    if (!geoResult.isWithin || !user || !site || geo.lat === null || geo.lng === null) return;
    setLoading(true); setError(null); setPunchStep(null);
    try {
      setPunchStep("Verificando identidad (biometría)...");
      const webAuthnToken = await stepUpBiometrics(user.rut);

      setPunchStep("Abriendo cámara...");
      const blob = await openCameraModal();

      setPunchStep("Subiendo foto...");
      const { uploadUrl, photoKey } = await punchesService.getPresignedUrl();
      await punchesService.uploadPhoto(uploadUrl, blob);

      setPunchStep("Registrando marcación...");
      await punchesService.createPunch({
        siteId:       site.id,
        type,
        lat:          geo.lat,
        lng:          geo.lng,
        accuracy:     geo.accuracy ?? 10,
        deviceId:     getDeviceId(),
        timestamp:    new Date().toISOString(),
        photoKey,
        webAuthnToken,
      });

      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setPunches((p) => [...p, { type, time: timeStr }]);
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== "CANCELLED") {
        if (e instanceof ApiError) {
          if (e.code === "OUTSIDE_GEOFENCE")    setError("Estás fuera del área permitida");
          else if (e.code === "DUPLICATE_PUNCH") setError("Ya registraste esta marcación");
          else                                   setError("Error del servidor. Intenta de nuevo.");
        } else {
          setError("Error al registrar. Intenta de nuevo.");
        }
      }
    } finally {
      setLoading(false); setPunchStep(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const tabItems = [
    { id: "asistencia" as Tab, label: "Asistencia",
      d: "M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" },
    { id: "historial"  as Tab, label: "Historial",
      d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "mas"        as Tab, label: "Más",
      d: "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" },
  ];

  const masItems = [
    ...(canInstall ? [{ label: "Instalar app", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", action: install }] : []),
    { label: "Enviar informe",    icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",    action: undefined as (() => void) | undefined },
    { label: "Sincronizar datos", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", action: undefined },
    { label: "Acerca de GOTEST",  icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", action: undefined },
    { label: "Cerrar sesión",     icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1", action: handleLogout },
  ];

  return (
    <div className="flex flex-col w-full"
      style={{ height: "100dvh", fontFamily: "Poppins, sans-serif", background: "#0A111E" }}>

      {showCamera && (
        <CameraModal onCapture={handleCameraCapture} onCancel={handleCameraCancel} />
      )}

      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto">

        {/* ══════ ASISTENCIA ══════ */}
        {tab === "asistencia" && (
          <>
            {/* Hero */}
            <div className="flex flex-col items-center pt-8 pb-8 px-5 relative overflow-hidden"
              style={{ background: G.hero }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(circle, rgba(41,137,216,0.14) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }} />
              <div className="absolute -top-8 -right-8 w-36 h-36 pointer-events-none opacity-15">
                <svg viewBox="0 0 200 230" fill="none" className="w-full h-full">
                  <polygon points="100,5 195,55 195,175 100,225 5,175 5,55"
                    stroke="#2989d8" strokeWidth="1.5" fill="none" />
                </svg>
              </div>

              {/* Top row */}
              <div className="relative z-10 w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="GO"
                    className="h-5 w-auto object-contain brightness-0 invert opacity-70" />
                  <div className="h-3 w-px bg-white/15" />
                  <span className="text-white/55 text-xs tracking-wider">{site?.name ?? "..."}</span>
                </div>
                {/* Geofence badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold
                  ${geo.loading
                    ? "bg-white/5 text-white/30 border border-white/10"
                    : geoResult.isWithin
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                    : "bg-red-500/15 text-red-300 border border-red-500/20"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    geo.loading ? "bg-white/30" : geoResult.isWithin ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                  }`} />
                  {geo.loading
                    ? "Localizando..."
                    : `${geoResult.distanceMeters}m${geoResult.isWithin ? "" : " ✕"}`}
                </div>
              </div>

              {/* Saludo */}
              <p className="relative z-10 text-white/50 text-sm font-light w-full">
                Hola,{" "}
                <span className="text-white font-semibold">
                  {user?.name.split(" ")[0] ?? ""}
                </span>
              </p>

              {/* Reloj */}
              <div className="relative z-10 w-full flex items-end gap-0.5 mt-2">
                {[pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].map((seg, i) => (
                  <span key={i} className="flex items-end">
                    <span className="text-5xl font-thin text-white leading-none"
                      style={{ fontFamily: "ui-monospace,'SF Mono',monospace", letterSpacing: "-0.04em" }}>
                      {seg}
                    </span>
                    {i < 2 && (
                      <span className="text-3xl font-thin mb-1 mx-0.5"
                        style={{ color: "rgba(41,137,216,0.5)" }}>:</span>
                    )}
                  </span>
                ))}
              </div>
              <p className="relative z-10 w-full text-white/30 text-xs font-light mt-1 capitalize">
                {fmtDate(now)}
              </p>
            </div>

            {/* Punch Zone */}
            <div className="pt-3" style={{ background: "#0A111E" }}>
              <PunchCard
                next={nextType()}
                lastPunch={lastPunch}
                canPunch={canPunch}
                loading={loading}
                punchStep={punchStep}
                error={error}
                geo={geoResult}
                shift={shift}
                onPunch={handlePunch}
              />
            </div>
          </>
        )}

        {/* ══════ HISTORIAL ══════ */}
        {tab === "historial" && (
          <div className="flex flex-col">
            <div className="px-4 pt-8 pb-5 relative overflow-hidden" style={{ background: G.hero }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(circle, rgba(41,137,216,0.14) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }} />
              <h1 className="relative z-10 text-white text-lg font-semibold">Historial</h1>
              <p className="relative z-10 text-white/35 text-xs mt-0.5 capitalize">{fmtDate(now)}</p>
            </div>

            <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <button className="flex-1 py-3 text-white text-xs font-bold uppercase tracking-widest"
                style={{ background: G.btn }}>Asistencia</button>
              <button className="flex-1 py-3 text-xs font-medium uppercase tracking-widest"
                style={{ background: "#0D1625", color: "rgba(255,255,255,0.3)" }}>Turnos</button>
            </div>

            <div className="p-4">
              {punches.length === 0 ? (
                <div className="rounded-2xl p-8 text-center text-sm"
                  style={{ background: "#0D1625", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)" }}>
                  Sin marcaciones hoy
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: "#0D1625", border: "1px solid rgba(41,137,216,0.15)" }}>
                  <div className="flex items-center justify-between p-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <p className="font-semibold text-sm text-white/80">
                        {shift ? `${shift.start} – ${shift.end}` : "Sin turno"}
                      </p>
                      <p className="text-white/30 text-xs">{shift?.breakMinutes ?? 0} min colación</p>
                    </div>
                    <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: G.btn }}>
                      {now.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-5">
                    {PUNCH_SEQ.map((type) => {
                      const m = punches.find((p) => p.type === type);
                      return (
                        <div key={type} className="flex flex-col gap-0.5">
                          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">
                            {PUNCH_META[type].short}
                          </p>
                          <p className={`text-xl font-semibold tabular-nums ${m ? "text-white" : "text-white/15"}`}
                            style={{ fontFamily: m ? "ui-monospace,monospace" : undefined }}>
                            {m?.time ?? "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between px-4 py-3 text-xs"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                    <span>HT: <span className="font-semibold text-white/50">—</span></span>
                    <span>Reposiciones: <span className="font-semibold text-white/50">0</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ MÁS ══════ */}
        {tab === "mas" && (
          <div className="flex flex-col">
            <div className="px-4 pt-8 pb-5 relative overflow-hidden" style={{ background: G.hero }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(circle, rgba(41,137,216,0.14) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }} />
              <h1 className="relative z-10 text-white text-lg font-semibold">Configuración</h1>
              <div className="relative z-10 flex items-center gap-3 mt-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(41,137,216,0.15)", border: "1px solid rgba(41,137,216,0.22)" }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user?.name ?? ""}</p>
                  <p className="text-white/35 text-xs">{user?.rut ?? ""}</p>
                </div>
              </div>
            </div>

            <div style={{ background: "#0A111E" }}>
              {masItems.map(({ label, icon, action }) => (
                <button key={label}
                  onClick={action}
                  className="w-full px-4 py-4 flex items-center gap-4 text-left transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(41,137,216,0.05)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(41,137,216,0.10)", border: "1px solid rgba(41,137,216,0.18)" }}>
                    <svg className="w-4 h-4" fill="none" stroke="#7db9e8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</span>
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="rgba(255,255,255,0.15)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Dock ── */}
      <div className="flex-shrink-0 flex flex-col items-center pb-5 pt-2 relative"
        style={{ background: "#0A111E" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(41,137,216,0.18), transparent)" }} />
        <div className="flex items-center gap-1 p-1.5 rounded-full"
          style={{
            background: "rgba(10,17,30,0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 28px rgba(0,0,0,0.65), 0 0 48px rgba(41,137,216,0.06), 0 1px 0 rgba(255,255,255,0.04) inset",
          }}>
          {tabItems.map(({ id, label, d }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className="relative flex flex-col items-center justify-center gap-0.5 rounded-full transition-all active:scale-90"
                style={{
                  padding: "10px 20px",
                  minWidth: "4.5rem",
                  background: active ? "rgba(41,137,216,0.18)" : "transparent",
                  border: `1px solid ${active ? "rgba(41,137,216,0.32)" : "transparent"}`,
                  boxShadow: active ? "0 0 18px rgba(41,137,216,0.22)" : "none",
                }}>
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: active ? "#7db9e8" : "rgba(255,255,255,0.30)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d={d} />
                </svg>
                <span className="text-[9px] font-semibold tracking-wide"
                  style={{ color: active ? "#7db9e8" : "rgba(255,255,255,0.22)" }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
