/* ============================================================
   UTILIDADES
   ============================================================ */
function cerrarModal(id) {
  document.getElementById(id).classList.remove('activo');
}

function formatFecha(f) {
  if (!f) return '—';
  const d = new Date(f);
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function badgeEstado(estado) {
  if (!estado) return '—';
  const e = estado.toUpperCase();
  let clase = 'pendiente';
  if (e.includes('GESTIONADO')) clase = 'gestionado';
  else if (e.includes('GESTIÓN')) clase = 'gestion';
  else if (e.includes('CERRADO')) clase = 'cerrado';
  return `<span class="badge ${clase}">${estado}</span>`;
}

// Si ya había sesión guardada, entra directo (al final del script, cuando todo ya está definido)
if (token && usuarioActual) mostrarApp();
