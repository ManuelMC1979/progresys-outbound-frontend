/* ============================================================
   BLOQUEO SNL
   Hoja de trabajo compartida (Administrador y Ejecutivo por igual,
   sin restricción de vista) para gestionar las citas bloqueadas que
   exporta el sistema de agendamiento (Centro, Profesional, Paciente,
   etc.) — se importa el CSV/Excel exportado, se completa en pantalla
   (plan de salud, motivo del bloqueo, estado de llamada, fecha de
   gestión, 5 intentos y observación) y se exporta de vuelta a Excel.

   Formato portado de la herramienta standalone SNLBLOQUEOV5_5.html.
   Backend: GET/POST/PATCH/DELETE /api/bloqueo-snl (ver
   progresys-outbound-api-test/src/routes/bloqueo-snl.js).
   ============================================================ */
let bsDatos = [];
let bsFilasImportacion = [];
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

async function abrirBloqueoSnl() {
  document.getElementById('tituloVista').textContent = 'Bloqueo SNL';
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoTabla();
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
  const total = bsDatos.length;
  const contactados = bsDatos.filter(r => r.estado_llamada === 'CONTACTADO').length;
  const noContactados = bsDatos.filter(r => r.estado_llamada === 'NO CONTACTADO').length;
  const pendientes = total - contactados - noContactados;

  contenido.innerHTML = `
    <div class="cc-view">
      <div class="toolbar">
        <label class="cc-import-label">
          ⬆ Importar planilla
          <input type="file" id="bsArchivo" accept=".xlsx,.xls,.csv">
        </label>
        <button class="btn" onclick="exportarBloqueoSnl()">↓ Exportar Excel</button>
        <button class="btn secundario" onclick="bsLimpiarTodo()">🗑 Limpiar todo</button>
        <input type="text" id="bsBuscar" placeholder="Buscar en cualquier columna..." value="${bsBusqueda}"
               style="flex:1; min-width:200px; max-width:340px; padding:8px 14px; border:1px solid #ccc; border-radius:20px;"
               oninput="bsBusqueda = this.value; bsRenderTabla();">
      </div>
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
              <th>Plan de Salud</th><th>Motivo del Bloqueo</th><th>Fecha de Gestión</th>
              <th>Estado de Llamada</th><th>1er Intento</th><th>2do Intento</th><th>3er Intento</th>
              <th>4to Intento</th><th>5to Intento</th><th>Observación</th><th></th>
            </tr>
          </thead>
          <tbody id="bsTbody"></tbody>
        </table>
      </div>
      <p id="bsSinRegistros" style="margin-top:16px;color:#999;"></p>
    </div>
  `;
  document.getElementById('bsArchivo').addEventListener('change', bsManejarArchivo);
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
    ? 'No hay registros. Importa la planilla del sistema de citas para comenzar.'
    : (filas.length === 0 ? 'Ningún registro coincide con el filtro/búsqueda actual.' : '');
}

function bsFilaHtml(r) {
  const id = r.id_bloqueo_snl;
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
      <td>${bsCeldaTexto(id, 'plan_salud', r.plan_salud)}</td>
      <td>${bsCeldaTexto(id, 'motivo_bloqueo', r.motivo_bloqueo)}</td>
      <td>${bsCeldaFecha(id, r.fecha_gestion)}</td>
      <td>${bsChipsHtml(id, r.estado_llamada)}</td>
      <td>${bsCeldaIntento(id, 'intento_1', r.intento_1)}</td>
      <td>${bsCeldaIntento(id, 'intento_2', r.intento_2)}</td>
      <td>${bsCeldaIntento(id, 'intento_3', r.intento_3)}</td>
      <td>${bsCeldaIntento(id, 'intento_4', r.intento_4)}</td>
      <td>${bsCeldaIntento(id, 'intento_5', r.intento_5)}</td>
      <td>${bsCeldaTexto(id, 'observacion', r.observacion)}</td>
      <td><button class="btn secundario" onclick="bsEliminarFila('${id}')">✕</button></td>
    </tr>
  `;
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

/* ---------------- Importar CSV / Excel ---------------- */
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
  resultadoDiv.innerHTML = `
    <div class="toolbar">
      <button class="btn" onclick="bsConfirmarImportacion()">Confirmar importación (${bsFilasImportacion.length} filas)</button>
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
  if (bsFilasImportacion.length === 0) return;
  const resultadoDiv = document.getElementById('bsResultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Importando...</div>';
  try {
    const creadas = await api('/bloqueo-snl/importar', { method: 'POST', body: JSON.stringify({ filas: bsFilasImportacion }) });
    bsDatos = bsDatos.concat(Array.isArray(creadas) ? creadas : []);
    bsFilasImportacion = [];
    renderBloqueoSnl();
  } catch (err) {
    resultadoDiv.innerHTML = `<p style="color:var(--rojo);">Error al importar: ${err.message}</p>`;
  }
}

/* ---------------- Exportar Excel ---------------- */
function exportarBloqueoSnl() {
  if (bsDatos.length === 0) { alert('No hay datos para exportar.'); return; }
  const encabezados = ['Centro', 'Área', 'Profesional/Recurso', 'No. Doc. Profesional', 'Especialidad', 'Servicio', 'Fecha desde', 'Hora desde', 'Estado', 'No. Doc. Paciente', 'Paciente', 'Tel. Principal', 'Plan de Salud', 'Motivo del Bloqueo', 'Fecha de Gestión', 'Estado de Llamada', 'Hora 1er Intento', 'Hora 2do Intento', 'Hora 3er Intento', 'Hora 4to Intento', 'Hora 5to Intento', 'Observación'];
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
