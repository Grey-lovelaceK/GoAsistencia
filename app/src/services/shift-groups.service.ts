import { api } from "./api";

export interface GrupoTurno {
  id: string;
  empresaId: string;
  nombre: string;
  tipo: string;
  turnoId: string | null;
  turno: {
    id: string;
    nombre: string;
    horaInicio: string;
    horaFin: string;
    minutosColacion: number;
  } | null;
}

export const shiftGroupsService = {
  getShiftGroups: (empresaId: string): Promise<{ grupos: GrupoTurno[] }> =>
    api.get<{ grupos: GrupoTurno[] }>(`/shift-groups?empresaId=${encodeURIComponent(empresaId)}`),
};
