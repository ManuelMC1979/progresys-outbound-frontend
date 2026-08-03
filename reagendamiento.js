const express = require('express');
const { query } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

/* ── helpers ─────────────────────────────────────── */
const esAdmin = r => ['ADMINISTRADOR','SUPERVISOR'].includes(r);
const esEjecutivo = r => r === 'EJECUTIVO';

async function param(clave) {
  const r = await query(`SELECT valor FROM reagendamiento_parametros WHERE clave = $1`, [clave]);
  return r.rows[0]?.valor;
}

async function agregarEvento(idCaso, titulo, detalle) {
  await query(
    `INSERT INTO reagendamiento_eventos (id_caso, titulo, detalle, fecha)
     VALUES ($1,$2,$3,now())`,
    [idCaso, titulo, detalle || null]
  );
}

function calcularFechaLimiteAdmin(fechaIngreso) {
  // SLA ejecutivo → admin: mismo día si antes de corte, siguiente AM si después
  const d = new Date(fechaIngreso);
  const corte = 14; // 14:00 por defecto
  if (d.getHours() < corte) {
    d.setHours(17, 0, 0, 0);
  } else {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  }
  return d;
}

/* ── GET /api/reagendamiento ─────────────────────── */
router.get('/', async (req, res) => {
  try {
    const rol = req.user.rol;
    let rows;
    if (esAdmin(rol)) {
      rows = await query(`
        SELECT rc.*, ra.nombre AS agencia,
               e.nombre || ' ' || COALESCE(e.apellido,'') AS ejecutivo
        FROM reagendamiento_casos rc
        LEFT JOIN reagendamiento_agencias ra ON ra.id_agencia = rc.id_agencia
        LEFT JOIN ejecutivos e ON e.id_ejecutivo = rc.id_ejecutivo
        ORDER BY rc.fecha_creacion DESC
      `);
    } else {
      rows = await query(`
        SELECT rc.*, ra.nombre AS agencia,
               e.nombre || ' ' || COALESCE(e.apellido,'') AS ejecutivo
        FROM reagendamiento_casos rc
        LEFT JOIN reagendamiento_agencias ra ON ra.id_agencia = rc.id_agencia
        LEFT JOIN ejecutivos e ON e.id_ejecutivo = rc.id_ejecutivo
        WHERE rc.id_ejecutivo = $1
        ORDER BY rc.fecha_creacion DESC
      `, [req.user.id_ejecutivo]);
    }
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener casos' });
  }
});

/* ── POST /api/reagendamiento ────────────────────── */
router.post('/', async (req, res) => {
  try {
    const {
      rut_paciente, tipo_atencion, reagendamiento_ley,
      hora_agendada, nombre_paciente, correo, telefono,
      id_agencia, motivo, observaciones, origen, ingresado_bot
    } = req.body;

    if (!rut_paciente) return res.status(400).json({ error: 'RUT requerido' });
    if (!tipo_atencion) return res.status(400).json({ error: 'Tipo de atención requerido' });

    const rol = req.user.rol;
    const esBot = origen === 'BOT' || ingresado_bot === true;
    const puedeCrear = esEjecutivo(rol) || esAdmin(rol) || esBot;
    if (!puedeCrear) return res.status(403).json({ error: 'Sin permisos para crear casos' });

    // Generar folio
    const folioRes = await query(
      `SELECT COUNT(*)+1 AS n FROM reagendamiento_casos`
    );
    const n = String(folioRes.rows[0].n).padStart(6, '0');
    const folio = `REAG-${n}`;

    const ahora = new Date();

    // Estado inicial
    let estadoInicial = 'PENDIENTE_ADMIN';
    if (reagendamiento_ley === 'SI' && hora_agendada) {
      estadoInicial = 'CERRADO';
    }

    const fechaLimiteAdmin = calcularFechaLimiteAdmin(ahora);

    const r = await query(`
      INSERT INTO reagendamiento_casos
        (folio, rut_paciente, nombre_paciente, correo, telefono,
         tipo_atencion, reagendamiento_ley, estado, id_agencia, motivo,
         observaciones, origen, ingresado_bot,
         hora_agendada, id_ejecutivo, usuario_creacion,
         fecha_ingreso_solicitud, fecha_limite_admin, fecha_creacion)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now(),$17,now())
      RETURNING *
    `, [
      folio, rut_paciente, nombre_paciente || null, correo || null, telefono || null,
      tipo_atencion, reagendamiento_ley || 'NO', estadoInicial,
      id_agencia || null, motivo || null,
      observaciones || null, origen || 'MANUAL', ingresado_bot || false,
      hora_agendada || null,
      esEjecutivo(rol) ? req.user.id_ejecutivo : null,
      req.user.id_usuario,
      fechaLimiteAdmin
    ]);

    const caso = r.rows[0];

    // Evento inicial
    const origenLabel = esBot ? 'BOT' : esAdmin(rol) ? 'Admin' : 'Ejecutivo';
    await agregarEvento(caso.id_caso, `Caso creado por ${origenLabel}`,
      `RUT: ${rut_paciente}. Tipo: ${tipo_atencion}. ¿Se agendó?: ${reagendamiento_ley === 'SI' ? 'Sí' : 'No'}`
    );

    if (estadoInicial === 'CERRADO') {
      await agregarEvento(caso.id_caso, 'Caso cerrado — cita agendada',
        `Hora agendada: ${hora_agendada}`
      );
    }

    res.status(201).json(caso);
  } catch (err) {
    console.error(err);
    // Si falla por columna inexistente, dar mensaje claro
    if (err.message.includes('column') && err.message.includes('does not exist')) {
      return res.status(500).json({ error: 'Columna faltante en BD: ' + err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/reagendamiento/:id ─────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const r = await query(`
      SELECT rc.*, ra.nombre AS agencia,
             e.nombre || ' ' || COALESCE(e.apellido,'') AS ejecutivo
      FROM reagendamiento_casos rc
      LEFT JOIN reagendamiento_agencias ra ON ra.id_agencia = rc.id_agencia
      LEFT JOIN ejecutivos e ON e.id_ejecutivo = rc.id_ejecutivo
      WHERE rc.id_caso = $1
    `, [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Caso no encontrado' });

    const eventos = await query(
      `SELECT * FROM reagendamiento_eventos WHERE id_caso = $1 ORDER BY fecha`,
      [req.params.id]
    );
    res.json({ ...r.rows[0], eventos: eventos.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/reagendamiento/:id/observacion ────── */
router.post('/:id/observacion', async (req, res) => {
  try {
    const { observacion } = req.body;
    if (!observacion) return res.status(400).json({ error: 'Observación requerida' });
    await query(
      `UPDATE reagendamiento_casos SET observaciones = $1 WHERE id_caso = $2`,
      [observacion, req.params.id]
    );
    await agregarEvento(req.params.id, 'Observación agregada', observacion);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/reagendamiento/:id/rechazar ───────── */
router.post('/:id/rechazar', async (req, res) => {
  try {
    if (!esAdmin(req.user.rol)) return res.status(403).json({ error: 'Solo Admin' });
    const { hora_agendada } = req.body;
    await query(
      `UPDATE reagendamiento_casos SET estado='RECHAZADO', hora_agendada=$1 WHERE id_caso=$2`,
      [hora_agendada, req.params.id]
    );
    await agregarEvento(req.params.id, 'Rechazado — agendado por Admin',
      `Hora agendada: ${hora_agendada}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/reagendamiento/:id/escalar ────────── */
router.post('/:id/escalar', async (req, res) => {
  try {
    if (!esAdmin(req.user.rol)) return res.status(403).json({ error: 'Solo Admin' });
    const { id_agencia } = req.body;
    const slaHoras = parseInt(await param('sla_administrador_agencia_horas') || '24');
    const fechaLimAgencia = new Date(Date.now() + slaHoras * 3600000);
    await query(
      `UPDATE reagendamiento_casos
       SET estado='ESCALADO_AGENCIA', id_agencia=$1, fecha_limite_agencia=$2
       WHERE id_caso=$3`,
      [id_agencia, fechaLimAgencia, req.params.id]
    );
    const ag = await query(`SELECT nombre FROM reagendamiento_agencias WHERE id_agencia=$1`, [id_agencia]);
    await agregarEvento(req.params.id, 'Escalado a agencia',
      `Agencia: ${ag.rows[0]?.nombre}. SLA: ${slaHoras}h`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/reagendamiento/:id/respuesta-agencia  */
router.post('/:id/respuesta-agencia', async (req, res) => {
  try {
    if (!esAdmin(req.user.rol)) return res.status(403).json({ error: 'Solo Admin' });
    const { resultado } = req.body;
    const slaHoras = parseInt(await param('sla_agencia_administrador_horas') || '24');
    const fechaLimCierre = new Date(Date.now() + slaHoras * 3600000);
    await query(
      `UPDATE reagendamiento_casos
       SET estado='PENDIENTE_CIERRE_ADMIN', resultado=$1, fecha_limite_cierre_admin=$2
       WHERE id_caso=$3`,
      [resultado, fechaLimCierre, req.params.id]
    );
    await agregarEvento(req.params.id, 'Respuesta de agencia recibida', resultado);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/reagendamiento/:id/cerrar-final ───── */
router.post('/:id/cerrar-final', async (req, res) => {
  try {
    if (!esAdmin(req.user.rol)) return res.status(403).json({ error: 'Solo Admin' });
    await query(
      `UPDATE reagendamiento_casos
       SET estado='RESUELTO', fecha_cierre=now()
       WHERE id_caso=$1`,
      [req.params.id]
    );
    await agregarEvento(req.params.id, 'Caso cerrado por Admin', null);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/reagendamiento/alertas ─────────────── */
router.get('/alertas', async (req, res) => {
  try {
    const ahora = new Date();
    const rows = await query(`
      SELECT id_caso AS id_referencia, folio, rut_paciente,
        CASE
          WHEN estado='PENDIENTE_ADMIN' AND fecha_limite_admin < $1 THEN 'SLA_VENCIDO'
          WHEN estado='ESCALADO_AGENCIA' AND fecha_limite_agencia < $1 THEN 'SLA_VENCIDO'
          WHEN estado='PENDIENTE_CIERRE_ADMIN' AND fecha_limite_cierre_admin < $1 THEN 'SLA_VENCIDO'
          ELSE 'SLA_PROXIMO'
        END AS tipo,
        CONCAT('Folio ', folio, ' — ', rut_paciente) AS mensaje,
        fecha_creacion AS fecha
      FROM reagendamiento_casos
      WHERE estado NOT IN ('CERRADO','RESUELTO','RECHAZADO')
        AND (fecha_limite_admin < $1
             OR fecha_limite_agencia < $1
             OR fecha_limite_cierre_admin < $1)
    `, [ahora]);
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/reagendamiento/reportes/dashboard ──── */
router.get('/reportes/dashboard', async (req, res) => {
  try {
    const r = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE reagendamiento_ley='SI') AS ley_si,
        COUNT(*) FILTER (WHERE reagendamiento_ley='NO') AS ley_no,
        COUNT(*) FILTER (WHERE estado='PENDIENTE_ADMIN') AS pendientes,
        COUNT(*) FILTER (WHERE estado='ESCALADO_AGENCIA') AS escalados,
        COUNT(*) FILTER (WHERE estado='PENDIENTE_CIERRE_ADMIN') AS pendientes_cierre,
        COUNT(*) FILTER (WHERE estado='RECHAZADO') AS rechazados,
        COUNT(*) FILTER (WHERE estado IN ('CERRADO','RESUELTO')) AS resueltos,
        COUNT(*) FILTER (WHERE estado='PENDIENTE_ADMIN' AND fecha_limite_admin < now()) AS vencidos_admin,
        COUNT(*) FILTER (WHERE estado='ESCALADO_AGENCIA' AND fecha_limite_agencia < now()) AS vencidos_agencia,
        COUNT(*) FILTER (WHERE estado='PENDIENTE_CIERRE_ADMIN' AND fecha_limite_cierre_admin < now()) AS vencidos_cierre
      FROM reagendamiento_casos
    `);
    const agencias = await query(`
      SELECT ra.nombre AS agencia, COUNT(*) AS total
      FROM reagendamiento_casos rc
      JOIN reagendamiento_agencias ra ON ra.id_agencia = rc.id_agencia
      GROUP BY ra.nombre ORDER BY total DESC
    `);
    const dash = r.rows[0];
    Object.keys(dash).forEach(k => dash[k] = Number(dash[k]));
    dash.por_agencia = agencias.rows.map(a => ({ ...a, total: Number(a.total) }));
    res.json(dash);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/reagendamiento/agencias ────────────── */
router.get('/agencias', async (req, res) => {
  try {
    const r = await query(`SELECT * FROM reagendamiento_agencias WHERE estado='ACTIVO' ORDER BY nombre`);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/reagendamiento/agencias ───────────── */
router.post('/agencias', async (req, res) => {
  try {
    if (!esAdmin(req.user.rol)) return res.status(403).json({ error: 'Solo Admin' });
    const { nombre } = req.body;
    const r = await query(
      `INSERT INTO reagendamiento_agencias (nombre, estado) VALUES ($1,'ACTIVO') RETURNING *`,
      [nombre]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/reagendamiento/parametros ──────────── */
router.get('/parametros', async (req, res) => {
  try {
    const r = await query(`SELECT * FROM reagendamiento_parametros ORDER BY clave`);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PUT /api/reagendamiento/parametros/:clave ───── */
router.put('/parametros/:clave', async (req, res) => {
  try {
    if (!esAdmin(req.user.rol)) return res.status(403).json({ error: 'Solo Admin' });
    const { valor } = req.body;
    await query(
      `UPDATE reagendamiento_parametros SET valor=$1, fecha_actualizacion=now() WHERE clave=$2`,
      [valor, req.params.clave]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
