# GOTEST — Contexto del proyecto

> Última actualización: 2026-05-07 — Frontend real: Etapa 5/5 completada ✅

---

## ¿Qué es?

Sistema de control de asistencia laboral para empresas chilenas. Dos superficies:
1. **PWA móvil** — empleados marcan entrada/salida con geofence + biometría + selfie
2. **Admin web** — admins ven dashboard, asistencia, empleados, sitios, reportes

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Mobile PWA | Vite PWA plugin + manifest + SW |
| Auth | JWT + WebAuthn/Passkeys (biometric step-up) |
| Backend (diseño) | AWS API Gateway → Lambda Node 20 → DynamoDB + S3 |
| Geofence | Haversine client-side + validación server-side |

Paleta: `#1e5799` → `#2989d8` (gradiente botones), dark nav `#070F1E`  
Fuente: Poppins

---

## Estructura de archivos (excl. node_modules)

```
GOTEST/
├── api_contract.md          # Contrato REST completo
├── CONTEXTO.md              # Este archivo
├── mockups/                 # Diseños originales (referencia, no modificar)
│   ├── AdminDashboard.tsx
│   ├── LoginPage.tsx
│   ├── MobileAuth.tsx
│   ├── MobilePunch.tsx
│   └── lib/geofence.ts
├── pwa-config/              # manifest.json + next.config.ts (ref)
├── viewer/                  # Visualizador de mockups legacy
└── app/                     # ★ FRONTEND REAL (producción)
    ├── src/
    │   ├── components/
    │   │   ├── admin/       # Avatar, Card, SectionHeader, PrimaryBtn
    │   │   ├── auth/        # AuthGuard, AdminGuard, PasskeyRegisterModal
    │   │   ├── punch/       # PunchCard, CameraModal
    │   │   └── ErrorBoundary.tsx
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useGeolocation.ts
    │   │   ├── useIsMobile.ts
    │   │   └── usePWAInstall.ts   # beforeinstallprompt → canInstall + install()
    │   ├── lib/
    │   │   ├── auth.ts       # detectIdentifierType, normalizeIdentifier
    │   │   ├── device.ts     # getDeviceId() — fingerprint persistente
    │   │   ├── geofence.ts   # checkGeofence() Haversine
    │   │   └── webauthn.ts   # stepUpBiometrics() + registerPasskey()
    │   ├── pages/
    │   │   ├── LoginPage.tsx        # Router desktop/móvil
    │   │   ├── login/
    │   │   │   ├── DesktopLogin.tsx
    │   │   │   └── MobileLogin.tsx  # + PasskeyRegisterModal post-login
    │   │   ├── punch/PunchPage.tsx  # + "Instalar app" en tab Más (si canInstall)
    │   │   └── admin/
    │   │       ├── AdminPage.tsx    # Shell + sidebar + routing
    │   │       └── views/
    │   │           ├── DashboardView.tsx
    │   │           ├── AsistenciaView.tsx
    │   │           ├── EmpleadosView.tsx
    │   │           ├── SitiosView.tsx    # toggle persiste vía updateSite
    │   │           ├── ReportesView.tsx
    │   │           ├── AjustesView.tsx
    │   │           └── CalendarioView.tsx
    │   ├── providers/
    │   │   └── AuthProvider.tsx     # AuthContext, useAuth(), JWT en localStorage
    │   ├── services/
    │   │   ├── api.ts               # fetch wrapper + buildQuery + ApiError
    │   │   ├── auth.service.ts
    │   │   ├── employees.service.ts
    │   │   ├── exceptions.service.ts
    │   │   ├── punches.service.ts
    │   │   ├── reports.service.ts
    │   │   ├── sites.service.ts     # + updateSite()
    │   │   └── mocks/
    │   │       ├── data.ts          # MOCK_SITES, MOCK_EMPLOYEES, MOCK_PUNCHES…
    │   │       └── index.ts         # Handlers con delay 400ms + updateSite
    │   ├── types/                   # auth (passkey?), employee, exception, punch, report, site (UpdateSiteRequest)
    │   ├── router.tsx               # createBrowserRouter + AuthGuard + AdminGuard
    │   └── main.tsx                 # + ErrorBoundary wrapper
    ├── .env                         # VITE_USE_MOCKS=true
    ├── .env.production              # VITE_USE_MOCKS=false
    ├── vite.config.ts               # VitePWA + alias @/
    └── dist/                        # Build de producción
```

---

## API Contract (resumen)

Definido en `api_contract.md`. Base URL: `https://api.gotest.app/v1`

| Endpoint | Función |
|----------|---------|
| `POST /auth/login` | Login con RUT o email + password |
| `POST /auth/challenge` | Genera WebAuthn challenge (step-up pre-punch) |
| `POST /auth/verify` | Verifica assertion WebAuthn → JWT |
| `POST /auth/register/challenge` | Primer login → registra passkey |
| `POST /auth/register/verify` | Guarda credencial pública |
| `GET /sites` | Lista sitios activos con coords y radio |
| `GET /sites/{siteId}` | Sitio + turnos |
| `PUT /sites/{siteId}` | Actualiza radio, estado activo/inactivo, turnos (admin) |
| `POST /punches/presigned-url` | Genera URL S3 para subir selfie |
| `POST /punches` | Registra marcación (valida geofence server-side) |
| `GET /punches` | Historial del usuario autenticado |
| `GET /reports` | Datos asistencia con HT/atrasos/HE + photoUrl (admin) |
| `GET /reports/export` | Genera .xlsx → presigned URL S3 |
| `GET /employees` | Lista empleados con filtros (admin) |
| `POST /employees` | Crea empleado (admin) |
| `PUT /employees/{id}` | Actualiza empleado (admin) |
| `DELETE /employees/{id}` | Desactiva empleado — soft delete (admin) |
| `GET /exceptions` | Lista feriados y vacaciones por período (admin) |
| `POST /exceptions` | Crea excepción de calendario (admin) |
| `PUT /exceptions/{id}` | Actualiza excepción (admin) |
| `DELETE /exceptions/{id}` | Elimina excepción (admin) |

Flujo marcación: `GET presigned-url` → `PUT blob S3` → `POST /punches + photoKey`  
WebAuthn es step-up justo antes del punch (no es el login inicial).

---

## Lo que está listo ✅

### Mockups (referencia de diseño — `mockups/`)
- [x] `LoginPage.tsx` — login desktop dual panel, detecta RUT vs email
- [x] `MobileAuth.tsx` — login móvil glassmorphism dark, `100dvh`
- [x] `MobilePunch.tsx` — flujo marcación 4 pasos completo
- [x] `AdminDashboard.tsx` — dashboard admin 7 vistas con data hardcodeada

### Frontend real — `app/` (★ producción)

#### Etapa 1 — Infraestructura base ✅
- [x] Vite 5 + React 18 + TypeScript + Tailwind CSS + vite-plugin-pwa 0.21
- [x] `createBrowserRouter` con `AuthGuard` (empleados) y `AdminGuard` (admins)
- [x] `AuthContext` + `useAuth()` — JWT en `localStorage`, persiste refresh
- [x] `api.ts` — fetch wrapper con JWT automático, `ApiError`, `buildQuery()`
- [x] Tipos TypeScript completos en `src/types/` (auth, employee, exception, punch, report, site)
- [x] Todos los servicios con doble modo: `VITE_USE_MOCKS=true` (mocks) / `false` (real API)
- [x] Mocks en `services/mocks/` con 9 empleados, 6 sitios, delay 400ms simulado
- [x] PWA: manifest inline en `vite.config.ts`, Workbox NetworkFirst para API, StaleWhileRevalidate para fonts
- [x] Alias `@/` → `src/`

#### Etapa 2 — Login real ✅
- [x] `LoginPage.tsx` — detecta mobile/desktop, redirige si ya autenticado
- [x] `DesktopLogin.tsx` — form dual-panel, llama `authService.login()`, manejo error `INVALID_CREDENTIALS`
- [x] `MobileLogin.tsx` — form glassmorphism dark, misma lógica auth
- [x] Navegación post-login: admin → `/admin`, empleado → `/punch`

#### Etapa 3 — Marcación real ✅
- [x] `useGeolocation.ts` — `watchPosition` live, `enableHighAccuracy`, timeout 10s
- [x] `device.ts` — `getDeviceId()` fingerprint hexadecimal persistente en localStorage
- [x] `webauthn.ts` — `stepUpBiometrics()`: bypass automático en mock mode y si no hay `PublicKeyCredential`
- [x] `CameraModal.tsx` — preview con guía óvalo, captura canvas, confirm/retake, blob output
- [x] `PunchCard.tsx` — UI completo con props reales (geo, shift, loading, error, punchStep)
- [x] `PunchPage.tsx` — flujo completo:
  - Carga sitio del usuario (`sitesService.getSite`) + historial hoy (`punchesService.getPunches`)
  - Geofence badge live: "Localizando…" → verde/rojo
  - Punch: `stepUpBiometrics` → `openCameraModal` → `getPresignedUrl` → `uploadPhoto` → `createPunch`
  - Logout funcional → `/login`

#### Etapa 5 — Finalización ✅
- [x] `WebAuthnRegisterModal.tsx` — modal biométrico post-login con `registerPasskey()`
- [x] `MobileLogin.tsx` — muestra modal si `user.passkey === false` tras login exitoso
- [x] `webauthn.ts` — `registerPasskey()`: bypass mock, real via `registerChallenge` + `registerVerify`
- [x] `AuthUser.passkey?: boolean` — campo en tipo + mock devuelve `false` para empleados
- [x] `sitesService.updateSite()` + mock handler — toggle en SitiosView ahora persiste
- [x] `.env` / `.env.production` — `VITE_USE_MOCKS=true/false` + `VITE_API_URL`
- [x] `ErrorBoundary.tsx` — captura errores React, muestra pantalla de recuperación
- [x] `main.tsx` — app envuelta en ErrorBoundary
- [x] `usePWAInstall.ts` — hook `beforeinstallprompt` → `canInstall` + `install()`
- [x] `PunchPage.tsx` — botón "Instalar app" aparece en tab Más cuando PWA instalable

#### Etapa 4 — Admin Dashboard real ✅
- [x] `AdminPage.tsx` — shell con sidebar, `useAuth()` para nombre/email, logout funcional
- [x] `DashboardView` — KPIs derivados de `reportsService` + `employeesService` + `sitesService`; gráfico semanal; asistencia por sitio; actividad reciente; tabla resumen hoy
- [x] `AsistenciaView` — `reportsService.getReports(filters)` con filtros fecha/sitio/estado/búsqueda, tabla paginada, export CSV client-side, hover card foto selfie
- [x] `EmpleadosView` — CRUD completo: `employeesService` create/update/delete; formulario con campos reales (`siteId`, `role`, passkey info); filtros búsqueda/sitio/estado
- [x] `SitiosView` — `sitesService.getSites()` + conteo empleados por sitio derivado de `employeesService`; toggle estado (UI local)
- [x] `ReportesView` — configura tipo/rango/sitio, llama `reportsService.getReports()`, preview tabla, export CSV client-side + `exportReports()` para .xlsx presigned URL
- [x] `AjustesView` — tabs empresa/turnos/integraciones, formularios estáticos
- [x] `CalendarioView` — CRUD completo con `exceptionsService`; calendario mensual navegable; modal crear/editar; panel "próximas excepciones"

### Lógica compartida
- [x] `geofence.ts` — Haversine, `checkGeofence()` → `{ isWithin, distanceMeters }`
- [x] `api_contract.md` — contrato REST completo
- [x] Mocks end-to-end funcionales (toda la app opera sin backend)

---

## Lo que falta ❌

### Frontend — pendiente
- [ ] Notificaciones push PWA (`PushManager` + service worker handler)
- [ ] Ajustes (empresa/turnos/integraciones) no conectados a API real — formularios estáticos
- [ ] Probar contra API real con `VITE_USE_MOCKS=false` (cuando exista backend)

### Backend
- [ ] Lambda functions (auth, punches, reports, sites, employees, exceptions)
- [ ] DynamoDB: tabla `punches` (PK=userId, SK=timestamp, GSI siteId+date)
- [ ] S3 buckets: `gotest-punches` (fotos, lifecycle 90d), `gotest-reports` (exports, lifecycle 24h)
- [ ] API Gateway HTTP v2 + JWT Authorizer
- [ ] Generación real de presigned URLs
- [ ] Lógica cálculo HT / atrasos / HE en Lambda
- [ ] Generación real .xlsx (`GET /reports/export`)
- [ ] CloudWatch alarmas (error rate >1%, latencia p99 >2s)
- [ ] `PUT /sites/{id}` endpoint (toggle activo/inactivo desde admin)

### Testing & DevOps
- [ ] Tests unitarios (geofence, auth utils)
- [ ] Tests E2E (flujo marcación, login, admin CRUD)
- [ ] CI/CD pipeline
- [ ] Deploy frontend (Amplify / Vercel / S3+CloudFront)

---

## Decisiones de arquitectura tomadas

| Decisión | Motivo |
|----------|--------|
| Selfie via presigned URL, no multipart al Lambda | Lambda tiene límite 6MB en API Gateway; S3 directo evita el bottleneck |
| WebAuthn como step-up (no login biométrico) | Primer login siempre con password; biometría solo verifica identidad al marcar |
| Geofence server-side además de client-side | Prevenir spoofing GPS |
| `webAuthnToken` TTL 5 min single-use | Evitar replay attacks en `/punches` |
| DynamoDB GSI por `siteId+date` | Queries de reportes sin full scan |

---

## Datos mock usados en mockups

- Empresa: **Go tecnologia**
- Sitios: GO, Kaufmann Pajaritos, Soprole Vitacura, Sura, Komatsu, Soprole renca (inactiva)
- 9 empleados con datos realistas chilenos (RUT, correo @goalliance.cl)
- Turno principal: lunes a viernes 08:00–17:30, 1 hora de colación
- Excepciones mock en calendario: Día del Trabajador (01-05), Glorias Navales (21-05), vacaciones Isabel Rojas 12-16/05
