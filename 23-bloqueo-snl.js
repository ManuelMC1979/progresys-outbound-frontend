/* ============================================================
   BLOQUEO SNL
   Hoja de trabajo para gestionar las citas bloqueadas que exporta el
   sistema de agendamiento (Centro, Profesional, Paciente, etc.).

   Mismo modelo de acceso que Cuenta Corriente: Administrador/Supervisor
   importan el CSV/Excel exportado y lo asignan a un ejecutivo (o
   reasignan filas sueltas); pueden ver todo el trabajo pero en modo
   solo vista. El ejecutivo asignado a cada fila es el único que puede
   gestionarla (plan de salud, motivo del bloqueo, estado de llamada,
   fecha de gestión, 5 intentos y observación).

   Formato portado de la herramienta standalone SNLBLOQUEOV5_5.html.
   Backend: GET/POST/PATCH/DELETE /api/bloqueo-snl (ver
   progresys-outbound-api-test/src/routes/bloqueo-snl.js).
   ============================================================ */
let bsDatos = [];
let bsFilasImportacion = [];
let bsIdEjecutivoImportacion = '';
let bsFiltroActivo = 'todos';
let bsBusqueda = '';

const BS_CSV_MAP = {
  'CENTRO': 'centro',
  'AREA': 'area',
  'PROFESIONAL RECURSO': 'profesional',
  'NO DOCUMENTO PROFESIONAL': 'no_doc_profesional',
  'ESPECIALIDAD': 'especialidad',
  'SERVICIO': 'servicio',
  'FECHA DESDE': 'fecha_desde',
  'HORA DESDE': 'hora_desde',
  'ESTADO': 'estado',
  'NO DOCUMENTO': 'no_doc_paciente',
  'PACIENTE': 'paciente',
  'TEL PRINCIPAL PACIENTE': 'tel_principal',
  'PLAN DE SALUD UTILIZADO': 'plan_salud'
};

function bsNormalizarEncabezado(s) {
  return (s || '').toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\//g, ' ')
    .replace(/\./g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function bsEsAdmin() {
  return usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';
}

async function abrirBloqueoSnl() {
  document.getElementById('tituloVista').textContent = 'Bloqueo SNL';
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoTabla();
  if (bsEsAdmin() && !catalogos) {
    try { await cargarCatalogos(); } catch (err) { /* si falla, el selector de ejecutivo saldrá vacío */ }
  }
  try {
    bsDatos = await api('/bloqueo-snl');
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
    return;
  }
  renderBloqueoSnl();
}

function bsFilasFiltradas() {
  const q = bsBusqueda.toLowerCase().trim();
  return bsDatos.filter(r => {
    if (bsFiltroActivo === 'contactado' && r.estado_llamada !== 'CONTACTADO') return false;
    if (bsFiltroActivo === 'nocontacto' && r.estado_llamada !== 'NO CONTACTADO') return false;
    if (bsFiltroActivo === 'pendiente' && (r.estado_llamada === 'CONTACTADO' || r.estado_llamada === 'NO CONTACTADO')) return false;
    if (!q) return true;
    return Object.values(r).some(v => (v || '').toString().toLowerCase().includes(q));
  });
}

function renderBloqueoSnl() {
  const contenido = document.getElementById('contenido');
  const esAdmin = bsEsAdmin();
  const total = bsDatos.length;
  const contactados = bsDatos.filter(r => r.estado_llamada === 'CONTACTADO').length;
  const noContactados = bsDatos.filter(r => r.estado_llamada === 'NO CONTACTADO').length;
  const pendientes = total - contactados - noContactados;

  contenido.innerHTML = `
    <div class="cc-view">
      <div class="toolbar">
        ${esAdmin ? `
          <select id="bsEjecutivoImport" style="min-width:220px; padding:8px; border:1px solid #ccc; border-radius:6px;">
            <option value="">— Ejecutivo a asignar al importar —</option>
            ${(catalogos?.ejecutivos || []).map(e => `<option value="${e.id_ejecutivo}">${e.nombre}</option>`).join('')}
          </select>
          <label class="cc-import-label">
            ⬆ Importar planilla
            <input type="file" id="bsArchivo" accept=".xlsx,.xls,.csv">
          </label>
          <button class="btn secundario" onclick="bsLimpiarTodo()">🗑 Limpiar todo</button>
        ` : ''}
        <button class="btn" onclick="exportarBloqueoSnl()">↓ Exportar Excel</button>
        <input type="text" id="bsBuscar" placeholder="Buscar en cualquier columna..." value="${bsBusqueda}"
               style="flex:1; min-width:200px; max-width:340px; padding:8px 14px; border:1px solid #ccc; border-radius:20px;"
               oninput="bsBusqueda = this.value; bsRenderTabla();">
      </div>
      ${esAdmin ? '<p class="cc-placeholder">Estás viendo el trabajo de todos los ejecutivos. Este perfil es de <strong>solo vista</strong>: la gestión (plan de salud, motivo, estado de llamada, intentos) la realiza el ejecutivo asignado a cada fila.</p>' : ''}
      <div class="toolbar">
        <span class="badge celeste">Total: ${total}</span>
        <span class="badge gestionado">✅ Contactado: ${contactados}</span>
        <span class="badge alerta">❌ No contactado: ${noContactados}</span>
        <span class="badge pendiente">⏳ Pendiente: ${pendientes}</span>
      </div>
      <div class="toolbar">
        <span style="font-weight:600; color:#555; font-size:13px;">Ver solo:</span>
        ${bsBotonFiltro('todos', '📋 Todos')}
        ${bsBotonFiltro('nocontacto', '❌ No contactado')}
        ${bsBotonFiltro('contactado', '✅ Contactado')}
        ${bsBotonFiltro('pendiente', '⏳ Pendiente')}
      </div>
      <div id="bsResultadoImportacion"></div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Centro</th><th>Área</th><th>Profesional/Recurso</th><th>No. Doc. Profesional</th>
              <th>Especialidad</th><th>Servicio</th><th>Fecha desde</th><th>Hora desde</th>
              <th>Estado</th><th>No. Doc. Paciente</th><th>Paciente</th><th>Tel. Principal</th>
              <th>Ejecutiva</th>
              <th>Plan de Salud</th><th>Motivo del Bloqueo</th><th>Fecha de Gestión</th>
              <th>Estado de Llamada</th><th>1er Intento</th><th>2do Intento</th><th>3er Intento</th>
              <th>4to Intento</th><th>5to Intento</th><th>Observación</th>
              ${esAdmin ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody id="bsTbody"></tbody>
        </table>
      </div>
      <p id="bsSinRegistros" style="margin-top:16px;color:#999;"></p>
    </div>
  `;
  if (esAdmin) {
    document.getElementById('bsArchivo').addEventListener('change', bsManejarArchivo);
  }
  bsRenderTabla();
}

function bsBotonFiltro(valor, etiqueta) {
  const activo = bsFiltroActivo === valor;
  return `<button class="btn ${activo ? '' : 'secundario'}" onclick="bsFiltroActivo='${valor}'; bsRenderTabla();">${etiqueta}</button>`;
}

function bsRenderTabla() {
  const filas = bsFilasFiltradas();
  document.getElementById('bsTbody').innerHTML = filas.map(bsFilaHtml).join('');
  const sinRegistros = document.getElementById('bsSinRegistros');
  sinRegistros.textContent = bsDatos.length === 0
    ? (bsEsAdmin() ? 'No hay registros. Importa la planilla del sistema de citas para comenzar a asignar trabajo.' : 'No tienes filas de Bloqueo SNL asignadas por el momento.')
    : (filas.length === 0 ? 'Ningún registro coincide con el filtro/búsqueda actual.' : '');
}

function bsFilaHtml(r) {
  const id = r.id_bloqueo_snl;
  const esAdmin = bsEsAdmin();
  return `
    <tr>
      <td>${r.centro || '—'}</td>
      <td>${r.area || '—'}</td>
      <td>${r.profesional || '—'}</td>
      <td>${r.no_doc_profesional || '—'}</td>
      <td>${r.especialidad || '—'}</td>
      <td>${r.servicio || '—'}</td>
      <td>${ccFormatFechaCorta(r.fecha_desde)}</td>
      <td>${r.hora_desde || '—'}</td>
      <td>${r.estado || '—'}</td>
      <td>${r.no_doc_paciente || '—'}</td>
      <td>${r.paciente || '—'}</td>
      <td>${r.tel_principal || '—'}</td>
      <td>${esAdmin ? bsSelectorEjecutivo(r) : (r.ejecutivo || '—')}</td>
      <td>${esAdmin ? (r.plan_salud || '—') : bsCeldaTexto(id, 'plan_salud', r.plan_salud)}</td>
      <td>${esAdmin ? (r.motivo_bloqueo || '—') : bsCeldaTexto(id, 'motivo_bloqueo', r.motivo_bloqueo)}</td>
      <td>${esAdmin ? ccFormatFechaCorta(r.fecha_gestion) : bsCeldaFecha(id, r.fecha_gestion)}</td>
      <td>${esAdmin ? bsSoloLectura(r.estado_llamada) : bsChipsHtml(id, r.estado_llamada)}</td>
      <td>${esAdmin ? (r.intento_1 || '—') : bsCeldaIntento(id, 'intento_1', r.intento_1)}</td>
      <td>${esAdmin ? (r.intento_2 || '—') : bsCeldaIntento(id, 'intento_2', r.intento_2)}</td>
      <td>${esAdmin ? (r.intento_3 || '—') : bsCeldaIntento(id, 'intento_3', r.intento_3)}</td>
      <td>${esAdmin ? (r.intento_4 || '—') : bsCeldaIntento(id, 'intento_4', r.intento_4)}</td>
      <td>${esAdmin ? (r.intento_5 || '—') : bsCeldaIntento(id, 'intento_5', r.intento_5)}</td>
      <td>${esAdmin ? (r.observacion || '—') : bsCeldaTexto(id, 'observacion', r.observacion)}</td>
      ${esAdmin ? `<td><button class="btn secundario" onclick="bsEliminarFila('${id}')">✕</button></td>` : ''}
    </tr>
  `;
}

function bsSoloLectura(valor) {
  if (!valor) return '—';
  const clase = valor.startsWith('NO') ? 'cc-activo-no' : 'cc-activo-si';
  return `<span class="cc-chip cc-solo-lectura ${clase}">${valor}</span>`;
}

function bsSelectorEjecutivo(r) {
  const opciones = (catalogos?.ejecutivos || []).map(e =>
    `<option value="${e.id_ejecutivo}" ${e.id_ejecutivo === r.id_ejecutivo ? 'selected' : ''}>${e.nombre}</option>`
  ).join('');
  return `<select onchange="bsReasignarEjecutivo('${r.id_bloqueo_snl}', this.value)" style="max-width:170px; padding:4px;">${opciones}</select>`;
}

async function bsReasignarEjecutivo(id, idEjecutivo) {
  if (!idEjecutivo) return;
  try {
    const actualizado = await api(`/bloqueo-snl/${id}/asignar`, { method: 'POST', body: JSON.stringify({ id_ejecutivo: idEjecutivo }) });
    const idx = bsDatos.findIndex(r => String(r.id_bloqueo_snl) === String(id));
    if (idx !== -1) bsDatos[idx] = actualizado;
    bsRenderTabla();
  } catch (err) {
    alert('Error al reasignar: ' + err.message);
    renderBloqueoSnl();
  }
}

function bsCeldaTexto(id, campo, valor) {
  const escapado = (valor || '').toString().replace(/"/g, '&quot;');
  return `<input type="text" value="${escapado}" style="width:130px; padding:4px 6px; border:1px solid #ccc; border-radius:4px;"
            onblur="bsActualizarCampo('${id}', '${campo}', this.value)">`;
}

function bsChipsHtml(id, valorActual) {
  return `<div class="cc-toggle-cell">${['CONTACTADO', 'NO CONTACTADO'].map(op => {
    const activo = valorActual === op;
    const clase = activo ? (op.startsWith('NO') ? 'cc-activo-no' : 'cc-activo-si') : '';
    return `<span class="cc-chip ${clase}" onclick="bsActualizarCampo('${id}', 'estado_llamada', '${activo ? '' : op}')">${op}</span>`;
  }).join('')}</div>`;
}

function bsCeldaFecha(id, valor) {
  if (!valor) {
    return `<span class="cc-marcar-cell vacio" onclick="bsActualizarCampo('${id}', 'fecha_gestion', '${ccFechaHoyISO()}')">— pinchar —</span>`;
  }
  return `<span class="cc-marcar-valor"><span class="cc-marcar-cell">${ccFormatFechaCorta(valor)}</span><span class="cc-limpiar" onclick="bsActualizarCampo('${id}', 'fecha_gestion', '')">✕</span></span>`;
}

function bsCeldaIntento(id, campo, valor) {
  if (!valor) {
    return `<span class="cc-marcar-cell vacio" onclick="bsActualizarCampo('${id}', '${campo}', '${ccHoraAhora()}')">— pinchar —</span>`;
  }
  return `<span class="cc-marcar-valor"><span class="cc-marcar-cell">${valor}</span><span class="cc-limpiar" onclick="bsActualizarCampo('${id}', '${campo}', '')">✕</span></span>`;
}

async function bsActualizarCampo(id, campo, valor) {
  if (bsEsAdmin()) return; // el perfil admin es de solo vista, no debería llegar aquí
  const fila = bsDatos.find(r => String(r.id_bloqueo_snl) === String(id));
  if (!fila) return;
  const anterior = fila[campo];
  if (anterior === (valor || null)) return; // sin cambios (ej. blur de un input de texto sin editar)
  fila[campo] = valor || null;
  bsRenderTabla();
  try {
    await api(`/bloqueo-snl/${id}/campo`, { method: 'PATCH', body: JSON.stringify({ campo, valor: valor || null }) });
  } catch (err) {
    fila[campo] = anterior;
    bsRenderTabla();
    alert('Error al guardar: ' + err.message);
  }
}

async function bsEliminarFila(id) {
  if (!confirm('¿Eliminar este registro de Bloqueo SNL?')) return;
  try {
    await api(`/bloqueo-snl/${id}`, { method: 'DELETE' });
    bsDatos = bsDatos.filter(r => String(r.id_bloqueo_snl) !== String(id));
    bsRenderTabla();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function bsLimpiarTodo() {
  if (bsDatos.length === 0) return;
  if (!confirm('¿Está seguro que desea limpiar toda la hoja de Bloqueo SNL? Esta acción no se puede deshacer.')) return;
  try {
    await api('/bloqueo-snl', { method: 'DELETE' });
    bsDatos = [];
    bsBusqueda = '';
    bsFiltroActivo = 'todos';
    renderBloqueoSnl();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* ---------------- Importar CSV / Excel (solo Administrador/Supervisor) ---------------- */
async function bsDecodificarCsv(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return new TextDecoder('utf-16le').decode(buffer.slice(2));
  if (bytes.length > 3 && bytes[1] === 0x00 && bytes[3] === 0x00) return new TextDecoder('utf-16le').decode(buffer);
  return new TextDecoder('utf-8').decode(buffer);
}

function bsParsearLineaCsv(linea) {
  const resultado = [];
  let actual = '';
  let entreComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') entreComillas = !entreComillas;
    else if (c === ',' && !entreComillas) { resultado.push(actual.trim()); actual = ''; }
    else actual += c;
  }
  resultado.push(actual.trim());
  return resultado;
}

function bsFechaDesdeCsv(valor) {
  if (!valor) return null;
  const m = valor.toString().trim().match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

function bsHoraDesdeCsv(valor) {
  if (!valor) return null;
  const m = valor.toString().match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

async function bsManejarArchivo(e) {
  const file = e.target.files[0];
  if (!file) return;

  const idEjecutivo = document.getElementById('bsEjecutivoImport').value;
  if (!idEjecutivo) {
    alert('Selecciona primero el ejecutivo al que se le asignará esta planilla.');
    e.target.value = '';
    return;
  }
  bsIdEjecutivoImportacion = idEjecutivo;

  const resultadoDiv = document.getElementById('bsResultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Leyendo archivo...</div>';

  const buffer = await file.arrayBuffer();
  const nombre = file.name.toLowerCase();
  let filasCrudas;

  if (nombre.endsWith('.csv')) {
    const texto = await bsDecodificarCsv(buffer);
    filasCrudas = texto.split(/\r?\n/).filter(l => l.trim()).map(bsParsearLineaCsv);
  } else {
    const workbook = XLSX.read(buffer, { type: 'array' });
    filasCrudas = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: null });
  }

  const indiceEncabezados = filasCrudas.findIndex(fila => (fila || []).some(c => bsNormalizarEncabezado(c) === 'NO DOCUMENTO'));
  if (indiceEncabezados === -1) {
    resultadoDiv.innerHTML = '<p style="color:var(--rojo);">No se encontró la columna "No. Documento" (RUT del paciente) en el archivo.</p>';
    e.target.value = '';
    return;
  }
  const encabezados = filasCrudas[indiceEncabezados];

  const indicePorCampo = {};
  encabezados.forEach((encabezado, idx) => {
    const campo = BS_CSV_MAP[bsNormalizarEncabezado(encabezado)];
    if (campo && indicePorCampo[campo] === undefined) indicePorCampo[campo] = idx;
  });
  const leerCampo = (fila, campo) => {
    const idx = indicePorCampo[campo];
    return idx === undefined ? null : fila[idx];
  };

  const filasDatos = filasCrudas
    .slice(indiceEncabezados + 1)
    .filter(fila => (fila || []).some(c => c !== null && c !== undefined && c !== ''));

  bsFilasImportacion = filasDatos
    .map(fila => {
      const rut = (leerCampo(fila, 'no_doc_paciente') || '').toString().trim();
      if (!rut) return null;
      return {
        centro: (leerCampo(fila, 'centro') || '').toString().trim(),
        area: (leerCampo(fila, 'area') || '').toString().trim(),
        profesional: (leerCampo(fila, 'profesional') || '').toString().trim(),
        no_doc_profesional: (leerCampo(fila, 'no_doc_profesional') || '').toString().trim(),
        especialidad: (leerCampo(fila, 'especialidad') || '').toString().trim(),
        servicio: (leerCampo(fila, 'servicio') || '').toString().trim(),
        fecha_desde: bsFechaDesdeCsv(leerCampo(fila, 'fecha_desde')),
        hora_desde: bsHoraDesdeCsv(leerCampo(fila, 'hora_desde')),
        estado: (leerCampo(fila, 'estado') || '').toString().trim(),
        no_doc_paciente: rut,
        paciente: (leerCampo(fila, 'paciente') || '').toString().trim(),
        tel_principal: (leerCampo(fila, 'tel_principal') || '').toString().trim()
      };
    })
    .filter(Boolean);

  bsRenderPreviewImportacion();
}

function bsRenderPreviewImportacion() {
  const resultadoDiv = document.getElementById('bsResultadoImportacion');
  if (bsFilasImportacion.length === 0) {
    resultadoDiv.innerHTML = '<p style="color:var(--rojo);">No se encontraron filas válidas (se requiere al menos la columna "No. Documento").</p>';
    return;
  }
  const nombreEjecutivo = (catalogos?.ejecutivos || []).find(e => e.id_ejecutivo === bsIdEjecutivoImportacion)?.nombre || '—';
  resultadoDiv.innerHTML = `
    <div class="toolbar">
      <button class="btn" onclick="bsConfirmarImportacion()">Confirmar importación (${bsFilasImportacion.length} filas → ${nombreEjecutivo})</button>
      <button class="btn secundario" onclick="document.getElementById('bsResultadoImportacion').innerHTML=''">Cancelar</button>
    </div>
    <table>
      <thead><tr><th>No. Doc.</th><th>Paciente</th><th>Profesional</th><th>Fecha desde</th><th>Hora desde</th></tr></thead>
      <tbody>
        ${bsFilasImportacion.map(f => `<tr><td>${f.no_doc_paciente}</td><td>${f.paciente || '—'}</td><td>${f.profesional || '—'}</td><td>${ccFormatFechaCorta(f.fecha_desde)}</td><td>${f.hora_desde || '—'}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
}

async function bsConfirmarImportacion() {
  if (bsFilasImportacion.length === 0 || !bsIdEjecutivoImportacion) return;
  const resultadoDiv = document.getElementById('bsResultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Importando...</div>';
  try {
    const creadas = await api('/bloqueo-snl/importar', {
      method: 'POST',
      body: JSON.stringify({ id_ejecutivo: bsIdEjecutivoImportacion, filas: bsFilasImportacion })
    });
    bsDatos = bsDatos.concat(Array.isArray(creadas) ? creadas : []);
    bsFilasImportacion = [];
    bsIdEjecutivoImportacion = '';
    renderBloqueoSnl();
  } catch (err) {
    resultadoDiv.innerHTML = `<p style="color:var(--rojo);">Error al importar: ${err.message}</p>`;
  }
}

/* ---------------- Exportar Excel ---------------- */
function exportarBloqueoSnl() {
  if (bsDatos.length === 0) { alert('No hay datos para exportar.'); return; }
  const encabezados = ['Centro', 'Área', 'Profesional/Recurso', 'No. Doc. Profesional', 'Especialidad', 'Servicio', 'Fecha desde', 'Hora desde', 'Estado', 'No. Doc. Paciente', 'Paciente', 'Tel. Principal', 'Ejecutiva', 'Plan de Salud', 'Motivo del Bloqueo', 'Fecha de Gestión', 'Estado de Llamada', 'Hora 1er Intento', 'Hora 2do Intento', 'Hora 3er Intento', 'Hora 4to Intento', 'Hora 5to Intento', 'Observación'];
  const filas = bsDatos.map(r => ({
    'Centro': r.centro || '',
    'Área': r.area || '',
    'Profesional/Recurso': r.profesional || '',
    'No. Doc. Profesional': r.no_doc_profesional || '',
    'Especialidad': r.especialidad || '',
    'Servicio': r.servicio || '',
    'Fecha desde': r.fecha_desde ? ccFormatFechaCorta(r.fecha_desde) : '',
    'Hora desde': r.hora_desde || '',
    'Estado': r.estado || '',
    'No. Doc. Paciente': r.no_doc_paciente || '',
    'Paciente': r.paciente || '',
    'Tel. Principal': r.tel_principal || '',
    'Ejecutiva': r.ejecutivo || '',
    'Plan de Salud': r.plan_salud || '',
    'Motivo del Bloqueo': r.motivo_bloqueo || '',
    'Fecha de Gestión': r.fecha_gestion ? ccFormatFechaCorta(r.fecha_gestion) : '',
    'Estado de Llamada': r.estado_llamada || '',
    'Hora 1er Intento': r.intento_1 || '',
    'Hora 2do Intento': r.intento_2 || '',
    'Hora 3er Intento': r.intento_3 || '',
    'Hora 4to Intento': r.intento_4 || '',
    'Hora 5to Intento': r.intento_5 || '',
    'Observación': r.observacion || ''
  }));
  const hoja = XLSX.utils.json_to_sheet(filas, { header: encabezados });
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Datos');

  const primerProfesional = (bsDatos[0].profesional || 'SIN_NOMBRE').replace(/\s+/g, '_');
  XLSX.writeFile(libro, `BLOQUEO_${primerProfesional}_${ccFechaHoyISO().replace(/-/g, '')}.xlsx`);
}
