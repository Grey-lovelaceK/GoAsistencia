# GOTEST API — Backend

API REST construida con **Fastify + TypeScript**. Conexión a base de datos vía **pg (PostgreSQL directo)** usando el Supabase Pooler.

---

## Arquitectura de conexión actual

```
Fastify → pg Pool → PostgreSQL Supabase (vía Pooler)
```

**Host del Pooler verificado:**
```
aws-1-us-east-1.pooler.supabase.com
```

> Supabase Client (`@supabase/supabase-js`) está disponible en el código como respaldo para integraciones futuras (Storage, etc.), pero los módulos principales usan `pg` + `DATABASE_URL`.

---

## Configuración inicial

### 1. Crear el archivo de variables de entorno

```bash
cp .env.example .env
```

Luego editar `api/.env` con los valores reales. **Nunca commitear este archivo.**

### 2. Variables requeridas

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL completo (incluye usuario, password, host, puerto, base de datos) |
| `PORT` | Puerto de la API (default: `3001`) |
| `NODE_ENV` | Entorno (`development` / `production`) |
| `JWT_ACCESS_SECRET` | Secret para firmar access tokens (mínimo 32 chars aleatorios) |
| `JWT_REFRESH_SECRET` | Secret para firmar refresh tokens (mínimo 32 chars aleatorios) |
| `JWT_ACCESS_EXPIRES_IN` | Duración del access token (ej. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token (ej. `7d`) |
| `CORS_ORIGIN` | Origen permitido por CORS (ej. `http://localhost:5173`) |

### 3. Variables opcionales

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | Solo si se usan integraciones de Supabase Client (Storage, etc.) |
| `SUPABASE_SERVICE_ROLE_KEY` | Ídem — **nunca en frontend, solo en backend** |

### 4. Formato de DATABASE_URL

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

> El puerto `6543` corresponde al pooler de Supabase (Session Mode). No usar el puerto `5432` directo hasta resolver configuración de red.

---

## Seguridad de credenciales

- `DATABASE_URL` contiene el password — **jamás commitear `api/.env`** (está en `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY` bypasea RLS — solo en backend
- Los JWT secrets deben ser strings aleatorios de al menos 32 caracteres

---

## Levantar la API

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run dev

# Compilar
npm run build

# Producción
npm start
```

La API queda disponible en `http://localhost:3001` (o el `PORT` configurado).

---

## Endpoints de diagnóstico

### `GET /health`
Verifica que el servidor esté activo. No requiere autenticación.

```json
{ "status": "ok", "timestamp": "2026-05-14T00:00:00.000Z", "version": "2.0.0" }
```

### `GET /health/db`
Verifica la conexión con PostgreSQL. No requiere autenticación.

**Respuesta exitosa:**
```json
{ "status": "ok", "database": "connected" }
```

**Respuesta con error (503):**
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "No se pudo conectar con PostgreSQL"
}
```

> El detalle del error se loguea en consola del servidor, no se expone al cliente.

---

## Estructura de módulos

```
api/src/
├── config/
│   ├── env.ts          # Variables de entorno — DATABASE_URL requerida
│   ├── db.ts           # Pool pg + query/queryOne/withTransaction/dbError
│   └── supabase.ts     # Cliente Supabase opcional (respaldo/futuro)
├── middleware/
│   ├── auth.middleware.ts   # Verificación JWT Bearer
│   └── role.middleware.ts   # Guards por rol
├── modules/
│   ├── auth/           # POST /auth/login, /auth/refresh, GET /auth/me
│   ├── employees/      # CRUD /employees
│   ├── sites/          # GET /sites, /sites/:id
│   ├── shift-groups/   # GET /shift-groups, /shift-groups/me
│   ├── punch-policies/ # GET /punch-policies
│   ├── devices/        # POST /devices/register-request, /devices/authorize, GET /devices
│   ├── punches/        # POST /punches/upload-url, /punches, GET /punches
│   ├── reports/        # GET /reports/daily, POST /reports/export
│   └── exceptions/     # GET/POST/PUT/DELETE /exceptions (Fase 6B)
└── utils/
    ├── errors.ts       # AppError + factory Errors.*
    └── jwt.ts          # sign / verify tokens
```
