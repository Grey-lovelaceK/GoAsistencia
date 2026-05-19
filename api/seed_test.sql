-- GoAsistencia — Seed de prueba (4 empresas)
-- Ejecutar en: Supabase → SQL Editor → Run
-- Contraseña de TODOS los usuarios: Temporal123

-- ─── Empresas ────────────────────────────────────────────────────────────────

INSERT INTO empresas (id, nombre, rut) VALUES
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'La Florida Empresa',   '76.001.001-1'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Macul Empresa',        '76.002.002-2'),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Ñuñoa Empresa',        '76.003.003-3'),
  ('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'Providencia Empresa',  '76.004.004-4');

-- ─── Sitios (con coordenadas reales) ─────────────────────────────────────────

INSERT INTO sitios (id, empresa_id, nombre, direccion, lat, lng, radio_metros) VALUES
  ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
   'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
   'La Florida', 'Av. Vicuña Mackenna Oriente 6553, La Florida',
   -33.5580, -70.5740, 1000),

  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
   'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
   'Macul', 'Av. Quilín 3127, Macul',
   -33.5005, -70.5450, 1000),

  ('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
   'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
   'Ñuñoa', 'Av. Grecia 750, Ñuñoa',
   -33.4550, -70.6090, 1000),

  ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
   'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4',
   'Providencia', 'Av. Providencia 1650, Providencia',
   -33.4290, -70.6320, 1000);

-- ─── Turnos ──────────────────────────────────────────────────────────────────

INSERT INTO turnos (id, empresa_id, nombre, hora_inicio, hora_fin, minutos_colacion) VALUES
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Turno Estándar', '08:00', '17:30', 60),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Turno Estándar', '08:00', '17:30', 60),
  ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Turno Estándar', '08:00', '17:30', 60),
  ('e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'Turno Estándar', '08:00', '17:30', 60);

-- ─── Grupos de turno ─────────────────────────────────────────────────────────

INSERT INTO grupos_turno (id, empresa_id, nombre, tipo, turno_id) VALUES
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Grupo Fijo', 'fijo', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Grupo Fijo', 'fijo', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2'),
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Grupo Fijo', 'fijo', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3'),
  ('f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4', 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'Grupo Fijo', 'fijo', 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4');

-- ─── Admins (role rrhh → admin en el front) ──────────────────────────────────
-- password: Temporal123

INSERT INTO usuarios (id, empresa_id, sitio_id, rut, nombre, email, password_hash, role) VALUES
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
   'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
   'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
   '90.001.001-1', 'Admin La Florida', 'admin.florida@goalliance.cl',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa', 'rrhh'),

  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',
   'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
   'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
   '90.002.002-2', 'Admin Macul', 'admin.macul@goalliance.cl',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa', 'rrhh'),

  ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3',
   'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
   'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
   '90.003.003-3', 'Admin Ñuñoa', 'admin.nunoa@goalliance.cl',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa', 'rrhh'),

  ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4',
   'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4',
   'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
   '90.004.004-4', 'Admin Providencia', 'admin.providencia@goalliance.cl',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa', 'rrhh');

-- ─── Colaboradores ────────────────────────────────────────────────────────────
-- password: Temporal123

INSERT INTO usuarios (id, empresa_id, sitio_id, rut, nombre, email, password_hash, role) VALUES
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
   'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
   'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
   '16.123.456-7', 'Ivan Gonzalez', 'ivan.gonzalez@goalliance.cl',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa', 'colaborador'),

  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
   'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
   'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
   '17.234.567-8', 'Cristian Florez', 'cristian.florez@goalliance.cl',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa', 'colaborador'),

  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3',
   'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
   'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
   '18.345.678-9', 'Sebastian Huechucura', 'sebastian.huechucura@goalliance.cl',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa', 'colaborador'),

  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4',
   'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4',
   'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
   '19.456.789-0', 'Ricardo Alvarado', 'ricardo.alvarado@goalliance.cl',
   '$2a$12$MwzbUOgWGtch8LnTolYJXuF/A7pFaQ6xcnCppNBbp5hQtnmWfm2wa', 'colaborador');

-- ─── Asignar grupos de turno ──────────────────────────────────────────────────

INSERT INTO usuarios_grupos_turno (usuario_id, empresa_id, grupo_turno_id, fecha_inicio) VALUES
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', '2026-01-01'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', '2026-01-01'),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', '2026-01-01'),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4', '2026-01-01');
