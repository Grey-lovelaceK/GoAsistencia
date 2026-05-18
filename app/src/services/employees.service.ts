import { api, buildQuery } from "./api";
import * as mocks from "./mocks";
import type { EmployeeListResponse, Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from "@/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const employeesService = {
  getEmployees: (params?: { siteId?: string; status?: string; search?: string }): Promise<EmployeeListResponse> =>
    USE_MOCKS
      ? mocks.getEmployees()
      : api.get<EmployeeListResponse>(`/employees${buildQuery(params)}`),

  createEmployee: (data: CreateEmployeeRequest): Promise<Employee> =>
    USE_MOCKS
      ? mocks.createEmployee(data)
      : api.post<Employee>("/employees", data),

  updateEmployee: (id: string, data: UpdateEmployeeRequest): Promise<{ id: string; updated: boolean }> =>
    USE_MOCKS
      ? mocks.updateEmployee(id, data)
      : api.put<{ id: string; updated: boolean }>(`/employees/${id}`, data),

  deleteEmployee: (id: string): Promise<{ id: string; status: string }> =>
    USE_MOCKS
      ? mocks.deleteEmployee(id)
      : api.delete<{ id: string; status: string }>(`/employees/${id}`),
};
