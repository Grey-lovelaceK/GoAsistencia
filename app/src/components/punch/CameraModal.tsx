import { useState, useEffect, useRef } from "react";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

type CamStep = "preview" | "captured" | "uploading";

interface Props {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

export default function CameraModal({ onCapture, onCancel }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step,     setStep]     = useState<CamStep>("preview");
  const [camError, setCamError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 640 } })
      .then((s) => {
        if (!active) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => { if (active) setCamError("No se pudo acceder a la cámara."); });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 640;
    c.getContext("2d")!.drawImage(v, 0, 0);
    setSnapshot(c.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStep("captured");
  };

  const retake = () => {
    setSnapshot(null);
    setStep("preview");
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then((s) => {
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    });
  };

  const confirm = () => {
    if (!snapshot || !canvasRef.current) return;
    setStep("uploading");
    canvasRef.current.toBlob((blob) => { if (blob) onCapture(blob); }, "image/jpeg", 0.85);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-5"
      style={{ background: "rgba(2,6,18,0.97)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-sm flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
              Selfie de marcación
            </span>
          </div>
          <button onClick={onCancel} className="text-white/25 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative w-full aspect-square rounded-2xl overflow-hidden"
          style={{ background: "#060E1D", border: "1px solid rgba(41,137,216,0.3)", boxShadow: "0 0 40px rgba(41,137,216,0.10)" }}>

          {step === "preview" && !camError && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-52 h-64 rounded-full"
                  style={{ border: "1.5px dashed rgba(41,137,216,0.45)" }} />
              </div>
              {(["top-4 left-4 border-t border-l", "top-4 right-4 border-t border-r",
                "bottom-4 left-4 border-b border-l", "bottom-4 right-4 border-b border-r"] as string[]).map((cls) => (
                <div key={cls} className={`absolute ${cls} w-5 h-5 pointer-events-none z-10`}
                  style={{ borderColor: "rgba(41,137,216,0.65)" }} />
              ))}
            </>
          )}

          {step === "preview" && (
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover scale-x-[-1]" />
          )}
          {step === "captured" && snapshot && (
            <img src={snapshot} alt="selfie" className="w-full h-full object-cover scale-x-[-1]" />
          )}
          {step === "uploading" && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <svg className="animate-spin w-10 h-10" fill="none" viewBox="0 0 24 24" style={{ color: "#2989d8" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-white/35 text-sm">Subiendo foto...</p>
            </div>
          )}
          {camError && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-6 text-center">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              <p className="text-red-300 text-sm">{camError}</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <p className="text-white/25 text-xs text-center">
          {step === "preview" && !camError
            ? "Centra tu rostro en el óvalo"
            : step === "captured"
            ? "¿La foto se ve bien?"
            : ""}
        </p>

        <div className="flex gap-3">
          {step === "preview" && !camError && (
            <button onClick={capture}
              className="flex-1 py-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{ background: G.btn, boxShadow: "0 4px 20px rgba(41,137,216,0.4)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capturar
            </button>
          )}
          {step === "captured" && (
            <>
              <button onClick={retake}
                className="flex-1 py-4 rounded-xl text-sm font-medium active:scale-95 transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.45)" }}>
                Repetir
              </button>
              <button onClick={confirm}
                className="flex-1 py-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                style={{ background: G.btn, boxShadow: "0 4px 20px rgba(41,137,216,0.4)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Usar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
