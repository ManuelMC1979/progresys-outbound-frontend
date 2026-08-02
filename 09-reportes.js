/* ============================================================
   REPORTES
   ============================================================ */
let filtroReporte = { tipo: 'diario', desde: '', hasta: '' };
let reporteActual = null;

async function renderReportes() {
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = `
    <div class="toolbar">
      <select id="repTipo" onchange="cambiarTipoReporte(this.value)">
        <option value="diario" ${filtroReporte.tipo === 'diario' ? 'selected' : ''}>Diario</option>
        <option value="semanal" ${filtroReporte.tipo === 'semanal' ? 'selected' : ''}>Semanal</option>
        <option value="ejecutivo" ${filtroReporte.tipo === 'ejecutivo' ? 'selected' : ''}>Por ejecutivo</option>
        <option value="area" ${filtroReporte.tipo === 'area' ? 'selected' : ''}>Por área</option>
      </select>
      <input type="date" id="repDesde" value="${filtroReporte.desde}">
      <input type="date" id="repHasta" value="${filtroReporte.hasta}">
      <button class="btn secundario" onclick="aplicarFiltroReporte()">Filtrar</button>
      <button class="btn" onclick="exportarReporteCSV()">Exportar CSV</button>
    </div>
    <div id="tablaReporte"><div class="cargando">Cargando...</div></div>
  `;
  await cargarReporte();
}

function cambiarTipoReporte(valor) {
  filtroReporte.tipo = valor;
  cargarReporte();
}

function aplicarFiltroReporte() {
  filtroReporte.desde = document.getElementById('repDesde').value;
  filtroReporte.hasta = document.getElementById('repHasta').value;
  cargarReporte();
}

async function cargarReporte() {
  const params = new URLSearchParams({ tipo: filtroReporte.tipo });
  if (filtroReporte.desde) params.set('desde', filtroReporte.desde);
  if (filtroReporte.hasta) params.set('hasta', filtroReporte.hasta);

  const data = await api(`/reportes?${params.toString()}`);
  reporteActual = data;

  const etiquetaPeriodo = { diario: 'Día', semanal: 'Semana', ejecutivo: 'Ejecutivo', area: 'Área' }[data.tipo];
  const mostrarLlamadas = data.tipo === 'ejecutivo';

  document.getElementById('tablaReporte').innerHTML = `
    <table>
      <thead><tr>
        <th>${etiquetaPeriodo}</th><th>Casos recibidos</th><th>Cerrados</th>
        <th>Contactados</th><th>Contactabilidad</th>
        ${mostrarLlamadas ? '<th>Llamadas totales</th>' : ''}
        <th>Min. prom. 1ª gestión</th>
      </tr></thead>
      <tbody>
        ${data.filas.map(f => `
          <tr>
            <td>${f.periodo}</td>
            <td>${f.casos_recibidos}</td>
            <td>${f.casos_cerrados}</td>
            <td>${f.contactados}</td>
            <td>${(f.contactabilidad_pct * 100).toFixed(0)}%</td>
            ${mostrarLlamadas ? `<td>${f.total_llamadas ?? '—'}</td>` : ''}
            <td>${f.tiempo_prom_primera_gestion_min ?? '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${data.filas.length === 0 ? '<p style="margin-top:16px;color:#999;">No hay datos para este período.</p>' : ''}
  `;
}

function exportarReporteCSV() {
  if (!reporteActual || reporteActual.filas.length === 0) { alert('No hay datos para exportar'); return; }

  const mostrarLlamadas = reporteActual.tipo === 'ejecutivo';
  const encabezados = ['Periodo', 'Casos recibidos', 'Cerrados', 'Contactados', 'Contactabilidad %']
    .concat(mostrarLlamadas ? ['Llamadas totales'] : [])
    .concat(['Min prom 1a gestion']);

  const filasCSV = reporteActual.filas.map(f => [
    f.periodo, f.casos_recibidos, f.casos_cerrados, f.contactados,
    (f.contactabilidad_pct * 100).toFixed(0),
    ...(mostrarLlamadas ? [f.total_llamadas ?? ''] : []),
    f.tiempo_prom_primera_gestion_min ?? ''
  ]);

  const csv = [encabezados, ...filasCSV]
    .map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_${reporteActual.tipo}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

