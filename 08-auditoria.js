/* ============================================================
   AUDITORÍA
   ============================================================ */
let filtroModuloAuditoria = '';

async function renderAuditoria() {
  const modulos = await api('/auditoria/modulos');
  const registros = await api(`/auditoria${filtroModuloAuditoria ? '?modulo=' + filtroModuloAuditoria : ''}`);
  const contenido = document.getElementById('contenido');

  contenido.innerHTML = `
    <div class="toolbar">
      <select id="filtroModuloAuditoria" onchange="cambiarFiltroAuditoria(this.value)">
        <option value="">Todos los módulos</option>
        ${modulos.map(m => `<option value="${m}" ${filtroModuloAuditoria === m ? 'selected' : ''}>${m}</option>`).join('')}
      </select>
      <span style="color:#999; font-size:12px;">Mostrando los últimos ${registros.length} registros</span>
    </div>
    <table>
      <thead><tr>
        <th>Fecha/Hora</th><th>Usuario</th><th>Módulo</th><th>Acción</th><th>Registro afectado</th>
      </tr></thead>
      <tbody>
        ${registros.map(r => `
          <tr>
            <td>${formatFecha(r.fecha_hora)}</td>
            <td>${r.usuario_nombre ? `${r.usuario_nombre} ${r.usuario_apellido}` : '—'}</td>
            <td>${r.modulo}</td>
            <td>${r.accion}</td>
            <td style="font-family:monospace; font-size:11px;">${(r.id_registro_afectado || '—').toString().slice(0,8)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${registros.length === 0 ? '<p style="margin-top:16px;color:#999;">No hay registros de auditoría.</p>' : ''}
  `;
}

function cambiarFiltroAuditoria(valor) {
  filtroModuloAuditoria = valor;
  renderAuditoria();
}

