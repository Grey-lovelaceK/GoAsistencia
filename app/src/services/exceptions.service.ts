import { api, buildQuery } from "./api";
import * as mocks from "./mocks";
import type {
  ExceptionListResponse,
  CalendarException,
  CreateExceptionRequest,
  UpdateExceptionRequest,
} from "@/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const exceptionsService = {
  getExceptions: (params?: {
    year?: number;
    month?: number;
    type?: string;
    employeeId?: string;
  }): Promise<ExceptionListResponse> =>
    USE_MOCKS
      ? mocks.getExceptions()
      : api.get<ExceptionListResponse>(`/exceptions${buildQuery(params)}`),

  createException: (data: CreateExceptionRequest): Promise<CalendarException> =>
    USE_MOCKS
      ? mocks.createException(data)
      : api.post<CalendarException>("/exceptions", data),

  updateException: (id: string, data: UpdateExceptionRequest): Promise<{ id: string; updated: boolean }> =>
    USE_MOCKS
      ? mocks.updateException(id, data)
      : api.put<{ id: string; updated: boolean }>(`/exceptions/${id}`, data),

  deleteException: (id: string): Promise<{ id: string; deleted: boolean }> =>
    USE_MOCKS
      ? mocks.deleteException(id)
      : api.delete<{ id: string; deleted: boolean }>(`/exceptions/${id}`),
};
