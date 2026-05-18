export type ReportStatus = "on_time" | "late" | "absent" | "overtime";

export interface ReportRecord {
  userId: string;
  name: string;
  rut: string;
  siteId: string;
  siteName: string;
  date: string;
  shift: {
    start: string;
    end: string;
    breakMinutes: number;
  };
  punches: {
    entrada?: string;
    salidaColacion?: string;
    entradaColacion?: string;
    salida?: string;
  };
  photoUrl?: string;
  horasTrabajadas: string;
  minutosAtraso: number;
  horasExtra: number;
  nroReposiciones: number;
  status: ReportStatus;
}

export interface ReportSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  overtime: number;
}

export interface ReportResponse {
  records: ReportRecord[];
  summary: ReportSummary;
  nextCursor: string | null;
}

export interface ReportExportResponse {
  url: string;
  expiresAt: string;
  filename: string;
}

export interface ReportFilters {
  siteId?: string;
  from: string;
  to: string;
  employeeId?: string;
  status?: ReportStatus;
  limit?: number;
  cursor?: string;
}
