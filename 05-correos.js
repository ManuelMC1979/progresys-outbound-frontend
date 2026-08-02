/* ============================================================
   CORREOS
   ============================================================ */
async function renderCorreos() {
  const correos = await api('/correos');
  const contenido = document.getElementById('contenido');
  const puedeAsignar = usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';
  const puedeCrear = puedeAsignar;

  contenido.innerHTML = `
    ${puedeCrear ? `<div class="toolbar"><button class="btn" onclick="abrirModalNuevoCorreo()">+ Nuevo correo</button></div>` : ''}
    <table>
      <thead><tr>
        <th>Folio</th><th>Recepción</th><th>Área</th><th>Tipo</th><th>Casos</th>
        <th>Ejecutivo</th><th>Fecha límite</th><th>Estado</th>${puedeAsignar ? '<th></th>' : ''}
      </tr></thead>
      <tbody>
        ${correos.map(c => `
          <tr>
            <td>${c.folio || '—'}</td>
            <td>${formatFecha(c.fecha_hora_recepcion)}</td>
            <td>${c.area || '—'}</td>
            <td>${c.tipo_gestion || '—'}</td>
            <td>${c.cantidad_casos}</td>
            <td>${c.ejecutivo_asignado || '<em>Sin asignar</em>'}</td>
            <td>${formatFecha(c.fecha_limite_gestion)}</td>
            <td>${badgeEstado(c.estado)}</td>
            ${puedeAsignar ? `<td><button class="btn secundario" onclick="abrirModalAsignar('${c.id_correo}')">Asignar</button></td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${correos.length === 0 ? '<p style="margin-top:16px;color:#999;">No hay correos registrados aún.</p>' : ''}
  `;
}

function abrirModalAsignar(idCorreo) {
  document.getElementById('asignarIdCorreo').value = idCorreo;
  const select = document.getElementById('asignarIdEjecutivo');
  const ejecutivos = catalogos?.ejecutivos || [];
  select.innerHTML = ejecutivos.length
    ? ejecutivos.map(e => `<option value="${e.id_ejecutivo}">${e.nombre}</option>`).join('')
    : '<option value="">No hay ejecutivos disponibles</option>';
  document.getElementById('modalAsignar').classList.add('activo');
}

async function guardarAsignacion() {
  const idCorreo = document.getElementById('asignarIdCorreo').value;
  const idEjecutivo = document.getElementById('asignarIdEjecutivo').value;
  if (!idEjecutivo) { alert('Selecciona un ejecutivo'); return; }
  try {
    await api(`/correos/${idCorreo}/asignar`, {
      method: 'POST',
      body: JSON.stringify({ id_ejecutivo: idEjecutivo })
    });
    cerrarModal('modalAsignar');
    renderCorreos();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* ============================================================
   NUEVO CORREO + CASOS
   ============================================================ */
function abrirModalNuevoCorreo() {
  if (!catalogos) { alert('Aún se están cargando los catálogos, intenta de nuevo en un segundo.'); return; }

  document.getElementById('ncFechaHora').value = new Date().toISOString().slice(0,16);
  document.getElementById('ncArea').innerHTML = catalogos.areas.map(a => `<option value="${a.id_area}">${a.nombre}</option>`).join('');
  document.getElementById('ncTipoGestion').innerHTML = catalogos.tipos_gestion.map(t => `<option value="${t.id_tipo_gestion}">${t.nombre}</option>`).join('');
  document.getElementById('ncPrioridad').innerHTML = catalogos.prioridades.map(p => `<option value="${p.id_prioridad}">${p.nombre}</option>`).join('');
  document.getElementById('ncRemitente').value = '';
  document.getElementById('ncAsunto').value = '';
  document.getElementById('ncObservaciones').value = '';

  document.getElementById('ncListaCasos').innerHTML = '';
  agregarFilaCaso();
  document.getElementById('ncRutsMasivo').value = '';
  cambiarModoRutNC('uno');

  document.getElementById('modalNuevoCorreo').classList.add('activo');
}

let modoRutNC = 'uno';
function cambiarModoRutNC(modo) {
  modoRutNC = modo;
  document.getElementById('modoUnoNC').style.display = modo === 'uno' ? 'block' : 'none';
  document.getElementById('modoMasivoNC').style.display = modo === 'masivo' ? 'block' : 'none';
  document.getElementById('btnModoUno').style.background = modo === 'uno' ? 'var(--turquesa)' : '#eee';
  document.getElementById('btnModoUno').style.color = modo === 'uno' ? 'white' : 'var(--gris-oscuro)';
  document.getElementById('btnModoMasivo').style.background = modo === 'masivo' ? 'var(--turquesa)' : '#eee';
  document.getElementById('btnModoMasivo').style.color = modo === 'masivo' ? 'white' : 'var(--gris-oscuro)';
}

function agregarFilaCaso() {
  const lista = document.getElementById('ncListaCasos');
  const fila = document.createElement('div');
  fila.style.cssText = 'display:flex; gap:6px; margin-bottom:6px; align-items:center;';
  fila.innerHTML = `
    <input type="text" class="rut-caso" placeholder="RUT (ej: 12.345.678-9)" style="flex:1;">
    <button type="button" class="btn secundario" onclick="this.parentElement.remove()" style="padding:6px 10px;">✕</button>
  `;
  lista.appendChild(fila);
}

async function guardarNuevoCorreo() {
  let ruts = [];
  if (modoRutNC === 'uno') {
    ruts = Array.from(document.querySelectorAll('.rut-caso'))
      .map(i => i.value.trim())
      .filter(Boolean);
  } else {
    const texto = document.getElementById('ncRutsMasivo').value;
    ruts = texto.split(/[\n,;\s]+/).map(r => r.trim()).filter(Boolean);
    // quitar duplicados manteniendo el orden
    ruts = [...new Set(ruts)];
  }

  if (ruts.length === 0) { alert('Agrega al menos un RUT'); return; }

  const body = {
    fecha_hora_recepcion: new Date(document.getElementById('ncFechaHora').value).toISOString(),
    id_area: Number(document.getElementById('ncArea').value),
    id_tipo_gestion: Number(document.getElementById('ncTipoGestion').value),
    id_prioridad: Number(document.getElementById('ncPrioridad').value),
    remitente: document.getElementById('ncRemitente').value,
    asunto: document.getElementById('ncAsunto').value,
    observaciones: document.getElementById('ncObservaciones').value,
    casos: ruts.map(rut => ({ rut_paciente: rut }))
  };

  try {
    await api('/correos', { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalNuevoCorreo');
    renderCorreos();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

