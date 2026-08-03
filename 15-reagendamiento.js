/* ============================================================
   REAGENDAMIENTO
   ============================================================ */
let catalogoAgencias = [];
let idReagDetalleActual = null;

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
    ESCALADO_AGENCIA: ['Escalado a agencia', 'gestion'],
    PENDIENTE_CIERRE_ADMIN: ['Pendiente de cierre (Admin)', 'gestion'],
    RESUELTO: ['Resuelto por agencia', 'gestionado']
  };
  const [txt, clase] = map[estado] || [estado, 'pendiente'];
  return `<span class="badge ${clase}">${txt}</span>`;
}

function badgeBot() {
  return `<span style="background:#534AB7; color:white; font-size:9px; font-weight:700; padding:2px 5px; border-radius:4px; margin-left:5px; vertical-align:middle; letter-spacing:0.5px;">BOT</span>`;
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
    <div style="background:#fff3cd; border:1px solid #f0ad4e; border-left:5px solid #f0ad4e; border-radius:8px; padding:14px 16px; margin-bottom:20px; display:flex; gap:12px; align-items:flex-start;">
      <div style="font-size:20px;">⚠️</div>
      <div style="font-size:13px; color:#7a5c00; line-height:1.5;">
        <b>Recordatorio importante — Nota externa en SAP:</b><br>
        Al dejar la nota externa en SAP, debe quedar registrada como:<br>
        <b>Gpo. prof.:</b> Administrativo &nbsp;·&nbsp; <b>Categoría:</b> MED:23 Alerta inasistencia control
      </div>
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
        <button class="btn" onclick="abrirFormAdminDirecto()">+ Ingresar caso directo</button>
        <button class="btn" style="background:#534AB7;" onclick="abrirFormBot()">+ Ingresar folio BOT</button>
        <button class="btn secundario" onclick="abrirReagModalNuevaAgencia()">+ Nueva agencia</button>
        <button class="btn secundario" onclick="exportarReagExcel()">Exportar a Excel</button>
        <button class="btn secundario" onclick="exportarReagCSV()">Descargar reporte CSV</button>
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
      ${tablaReag(casosReag.filter(c => ['CERRADO','RECHAZADO','RESUELTO'].includes(c.estado)), 'historial')}
    `;
  }

  const bloqueMisCasos = esEjecutivo ? `<h3 style="color:var(--azul-marino); margin-top:24px;">Mis casos de Reagendamiento</h3>${tablaReag(casosReag, 'ejecutivo')}` : '';

  contenido.innerHTML = bannerSap + bloqueFormulario + bloquesAdmin + bloqueMisCasos;
}

function tablaReag(lista, contexto) {
  if (lista.length === 0) return '<p style="color:#999;">Sin casos en esta sección.</p>';
  return `
    <table>
      <thead><tr><th>Folio</th><th>RUT</th><th>Tipo</th><th>¿Se agendó?</th><th>Fecha agendada</th><th>Estado</th><th>SLA</th><th></th></tr></thead>
      <tbody>
        ${lista.map(c => `
          <tr>
            <td>${celdaFolio(c)}</td>
            <td>${c.rut_paciente}</td>
            <td>${etiquetaTipoAtencion(c.tipo_atencion)}</td>
            <td>${c.reagendamiento_ley === 'SI' ? 'Sí' : 'No'}</td>
            <td>${c.hora_agendada ? formatFecha(c.hora_agendada) : '—'}</td>
            <td>${badgeEstadoReag(c.estado)}</td>
            <td>${c.estado_sla || '—'}</td>
            <td style="white-space:nowrap;">
              <button class="btn secundario" onclick='abrirReagDetalle(${JSON.stringify(c.id_caso)})'>Ver detalle</button>
              <button class="btn secundario" onclick='abrirModalObsReag(${JSON.stringify(c.id_caso)})'>+ Obs.</button>
              ${contexto === 'admin_pendiente' ? `
                <button class="btn secundario" onclick="abrirReagModalRechazar('${c.id_caso}')">Rechazar y agendar</button>
                <button class="btn" onclick="abrirReagModalEscalar('${c.id_caso}')">Confirmar sin cita → Escalar</button>
              ` : ''}
              ${contexto === 'admin_escalado' ? `<button class="btn" onclick="abrirReagModalRespuesta('${c.id_caso}')">Registrar respuesta agencia</button>` : ''}
              ${contexto === 'admin_pendiente_cierre' ? `<button class="btn" onclick="cerrarReagFinal('${c.id_caso}')">Cerrar caso</button>` : ''}
            </td>
          </tr>
        `).join('')}
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
  const contenido = document.getElementById('contenido');
  const esAdmin = usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';

  const eventos = (caso.eventos || []).map(e => ({ titulo: e.titulo, detalle: e.detalle, fecha: e.fecha }));

  let acciones = '';
  if (caso.estado === 'PENDIENTE_ADMIN' && esAdmin) {
    acciones = `
      <button class="btn secundario" onclick="abrirReagModalRechazar('${caso.id_caso}')">Rechazar y agendar</button>
      <button class="btn" onclick="abrirReagModalEscalar('${caso.id_caso}')">Confirmar sin cita → Escalar</button>
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
  `;
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
   INGRESO BOT — crea el caso y gestiona en el mismo paso
   El caso nace como PENDIENTE_ADMIN y se resuelve de inmediato:
   Sí agendó → cierra | No agendó → deriva a agencia
   ============================================================ */
function abrirFormBot() {
  const contenido = document.getElementById('contenido');
  document.getElementById('tituloVista').textContent = 'Ingresar folio BOT';
  contenido.innerHTML = `
    <button class="btn secundario" onclick="cargarVista('reagendamiento')" style="margin-bottom:16px;">← Volver a Reagendamiento</button>

    <div style="background:#ede9ff; border:1px solid #534AB7; border-left:5px solid #534AB7; border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:13px; color:#26215C; line-height:1.5; display:flex; gap:10px; align-items:flex-start;">
      <span style="background:#534AB7; color:white; font-size:10px; font-weight:700; padding:3px 7px; border-radius:4px; flex-shrink:0; margin-top:1px;">BOT</span>
      <span>El folio se crea como <b>Pendiente de revisión</b> y se gestiona de inmediato en este mismo formulario.</span>
    </div>

    <div style="display:flex; gap:20px; flex-wrap:wrap;">

      <div style="flex:1; min-width:300px; background:white; border-radius:10px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <h3 style="color:var(--azul-marino); font-size:14px; margin-bottom:14px; border-bottom:2px solid #534AB7; padding-bottom:8px;">Paso 1 — Datos del paciente</h3>

        <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">RUT del paciente</label>
        <input type="text" id="botRut" placeholder="12.345.678-9" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:10px;">

        <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Nombre del paciente</label>
        <input type="text" id="botNombre" placeholder="Nombre completo" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:10px;">

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Teléfono</label>
            <input type="text" id="botTel" placeholder="+56 9 1234 5678" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Correo</label>
            <input type="email" id="botCorreo" placeholder="paciente@correo.cl" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Tipo de atención</label>
        <select id="botTipo" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:10px;">
          <option value="CONTROL">Atención Primaria</option>
          <option value="CURACIÓN">Curación</option>
        </select>

        <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Motivo</label>
        <select id="botMotivo" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:10px;">
          <option>Enfermedad</option>
          <option>Hospitalización o urgencia</option>
          <option>Fallecimiento de familiar directo o indirecto pero cercano</option>
          <option>Cuidado de otra persona</option>
          <option>Citación judicial, tribunal, fiscalía, comisaría u organismo obligatorio</option>
          <option>Constancia de Carabineros</option>
          <option>Problema de transporte ACHS</option>
          <option>Trámite personal urgente</option>
          <option>Error de agendamiento/información</option>
        </select>

        <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Agencia</label>
        <select id="botAgenciaPaso1" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:10px;">
          <option value="">— Selecciona una agencia —</option>
          ${catalogoAgencias.map(a => `<option value="${a.id_agencia}">${a.nombre}</option>`).join('')}
        </select>

        <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Observaciones (opcional)</label>
        <textarea id="botObs" rows="2" placeholder="Contexto adicional..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;"></textarea>
      </div>

      <div style="flex:1; min-width:300px; background:white; border-radius:10px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <h3 style="color:var(--azul-marino); font-size:14px; margin-bottom:14px; border-bottom:2px solid #534AB7; padding-bottom:8px;">Paso 2 — Gestión inmediata</h3>

        <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">¿Se logró agendar?</label>
        <select id="botLey" onchange="mostrarBloqueBotSegunLey()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:14px;">
          <option value="">— Selecciona una opción —</option>
          <option value="SI">Sí — se agendó</option>
          <option value="NO">No — derivar a agencia</option>
        </select>

        <div id="botBloqueSi" style="display:none;">
          <div style="background:#e8f6f4; border-left:4px solid #17b6a7; border-radius:0; padding:10px 12px; font-size:12px; color:#0b5c52; margin-bottom:12px; line-height:1.5;">
            El caso se cerrará directamente con la cita agendada.
          </div>
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Fecha y hora agendada</label>
          <input type="datetime-local" id="botHoraAgendada" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:14px;">
          <button class="btn" style="width:100%;" onclick="guardarBotLeySi()">Cerrar caso — cita agendada</button>
        </div>

        <div id="botBloqueNo" style="display:none;">
          <div style="background:#fff3cd; border-left:4px solid #f0ad4e; border-radius:0; padding:10px 12px; font-size:12px; color:#7a5c00; margin-bottom:12px; line-height:1.5;">
            El caso se derivará a la agencia indicada con SLA de 72 horas hábiles.
          </div>
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Agencia a derivar</label>
          <select id="botAgencia" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:14px;">
            <option value="">— Selecciona una agencia —</option>
            ${catalogoAgencias.map(a => `<option value="${a.id_agencia}">${a.nombre}</option>`).join('')}
          </select>
          <button class="btn" style="background:#534AB7; width:100%;" onclick="guardarBotDerivar()">Derivar a agencia</button>
        </div>

        <div id="botBloqueVacio" style="color:#aaa; font-size:12px; margin-top:10px;">Selecciona una opción arriba para continuar.</div>
      </div>

    </div>

    <div style="margin-top:16px;">
      <button class="btn secundario" onclick="cargarVista('reagendamiento')">Cancelar</button>
    </div>
  `;
}

function mostrarBloqueBotSegunLey() {
  const v = document.getElementById('botLey').value;
  document.getElementById('botBloqueSi').style.display = v === 'SI' ? 'block' : 'none';
  document.getElementById('botBloqueNo').style.display = v === 'NO' ? 'block' : 'none';
  document.getElementById('botBloqueVacio').style.display = v ? 'none' : 'block';
}

async function guardarBotLeySi() {
  const rut = document.getElementById('botRut').value.trim();
  const hora = document.getElementById('botHoraAgendada').value;
  if (!rut) { alert('Ingresa el RUT del paciente'); return; }
  if (!hora) { alert('Ingresa la fecha y hora agendada'); return; }
  try {
    const caso = await api('/reagendamiento', {
      method: 'POST',
      body: JSON.stringify({
        rut_paciente: rut,
        tipo_atencion: document.getElementById('botTipo').value,
        reagendamiento_ley: 'SI',
        hora_agendada: hora,
        nombre_paciente: document.getElementById('botNombre').value.trim(),
        correo: document.getElementById('botCorreo').value.trim(),
        telefono: document.getElementById('botTel').value.trim(),
        id_agencia: Number(document.getElementById('botAgenciaPaso1').value) || undefined,
        motivo: document.getElementById('botMotivo').value.trim(),
        observaciones: document.getElementById('botObs').value.trim() || undefined,
        origen: 'BOT',
        ingresado_bot: true
      })
    });
    alert(`Folio ${caso.folio} cerrado correctamente.`);
    cargarVista('reagendamiento');
  } catch (err) { alert('Error: ' + err.message); }
}

async function guardarBotDerivar() {
  const rut = document.getElementById('botRut').value.trim();
  const idAgenciaPaso2 = Number(document.getElementById('botAgencia').value);
  const idAgenciaPaso1 = Number(document.getElementById('botAgenciaPaso1').value);
  const idAgencia = idAgenciaPaso2 || idAgenciaPaso1;
  if (!rut) { alert('Ingresa el RUT del paciente'); return; }
  if (!idAgencia) { alert('Selecciona una agencia'); return; }
  try {
    const caso = await api('/reagendamiento', {
      method: 'POST',
      body: JSON.stringify({
        rut_paciente: rut,
        tipo_atencion: document.getElementById('botTipo').value,
        reagendamiento_ley: 'NO',
        nombre_paciente: document.getElementById('botNombre').value.trim(),
        correo: document.getElementById('botCorreo').value.trim(),
        telefono: document.getElementById('botTel').value.trim(),
        id_agencia: idAgencia,
        motivo: document.getElementById('botMotivo').value.trim(),
        observaciones: document.getElementById('botObs').value.trim() || undefined,
        origen: 'BOT',
        ingresado_bot: true
      })
    });
    alert(`Folio ${caso.folio} creado y derivado a agencia.`);
    cargarVista('reagendamiento');
  } catch (err) { alert('Error: ' + err.message); }
}

/* ============================================================
   INGRESO DIRECTO ADMIN — formulario inline + script de correo
   ============================================================ */
function abrirFormAdminDirecto() {
  const contenido = document.getElementById('contenido');
  document.getElementById('tituloVista').textContent = 'Ingresar caso directo — Administrador';
  contenido.innerHTML = `
    <button class="btn secundario" onclick="cargarVista('reagendamiento')" style="margin-bottom:16px;">← Volver a Reagendamiento</button>

    <div style="background:#fff3cd; border-left:5px solid #f0ad4e; border-radius:8px; padding:12px 16px; margin-bottom:16px; font-size:13px; color:#7a5c00; line-height:1.5;">
      Este caso se ingresa directamente por el Administrador y se deriva de inmediato a la agencia indicada.
    </div>

    <div style="display:flex; gap:20px; flex-wrap:wrap;">
      <div style="flex:1; min-width:300px; background:white; border-radius:10px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <h3 style="color:var(--azul-marino); font-size:15px; margin-bottom:14px;">Datos del caso</h3>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">RUT del paciente</label>
            <input type="text" id="adRut" placeholder="12.345.678-9" oninput="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Nombre del paciente</label>
            <input type="text" id="adNombre" placeholder="Nombre completo" oninput="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Teléfono</label>
            <input type="text" id="adTel" placeholder="+56 9 1234 5678" oninput="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Correo paciente</label>
            <input type="email" id="adCorreo" placeholder="paciente@correo.cl" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Tipo de atención</label>
            <select id="adTipo" onchange="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
              <option value="CONTROL">Atención Primaria</option>
              <option value="CURACIÓN">Curación</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Fecha cita original</label>
            <input type="date" id="adFecha" onchange="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Hora cita original</label>
            <input type="time" id="adHoraCita" onchange="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Motivo</label>
            <select id="adMotivo" onchange="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
              <option>Enfermedad</option>
              <option>Hospitalización o urgencia</option>
              <option>Fallecimiento de familiar directo o indirecto pero cercano</option>
              <option>Cuidado de otra persona</option>
              <option>Citación judicial, tribunal, fiscalía, comisaría u organismo obligatorio</option>
              <option>Constancia de Carabineros</option>
              <option>Problema de transporte ACHS</option>
              <option>Trámite personal urgente</option>
              <option>Error de agendamiento/información</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Agencia a derivar</label>
            <select id="adAgencia" onchange="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
              <option value="">— Selecciona una agencia —</option>
              ${catalogoAgencias.map(a => `<option value="${a.id_agencia}">${a.nombre}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Ejecutivo/a Contact Center</label>
            <input type="text" id="adEjecutivo" placeholder="Tu nombre" oninput="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <div style="margin-top:10px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Nombre ejecutiva agencia (destinatario)</label>
          <input type="text" id="adDest" placeholder="Nombre de quien recibe" oninput="actualizarScriptCorreo()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
        </div>

        <div style="margin-top:10px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Observaciones</label>
          <textarea id="adObs" rows="2" placeholder="Contexto adicional del caso..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;"></textarea>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px; border-top:1px solid #eee; padding-top:14px;">
          <button class="btn secundario" onclick="cargarVista('reagendamiento')">Cancelar</button>
          <button class="btn" onclick="guardarCasoAdminDirecto()">Derivar a agencia</button>
        </div>
      </div>

      <div style="flex:1; min-width:280px;">
        <div style="background:white; border:1px solid #17b6a7; border-radius:10px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,.08);">
          <h3 style="color:var(--azul-marino); font-size:14px; margin-bottom:10px;">✉ Script de correo</h3>
          <div style="background:#f4f6f8; border-radius:6px; padding:8px 10px; font-size:12px; margin-bottom:8px;">
            <span style="font-weight:700; color:var(--azul-marino);">Asunto:</span> Derivación reagendamiento paciente STP – gestión local
          </div>
          <div id="scriptCorreoReag" style="background:#f9f9f9; border:1px solid #e5e5e5; border-radius:6px; padding:10px 12px; font-size:12px; color:#333; line-height:1.6; white-space:pre-wrap; font-family:inherit;"></div>
          <button class="btn secundario" style="margin-top:8px; width:100%;" onclick="copiarScriptCorreoReag()">Copiar correo</button>
        </div>
      </div>
    </div>
  `;
  actualizarScriptCorreo();
}

function actualizarScriptCorreo() {
  const el = document.getElementById('scriptCorreoReag');
  if (!el) return;
  const v = id => { const e = document.getElementById(id); return e ? e.value.trim() || '…' : '…'; };
  const tipoEl = document.getElementById('adTipo');
  const tipo = tipoEl ? etiquetaTipoAtencion(tipoEl.value) : '…';
  const fechaRaw = document.getElementById('adFecha') ? document.getElementById('adFecha').value : '';
  let fecha = '…';
  if (fechaRaw) {
    const d = new Date(fechaRaw + 'T12:00:00');
    fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  const hora = document.getElementById('adHoraCita') ? (document.getElementById('adHoraCita').value || '…') : '…';
  const agenciaEl = document.getElementById('adAgencia');
  const agencia = agenciaEl && agenciaEl.value ? agenciaEl.options[agenciaEl.selectedIndex].text : '…';

  el.textContent = `Hola ${v('adDest')}:

Derivamos solicitud de reagendamiento de paciente STP, ya que desde Contact Center no fue posible encontrar disponibilidad dentro de los próximos 3 días hábiles.

Paciente: ${v('adNombre')}
RUT: ${v('adRut')}
Teléfono: ${v('adTel')}
Cita original: ${tipo} – ${fecha} – ${hora}
Centro / Agencia: ${agencia}
Motivo informado: ${v('adMotivo')}

Se solicita revisar alternativas de agenda de manera local y contactar al paciente directamente para informar la nueva fecha, priorizando la continuidad de su tratamiento.

Saludos,
${v('adEjecutivo')}`;
}

function copiarScriptCorreoReag() {
  const el = document.getElementById('scriptCorreoReag');
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

async function guardarCasoAdminDirecto() {
  const idAgencia = Number(document.getElementById('adAgencia').value);
  if (!idAgencia) { alert('Selecciona una agencia'); return; }
  const rut = document.getElementById('adRut').value.trim();
  if (!rut) { alert('Ingresa el RUT del paciente'); return; }
  const body = {
    rut_paciente: rut,
    tipo_atencion: document.getElementById('adTipo').value,
    reagendamiento_ley: 'NO',
    nombre_paciente: document.getElementById('adNombre').value.trim(),
    correo: document.getElementById('adCorreo').value.trim(),
    telefono: document.getElementById('adTel').value.trim(),
    id_agencia: idAgencia,
    motivo: document.getElementById('adMotivo').value.trim(),
    observaciones: document.getElementById('adObs').value.trim() || undefined,
    ingresado_por_admin: true
  };
  try {
    const caso = await api('/reagendamiento', { method: 'POST', body: JSON.stringify(body) });
    alert(`Caso creado y derivado. Folio: ${caso.folio}`);
    cargarVista('reagendamiento');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRechazar(idCaso) {
  document.getElementById('reagRechazarId').value = idCaso;
  document.getElementById('reagRechazarHora').value = '';
  document.getElementById('modalReagRechazar').classList.add('activo');
}

async function guardarReagRechazo() {
  const id = document.getElementById('reagRechazarId').value;
  const hora = document.getElementById('reagRechazarHora').value;
  if (!hora) { alert('Ingresa la hora agendada'); return; }
  try {
    await api(`/reagendamiento/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ hora_agendada: hora }) });
    cerrarModal('modalReagRechazar');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalEscalar(idCaso) {
  document.getElementById('reagEscalarId').value = idCaso;
  document.getElementById('reagEscalarAgencia').innerHTML = catalogoAgencias.map(a => `<option value="${a.id_agencia}">${a.nombre}</option>`).join('');
  document.getElementById('modalReagEscalar').classList.add('activo');
}

async function guardarReagEscalar() {
  const id = document.getElementById('reagEscalarId').value;
  const idAgencia = Number(document.getElementById('reagEscalarAgencia').value);
  try {
    await api(`/reagendamiento/${id}/escalar`, { method: 'POST', body: JSON.stringify({ id_agencia: idAgencia }) });
    cerrarModal('modalReagEscalar');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRespuesta(idCaso) {
  document.getElementById('reagRespuestaId').value = idCaso;
  document.getElementById('reagRespuestaTexto').value = '';
  document.getElementById('modalReagRespuesta').classList.add('activo');
}

async function guardarReagRespuesta() {
  const id = document.getElementById('reagRespuestaId').value;
  const resultado = document.getElementById('reagRespuestaTexto').value.trim();
  if (!resultado) { alert('Ingresa la respuesta de la agencia'); return; }
  try {
    await api(`/reagendamiento/${id}/respuesta-agencia`, { method: 'POST', body: JSON.stringify({ resultado }) });
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
  try {
    const res = await fetch(`${API_BASE}/reagendamiento/reportes/exportar-excel`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudo generar el Excel');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reagendamiento_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error al exportar: ' + err.message);
  }
}

async function exportarReagCSV() {
  try {
    const casos = await api('/reagendamiento');
    const encabezados = [
      'Folio','RUT','Nombre paciente','Teléfono','Correo','Tipo de atención',
      '¿Se agendó?','Fecha y hora agendada','Estado','Agencia','Motivo','Resultado',
      'Observaciones','SLA','Ejecutivo','Fecha límite Admin','Fecha límite Agencia'
    ];
    const filas = casos.map(c => [
      c.folio || '',
      c.rut_paciente || '',
      c.nombre_paciente || '',
      c.telefono || '',
      c.correo || '',
      etiquetaTipoAtencion(c.tipo_atencion) || '',
      c.reagendamiento_ley === 'SI' ? 'Sí' : 'No',
      c.hora_agendada ? formatFecha(c.hora_agendada) : '',
      c.estado || '',
      c.agencia || '',
      c.motivo || '',
      c.resultado || '',
      c.observaciones || '',
      c.estado_sla || '',
      c.ejecutivo || '',
      c.fecha_limite_admin ? formatFecha(c.fecha_limite_admin) : '',
      c.fecha_limite_agencia ? formatFecha(c.fecha_limite_agencia) : ''
    ]);
    const csv = [encabezados, ...filas]
      .map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Reagendamiento_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error al generar el reporte: ' + err.message);
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
