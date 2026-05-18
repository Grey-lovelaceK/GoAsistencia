import { useState, useEffect } from "react";
import { sitesService } from "@/services/sites.service";
import { employeesService } from "@/services/employees.service";
import type { Site, Employee } from "@/types";
import Card from "@/components/admin/Card";
import SectionHeader from "@/components/admin/SectionHeader";
import PrimaryBtn from "@/components/admin/PrimaryBtn";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

export default function SitiosView() {
  const [sites,         setSites]         = useState<Site[]>([]);
  const [employees,     setEmployees]     = useState<Employee[]>([]);
  const [activeOverride,setActiveOverride]= useState<Record<string, boolean>>({});
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([sitesService.getSites(), employeesService.getEmployees()])
      .then(([sit, emp]) => {
        setSites(sit.sites);
        setEmployees(emp.employees);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string, current: boolean) => {
    const next = !current;
    setActiveOverride((prev) => ({ ...prev, [id]: next }));
    sitesService.updateSite(id, { active: next }).catch(() => {
      setActiveOverride((prev) => ({ ...prev, [id]: current }));
    });
  };

  const isActive = (site: Site) =>
    activeOverride[site.id] !== undefined ? activeOverride[site.id] : site.active;

  const activeSites   = sites.filter((s) => isActive(s)).length;
  const inactiveSites = sites.length - activeSites;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <svg className="animate-spin w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <SectionHeader
        title="Sitios de trabajo"
        sub={`${activeSites} activos · ${inactiveSites} inactivos`}
        action={
          <PrimaryBtn>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo sitio
          </PrimaryBtn>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        {sites.map((site) => {
          const active      = isActive(site);
          const empCount    = employees.filter((e) => e.siteId === site.id && e.status === "activo").length;
          const shift       = site.shifts?.[0];
          return (
            <Card key={site.id} className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: active ? "rgba(41,137,216,0.10)" : "#f1f5f9", border: `1px solid ${active ? "rgba(41,137,216,0.2)" : "#e2e8f0"}` }}>
                    <svg className="w-5 h-5" fill="none" stroke={active ? "#2989d8" : "#94a3b8"} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{site.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{site.address}</p>
                  </div>
                </div>
                <button onClick={() => toggle(site.id, active)}
                  className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${active ? "" : "opacity-60"}`}
                  style={{ background: active ? G.btn : "#e2e8f0" }}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                {[
                  { label: "Empleados", value: empCount },
                  { label: "Radio (m)", value: site.radiusMeters },
                  { label: "Turno",     value: shift ? `${shift.start}–${shift.end}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-lg font-bold tabular-nums" style={{ color: active ? "#1e5799" : "#94a3b8" }}>{value}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-gray-400">
                  {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                </p>
                <div className="flex gap-2">
                  <button className="text-xs font-medium transition-colors" style={{ color: "#2989d8" }}>Editar</button>
                  <span className="text-gray-200">·</span>
                  <button className="text-xs font-medium text-gray-400 hover:text-blue-500 transition-colors">Ver mapa</button>
                </div>
              </div>

              {active && empCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">Empleados activos</span>
                    <span className="text-[10px] font-semibold" style={{ color: "#2989d8" }}>{empCount}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: "100%", background: G.btn }} />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
