/* ============================================================
   CAMPANITA DE ALERTAS (combina Outbound + Reagendamiento)
   ============================================================ */
let intervalPollingAlertas = null;

async function obtenerAlertasCombinadas() {
  const [outbound, reag] = await Promise.all([
    api('/alertas?estado=ACTIVA'),
    api('/reagendamiento/alertas')
  ]);

  return [
    ...outbound.map(a => ({
      id: `out-${a.id_alerta}`, origen: 'OUTBOUND', tipo: a.tipo,
      titulo: a.tipo.replace('_', ' '), detalle: a.mensaje, fecha: a.fecha_creacion
    })),
    ...reag.map(a => ({
      id: `reag-${a.id_referencia}-${a.tipo}`, origen: 'REAGENDAMIENTO', tipo: a.tipo,
      titulo: a.tipo.replace('_', ' '), detalle: a.mensaje, fecha: a.fecha,
      id_referencia: a.id_referencia
    }))
  ];
}

async function cargarAlertasCombinadas() {
  try {
    const combinadas = await obtenerAlertasCombinadas();
    actualizarBadgeAlertas(combinadas.length);
  } catch (err) {
    console.error('No se pudieron cargar las alertas', err);
  }
}

function actualizarBadgeAlertas(cantidad) {
  const badge = document.getElementById('contadorBadgeAlertas');
  badge.textContent = cantidad;
  badge.style.display = cantidad > 0 ? 'flex' : 'none';
}

function irAVistaAlertas() {
  activarVista('btnAlertas');
}

function irAAlerta(alerta) {
  if (alerta.origen === 'REAGENDAMIENTO' && alerta.id_referencia) {
    marcarBotonActivo('btnReagendamiento');
    abrirReagDetalle(alerta.id_referencia);
  } else {
    activarVista('btnAlertas');
  }
}

function iniciarPollingAlertas() {
  cargarAlertasCombinadas();
  if (intervalPollingAlertas) clearInterval(intervalPollingAlertas);
  intervalPollingAlertas = setInterval(cargarAlertasCombinadas, 30000); // cada 30 segundos, solo actualiza el contador
}
