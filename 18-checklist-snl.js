/* ============================================================
   CHECK LIST SNL — REGISTRO DIARIO DE CONTROL
   ============================================================ */
let checklistSnlData = [];

function checklistSnlCompletadas(r) {
  return [r.check_citas, r.check_print, r.check_respondio, r.check_correo_1830].filter(Boolean).length;
}

function badgeAlertaChecklistSnl(r) {
  const completadas = checklistSnlCompletadas(r);
  if (completadas === 4) {
    return `<span style="color:#2ecc71; font-weight:600;">✓ Todo listo</span>`;
  }

  const limiteSla = new Date(r.fecha).getTime() + 24 * 60 * 60 * 1000;
  const dentroDePlazo = Date.now() <= limiteSla;

  return dentroDePlazo
    ? `<span style="color:#f0ad4e; font-weight:600;">En Proceso</span>`
    : `<span style="color:#d9534f; font-weight:600;">⚠ Hay pendientes</span>`;
}

async function renderChecklistSnl() {
  const contenido = document.getElementById('contenido');
  checklistSnlData = await api('/checklist-snl');

  contenido.innerHTML = `
    <div class="toolbar">
      <button class="btn" onclick="abrirModalNuevoChecklistSnl()">+ Nuevo registro</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Profesional</th>
          <th>Ejecutivo a cargo</th>
          <th>Bloqueo</th>
          <th>Citas bloqueadas</th>
          <th>Print + respaldo</th>
          <th>Respondió correo</th>
          <th>Correo 18:30</th>
          <th>Alerta</th>
          <th>Completadas</th>
          <th>Notas</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${checklistSnlData.map(r => `
          <tr>
            <td>${formatearFechaCorta(r.fecha)}</td>
            <td>${r.profesional}</td>
            <td>${r.ejecutivo_cargo || '—'}</td>
            <td>${formatearFechaCorta(r.fecha_inicio_bloqueo)} — ${formatearFechaCorta(r.fecha_fin_bloqueo)}</td>
            <td>${checklistSnlCheckboxHtml(r.id_checklist_snl, 'checkCitas', r.check_citas)}</td>
            <td>${checklistSnlCheckboxHtml(r.id_checklist_snl, 'checkPrint', r.check_print)}</td>
            <td>${checklistSnlCheckboxHtml(r.id_checklist_snl, 'checkRespondio', r.check_respondio)}</td>
            <td>${checklistSnlCheckboxHtml(r.id_checklist_snl, 'checkCorreo1830', r.check_correo_1830)}</td>
            <td>${badgeAlertaChecklistSnl(r)}</td>
            <td>${checklistSnlCompletadas(r)} / 4</td>
            <td>${r.notas || ''}</td>
            <td><button class="btn secundario" onclick="eliminarChecklistSnl('${r.id_checklist_snl}')">Eliminar</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function checklistSnlCheckboxHtml(id, campo, valor) {
  return `<input type="checkbox" ${valor ? 'checked' : ''} onchange="toggleCheckChecklistSnl('${id}', '${campo}', this.checked)">`;
}

function formatearFechaCorta(fechaIso) {
  if (!fechaIso) return '—';
  const [anio, mes, dia] = fechaIso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio.slice(2)}`;
}

async function toggleCheckChecklistSnl(id, campo, valor) {
  try {
    await api(`/checklist-snl/${id}/check`, { method: 'PATCH', body: JSON.stringify({ campo, valor }) });
    renderChecklistSnl();
  } catch (err) {
    alert('Error: ' + err.message);
    renderChecklistSnl();
  }
}

async function eliminarChecklistSnl(id) {
  if (!confirm('¿Eliminar este registro del checklist?')) return;
  try {
    await api(`/checklist-snl/${id}`, { method: 'DELETE' });
    renderChecklistSnl();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirModalNuevoChecklistSnl() {
  document.getElementById('cksnlFecha').value = new Date().toISOString().slice(0, 10);
  document.getElementById('cksnlProfesional').value = '';
  document.getElementById('cksnlEjecutivo').value = '';
  document.getElementById('cksnlFechaInicio').value = '';
  document.getElementById('cksnlFechaFin').value = '';
  document.getElementById('cksnlCheckCitas').checked = false;
  document.getElementById('cksnlCheckPrint').checked = false;
  document.getElementById('cksnlCheckRespondio').checked = false;
  document.getElementById('cksnlCheckCorreo1830').checked = false;
  document.getElementById('cksnlNotas').value = '';
  document.getElementById('modalNuevoChecklistSnl').classList.add('activo');
}

async function guardarChecklistSnl() {
  const fecha = document.getElementById('cksnlFecha').value;
  const profesional = document.getElementById('cksnlProfesional').value.trim();
  if (!fecha) { alert('La fecha es obligatoria'); return; }
  if (!profesional) { alert('El profesional es obligatorio'); return; }

  const body = {
    fecha,
    profesional,
    ejecutivo: document.getElementById('cksnlEjecutivo').value.trim() || undefined,
    fechaInicioBloqueo: document.getElementById('cksnlFechaInicio').value || undefined,
    fechaFinBloqueo: document.getElementById('cksnlFechaFin').value || undefined,
    checkCitas: document.getElementById('cksnlCheckCitas').checked,
    checkPrint: document.getElementById('cksnlCheckPrint').checked,
    checkRespondio: document.getElementById('cksnlCheckRespondio').checked,
    checkCorreo1830: document.getElementById('cksnlCheckCorreo1830').checked,
    notas: document.getElementById('cksnlNotas').value.trim() || undefined
  };

  try {
    await api('/checklist-snl', { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalNuevoChecklistSnl');
    renderChecklistSnl();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
