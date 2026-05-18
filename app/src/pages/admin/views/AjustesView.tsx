import { useState } from "react";
import Card from "@/components/admin/Card";
import SectionHeader from "@/components/admin/SectionHeader";
import PrimaryBtn from "@/components/admin/PrimaryBtn";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

type SettingsTab = "empresa" | "turnos" | "integraciones";

export default function AjustesView() {
  const [tab,   setTab]   = useState<SettingsTab>("empresa");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaved(false);
    await new Promise((r) => setTimeout(r, 600));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = "border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-400 transition-colors w-full";
  const TABS: { id: SettingsTab; label: string }[] = [
    { id: "empresa",       label: "Empresa"       },
    { id: "turnos",        label: "Turnos"        },
    { id: "integraciones", label: "Integraciones" },
  ];

  return (
    <div className="p-6 flex flex-col gap-5">
      <SectionHeader title="Ajustes" sub="Configuración global de la plataforma" />

      <div className="flex gap-5">
        <div className="w-44 flex-shrink-0 flex flex-col gap-1">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? "text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
              style={tab === id ? { background: G.btn } : {}}>
              {label}
            </button>
          ))}
        </div>

        <Card className="flex-1 p-6">
          {tab === "empresa" && (
            <div className="flex flex-col gap-5 max-w-md">
              <p className="text-sm font-semibold text-gray-900">Información de la empresa</p>
              {[
                { label: "Nombre empresa",     placeholder: "Go Tecnologia",           type: "text"  },
                { label: "RUT empresa",         placeholder: "76.123.456-7",            type: "text"  },
                { label: "Correo de contacto",  placeholder: "admin@goalliance.cl",     type: "email" },
                { label: "Teléfono",            placeholder: "+56 2 2345 6789",          type: "tel"   },
              ].map(({ label, placeholder, type }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
                  <input type={type} defaultValue={placeholder} className={inputCls} />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Zona horaria</label>
                <select className={inputCls} defaultValue="America/Santiago">
                  <option value="America/Santiago">América/Santiago (UTC-4)</option>
                  <option value="America/Lima">América/Lima (UTC-5)</option>
                  <option value="America/Bogota">América/Bogotá (UTC-5)</option>
                </select>
              </div>
            </div>
          )}

          {tab === "turnos" && (
            <div className="flex flex-col gap-5 max-w-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Turnos configurados</p>
                <PrimaryBtn>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Nuevo turno
                </PrimaryBtn>
              </div>
              {[
                { name: "Turno Mañana", start: "08:00", end: "17:30", b: 60 },
                { name: "Turno Tarde",  start: "14:00", end: "22:00", b: 45 },
                { name: "Turno Noche",  start: "22:00", end: "06:00", b: 30 },
              ].map(({ name, start, end, b }) => (
                <div key={name} className="flex items-center gap-4 p-4 rounded-xl" style={{ border: "1px solid #E4EDF6", background: "#FAFBFF" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(41,137,216,0.08)" }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2989d8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{name}</p>
                    <p className="text-xs text-gray-400 font-mono">{start} – {end} · {b} min colación</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button className="font-medium transition-colors" style={{ color: "#2989d8" }}>Editar</button>
                    <span className="text-gray-200">·</span>
                    <button className="font-medium text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "integraciones" && (
            <div className="flex flex-col gap-5 max-w-md">
              <p className="text-sm font-semibold text-gray-900">API & Servicios externos</p>
              {[
                { label: "API Key",              value: "gk_live_••••••••••••••••XK9m"     },
                { label: "S3 Bucket (reportes)", value: "gotest-reports"                   },
                { label: "S3 Bucket (fotos)",    value: "gotest-punches"                   },
                { label: "Webhook URL",          value: "https://hooks.empresa.cl/gotest"  },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <input type="text" defaultValue={value} className={`${inputCls} font-mono pr-20`} />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
                            style={{ background: "rgba(41,137,216,0.08)", color: "#2989d8" }}>Copiar</button>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs" style={{ background: "rgba(41,137,216,0.06)", border: "1px solid rgba(41,137,216,0.15)", color: "#1e5799" }}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Las fotos de marcación se suben directamente a S3 vía presigned URL. Lambda no procesa binarios.
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: "1px solid #f1f5f9" }}>
            <PrimaryBtn onClick={save}>
              {saved
                ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Guardado</>
                : "Guardar cambios"}
            </PrimaryBtn>
            {saved && <span className="text-xs text-emerald-600 font-medium">Cambios aplicados</span>}
          </div>
        </Card>
      </div>
    </div>
  );
}
