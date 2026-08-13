/* ============================================================
   ALERTAS
   ============================================================ */
let filtroEstadoAlertas = 'ACTIVA';

async function renderAlertas() {
  const contenido = document.getElementById('contenido');
  const [outbound, reag] = await Promise.all([
    api(`/alertas?estado=${filtroEstadoAlertas}`),
    filtroEstadoAlertas === 'ACTIVA' ? api('/reagendamiento/alertas') : Promise.resolve([])
  ]);

  const alertas = [
    ...outbound.map(a => ({ ...a, _origen: 'OUTBOUND' })),
    ...reag.map(a => ({ ...a, _origen: 'REAGENDAMIENTO', fecha_creacion: a.fecha }))
  ].sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

  contenido.innerHTML = `
    <div class="toolbar">
      <select id="filtroAlertas" onchange="cambiarFiltroAlertas(this.value)">
        <option value="ACTIVA" ${filtroEstadoAlertas === 'ACTIVA' ? 'selected' : ''}>Activas</option>
        <option value="RESUELTA" ${filtroEstadoAlertas === 'RESUELTA' ? 'selected' : ''}>Resueltas</option>
      </select>
    </div>
    <table>
      <thead><tr>
        <th>Origen</th><th>Tipo</th><th>Prioridad</th><th>Mensaje</th><th>Caso</th><th>Ejecutivo</th>
        <th>Fecha</th><th></th>
      </tr></thead>
      <tbody>
        ${alertas.map(a => a._origen === 'REAGENDAMIENTO' ? `
          <tr style="cursor:pointer;" onclick='irAAlerta(${JSON.stringify({ origen: 'REAGENDAMIENTO', id_referencia: a.id_referencia })})'>
            <td><span class="badge celeste">REAGENDAMIENTO</span></td>
            <td>${a.tipo}</td>
            <td>—</td>
            <td>${a.mensaje}</td>
            <td>${a.id_referencia || '—'}</td>
            <td>—</td>
            <td>${formatFecha(a.fecha_creacion)}</td>
            <td><button class="btn secundario" onclick="event.stopPropagation(); irAAlerta({origen:'REAGENDAMIENTO', id_referencia:'${a.id_referencia}'})">Ver</button></td>
          </tr>
        ` : `
          <tr>
            <td><span class="badge gestion">OUTBOUND</span></td>
            <td>${a.tipo}</td>
            <td>${a.prioridad}</td>
            <td>${a.mensaje}</td>
            <td>${a.folio_caso || a.rut_paciente || '—'}</td>
            <td>${a.ejecutivo || '—'}</td>
            <td>${formatFecha(a.fecha_creacion)}</td>
            <td>${filtroEstadoAlertas === 'ACTIVA' ? `<button class="btn secundario" onclick="resolverAlerta('${a.id_alerta}')">Resolver</button>` : ''}</td>
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

