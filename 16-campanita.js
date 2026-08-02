/* ============================================================
   CAMPANITA DE ALERTAS (combina Outbound + Reagendamiento)
   ============================================================ */
let idsAlertasVistas = new Set();
let intervalPollingAlertas = null;

async function cargarAlertasCombinadas() {
  try {
    const [outbound, reag] = await Promise.all([
      api('/alertas?estado=ACTIVA'),
      api('/reagendamiento/alertas')
    ]);

    const iconoTipo = {
      SLA_VENCIDO: '🔴', SLA_PROXIMO: '🟡', EXCESO_INTENTOS: '📞'
    };

    const combinadas = [
      ...outbound.map(a => ({
        id: `out-${a.id_alerta}`, origen: 'OUTBOUND', tipo: a.tipo,
        titulo: a.tipo.replace('_', ' '), detalle: a.mensaje, fecha: a.fecha_creacion,
        icono: iconoTipo[a.tipo] || '⚠️'
      })),
      ...reag.map(a => ({
        id: `reag-${a.id_referencia}-${a.tipo}`, origen: 'REAGENDAMIENTO', tipo: a.tipo,
        titulo: a.tipo.replace('_', ' '), detalle: a.mensaje, fecha: a.fecha,
        icono: iconoTipo[a.tipo] || '⚠️', id_referencia: a.id_referencia
      }))
    ];

    // Detectar alertas nuevas (no vistas en el ciclo anterior) para mostrar toast
    combinadas.forEach(a => {
      if (!idsAlertasVistas.has(a.id)) {
        mostrarToast(a);
      }
    });
    idsAlertasVistas = new Set(combinadas.map(a => a.id));

    renderPanelAlertasGlobal(combinadas);
  } catch (err) {
    console.error('No se pudieron cargar las alertas', err);
  }
}

function renderPanelAlertasGlobal(alertas) {
  const badge = document.getElementById('contadorBadgeAlertas');
  badge.textContent = alertas.length;
  badge.style.display = alertas.length > 0 ? 'flex' : 'none';

  const lista = document.getElementById('listaAlertasGlobal');
  if (alertas.length === 0) {
    lista.innerHTML = '<div class="sin-alertas">No tienes alertas activas 🎉</div>';
    return;
  }
  lista.innerHTML = alertas.map(a => `
    <div class="item-alerta" onclick='irAAlerta(${JSON.stringify(a)})'>
      <div class="icono">${a.icono}</div>
      <div>
        <div class="titulo">${a.titulo}</div>
        <div class="detalle">${a.detalle}</div>
        <div class="origen">${a.origen}</div>
      </div>
    </div>
  `).join('');
}

function alternarPanelAlertas() {
  document.getElementById('panelAlertasGlobal').classList.toggle('abierto');
}

document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.campana-wrap');
  const panel = document.getElementById('panelAlertasGlobal');
  if (wrap && panel && !wrap.contains(e.target)) panel.classList.remove('abierto');
});

function mostrarToast(alerta) {
  const container = document.getElementById('toastContainer');
  const clase = alerta.tipo === 'SLA_VENCIDO' ? 'rojo' : '';
  const toast = document.createElement('div');
  toast.className = `toast ${clase}`;
  toast.innerHTML = `
    <div class="icono">${alerta.icono}</div>
    <div>
      <div class="titulo">${alerta.titulo} <span style="color:var(--turquesa); font-size:10px;">· ${alerta.origen}</span></div>
      <div class="detalle">${alerta.detalle}</div>
    </div>
    <button class="cerrar" onclick="this.closest('.toast').remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 7000);
}

function irAAlerta(alerta) {
  document.getElementById('panelAlertasGlobal').classList.remove('abierto');
  document.querySelectorAll('.sidebar nav button').forEach(b => b.classList.remove('activo'));
  if (alerta.origen === 'REAGENDAMIENTO' && alerta.id_referencia) {
    document.getElementById('btnReagendamiento').classList.add('activo');
    abrirReagDetalle(alerta.id_referencia);
  } else {
    document.getElementById('btnAlertas').classList.add('activo');
    cargarVista('alertas');
  }
}

function iniciarPollingAlertas() {
  cargarAlertasCombinadas();
  if (intervalPollingAlertas) clearInterval(intervalPollingAlertas);
  intervalPollingAlertas = setInterval(cargarAlertasCombinadas, 30000); // cada 30 segundos
}

