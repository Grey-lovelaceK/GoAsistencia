import { useState, useEffect, useMemo } from "react";
import { employeesService } from "@/services/employees.service";
import { sitesService } from "@/services/sites.service";
import type { Employee, Site, EmployeeRole } from "@/types";
import Card from "@/components/admin/Card";
import Avatar from "@/components/admin/Avatar";
import SectionHeader from "@/components/admin/SectionHeader";
import PrimaryBtn from "@/components/admin/PrimaryBtn";

type SubView = "list" | "form";

interface EmpForm {
  name: string; rut: string; email: string; password: string;
  siteId: string; role: EmployeeRole; status: "activo" | "inactivo";
}

const EMPTY_FORM: EmpForm = { name: "", rut: "", email: "", password: "", siteId: "", role: "employee", status: "activo" };

const ROLE_LABELS: Record<EmployeeRole, string> = {
  employee:   "Empleado",
  supervisor: "Supervisor",
  admin:      "Administrador",
};

export default function EmpleadosView() {
  const [subView,    setSubView]    = useState<SubView>("list");
  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [sites,      setSites]      = useState<Site[]>([]);
  const [editing,    setEditing]    = useState<Employee | null>(null);
  const [form,       setForm]       = useState<EmpForm>(EMPTY_FORM);
  const [search,     setSearch]     = useState("");
  const [siteF,      setSiteF]      = useState("Todos");
  const [statusF,    setStatusF]    = useState("all");
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);

  const reload = () => {
    setLoading(true);
    Promise.all([employeesService.getEmployees(), sitesService.getSites()])
      .then(([emp, sit]) => { setEmployees(emp.employees); setSites(sit.sites); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => employees.filter((e) => {
    const ms    = e.name.toLowerCase().includes(search.toLowerCase()) || e.rut.includes(search);
    const mSite = siteF   === "Todos" || e.siteName === siteF;
    const mSt   = statusF === "all"   || e.status === statusF;
    return ms && mSite && mSt;
  }), [employees, search, siteF, statusF]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, siteId: sites[0]?.id ?? "" });
    setSubView("form");
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ name: emp.name, rut: emp.rut, email: emp.email, password: "", siteId: emp.siteId, role: emp.role, status: emp.status });
    setSubView("form");
  };

  const saveForm = async () => {
    if (!form.name || !form.rut || !form.email || !form.siteId) return;
    setSaving(true);
    try {
      if (editing) {
        await employeesService.updateEmployee(editing.id, {
          name: form.name, email: form.email, siteId: form.siteId,
          role: form.role, status: form.status,
        });
      } else {
        if (!form.password) return;
        await employeesService.createEmployee({
          rut: form.rut, name: form.name, email: form.email,
          siteId: form.siteId, role: form.role, password: form.password,
        });
      }
      reload();
      setSubView("list");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (emp: Employee) => {
    const newStatus = emp.status === "activo" ? "inactivo" : "activo";
    await employeesService.updateEmployee(emp.id, { status: newStatus });
    reload();
  };

  const deleteEmp = async (id: string) => {
    await employeesService.deleteEmployee(id);
    setDelConfirm(null);
    reload();
  };

  const inputCls = "border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-400 transition-colors w-full";
  const allSiteNames = ["Todos", ...sites.map((s) => s.name)];

  // ── Form ──────────────────────────────────────────────────────────────────────
  if (subView === "form") {
    const isNew = !editing;
    return (
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <button onClick={() => setSubView("list")} className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "#2989d8" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Empleados
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-700">
            {isNew ? "Nuevo empleado" : `Editar · ${editing!.name.split(" ").slice(0, 2).join(" ")}`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2 p-6 flex flex-col gap-5">
            <p className="text-sm font-semibold text-gray-900">Datos personales</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nombre completo</label>
                <input type="text" placeholder="Nombre Apellido" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">RUT</label>
                <input type="text" placeholder="12.345.678-9" value={form.rut}
                  onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))} disabled={!isNew} className={`${inputCls} ${!isNew ? "opacity-60" : ""}`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Correo electrónico</label>
                <input type="email" placeholder="nombre@goalliance.cl" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
              </div>
              {isNew && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Contraseña inicial</label>
                  <input type="password" placeholder="••••••••" value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputCls} />
                </div>
              )}
            </div>

            <div className="pt-1" style={{ borderTop: "1px solid #f1f5f9" }}>
              <p className="text-sm font-semibold text-gray-900 mb-4">Asignación</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sitio</label>
                  <select value={form.siteId} onChange={(e) => setForm((f) => ({ ...f, siteId: e.target.value }))} className={inputCls}>
                    {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rol</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as EmployeeRole }))} className={inputCls}>
                    <option value="employee">Empleado</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estado</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "activo" | "inactivo" }))} className={inputCls}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid #f1f5f9" }}>
              <PrimaryBtn onClick={saveForm} disabled={saving}>
                {saving ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Guardando...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{isNew ? "Crear empleado" : "Guardar cambios"}</>
                )}
              </PrimaryBtn>
              <button onClick={() => setSubView("list")} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            {!isNew && (
              <Card className="p-5 flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Información</p>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creado</span>
                    <span className="font-medium text-gray-700">{editing!.createdAt.slice(0, 10)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Passkey</span>
                    <span className={editing!.passkey ? "text-emerald-600 font-medium" : "text-gray-300"}>
                      {editing!.passkey ? "Registrada" : "Sin passkey"}
                    </span>
                  </div>
                </div>
              </Card>
            )}
            <Card className="p-5 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles disponibles</p>
              {[
                { r: "Empleado",      desc: "Acceso solo a marcaje móvil"          },
                { r: "Supervisor",    desc: "Marcaje móvil + vista de su equipo"   },
                { r: "Administrador", desc: "Acceso completo al panel"             },
              ].map(({ r, desc }) => (
                <div key={r} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-gray-700">{r}</span>
                  <span className="text-[10px] text-gray-400">{desc}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 flex flex-col gap-5">
      <SectionHeader
        title="Empleados"
        sub={`${employees.filter((e) => e.status === "activo").length} activos · ${employees.filter((e) => e.status === "inactivo").length} inactivos`}
        action={
          <PrimaryBtn onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo empleado
          </PrimaryBtn>
        }
      />

      <Card className="px-5 py-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Buscar</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Nombre o RUT" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sitio</label>
          <select value={siteF} onChange={(e) => setSiteF(e.target.value)} className={inputCls}>
            {allSiteNames.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estado</label>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className={inputCls}>
            <option value="all">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
          </select>
        </div>
      </Card>

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
                  {["Empleado","RUT","Sitio","Rol","Passkey","Estado","Acciones"].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">Sin resultados</td></tr>
                ) : filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.name} />
                        <div>
                          <p className="font-medium text-gray-800 text-xs whitespace-nowrap">{emp.name}</p>
                          <p className="text-gray-400 text-[10px]">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">{emp.rut}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{emp.siteName}</td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: "rgba(41,137,216,0.08)", color: "#1e5799" }}>{ROLE_LABELS[emp.role] ?? emp.role}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      {emp.passkey
                        ? <span className="flex items-center gap-1 text-emerald-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Registrada</span>
                        : <span className="text-gray-300 text-[10px]">Sin passkey</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full w-fit ${emp.status === "activo" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "activo" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        {emp.status === "activo" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(emp)} className="text-xs font-medium transition-colors" style={{ color: "#2989d8" }}>Editar</button>
                        <span className="text-gray-200">·</span>
                        <button onClick={() => toggleStatus(emp)} className="text-xs font-medium text-gray-400 hover:text-amber-500 transition-colors">
                          {emp.status === "activo" ? "Desactivar" : "Activar"}
                        </button>
                        <span className="text-gray-200">·</span>
                        {delConfirm === emp.id ? (
                          <span className="flex items-center gap-1">
                            <button onClick={() => deleteEmp(emp.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">Confirmar</button>
                            <span className="text-gray-200">·</span>
                            <button onClick={() => setDelConfirm(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setDelConfirm(emp.id)} className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors">Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-gray-50">
          <p className="text-xs text-gray-400">{filtered.length} empleado{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </Card>
    </div>
  );
}
