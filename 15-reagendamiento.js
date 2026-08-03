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
          <label>Hora agendada para el paciente</label>
          <input type="datetime-local" id="reagHoraAgendada">
          <button class="btn" onclick="guardarReagLeySi()">Cerrar caso (cita agendada)</button>
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
        <button class="btn" onclick="exportarReagExcel()">Exportar a Excel</button>
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
      <thead><tr><th>Folio</th><th>RUT</th><th>Tipo</th><th>¿Se agendó?</th><th>Estado</th><th>SLA</th><th></th></tr></thead>
      <tbody>
        ${lista.map(c => `
          <tr>
            <td><b>${c.folio}</b></td>
            <td>${c.rut_paciente}</td>
            <td>${etiquetaTipoAtencion(c.tipo_atencion)}</td>
            <td>${c.reagendamiento_ley === 'SI' ? 'Sí' : 'No'}</td>
            <td>${badgeEstadoReag(c.estado)}</td>
            <td>${c.estado_sla || '—'}</td>
            <td>
              <button class="btn secundario" onclick='abrirReagDetalle(${JSON.stringify(c.id_caso)})'>Ver detalle</button>
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

async function abrirReagDetalle(idCaso) {
  idReagDetalleActual = idCaso;
  document.getElementById('tituloVista').textContent = 'Detalle del caso — Reagendamiento';
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = '<div class="cargando">Cargando...</div>';
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
            <tr><td><b>Hora agendada</b></td><td>${formatFecha(caso.hora_agendada)}</td></tr>
            <tr><td><b>Motivo</b></td><td>${caso.motivo || '—'}</td></tr>
            <tr><td><b>Resultado</b></td><td>${caso.resultado || '—'}</td></tr>
          </tbody>
        </table>
        ${acciones ? `<div style="margin-top:20px; display:flex; gap:8px; flex-wrap:wrap;">${acciones}</div>` : ''}
      </div>
    </div>
  `;
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
  if (!rut || !hora) { alert('Ingresa el RUT y la hora agendada'); return; }
  try {
    const caso = await api('/reagendamiento', {
      method: 'POST',
      body: JSON.stringify({ rut_paciente: rut, tipo_atencion: tipo, reagendamiento_ley: 'SI', hora_agendada: hora })
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

