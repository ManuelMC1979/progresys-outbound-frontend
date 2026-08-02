/* ============================================================
   IMPORTAR DESDE EXCEL (Checklist_Diario Out.xlsx → BASE OUTBOUND)
   ============================================================ */
let filasImportacion = []; // filas parseadas y validadas, listas para revisar/confirmar

function renderImportarInicial() {
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = `
    <p style="color:#555; max-width:640px;">
      Selecciona tu archivo <b>Checklist_Diario Out.xlsx</b>. Se leerá la hoja <b>BASE OUTBOUND</b>
      (columnas: ID CORREO, RUT PACIENTE, ÁREA SOLICITANTE, TIPO DE GESTIÓN, PRIORIDAD, EJECUTIVO,
      FECHA/HORA RECEPCIÓN CORREO). Solo se importan correos y casos — el historial de intentos
      de llamada ya registrados en el Excel no se importa en esta versión.
    </p>
    <input type="file" id="archivoExcel" accept=".xlsx,.xls">
    <div id="resultadoImportacion" style="margin-top:20px;"></div>
  `;
  document.getElementById('archivoExcel').addEventListener('change', manejarArchivoExcel);
}

async function renderImportar() {
  if (!catalogos) await cargarCatalogos();
  renderImportarInicial();
}

function validarRut(rut) {
  if (!rut) return false;
  const limpio = rut.toString().replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  return /^\d{6,9}-[0-9K]$/.test(limpio);
}

async function manejarArchivoExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const resultadoDiv = document.getElementById('resultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Leyendo y validando archivo...</div>';

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const hoja = workbook.Sheets['BASE OUTBOUND'];
  if (!hoja) {
    resultadoDiv.innerHTML = '<p style="color:#d9534f;">No se encontró la hoja "BASE OUTBOUND" en el archivo.</p>';
    return;
  }

  // Los encabezados reales están en la fila 4 (índice 3), los datos parten en la fila 5
  const filas = XLSX.utils.sheet_to_json(hoja, { range: 3, defval: null });

  // Traer casos existentes para detectar duplicados por RUT
  const casosExistentes = await api('/casos');
  const rutsExistentes = new Set(casosExistentes.map(c => c.rut_paciente?.toUpperCase()));

  const nombresEjecutivos = new Set((catalogos.ejecutivos || []).map(e => e.nombre.toUpperCase()));
  const nombresAreas = new Set((catalogos.areas || []).map(a => a.nombre.toUpperCase()));
  const nombresTipos = new Set((catalogos.tipos_gestion || []).map(t => t.nombre.toUpperCase()));

  const rutsVistosEnArchivo = new Set();

  filasImportacion = filas
    .filter(f => f['RUT PACIENTE']) // ignorar filas vacías / sin RUT (ej. filas de ejemplo incompletas)
    .map((f, i) => {
      const rut = (f['RUT PACIENTE'] || '').toString().trim();
      const rutUpper = rut.toUpperCase();
      const ejecutivo = (f['EJECUTIVO'] || '').toString().trim();
      const area = (f['ÁREA SOLICITANTE'] || '').toString().trim();
      const tipoGestion = (f['TIPO DE GESTIÓN'] || '').toString().trim();

      const errores = [];
      if (!validarRut(rut)) errores.push('RUT con formato inválido');
      if (rutsExistentes.has(rutUpper)) errores.push('Ya existe un caso con este RUT en el sistema');
      if (rutsVistosEnArchivo.has(rutUpper)) errores.push('RUT duplicado dentro del mismo archivo');
      if (ejecutivo && !nombresEjecutivos.has(ejecutivo.toUpperCase())) errores.push(`Ejecutivo "${ejecutivo}" no existe en el sistema`);
      if (area && !nombresAreas.has(area.toUpperCase())) errores.push(`Área "${area}" no existe en el sistema`);
      if (tipoGestion && !nombresTipos.has(tipoGestion.toUpperCase())) errores.push(`Tipo de gestión "${tipoGestion}" no existe en el sistema`);

      rutsVistosEnArchivo.add(rutUpper);

      return {
        fila: i + 5,
        id_correo_excel: f['ID CORREO'] || null,
        rut_paciente: rut,
        area,
        tipo_gestion: tipoGestion,
        prioridad: (f['PRIORIDAD'] || '').toString().trim(),
        ejecutivo,
        fecha_hora_recepcion: f['FECHA/HORA RECEPCIÓN CORREO'] || null,
        observaciones: (f['OBSERVACIONES'] || '').toString().trim(),
        errores,
        incluir: errores.length === 0
      };
    });

  renderPreviewImportacion();
}

function renderPreviewImportacion() {
  const resultadoDiv = document.getElementById('resultadoImportacion');
  const validas = filasImportacion.filter(f => f.errores.length === 0).length;
  const conError = filasImportacion.length - validas;

  resultadoDiv.innerHTML = `
    <div class="kpis" style="margin-bottom:16px;">
      <div class="kpi-card"><div class="valor">${filasImportacion.length}</div><div class="etiqueta">Filas leídas</div></div>
      <div class="kpi-card"><div class="valor" style="color:var(--verde);">${validas}</div><div class="etiqueta">Válidas para importar</div></div>
      <div class="kpi-card alerta"><div class="valor">${conError}</div><div class="etiqueta">Con errores (se excluyen)</div></div>
    </div>
    <div class="toolbar">
      <button class="btn" onclick="confirmarImportacion()">Confirmar importación (${validas} filas)</button>
    </div>
    <table>
      <thead><tr>
        <th></th><th>Fila</th><th>RUT</th><th>Área</th><th>Tipo gestión</th><th>Ejecutivo</th><th>Errores</th>
      </tr></thead>
      <tbody>
        ${filasImportacion.map((f, idx) => `
          <tr style="${f.errores.length ? 'background:#fff3f3;' : ''}">
            <td><input type="checkbox" ${f.incluir ? 'checked' : ''} ${f.errores.length ? 'disabled' : ''} onchange="filasImportacion[${idx}].incluir = this.checked"></td>
            <td>${f.fila}</td>
            <td>${f.rut_paciente}</td>
            <td>${f.area || '—'}</td>
            <td>${f.tipo_gestion || '—'}</td>
            <td>${f.ejecutivo || '—'}</td>
            <td style="color:var(--rojo); font-size:11px;">${f.errores.join('; ') || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function confirmarImportacion() {
  const filasValidas = filasImportacion.filter(f => f.incluir && f.errores.length === 0);
  if (filasValidas.length === 0) { alert('No hay filas válidas seleccionadas para importar'); return; }

  if (!confirm(`Se importarán ${filasValidas.length} correos/casos nuevos. ¿Continuar?`)) return;

  const resultadoDiv = document.getElementById('resultadoImportacion');
  resultadoDiv.innerHTML = '<div class="cargando">Importando, por favor espera...</div>';

  const mapaArea = Object.fromEntries((catalogos.areas || []).map(a => [a.nombre.toUpperCase(), a.id_area]));
  const mapaTipo = Object.fromEntries((catalogos.tipos_gestion || []).map(t => [t.nombre.toUpperCase(), t.id_tipo_gestion]));
  const mapaPrioridad = Object.fromEntries((catalogos.prioridades || []).map(p => [p.nombre.toUpperCase(), p.id_prioridad]));

  let exitosos = 0;
  let fallidos = 0;

  for (const f of filasValidas) {
    try {
      const fechaRecepcion = f.fecha_hora_recepcion instanceof Date
        ? f.fecha_hora_recepcion.toISOString()
        : new Date().toISOString();

      await api('/correos', {
        method: 'POST',
        body: JSON.stringify({
          fecha_hora_recepcion: fechaRecepcion,
          id_area: mapaArea[f.area.toUpperCase()],
          id_tipo_gestion: mapaTipo[f.tipo_gestion.toUpperCase()],
          id_prioridad: mapaPrioridad[(f.prioridad || 'MEDIA').toUpperCase()] || mapaPrioridad['MEDIA'],
          observaciones: f.observaciones,
          casos: [{ rut_paciente: f.rut_paciente }]
        })
      });
      exitosos++;
    } catch (err) {
      fallidos++;
    }
  }

  resultadoDiv.innerHTML = `
    <p style="color:var(--verde); font-weight:600;">${exitosos} correos/casos importados correctamente.</p>
    ${fallidos > 0 ? `<p style="color:var(--rojo);">${fallidos} fallaron al importar (revisa la auditoría o intenta de nuevo).</p>` : ''}
    <button class="btn secundario" onclick="renderImportarInicial()">Importar otro archivo</button>
  `;
}

