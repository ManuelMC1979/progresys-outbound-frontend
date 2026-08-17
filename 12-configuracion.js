/* ============================================================
   CONFIGURACIÓN DE PARÁMETROS SLA
   ============================================================ */
const etiquetasParametros = {
  jornada_inicio: 'Hora de inicio de jornada',
  jornada_fin: 'Hora de término de jornada',
  sla_1_rut_minutos: 'SLA primera gestión — casos de 1 RUT (minutos)',
  umbral_proximo_vencer_min: 'Umbral de aviso "próximo a vencer" (minutos)',
  intentos_minimos: 'Cantidad mínima de intentos antes de generar alerta',
  avance_minimo_multi_rut: '% de avance mínimo esperado (correos multi-RUT)',
  corte_ultima_hora: 'Corte de "última hora" de recepción'
};

async function renderConfiguracion() {
  const parametros = await api('/parametros');
  const contenido = document.getElementById('contenido');

  contenido.innerHTML = `
    <p style="color:#555; max-width:600px; margin-bottom:16px;">
      Estos parámetros controlan el cálculo automático de SLA y las alertas del sistema.
      Solo el Administrador puede modificarlos.
    </p>
    <table>
      <thead><tr><th>Parámetro</th><th>Valor actual</th><th>Última actualización</th><th></th></tr></thead>
      <tbody>
        ${parametros.map(p => `
          <tr>
            <td>${etiquetasParametros[p.clave] || p.clave}</td>
            <td><input type="text" id="param_${p.clave}" value="${p.valor}" style="width:100px; padding:4px 8px; border:1px solid #ccc; border-radius:4px;"></td>
            <td style="font-size:12px; color:#888;">${formatFecha(p.fecha_actualizacion)}</td>
            <td><button class="btn secundario" onclick="guardarParametro('${p.clave}')">Guardar</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function guardarParametro(clave) {
  const valor = document.getElementById(`param_${clave}`).value.trim();
  if (!valor) { alert('El valor no puede estar vacío'); return; }
  try {
    await api(`/parametros/${clave}`, { method: 'PUT', body: JSON.stringify({ valor }) });
    renderConfiguracion();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirModalNuevoEjecutivo() {
  document.getElementById('neNombre').value = '';
  document.getElementById('neRut').value = '';
  document.getElementById('neEmail').value = '';
  document.getElementById('neServicio').value = '';
  document.getElementById('modalNuevoEjecutivo').classList.add('activo');
}

async function guardarNuevoEjecutivo() {
  const body = {
    nombre: document.getElementById('neNombre').value.trim(),
    rut: document.getElementById('neRut').value.trim() || undefined,
    email: document.getElementById('neEmail').value.trim() || undefined,
    servicio: document.getElementById('neServicio').value
  };
  if (!body.nombre) { alert('El nombre es obligatorio'); return; }
  if (!body.servicio) { alert('Selecciona el servicio del ejecutivo'); return; }
  try {
    await api('/ejecutivos', { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalNuevoEjecutivo');
    await cargarCatalogos(); // refresca la lista de ejecutivos disponible en toda la app
    renderEjecutivos();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirModalEditarEjecutivo(e) {
  document.getElementById('eeId').value = e.id_ejecutivo;
  document.getElementById('eeNombre').value = e.nombre || '';
  document.getElementById('eeRut').value = e.rut || '';
  document.getElementById('eeEmail').value = e.email || '';
  document.getElementById('eeServicio').value = e.servicio || '';
  document.getElementById('modalEditarEjecutivo').classList.add('activo');
}

async function guardarEditarEjecutivo() {
  const id = document.getElementById('eeId').value;
  const body = {
    nombre: document.getElementById('eeNombre').value.trim(),
    rut: document.getElementById('eeRut').value.trim() || undefined,
    email: document.getElementById('eeEmail').value.trim() || undefined,
    servicio: document.getElementById('eeServicio').value
  };
  if (!body.nombre) { alert('El nombre es obligatorio'); return; }
  if (!body.servicio) { alert('Selecciona el servicio del ejecutivo'); return; }
  try {
    await api(`/ejecutivos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    cerrarModal('modalEditarEjecutivo');
    await cargarCatalogos();
    renderEjecutivos();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

