/* ============================================================
   CASOS
   ============================================================ */
async function renderCasos() {
  const casos = await api('/casos');
  const contenido = document.getElementById('contenido');

  contenido.innerHTML = `
    <table>
      <thead><tr>
        <th>Folio</th><th>RUT</th><th>Ejecutivo</th><th>Área</th><th>Intentos</th>
        <th>Estado</th><th>SLA</th><th>Acciones</th>
      </tr></thead>
      <tbody>
        ${casos.map(c => `
          <tr>
            <td><a href="#" onclick="abrirDetalleCaso('${c.id_caso}'); return false;" style="color:var(--azul-corp); font-weight:600;">${c.folio || c.id_caso.slice(0,8)}</a></td>
            <td>${c.rut_paciente}</td>
            <td>${c.ejecutivo || '—'}</td>
            <td>${c.area || '—'}</td>
            <td>${c.numero_intentos}</td>
            <td>${badgeEstado(c.estado)}</td>
            <td>${c.estado_sla || '—'}</td>
            <td>
              ${!c.caso_cerrado ? `
                <button class="btn secundario" onclick="abrirModalGestion('${c.id_caso}')">+ Llamada</button>
                <button class="btn secundario" onclick="abrirModalCierre('${c.id_caso}')">Cerrar</button>
              ` : (usuarioActual.rol === 'ADMINISTRADOR' ? `
                <button class="btn secundario" onclick="abrirModalReapertura('${c.id_caso}')">Reabrir</button>
              ` : '<em>Cerrado</em>')}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${casos.length === 0 ? '<p style="margin-top:16px;color:#999;">No hay casos registrados aún.</p>' : ''}
  `;
}

/* ============================================================
   DETALLE DE CASO — LÍNEA DE TIEMPO
   ============================================================ */
async function abrirDetalleCaso(idCaso) {
  idCasoDetalleActual = idCaso;
  const contenido = document.getElementById('contenido');
  document.getElementById('tituloVista').textContent = 'Detalle del caso';
  contenido.innerHTML = '<div class="cargando">Cargando...</div>';

  try {
    const caso = await api(`/casos/${idCaso}`);
    renderDetalleCaso(caso);
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
  }
}

function renderDetalleCaso(caso) {
  const contenido = document.getElementById('contenido');

  // Construir los eventos de la línea de tiempo en orden cronológico
  const eventos = [];
  eventos.push({ titulo: 'Correo recibido', fecha: caso.fecha_recepcion, detalle: `Área: ${caso.area || '—'} · Tipo: ${caso.tipo_gestion || '—'}` });
  if (caso.fecha_asignacion) {
    eventos.push({ titulo: 'Asignación', fecha: caso.fecha_asignacion, detalle: `Ejecutivo: ${caso.ejecutivo || '—'}` });
  }
  (caso.gestiones || []).forEach(g => {
    eventos.push({
      titulo: `Gestión (intento ${g.numero_intento})`,
      fecha: `${g.fecha}T${g.hora_inicio}`,
      detalle: `Resultado: ${g.resultado}${g.observacion ? ' — ' + g.observacion : ''}`
    });
  });
  if (caso.caso_cerrado) {
    eventos.push({ titulo: 'Cierre', fecha: caso.fecha_cierre, detalle: `Resultado final: ${caso.resultado_final || '—'}` });
  }

  contenido.innerHTML = `
    <button class="btn secundario" onclick="idCasoDetalleActual = null; cargarVista('casos')" style="margin-bottom:16px;">← Volver a Casos</button>

    <div class="kpis" style="margin-bottom:24px;">
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${caso.rut_paciente}</div><div class="etiqueta">RUT paciente</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${caso.ejecutivo || '—'}</div><div class="etiqueta">Ejecutivo</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${badgeEstado(caso.estado)}</div><div class="etiqueta">Estado</div></div>
      <div class="kpi-card ${caso.estado_sla && caso.estado_sla.includes('VENCIDO') ? 'alerta' : ''}"><div class="valor" style="font-size:16px;">${caso.estado_sla || '—'}</div><div class="etiqueta">SLA</div></div>
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
              <div style="font-size:13px;">${ev.detalle}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="flex:1; min-width:260px;">
        <h3 style="color:var(--azul-marino); font-size:15px;">Datos del caso</h3>
        <table style="margin-top:12px;">
          <tbody>
            <tr><td><b>Folio</b></td><td>${caso.folio || '—'}</td></tr>
            <tr><td><b>Área</b></td><td>${caso.area || '—'}</td></tr>
            <tr><td><b>Tipo de gestión</b></td><td>${caso.tipo_gestion || '—'}</td></tr>
            <tr><td><b>Prioridad</b></td><td>${caso.prioridad || '—'}</td></tr>
            <tr><td><b>Fecha límite SLA</b></td><td>${formatFecha(caso.fecha_limite_caso)}</td></tr>
            <tr><td><b>Resultado final</b></td><td>${caso.resultado_final || '—'}</td></tr>
            <tr><td><b>Observaciones</b></td><td>${caso.observaciones || '—'}</td></tr>
          </tbody>
        </table>

        ${!caso.caso_cerrado ? `
          <div style="margin-top:20px; display:flex; gap:8px;">
            <button class="btn secundario" onclick="abrirModalGestion('${caso.id_caso}')">+ Llamada</button>
            <button class="btn secundario" onclick="abrirModalCierre('${caso.id_caso}')">Cerrar caso</button>
          </div>
        ` : (usuarioActual.rol === 'ADMINISTRADOR' ? `
          <div style="margin-top:20px;">
            <button class="btn secundario" onclick="abrirModalReapertura('${caso.id_caso}')">Reabrir caso</button>
          </div>
        ` : '')}
      </div>
    </div>
  `;
}

async function cargarResultadosGestion() {
  // Nota: no existe endpoint de catálogos de resultados todavía; si se agrega
  // /api/catalogos (ya trae resultados_gestion), se puede leer catalogos.resultados_gestion
  // y filtrar por nombre en vez de mantener esta lista fija con ids.
  return {
    'CONTACTADO': [
      { id: 9, nombre: 'CONFIRMA CITA' },
      { id: 10, nombre: 'NO CONFIRMA CITA' }
    ],
    'NO CONTACTADO': [
      { id: 2, nombre: 'NO CONTESTA' },
      { id: 3, nombre: 'OCUPADO' },
      { id: 4, nombre: 'BUZÓN DE VOZ' },
      { id: 5, nombre: 'TELÉFONO APAGADO' },
      { id: 6, nombre: 'NÚMERO ERRÓNEO' },
      { id: 7, nombre: 'RECHAZA GESTIÓN' },
      { id: 8, nombre: 'VOLVER A LLAMAR' }
    ]
  };
}

async function abrirModalGestion(idCaso) {
  document.getElementById('gestionIdCaso').value = idCaso;
  document.getElementById('gestionFecha').value = new Date().toISOString().slice(0,10);
  document.getElementById('gestionHoraInicio').value = new Date().toTimeString().slice(0,5);
  document.getElementById('gestionHoraTermino').value = '';
  document.getElementById('gestionObservacion').value = '';

  if (!resultadosCache) resultadosCache = await cargarResultadosGestion();
  const select = document.getElementById('gestionResultado');
  select.innerHTML = Object.entries(resultadosCache).map(([grupo, opciones]) => `
    <optgroup label="${grupo}">
      ${opciones.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('')}
    </optgroup>
  `).join('');

  document.getElementById('modalGestion').classList.add('activo');
}

async function guardarGestion() {
  const body = {
    id_caso: document.getElementById('gestionIdCaso').value,
    fecha: document.getElementById('gestionFecha').value,
    hora_inicio: document.getElementById('gestionHoraInicio').value,
    hora_termino: document.getElementById('gestionHoraTermino').value || undefined,
    id_resultado: Number(document.getElementById('gestionResultado').value),
    observacion: document.getElementById('gestionObservacion').value
  };
  try {
    await api('/gestiones', { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalGestion');
    if (idCasoDetalleActual) { abrirDetalleCaso(idCasoDetalleActual); } else { renderCasos(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirModalCierre(idCaso) {
  document.getElementById('cierreIdCaso').value = idCaso;
  document.getElementById('cierreResultado').value = '';
  document.getElementById('cierreObservaciones').value = '';
  document.getElementById('modalCierre').classList.add('activo');
}

async function guardarCierre() {
  const idCaso = document.getElementById('cierreIdCaso').value;
  const body = {
    resultado_final: document.getElementById('cierreResultado').value,
    observaciones: document.getElementById('cierreObservaciones').value
  };
  if (!body.resultado_final) { alert('Ingresa el resultado final'); return; }
  try {
    await api(`/casos/${idCaso}/cerrar`, { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalCierre');
    if (idCasoDetalleActual) { abrirDetalleCaso(idCasoDetalleActual); } else { renderCasos(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirModalReapertura(idCaso) {
  document.getElementById('reaperturaIdCaso').value = idCaso;
  document.getElementById('reaperturaMotivo').value = '';
  document.getElementById('modalReapertura').classList.add('activo');
}

async function guardarReapertura() {
  const idCaso = document.getElementById('reaperturaIdCaso').value;
  const motivo = document.getElementById('reaperturaMotivo').value.trim();
  if (motivo.length < 5) { alert('Ingresa un motivo de al menos 5 caracteres'); return; }
  try {
    await api(`/casos/${idCaso}/reabrir`, { method: 'POST', body: JSON.stringify({ motivo }) });
    cerrarModal('modalReapertura');
    if (idCasoDetalleActual) { abrirDetalleCaso(idCasoDetalleActual); } else { renderCasos(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

