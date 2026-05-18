export type GrupoTurnoTipo = "fijo" | "libre" | "rotativo";
export type ReportStatus   = "on_time" | "late" | "absent" | "overtime";

export interface ReportShift {
  start:        string;
  end:          string;
  breakMinutes: number;
}

export interface ReportPunches {
  entrada?:         string;
  salidaColacion?:  string;
  entradaColacion?: string;
  salida?:          string;
}

export interface ReportRecord {
  userId:           string;
  name:             string;
  rut:              string;
  siteId:           string;
  siteName:         string;
  date:             string;
  grupoTurnoTipo?:  GrupoTurnoTipo;
  grupoTurnoNombre?: string;
  shift:            ReportShift;
  punches:          ReportPunches;
  horasTrabajadas:  string;
  minutosAtraso:    number;
  horasExtra:       number;
  nroReposiciones:  number;
  status:           ReportStatus;
}

export interface ReportSummary {
  total:    number;
  present:  number;
  absent:   number;
  late:     number;
  overtime: number;
}

export interface ReportFilters {
  from?:         string;
  to?:           string;
  siteId?:       string;
  employeeId?:   string;
  supervisorId?: string;
  status?:       ReportStatus;
}
