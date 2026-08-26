/* ============================================================
   CHECK LIST OUT-BOT — REGISTRO DE CORREOS
   ============================================================ */
let checklistOutbotData = [];

async function renderChecklistOutbot() {
  const contenido = document.getElementById('contenido');
  checklistOutbotData = await api('/checklist-outbot');

  contenido.innerHTML = `
    <div class="toolbar">
      <button class="btn" onclick="abrirModalNuevoChecklistOutbot()">+ Nuevo registro</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Fecha llegada correo</th>
          <th>Cantidad de RUT</th>
          <th>Fecha respuesta correo</th>
          <th>Asunto del correo</th>
          <th>Área que solicita</th>
          <th>Notas</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${checklistOutbotData.map(r => `
          <tr>
            <td>${formatearFechaCorta(r.fecha_llegada_correo)}</td>
            <td>${r.cantidad_rut}</td>
            <td>${formatearFechaCorta(r.fecha_respuesta_correo)}</td>
            <td>${r.asunto_correo || '—'}</td>
            <td>${r.area || '—'}</td>
            <td>${r.notas || ''}</td>
            <td><button class="btn secundario" onclick="eliminarChecklistOutbot('${r.id_checklist_outbot}')">Eliminar</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${checklistOutbotData.length === 0 ? '<p style="margin-top:16px;color:#999;">No hay registros aún.</p>' : ''}
  `;
}

async function eliminarChecklistOutbot(id) {
  if (!confirm('¿Eliminar este registro del checklist?')) return;
  try {
    await api(`/checklist-outbot/${id}`, { method: 'DELETE' });
    renderChecklistOutbot();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirModalNuevoChecklistOutbot() {
  if (!catalogos) { alert('Aún se están cargando los catálogos, intenta de nuevo en un segundo.'); return; }

  document.getElementById('ckoFechaCorreo').value = new Date().toISOString().slice(0, 10);
  document.getElementById('ckoCantidadRut').value = '';
  document.getElementById('ckoFechaRespuesta').value = '';
  document.getElementById('ckoAsunto').value = '';
  document.getElementById('ckoArea').innerHTML = catalogos.areas.map(a => `<option value="${a.id_area}">${a.nombre}</option>`).join('');
  document.getElementById('ckoNotas').value = '';
  document.getElementById('modalNuevoChecklistOutbot').classList.add('activo');
}

async function guardarChecklistOutbot() {
  const fechaCorreo = document.getElementById('ckoFechaCorreo').value;
  const cantidadRut = document.getElementById('ckoCantidadRut').value;
  const asunto = document.getElementById('ckoAsunto').value.trim();
  if (!fechaCorreo) { alert('La fecha de llegada del correo es obligatoria'); return; }
  if (!cantidadRut) { alert('La cantidad de RUT es obligatoria'); return; }
  if (!asunto) { alert('El asunto del correo es obligatorio'); return; }

  const body = {
    fecha_llegada_correo: fechaCorreo,
    cantidad_rut: Number(cantidadRut),
    fecha_respuesta_correo: document.getElementById('ckoFechaRespuesta').value || undefined,
    asunto_correo: asunto,
    id_area: Number(document.getElementById('ckoArea').value),
    notas: document.getElementById('ckoNotas').value.trim() || undefined
  };

  try {
    await api('/checklist-outbot', { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalNuevoChecklistOutbot');
    renderChecklistOutbot();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
