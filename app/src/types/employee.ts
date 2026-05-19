export type EmployeeRole = "employee" | "supervisor" | "admin";

export interface Employee {
  id: string;
  empresaId: string;
  empresaName: string;
  rut: string;
  name: string;
  email: string;
  role: EmployeeRole;
  siteId: string | null;
  siteName: string | null;
  status: "activo" | "inactivo";
  passkey: boolean;
  grupoTurnoId: string | null;
  grupoTurnoNombre: string | null;
  grupoTurnoTipo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
}

export interface CreateEmployeeRequest {
  empresaId?: string;
  rut: string;
  name: string;
  email: string;
  siteId: string;
  role: EmployeeRole;
  password: string;
  grupoTurnoId?: string | null;
}

export interface UpdateEmployeeRequest {
  empresaId?: string;
  name?: string;
  email?: string;
  siteId?: string | null;
  role?: EmployeeRole;
  status?: "activo" | "inactivo";
  grupoTurnoId?: string | null;
}
