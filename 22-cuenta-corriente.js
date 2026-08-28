/* ============================================================
   CUENTA CORRIENTE
   Hoja de trabajo para gestión telefónica de cuentas corrientes.

   Perfil EJECUTIVO: solo ve y trabaja sus propias filas asignadas
   (contacto, estado cita, transporte, fecha e intentos de llamado).
   Perfil ADMINISTRADOR/SUPERVISOR: importa el Excel y asigna cada
   carga a un ejecutivo; puede ver el trabajo de todos, pero en
   modo solo-lectura — no puede tocar los campos de gestión.

   Backend: GET/POST/PATCH/DELETE /api/cuenta-corriente (ver
   progresys-outbound-api-test/src/routes/cuenta-corriente.js).
   ============================================================ */
let ccDatos = [];
let ccFilasImportacion = [];
let ccIdEjecutivoImportacion = '';

const CC_ALIASES = {
  'FECHA': 'fecha_cita',
  'RUT': 'rut',
  'EPISODIO': 'episodio',
  'NOMBRE PACIENTE': 'nombre_paciente',
  'SERVICIO ATENCION': 'servicio_atencion',
  'MEDICO TIPO EXAMEN': 'medico_tipo_examen',
  'TIPO CITA CONTROL': 'tipo_cita_control',
  'TELEFONO 1': 'telefono_1',
  'TELEFONO 2': 'telefono_2',
  'OBSERVACIONES DEL SERVICIO': 'observaciones_servicio',
  'TIPO CITA': 'tipo_cita',
  'OBSERVACIONES OUTBOUND': 'observaciones_outbound'
};

function ccNormalizarEncabezado(s) {
  return (s || '').toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\//g, ' ')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function ccEsAdmin() {
  return usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';
}

async function abrirCuentaCorriente() {
  document.getElementById('tituloVista').textContent = 'Cuenta Corriente';
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoTabla();
  if (ccEsAdmin() && !catalogos) {
    try { await cargarCatalogos(); } catch (err) { /* si falla, el selector de ejecutivo saldrá vacío */ }
  }
  try {
    ccDatos = await api('/cuenta-corriente');
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
    return;
  }
  renderCuentaCorriente();
}

function renderCuentaCorriente() {
  const contenido = document.getElementById('contenido');
  const esAdmin = ccEsAdmin();
  contenido.innerHTML = `
    <div class="cc-view">
      <div class="toolbar">
        ${esAdmin ? `
          <select id="ccEjecutivoImport" style="min-width:220px; padding:8px; border:1px solid #ccc; border-radius:6px;">
            <option value="">— Ejecutivo a asignar al importar —</option>
            ${(catalogos?.ejecutivos || []).map(e => `<option value="${e.id_ejecutivo}">${e.nombre}</option>`).join('')}
          </select>
          <label class="cc-import-label">
            ⬆ Importar Excel
            <input type="file" id="ccArchivoExcel" accept=".xlsx,.xls">
          </label>
        ` : ''}
        <button class="btn" onclick="exportarCuentaCorriente()">↓ Exportar Excel</button>
      </div>
      ${esAdmin ? '<p class="cc-placeholder">Estás viendo el trabajo de todos los ejecutivos. Este perfil es de <strong>solo vista</strong>: la gestión (contacto, estado cita, transporte, intentos) la realiza el ejecutivo asignado a cada fila.</p>' : ''}
      <div id="ccResultadoImportacion"></div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Fecha</th><th>Rut</th><th>Episodio</th><th>Nombre paciente</th>
              <th>Servicio atención</th><th>Médico / Tipo examen</th><th>Tipo cita/control</th>
              <th>Teléfono 1</th><th>Teléfono 2</th><th>Observaciones del servicio</th>
              <th>Tipo cita</th><th>Observaciones Outbound</th><th>Ejecutiva</th>
              <th>Contacto</th><th>Estado cita</th><th>Transporte</th><th>Fecha</th>
              <th>1 intento</th><th>2 intento</th><th>3 intento</th><th>4 intento</th><th>5 intento</th>
              ${esAdmin ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody id="ccTbody">${ccFilasHtml()}</tbody>
        </table>
      </div>
      ${ccDatos.length === 0 ? `<p style="margin-top:16px;color:#999;">${esAdmin ? 'No hay registros. Importa un Excel para comenzar a asignar trabajo.' : 'No tienes filas de Cuenta Corriente asignadas por el momento.'}</p>` : ''}
    </div>
  `;
  if (esAdmin) {
    document.getElementById('ccArchivoExcel').addEventListener('change', ccManejarArchivoExcel);
  }
}

function ccFilasHtml() {
  const esAdmin = ccEsAdmin();
  return ccDatos.map(r => `
    <tr>
      <td>${ccFormatFechaCorta(r.fecha_cita)}</td>
      <td>${r.rut || '—'}</td>
      <td>${r.episodio || '—'}</td>
      <td>${r.nombre_paciente || '—'}</td>
      <td>${r.servicio_atencion || '—'}</td>
      <td>${r.medico_tipo_examen || '—'}</td>
      <td>${r.tipo_cita_control || '—'}</td>
      <td>${r.telefono_1 || '—'}</td>
      <td>${r.telefono_2 || '—'}</td>
      <td>${r.observaciones_servicio || '—'}</td>
      <td>${r.tipo_cita || '—'}</td>
      <td>${r.observaciones_outbound || '—'}</td>
      <td>${esAdmin ? ccSelectorEjecutivo(r) : (r.ejecutivo || '—')}</td>
      <td>${esAdmin ? ccSoloLectura(r.contacto) : ccChipsHtml(r.id_cuenta_corriente, 'contacto', r.contacto, ['CONTACTADO', 'NO CONTACTADO'])}</td>
      <td>${esAdmin ? ccSoloLectura(r.estado_cita) : ccChipsHtml(r.id_cuenta_corriente, 'estado_cita', r.estado_cita, ['SI CONFIRMA', 'NO CONFIRMA'])}</td>
      <td>${esAdmin ? ccSoloLectura(r.transporte) : ccChipsHtml(r.id_cuenta_corriente, 'transporte', r.transporte, ['SI', 'NO'])}</td>
      <td>${esAdmin ? ccFormatFechaCorta(r.fecha_contacto) : ccCeldaFecha(r.id_cuenta_corriente, r.fecha_contacto)}</td>
      <td>${esAdmin ? (r.intento_1 || '—') : ccCeldaIntento(r.id_cuenta_corriente, 'intento_1', r.intento_1)}</td>
      <td>${esAdmin ? (r.intento_2 || '—') : ccCeldaIntento(r.id_cuenta_corriente, 'intento_2', r.intento_2)}</td>
      <td>${esAdmin ? (r.intento_3 || '—') : ccCeldaIntento(r.id_cuenta_corriente, 'intento_3', r.intento_3)}</td>
      <td>${esAdmin ? (r.intento_4 || '—') : ccCeldaIntento(r.id_cuenta_corriente, 'intento_4', r.intento_4)}</td>
      <td>${esAdmin ? (r.intento_5 || '—') : ccCeldaIntento(r.id_cuenta_corriente, 'intento_5', r.intento_5)}</td>
      ${esAdmin ? `<td><button class="btn secundario" onclick="ccEliminarFila('${r.id_cuenta_corriente}')">✕</button></td>` : ''}
    </tr>
  `).join('');
}

function ccSoloLectura(valor) {
  if (!valor) return '—';
  const clase = valor.startsWith('NO') ? 'cc-activo-no' : 'cc-activo-si';
  return `<span class="cc-chip cc-solo-lectura ${clase}">${valor}</span>`;
}

function ccSelectorEjecutivo(r) {
  const opciones = (catalogos?.ejecutivos || []).map(e =>
    `<option value="${e.id_ejecutivo}" ${e.id_ejecutivo === r.id_ejecutivo ? 'selected' : ''}>${e.nombre}</option>`
  ).join('');
  return `<select onchange="ccReasignarEjecutivo('${r.id_cuenta_corriente}', this.value)" style="max-width:170px; padding:4px;">${opciones}</select>`;
}

async function ccReasignarEjecutivo(id, idEjecutivo) {
  if (!idEjecutivo) return;
  try {
    const actualizado = await api(`/cuenta-corriente/${id}/asignar`, { method: 'POST', body: JSON.stringify({ id_ejecutivo: idEjecutivo }) });
    const idx = ccDatos.findIndex(r => String(r.id_cuenta_corriente) === String(id));
    if (idx !== -1) ccDatos[idx] = actualizado;
    document.getElementById('ccTbody').innerHTML = ccFilasHtml();
  } catch (err) {
    alert('Error al reasignar: ' + err.message);
    renderCuentaCorriente();
  }
}

function ccChipsHtml(id, campo, valorActual, opciones) {
  return `<div class="cc-toggle-cell">${opciones.map(op => {
    const activo = valorActual === op;
    const clase = activo ? (op.startsWith('NO') ? 'cc-activo-no' : 'cc-activo-si') : '';
    return `<span class="cc-chip ${clase}" onclick="ccActualizarCampo('${id}', '${campo}', '${activo ? '' : op}')">${op}</span>`;
  }).join('')}</div>`;
}

function ccCeldaFecha(id, valor) {
  if (!valor) {
    return `<span class="cc-marcar-cell vacio" onclick="ccActualizarCampo('${id}', 'fecha_contacto', '${ccFechaHoyISO()}')">— pinchar —</span>`;
  }
  return `<span class="cc-marcar-valor"><span class="cc-marcar-cell">${ccFormatFechaCorta(valor)}</span><span class="cc-limpiar" onclick="ccActualizarCampo('${id}', 'fecha_contacto', '')">✕</span></span>`;
}

function ccCeldaIntento(id, campo, valor) {
  if (!valor) {
    return `<span class="cc-marcar-cell vacio" onclick="ccActualizarCampo('${id}', '${campo}', '${ccHoraAhora()}')">— pinchar —</span>`;
  }
  return `<span class="cc-marcar-valor"><span class="cc-marcar-cell">${valor}</span><span class="cc-limpiar" onclick="ccActualizarCampo('${id}', '${campo}', '')">✕</span></span>`;
}

function ccFechaHoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ccHoraAhora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function ccFormatFechaCorta(fecha) {
  if (!fecha) return '—';
  const texto = fecha.toString();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    const [anio, mes, dia] = texto.slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return texto;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function ccActualizarCampo(id, campo, valor) {
  if (ccEsAdmin()) return; // el perfil admin es de solo vista, no debería llegar aquí
  const fila = ccDatos.find(r => String(r.id_cuenta_corriente) === String(id));
  if (!fila) return;
  const anterior = fila[campo];
  fila[campo] = valor || null;
  document.getElementById('ccTbody').innerHTML = ccFilasHtml();
  try {
    await api(`/cuenta-corriente/${id}/campo`, { method: 'PATCH', body: JSON.stringify({ campo, valor: valor || null }) });
  } catch (err) {
    fila[campo] = anterior;
    document.getElementById('ccTbody').innerHTML = ccFilasHtml();
    alert('Error al guardar: ' + err.message);
  }
}

async function ccEliminarFila(id) {
  if (!confirm('¿Eliminar este registro de la hoja de Cuenta Corriente?')) return;
  try {
    await api(`/cuenta-corriente/${id}`, { method: 'DELETE' });
    ccDatos = ccDatos.filter(r => String(r.id_cuenta_corriente) !== String(id));
    document.getElementById('ccTbody').innerHTML = ccFilasHtml();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* ---------------- Importar Excel (solo Administrador/Supervisor) ---------------- */
async function ccManejarArchivoExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const idEjecutivo = document.getElementById('ccEjecutivoImport').value;
  if (!idEjecutivo) {
    alert('Selecciona primero el ejecutivo al que se le asignará esta planilla.');
    e.target.value = '';
    return;
  }
  ccIdEjecutivoImportacion = idEjecutivo;

  const resultadoDiv = document.getElementById('ccResultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Leyendo archivo...</div>';

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];

  // Algunas planillas traen filas de título/vacías antes del encabezado real,
  // así que se busca la fila que contiene la columna RUT en vez de asumir
  // que el encabezado está en la primera fila.
  const filasCrudas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: null });
  const indiceEncabezados = filasCrudas.findIndex(fila => (fila || []).some(c => ccNormalizarEncabezado(c) === 'RUT'));
  if (indiceEncabezados === -1) {
    document.getElementById('ccResultadoImportacion').innerHTML =
      '<p style="color:var(--rojo);">No se encontró una columna "Rut" en el archivo. Revisa que la planilla tenga esa columna.</p>';
    e.target.value = '';
    return;
  }
  const encabezados = filasCrudas[indiceEncabezados];

  // La planilla real repite "Fecha" (fecha de la cita y, más adelante, fecha
  // de contacto) y otras columnas de gestión que no se importan: se toma solo
  // la primera columna que calce con cada alias conocido.
  const indicePorCampo = {};
  encabezados.forEach((encabezado, idx) => {
    const campo = CC_ALIASES[ccNormalizarEncabezado(encabezado)];
    if (campo && indicePorCampo[campo] === undefined) indicePorCampo[campo] = idx;
  });
  const leerCampo = (fila, campo) => {
    const idx = indicePorCampo[campo];
    return idx === undefined ? null : fila[idx];
  };

  const filasDatos = filasCrudas
    .slice(indiceEncabezados + 1)
    .filter(fila => (fila || []).some(c => c !== null && c !== undefined && c !== ''));

  ccFilasImportacion = filasDatos
    .map(fila => {
      const rut = (leerCampo(fila, 'rut') || '').toString().trim();
      if (!rut) return null;
      const fechaCita = leerCampo(fila, 'fecha_cita');
      return {
        fecha_cita: fechaCita instanceof Date ? fechaCita.toISOString().slice(0, 10) : (fechaCita || null),
        rut,
        episodio: (leerCampo(fila, 'episodio') || '').toString().trim(),
        nombre_paciente: (leerCampo(fila, 'nombre_paciente') || '').toString().trim(),
        servicio_atencion: (leerCampo(fila, 'servicio_atencion') || '').toString().trim(),
        medico_tipo_examen: (leerCampo(fila, 'medico_tipo_examen') || '').toString().trim(),
        tipo_cita_control: (leerCampo(fila, 'tipo_cita_control') || '').toString().trim(),
        telefono_1: (leerCampo(fila, 'telefono_1') || '').toString().trim(),
        telefono_2: (leerCampo(fila, 'telefono_2') || '').toString().trim(),
        observaciones_servicio: (leerCampo(fila, 'observaciones_servicio') || '').toString().trim(),
        tipo_cita: (leerCampo(fila, 'tipo_cita') || '').toString().trim(),
        observaciones_outbound: (leerCampo(fila, 'observaciones_outbound') || '').toString().trim()
      };
    })
    .filter(Boolean);

  renderPreviewImportacionCC();
}

function renderPreviewImportacionCC() {
  const resultadoDiv = document.getElementById('ccResultadoImportacion');
  if (ccFilasImportacion.length === 0) {
    resultadoDiv.innerHTML = '<p style="color:var(--rojo);">No se encontraron filas válidas (se requiere al menos la columna RUT).</p>';
    return;
  }
  const nombreEjecutivo = (catalogos?.ejecutivos || []).find(e => e.id_ejecutivo === ccIdEjecutivoImportacion)?.nombre || '—';
  resultadoDiv.innerHTML = `
    <div class="toolbar">
      <button class="btn" onclick="ccConfirmarImportacion()">Confirmar importación (${ccFilasImportacion.length} filas → ${nombreEjecutivo})</button>
      <button class="btn secundario" onclick="document.getElementById('ccResultadoImportacion').innerHTML=''">Cancelar</button>
    </div>
    <table>
      <thead><tr><th>Rut</th><th>Nombre paciente</th><th>Fecha</th><th>Servicio atención</th></tr></thead>
      <tbody>
        ${ccFilasImportacion.map(f => `<tr><td>${f.rut}</td><td>${f.nombre_paciente || '—'}</td><td>${ccFormatFechaCorta(f.fecha_cita)}</td><td>${f.servicio_atencion || '—'}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
}

async function ccConfirmarImportacion() {
  if (ccFilasImportacion.length === 0 || !ccIdEjecutivoImportacion) return;
  const resultadoDiv = document.getElementById('ccResultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Importando...</div>';
  try {
    const creadas = await api('/cuenta-corriente/importar', {
      method: 'POST',
      body: JSON.stringify({ id_ejecutivo: ccIdEjecutivoImportacion, filas: ccFilasImportacion })
    });
    ccDatos = ccDatos.concat(Array.isArray(creadas) ? creadas : []);
    ccFilasImportacion = [];
    ccIdEjecutivoImportacion = '';
    renderCuentaCorriente();
  } catch (err) {
    resultadoDiv.innerHTML = `<p style="color:var(--rojo);">Error al importar: ${err.message}</p>`;
  }
}

/* ---------------- Exportar Excel ---------------- */
function exportarCuentaCorriente() {
  const encabezados = ['Fecha', 'Rut', 'Episodio', 'Nombre Paciente', 'Servicio Atencion', 'Medico / Tipo Examen', 'Tipo Cita/Control', 'Telefono 1', 'Telefono 2', 'Observaciones del Servicio', 'Tipo Cita', 'Observaciones Outbound', 'Ejecutiva', 'Contacto', 'Estado Cita', 'Transporte', 'Fecha Contacto', '1 intento', '2 intento', '3 intento', '4 intento', '5 intento'];
  const filas = ccDatos.map(r => ({
    'Fecha': r.fecha_cita ? ccFormatFechaCorta(r.fecha_cita) : '',
    'Rut': r.rut || '',
    'Episodio': r.episodio || '',
    'Nombre Paciente': r.nombre_paciente || '',
    'Servicio Atencion': r.servicio_atencion || '',
    'Medico / Tipo Examen': r.medico_tipo_examen || '',
    'Tipo Cita/Control': r.tipo_cita_control || '',
    'Telefono 1': r.telefono_1 || '',
    'Telefono 2': r.telefono_2 || '',
    'Observaciones del Servicio': r.observaciones_servicio || '',
    'Tipo Cita': r.tipo_cita || '',
    'Observaciones Outbound': r.observaciones_outbound || '',
    'Ejecutiva': r.ejecutivo || '',
    'Contacto': r.contacto || '',
    'Estado Cita': r.estado_cita || '',
    'Transporte': r.transporte || '',
    'Fecha Contacto': r.fecha_contacto ? ccFormatFechaCorta(r.fecha_contacto) : '',
    '1 intento': r.intento_1 || '',
    '2 intento': r.intento_2 || '',
    '3 intento': r.intento_3 || '',
    '4 intento': r.intento_4 || '',
    '5 intento': r.intento_5 || ''
  }));
  const hoja = XLSX.utils.json_to_sheet(filas, { header: encabezados });
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Cuenta Corriente');
  XLSX.writeFile(libro, `Cuenta_Corriente_${ccFechaHoyISO()}.xlsx`);
}

/* ---------------- Bloqueo SNL / Pensión ----------------
   Próximos módulos, mismo patrón que Cuenta Corriente.
   Por ahora quedan como placeholder a la espera de definir su
   propio formato de planilla. */
function abrirBloqueoSnl() {
  document.getElementById('tituloVista').textContent = 'Bloqueo SNL';
  document.getElementById('contenido').innerHTML = `
    <p class="cc-placeholder">El módulo de <strong>Bloqueo SNL</strong> está en construcción. Primero se está terminando de probar Cuenta Corriente.</p>
  `;
}

function abrirPension() {
  document.getElementById('tituloVista').textContent = 'Pensión';
  document.getElementById('contenido').innerHTML = `
    <p class="cc-placeholder">El módulo de <strong>Pensión</strong> está en construcción. Primero se está terminando de probar Cuenta Corriente.</p>
  `;
}
