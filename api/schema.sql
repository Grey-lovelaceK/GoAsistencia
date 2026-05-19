-- GoAsistencia — Schema PostgreSQL (Supabase)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Extensiones ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tablas ───────────────────────────────────────────────────────────────────

CREATE TABLE empresas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  rut        TEXT,
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  nombre        TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sitios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  direccion    TEXT,
  lat          NUMERIC(10,7) NOT NULL,
  lng          NUMERIC(10,7) NOT NULL,
  radio_metros INTEGER NOT NULL DEFAULT 500,
  timezone     TEXT NOT NULL DEFAULT 'America/Santiago',
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE turnos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sitio_id         UUID REFERENCES sitios(id) ON DELETE SET NULL,
  nombre           TEXT NOT NULL,
  hora_inicio      TIME NOT NULL,
  hora_fin         TIME NOT NULL,
  minutos_colacion INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grupos_turno (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('fijo','libre','turno_rotativo')),
  turno_id   UUID REFERENCES turnos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id         UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sitio_id           UUID REFERENCES sitios(id) ON DELETE SET NULL,
  supervisor_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  rut                TEXT NOT NULL,
  nombre             TEXT NOT NULL,
  email              TEXT NOT NULL,
  password_hash      TEXT NOT NULL,
  role               TEXT NOT NULL CHECK (role IN ('colaborador','supervisor','rrhh','gerencia')),
  passkey_registrado BOOLEAN NOT NULL DEFAULT false,
  activo             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, rut),
  UNIQUE (empresa_id, email)
);

CREATE TABLE usuarios_grupos_turno (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  grupo_turno_id UUID NOT NULL REFERENCES grupos_turno(id) ON DELETE CASCADE,
  fecha_inicio   DATE NOT NULL,
  fecha_fin      DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE politicas_marcacion (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sitio_id              UUID REFERENCES sitios(id) ON DELETE CASCADE,
  role                  TEXT NOT NULL,
  canal_permitido       TEXT NOT NULL DEFAULT 'both' CHECK (canal_permitido IN ('mobile','web','both')),
  requiere_geofence     BOOLEAN NOT NULL DEFAULT false,
  requiere_biometria    BOOLEAN NOT NULL DEFAULT false,
  requiere_foto         BOOLEAN NOT NULL DEFAULT false,
  tolerancia_atraso_min INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dispositivos_autorizados (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sitio_id      UUID REFERENCES sitios(id) ON DELETE SET NULL,
  usuario_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  device_id     TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('mobile','web','kiosk')),
  nombre        TEXT,
  activo        BOOLEAN NOT NULL DEFAULT false,
  registrado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_uso_en TIMESTAMPTZ,
  UNIQUE (empresa_id, device_id)
);

CREATE TABLE marcaciones (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id         UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sitio_id           UUID REFERENCES sitios(id) ON DELETE SET NULL,
  dispositivo_id     UUID REFERENCES dispositivos_autorizados(id) ON DELETE SET NULL,
  tipo               TEXT NOT NULL CHECK (tipo IN ('entrada','salida','salida_colacion','entrada_colacion')),
  estado             TEXT NOT NULL DEFAULT 'valida' CHECK (estado IN ('valida','anulada','corregida')),
  fecha_operativa    DATE NOT NULL,
  registrada_en      TIMESTAMPTZ NOT NULL,
  distance_meters    NUMERIC(10,2),
  is_within_geofence BOOLEAN,
  photo_key          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reportes_diarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sitio_id         UUID REFERENCES sitios(id) ON DELETE SET NULL,
  grupo_turno_id   UUID REFERENCES grupos_turno(id) ON DELETE SET NULL,
  fecha            DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'on_time' CHECK (status IN ('on_time','late','absent','overtime')),
  horas_trabajadas INTERVAL NOT NULL DEFAULT '00:00',
  minutos_atraso   INTEGER NOT NULL DEFAULT 0,
  horas_extra      INTEGER NOT NULL DEFAULT 0,
  nro_reposiciones INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, empresa_id, fecha)
);

CREATE TABLE excepciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('feriado','vacaciones')),
  titulo      TEXT NOT NULL,
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_marcaciones_usuario_fecha  ON marcaciones(usuario_id, fecha_operativa);
CREATE INDEX idx_marcaciones_empresa_fecha  ON marcaciones(empresa_id, fecha_operativa);
CREATE INDEX idx_reportes_empresa_fecha     ON reportes_diarios(empresa_id, fecha);
CREATE INDEX idx_ugts_usuario              ON usuarios_grupos_turno(usuario_id);
CREATE INDEX idx_excepciones_empresa_fecha ON excepciones(empresa_id, fecha_desde, fecha_hasta);
CREATE INDEX idx_dispositivos_device_id    ON dispositivos_autorizados(empresa_id, device_id);

-- ─── Datos iniciales (seed) ───────────────────────────────────────────────────
-- Contraseña para todos los usuarios seed: Temporal123
-- Hash generado con bcrypt cost 12

INSERT INTO empresas (id, nombre, rut) VALUES
  ('11111111-1111-1111-1111-111111111111', 'GO Tecnología', '76.123.456-7');

-- Platform admin: admin@gotest.app / Temporal123
INSERT INTO platform_admins (id, email, nombre, password_hash) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'admin@gotest.app',
   'Admin GOTEST',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa'); -- Temporal123

INSERT INTO sitios (id, empresa_id, nombre, direccion, lat, lng, radio_metros) VALUES
  ('22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111',
   'GO Tecnología', 'Av. Providencia 1234, Santiago',
   -33.4372, -70.6366, 500);

INSERT INTO turnos (id, empresa_id, nombre, hora_inicio, hora_fin, minutos_colacion) VALUES
  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   'Turno Estándar', '08:00', '17:30', 60);

INSERT INTO grupos_turno (id, empresa_id, nombre, tipo, turno_id) VALUES
  ('44444444-4444-4444-4444-444444444444',
   '11111111-1111-1111-1111-111111111111',
   'Grupo Fijo Mañana', 'fijo',
   '33333333-3333-3333-3333-333333333333');

-- Admin RRHH: admin@goalliance.cl / Temporal123
INSERT INTO usuarios (id, empresa_id, sitio_id, rut, nombre, email, password_hash, role) VALUES
  ('55555555-5555-5555-5555-555555555555',
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222',
   '99.999.999-9', 'Admin RRHH', 'admin@goalliance.cl',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'rrhh');

-- Colaborador de prueba: c.florez@goalliance.cl / Temporal123
INSERT INTO usuarios (id, empresa_id, sitio_id, rut, nombre, email, password_hash, role) VALUES
  ('66666666-6666-6666-6666-666666666666',
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222',
   '12.345.678-9', 'Cristian Florez', 'c.florez@goalliance.cl',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'colaborador');

INSERT INTO usuarios_grupos_turno (usuario_id, empresa_id, grupo_turno_id, fecha_inicio) VALUES
  ('66666666-6666-6666-6666-666666666666',
   '11111111-1111-1111-1111-111111111111',
   '44444444-4444-4444-4444-444444444444',
   '2026-01-01');
