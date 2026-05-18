import { useState } from "react";
import { reportsService } from "@/services/reports.service";
import type { ReportRecord, ReportStatus } from "@/types";
import Card from "@/components/admin/Card";
import SectionHeader from "@/components/admin/SectionHeader";
import PrimaryBtn from "@/components/admin/PrimaryBtn";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

const ATT_META: Record<ReportStatus, { label: string; bg: string; color: string }> = {
  on_time:  { label: "A tiempo", bg: "#ecfdf5", color: "#065f46" },
  late:     { label: "Atraso",   bg: "#fff7ed", color: "#92400e" },
  absent:   { label: "Ausente",  bg: "#fef2f2", color: "#991b1b" },
  overtime: { label: "H. Extra", bg: "#eff6ff", color: "#1e40af" },
};

const today      = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + "01";

export default function ReportesView() {
  const [type,      setType]      = useState<"diario" | "semanal" | "mensual">("mensual");
  const [site,      setSite]      = useState("Todos");
  const [dateFrom,  setDateFrom]  = useState(monthStart);
  const [dateTo,    setDateTo]    = useState(today);
  const [records,   setRecords]   = useState<ReportRecord[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [exporting, setExporting] = useState(false);

  const generate = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const res = await reportsService.getReports({ from: dateFrom, to: dateTo });
      setRecords(res.records);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await reportsService.exportReports({ from: dateFrom, to: dateTo });
      window.open(res.url, "_blank");
    } finally {
      setExporting(false);
    }
  };

  const exportCsv = () => {
    const header = ["Nombre", "RUT", "Sitio", "Fecha", "Entrada", "Salida", "HT", "Atraso", "Estado"];
    const rows = records.map((r) => [
      r.name, r.rut, r.siteName, r.date,
      r.punches.entrada ?? "—", r.punches.salida ?? "—",
      r.horasTrabajadas || "—", r.minutosAtraso, ATT_META[r.status].label,
    ].join(","));
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reporte_${dateFrom}_${dateTo}.csv`;
    a.click();
  };

  const inputCls = "border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700 focus:outline-none w-full";

  return (
    <div className="p-6 flex flex-col gap-5">
      <SectionHeader title="Generación de reportes" sub="Exporta datos de asistencia en formato Excel o CSV" />

      <div className="grid grid-cols-3 gap-5">
        {/* Configuración */}
        <Card className="p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-gray-900">Configuración</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tipo de reporte</label>
            <div className="flex flex-col gap-2">
              {(["diario", "semanal", "mensual"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2.5 cursor-pointer">
                  <div onClick={() => setType(t)} className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all" style={{ borderColor: type === t ? "#2989d8" : "#d1d5db" }}>
                    {type === t && <div className="w-2 h-2 rounded-full" style={{ background: "#2989d8" }} />}
                  </div>
                  <span className="text-sm text-gray-600 capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rango de fechas</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
            <input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sitio</label>
            <select value={site} onChange={(e) => setSite(e.target.value)} className={inputCls}>
              <option>Todos</option>
            </select>
          </div>

          <button onClick={generate} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60"
            style={{ background: G.btn, boxShadow: "0 4px 14px rgba(41,137,216,0.3)" }}>
            {loading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generando...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Generar reporte</>
            )}
          </button>
        </Card>

        {/* Resultado */}
        <div className="col-span-2 flex flex-col gap-4">
          {!generated && !loading && (
            <Card className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(41,137,216,0.08)" }}>
                <svg className="w-7 h-7" fill="none" stroke="#2989d8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Configura y genera el reporte</p>
              <p className="text-xs text-gray-300 text-center max-w-xs">Selecciona el tipo, rango de fechas y sitio en el panel izquierdo</p>
            </Card>
          )}

          {generated && (
            <>
              <Card className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Reporte listo</p>
                  <p className="text-xs text-gray-400 mt-0.5">{type.charAt(0).toUpperCase() + type.slice(1)} · {site} · {dateFrom} → {dateTo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportCsv} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-all hover:bg-gray-50" style={{ borderColor: "#2989d8", color: "#2989d8" }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    CSV
                  </button>
                  <PrimaryBtn onClick={exportExcel} disabled={exporting}>
                    {exporting ? "Generando..." : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Excel .xlsx</>
                    )}
                  </PrimaryBtn>
                </div>
              </Card>

              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs" style={{ background: "rgba(41,137,216,0.06)", border: "1px solid rgba(41,137,216,0.15)", color: "#1e5799" }}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                El archivo .xlsx se genera vía <strong className="mx-1">GET /reports/export</strong> y se sirve como presigned URL de S3 con TTL de 15 minutos.
              </div>

              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Vista previa ({records.length} registros)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Empleado", "RUT", "Sitio", "Entrada", "Salida", "HT", "Atraso", "Estado"].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {records.map((r) => {
                        const s = ATT_META[r.status];
                        return (
                          <tr key={`${r.userId}-${r.date}`} className="hover:bg-blue-50/20">
                            <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">{r.name.split(" ").slice(0, 2).join(" ")}</td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{r.rut}</td>
                            <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{r.siteName}</td>
                            <td className="px-4 py-2.5 font-mono font-medium whitespace-nowrap" style={{ color: r.punches.entrada ? "#1e5799" : "#d1d5db" }}>{r.punches.entrada ?? "—"}</td>
                            <td className="px-4 py-2.5 font-mono font-medium whitespace-nowrap" style={{ color: r.punches.salida ? "#1e5799" : "#d1d5db" }}>{r.punches.salida ?? "—"}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-gray-700 whitespace-nowrap">{r.horasTrabajadas || "—"}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {r.minutosAtraso > 0 ? <span style={{ color: "#f59e0b" }} className="font-medium">{r.minutosAtraso}m</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
