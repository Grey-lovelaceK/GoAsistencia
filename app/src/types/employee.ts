export type EmployeeRole = "employee" | "supervisor" | "admin";

export interface Employee {
  id: string;
  rut: string;
  name: string;
  email: string;
  role: EmployeeRole;
  siteId: string;
  siteName: string;
  status: "activo" | "inactivo";
  passkey: boolean;
  createdAt: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  nextCursor: string | null;
  total: number;
}

export interface CreateEmployeeRequest {
  rut: string;
  name: string;
  email: string;
  siteId: string;
  role: EmployeeRole;
  password: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  siteId?: string;
  role?: EmployeeRole;
  status?: "activo" | "inactivo";
}
