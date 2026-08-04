/* ============================================================
   NAVEGACIÓN
   ============================================================ */
document.querySelectorAll('.sidebar nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar nav button').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    cargarVista(btn.dataset.vista);
  });
});

const titulos = { dashboard: 'Dashboard', correos: 'Correos', casos: 'Casos', alertas: 'Centro de Alertas', auditoria: 'Auditoría', reportes: 'Reportes', importar: 'Importar desde Excel', ejecutivos: 'Ejecutivos', configuracion: 'Configuración del sistema', usuarios: 'Gestión de usuarios', reagendamiento: 'Reagendamiento', reagConfiguracion: 'Configuración SLA — Reagendamiento' };

async function cargarVista(vista) {
  document.getElementById('tituloVista').textContent = titulos[vista];
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoVista(vista);
  try {
    if (vista === 'dashboard') await renderDashboard();
    if (vista === 'correos') await renderCorreos();
    if (vista === 'casos') await renderCasos();
    if (vista === 'alertas') await renderAlertas();
    if (vista === 'auditoria') await renderAuditoria();
    if (vista === 'reportes') await renderReportes();
    if (vista === 'importar') await renderImportar();
    if (vista === 'ejecutivos') await renderEjecutivos();
    if (vista === 'configuracion') await renderConfiguracion();
    if (vista === 'usuarios') await renderUsuarios();
    if (vista === 'reagendamiento') await renderReagendamiento();
    if (vista === 'reagConfiguracion') await renderReagConfiguracion();
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
  }
}

