import { useState, useEffect, useMemo, useCallback } from "react";
import { reportsService } from "@/services/reports.service";
import type { ReportRecord, ReportStatus } from "@/types";
import Card from "@/components/admin/Card";
import Avatar from "@/components/admin/Avatar";
import PrimaryBtn from "@/components/admin/PrimaryBtn";

type AuditCard = { url: string; name: string; time: string; x: number; y: number };

const ATT_META: Record<ReportStatus, { label: string; bg: string; color: string; dot: string }> = {
  on_time:  { label: "A tiempo", bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
  late:     { label: "Atraso",   bg: "#fff7ed", color: "#92400e", dot: "#f59e0b" },
  absent:   { label: "Ausente",  bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
  overtime: { label: "H. Extra", bg: "#eff6ff", color: "#1e40af", dot: "#2989d8" },
};

const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + "01";

const PAGE = 10;

export default function AsistenciaView() {
  const [records,   setRecords]   = useState<ReportRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [site,      setSite]      = useState("Todos");
  const [status,    setStatus]    = useState("all");
  const [dateFrom,  setDateFrom]  = useState(monthStart);
  const [dateTo,    setDateTo]    = useState(today);
  const [page,      setPage]      = useState(1);
  const [auditCard, setAuditCard] = useState<AuditCard | null>(null);

  const loadReports = useCallback(() => {
    setLoading(true);
    reportsService
      .getReports({ from: dateFrom, to: dateTo })
      .then((res) => setRecords(res.records))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const allSites = useMemo(() => {
    const names = [...new Set(records.map((r) => r.siteName))].sort();
    return ["Todos", ...names];
  }, [records]);

  const filtered = useMemo(() =>
    records.filter((r) => {
      const ms   = r.name.toLowerCase().includes(search.toLowerCase()) || r.rut.includes(search);
      const mSit = site === "Todos" || r.siteName === site;
      const mSt  = status === "all"  || r.status === status;
      return ms && mSit && mSt;
    }),
    [records, search, site, status]
  );

  const paginated  = filtered.slice((page - 1) * PAGE, page * PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));

  const handleExport = () => {
    const header = ["Nombre", "RUT", "Sitio", "Fecha", "Entrada", "Sal.Col", "Ent.Col", "Salida", "HT", "Atraso(min)", "Estado"];
    const rows = filtered.map((r) => [
      r.name, r.rut, r.siteName, r.date,
      r.punches.entrada ?? "—", r.punches.salidaColacion ?? "—",
      r.punches.entradaColacion ?? "—", r.punches.salida ?? "—",
      r.horasTrabajadas || "—", r.minutosAtraso, ATT_META[r.status].label,
    ].join(","));
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asistencia_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const inputCls = "border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-700 focus:outline-none w-full";

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* KPI mini */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Presentes",  v: filtered.filter((r) => r.status !== "absent").length,  color: "#10b981" },
          { label: "Ausentes",   v: filtered.filter((r) => r.status === "absent").length,  color: "#ef4444" },
          { label: "Con atraso", v: filtered.filter((r) => r.status === "late").length,    color: "#f59e0b" },
          { label: "Horas extra",v: filtered.filter((r) => r.status === "overtime").length,color: "#2989d8" },
        ].map(({ label, v, color }) => (
          <Card key={label} className="px-5 py-4 flex items-center gap-3">
            <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: color }} />
            <div>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{v}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="px-5 py-4 flex flex-wrap gap-3 items-end">
        {[
          { label: "Desde", el: <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={inputCls} /> },
          { label: "Hasta", el: <input type="date" value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   setPage(1); }} className={inputCls} /> },
          { label: "Sitio", el: <select value={site} onChange={(e) => { setSite(e.target.value); setPage(1); }} className={inputCls}>{allSites.map((s) => <option key={s}>{s}</option>)}</select> },
          { label: "Estado", el: (
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputCls}>
              <option value="all">Todos</option>
              <option value="on_time">A tiempo</option>
              <option value="late">Atraso</option>
              <option value="absent">Ausente</option>
              <option value="overtime">H. Extra</option>
            </select>
          )},
        ].map(({ label, el }) => (
          <div key={label} className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
            {el}
          </div>
        ))}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Buscar</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Nombre o RUT" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={`${inputCls} pl-9`} />
          </div>
        </div>
        <div className="flex items-end">
          <PrimaryBtn onClick={handleExport}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </PrimaryBtn>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "linear-gradient(to right, #f8fafc, #eff6ff)" }}>
                  {["Empleado","RUT","Sitio","Fecha","Entrada","Sal. Col.","Ent. Col.","Salida","H. Trab.","Atraso","Estado","Verificación"].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr><td colSpan={12} className="px-4 py-12 text-center text-gray-400 text-sm">Sin resultados</td></tr>
                ) : paginated.map((r) => {
                  const s = ATT_META[r.status];
                  return (
                    <tr key={`${r.userId}-${r.date}`} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.name} />
                          <span className="font-medium text-gray-800 whitespace-nowrap text-xs">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">{r.rut}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{r.siteName}</td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap font-medium" style={{ color: r.punches.entrada ? "#1e5799" : "#d1d5db" }}>{r.punches.entrada ?? "—"}</td>
                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap text-gray-500">{r.punches.salidaColacion ?? "—"}</td>
                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap text-gray-500">{r.punches.entradaColacion ?? "—"}</td>
                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap font-medium" style={{ color: r.punches.salida ? "#1e5799" : "#d1d5db" }}>{r.punches.salida ?? "—"}</td>
                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap font-bold text-gray-800">{r.horasTrabajadas || "—"}</td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {r.minutosAtraso > 0
                          ? <span className="font-medium" style={{ color: "#f59e0b" }}>{r.minutosAtraso} min</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: s.bg, color: s.color }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {r.photoUrl ? (
                          <img
                            src={r.photoUrl}
                            alt={r.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md cursor-pointer transition-transform hover:scale-110 grayscale"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setAuditCard({ url: r.photoUrl!, name: r.name, time: r.punches.entrada ?? "", x: rect.right + 12, y: rect.top });
                            }}
                            onMouseLeave={() => setAuditCard(null)}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">← Ant.</button>
            <span className="text-xs font-medium text-gray-500 px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">Sig. →</button>
          </div>
        </div>
      </Card>

      {/* Audit hover-card */}
      {auditCard && (
        <div className="fixed z-50 pointer-events-none" style={{ left: auditCard.x, top: Math.min(auditCard.y - 80, window.innerHeight - 320) }}>
          <div style={{ background: "rgba(7,15,30,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "20px", boxShadow: "0 12px 48px rgba(7,15,30,0.45)", padding: "14px", width: "212px" }}>
            <img src={auditCard.url} alt="Verificación" style={{ width: "184px", height: "184px", borderRadius: "12px", objectFit: "cover", display: "block", filter: "grayscale(1)" }} />
            <div style={{ marginTop: "10px" }}>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0 }}>{auditCard.name.split(" ").slice(0, 2).join(" ")}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <span style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px" }}>Selfie marcación</span>
                {auditCard.time && <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", fontFamily: "monospace" }}>{auditCard.time}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
