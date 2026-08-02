/* ============================================================
   ALERTAS
   ============================================================ */
let filtroEstadoAlertas = 'ACTIVA';

async function renderAlertas() {
  const alertas = await api(`/alertas?estado=${filtroEstadoAlertas}`);
  const contenido = document.getElementById('contenido');

  contenido.innerHTML = `
    <div class="toolbar">
      <select id="filtroAlertas" onchange="cambiarFiltroAlertas(this.value)">
        <option value="ACTIVA" ${filtroEstadoAlertas === 'ACTIVA' ? 'selected' : ''}>Activas</option>
        <option value="RESUELTA" ${filtroEstadoAlertas === 'RESUELTA' ? 'selected' : ''}>Resueltas</option>
      </select>
    </div>
    <table>
      <thead><tr>
        <th>Tipo</th><th>Prioridad</th><th>Mensaje</th><th>Caso</th><th>Ejecutivo</th>
        <th>Fecha</th>${filtroEstadoAlertas === 'ACTIVA' ? '<th></th>' : ''}
      </tr></thead>
      <tbody>
        ${alertas.map(a => `
          <tr>
            <td>${a.tipo}</td>
            <td>${a.prioridad}</td>
            <td>${a.mensaje}</td>
            <td>${a.folio_caso || a.rut_paciente || '—'}</td>
            <td>${a.ejecutivo || '—'}</td>
            <td>${formatFecha(a.fecha_creacion)}</td>
            ${filtroEstadoAlertas === 'ACTIVA' ? `<td><button class="btn secundario" onclick="resolverAlerta('${a.id_alerta}')">Resolver</button></td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${alertas.length === 0 ? `<p style="margin-top:16px;color:#999;">No hay alertas ${filtroEstadoAlertas === 'ACTIVA' ? 'activas' : 'resueltas'}.</p>` : ''}
  `;
}

function cambiarFiltroAlertas(valor) {
  filtroEstadoAlertas = valor;
  renderAlertas();
}

async function resolverAlerta(idAlerta) {
  try {
    await api(`/alertas/${idAlerta}/resolver`, { method: 'POST' });
    renderAlertas();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

