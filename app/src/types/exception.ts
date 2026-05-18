export type ExceptionType = "feriado" | "vacaciones";

export interface CalendarException {
  id: string;
  type: ExceptionType;
  title: string;
  dateFrom: string;
  dateTo: string;
  description?: string;
  employeeId: string | null;
  employeeName: string | null;
}

export interface ExceptionListResponse {
  exceptions: CalendarException[];
}

export interface CreateExceptionRequest {
  type: ExceptionType;
  title: string;
  dateFrom: string;
  dateTo: string;
  employeeId?: string | null;
  description?: string;
}

export interface UpdateExceptionRequest {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  description?: string;
}
