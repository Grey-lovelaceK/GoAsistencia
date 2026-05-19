import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sitesService } from "@/services/sites.service";
import { empresasService, type Empresa } from "@/services/empresas.service";
import type { Site } from "@/types";
import Card from "@/components/admin/Card";
import SectionHeader from "@/components/admin/SectionHeader";
import PrimaryBtn from "@/components/admin/PrimaryBtn";

const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

type SubView = "list" | "form";

interface SiteForm {
  empresaId: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  radiusMeters: string;
}

const EMPTY_FORM: SiteForm = { empresaId: "", name: "", address: "", lat: "", lng: "", radiusMeters: "1000" };

export default function SitiosView() {
  const { user } = useAuth();
  const isPlatformAdmin = user?.isPlatformAdmin === true;

  const [subView,         setSubView]         = useState<SubView>("list");
  const [sites,           setSites]           = useState<Site[]>([]);
  const [empresas,        setEmpresas]        = useState<Empresa[]>([]);
  const [editing,         setEditing]         = useState<Site | null>(null);
  const [form,            setForm]            = useState<SiteForm>(EMPTY_FORM);
  const [activeOverride,  setActiveOverride]  = useState<Record<string, boolean>>({});
  const [saving,          setSaving]          = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [formError,       setFormError]       = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    const reqs: Promise<unknown>[] = [sitesService.getSites()];
    if (isPlatformAdmin) reqs.push(empresasService.getEmpresas());
    Promise.all(reqs)
      .then(([sit, ems]) => {
        setSites((sit as { sites: Site[] }).sites);
        if (ems) setEmpresas((ems as { empresas: Empresa[] }).empresas);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const toggle = (id: string, current: boolean) => {
    const next = !current;
    setActiveOverride((prev) => ({ ...prev, [id]: next }));
    sitesService.updateSite(id, { active: next }).catch(() => {
      setActiveOverride((prev) => ({ ...prev, [id]: current }));
    });
  };

  const isActive = (site: Site) =>
    activeOverride[site.id] !== undefined ? activeOverride[site.id] : site.active;

  const openCreate = () => {
    const defaultEmpresa = isPlatformAdmin ? (empresas[0]?.id ?? "") : (user?.empresaId ?? "");
    setEditing(null);
    setForm({ ...EMPTY_FORM, empresaId: defaultEmpresa });
    setFormError(null);
    setSubView("form");
  };

  const openEdit = (site: Site) => {
    setEditing(site);
    setForm({
      empresaId: site.empresaId,
      name: site.name,
      address: site.address,
      lat: String(site.lat),
      lng: String(site.lng),
      radiusMeters: String(site.radiusMeters),
    });
    setFormError(null);
    setSubView("form");
  };

  const saveForm = async () => {
    if (!form.name || !form.address || !form.lat || !form.lng) {
      setFormError("Nombre, dirección, latitud y longitud son obligatorios");
      return;
    }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    const radiusMeters = parseInt(form.radiusMeters, 10);
    if (isNaN(lat) || isNaN(lng)) { setFormError("Latitud y longitud deben ser números"); return; }
    if (isNaN(radiusMeters) || radiusMeters <= 0) { setFormError("Radio debe ser mayor a 0"); return; }

    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await sitesService.updateSite(editing.id, {
          name: form.name, address: form.address, lat, lng, radiusMeters,
          empresaId: isPlatformAdmin ? form.empresaId : undefined,
        });
      } else {
        if (!form.empresaId) { setFormError("Selecciona una empresa"); setSaving(false); return; }
        await sitesService.createSite({
          empresaId: form.empresaId,
          name: form.name, address: form.address, lat, lng, radiusMeters,
        });
      }
      reload();
      setSubView("list");
    } catch {
      setFormError("Error al guardar. Verifica los datos.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-400 transition-colors w-full";
  const activeSites   = sites.filter((s) => isActive(s)).length;
  const inactiveSites = sites.length - activeSites;

  // ── Form ──────────────────────────────────────────────────────────────────────
  if (subView === "form") {
    const isNew = !editing;
    return (
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <button onClick={() => setSubView("list")} className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "#2989d8" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Sitios
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-700">
            {isNew ? "Nuevo sitio" : `Editar · ${editing!.name}`}
          </span>
        </div>

        <div className="max-w-2xl">
          <Card className="p-6 flex flex-col gap-5">
            <p className="text-sm font-semibold text-gray-900">Datos del sitio</p>

            {isPlatformAdmin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Empresa</label>
                <select value={form.empresaId} onChange={(e) => setForm((f) => ({ ...f, empresaId: e.target.value }))} className={inputCls} disabled={!isNew}>
                  <option value="">— Selecciona empresa —</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nombre del sitio</label>
                <input type="text" placeholder="Ej: Sucursal Centro" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Dirección</label>
                <input type="text" placeholder="Av. Providencia 1234, Santiago" value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Latitud</label>
                <input type="number" step="0.0001" placeholder="-33.4372" value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Longitud</label>
                <input type="number" step="0.0001" placeholder="-70.6366" value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Radio geofence (metros)</label>
                <input type="number" min="50" max="5000" placeholder="1000" value={form.radiusMeters}
                  onChange={(e) => setForm((f) => ({ ...f, radiusMeters: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <p className="text-[10px] text-gray-400">
              Tip: obtén lat/lng desde Google Maps → clic derecho en el punto → copia coordenadas.
            </p>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{ background: "#FFF5F5", color: "#9B1C1C", border: "1px solid #FED7D7" }}>
                {formError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid #f1f5f9" }}>
              <PrimaryBtn onClick={saveForm} disabled={saving}>
                {saving ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Guardando...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{isNew ? "Crear sitio" : "Guardar cambios"}</>
                )}
              </PrimaryBtn>
              <button onClick={() => setSubView("list")} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────────
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
          <PrimaryBtn onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo sitio
          </PrimaryBtn>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        {sites.map((site) => {
          const active = isActive(site);
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
                    {isPlatformAdmin && site.empresaName && (
                      <p className="text-[10px] font-medium" style={{ color: "#2989d8" }}>{site.empresaName}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-0.5">{site.address}</p>
                  </div>
                </div>
                <button onClick={() => toggle(site.id, active)}
                  className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${active ? "" : "opacity-60"}`}
                  style={{ background: active ? G.btn : "#e2e8f0" }}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                {[
                  { label: "Radio (m)", value: site.radiusMeters },
                  { label: "Timezone",  value: site.timezone.replace("America/", "") },
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
                <button onClick={() => openEdit(site)} className="text-xs font-medium transition-colors" style={{ color: "#2989d8" }}>
                  Editar
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
