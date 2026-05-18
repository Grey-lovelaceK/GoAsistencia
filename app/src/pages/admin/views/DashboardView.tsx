import { useState, useEffect } from "react";
import { reportsService } from "@/services/reports.service";
import { employeesService } from "@/services/employees.service";
import { sitesService } from "@/services/sites.service";
import type { ReportRecord, ReportStatus, Employee, Site } from "@/types";
import Card from "@/components/admin/Card";
import Avatar from "@/components/admin/Avatar";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

const WEEKLY = [
  { day: "Lun", present: 82, late: 8,  absent: 10 },
  { day: "Mar", present: 90, late: 5,  absent: 5  },
  { day: "Mié", present: 78, late: 12, absent: 10 },
  { day: "Jue", present: 86, late: 7,  absent: 7  },
  { day: "Vie", present: 94, late: 3,  absent: 3  },
];

const ATT_META: Record<ReportStatus, { label: string; bg: string; color: string; dot: string }> = {
  on_time:  { label: "A tiempo", bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
  late:     { label: "Atraso",   bg: "#fff7ed", color: "#92400e", dot: "#f59e0b" },
  absent:   { label: "Ausente",  bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
  overtime: { label: "H. Extra", bg: "#eff6ff", color: "#1e40af", dot: "#2989d8" },
};

function Spinner() {
  return (
    <div className="p-6 flex items-center justify-center h-64">
      <svg className="animate-spin w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export default function DashboardView() {
  const [records,   setRecords]   = useState<ReportRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites,     setSites]     = useState<Site[]>([]);
  const [loading,   setLoading]   = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    Promise.all([
      reportsService.getReports({ from: today, to: today }),
      employeesService.getEmployees(),
      sitesService.getSites(),
    ]).then(([rep, emp, sit]) => {
      setRecords(rep.records);
      setEmployees(emp.employees);
      setSites(sit.sites);
    }).finally(() => setLoading(false));
  }, [today]);

  if (loading) return <Spinner />;

  const totalActive = employees.filter((e) => e.status === "activo").length;
  const present     = records.filter((r) => r.status !== "absent").length;
  const absent      = records.filter((r) => r.status === "absent").length;
  const alerts      = records.filter((r) => r.minutosAtraso > 30).length;

  const KPIS = [
    { label: "Empleados activos", value: totalActive, sub: "en plataforma",  color: "#2989d8", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
    { label: "Presentes hoy",     value: present,     sub: "con marcación",  color: "#10b981", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Ausentes hoy",      value: absent,      sub: "sin marcación",  color: "#ef4444", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Alertas activas",   value: alerts,      sub: "atraso >30 min", color: "#f59e0b", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  ];

  const maxVal = Math.max(...WEEKLY.map((w) => w.present), 1);

  const siteStats = sites.filter((s) => s.active).map((site) => {
    const siteEmps   = employees.filter((e) => e.siteId === site.id && e.status === "activo").length;
    const sitePunches = records.filter((r) => r.siteId === site.id && r.status !== "absent").length;
    return { site, siteEmps, sitePunches };
  });

  const recentActivity = [...records]
    .sort((a, b) => {
      const aT = a.punches.salida ?? a.punches.entradaColacion ?? a.punches.salidaColacion ?? a.punches.entrada ?? "";
      const bT = b.punches.salida ?? b.punches.entradaColacion ?? b.punches.salidaColacion ?? b.punches.entrada ?? "";
      return bT.localeCompare(aT);
    })
    .slice(0, 5);

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {KPIS.map(({ label, value, sub, color, icon }) => (
          <Card key={label} className="px-5 py-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: `${color}18` }}>
              <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none tabular-nums">{value}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-400">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Gráfico semanal */}
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-gray-900">Asistencia semanal</p>
              <p className="text-xs text-gray-400 mt-0.5">Semana actual</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              {[{ color: "#2989d8", label: "Presentes" }, { color: "#f59e0b", label: "Atrasos" }, { color: "#ef4444", label: "Ausentes" }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {WEEKLY.map(({ day, present: p, late, absent: a }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex flex-col gap-0.5 items-stretch" style={{ height: "148px", justifyContent: "flex-end" }}>
                  <div className="w-full rounded-sm" style={{ height: `${(a / maxVal) * 130}px`, background: "#fecaca", minHeight: a > 0 ? 4 : 0 }} />
                  <div className="w-full rounded-sm" style={{ height: `${(late / maxVal) * 130}px`, background: "#fde68a", minHeight: late > 0 ? 4 : 0 }} />
                  <div className="w-full rounded-t-md" style={{ height: `${(p / maxVal) * 130}px`, background: G.btn }} />
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Panel lateral */}
        <div className="flex flex-col gap-4">
          <Card className="p-4 flex-1">
            <p className="text-sm font-semibold text-gray-900 mb-3">Asistencia por sitio</p>
            <div className="flex flex-col gap-3">
              {siteStats.map(({ site, siteEmps, sitePunches }) => {
                const pct = siteEmps > 0 ? Math.round((sitePunches / siteEmps) * 100) : 0;
                return (
                  <div key={site.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 font-medium">{site.name}</span>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: "#2989d8" }}>
                        {sitePunches}/{siteEmps}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: G.btn }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Última actividad</p>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-gray-400">Sin actividad hoy</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentActivity.map((r, i) => {
                  const lastTime = r.punches.salida ?? r.punches.entradaColacion ?? r.punches.salidaColacion ?? r.punches.entrada;
                  const punchLabel = r.punches.salida ? "Salida" : r.punches.entradaColacion ? "Ent. Col." : r.punches.salidaColacion ? "Sal. Col." : "Entrada";
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <Avatar name={r.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{r.name.split(" ")[0]}</p>
                        <p className="text-[10px] text-gray-400 truncate">{punchLabel} · {r.siteName.split(" ")[0]}</p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold" style={{ color: "#2989d8" }}>{lastTime ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Tabla hoy */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Resumen de hoy</p>
          <span className="text-[11px] text-gray-400">{today}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Empleado", "Sitio", "Entrada", "Salida", "HT", "Estado"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.slice(0, 5).map((r) => {
                const s = ATT_META[r.status];
                return (
                  <tr key={r.userId} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.name} />
                        <span className="font-medium text-gray-800">{r.name.split(" ").slice(0, 2).join(" ")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{r.siteName}</td>
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: r.punches.entrada ? "#1e5799" : "#d1d5db" }}>{r.punches.entrada ?? "—"}</td>
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: r.punches.salida ? "#1e5799" : "#d1d5db" }}>{r.punches.salida ?? "—"}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-700">{r.horasTrabajadas || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full w-fit"
                            style={{ background: s.bg, color: s.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
