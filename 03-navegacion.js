/* ============================================================
   NAVEGACIÓN
   ============================================================ */
function marcarBotonActivo(idBoton) {
  const btn = document.getElementById(idBoton);
  if (!btn) return;
  document.querySelectorAll('.sidebar nav button').forEach(b => b.classList.remove('activo'));
  btn.classList.add('activo');
  const grupo = btn.closest('.menu-grupo');
  if (grupo) {
    document.querySelectorAll('.menu-grupo').forEach(g => g.classList.remove('abierto'));
    grupo.classList.add('abierto');
  }
}

function activarVista(idBoton) {
  marcarBotonActivo(idBoton);
  cargarVista(document.getElementById(idBoton).dataset.vista);
}

document.querySelectorAll('.sidebar nav button').forEach(btn => {
  btn.addEventListener('click', () => activarVista(btn.id));
});

document.querySelectorAll('.menu-grupo-header').forEach(header => {
  header.setAttribute('tabindex', '0');
  header.setAttribute('role', 'button');
  header.addEventListener('click', () => {
    const grupo = header.closest('.menu-grupo');
    const yaAbierto = grupo.classList.contains('abierto');
    document.querySelectorAll('.menu-grupo').forEach(g => g.classList.remove('abierto'));
    if (!yaAbierto) grupo.classList.add('abierto');
  });
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); header.click(); }
  });
});

const titulos = { dashboard: 'Dashboard', correos: 'Correos', casos: 'Casos', cuentaCorriente: 'Cuenta Corriente', bloqueoSnl: 'Bloqueo SNL', pension: 'Pensión', alertas: 'Centro de Alertas', checklistSnl: 'Check List SNL', checklistOutbot: 'Check List OUT-BOT', validadorMedico: 'Validador Médico', panelContactabilidad: 'Panel de Contactabilidad', auditoria: 'Auditoría', reportes: 'Reportes', importar: 'Importar desde Excel', ejecutivos: 'Ejecutivos', configuracion: 'Configuración del sistema', usuarios: 'Gestión de usuarios', reagendamiento: 'Reagendamiento', reagConfiguracion: 'Configuración SLA — Reagendamiento' };

async function cargarVista(vista) {
  document.getElementById('tituloVista').textContent = titulos[vista];
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoVista(vista);
  try {
    if (vista === 'dashboard') await renderDashboard();
    if (vista === 'correos') await renderCorreos();
    if (vista === 'casos') await renderCasos();
    if (vista === 'cuentaCorriente') await abrirCuentaCorriente();
    if (vista === 'bloqueoSnl') abrirBloqueoSnl();
    if (vista === 'pension') abrirPension();
    if (vista === 'alertas') await renderAlertas();
    if (vista === 'checklistSnl') await renderChecklistSnl();
    if (vista === 'checklistOutbot') await renderChecklistOutbot();
    if (vista === 'validadorMedico') await renderValidadorMedico();
    if (vista === 'panelContactabilidad') await renderPanelContactabilidad();
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

