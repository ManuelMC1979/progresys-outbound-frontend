/* ============================================================
   EJECUTIVOS — LISTA Y FICHA INDIVIDUAL
   ============================================================ */
let filtroAgrupacionEjecutivo = 'diario';

async function renderEjecutivos() {
  const ejecutivos = await api('/ejecutivos');
  const contenido = document.getElementById('contenido');

  // Si el usuario es EJECUTIVO, va directo a su propia ficha
  if (usuarioActual.rol === 'EJECUTIVO' && ejecutivos.length === 1) {
    return abrirFichaEjecutivo(ejecutivos[0].id_ejecutivo, ejecutivos[0].nombre);
  }

  contenido.innerHTML = `
    ${usuarioActual.rol === 'ADMINISTRADOR' ? `<div class="toolbar"><button class="btn" onclick="abrirModalNuevoEjecutivo()">+ Nuevo ejecutivo</button></div>` : ''}
    <table>
      <thead><tr><th>Ejecutivo</th><th>Servicio</th><th></th></tr></thead>
      <tbody>
        ${ejecutivos.map(e => `
          <tr>
            <td>${e.nombre}</td>
            <td>${e.servicio || '—'}</td>
            <td>
              <button class="btn secundario" onclick="abrirFichaEjecutivo('${e.id_ejecutivo}', '${e.nombre.replace(/'/g, "\\'")}')">Ver ficha</button>
              ${usuarioActual.rol === 'ADMINISTRADOR' ? `<button class="btn secundario" onclick='abrirModalEditarEjecutivo(${JSON.stringify(e)})'>Editar</button>` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function abrirFichaEjecutivo(idEjecutivo, nombre) {
  document.getElementById('tituloVista').textContent = `Ejecutivo: ${nombre}`;
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoFicha();

  const puedeVolver = !(usuarioActual.rol === 'EJECUTIVO');

  try {
    const params = new URLSearchParams({ agrupacion: filtroAgrupacionEjecutivo });
    const data = await api(`/ejecutivos/${idEjecutivo}/resumen?${params.toString()}`);
    const r = data.resumen;

    contenido.innerHTML = `
      ${puedeVolver ? `<button class="btn secundario" onclick="cargarVista('ejecutivos')" style="margin-bottom:16px;">← Volver</button>` : ''}

      <div class="kpis" style="margin-bottom:24px;">
        <div class="kpi-card"><div class="valor">${r.casos_asignados}</div><div class="etiqueta">Casos asignados</div></div>
        <div class="kpi-card"><div class="valor">${r.casos_cerrados}</div><div class="etiqueta">Casos cerrados</div></div>
        <div class="kpi-card"><div class="valor">${(r.contactabilidad_pct * 100).toFixed(0)}%</div><div class="etiqueta">Contactabilidad</div></div>
        <div class="kpi-card"><div class="valor">${r.total_llamadas}</div><div class="etiqueta">Llamadas totales</div></div>
        <div class="kpi-card"><div class="valor">${r.tiempo_prom_primera_gestion_min ?? '—'}</div><div class="etiqueta">Min. prom. 1ª gestión</div></div>
      </div>

      <div class="toolbar">
        <select id="selectAgrupacionEjecutivo" onchange="cambiarAgrupacionEjecutivo('${idEjecutivo}', '${nombre.replace(/'/g, "\\'")}', this.value)">
          <option value="diario" ${filtroAgrupacionEjecutivo === 'diario' ? 'selected' : ''}>Evolución diaria</option>
          <option value="semanal" ${filtroAgrupacionEjecutivo === 'semanal' ? 'selected' : ''}>Evolución semanal</option>
          <option value="mensual" ${filtroAgrupacionEjecutivo === 'mensual' ? 'selected' : ''}>Evolución mensual</option>
        </select>
      </div>
      <table>
        <thead><tr><th>Período</th><th>Casos recibidos</th><th>Cerrados</th><th>Contactados</th></tr></thead>
        <tbody>
          ${data.evolucion.map(e => `
            <tr><td>${e.periodo}</td><td>${e.casos_recibidos}</td><td>${e.casos_cerrados}</td><td>${e.contactados}</td></tr>
          `).join('')}
        </tbody>
      </table>
      ${data.evolucion.length === 0 ? '<p style="margin-top:16px;color:#999;">Sin datos para este ejecutivo aún.</p>' : ''}
    `;
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
  }
}

function cambiarAgrupacionEjecutivo(idEjecutivo, nombre, valor) {
  filtroAgrupacionEjecutivo = valor;
  abrirFichaEjecutivo(idEjecutivo, nombre);
}

