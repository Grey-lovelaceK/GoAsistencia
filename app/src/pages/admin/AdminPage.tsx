import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import DashboardView  from "./views/DashboardView";
import AsistenciaView from "./views/AsistenciaView";
import EmpleadosView  from "./views/EmpleadosView";
import SitiosView     from "./views/SitiosView";
import ReportesView   from "./views/ReportesView";
import AjustesView    from "./views/AjustesView";
import CalendarioView from "./views/CalendarioView";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)", nav: "#070F1E" } as const;

type ViewId = "dashboard" | "asistencia" | "empleados" | "sitios" | "reportes" | "ajustes" | "calendario";

const NAV_ITEMS: { id: ViewId; label: string; icon: string }[] = [
  { id: "dashboard",  label: "Dashboard",   icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "asistencia", label: "Asistencia",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: "empleados",  label: "Empleados",   icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: "sitios",     label: "Sitios",      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
  { id: "reportes",   label: "Reportes",    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "ajustes",    label: "Ajustes",     icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "calendario", label: "Calendario",  icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

const PAGE_TITLES: Record<ViewId, { title: string; sub: string }> = {
  dashboard:  { title: "Dashboard",               sub: "Resumen general"                           },
  asistencia: { title: "Control de Asistencia",   sub: "Registros de marcación"                    },
  empleados:  { title: "Empleados",               sub: "Gestión de personas"                       },
  sitios:     { title: "Sitios de trabajo",       sub: "Sedes y geofences"                         },
  reportes:   { title: "Reportes",                sub: "Generación y exportación de datos"         },
  ajustes:    { title: "Ajustes",                 sub: "Configuración de la plataforma"            },
  calendario: { title: "Calendario de Excepciones", sub: "Feriados y vacaciones por colaborador"  },
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [activeView, setActiveView] = useState<ViewId>("dashboard");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const { title, sub } = PAGE_TITLES[activeView];

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden" style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: G.nav }}>
        <div className="px-5 py-5 relative overflow-hidden" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(41,137,216,0.15) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
          <img src="/logo.png" alt="GO Tecnología" className="relative z-10 h-9 w-auto object-contain brightness-0 invert opacity-90" />
        </div>

        <nav className="px-3 py-3 flex-1 overflow-y-auto">
          <p className="text-white/25 text-[9px] font-bold tracking-[0.2em] uppercase px-3 mb-2 mt-1">Navegación</p>
          {NAV_ITEMS.map(({ id, label, icon }) => {
            const active = activeView === id;
            return (
              <button key={id} onClick={() => setActiveView(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left mb-0.5 transition-all ${active ? "text-white font-medium" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}
                style={active ? { background: G.btn } : {}}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                </svg>
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: G.btn }}>
              {user ? initials(user.name) : "AD"}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white text-xs font-medium truncate">{user?.name ?? "Administrador"}</p>
              <p className="text-white/30 text-[10px] truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/35 hover:text-white/60 hover:bg-white/5 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-7 w-0.5 rounded-full" style={{ background: G.btn }} />
            <div>
              <h1 className="text-base font-semibold text-gray-900">{title}</h1>
              <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-50" style={{ border: "1px solid #E4EDF6" }}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: G.btn }}>
              {user ? initials(user.name) : "AD"}
            </div>
          </div>
        </header>

        {/* Vista activa */}
        {activeView === "dashboard"  && <DashboardView  />}
        {activeView === "asistencia" && <AsistenciaView />}
        {activeView === "empleados"  && <EmpleadosView  />}
        {activeView === "sitios"     && <SitiosView     />}
        {activeView === "reportes"   && <ReportesView   />}
        {activeView === "ajustes"    && <AjustesView    />}
        {activeView === "calendario" && <CalendarioView />}
      </main>
    </div>
  );
}
