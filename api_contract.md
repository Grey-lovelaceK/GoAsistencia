# GOTEST API Contract

**Base URL:** `https://api.gotest.app/v1`  
**Auth:** `Authorization: Bearer <jwt>` en todos los endpoints protegidos  
**Arquitectura:** AWS API Gateway → Lambda (Node 20) → DynamoDB / S3

---

## Auth

### POST /auth/login
Autenticación clásica con credenciales. Acepta RUT o correo como identificador.

**Request**
```json
{
  "identifier": "12345678-9",
  "password": "clave_segura_123"
}
```
> `identifier`: RUT (`"12345678-9"`) o correo (`"usuario@empresa.cl"`)

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 28800,
  "user": {
    "id": "usr_01HX",
    "rut": "12345678-9",
    "email": "usuario@empresa.cl",
    "name": "Cristian Florez Revilla",
    "role": "employee",
    "siteId": "site_01",
    "passkey": false
  }
}
```
> `role`: `"employee"` | `"supervisor"` | `"admin"`  
> `passkey`: `true` si el dispositivo ya tiene passkey registrada. El cliente móvil muestra el flujo de registro biométrico si es `false`.

**Response 401**
```json
{ "error": "INVALID_CREDENTIALS" }
```

**Response 400**
```json
{ "error": "VALIDATION_ERROR", "fields": { "identifier": "Formato inválido" } }
```

---

## Auth — WebAuthn / Passkeys (Step-up)

> **Flujo de step-up:** Estos endpoints **no** se usan al hacer login inicial. Se invocan como verificación biométrica adicional justo antes de enviar `POST /punches`. El cliente solicita el challenge, obtiene la assertion del dispositivo (huella/FaceID), la verifica con `/auth/verify`, y sólo si la respuesta es `200` procede a registrar la marcación.

### POST /auth/challenge
Genera challenge para autenticación con passkey (WebAuthn `navigator.credentials.get`).

**Request**
```json
{
  "rut": "12345678-9"
}
```

**Response 200**
```json
{
  "challenge": "dGhpcyBpcyBhIHJhbmRvbQ",
  "rpId": "gotest.app",
  "timeout": 60000,
  "allowCredentials": [
    {
      "id": "credentialIdBase64url",
      "type": "public-key",
      "transports": ["internal"]
    }
  ],
  "userVerification": "required"
}
```

**Response 404**
```json
{ "error": "USER_NOT_FOUND" }
```

---

### POST /auth/verify
Verifica assertion de WebAuthn y retorna JWT.

**Request** (payload del `PublicKeyCredential` serializado)
```json
{
  "rut": "12345678-9",
  "credentialId": "credentialIdBase64url",
  "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiZEdobGFTQnBjeUJoSUhKaGJtZHZiUSJ9",
  "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAA",
  "signature": "MEUCIQD...",
  "userHandle": "dXNlcklk"
}
```

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 28800,
  "user": {
    "id": "usr_01HX",
    "rut": "12345678-9",
    "name": "Cristian Florez Revilla",
    "role": "employee",
    "siteId": "site_01",
    "passkey": true
  }
}
```

**Response 401**
```json
{ "error": "INVALID_ASSERTION" }
```

---

### POST /auth/register/challenge
*(Primer login — genera challenge para `navigator.credentials.create`)*

**Request**
```json
{
  "rut": "12345678-9",
  "password": "temporal123"
}
```

**Response 200**
```json
{
  "challenge": "cmVnaXN0cmF0aW9uQ2hhbGxlbmdl",
  "rp": { "id": "gotest.app", "name": "GOTEST Marcación" },
  "user": {
    "id": "dXNlcklk",
    "name": "12345678-9",
    "displayName": "Cristian Florez Revilla"
  },
  "pubKeyCredParams": [
    { "type": "public-key", "alg": -7 },
    { "type": "public-key", "alg": -257 }
  ],
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "requireResidentKey": true,
    "userVerification": "required"
  },
  "timeout": 60000
}
```

---

### POST /auth/register/verify
Guarda la credencial pública del dispositivo.

**Request**
```json
{
  "rut": "12345678-9",
  "credentialId": "newCredIdBase64url",
  "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiLi4uIn0",
  "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YVik..."
}
```

**Response 201**
```json
{ "registered": true }
```

---

## Sites

### GET /sites
Retorna sitios con coordenadas y radio.  
- Empleados y supervisores: solo sitios `active: true`  
- Admins: todos los sitios (activos e inactivos)

**Headers:** `Authorization: Bearer <jwt>`

**Response 200**
```json
{
  "sites": [
    {
      "id": "site_01",
      "name": "Casa Matriz",
      "address": "Av. Providencia 1234, Santiago",
      "lat": -33.4372,
      "lng": -70.6366,
      "radiusMeters": 500,
      "timezone": "America/Santiago",
      "active": true
    }
  ]
}
```

---

### GET /sites/{siteId}
Retorna un sitio específico.

**Response 200**
```json
{
  "id": "site_01",
  "name": "Casa Matriz",
  "address": "Av. Providencia 1234, Santiago",
  "lat": -33.4372,
  "lng": -70.6366,
  "radiusMeters": 500,
  "timezone": "America/Santiago",
  "shifts": [
    {
      "id": "shift_01",
      "name": "Turno Mañana",
      "start": "08:30",
      "end": "18:00",
      "breakMinutes": 45
    }
  ],
  "active": true
}
```

---

### PUT /sites/{siteId}
Actualiza configuración de un sitio (radio, estado activo/inactivo, turno).  
**Requiere:** `role: admin`

**Request** (todos los campos opcionales)
```json
{
  "radiusMeters": 600,
  "active": false,
  "shifts": [
    { "id": "shift_01", "name": "Turno Mañana", "start": "08:00", "end": "17:30", "breakMinutes": 60 }
  ]
}
```

**Response 200**
```json
{ "id": "site_01", "updated": true }
```

---

## Punches

### Flujo de foto en marcación — Decisión de arquitectura

El flujo de marcación requiere una selfie obligatoria. Se evaluaron dos enfoques:

| Enfoque | Pros | Contras |
|---------|------|---------|
| `multipart/form-data` directo al endpoint | Un solo request | Lambda tiene límite de 6 MB payload en API Gateway; binarios grandes fallan |
| **Presigned URL (recomendado)** | Upload directo cliente→S3, sin pasar por Lambda | Requiere 2 requests |

**Enfoque adoptado: Presigned URL**

```
1. POST /punches/presigned-url  →  { uploadUrl, photoKey }
2. PUT {uploadUrl}  ← blob de la foto (directo a S3, sin auth header)
3. POST /punches  ← { ..., photoKey }
```

Ventajas concretas:
- Lambda no toca el binario → sin límite de payload
- Upload paralelo y más rápido (S3 multiregional)
- Costo menor (evita ingress/egress de Lambda)
- S3 aplica lifecycle para expirar fotos antiguas sin código extra

---

### POST /punches/presigned-url
Genera URL prefirmada para subir la selfie directamente a S3.

**Headers:** `Authorization: Bearer <jwt>`

**Request**
```json
{
  "contentType": "image/jpeg"
}
```

**Response 200**
```json
{
  "uploadUrl": "https://gotest-punches.s3.amazonaws.com/photos/usr_01HX/2026-04-29T08:41:00Z.jpg?X-Amz-Signature=...",
  "photoKey": "photos/usr_01HX/2026-04-29T08:41:00Z.jpg",
  "expiresIn": 120
}
```

> El cliente hace `PUT {uploadUrl}` con el blob directamente a S3 (sin `Authorization` header). Expiración: 2 minutos.

---

### POST /punches
Registra una marcación. Valida geofence server-side antes de persistir. Requiere que la foto ya esté subida a S3 (ver `POST /punches/presigned-url`).

> **Prerequisito WebAuthn:** Antes de invocar este endpoint, el cliente debe completar el flujo `POST /auth/challenge` → `POST /auth/verify` (biometría step-up). El `webAuthnToken` retornado por `/auth/verify` se incluye en el payload para validación server-side.

**Headers:** `Authorization: Bearer <jwt>`

**Request**
```json
{
  "siteId": "site_01",
  "type": "entrada",
  "lat": -33.4370,
  "lng": -70.6364,
  "accuracy": 12.5,
  "deviceId": "device_fingerprint_hash",
  "timestamp": "2026-04-29T08:41:00-04:00",
  "photoKey": "photos/usr_01HX/2026-04-29T08:41:00Z.jpg",
  "webAuthnToken": "eyJ0eXBlIjoid2ViYXV0aG4..."
}
```
> `type`: `"entrada"` | `"salida"` | `"salida_colacion"` | `"entrada_colacion"`  
> `photoKey`: clave S3 retornada por `/punches/presigned-url`  
> `webAuthnToken`: token opaco emitido por `/auth/verify` (TTL 5 min, single-use)

**Response 201**
```json
{
  "id": "punch_01HX",
  "userId": "usr_01HX",
  "siteId": "site_01",
  "type": "entrada",
  "recordedAt": "2026-04-29T08:41:00-04:00",
  "distanceMeters": 38,
  "isWithinGeofence": true,
  "shiftId": "shift_01",
  "photoUrl": "https://gotest-punches.s3.amazonaws.com/photos/usr_01HX/2026-04-29T08:41:00Z.jpg"
}
```

**Response 422 — Fuera de geofence**
```json
{
  "error": "OUTSIDE_GEOFENCE",
  "distanceMeters": 623,
  "radiusMeters": 500
}
```

**Response 409 — Doble marcación**
```json
{
  "error": "DUPLICATE_PUNCH",
  "lastPunch": {
    "type": "entrada",
    "recordedAt": "2026-04-29T08:41:00-04:00"
  }
}
```

**Response 401 — WebAuthn inválido**
```json
{ "error": "WEBAUTHN_TOKEN_INVALID" }
```

---

### GET /punches
Historial de marcaciones del usuario autenticado.

**Query params:** `?from=2026-04-01&to=2026-04-30&limit=30&cursor=<base64>`

**Response 200**
```json
{
  "punches": [
    {
      "id": "punch_01HX",
      "type": "entrada",
      "recordedAt": "2026-04-29T08:41:00-04:00",
      "distanceMeters": 38,
      "isWithinGeofence": true,
      "shift": {
        "name": "Turno Mañana",
        "start": "08:30",
        "end": "18:00"
      }
    }
  ],
  "nextCursor": null,
  "total": 1
}
```

---

## Employees (Admin)

### GET /employees
Lista empleados con filtros.  
**Requiere:** `role: admin`

**Query params:** `?siteId=site_01&status=activo&search=ivan&limit=50&cursor=<base64>`

**Response 200**
```json
{
  "employees": [
    {
      "id": "usr_01HX",
      "rut": "12.345.678-9",
      "name": "Ivan Alejandro Rojas",
      "email": "i.rojas@goalliance.cl",
      "role": "employee",
      "siteId": "site_01",
      "siteName": "GO",
      "status": "activo",
      "passkey": true,
      "createdAt": "2026-01-15T00:00:00Z"
    }
  ],

  "nextCursor": null,
  "total": 9
}
```
> `role`: `"employee"` | `"supervisor"` | `"admin"`

---

### POST /employees
Crea un nuevo empleado.  
**Requiere:** `role: admin`

**Request**
```json
{
  "rut": "19.876.543-2",
  "name": "Nombre Apellido",
  "email": "n.apellido@goalliance.cl",
  "siteId": "site_01",
  "role": "employee",
  "password": "temporal123"
}
```
> `role`: `"employee"` | `"supervisor"` | `"admin"`

**Response 201**
```json
{
  "id": "usr_02HX",
  "rut": "19.876.543-2",
  "name": "Nombre Apellido",
  "email": "n.apellido@goalliance.cl",
  "siteId": "site_01",
  "role": "employee",
  "status": "activo",
  "passkey": false
}
```

**Response 409**
```json
{ "error": "RUT_ALREADY_EXISTS" }
```

---

### PUT /employees/{employeeId}
Actualiza datos de un empleado.  
**Requiere:** `role: admin`

**Request** (todos los campos opcionales)
```json
{
  "name": "Nombre Nuevo",
  "email": "nuevo@goalliance.cl",
  "siteId": "site_02",
  "role": "supervisor",
  "status": "inactivo"
}
```
> `role`: `"employee"` | `"supervisor"` | `"admin"`

**Response 200**
```json
{ "id": "usr_01HX", "updated": true }
```

---

### DELETE /employees/{employeeId}
Desactiva un empleado (soft delete — no elimina registros de asistencia).  
**Requiere:** `role: admin`

**Response 200**
```json
{ "id": "usr_01HX", "status": "inactivo" }
```

---

## Reports (Admin)

### GET /reports
Datos de asistencia con cálculo de HT, atrasos, HE.  
**Requiere:** `role: admin`

**Query params:**
```
?siteId=site_01
&from=2026-04-01
&to=2026-04-30
&employeeId=usr_01HX   (opcional)
&status=late           (opcional: on_time|late|absent|overtime)
&limit=50
&cursor=<base64>
```

**Response 200**
```json
{
  "records": [
    {
      "userId": "usr_01HX",
      "name": "Cristian Florez Revilla",
      "rut": "12345678-9",
      "siteId": "site_01",
      "siteName": "Casa Matriz",
      "date": "2026-04-29",
      "shift": {
        "start": "08:30",
        "end": "18:00",
        "breakMinutes": 45
      },
      "punches": {
        "entrada": "08:41",
        "salidaColacion": "14:26",
        "entradaColacion": "15:13",
        "salida": "18:05"
      },
      "photoUrl": "https://gotest-punches.s3.amazonaws.com/photos/usr_01HX/2026-04-29T08:41:00Z.jpg",
      "horasTrabajadas": "08:45",
      "minutosAtraso": 11,
      "horasExtra": 5,
      "nroReposiciones": 0,
      "status": "late"
    }
  ],
  "summary": {
    "total": 1,
    "present": 1,
    "absent": 0,
    "late": 1,
    "overtime": 0
  },
  "nextCursor": null
}
```

---

### GET /reports/export
Genera reporte .xlsx y retorna URL prefirmada de S3.  
**Requiere:** `role: admin`

**Query params:** mismos filtros que `GET /reports`

**Response 200**
```json
{
  "url": "https://gotest-reports.s3.amazonaws.com/exports/reporte-2026-04.xlsx?X-Amz-Signature=...",
  "expiresAt": "2026-04-29T21:49:00Z",
  "filename": "reporte_casa_matriz_2026-04.xlsx"
}
```

---

## Calendar Exceptions (Admin)

> Gestión de feriados nacionales y períodos de vacaciones por colaborador. Las excepciones son tenidas en cuenta por el backend para calcular atrasos y ausencias correctamente.

### GET /exceptions
Lista excepciones con filtros opcionales.  
**Requiere:** `role: admin`

**Query params:** `?year=2026&month=5&type=feriado&employeeId=usr_01HX`

**Response 200**
```json
{
  "exceptions": [
    {
      "id": "exc_01",
      "type": "feriado",
      "title": "Día del Trabajador",
      "dateFrom": "2026-05-01",
      "dateTo": "2026-05-01",
      "description": "Feriado nacional obligatorio irrenunciable",
      "employeeId": null,
      "employeeName": null
    },
    {
      "id": "exc_02",
      "type": "vacaciones",
      "title": "Vacaciones anuales",
      "dateFrom": "2026-05-12",
      "dateTo": "2026-05-16",
      "description": "Vacaciones anuales aprobadas por RRHH",
      "employeeId": "usr_02HX",
      "employeeName": "Isabel Rojas Eneros"
    }
  ]
}
```

---

### POST /exceptions
Crea una excepción (feriado o vacaciones).  
**Requiere:** `role: admin`

**Request**
```json
{
  "type": "vacaciones",
  "title": "Vacaciones anuales",
  "dateFrom": "2026-06-02",
  "dateTo": "2026-06-06",
  "employeeId": "usr_01HX",
  "description": "Aprobado por RRHH"
}
```
> `type`: `"feriado"` | `"vacaciones"`  
> `employeeId`: requerido solo si `type === "vacaciones"`; `null` para feriados (aplica a todos)

**Response 201**
```json
{
  "id": "exc_03",
  "type": "vacaciones",
  "title": "Vacaciones anuales",
  "dateFrom": "2026-06-02",
  "dateTo": "2026-06-06",
  "employeeId": "usr_01HX",
  "employeeName": "Ivan Alejandro Rojas",
  "description": "Aprobado por RRHH"
}
```

---

### PUT /exceptions/{exceptionId}
Actualiza una excepción existente.  
**Requiere:** `role: admin`

**Request** (todos los campos opcionales)
```json
{
  "title": "Título actualizado",
  "dateFrom": "2026-06-03",
  "dateTo": "2026-06-07",
  "description": "Fechas corregidas"
}
```

**Response 200**
```json
{ "id": "exc_03", "updated": true }
```

---

### DELETE /exceptions/{exceptionId}
Elimina una excepción.  
**Requiere:** `role: admin`

**Response 200**
```json
{ "id": "exc_03", "deleted": true }
```

---

## API externa — Feriados Chile

El frontend consume directamente la API pública de boostr.cl para mostrar feriados nacionales en el CalendarioView. **No pasa por el backend GOTEST.**

**Endpoint:** `GET https://api.boostr.cl/holidays.json`  
**Auth:** ninguna (API pública)  
**Caché sugerida:** 24h (los feriados no cambian en el día)

**Response 200**
```json
{
  "status": "success",
  "data": [
    {
      "date": "2026-01-01",
      "title": "Año Nuevo",
      "type": "Civil",
      "inalienable": true,
      "extra": "Civil e Irrenunciable"
    }
  ]
}
```
> `type`: `"Civil"` | `"Religioso"`  
> `inalienable`: feriado irrenunciable según ley chilena  
> Los feriados de esta API son **read-only** en la UI — no se crean ni modifican vía `POST /exceptions`.

---

## Errores comunes

| Código | Error | Descripción |
|--------|-------|-------------|
| 400 | `VALIDATION_ERROR` | Payload inválido |
| 401 | `UNAUTHORIZED` | JWT ausente o inválido |
| 403 | `FORBIDDEN` | Sin permisos para el recurso |
| 404 | `NOT_FOUND` | Recurso no existe |
| 409 | `DUPLICATE_PUNCH` | Marcación duplicada |
| 422 | `OUTSIDE_GEOFENCE` | Fuera del radio permitido |
| 429 | `RATE_LIMITED` | Demasiadas peticiones |
| 500 | `INTERNAL_ERROR` | Error del servidor |

---

## Notas de arquitectura AWS

- **API Gateway** → HTTP API (v2) con JWT Authorizer apuntando a Cognito o Lambda custom auth
- **Lambda** → Node 20, 512 MB, timeout 10s (punches/auth), 30s (reports/export)
- **DynamoDB** → Tabla `punches` con PK=`userId` SK=`timestamp`, GSI por `siteId+date`
- **S3** → Bucket `gotest-reports` (lifecycle 24h para exports); Bucket `gotest-punches` (fotos de selfies, presigned PUT desde cliente, lifecycle 90d)
- **CloudWatch** → Alarmas en error rate >1% y latencia p99 >2s
