import { api } from "./api";

export interface Empresa {
  id: string;
  nombre: string;
  rut: string | null;
  activo: boolean;
}

export const empresasService = {
  getEmpresas: (): Promise<{ empresas: Empresa[] }> =>
    api.get<{ empresas: Empresa[] }>("/empresas"),
};
