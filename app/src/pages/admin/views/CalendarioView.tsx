import { useState, useEffect } from "react";
import { exceptionsService } from "@/services/exceptions.service";
import { employeesService } from "@/services/employees.service";
import type { CalendarException, ExceptionType, Employee } from "@/types";
import Card from "@/components/admin/Card";
import Avatar from "@/components/admin/Avatar";
import SectionHeader from "@/components/admin/SectionHeader";
import PrimaryBtn from "@/components/admin/PrimaryBtn";

interface BoostrHoliday {
  date: string;
  title: string;
  type: string;
  inalienable: boolean;
  extra: string;
}

const EXC_META: Record<ExceptionType, { label: string; bg: string; color: string; dot: string; chip: string }> = {
  feriado:    { label: "Feriado",    bg: "#fff7ed", color: "#92400e", dot: "#f59e0b", chip: "rgba(245,158,11,0.12)" },
  vacaciones: { label: "Vacaciones", bg: "#ecfdf5", color: "#065f46", dot: "#10b981", chip: "rgba(16,185,129,0.12)" },
};

const BOOSTR_META = { label: "Feriado oficial", bg: "#fef3c7", color: "#78350f", dot: "#d97706", chip: "rgba(217,119,6,0.13)" };

const now = new Date();

export default function CalendarioView() {
  const [monthOffset,    setMonthOffset]    = useState(0);
  const [exceptions,     setExceptions]     = useState<CalendarException[]>([]);
  const [employees,      setEmployees]      = useState<Employee[]>([]);
  const [boostrHolidays, setBoostrHolidays] = useState<BoostrHoliday[]>([]);
  const [boostrLoading,  setBoostrLoading]  = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [form,           setForm]           = useState({ type: "feriado", title: "", dateFrom: "", dateTo: "", employeeId: "", description: "" });
  const [saving,         setSaving]         = useState(false);

  const reload = () => {
    exceptionsService.getExceptions().then((res) => setExceptions(res.exceptions));
  };

  useEffect(() => {
    reload();
    employeesService.getEmployees().then((res) =>
      setEmployees(res.employees.filter((e) => e.status === "activo"))
    );
  }, []);

  useEffect(() => {
    setBoostrLoading(true);
    fetch("https://api.boostr.cl/holidays.json")
      .then((r) => r.json())
      .then((res: { status: string; data: BoostrHoliday[] }) => {
        if (res.status === "success") setBoostrHolidays(res.data);
      })
      .catch(() => null)
      .finally(() => setBoostrLoading(false));
  }, []);

  let m = now.getMonth() + 1 + monthOffset;
  let y = now.getFullYear();
  while (m > 12) { m -= 12; y++; }
  while (m < 1)  { m += 12; y--; }

  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDay    = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const DAYS   = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const ds         = (day: number) => `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const excsOn     = (day: number) => { const d = ds(day); return exceptions.filter((e) => e.dateFrom <= d && d <= e.dateTo); };
  const boostrOn   = (day: number) => boostrHolidays.filter((h) => h.date === ds(day));
  const isToday    = (day: number) => day === now.getDate() && m === now.getMonth() + 1 && y === now.getFullYear();
  const fmtDate    = (s: string)   => { const [fy, fm, fd] = s.split("-"); return `${fd}/${fm}/${fy}`; };
  const monthPad   = String(m).padStart(2, "0");

  const inputCls = "border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-400 transition-colors w-full";

  const openCreate = () => {
    setEditingId(null);
    setForm({ type: "feriado", title: "", dateFrom: "", dateTo: "", employeeId: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (exc: CalendarException) => {
    setEditingId(exc.id);
    setForm({ type: exc.type, title: exc.title, dateFrom: exc.dateFrom, dateTo: exc.dateTo, employeeId: exc.employeeId ?? "", description: exc.description ?? "" });
    setShowModal(true);
  };

  const submit = async () => {
    if (!form.title || !form.dateFrom || !form.dateTo) return;
    setSaving(true);
    try {
      if (editingId) {
        await exceptionsService.updateException(editingId, {
          title: form.title, dateFrom: form.dateFrom, dateTo: form.dateTo, description: form.description,
        });
      } else {
        await exceptionsService.createException({
          type: form.type as ExceptionType,
          title: form.title, dateFrom: form.dateFrom, dateTo: form.dateTo,
          employeeId: form.type === "vacaciones" ? (form.employeeId || null) : null,
          description: form.description || undefined,
        });
      }
      reload();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteExc = async (id: string) => {
    await exceptionsService.deleteException(id);
    reload();
  };

  const upcoming        = [...exceptions].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
  const boostrThisMonth = boostrHolidays
    .filter((h) => h.date.startsWith(`${y}-${monthPad}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-6 flex flex-col gap-5">
      <SectionHeader
        title="Calendario de Excepciones"
        sub="Feriados nacionales y vacaciones por colaborador"
        action={
          <PrimaryBtn onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Añadir Excepción
          </PrimaryBtn>
        }
      />

      <div className="grid grid-cols-3 gap-5">
        {/* Calendario */}
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setMonthOffset((o) => o - 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <p className="text-sm font-semibold text-gray-900">{MONTHS[m - 1]} {y}</p>
            <button onClick={() => setMonthOffset((o) => o + 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center py-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="min-h-[60px]" />;
              const excs    = excsOn(day);
              const bholidays = boostrOn(day);
              const tod     = isToday(day);
              return (
                <div key={day} className={`rounded-xl min-h-[60px] flex flex-col gap-1 p-1.5 transition-colors ${!tod ? "hover:bg-gray-50" : ""}`}
                     style={tod ? { background: "rgba(41,137,216,0.07)", border: "1.5px solid rgba(41,137,216,0.22)" } : { border: "1px solid transparent" }}>
                  <span className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full mx-auto ${tod ? "text-white" : "text-gray-500"}`}
                        style={tod ? { background: "linear-gradient(135deg,#1e5799,#2989d8)" } : {}}>
                    {day}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {bholidays.map((h) => (
                      <div key={h.date + h.title}
                           className="rounded text-[9px] font-semibold px-1 py-0.5 truncate leading-tight flex items-center gap-0.5"
                           style={{ background: BOOSTR_META.chip, color: BOOSTR_META.color }}
                           title={h.title}>
                        <span className="text-[8px]">🇨🇱</span>
                        <span className="truncate">{h.title}</span>
                      </div>
                    ))}
                    {excs.map((e) => {
                      const mt = EXC_META[e.type];
                      return (
                        <div key={e.id} className="rounded text-[9px] font-semibold px-1 py-0.5 truncate leading-tight"
                             style={{ background: mt.chip, color: mt.color }}>
                          {e.type === "feriado" ? "Feriado" : (e.employeeName?.split(" ")[0] ?? "Vacac.")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">🇨🇱</span>
              <span className="text-[11px] text-gray-500">{BOOSTR_META.label}</span>
            </div>
            {(Object.entries(EXC_META) as [ExceptionType, typeof EXC_META.feriado][]).map(([key, mt]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: mt.dot }} />
                <span className="text-[11px] text-gray-500">{mt.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Panel lateral */}
        <div className="flex flex-col gap-4">

          {/* Feriados Chile — mes actual */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-gray-900">Feriados {MONTHS[m - 1]}</p>
              {boostrLoading && (
                <svg className="animate-spin w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
            {!boostrLoading && boostrThisMonth.length === 0 && (
              <p className="text-xs text-gray-400 px-1">Sin feriados este mes</p>
            )}
            {boostrThisMonth.map((h) => (
              <Card key={h.date + h.title} className="p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                     style={{ background: BOOSTR_META.chip }}>
                  🇨🇱
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{h.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-gray-400">{fmtDate(h.date)}</span>
                    {h.inalienable && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(217,119,6,0.10)", color: "#92400e" }}>
                        Irrenunciable
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{h.type}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Excepciones manuales */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-900 px-1">Excepciones</p>
            {upcoming.length === 0 && (
              <Card className="p-8 flex flex-col items-center gap-2.5">
                <svg className="w-9 h-9" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-400 text-center">Sin excepciones configuradas</p>
              </Card>
            )}
            {upcoming.map((exc) => {
              const mt = EXC_META[exc.type];
              return (
                <Card key={exc.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: mt.chip }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: mt.dot }} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{exc.title}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md w-fit" style={{ background: mt.bg, color: mt.color }}>{mt.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(exc)} className="text-[11px] font-medium transition-colors" style={{ color: "#2989d8" }}>Editar</button>
                      <span className="text-gray-200 text-xs">·</span>
                      <button onClick={() => deleteExc(exc.id)} className="text-gray-300 hover:text-red-400 transition-colors text-xs leading-none">✕</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 pl-10">
                    <span className="text-xs font-mono text-gray-400">
                      {fmtDate(exc.dateFrom)}{exc.dateFrom !== exc.dateTo ? ` → ${fmtDate(exc.dateTo)}` : ""}
                    </span>
                    {exc.employeeName && (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={exc.employeeName} />
                        <span className="text-xs text-gray-600 font-medium truncate">{exc.employeeName}</span>
                      </div>
                    )}
                    {exc.description && <p className="text-[11px] text-gray-400">{exc.description}</p>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(7,15,30,0.65)" }}
             onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
               style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 25px 60px rgba(7,15,30,0.35)" }}>
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-gray-900">{editingId ? "Editar Excepción" : "Nueva Excepción"}</p>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {(["feriado", "vacaciones"] as const).map((t) => {
                  const mt = EXC_META[t];
                  return (
                    <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className="py-2.5 rounded-xl text-sm font-medium transition-all border"
                      style={form.type === t ? { background: mt.chip, color: mt.color, borderColor: mt.dot } : { background: "transparent", color: "#6b7280", borderColor: "#e5e7eb" }}>
                      {mt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Título</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={form.type === "feriado" ? "Ej: Día de la Independencia" : "Ej: Vacaciones anuales"}
                className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fecha inicio</label>
                <input type="date" value={form.dateFrom} onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fecha fin</label>
                <input type="date" value={form.dateTo} onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))} className={inputCls} />
              </div>
            </div>

            {form.type === "vacaciones" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Colaborador</label>
                <select value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} className={inputCls}>
                  <option value="">Seleccionar colaborador</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Descripción <span className="text-gray-300 normal-case font-normal">(opcional)</span>
              </label>
              <textarea value={form.description} rows={2}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Notas adicionales..."
                className={`${inputCls} resize-none`} />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <PrimaryBtn onClick={submit} disabled={saving}>
                {saving ? "Guardando..." : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{editingId ? "Guardar cambios" : "Guardar excepción"}</>
                )}
              </PrimaryBtn>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
