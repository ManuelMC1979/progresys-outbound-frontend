/* ============================================================
   PENSIÓN
   Hoja de trabajo para gestión telefónica de casos de pensión.

   Mismo modelo de acceso que Cuenta Corriente / Bloqueo SNL:
   Administrador/Supervisor importan el Excel y lo asignan a un
   ejecutivo (o reasignan filas sueltas); ven todo el trabajo pero en
   modo solo vista. El ejecutivo asignado a cada fila es el único que
   puede gestionarla (contacto, fecha de gestión, 5 intentos y
   observación).

   Backend: GET/POST/PATCH/DELETE /api/pension (ver
   progresys-outbound-api-test/src/routes/pension.js).
   ============================================================ */
let pnDatos = [];
let pnFilasImportacion = [];
let pnIdEjecutivoImportacion = '';

const PN_ALIASES = {
  'RESOLUCION': 'resolucion',
  'SINIESTRO': 'siniestro',
  'NOMBRE': 'nombre',
  'RUT': 'rut',
  'N SEMANA': 'n_semana',
  'AGENCIA': 'agencia',
  'TELEFONO PCTE': 'telefono_pcte',
  'TIPO DE BENEFICIO': 'tipo_beneficio',
  'FECHA ACCIDENTE': 'fecha_accidente'
};

function pnNormalizarEncabezado(s) {
  return (s || '').toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\//g, ' ')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function pnEsAdmin() {
  return usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';
}

async function abrirPension() {
  document.getElementById('tituloVista').textContent = 'Pensión';
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoTabla();
  if (pnEsAdmin() && !catalogos) {
    try { await cargarCatalogos(); } catch (err) { /* si falla, el selector de ejecutivo saldrá vacío */ }
  }
  try {
    pnDatos = await api('/pension');
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
    return;
  }
  renderPension();
}

function renderPension() {
  const contenido = document.getElementById('contenido');
  const esAdmin = pnEsAdmin();
  contenido.innerHTML = `
    <div class="cc-view">
      <div class="toolbar">
        ${esAdmin ? `
          <select id="pnEjecutivoImport" style="min-width:220px; padding:8px; border:1px solid #ccc; border-radius:6px;">
            <option value="">— Ejecutivo a asignar al importar —</option>
            ${(catalogos?.ejecutivos || []).map(e => `<option value="${e.id_ejecutivo}">${e.nombre}</option>`).join('')}
          </select>
          <label class="cc-import-label">
            ⬆ Importar Excel
            <input type="file" id="pnArchivoExcel" accept=".xlsx,.xls">
          </label>
        ` : ''}
        <button class="btn" onclick="exportarPension()">↓ Exportar Excel</button>
      </div>
      ${esAdmin ? '<p class="cc-placeholder">Estás viendo el trabajo de todos los ejecutivos. Este perfil es de <strong>solo vista</strong>: la gestión (contacto, fecha de gestión, intentos) la realiza el ejecutivo asignado a cada fila.</p>' : ''}
      <div id="pnResultadoImportacion"></div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Resolución</th><th>Siniestro</th><th>Nombre</th><th>Rut</th>
              <th>N° Semana</th><th>Agencia</th><th>Teléfono Pcte</th><th>Tipo de Beneficio</th>
              <th>Fecha Accidente</th><th>Ejecutiva</th>
              <th>Contacto</th><th>Fecha de Gestión</th>
              <th>1 intento</th><th>2 intento</th><th>3 intento</th><th>4 intento</th><th>5 intento</th>
              <th>Observación</th>
              ${esAdmin ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody id="pnTbody">${pnFilasHtml()}</tbody>
        </table>
      </div>
      ${pnDatos.length === 0 ? `<p style="margin-top:16px;color:#999;">${esAdmin ? 'No hay registros. Importa un Excel para comenzar a asignar trabajo.' : 'No tienes filas de Pensión asignadas por el momento.'}</p>` : ''}
    </div>
  `;
  if (esAdmin) {
    document.getElementById('pnArchivoExcel').addEventListener('change', pnManejarArchivoExcel);
  }
}

function pnFilasHtml() {
  const esAdmin = pnEsAdmin();
  return pnDatos.map(r => `
    <tr>
      <td>${r.resolucion || '—'}</td>
      <td>${r.siniestro || '—'}</td>
      <td>${r.nombre || '—'}</td>
      <td>${r.rut || '—'}</td>
      <td>${r.n_semana || '—'}</td>
      <td>${r.agencia || '—'}</td>
      <td>${r.telefono_pcte || '—'}</td>
      <td>${r.tipo_beneficio || '—'}</td>
      <td>${ccFormatFechaCorta(r.fecha_accidente)}</td>
      <td>${esAdmin ? pnSelectorEjecutivo(r) : (r.ejecutivo || '—')}</td>
      <td>${esAdmin ? pnSoloLectura(r.contacto) : pnChipsHtml(r.id_pension, r.contacto)}</td>
      <td>${esAdmin ? ccFormatFechaCorta(r.fecha_gestion) : pnCeldaFecha(r.id_pension, r.fecha_gestion)}</td>
      <td>${esAdmin ? (r.intento_1 || '—') : pnCeldaIntento(r.id_pension, 'intento_1', r.intento_1)}</td>
      <td>${esAdmin ? (r.intento_2 || '—') : pnCeldaIntento(r.id_pension, 'intento_2', r.intento_2)}</td>
      <td>${esAdmin ? (r.intento_3 || '—') : pnCeldaIntento(r.id_pension, 'intento_3', r.intento_3)}</td>
      <td>${esAdmin ? (r.intento_4 || '—') : pnCeldaIntento(r.id_pension, 'intento_4', r.intento_4)}</td>
      <td>${esAdmin ? (r.intento_5 || '—') : pnCeldaIntento(r.id_pension, 'intento_5', r.intento_5)}</td>
      <td>${esAdmin ? (r.observacion || '—') : pnCeldaTexto(r.id_pension, r.observacion)}</td>
      ${esAdmin ? `<td><button class="btn secundario" onclick="pnEliminarFila('${r.id_pension}')">✕</button></td>` : ''}
    </tr>
  `).join('');
}

function pnSoloLectura(valor) {
  if (!valor) return '—';
  const clase = valor.startsWith('NO') ? 'cc-activo-no' : 'cc-activo-si';
  return `<span class="cc-chip cc-solo-lectura ${clase}">${valor}</span>`;
}

function pnSelectorEjecutivo(r) {
  const opciones = (catalogos?.ejecutivos || []).map(e =>
    `<option value="${e.id_ejecutivo}" ${e.id_ejecutivo === r.id_ejecutivo ? 'selected' : ''}>${e.nombre}</option>`
  ).join('');
  return `<select onchange="pnReasignarEjecutivo('${r.id_pension}', this.value)" style="max-width:170px; padding:4px;">${opciones}</select>`;
}

async function pnReasignarEjecutivo(id, idEjecutivo) {
  if (!idEjecutivo) return;
  try {
    const actualizado = await api(`/pension/${id}/asignar`, { method: 'POST', body: JSON.stringify({ id_ejecutivo: idEjecutivo }) });
    const idx = pnDatos.findIndex(r => String(r.id_pension) === String(id));
    if (idx !== -1) pnDatos[idx] = actualizado;
    document.getElementById('pnTbody').innerHTML = pnFilasHtml();
  } catch (err) {
    alert('Error al reasignar: ' + err.message);
    renderPension();
  }
}

function pnChipsHtml(id, valorActual) {
  return `<div class="cc-toggle-cell">${['CONTACTADO', 'NO CONTACTADO'].map(op => {
    const activo = valorActual === op;
    const clase = activo ? (op.startsWith('NO') ? 'cc-activo-no' : 'cc-activo-si') : '';
    return `<span class="cc-chip ${clase}" onclick="pnActualizarCampo('${id}', 'contacto', '${activo ? '' : op}')">${op}</span>`;
  }).join('')}</div>`;
}

function pnCeldaTexto(id, valor) {
  const escapado = (valor || '').toString().replace(/"/g, '&quot;');
  return `<input type="text" value="${escapado}" style="width:130px; padding:4px 6px; border:1px solid #ccc; border-radius:4px;"
            onblur="pnActualizarCampo('${id}', 'observacion', this.value)">`;
}

function pnCeldaFecha(id, valor) {
  if (!valor) {
    return `<span class="cc-marcar-cell vacio" onclick="pnActualizarCampo('${id}', 'fecha_gestion', '${ccFechaHoyISO()}')">— pinchar —</span>`;
  }
  return `<span class="cc-marcar-valor"><span class="cc-marcar-cell">${ccFormatFechaCorta(valor)}</span><span class="cc-limpiar" onclick="pnActualizarCampo('${id}', 'fecha_gestion', '')">✕</span></span>`;
}

function pnCeldaIntento(id, campo, valor) {
  if (!valor) {
    return `<span class="cc-marcar-cell vacio" onclick="pnActualizarCampo('${id}', '${campo}', '${ccHoraAhora()}')">— pinchar —</span>`;
  }
  return `<span class="cc-marcar-valor"><span class="cc-marcar-cell">${valor}</span><span class="cc-limpiar" onclick="pnActualizarCampo('${id}', '${campo}', '')">✕</span></span>`;
}

async function pnActualizarCampo(id, campo, valor) {
  if (pnEsAdmin()) return; // el perfil admin es de solo vista, no debería llegar aquí
  const fila = pnDatos.find(r => String(r.id_pension) === String(id));
  if (!fila) return;
  const anterior = fila[campo];
  if (anterior === (valor || null)) return; // sin cambios (ej. blur de un input de texto sin editar)
  fila[campo] = valor || null;
  document.getElementById('pnTbody').innerHTML = pnFilasHtml();
  try {
    await api(`/pension/${id}/campo`, { method: 'PATCH', body: JSON.stringify({ campo, valor: valor || null }) });
  } catch (err) {
    fila[campo] = anterior;
    document.getElementById('pnTbody').innerHTML = pnFilasHtml();
    alert('Error al guardar: ' + err.message);
  }
}

async function pnEliminarFila(id) {
  if (!confirm('¿Eliminar este registro de Pensión?')) return;
  try {
    await api(`/pension/${id}`, { method: 'DELETE' });
    pnDatos = pnDatos.filter(r => String(r.id_pension) !== String(id));
    document.getElementById('pnTbody').innerHTML = pnFilasHtml();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* ---------------- Importar Excel (solo Administrador/Supervisor) ---------------- */
async function pnManejarArchivoExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const idEjecutivo = document.getElementById('pnEjecutivoImport').value;
  if (!idEjecutivo) {
    alert('Selecciona primero el ejecutivo al que se le asignará esta planilla.');
    e.target.value = '';
    return;
  }
  pnIdEjecutivoImportacion = idEjecutivo;

  const resultadoDiv = document.getElementById('pnResultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Leyendo archivo...</div>';

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];

  // Algunas planillas traen filas de título/vacías antes del encabezado
  // real, así que se busca la fila que contiene la columna RUT en vez de
  // asumir que el encabezado está en la primera fila.
  const filasCrudas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: null });
  const indiceEncabezados = filasCrudas.findIndex(fila => (fila || []).some(c => pnNormalizarEncabezado(c) === 'RUT'));
  if (indiceEncabezados === -1) {
    resultadoDiv.innerHTML = '<p style="color:var(--rojo);">No se encontró una columna "Rut" en el archivo. Revisa que la planilla tenga esa columna.</p>';
    e.target.value = '';
    return;
  }
  const encabezados = filasCrudas[indiceEncabezados];

  const indicePorCampo = {};
  encabezados.forEach((encabezado, idx) => {
    const campo = PN_ALIASES[pnNormalizarEncabezado(encabezado)];
    if (campo && indicePorCampo[campo] === undefined) indicePorCampo[campo] = idx;
  });
  const leerCampo = (fila, campo) => {
    const idx = indicePorCampo[campo];
    return idx === undefined ? null : fila[idx];
  };

  const filasDatos = filasCrudas
    .slice(indiceEncabezados + 1)
    .filter(fila => (fila || []).some(c => c !== null && c !== undefined && c !== ''));

  pnFilasImportacion = filasDatos
    .map(fila => {
      const rut = (leerCampo(fila, 'rut') || '').toString().trim();
      if (!rut) return null;
      const fechaAccidente = leerCampo(fila, 'fecha_accidente');
      return {
        resolucion: (leerCampo(fila, 'resolucion') || '').toString().trim(),
        siniestro: (leerCampo(fila, 'siniestro') || '').toString().trim(),
        nombre: (leerCampo(fila, 'nombre') || '').toString().trim(),
        rut,
        n_semana: (leerCampo(fila, 'n_semana') || '').toString().trim(),
        agencia: (leerCampo(fila, 'agencia') || '').toString().trim(),
        telefono_pcte: (leerCampo(fila, 'telefono_pcte') || '').toString().trim(),
        tipo_beneficio: (leerCampo(fila, 'tipo_beneficio') || '').toString().trim(),
        fecha_accidente: fechaAccidente instanceof Date ? fechaAccidente.toISOString().slice(0, 10) : (fechaAccidente || null)
      };
    })
    .filter(Boolean);

  pnRenderPreviewImportacion();
}

function pnRenderPreviewImportacion() {
  const resultadoDiv = document.getElementById('pnResultadoImportacion');
  if (pnFilasImportacion.length === 0) {
    resultadoDiv.innerHTML = '<p style="color:var(--rojo);">No se encontraron filas válidas (se requiere al menos la columna RUT).</p>';
    return;
  }
  const nombreEjecutivo = (catalogos?.ejecutivos || []).find(e => e.id_ejecutivo === pnIdEjecutivoImportacion)?.nombre || '—';
  resultadoDiv.innerHTML = `
    <div class="toolbar">
      <button class="btn" onclick="pnConfirmarImportacion()">Confirmar importación (${pnFilasImportacion.length} filas → ${nombreEjecutivo})</button>
      <button class="btn secundario" onclick="document.getElementById('pnResultadoImportacion').innerHTML=''">Cancelar</button>
    </div>
    <table>
      <thead><tr><th>Rut</th><th>Nombre</th><th>Siniestro</th><th>Tipo de Beneficio</th></tr></thead>
      <tbody>
        ${pnFilasImportacion.map(f => `<tr><td>${f.rut}</td><td>${f.nombre || '—'}</td><td>${f.siniestro || '—'}</td><td>${f.tipo_beneficio || '—'}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
}

async function pnConfirmarImportacion() {
  if (pnFilasImportacion.length === 0 || !pnIdEjecutivoImportacion) return;
  const resultadoDiv = document.getElementById('pnResultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Importando...</div>';
  try {
    const creadas = await api('/pension/importar', {
      method: 'POST',
      body: JSON.stringify({ id_ejecutivo: pnIdEjecutivoImportacion, filas: pnFilasImportacion })
    });
    pnDatos = pnDatos.concat(Array.isArray(creadas) ? creadas : []);
    pnFilasImportacion = [];
    pnIdEjecutivoImportacion = '';
    renderPension();
  } catch (err) {
    resultadoDiv.innerHTML = `<p style="color:var(--rojo);">Error al importar: ${err.message}</p>`;
  }
}

/* ---------------- Exportar Excel ---------------- */
function exportarPension() {
  const encabezados = ['Resolucion', 'Siniestro', 'Nombre', 'Rut', 'N° Semana', 'Agencia', 'Telefono Pcte', 'Tipo de Beneficio', 'Fecha Accidente', 'Ejecutiva', 'Contacto', 'Fecha de Gestión', '1 intento', '2 intento', '3 intento', '4 intento', '5 intento', 'Observación'];
  const filas = pnDatos.map(r => ({
    'Resolucion': r.resolucion || '',
    'Siniestro': r.siniestro || '',
    'Nombre': r.nombre || '',
    'Rut': r.rut || '',
    'N° Semana': r.n_semana || '',
    'Agencia': r.agencia || '',
    'Telefono Pcte': r.telefono_pcte || '',
    'Tipo de Beneficio': r.tipo_beneficio || '',
    'Fecha Accidente': r.fecha_accidente ? ccFormatFechaCorta(r.fecha_accidente) : '',
    'Ejecutiva': r.ejecutivo || '',
    'Contacto': r.contacto || '',
    'Fecha de Gestión': r.fecha_gestion ? ccFormatFechaCorta(r.fecha_gestion) : '',
    '1 intento': r.intento_1 || '',
    '2 intento': r.intento_2 || '',
    '3 intento': r.intento_3 || '',
    '4 intento': r.intento_4 || '',
    '5 intento': r.intento_5 || '',
    'Observación': r.observacion || ''
  }));
  const hoja = XLSX.utils.json_to_sheet(filas, { header: encabezados });
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Pensión');
  XLSX.writeFile(libro, `Pension_${ccFechaHoyISO()}.xlsx`);
}
