export interface DbException {
  id: string;
  empresa_id: string;
  usuario_id: string | null;
  tipo: string;
  titulo: string;
  fecha_desde: string;
  fecha_hasta: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

// Fila con JOIN de nombre del empleado
export interface DbExceptionRow extends DbException {
  usuario_nombre: string | null;
}

// Respuesta al frontend (camelCase, compatible con CalendarException del app)
export interface ExceptionResponse {
  id: string;
  type: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  description?: string;
  employeeId: string | null;
  employeeName: string | null;
}

export interface CreateExceptionData {
  type: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  employeeId?: string | null;
  description?: string;
}

export interface UpdateExceptionData {
  type?: string;
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  description?: string;
  employeeId?: string | null;
}
