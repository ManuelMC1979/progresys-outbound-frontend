/* ============================================================
   REAGENDAMIENTO
   ============================================================ */
let catalogoAgencias = [];
let idReagDetalleActual = null;
let casosReagCache = {};
let idEscalarActual = null;

async function cargarCatalogoAgencias() {
  try { catalogoAgencias = await api('/reagendamiento/agencias'); } catch (e) { catalogoAgencias = []; }
}

function etiquetaTipoAtencion(valor) {
  const mapa = { CONTROL: 'Atención Primaria', 'CURACIÓN': 'Curación' };
  return mapa[valor] || valor;
}

function badgeEstadoReag(estado) {
  const map = {
    CERRADO: ['Cerrado', 'cerrado'],
    PENDIENTE_ADMIN: ['Pendiente revisión Admin', 'pendiente'],
    RECHAZADO: ['Rechazado — agendado por Admin', 'gestion'],
    RECHAZADO_MAL_INGRESO: ['Rechazado — mal ingreso', 'alerta'],
    ESCALADO_AGENCIA: ['Escalado a agencia', 'gestion'],
    PENDIENTE_CIERRE_ADMIN: ['Pendiente de cierre (Admin)', 'gestion'],
    RESUELTO: ['Resuelto por agencia', 'gestionado'],
    RESUELTO_PRIMERA_LINEA: ['Resuelto — primera línea', 'gestionado'],
    CERRADO_SIN_CONTACTO: ['Cerrado sin contacto', 'cerrado'],
  };
  const [txt, clase] = map[estado] || [estado, 'pendiente'];
  return `<span class="badge ${clase}">${txt}</span>`;
}

function badgeBot() {
  return `<span style="background:#534AB7; color:white; font-size:9px; font-weight:700; padding:2px 5px; border-radius:4px; margin-left:5px; vertical-align:middle; letter-spacing:0.5px;">BOT</span>`;
}

function textoSla(estadoSla) {
  if (!estadoSla) return '<span style="color:#ccc;">—</span>';
  const colores = { 'VENCIDO': '#d9534f', 'POR VENCER': '#f0ad4e', 'DENTRO DE PLAZO': '#2ecc71' };
  const color = colores[estadoSla] || '#888';
  return `<span style="color:${color}; font-weight:600;">${estadoSla}</span>`;
}

function celdaFolio(c) {
  const esBot = c.origen === 'BOT' || c.ingresado_bot;
  return `<b>${c.folio}</b>${esBot ? badgeBot() : ''}`;
}

async function renderReagendamiento() {
  if (!catalogoAgencias.length) await cargarCatalogoAgencias();
  const contenido = document.getElementById('contenido');
  const esEjecutivo = usuarioActual.rol === 'EJECUTIVO';
  const esAdmin = usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';

  const casosReag = await api('/reagendamiento');

  const bannerSap = `
    <div style="background:#fff3cd; border:1px solid #f0ad4e; border-left:5px solid #f0ad4e; border-radius:8px; padding:14px 16px; margin-bottom:20px; display:flex; gap:12px; align-items:center;">
      <div style="font-size:20px;">⚠️</div>
      <div style="font-size:13px; color:#7a5c00; line-height:1.5; flex:1;">
        <b>Recordatorio importante — Nota externa en SAP:</b><br>
        Al dejar la nota externa en SAP, debe quedar registrada como:<br>
        <b>Gpo. prof.:</b> Administrativo &nbsp;·&nbsp; <b>Categoría:</b> MED:23 Alerta inasistencia control
      </div>
      <button class="btn secundario" style="white-space:nowrap; flex-shrink:0;" onclick="document.getElementById('modalScriptLlamada').classList.add('activo')">Script de llamada</button>
    </div>
  `;

  let bloqueFormulario = '';
  if (esEjecutivo) {
    const bannerAlcance = `
      <div style="background:#e8f6f4; border:1px solid #17b6a7; border-left:5px solid #17b6a7; border-radius:8px; padding:14px 16px; margin-bottom:20px; display:flex; gap:12px; align-items:flex-start;">
        <div style="font-size:20px;">ℹ️</div>
        <div style="font-size:13px; color:var(--azul-marino); line-height:1.5;">
          <b>Recuerda:</b> solo gestionamos pacientes de la Red, no del Hospital.<br>
          Plazo aproximado de respuesta: <b>72 horas hábiles</b>.
        </div>
      </div>
    `;
    bloqueFormulario = `
      ${bannerAlcance}
      <div class="card" style="background:white; border-radius:10px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,0.08); margin-bottom:20px;">
        <h3 style="color:var(--azul-marino); font-size:15px;">Registrar llamada de cambio de cita</h3>
        <label>RUT del paciente</label>
        <input type="text" id="reagRut" placeholder="Ej: 12.345.678-9">
        <label>Tipo de atención</label>
        <select id="reagTipoAtencion">
          <option value="CONTROL">Atención Primaria</option>
          <option value="CURACIÓN">Curación</option>
        </select>
        <label>¿Se logró reagendar en el momento? (Reagendamiento Ley)</label>
        <select id="reagLey" onchange="mostrarBloqueReagSegunLey()">
          <option value="">Selecciona una opción</option>
          <option value="SI">Reagendamiento Ley - Sí</option>
          <option value="NO">Reagendamiento Ley - No</option>
        </select>
        <div id="reagBloqueSi" style="display:none; margin-top:10px;">
          <label>Fecha y hora agendada para el paciente</label>
          <input type="datetime-local" id="reagHoraAgendada">
          <label>Observaciones (opcional)</label>
          <textarea id="reagObsLeySi" rows="2" placeholder="Observaciones del caso..."></textarea>
          <button class="btn" style="margin-top:8px;" onclick="guardarReagLeySi()">Cerrar caso (cita agendada)</button>
        </div>
        <div id="reagBloqueNo" style="display:none; margin-top:10px;">
          <p style="font-size:12px; color:#888;">No hay cita disponible. Ingresa la solicitud completa para escalarla a Administración.</p>
          <button class="btn" onclick="abrirReagModalSolicitud()">Ingresar solicitud completa</button>
        </div>
      </div>
    `;
  }

  let bloquesAdmin = '';
  if (esAdmin) {
    const pendientes = casosReag.filter(c => c.estado === 'PENDIENTE_ADMIN');
    const escalados = casosReag.filter(c => c.estado === 'ESCALADO_AGENCIA');
    const pendientesCierre = casosReag.filter(c => c.estado === 'PENDIENTE_CIERRE_ADMIN');
    const dashReag = await api('/reagendamiento/reportes/dashboard');
    bloquesAdmin = `
      <div class="toolbar">
        <button class="btn secundario" onclick="abrirReagModalNuevaAgencia()">+ Nueva agencia</button>
        <button class="btn secundario" onclick="exportarReagExcel()">Descargar reporte</button>
      </div>

      <h3 style="color:var(--azul-marino);">Dashboard Reagendamiento</h3>
      <div class="kpis" style="margin-bottom:20px;">
        <div class="kpi-card"><div class="valor">${dashReag.total}</div><div class="etiqueta">Total solicitudes</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.ley_si}</div><div class="etiqueta">¿Se agendó? - Sí</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.ley_no}</div><div class="etiqueta">¿Se agendó? - No</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.pendientes}</div><div class="etiqueta">Pendientes revisión</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.escalados}</div><div class="etiqueta">Escalados a agencia</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.pendientes_cierre}</div><div class="etiqueta">Pendientes de cierre (Admin)</div></div>
        <div class="kpi-card alerta"><div class="valor">${dashReag.vencidos_admin + dashReag.vencidos_agencia + dashReag.vencidos_cierre}</div><div class="etiqueta">SLA vencidos</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.rechazados}</div><div class="etiqueta">Rechazados</div></div>
        <div class="kpi-card alerta"><div class="valor">${dashReag.rechazados_mal_ingreso}</div><div class="etiqueta">Mal ingreso (trazabilidad)</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.resueltos_primera_linea}</div><div class="etiqueta">Resueltos primera línea</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.cerrados_sin_contacto}</div><div class="etiqueta">Cerrados sin contacto</div></div>
        <div class="kpi-card"><div class="valor">${dashReag.resueltos}</div><div class="etiqueta">Resueltos</div></div>
      </div>

      <div style="display:flex; gap:24px; flex-wrap:wrap; margin-bottom:24px;">
        <div style="flex:1; min-width:260px; background:white; border-radius:10px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <h4 style="margin:0 0 12px; color:var(--azul-marino); font-size:13px;">¿Se agendó? — Sí vs No</h4>
          ${barraProporcion(dashReag.ley_si, dashReag.ley_no, 'Sí', 'No')}
        </div>
        <div style="flex:2; min-width:300px; background:white; border-radius:10px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <h4 style="margin:0 0 12px; color:var(--azul-marino); font-size:13px;">Casos por agencia</h4>
          ${graficoBarrasAgencias(dashReag.por_agencia)}
        </div>
      </div>

      <h3 style="color:var(--azul-marino);">Pendientes de revisión (${pendientes.length})</h3>
      ${tablaReag(pendientes, 'admin_pendiente')}
      <h3 style="color:var(--azul-marino); margin-top:24px;">Escalados a agencia (${escalados.length})</h3>
      ${tablaReag(escalados, 'admin_escalado')}
      <h3 style="color:var(--azul-marino); margin-top:24px;">Pendientes de cierre — respuesta de agencia recibida (${pendientesCierre.length})</h3>
      ${tablaReag(pendientesCierre, 'admin_pendiente_cierre')}
      <h3 style="color:var(--azul-marino); margin-top:24px;">Historial</h3>
      ${tablaReag(casosReag.filter(c => ['CERRADO','RECHAZADO','RECHAZADO_MAL_INGRESO','RESUELTO','RESUELTO_PRIMERA_LINEA','CERRADO_SIN_CONTACTO'].includes(c.estado)), 'historial')}
    `;
  }

  const bloqueMisCasos = esEjecutivo ? `<h3 style="color:var(--azul-marino); margin-top:24px;">Mis casos de Reagendamiento</h3>${tablaReag(casosReag, 'ejecutivo')}` : '';

  contenido.innerHTML = bannerSap + bloqueFormulario + bloquesAdmin + bloqueMisCasos;
}

function renderIntentosMini(intentos) {
  const arr = intentos || [];
  let html = '<div style="display:flex;gap:4px;justify-content:center;">';
  for (let i = 1; i <= 3; i++) {
    const it = arr.find(x => x.numero_intento === i);
    let clase = 'intento-dot-vacio';
    let titulo = `Intento ${i}: pendiente`;
    if (it) {
      if (it.estado === 'CONFIRMA') { clase = 'intento-dot-confirma'; titulo = `Intento ${i}: Contacto — confirma`; }
      else if (it.estado === 'CONTACTO_NO_AGENDO') { clase = 'intento-dot-noagendo'; titulo = `Intento ${i}: Contacto — no agendó`; }
      else { clase = 'intento-dot-nocontacto'; titulo = `Intento ${i}: No contactado`; }
    }
    html += `<span class="intento-dot ${clase}" title="${titulo}">${i}</span>`;
  }
  return html + '</div>';
}

function tablaReag(lista, contexto) {
  if (lista.length === 0) return '<p style="color:#999;">Sin casos en esta sección.</p>';
  return `
    <table>
      <thead><tr><th>Folio</th><th>RUT</th><th>Tipo</th><th>¿Se agendó?</th><th>Fecha agendada</th><th>Estado</th><th>SLA</th><th style="text-align:center;">Intentos</th><th></th></tr></thead>
      <tbody>
        ${lista.map(c => { casosReagCache[c.id_caso] = c; return `
          <tr>
            <td>${celdaFolio(c)}</td>
            <td>${c.rut_paciente}</td>
            <td>${etiquetaTipoAtencion(c.tipo_atencion)}</td>
            <td>${c.reagendamiento_ley === 'SI' ? 'Sí' : 'No'}</td>
            <td>${c.hora_agendada ? formatFecha(c.hora_agendada) : '—'}</td>
            <td>${badgeEstadoReag(c.estado)}</td>
            <td>${textoSla(c.estado_sla)}</td>
            <td style="text-align:center;">${c.agencia ? renderIntentosMini(c.intentos) : '<span style="color:#ccc;">—</span>'}</td>
            <td style="white-space:nowrap;">
              <button class="btn secundario" onclick='abrirReagDetalle(${JSON.stringify(c.id_caso)})'>Ver detalle</button>
              ${!(c.origen === 'BOT' || c.ingresado_bot) ? `<button class="btn secundario" onclick='abrirModalObsReag(${JSON.stringify(c.id_caso)})'>+ Obs.</button>` : ''}
              ${contexto === 'admin_pendiente' ? `
                ${!(c.origen === 'BOT' || c.ingresado_bot) ? `<button class="btn secundario" onclick="abrirReagModalRechazar('${c.id_caso}')">Rechazar y agendar</button>` : ''}
                <button class="btn" onclick="abrirEscalarConScript('${c.id_caso}')">Confirmar sin cita → Escalar</button>
                ${(c.origen === 'BOT' || c.ingresado_bot) ? `<button class="btn secundario" style="color:var(--rojo); border-color:var(--rojo);" onclick="abrirReagModalRechazarMalIngreso('${c.id_caso}')">Rechazar por mal ingreso</button>` : ''}
              ` : ''}
              ${contexto === 'admin_escalado' ? `<button class="btn" onclick="abrirReagModalRespuesta('${c.id_caso}')">Registrar respuesta agencia</button>` : ''}
              ${contexto === 'admin_pendiente_cierre' ? `<button class="btn" onclick="cerrarReagFinal('${c.id_caso}')">Cerrar caso</button>` : ''}
            </td>
          </tr>
        `; }).join('')}
      </tbody>
    </table>
  `;
}

/* --- Observación rápida desde tabla --- */
function abrirModalObsReag(idCaso) {
  const obs = prompt('Ingresa la observación para este caso:');
  if (!obs || !obs.trim()) return;
  api(`/reagendamiento/${idCaso}/observacion`, {
    method: 'POST',
    body: JSON.stringify({ observacion: obs.trim() })
  }).then(() => {
    if (idReagDetalleActual === idCaso) {
      abrirReagDetalle(idCaso);
    } else {
      renderReagendamiento();
    }
  }).catch(err => alert('Error: ' + err.message));
}

async function abrirReagDetalle(idCaso) {
  idReagDetalleActual = idCaso;
  document.getElementById('tituloVista').textContent = 'Detalle del caso — Reagendamiento';
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoFicha();
  try {
    const caso = await api(`/reagendamiento/${idCaso}`);
    renderReagDetalle(caso);
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
  }
}

function renderReagDetalle(caso) {
  casosReagCache[caso.id_caso] = caso;
  const contenido = document.getElementById('contenido');
  const esAdmin = usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';

  const eventos = (caso.eventos || []).map(e => ({ titulo: e.titulo, detalle: e.detalle, fecha: e.fecha }));

  let acciones = '';
  if (caso.estado === 'PENDIENTE_ADMIN' && esAdmin) {
    acciones = `
      <button class="btn secundario" onclick="abrirReagModalRechazar('${caso.id_caso}')">Rechazar y agendar</button>
      <button class="btn" onclick="abrirEscalarConScript('${caso.id_caso}')">Confirmar sin cita → Escalar</button>
      ${(caso.origen === 'BOT' || caso.ingresado_bot) ? `<button class="btn secundario" style="color:var(--rojo); border-color:var(--rojo);" onclick="abrirReagModalRechazarMalIngreso('${caso.id_caso}')">Rechazar por mal ingreso</button>` : ''}
    `;
  } else if (caso.estado === 'ESCALADO_AGENCIA' && esAdmin) {
    acciones = `<button class="btn" onclick="abrirReagModalRespuesta('${caso.id_caso}')">Registrar respuesta agencia</button>`;
  } else if (caso.estado === 'PENDIENTE_CIERRE_ADMIN' && esAdmin) {
    acciones = `<button class="btn" onclick="cerrarReagFinal('${caso.id_caso}')">Cerrar caso</button>`;
  }

  contenido.innerHTML = `
    <button class="btn secundario" onclick="idReagDetalleActual = null; cargarVista('reagendamiento')" style="margin-bottom:16px;">← Volver a Reagendamiento</button>

    <div class="kpis" style="margin-bottom:24px;">
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${caso.rut_paciente}</div><div class="etiqueta">RUT paciente</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${caso.ejecutivo || '—'}</div><div class="etiqueta">Ejecutivo</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${badgeEstadoReag(caso.estado)}</div><div class="etiqueta">Estado</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${caso.reagendamiento_ley === 'SI' ? 'Sí' : 'No'}</div><div class="etiqueta">¿Se agendó?</div></div>
      ${caso.hora_agendada ? `<div class="kpi-card"><div class="valor" style="font-size:13px;">${formatFecha(caso.hora_agendada)}</div><div class="etiqueta">Fecha y hora agendada</div></div>` : ''}
      ${(caso.origen === 'BOT' || caso.ingresado_bot) ? `<div class="kpi-card" style="border-left-color:#534AB7;"><div class="valor" style="font-size:16px;color:#534AB7;">BOT</div><div class="etiqueta">Origen</div></div>` : ''}
    </div>

    <div style="display:flex; gap:24px; flex-wrap:wrap;">
      <div style="flex:2; min-width:320px;">
        <h3 style="color:var(--azul-marino); font-size:15px;">Línea de tiempo</h3>
        <div style="position:relative; padding-left:24px; border-left:2px solid #ddd; margin-top:16px;">
          ${eventos.map(ev => `
            <div style="position:relative; margin-bottom:22px;">
              <div style="position:absolute; left:-31px; top:2px; width:12px; height:12px; border-radius:50%; background:var(--turquesa); border:2px solid white; box-shadow:0 0 0 2px var(--turquesa);"></div>
              <div style="font-weight:600; font-size:13px; color:var(--azul-marino);">${ev.titulo}</div>
              <div style="font-size:12px; color:#888; margin:2px 0;">${formatFecha(ev.fecha)}</div>
              <div style="font-size:13px;">${ev.detalle || ''}</div>
            </div>
          `).join('')}
          ${eventos.length === 0 ? '<p style="color:#999;">Sin eventos registrados.</p>' : ''}
        </div>
      </div>

      <div style="flex:1; min-width:260px;">
        <h3 style="color:var(--azul-marino); font-size:15px;">Datos del caso</h3>
        <table style="margin-top:12px;">
          <tbody>
            <tr><td><b>Folio</b></td><td>${caso.folio || '—'}</td></tr>
            <tr><td><b>Nombre paciente</b></td><td>${caso.nombre_paciente || '—'}</td></tr>
            <tr><td><b>Correo</b></td><td>${caso.correo || '—'}</td></tr>
            <tr><td><b>Teléfono</b></td><td>${caso.telefono || '—'}</td></tr>
            <tr><td><b>Tipo de atención</b></td><td>${etiquetaTipoAtencion(caso.tipo_atencion) || '—'}</td></tr>
            <tr><td><b>Agencia</b></td><td>${caso.agencia || '—'}</td></tr>
            <tr><td><b>Fecha límite Admin</b></td><td>${formatFecha(caso.fecha_limite_admin)}</td></tr>
            <tr><td><b>Fecha límite Agencia</b></td><td>${formatFecha(caso.fecha_limite_agencia)}</td></tr>
            <tr><td><b>Fecha y hora agendada</b></td><td>${caso.hora_agendada ? formatFecha(caso.hora_agendada) : '—'}</td></tr>
            <tr><td><b>Motivo</b></td><td>${caso.motivo || '—'}</td></tr>
            <tr><td><b>Resultado</b></td><td>${caso.resultado || '—'}</td></tr>
            <tr><td><b>Observaciones</b></td><td>${caso.observaciones || '—'}</td></tr>
          </tbody>
        </table>

        <div style="margin-top:16px;">
          <label style="font-size:13px; font-weight:600; color:var(--azul-marino);">Agregar observación</label>
          <textarea id="obsDetalleReag" rows="2" style="width:100%; margin-top:6px; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;" placeholder="Escribe una observación..."></textarea>
          <button class="btn secundario" style="margin-top:6px;" onclick="guardarObsDesdeDetalle('${caso.id_caso}')">Guardar observación</button>
        </div>

        ${acciones ? `<div style="margin-top:20px; display:flex; gap:8px; flex-wrap:wrap;">${acciones}</div>` : ''}
      </div>
    </div>

    ${caso.agencia ? panelIntentos(caso) : ''}
  `;
}

function panelIntentos(caso) {
  const intentos = (caso.intentos || []).slice().sort((a, b) => a.numero_intento - b.numero_intento);
  const siguiente = intentos.length + 1;
  const casoAbierto = !['RESUELTO', 'CERRADO', 'RECHAZADO_MAL_INGRESO', 'RESUELTO_PRIMERA_LINEA', 'CERRADO_SIN_CONTACTO'].includes(caso.estado);

  const etiquetaIntento = {
    CONFIRMA: ['Contacto — confirma', 'estado-confirma'],
    NO_CONTACTO: ['No contactado', 'estado-nocontacto'],
    CONTACTO_NO_AGENDO: ['Contacto — no agendó', 'estado-noagendo'],
  };

  const filas = intentos.map(it => {
    const [etiqueta, claseEstado] = etiquetaIntento[it.estado] || [it.estado, 'estado-nocontacto'];
    return `
      <div class="intento-fila">
        <div class="intento-num">${it.numero_intento}</div>
        <div class="intento-info">
          <div class="intento-estado ${claseEstado}">${etiqueta}</div>
          <div class="intento-fecha">${formatFecha(it.fecha)}</div>
          ${it.observacion ? `<div class="intento-obs">${it.observacion}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const filaSiguiente = (siguiente <= 3 && casoAbierto) ? `
    <div class="intento-fila intento-fila-pendiente">
      <div class="intento-num intento-num-pendiente">${siguiente}</div>
      <div class="intento-info">
        <div style="font-size:12px; color:#888; margin-bottom:6px;">Intento ${siguiente} pendiente de registrar</div>
        <textarea id="obsIntento${siguiente}" rows="2"
          placeholder="Observación — obligatoria si el paciente no quiere agendar"
          style="width:100%; padding:6px 8px; border:1px solid #ccc; border-radius:5px; font-size:12px; margin-bottom:6px;"></textarea>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn secundario" onclick="registrarIntento('${caso.id_caso}', 'CONFIRMA', ${siguiente})">Contacto — confirma</button>
          <button class="btn secundario" onclick="registrarIntento('${caso.id_caso}', 'NO_CONTACTO', ${siguiente})">No contactado</button>
          <button class="btn secundario" style="color:var(--rojo); border-color:var(--rojo);"
            onclick="registrarIntento('${caso.id_caso}', 'CONTACTO_NO_AGENDO', ${siguiente})">Contacto — no agendó</button>
        </div>
        ${siguiente === 3 ? `<div style="font-size:11px; color:var(--rojo); margin-top:6px;">⚠ Este es el 3er y último intento — si no hay contacto, el caso se cerrará automáticamente.</div>` : ''}
      </div>
    </div>
  ` : '';

  return `
    <div style="background:white; border-radius:10px; border:1px solid #e0e0e0; padding:16px; margin-top:20px;">
      <h3 style="color:var(--azul-marino); font-size:15px; margin-bottom:12px;">Intentos de llamado — Agencia: ${caso.agencia}</h3>
      ${filas}${filaSiguiente}
      ${intentos.length === 0 && !casoAbierto ? '<p style="color:#999; font-size:13px;">No se registraron intentos.</p>' : ''}
    </div>
  `;
}

async function registrarIntento(idCaso, estado, numero) {
  const campoObs = document.getElementById(`obsIntento${numero}`);
  const obs = campoObs ? campoObs.value.trim() : '';
  if (estado === 'CONTACTO_NO_AGENDO' && !obs) {
    alert('Debes indicar el motivo por el que el paciente no quiso agendar.');
    if (campoObs) campoObs.focus();
    return;
  }
  try {
    await api(`/reagendamiento/${idCaso}/intentos`, {
      method: 'POST',
      body: JSON.stringify({ estado, observacion: obs || undefined })
    });
    abrirReagDetalle(idCaso);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function guardarObsDesdeDetalle(idCaso) {
  const obs = document.getElementById('obsDetalleReag').value.trim();
  if (!obs) { alert('Escribe una observación antes de guardar'); return; }
  try {
    await api(`/reagendamiento/${idCaso}/observacion`, { method: 'POST', body: JSON.stringify({ observacion: obs }) });
    abrirReagDetalle(idCaso);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function mostrarBloqueReagSegunLey() {
  const v = document.getElementById('reagLey').value;
  document.getElementById('reagBloqueSi').style.display = v === 'SI' ? 'block' : 'none';
  document.getElementById('reagBloqueNo').style.display = v === 'NO' ? 'block' : 'none';
}

async function guardarReagLeySi() {
  const rut = document.getElementById('reagRut').value.trim();
  const tipo = document.getElementById('reagTipoAtencion').value;
  const hora = document.getElementById('reagHoraAgendada').value;
  const obs = document.getElementById('reagObsLeySi').value.trim();
  if (!rut || !hora) { alert('Ingresa el RUT y la hora agendada'); return; }
  try {
    const caso = await api('/reagendamiento', {
      method: 'POST',
      body: JSON.stringify({ rut_paciente: rut, tipo_atencion: tipo, reagendamiento_ley: 'SI', hora_agendada: hora, observaciones: obs || undefined })
    });
    alert(`Caso ${caso.folio} cerrado correctamente.`);
    renderReagendamiento();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalSolicitud() {
  const rut = document.getElementById('reagRut').value.trim();
  if (!rut) { alert('Ingresa primero el RUT del paciente'); return; }
  document.getElementById('reagRutOculto').value = rut;
  document.getElementById('reagNombre').value = '';
  document.getElementById('reagCorreo').value = '';
  document.getElementById('reagTelefono').value = '';
  document.getElementById('reagAgenciaSolicitud').innerHTML = '<option value="">Selecciona una agencia</option>' +
    catalogoAgencias.map(a => `<option value="${a.id_agencia}">${a.nombre}</option>`).join('');
  document.getElementById('reagMotivo').value = '';
  // Restaurar visibilidad motivo en flujo normal ejecutivo
  const labelMotivoNorm = document.getElementById('reagMotivo').previousElementSibling;
  if (labelMotivoNorm && labelMotivoNorm.tagName === 'LABEL') labelMotivoNorm.style.display = '';
  document.getElementById('reagMotivo').style.display = '';
  document.getElementById('modalReagSolicitud').classList.add('activo');
}

async function guardarReagSolicitud() {
  const body = {
    rut_paciente: document.getElementById('reagRutOculto').value,
    tipo_atencion: document.getElementById('reagTipoAtencion').value,
    reagendamiento_ley: 'NO',
    nombre_paciente: document.getElementById('reagNombre').value.trim(),
    correo: document.getElementById('reagCorreo').value.trim(),
    telefono: document.getElementById('reagTelefono').value.trim(),
    id_agencia: Number(document.getElementById('reagAgenciaSolicitud').value) || undefined,
    motivo: document.getElementById('reagMotivo').value.trim()
  };
  if (!body.nombre_paciente || !body.id_agencia || !body.motivo) { alert('Completa nombre, agencia y motivo'); return; }
  try {
    const caso = await api('/reagendamiento', { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalReagSolicitud');
    alert(`Solicitud enviada. Folio: ${caso.folio}`);
    renderReagendamiento();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* ============================================================
   INGRESO BOT — muestra el formulario del ejecutivo con badge BOT
   ============================================================ */
/* ============================================================
   ESCALAR A AGENCIA — con script de correo, usando el folio ya creado
   ============================================================ */
function abrirEscalarConScript(idCaso) {
  idEscalarActual = idCaso;
  const caso = casosReagCache[idCaso];
  if (!caso) { alert('No se encontró el caso. Vuelve a la lista e intenta de nuevo.'); return; }

  const contenido = document.getElementById('contenido');
  document.getElementById('tituloVista').textContent = 'Confirmar sin cita — Escalar a agencia';

  contenido.innerHTML = `
    <button class="btn secundario" onclick="idReagDetalleActual = null; cargarVista('reagendamiento')" style="margin-bottom:16px;">← Volver a Reagendamiento</button>

    <div style="background:#fff3cd; border-left:5px solid #f0ad4e; border-radius:8px; padding:12px 16px; margin-bottom:16px; font-size:13px; color:#7a5c00; line-height:1.5;">
      Folio <b>${caso.folio}</b> — se confirma que no hay cita disponible y se deriva a la agencia indicada.
    </div>

    <div style="display:flex; gap:20px; flex-wrap:wrap;">
      <div style="flex:1; min-width:300px; background:white; border-radius:10px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <h3 style="color:var(--azul-marino); font-size:15px; margin-bottom:14px;">Datos del folio</h3>

        <table style="margin-bottom:14px;">
          <tbody>
            <tr><td><b>RUT</b></td><td>${caso.rut_paciente || '—'}</td></tr>
            <tr><td><b>Nombre</b></td><td>${caso.nombre_paciente || '—'}</td></tr>
            <tr><td><b>Teléfono</b></td><td>${caso.telefono || '—'}</td></tr>
            <tr><td><b>Tipo de atención</b></td><td>${etiquetaTipoAtencion(caso.tipo_atencion) || '—'}</td></tr>
          </tbody>
        </table>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Fecha cita original</label>
            <input type="date" id="escFecha" onchange="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Hora cita original</label>
            <input type="time" id="escHora" onchange="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <div style="margin-top:10px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Agencia a derivar</label>
          <select id="escAgencia" onchange="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
            <option value="">— Selecciona una agencia —</option>
            ${catalogoAgencias.map(a => `<option value="${a.id_agencia}" ${caso.id_agencia === a.id_agencia ? 'selected' : ''}>${a.nombre}</option>`).join('')}
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Ejecutivo/a Contact Center</label>
            <input type="text" id="escEjecutivo" placeholder="Tu nombre" value="${usuarioActual.nombre || ''}" oninput="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Nombre ejecutiva agencia (destinatario)</label>
            <input type="text" id="escDest" placeholder="Nombre de quien recibe" oninput="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px; border-top:1px solid #eee; padding-top:14px;">
          <button class="btn secundario" onclick="idReagDetalleActual = null; cargarVista('reagendamiento')">Cancelar</button>
          <button class="btn" onclick="guardarEscalarConScript('${caso.id_caso}')">Escalar (SLA 24h)</button>
        </div>
      </div>

      <div style="flex:1; min-width:280px;">
        <div style="background:white; border:1px solid #17b6a7; border-radius:10px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,.08);">
          <h3 style="color:var(--azul-marino); font-size:14px; margin-bottom:10px;">✉ Script de correo</h3>
          <div style="background:#f4f6f8; border-radius:6px; padding:8px 10px; font-size:12px; margin-bottom:8px;">
            <span style="font-weight:700; color:var(--azul-marino);">Asunto:</span> Derivación reagendamiento paciente STP – gestión local
          </div>
          <div id="scriptCorreoEscalar" style="background:#f9f9f9; border:1px solid #e5e5e5; border-radius:6px; padding:10px 12px; font-size:12px; color:#333; line-height:1.6; white-space:pre-wrap; font-family:inherit;"></div>
          <button class="btn secundario" style="margin-top:8px; width:100%;" onclick="copiarScriptCorreoEscalar()">Copiar correo</button>
        </div>
      </div>
    </div>
  `;

  actualizarScriptEscalar();
}

function actualizarScriptEscalar() {
  const el = document.getElementById('scriptCorreoEscalar');
  if (!el) return;
  const caso = casosReagCache[idEscalarActual] || {};

  const v = id => { const e = document.getElementById(id); return e ? e.value.trim() || '…' : '…'; };
  const fechaRaw = document.getElementById('escFecha') ? document.getElementById('escFecha').value : '';
  let fecha = '…';
  if (fechaRaw) {
    const d = new Date(fechaRaw + 'T12:00:00');
    fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  const hora = document.getElementById('escHora') ? (document.getElementById('escHora').value || '…') : '…';
  const agenciaEl = document.getElementById('escAgencia');
  const agencia = agenciaEl && agenciaEl.value ? agenciaEl.options[agenciaEl.selectedIndex].text : '…';
  const tipo = etiquetaTipoAtencion(caso.tipo_atencion) || '…';

  el.textContent = `Hola ${v('escDest')}:

Derivamos solicitud de reagendamiento de paciente STP, ya que desde Contact Center no fue posible encontrar disponibilidad dentro de los próximos 3 días hábiles.

Paciente: ${caso.nombre_paciente || '…'}
RUT: ${caso.rut_paciente || '…'}
Teléfono: ${caso.telefono || '…'}
Cita original: ${tipo} – ${fecha} – ${hora}
Centro / Agencia: ${agencia}
Motivo informado: ${caso.motivo || '…'}

Se solicita revisar alternativas de agenda de manera local y contactar al paciente directamente para informar la nueva fecha, priorizando la continuidad de su tratamiento.

Saludos,
${v('escEjecutivo')}`;
}

function copiarScriptCorreoEscalar() {
  const el = document.getElementById('scriptCorreoEscalar');
  if (!el) return;
  const asunto = 'Asunto: Derivación reagendamiento paciente STP – gestión local';
  const texto = asunto + '\n\n' + el.textContent;
  navigator.clipboard.writeText(texto)
    .then(() => { alert('Correo copiado al portapapeles.'); })
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = texto; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      alert('Correo copiado al portapapeles.');
    });
}

async function guardarEscalarConScript(idCaso) {
  const idAgencia = Number(document.getElementById('escAgencia').value);
  if (!idAgencia) { alert('Selecciona una agencia'); return; }
  try {
    await api(`/reagendamiento/${idCaso}/escalar`, { method: 'POST', body: JSON.stringify({ id_agencia: idAgencia }) });
    alert('Caso escalado a agencia correctamente.');
    idReagDetalleActual = null;
    cargarVista('reagendamiento');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRechazar(idCaso) {
  document.getElementById('reagRechazarId').value = idCaso;
  document.getElementById('reagRechazarHora').value = '';
  document.getElementById('reagRechazarObservacion').value = '';
  document.getElementById('modalReagRechazar').classList.add('activo');
}

async function guardarReagRechazo() {
  const id = document.getElementById('reagRechazarId').value;
  const hora = document.getElementById('reagRechazarHora').value;
  const obs = document.getElementById('reagRechazarObservacion').value.trim();
  if (!hora) { alert('Ingresa la hora agendada'); return; }
  try {
    await api(`/reagendamiento/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ hora_agendada: hora, observacion: obs || undefined }) });
    cerrarModal('modalReagRechazar');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRechazarMalIngreso(idCaso) {
  document.getElementById('reagMalIngresoId').value = idCaso;
  document.getElementById('reagMalIngresoMotivo').value = '';
  document.getElementById('modalReagRechazarMalIngreso').classList.add('activo');
}

async function guardarReagRechazoMalIngreso() {
  const id = document.getElementById('reagMalIngresoId').value;
  const motivo = document.getElementById('reagMalIngresoMotivo').value;
  if (!motivo) { alert('Selecciona el motivo del mal ingreso'); return; }
  try {
    await api(`/reagendamiento/${id}/rechazar-mal-ingreso`, { method: 'POST', body: JSON.stringify({ motivo_rechazo_mal_ingreso: motivo }) });
    cerrarModal('modalReagRechazarMalIngreso');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRespuesta(idCaso) {
  document.getElementById('reagRespuestaId').value = idCaso;
  document.getElementById('reagRespuestaTexto').value = '';
  document.getElementById('reagRespuestaSeAgendo').value = '';
  document.getElementById('reagRespuestaFechaHora').value = '';
  document.getElementById('bloqueRespuestaFecha').style.display = 'none';
  document.getElementById('modalReagRespuesta').classList.add('activo');
}

function mostrarBloqueRespuestaSegunAgendo() {
  const v = document.getElementById('reagRespuestaSeAgendo').value;
  document.getElementById('bloqueRespuestaFecha').style.display = v === 'SI' ? 'block' : 'none';
}

async function guardarReagRespuesta() {
  const id = document.getElementById('reagRespuestaId').value;
  const resultado = document.getElementById('reagRespuestaTexto').value.trim();
  const seAgendo = document.getElementById('reagRespuestaSeAgendo').value;
  const fechaHora = document.getElementById('reagRespuestaFechaHora').value;
  if (!seAgendo) { alert('Indica si se agendó la cita'); return; }
  if (seAgendo === 'SI' && !fechaHora) { alert('Ingresa la fecha y hora del agendamiento'); return; }
  if (!resultado) { alert('Ingresa el detalle entregado por la agencia'); return; }
  try {
    await api(`/reagendamiento/${id}/respuesta-agencia`, {
      method: 'POST',
      body: JSON.stringify({ resultado, se_agendo: seAgendo, hora_agendada: seAgendo === 'SI' ? fechaHora : undefined })
    });
    cerrarModal('modalReagRespuesta');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function barraProporcion(valorA, valorB, etiquetaA, etiquetaB) {
  const total = valorA + valorB || 1;
  const pctA = ((valorA / total) * 100).toFixed(0);
  const pctB = ((valorB / total) * 100).toFixed(0);
  return `
    <div style="display:flex; height:28px; border-radius:6px; overflow:hidden; margin-bottom:10px;">
      <div style="width:${pctA}%; background:var(--verde); display:flex; align-items:center; justify-content:center; color:white; font-size:11px;">${pctA}%</div>
      <div style="width:${pctB}%; background:var(--amarillo); display:flex; align-items:center; justify-content:center; color:white; font-size:11px;">${pctB}%</div>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:12px;">
      <span><span style="display:inline-block; width:10px; height:10px; background:var(--verde); border-radius:2px; margin-right:4px;"></span>${etiquetaA} (${valorA})</span>
      <span><span style="display:inline-block; width:10px; height:10px; background:var(--amarillo); border-radius:2px; margin-right:4px;"></span>${etiquetaB} (${valorB})</span>
    </div>
  `;
}

function graficoBarrasAgencias(porAgencia) {
  if (!porAgencia || porAgencia.length === 0) return '<p style="color:#999; font-size:12px;">Sin datos aún.</p>';
  const max = Math.max(...porAgencia.map(a => a.total), 1);
  return porAgencia.map(a => `
    <div style="margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;">
        <span>${a.agencia}</span><span><b>${a.total}</b></span>
      </div>
      <div style="background:#eee; border-radius:4px; height:12px;">
        <div style="width:${(a.total / max) * 100}%; background:var(--turquesa); height:12px; border-radius:4px;"></div>
      </div>
    </div>
  `).join('');
}

async function exportarReagExcel() {
  mostrarCargandoGlobal();
  try {
    const res = await fetch(`${API_BASE}/reagendamiento/reportes/exportar-excel`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudo generar el reporte');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Reagendamiento_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error al generar el reporte: ' + err.message);
  } finally {
    ocultarCargandoGlobal();
  }
}

async function cerrarReagFinal(idCaso) {
  if (!confirm('¿Confirmas el cierre de este caso tras revisar la respuesta de la agencia?')) return;
  try {
    await api(`/reagendamiento/${idCaso}/cerrar-final`, { method: 'POST' });
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalNuevaAgencia() {
  const nombre = prompt('Nombre de la nueva agencia:');
  if (!nombre) return;
  api('/reagendamiento/agencias', { method: 'POST', body: JSON.stringify({ nombre }) })
    .then(() => { cargarCatalogoAgencias().then(renderReagendamiento); })
    .catch(err => alert('Error: ' + err.message));
}
