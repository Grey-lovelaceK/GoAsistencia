import type {
  LoginRequest,
  AuthResponse,
  SiteListResponse,
  Site,
  UpdateSiteRequest,
  PunchListResponse,
  PresignedUrlResponse,
  PunchRequest,
  PunchResponse,
  EmployeeListResponse,
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ReportResponse,
  ReportFilters,
  ReportExportResponse,
  ExceptionListResponse,
  CalendarException,
  CreateExceptionRequest,
  UpdateExceptionRequest,
} from "@/types";
import {
  MOCK_EMPLOYEES,
  MOCK_EXCEPTIONS,
  MOCK_PUNCHES,
  MOCK_REPORTS,
  MOCK_SITES,
} from "./data";

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

let employees = [...MOCK_EMPLOYEES];
let exceptions = [...MOCK_EXCEPTIONS];
let sites      = [...MOCK_SITES];

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(data: LoginRequest): Promise<AuthResponse> {
  await delay();
  const isAdmin =
    data.identifier === "admin@goalliance.cl" ||
    data.identifier.startsWith("admin");
  return {
    token: `mock_token_${Date.now()}`,
    expiresIn: 28800,
    user: {
      id: isAdmin ? "usr_admin" : "usr_01",
      rut: isAdmin ? "99.999.999-9" : "12.345.678-9",
      email: isAdmin ? "admin@goalliance.cl" : "c.florez@goalliance.cl",
      name: isAdmin ? "Admin GOTEST" : "Cristian Florez Revilla",
      role: isAdmin ? "admin" : "employee",
      siteId: "site_01",
      passkey: isAdmin ? true : false,
    },
  };
}

// ─── Sites ───────────────────────────────────────────────────────────────────

export async function getSites(): Promise<SiteListResponse> {
  await delay();
  return { sites: sites.filter((s) => s.active) };
}

export async function getSite(siteId: string): Promise<Site> {
  await delay();
  const site = sites.find((s) => s.id === siteId);
  if (!site) throw new Error("NOT_FOUND");
  return site;
}

export async function updateSite(
  id: string,
  data: UpdateSiteRequest,
): Promise<{ id: string; updated: boolean }> {
  await delay(200);
  sites = sites.map((s) => {
    if (s.id !== id) return s;
    return {
      ...s,
      ...(data.active       !== undefined && { active:       data.active       }),
      ...(data.radiusMeters !== undefined && { radiusMeters: data.radiusMeters }),
      ...(data.shifts       !== undefined && { shifts:       data.shifts       }),
    };
  });
  return { id, updated: true };
}

// ─── Punches ─────────────────────────────────────────────────────────────────

export async function getPunches(): Promise<PunchListResponse> {
  await delay();
  return { punches: MOCK_PUNCHES, nextCursor: null, total: MOCK_PUNCHES.length };
}

export async function getPresignedUrl(): Promise<PresignedUrlResponse> {
  await delay(200);
  return {
    uploadUrl: "https://mock-s3.example.com/upload/photo.jpg",
    photoKey: `photos/mock/${Date.now()}.jpg`,
    expiresIn: 120,
  };
}

export async function createPunch(data: PunchRequest): Promise<PunchResponse> {
  await delay(600);
  return {
    id: `punch_${Date.now()}`,
    userId: "usr_01",
    siteId: data.siteId,
    type: data.type,
    recordedAt: data.timestamp,
    distanceMeters: 38,
    isWithinGeofence: true,
    shiftId: "shift_01",
    photoUrl: "https://mock-s3.example.com/photos/mock.jpg",
  };
}

// ─── Employees ───────────────────────────────────────────────────────────────

export async function getEmployees(): Promise<EmployeeListResponse> {
  await delay();
  return { employees, nextCursor: null, total: employees.length };
}

export async function createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
  await delay();
  const site = MOCK_SITES.find((s) => s.id === data.siteId);
  const employee: Employee = {
    id: `usr_${Date.now()}`,
    rut: data.rut,
    name: data.name,
    email: data.email,
    role: data.role,
    siteId: data.siteId,
    siteName: site?.name ?? "",
    status: "activo",
    passkey: false,
    createdAt: new Date().toISOString(),
  };
  employees = [...employees, employee];
  return employee;
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeRequest,
): Promise<{ id: string; updated: boolean }> {
  await delay();
  employees = employees.map((e) => {
    if (e.id !== id) return e;
    return {
      ...e,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.siteId !== undefined && { siteId: data.siteId }),
      ...(data.role   !== undefined && { role:   data.role   }),
      ...(data.status !== undefined && { status: data.status }),
    };
  });
  return { id, updated: true };
}

export async function deleteEmployee(id: string): Promise<{ id: string; status: string }> {
  await delay();
  employees = employees.map((e) =>
    e.id === id ? { ...e, status: "inactivo" as const } : e,
  );
  return { id, status: "inactivo" };
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function getReports(_filters: ReportFilters): Promise<ReportResponse> {
  await delay(800);
  return {
    records: MOCK_REPORTS,
    summary: { total: 9, present: 7, absent: 1, late: 2, overtime: 1 },
    nextCursor: null,
  };
}

export async function exportReports(_filters: ReportFilters): Promise<ReportExportResponse> {
  await delay(1500);
  return {
    url: "https://mock-s3.example.com/exports/reporte-mock.xlsx",
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    filename: "reporte_mock_2026.xlsx",
  };
}

// ─── Exceptions ──────────────────────────────────────────────────────────────

export async function getExceptions(): Promise<ExceptionListResponse> {
  await delay();
  return { exceptions };
}

export async function createException(data: CreateExceptionRequest): Promise<CalendarException> {
  await delay();
  const emp = data.employeeId
    ? MOCK_EMPLOYEES.find((e) => e.id === data.employeeId)
    : null;
  const exception: CalendarException = {
    id: `exc_${Date.now()}`,
    type: data.type,
    title: data.title,
    dateFrom: data.dateFrom,
    dateTo: data.dateTo,
    description: data.description,
    employeeId: data.employeeId ?? null,
    employeeName: emp?.name ?? null,
  };
  exceptions = [...exceptions, exception];
  return exception;
}

export async function updateException(
  id: string,
  data: UpdateExceptionRequest,
): Promise<{ id: string; updated: boolean }> {
  await delay();
  exceptions = exceptions.map((e) => {
    if (e.id !== id) return e;
    return {
      ...e,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.dateFrom !== undefined && { dateFrom: data.dateFrom }),
      ...(data.dateTo !== undefined && { dateTo: data.dateTo }),
      ...(data.description !== undefined && { description: data.description }),
    };
  });
  return { id, updated: true };
}

export async function deleteException(id: string): Promise<{ id: string; deleted: boolean }> {
  await delay();
  exceptions = exceptions.filter((e) => e.id !== id);
  return { id, deleted: true };
}
