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

/* ============================================================
   ESTADOS DE CARGA (SKELETON) — se muestran mientras se
   esperan los datos, para no dejar paneles vacíos
   ============================================================ */
function esqueletoKPIs(n = 8) {
  const tarjetas = Array.from({ length: n }).map(() => `
    <div class="skeleton-kpi-card">
      <div class="skeleton-block" style="height:26px;width:55%;margin-bottom:10px;"></div>
      <div class="skeleton-block" style="height:10px;width:75%;"></div>
    </div>
  `).join('');
  return `<div class="kpis">${tarjetas}</div>`;
}

function esqueletoTabla(columnas = 6, filas = 6) {
  const anchos = ['80%', '55%', '70%', '45%', '60%', '35%', '65%', '50%'];
  const head = Array.from({ length: columnas }).map(() =>
    `<th><div class="skeleton-block skeleton-th" style="width:60%;"></div></th>`
  ).join('');
  const body = Array.from({ length: filas }).map((_, fi) => `
    <tr>${Array.from({ length: columnas }).map((_, ci) => `
      <td><div class="skeleton-block" style="height:12px;width:${anchos[(fi + ci) % anchos.length]};"></div></td>
    `).join('')}</tr>
  `).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function esqueletoFicha() {
  const anchos = ['90%', '75%', '85%', '60%'];
  const lineas = anchos.map(w =>
    `<div class="skeleton-block" style="height:12px;width:${w};margin-bottom:10px;"></div>`
  ).join('');
  return `
    <div class="skeleton-card">
      <div class="skeleton-block" style="height:20px;width:40%;margin-bottom:18px;"></div>
      ${lineas}
    </div>
  `;
}

// Elige la forma de esqueleto según la vista que se está cargando
function esqueletoVista(vista) {
  const listas = ['correos', 'casos', 'alertas', 'auditoria', 'ejecutivos', 'usuarios', 'reagendamiento', 'reportes'];
  if (vista === 'dashboard') return esqueletoKPIs();
  if (listas.includes(vista)) return esqueletoTabla();
  return esqueletoFicha();
}

// Si ya había sesión guardada, entra directo (al final del script, cuando todo ya está definido)
if (token && usuarioActual) mostrarApp();
