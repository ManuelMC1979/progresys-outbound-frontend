/* ============================================================
   REAGENDAMIENTO
   ============================================================ */
let catalogoAgencias = [];
let idReagDetalleActual = null;
let casosReagCache = {};
let idEscalarActual = null;
let casosReagUltimo = [];
let reagFiltroFechaDesde = '';
let reagFiltroFechaHasta = '';
let reagFiltroRut = '';

function aplicarFiltroFechasReag() {
  reagFiltroFechaDesde = document.getElementById('reagFiltroFechaDesde').value;
  reagFiltroFechaHasta = document.getElementById('reagFiltroFechaHasta').value;
  reagFiltroRut = document.getElementById('reagFiltroRut').value.trim();
  renderReagendamiento();
}

function buscarRutReagOnEnter(event) {
  if (event.key === 'Enter') { event.preventDefault(); aplicarFiltroFechasReag(); }
}

function limpiarFiltroFechasReag() {
  reagFiltroFechaDesde = '';
  reagFiltroFechaHasta = '';
  reagFiltroRut = '';
  renderReagendamiento();
}

async function cargarCatalogoAgencias() {
  try { catalogoAgencias = await api('/reagendamiento/agencias'); } catch (e) { catalogoAgencias = []; }
}

function etiquetaTipoAtencion(valor) {
  const mapa = { CONTROL: 'Atención Primaria', 'CURACIÓN': 'Enfermería' };
  return mapa[valor] || valor;
}

function badgeEstadoReag(estado) {
  const map = {
    CERRADO: ['Cerrado', 'cerrado'],
    PENDIENTE_ADMIN: ['Pendiente revisión Admin', 'pendiente'],
    EN_PROCESO_BACK: ['EN PROCESO BACK', 'gestion'],
    RECHAZADO: ['Rechazado — agendado por Admin', 'gestion'],
    RECHAZADO_MAL_INGRESO: ['Rechazado — mal ingreso', 'alerta'],
    RECHAZADO_MAL_DERIVADO: ['Rechazado — mal derivado', 'alerta'],
    ESCALADO_AGENCIA: ['Escalado a agencia', 'celeste'],
    PENDIENTE_CIERRE_ADMIN: ['Pendiente de cierre (Admin)', 'gestion'],
    RESUELTO: ['Resuelto por agencia', 'gestionado'],
    RESUELTO_PRIMERA_LINEA: ['Resuelto — primera línea', 'gestionado'],
    RESUELTO_BACK: ['Resuelto — Back', 'gestionado'],
    CERRADO_NO_AGENDA: ['Cerrado — no agenda cita', 'cerrado'],
    CERRADO_SIN_CONTACTO: ['Cerrado sin contacto', 'cerrado'],
    ANULADO: ['Anulado', 'alerta'],
  };
  const [txt, clase] = map[estado] || [estado, 'pendiente'];
  return `<span class="badge ${clase}">${txt}</span>`;
}

function badgeBot() {
  return `<span style="background:#534AB7; color:white; font-size:9px; font-weight:700; padding:2px 5px; border-radius:4px; margin-left:5px; vertical-align:middle; letter-spacing:0.5px;">BOT</span>`;
}

function badgeIN() {
  return `<span style="background:var(--turquesa); color:white; font-size:9px; font-weight:700; padding:2px 5px; border-radius:4px; margin-left:5px; vertical-align:middle; letter-spacing:0.5px;" title="Ingresado por Ejecutivo">IN</span>`;
}

function textoSla(estadoSla) {
  if (!estadoSla) return '<span style="color:#ccc;">—</span>';
  const colores = { 'VENCIDO': '#d9534f', 'POR VENCER': '#f0ad4e', 'DENTRO DE PLAZO': '#2ecc71' };
  const color = colores[estadoSla] || '#888';
  return `<span style="color:${color}; font-weight:600;">${estadoSla}</span>`;
}

function celdaFolio(c) {
  const esBot = c.origen === 'BOT' || c.ingresado_bot;
  const esEjecutivo = c.origen === 'EJECUTIVO';
  return `<b>${c.folio}</b>${esBot ? badgeBot() : ''}${esEjecutivo ? badgeIN() : ''}`;
}

async function renderReagendamiento() {
  if (!catalogoAgencias.length) await cargarCatalogoAgencias();
  const contenido = document.getElementById('contenido');
  const esEjecutivo = usuarioActual.rol === 'EJECUTIVO';
  const esAdmin = usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';

  const qsReag = new URLSearchParams();
  if (reagFiltroFechaDesde) qsReag.set('fecha_desde', reagFiltroFechaDesde);
  if (reagFiltroFechaHasta) qsReag.set('fecha_hasta', reagFiltroFechaHasta);
  if (reagFiltroRut) qsReag.set('rut', reagFiltroRut);
  const casosReag = await api(`/reagendamiento${qsReag.toString() ? '?' + qsReag.toString() : ''}`);
  casosReagUltimo = casosReag;

  const bannerSap = `
    <div style="background:#fff3cd; border:1px solid #f0ad4e; border-left:5px solid #f0ad4e; border-radius:8px; padding:14px 16px; margin-bottom:20px; display:flex; gap:12px; align-items:center;">
      <div style="font-size:20px;">⚠️</div>
      <div style="font-size:13px; color:#7a5c00; line-height:1.5; flex:1;">
        <b>Recordatorio importante — Nota externa en SAP:</b><br>
        Al dejar la nota externa en SAP, debe quedar registrada como:<br>
        <b>Gpo. prof.:</b> Administrativo &nbsp;·&nbsp; <b>Categoría:</b> MED:23 Alerta inasistencia control
      </div>
      ${esAdmin ? `<button class="btn secundario" style="white-space:nowrap; flex-shrink:0;" onclick="document.getElementById('modalScriptLlamada').classList.add('activo')">Script de llamada</button>` : ''}
    </div>
  `;

  const bannerAlcance = `
    <div style="background:#e8f6f4; border:1px solid var(--turquesa); border-left:5px solid var(--turquesa); border-radius:8px; padding:14px 16px; margin-bottom:20px; display:flex; gap:12px; align-items:flex-start;">
      <div style="font-size:20px;">ℹ️</div>
      <div style="font-size:13px; color:var(--azul-marino); line-height:1.7;">
        <b>Recuerda:</b> solo gestionamos pacientes de la Red, no del Hospital.<br>
        <b>En línea con el paciente:</b> horizonte de cita hasta <b>72 horas hábiles</b> para Atención Primaria y <b>48 horas hábiles</b> para Enfermería.<br>
        <b>Al escalar al back office:</b> plazo aproximado de respuesta de <b>72 horas hábiles</b>.
      </div>
    </div>
  `;

  let bloqueFormulario = '';
  if (esEjecutivo) {
    bloqueFormulario = `
      ${bannerAlcance}
      <div class="card" style="background:white; border-radius:10px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,0.08); margin-bottom:20px;">
        <h3 style="color:var(--azul-marino); font-size:15px;">Registrar llamada de cambio de cita</h3>
        <label>RUT del paciente</label>
        <input type="text" id="reagRut" placeholder="Ej: 12.345.678-9">
        <label>Tipo de atención</label>
        <select id="reagTipoAtencion">
          <option value="CONTROL">Atención Primaria</option>
          <option value="CURACIÓN">Enfermería</option>
        </select>
        <label>¿Se logró reagendar en el momento? (Reagendamiento Ley)</label>
        <select id="reagLey" onchange="mostrarBloqueReagSegunLey()">
          <option value="">Selecciona una opción</option>
          <option value="SI">Reagendamiento Ley - Sí</option>
          <option value="NO">Reagendamiento Ley - No</option>
        </select>
        <div id="reagBloqueSi" style="display:none; margin-top:10px;">
          <label>Fecha y hora agendada para el paciente</label>
          <input type="datetime-local" id="reagHoraAgendada">
          <label>Observaciones (opcional)</label>
          <textarea id="reagObsLeySi" rows="2" placeholder="Observaciones del caso..."></textarea>
          <button class="btn" style="margin-top:8px;" onclick="guardarReagLeySi()">Cerrar caso (cita agendada)</button>
        </div>
        <div id="reagBloqueNo" style="display:none; margin-top:10px;">
          <p style="font-size:12px; color:#888;">No hay cita disponible. Ingresa la solicitud completa para escalarla a Administración.</p>
          <button class="btn" onclick="abrirReagModalSolicitud()">Ingresar solicitud completa</button>
        </div>
      </div>
    `;
  }

  let bloquesAdmin = '';
  if (esAdmin) {
    const pendientes = casosReag.filter(c => ['PENDIENTE_ADMIN', 'EN_PROCESO_BACK'].includes(c.estado));
    const escalados = casosReag.filter(c => c.estado === 'ESCALADO_AGENCIA');
    const pendientesCierre = casosReag.filter(c => c.estado === 'PENDIENTE_CIERRE_ADMIN');
    const dashReag = await api('/reagendamiento/reportes/dashboard');
    bloquesAdmin = `
      ${bannerAlcance}
      <div class="toolbar">
        <button class="btn secundario" onclick="abrirReagModalNuevaAgencia()">+ Nueva agencia</button>
        <button class="btn secundario" onclick="exportarReagExcel()">Descargar reporte</button>
        <span style="margin-left:auto; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <label style="font-size:12px; color:#666; margin:0;">Buscar RUT</label>
          <input type="text" id="reagFiltroRut" value="${reagFiltroRut}" placeholder="Ej: 12.345.678-9" onkeydown="buscarRutReagOnEnter(event)" style="width:140px;">
          <button class="btn secundario" onclick="aplicarFiltroFechasReag()">Buscar</button>
          <label style="font-size:12px; color:#666; margin:0;">Folios ingresados — Desde</label>
          <input type="date" id="reagFiltroFechaDesde" value="${reagFiltroFechaDesde}" onchange="aplicarFiltroFechasReag()">
          <label style="font-size:12px; color:#666; margin:0;">Hasta</label>
          <input type="date" id="reagFiltroFechaHasta" value="${reagFiltroFechaHasta}" onchange="aplicarFiltroFechasReag()">
          ${(reagFiltroFechaDesde || reagFiltroFechaHasta || reagFiltroRut) ? `<button class="btn secundario" onclick="limpiarFiltroFechasReag()">Limpiar filtro</button>` : ''}
        </span>
      </div>

      <h3 style="color:var(--azul-marino);">Dashboard Reagendamiento</h3>
      <div class="kpis" style="margin-bottom:20px;">
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('total')"><div class="valor">${dashReag.total}</div><div class="etiqueta">Total solicitudes</div></div>
        <div class="kpi-card" title="Intentos con contacto confirmado (${dashReag.contactados} de ${dashReag.total_intentos} intentos)"><div class="valor">${dashReag.pct_contactabilidad}%</div><div class="etiqueta">% Contactabilidad</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('ley_si')"><div class="valor">${dashReag.ley_si}</div><div class="etiqueta">¿Se agendó? - Sí</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('ley_no')"><div class="valor">${dashReag.ley_no}</div><div class="etiqueta">¿Se agendó? - No</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('pendientes')"><div class="valor">${dashReag.pendientes}</div><div class="etiqueta">Pendientes revisión</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('en_proceso_back')"><div class="valor">${dashReag.en_proceso_back}</div><div class="etiqueta">En proceso Back</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('escalados')"><div class="valor">${dashReag.escalados}</div><div class="etiqueta">Escalados a agencia</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('pendientes_cierre')"><div class="valor">${dashReag.pendientes_cierre}</div><div class="etiqueta">Pendientes de cierre (Admin)</div></div>
        <div class="kpi-card alerta" style="cursor:pointer;" onclick="mostrarResumenKpi('sla_vencidos')"><div class="valor">${dashReag.vencidos_admin + dashReag.vencidos_agencia + dashReag.vencidos_cierre}</div><div class="etiqueta">SLA vencidos</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('rechazados')"><div class="valor">${dashReag.rechazados}</div><div class="etiqueta">Rechazados</div></div>
        <div class="kpi-card alerta" style="cursor:pointer;" onclick="mostrarResumenKpi('rechazados_mal_ingreso')"><div class="valor">${dashReag.rechazados_mal_ingreso}</div><div class="etiqueta">Mal ingreso (trazabilidad)</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('resueltos_primera_linea')"><div class="valor">${dashReag.resueltos_primera_linea}</div><div class="etiqueta">Resueltos primera línea</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('resueltos_back')"><div class="valor">${dashReag.resueltos_back}</div><div class="etiqueta">Resueltos — Back</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('cerrados_no_agenda')"><div class="valor">${dashReag.cerrados_no_agenda}</div><div class="etiqueta">Cerrados — no agenda cita</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('cerrados_sin_contacto')"><div class="valor">${dashReag.cerrados_sin_contacto}</div><div class="etiqueta">Cerrados sin contacto</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="mostrarResumenKpi('resueltos')"><div class="valor">${dashReag.resueltos}</div><div class="etiqueta">Resueltos</div></div>
      </div>

      <div style="display:flex; gap:24px; flex-wrap:wrap; margin-bottom:24px;">
        <div style="flex:1; min-width:260px; background:white; border-radius:10px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <h4 style="margin:0 0 12px; color:var(--azul-marino); font-size:13px;">¿Se agendó? — Sí vs No</h4>
          ${barraProporcion(dashReag.ley_si, dashReag.ley_no, 'Sí', 'No')}
        </div>
        <div style="flex:2; min-width:300px; background:white; border-radius:10px; padding:0; box-shadow:0 1px 4px rgba(0,0,0,0.08); overflow:hidden;">
          <details>
            <summary style="padding:14px 16px; cursor:pointer; font-size:13px; font-weight:700; color:var(--azul-marino); list-style:none; display:flex; justify-content:space-between; align-items:center; user-select:none;">
              Casos por agencia
              <span class="resumen-agencia-chevron" style="font-size:11px; color:#888;">▼ ver</span>
            </summary>
            <div style="padding:0 16px 16px;">
              ${graficoBarrasAgencias(dashReag.por_agencia)}
            </div>
          </details>
        </div>
      </div>

      <h3 style="color:var(--azul-marino); margin-top:24px;">Pendientes de revisión (${pendientes.length})</h3>
      ${tablaReag(pendientes, 'admin_pendiente')}
      <h3 style="color:var(--azul-marino); margin-top:24px;">Escalados a agencia (${escalados.length})</h3>
      ${tablaReag(escalados, 'admin_escalado')}
      <h3 style="color:var(--azul-marino); margin-top:24px;">Pendientes de cierre — respuesta de agencia recibida (${pendientesCierre.length})</h3>
      ${tablaReag(pendientesCierre, 'admin_pendiente_cierre')}
      <div style="margin-top:24px; background:white; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,0.08); overflow:hidden;">
        <details>
          <summary style="padding:14px 16px; cursor:pointer; font-size:15px; font-weight:700; color:var(--azul-marino); list-style:none; display:flex; justify-content:space-between; align-items:center; user-select:none;">
            Historial
            <span style="font-size:11px; color:#888; font-weight:400;">▼ ver</span>
          </summary>
          <div style="padding:0 16px 16px;">
            ${tablaReag(casosReag.filter(c => ['CERRADO','RECHAZADO','RECHAZADO_MAL_INGRESO','RECHAZADO_MAL_DERIVADO','RESUELTO','RESUELTO_PRIMERA_LINEA','RESUELTO_BACK','CERRADO_NO_AGENDA','CERRADO_SIN_CONTACTO','ANULADO'].includes(c.estado)), 'historial')}
          </div>
        </details>
      </div>
    `;
  }

  const esBot = usuarioActual.email === 'bot.call@progesys.local' || (usuarioActual.nombre || '').toUpperCase() === 'BOT';
  const bloqueBotImportar = esBot ? `
    <div style="background:#ede9ff; border:1px solid #534AB7; border-left:5px solid #534AB7; border-radius:8px; padding:12px 16px; margin-bottom:16px; display:flex; gap:12px; align-items:center;">
      <span style="background:#534AB7; color:white; font-size:10px; font-weight:700; padding:3px 7px; border-radius:4px; flex-shrink:0;">BOT</span>
      <span style="font-size:13px; color:#26215C; flex:1;">Importa el archivo Excel del Callbot para ingresar folios automáticamente.</span>
      <label class="btn" style="background:#534AB7; cursor:pointer; margin:0;">
        📥 Importar Excel Callbot
        <input type="file" accept=".xlsx,.xls" style="display:none;" onchange="importarExcelBot(event)">
      </label>
    </div>
    <div id="botImportarResultado" style="margin-bottom:16px;"></div>
  ` : '';
  const bloqueMisCasos = esEjecutivo ? `
    <div style="margin-top:24px; background:white; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,0.08); overflow:hidden;">
      <details ${esBot ? '' : 'open'}>
        <summary style="padding:14px 16px; cursor:pointer; font-size:15px; font-weight:700; color:var(--azul-marino); list-style:none; display:flex; justify-content:space-between; align-items:center; user-select:none;">
          Mis casos de Reagendamiento
          <span style="font-size:11px; color:#888; font-weight:400;">▼ ver</span>
        </summary>
        <div style="padding:0 16px 16px;">
          ${tablaReag(casosReag, 'ejecutivo')}
        </div>
      </details>
    </div>
  ` : '';

  contenido.innerHTML = bannerSap + bloqueBotImportar + bloqueFormulario + bloquesAdmin + bloqueMisCasos;
}

function renderIntentosMini(intentos) {
  const arr = intentos || [];
  let html = '<div style="display:flex;gap:4px;justify-content:center;">';
  for (let i = 1; i <= 3; i++) {
    const it = arr.find(x => x.numero_intento === i);
    let clase = 'intento-dot-vacio';
    let titulo = `Intento ${i}: pendiente`;
    if (it) {
      if (it.estado === 'CONFIRMA') { clase = 'intento-dot-confirma'; titulo = `Intento ${i}: Contacto — confirma`; }
      else if (it.estado === 'CONTACTO_NO_AGENDO') { clase = 'intento-dot-noagendo'; titulo = `Intento ${i}: Contacto — no agendó`; }
      else { clase = 'intento-dot-nocontacto'; titulo = `Intento ${i}: No contactado`; }
    }
    html += `<span class="intento-dot ${clase}" title="${titulo}">${i}</span>`;
  }
  return html + '</div>';
}

function tablaReag(lista, contexto) {
  if (lista.length === 0) return '<p style="color:#999;">Sin casos en esta sección.</p>';
  const mostrarEjecutivo = contexto !== 'ejecutivo';
  return `
    <table>
      <thead><tr><th>Folio</th><th>RUT</th><th>Tipo</th>${mostrarEjecutivo ? '<th>Ejecutivo</th><th>Servicio</th>' : ''}<th>¿Se agendó?</th><th>Fecha agendada</th><th>Estado</th><th>SLA</th><th style="text-align:center;">Intentos</th><th></th></tr></thead>
      <tbody>
        ${lista.map(c => { casosReagCache[c.id_caso] = c; return `
          <tr>
            <td style="cursor:pointer;" onclick='abrirReagDetalle(${JSON.stringify(c.id_caso)})'>${celdaFolio(c)}</td>
            <td>${c.rut_paciente}</td>
            <td>${etiquetaTipoAtencion(c.tipo_atencion)}</td>
            ${mostrarEjecutivo ? `<td>${c.ejecutivo || '—'}</td><td>${c.servicio_ejecutivo || '—'}</td>` : ''}
            <td>${(c.reagendamiento_ley === 'SI' || c.hora_agendada) ? 'Sí' : 'No'}</td>
            <td>${c.hora_agendada ? formatFecha(c.hora_agendada) : '—'}</td>
            <td>${badgeEstadoReag(c.estado)}</td>
            <td>${textoSla(c.estado_sla)}</td>
            <td style="text-align:center;">${c.agencia ? renderIntentosMini(c.intentos) : '<span style="color:#ccc;">—</span>'}</td>
            <td style="white-space:nowrap;">
              <button class="btn secundario" onclick='abrirReagDetalle(${JSON.stringify(c.id_caso)})'>Ver detalle</button>
            </td>
          </tr>
        `; }).join('')}
      </tbody>
    </table>
  `;
}

/* ============================================================
   RESUMEN AL HACER CLIC EN UN KPI DEL DASHBOARD
   ============================================================ */
const KPI_REAG_TITULOS = {
  total: 'Total solicitudes',
  ley_si: '¿Se agendó? — Sí',
  ley_no: '¿Se agendó? — No',
  pendientes: 'Pendientes revisión',
  en_proceso_back: 'En proceso Back',
  escalados: 'Escalados a agencia',
  pendientes_cierre: 'Pendientes de cierre (Admin)',
  sla_vencidos: 'SLA vencidos',
  rechazados: 'Rechazados',
  rechazados_mal_ingreso: 'Mal ingreso (trazabilidad)',
  resueltos_primera_linea: 'Resueltos primera línea',
  resueltos_back: 'Resueltos — Back',
  cerrados_no_agenda: 'Cerrados — no agenda cita',
  cerrados_sin_contacto: 'Cerrados sin contacto',
  resueltos: 'Resueltos',
};

function filtrarPorKpiReag(criterio) {
  const ahora = Date.now();
  const vencido = f => !!f && new Date(f).getTime() < ahora;
  switch (criterio) {
    case 'total': return casosReagUltimo;
    case 'ley_si': return casosReagUltimo.filter(c => c.reagendamiento_ley === 'SI');
    case 'ley_no': return casosReagUltimo.filter(c => c.reagendamiento_ley === 'NO');
    case 'pendientes': return casosReagUltimo.filter(c => ['PENDIENTE_ADMIN', 'EN_PROCESO_BACK'].includes(c.estado));
    case 'en_proceso_back': return casosReagUltimo.filter(c => c.estado === 'EN_PROCESO_BACK');
    case 'escalados': return casosReagUltimo.filter(c => c.estado === 'ESCALADO_AGENCIA');
    case 'pendientes_cierre': return casosReagUltimo.filter(c => c.estado === 'PENDIENTE_CIERRE_ADMIN');
    case 'sla_vencidos': return casosReagUltimo.filter(c =>
      (['PENDIENTE_ADMIN', 'EN_PROCESO_BACK'].includes(c.estado) && vencido(c.fecha_limite_admin)) ||
      (c.estado === 'ESCALADO_AGENCIA' && vencido(c.fecha_limite_agencia)) ||
      (c.estado === 'PENDIENTE_CIERRE_ADMIN' && vencido(c.fecha_limite_cierre_admin))
    );
    case 'rechazados': return casosReagUltimo.filter(c => c.estado === 'RECHAZADO');
    case 'rechazados_mal_ingreso': return casosReagUltimo.filter(c => c.estado === 'RECHAZADO_MAL_INGRESO');
    case 'resueltos_primera_linea': return casosReagUltimo.filter(c => c.estado === 'RESUELTO_PRIMERA_LINEA');
    case 'resueltos_back': return casosReagUltimo.filter(c => c.estado === 'RESUELTO_BACK');
    case 'cerrados_no_agenda': return casosReagUltimo.filter(c => c.estado === 'CERRADO_NO_AGENDA');
    case 'cerrados_sin_contacto': return casosReagUltimo.filter(c => c.estado === 'CERRADO_SIN_CONTACTO');
    case 'resueltos': return casosReagUltimo.filter(c => ['CERRADO', 'RESUELTO'].includes(c.estado));
    default: return [];
  }
}

function mostrarResumenKpi(criterio) {
  const lista = filtrarPorKpiReag(criterio);
  const titulo = KPI_REAG_TITULOS[criterio] || criterio;
  document.getElementById('tituloResumenKpi').textContent = `${titulo} (${lista.length})`;
  const cuerpo = document.getElementById('cuerpoResumenKpi');
  cuerpo.innerHTML = lista.length === 0 ? '<p style="color:#999;">Sin casos en esta categoría.</p>' : `
    <table>
      <thead><tr><th>Folio</th><th>RUT</th><th>Nombre</th><th>Estado</th><th>Fecha creación</th><th></th></tr></thead>
      <tbody>
        ${lista.map(c => { casosReagCache[c.id_caso] = c; return `
          <tr>
            <td>${celdaFolio(c)}</td>
            <td>${c.rut_paciente}</td>
            <td>${c.nombre_paciente || '—'}</td>
            <td>${badgeEstadoReag(c.estado)}</td>
            <td>${formatFecha(c.fecha_creacion)}</td>
            <td><button class="btn secundario" onclick="cerrarModal('modalResumenKpi'); abrirReagDetalle('${c.id_caso}')">Ver detalle</button></td>
          </tr>
        `; }).join('')}
      </tbody>
    </table>
  `;
  document.getElementById('modalResumenKpi').classList.add('activo');
}

async function abrirReagDetalle(idCaso) {
  idReagDetalleActual = idCaso;
  document.getElementById('tituloVista').textContent = 'Detalle del caso — Reagendamiento';
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = esqueletoFicha();
  try {
    const caso = await api(`/reagendamiento/${idCaso}`);
    renderReagDetalle(caso);
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
  }
}

function renderReagDetalle(caso) {
  casosReagCache[caso.id_caso] = caso;
  const contenido = document.getElementById('contenido');
  const esAdmin = usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR';

  const eventos = (caso.eventos || []).map(e => ({ titulo: e.titulo, detalle: e.detalle, fecha: e.fecha }));

  let acciones = '';
  if (['PENDIENTE_ADMIN', 'EN_PROCESO_BACK'].includes(caso.estado) && esAdmin) {
    acciones = `
      ${!(caso.origen === 'BOT' || caso.ingresado_bot) ? `<button class="btn secundario" onclick="abrirReagModalContactadoAgenda('${caso.id_caso}')">Contactado — Sí agenda cita</button>` : ''}
      ${!(caso.origen === 'BOT' || caso.ingresado_bot) ? `<button class="btn secundario" onclick="abrirReagModalContactadoNoAgenda('${caso.id_caso}')">Contactado — No agenda cita</button>` : ''}
      ${!(caso.origen === 'BOT' || caso.ingresado_bot) ? `<button class="btn secundario" onclick="abrirReagModalRechazar('${caso.id_caso}')">Rechazar y agendar</button>` : ''}
      ${caso.estado === 'EN_PROCESO_BACK' ? `<button class="btn" style="background-color:#28a745; border-color:#28a745;" onclick="abrirModalContactadoBackend('${caso.id_caso}')">✓ Contactado (Resuelto)</button>` : ''}
      <button class="btn" onclick="abrirEscalarConScript('${caso.id_caso}')">Escalar a agencia</button>
      <button class="btn secundario" style="color:var(--rojo); border-color:var(--rojo);" onclick="abrirReagModalRechazarMalIngreso('${caso.id_caso}')">Mal ingreso</button>
      <button class="btn secundario" style="color:var(--rojo); border-color:var(--rojo);" onclick="abrirReagModalRechazarMalDerivado('${caso.id_caso}')">Rechazo mal derivado</button>
    `;
  } else if (caso.estado === 'ESCALADO_AGENCIA' && esAdmin) {
    acciones = `<button class="btn" onclick="abrirReagModalRespuesta('${caso.id_caso}')">Registrar respuesta primera línea</button>`;
  } else if (caso.estado === 'PENDIENTE_CIERRE_ADMIN' && esAdmin) {
    acciones = `<button class="btn" onclick="cerrarReagFinal('${caso.id_caso}')">Cerrar caso</button>`;
  } else if (caso.estado === 'PENDIENTE_ADMIN' && usuarioActual.rol === 'EJECUTIVO') {
    acciones = `<button class="btn secundario" onclick="abrirReagModalEditarDatos('${caso.id_caso}')">Editar datos</button>`;
  }

  contenido.innerHTML = `
    <button class="btn secundario" onclick="idReagDetalleActual = null; cargarVista('reagendamiento')" style="margin-bottom:16px;">← Volver a Reagendamiento</button>

    <div class="kpis" style="margin-bottom:24px;">
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${caso.rut_paciente}</div><div class="etiqueta">RUT paciente</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${caso.ejecutivo || '—'}</div><div class="etiqueta">Ejecutivo</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${caso.servicio_ejecutivo || '—'}</div><div class="etiqueta">Servicio</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${badgeEstadoReag(caso.estado)}</div><div class="etiqueta">Estado</div></div>
      <div class="kpi-card"><div class="valor" style="font-size:16px;">${(caso.reagendamiento_ley === 'SI' || caso.hora_agendada) ? 'Sí' : 'No'}</div><div class="etiqueta">¿Se agendó?</div></div>
      ${caso.hora_agendada ? `<div class="kpi-card"><div class="valor" style="font-size:13px;">${formatFecha(caso.hora_agendada)}</div><div class="etiqueta">Fecha y hora agendada</div></div>` : ''}
      ${(caso.origen === 'BOT' || caso.ingresado_bot) ? `<div class="kpi-card" style="border-left-color:#534AB7;"><div class="valor" style="font-size:16px;color:#534AB7;">BOT</div><div class="etiqueta">Origen</div></div>` : ''}
    </div>

    <div style="display:flex; gap:24px; flex-wrap:wrap;">
      <div style="flex:2; min-width:320px;">
        <h3 style="color:var(--azul-marino); font-size:15px;">Línea de tiempo</h3>
        <div style="position:relative; padding-left:24px; border-left:2px solid #ddd; margin-top:16px;">
          ${eventos.map(ev => `
            <div style="position:relative; margin-bottom:22px;">
              <div style="position:absolute; left:-31px; top:2px; width:12px; height:12px; border-radius:50%; background:var(--turquesa); border:2px solid white; box-shadow:0 0 0 2px var(--turquesa);"></div>
              <div style="font-weight:600; font-size:13px; color:var(--azul-marino);">${ev.titulo}</div>
              <div style="font-size:12px; color:#888; margin:2px 0;">${formatFecha(ev.fecha)}</div>
              <div style="font-size:13px;">${ev.detalle || ''}</div>
            </div>
          `).join('')}
          ${eventos.length === 0 ? '<p style="color:#999;">Sin eventos registrados.</p>' : ''}
        </div>
      </div>

      ${(acciones || esAdmin || caso.agencia || ['PENDIENTE_ADMIN', 'EN_PROCESO_BACK'].includes(caso.estado)) ? `
      <div style="flex:0 0 220px; min-width:200px; display:flex; flex-direction:column; gap:8px;">
        <h3 style="color:var(--azul-marino); font-size:15px;">Acciones</h3>
        ${(caso.agencia || ['PENDIENTE_ADMIN', 'EN_PROCESO_BACK'].includes(caso.estado)) ? panelIntentos(caso) : ''}
        ${acciones ? `<div style="display:flex; flex-direction:column; gap:8px;">${acciones}</div>` : ''}
        ${esAdmin ? `
          <div style="margin-top:12px; border-top:1px solid #eee; padding-top:12px;">
            <button class="btn secundario" style="font-size:11px; color:#888;" onclick="abrirModalReabrirFolio('${caso.id_caso}')">Reabrir folio</button>
          </div>` : ''}
      </div>` : ''}

      <div style="flex:1; min-width:260px;">
        <h3 style="color:var(--azul-marino); font-size:15px;">Datos del caso</h3>
        <table style="margin-top:12px;">
          <tbody>
            <tr><td><b>Folio</b></td><td>${caso.folio || '—'}</td></tr>
            <tr><td><b>Nombre paciente</b></td><td>${caso.nombre_paciente || '—'}</td></tr>
            <tr><td><b>Teléfono</b></td><td>${caso.telefono || '—'}</td></tr>
            <tr><td><b>Tipo de atención</b></td><td>${etiquetaTipoAtencion(caso.tipo_atencion) || '—'}</td></tr>
            <tr><td><b>Agencia</b></td><td>${caso.agencia || '—'}</td></tr>
            ${caso.fecha_limite_agencia ? `<tr><td><b>Fecha límite Agencia</b></td><td>${formatFecha(caso.fecha_limite_agencia)}</td></tr>` : ''}
            ${caso.hora_agendada ? `<tr><td><b>Fecha y hora agendada</b></td><td>${formatFecha(caso.hora_agendada)}</td></tr>` : ''}
            <tr><td><b>Motivo del bloqueo</b></td><td>${caso.motivo || '—'}</td></tr>
            <tr><td><b>Observaciones</b></td><td>${caso.observaciones || '—'}</td></tr>
          </tbody>
        </table>

        <div style="margin-top:16px;">
          <label style="font-size:13px; font-weight:600; color:var(--azul-marino);">Agregar observación</label>
          <textarea id="obsDetalleReag" rows="2" style="width:100%; margin-top:6px; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;" placeholder="Escribe una observación..."></textarea>
          <button class="btn secundario" style="margin-top:6px;" onclick="guardarObsDesdeDetalle('${caso.id_caso}')">Guardar observación</button>
        </div>
      </div>
    </div>
  `;
}

function panelIntentos(caso) {
  const intentos = (caso.intentos || []).slice().sort((a, b) => a.numero_intento - b.numero_intento);
  const siguiente = intentos.length + 1;
  const casoAbierto = !['RESUELTO', 'CERRADO', 'RECHAZADO_MAL_INGRESO', 'RECHAZADO_MAL_DERIVADO', 'RESUELTO_PRIMERA_LINEA', 'RESUELTO_BACK', 'CERRADO_NO_AGENDA', 'CERRADO_SIN_CONTACTO', 'ANULADO'].includes(caso.estado);

  const filas = [1, 2, 3].map(n => {
    const it = intentos.find(x => x.numero_intento === n);
    if (it) {
      const esContactado = it.estado === 'CONFIRMA';
      return `
        <div class="intento-fila">
          <div class="intento-num" style="${esContactado ? 'background:var(--verde);' : ''}">${n}</div>
          <div class="intento-info">
            <div class="intento-estado ${esContactado ? 'estado-confirma' : 'estado-nocontacto'}">${esContactado ? 'Contactado' : 'No contactado'}</div>
            <div class="intento-fecha">${formatFecha(it.fecha)}</div>
          </div>
        </div>
      `;
    }
    if (n === siguiente && casoAbierto) {
      return `
        <div class="intento-fila intento-fila-pendiente">
          <div class="intento-num intento-num-pendiente">${n}</div>
          <div class="intento-info">
            <button class="btn secundario" style="width:100%;" onclick="registrarIntento('${caso.id_caso}', 'NO_CONTACTO', ${n})">No contactado</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="intento-fila" style="opacity:0.45;">
        <div class="intento-num intento-num-pendiente">${n}</div>
        <div class="intento-info">
          <div style="font-size:12px; color:#999;">Pendiente</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="background:white; border-radius:10px; border:1px solid #e0e0e0; padding:12px;">
      <h4 style="color:var(--azul-marino); font-size:13px; margin-bottom:8px;">Intentos de llamado</h4>
      ${filas}
    </div>
  `;
}

async function registrarIntento(idCaso, estado, numero) {
  const campoObs = document.getElementById(`obsIntento${numero}`);
  const obs = campoObs ? campoObs.value.trim() : '';
  try {
    await api(`/reagendamiento/${idCaso}/intentos`, {
      method: 'POST',
      body: JSON.stringify({ estado, observacion: obs || undefined })
    });
    abrirReagDetalle(idCaso);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function guardarObsDesdeDetalle(idCaso) {
  const obs = document.getElementById('obsDetalleReag').value.trim();
  if (!obs) { alert('Escribe una observación antes de guardar'); return; }
  try {
    await api(`/reagendamiento/${idCaso}/observacion`, { method: 'POST', body: JSON.stringify({ observacion: obs }) });
    abrirReagDetalle(idCaso);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function mostrarBloqueReagSegunLey() {
  const v = document.getElementById('reagLey').value;
  document.getElementById('reagBloqueSi').style.display = v === 'SI' ? 'block' : 'none';
  document.getElementById('reagBloqueNo').style.display = v === 'NO' ? 'block' : 'none';
}

async function guardarReagLeySi() {
  const rut = document.getElementById('reagRut').value.trim();
  const tipo = document.getElementById('reagTipoAtencion').value;
  const hora = document.getElementById('reagHoraAgendada').value;
  const obs = document.getElementById('reagObsLeySi').value.trim();
  if (!rut || !hora) { alert('Ingresa el RUT y la hora agendada'); return; }
  try {
    const caso = await api('/reagendamiento', {
      method: 'POST',
      body: JSON.stringify({ rut_paciente: rut, tipo_atencion: tipo, reagendamiento_ley: 'SI', hora_agendada: hora, observaciones: obs || undefined })
    });
    alert(`Caso ${caso.folio} cerrado correctamente.`);
    renderReagendamiento();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalSolicitud() {
  const rut = document.getElementById('reagRut').value.trim();
  if (!rut) { alert('Ingresa primero el RUT del paciente'); return; }
  document.getElementById('reagRutOculto').value = rut;
  document.getElementById('reagNombre').value = '';
  document.getElementById('reagCorreo').value = '';
  document.getElementById('reagTelefono').value = '';
  document.getElementById('reagAgenciaSolicitud').innerHTML = '<option value="">Selecciona una agencia</option>' +
    catalogoAgencias.map(a => `<option value="${a.id_agencia}">${a.nombre}</option>`).join('');
  document.getElementById('reagMotivo').value = '';
  // Restaurar visibilidad motivo en flujo normal ejecutivo
  const labelMotivoNorm = document.getElementById('reagMotivo').previousElementSibling;
  if (labelMotivoNorm && labelMotivoNorm.tagName === 'LABEL') labelMotivoNorm.style.display = '';
  document.getElementById('reagMotivo').style.display = '';
  document.getElementById('modalReagSolicitud').classList.add('activo');
}

async function guardarReagSolicitud() {
  const body = {
    rut_paciente: document.getElementById('reagRutOculto').value,
    tipo_atencion: document.getElementById('reagTipoAtencion').value,
    reagendamiento_ley: 'NO',
    nombre_paciente: document.getElementById('reagNombre').value.trim(),
    correo: document.getElementById('reagCorreo').value.trim(),
    telefono: document.getElementById('reagTelefono').value.trim(),
    id_agencia: Number(document.getElementById('reagAgenciaSolicitud').value) || undefined,
    motivo: document.getElementById('reagMotivo').value.trim()
  };
  if (!body.nombre_paciente || !body.id_agencia || !body.motivo) { alert('Completa nombre, agencia y motivo'); return; }
  try {
    const caso = await api('/reagendamiento', { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalReagSolicitud');
    alert(`Solicitud enviada. Folio: ${caso.folio}`);
    renderReagendamiento();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* ============================================================
   ESCALAR A AGENCIA — con script de correo, usando el folio ya creado
   ============================================================ */
function abrirEscalarConScript(idCaso) {
  idEscalarActual = idCaso;
  const caso = casosReagCache[idCaso];
  if (!caso) { alert('No se encontró el caso. Vuelve a la lista e intenta de nuevo.'); return; }

  const contenido = document.getElementById('contenido');
  document.getElementById('tituloVista').textContent = 'Confirmar sin cita — Escalar a agencia';

  contenido.innerHTML = `
    <button class="btn secundario" onclick="idReagDetalleActual = null; cargarVista('reagendamiento')" style="margin-bottom:16px;">← Volver a Reagendamiento</button>

    <div style="background:#fff3cd; border-left:5px solid #f0ad4e; border-radius:8px; padding:12px 16px; margin-bottom:16px; font-size:13px; color:#7a5c00; line-height:1.5;">
      Folio <b>${caso.folio}</b> — se confirma que no hay cita disponible y se deriva a la agencia indicada.
    </div>

    <div style="display:flex; gap:20px; flex-wrap:wrap;">
      <div style="flex:1; min-width:300px; background:white; border-radius:10px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <h3 style="color:var(--azul-marino); font-size:15px; margin-bottom:14px;">Datos del folio</h3>

        <table style="margin-bottom:14px;">
          <tbody>
            <tr><td><b>RUT</b></td><td>${caso.rut_paciente || '—'}</td></tr>
            <tr><td><b>Nombre</b></td><td>${caso.nombre_paciente || '—'}</td></tr>
            <tr><td><b>Teléfono</b></td><td>${caso.telefono || '—'}</td></tr>
            <tr><td><b>Tipo de atención</b></td><td>${etiquetaTipoAtencion(caso.tipo_atencion) || '—'}</td></tr>
          </tbody>
        </table>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Fecha cita original</label>
            <input type="date" id="escFecha" onchange="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Hora cita original</label>
            <input type="time" id="escHora" onchange="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <div style="margin-top:10px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Agencia a derivar</label>
          <select id="escAgencia" onchange="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
            <option value="">— Selecciona una agencia —</option>
            ${catalogoAgencias.map(a => `<option value="${a.id_agencia}" ${caso.id_agencia === a.id_agencia ? 'selected' : ''}>${a.nombre}</option>`).join('')}
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Ejecutivo/a Contact Center</label>
            <input type="text" id="escEjecutivo" placeholder="Tu nombre" value="${usuarioActual.nombre || ''}" oninput="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Nombre ejecutiva agencia (destinatario)</label>
            <input type="text" id="escDest" placeholder="Nombre de quien recibe" oninput="actualizarScriptEscalar()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:13px;">
          </div>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px; border-top:1px solid #eee; padding-top:14px;">
          <button class="btn secundario" onclick="idReagDetalleActual = null; cargarVista('reagendamiento')">Cancelar</button>
          <button class="btn" onclick="guardarEscalarConScript('${caso.id_caso}')">Escalar (SLA 24h)</button>
        </div>
      </div>

      <div style="flex:1; min-width:280px;">
        <div style="background:white; border:1px solid var(--turquesa); border-radius:10px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,.08);">
          <h3 style="color:var(--azul-marino); font-size:14px; margin-bottom:10px;">✉ Script de correo</h3>
          <div style="background:#f4f6f8; border-radius:6px; padding:8px 10px; font-size:12px; margin-bottom:8px;">
            <span style="font-weight:700; color:var(--azul-marino);">Asunto:</span> Derivación reagendamiento paciente STP – gestión local
          </div>
          <div id="scriptCorreoEscalar" style="background:#f9f9f9; border:1px solid #e5e5e5; border-radius:6px; padding:10px 12px; font-size:12px; color:#333; line-height:1.6; white-space:pre-wrap; font-family:inherit;"></div>
          <button class="btn secundario" style="margin-top:8px; width:100%;" onclick="copiarScriptCorreoEscalar()">Copiar correo</button>
        </div>
      </div>
    </div>
  `;

  actualizarScriptEscalar();
}

function actualizarScriptEscalar() {
  const el = document.getElementById('scriptCorreoEscalar');
  if (!el) return;
  const caso = casosReagCache[idEscalarActual] || {};

  const v = id => { const e = document.getElementById(id); return e ? e.value.trim() || '…' : '…'; };
  const fechaRaw = document.getElementById('escFecha') ? document.getElementById('escFecha').value : '';
  let fecha = '…';
  if (fechaRaw) {
    const d = new Date(fechaRaw + 'T12:00:00');
    fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  const hora = document.getElementById('escHora') ? (document.getElementById('escHora').value || '…') : '…';
  const agenciaEl = document.getElementById('escAgencia');
  const agencia = agenciaEl && agenciaEl.value ? agenciaEl.options[agenciaEl.selectedIndex].text : '…';
  const tipo = etiquetaTipoAtencion(caso.tipo_atencion) || '…';

  el.textContent = `Hola ${v('escDest')}:

Derivamos solicitud de reagendamiento de paciente STP, ya que desde Contact Center no fue posible encontrar disponibilidad dentro de los próximos 3 días hábiles.

Paciente: ${caso.nombre_paciente || '…'}
RUT: ${caso.rut_paciente || '…'}
Teléfono: ${caso.telefono || '…'}
Cita original: ${tipo} – ${fecha} – ${hora}
Centro / Agencia: ${agencia}
Motivo informado: ${caso.motivo || '…'}

Se solicita revisar alternativas de agenda de manera local y contactar al paciente directamente para informar la nueva fecha, priorizando la continuidad de su tratamiento.

Saludos,
${v('escEjecutivo')}`;
}

function copiarScriptCorreoEscalar() {
  const el = document.getElementById('scriptCorreoEscalar');
  if (!el) return;
  const asunto = 'Asunto: Derivación reagendamiento paciente STP – gestión local';
  const texto = asunto + '\n\n' + el.textContent;
  navigator.clipboard.writeText(texto)
    .then(() => { alert('Correo copiado al portapapeles.'); })
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = texto; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      alert('Correo copiado al portapapeles.');
    });
}

async function guardarEscalarConScript(idCaso) {
  const idAgencia = Number(document.getElementById('escAgencia').value);
  if (!idAgencia) { alert('Selecciona una agencia'); return; }
  try {
    await api(`/reagendamiento/${idCaso}/escalar`, { method: 'POST', body: JSON.stringify({ id_agencia: idAgencia }) });
    alert('Caso escalado a agencia correctamente.');
    idReagDetalleActual = null;
    cargarVista('reagendamiento');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalContactadoAgenda(idCaso) {
  document.getElementById('reagContactadoAgendaId').value = idCaso;
  document.getElementById('reagContactadoAgendaHora').value = '';
  document.getElementById('reagContactadoAgendaObservacion').value = '';
  document.getElementById('modalReagContactadoAgenda').classList.add('activo');
}

async function guardarReagContactadoAgenda() {
  const id = document.getElementById('reagContactadoAgendaId').value;
  const hora = document.getElementById('reagContactadoAgendaHora').value;
  const obs = document.getElementById('reagContactadoAgendaObservacion').value.trim();
  if (!hora) { alert('Ingresa la fecha y hora agendada'); return; }
  try {
    await api(`/reagendamiento/${id}/contactado-agenda`, {
      method: 'POST',
      body: JSON.stringify({ hora_agendada: hora, observacion: obs || undefined })
    });
    cerrarModal('modalReagContactadoAgenda');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalContactadoNoAgenda(idCaso) {
  document.getElementById('reagContactadoNoAgendaId').value = idCaso;
  document.getElementById('reagContactadoNoAgendaObservacion').value = '';
  document.getElementById('modalReagContactadoNoAgenda').classList.add('activo');
}

async function guardarReagContactadoNoAgenda() {
  const id = document.getElementById('reagContactadoNoAgendaId').value;
  const obs = document.getElementById('reagContactadoNoAgendaObservacion').value.trim();
  if (!obs) { alert('Ingresa el motivo por el que no agenda cita'); return; }
  try {
    await api(`/reagendamiento/${id}/contactado-no-agenda`, {
      method: 'POST',
      body: JSON.stringify({ observacion: obs })
    });
    cerrarModal('modalReagContactadoNoAgenda');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRechazar(idCaso) {
  document.getElementById('reagRechazarId').value = idCaso;
  document.getElementById('reagRechazarHora').value = '';
  document.getElementById('reagRechazarObservacion').value = '';
  document.getElementById('modalReagRechazar').classList.add('activo');
}

async function guardarReagRechazo() {
  const id = document.getElementById('reagRechazarId').value;
  const hora = document.getElementById('reagRechazarHora').value;
  const obs = document.getElementById('reagRechazarObservacion').value.trim();
  if (!hora) { alert('Ingresa la hora agendada'); return; }
  try {
    await api(`/reagendamiento/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ hora_agendada: hora, observacion: obs || undefined }) });
    cerrarModal('modalReagRechazar');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRechazarMalIngreso(idCaso) {
  document.getElementById('reagMalIngresoId').value = idCaso;
  document.getElementById('reagMalIngresoMotivo').value = '';
  document.getElementById('modalReagRechazarMalIngreso').classList.add('activo');
}

async function guardarReagRechazoMalIngreso() {
  const id = document.getElementById('reagMalIngresoId').value;
  const motivo = document.getElementById('reagMalIngresoMotivo').value;
  if (!motivo) { alert('Selecciona el motivo del mal ingreso'); return; }
  try {
    await api(`/reagendamiento/${id}/rechazar-mal-ingreso`, { method: 'POST', body: JSON.stringify({ motivo_rechazo_mal_ingreso: motivo }) });
    cerrarModal('modalReagRechazarMalIngreso');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRechazarMalDerivado(idCaso) {
  document.getElementById('reagMalDerivadoId').value = idCaso;
  document.getElementById('reagMalDerivadoSubMotivo').value = '';
  document.getElementById('reagMalDerivadoHora').value = '';
  document.getElementById('reagMalDerivadoObservacion').value = '';
  document.getElementById('modalReagRechazarMalDerivado').classList.add('activo');
}

async function guardarReagRechazoMalDerivado() {
  const id = document.getElementById('reagMalDerivadoId').value;
  const subMotivo = document.getElementById('reagMalDerivadoSubMotivo').value;
  const hora = document.getElementById('reagMalDerivadoHora').value;
  const obs = document.getElementById('reagMalDerivadoObservacion').value.trim();
  if (!subMotivo) { alert('Selecciona el sub-motivo'); return; }
  if (!hora) { alert('Ingresa la fecha y hora de la cita reagendada'); return; }
  try {
    await api(`/reagendamiento/${id}/rechazar-mal-derivado`, {
      method: 'POST',
      body: JSON.stringify({ sub_motivo: subMotivo, hora_agendada: hora, observacion: obs || undefined })
    });
    cerrarModal('modalReagRechazarMalDerivado');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalEditarDatos(idCaso) {
  const caso = casosReagCache[idCaso];
  if (!caso) return;
  document.getElementById('reagEditarId').value = idCaso;
  document.getElementById('reagEditarRut').value = caso.rut_paciente || '';
  document.getElementById('reagEditarNombre').value = caso.nombre_paciente || '';
  document.getElementById('reagEditarCorreo').value = caso.correo || '';
  document.getElementById('reagEditarTelefono').value = caso.telefono || '';
  document.getElementById('reagEditarTipoAtencion').value = caso.tipo_atencion || 'CONTROL';
  document.getElementById('reagEditarAgencia').innerHTML = '<option value="">Selecciona una agencia</option>' +
    catalogoAgencias.map(a => `<option value="${a.id_agencia}" ${caso.id_agencia === a.id_agencia ? 'selected' : ''}>${a.nombre}</option>`).join('');
  document.getElementById('reagEditarMotivo').value = caso.motivo || '';
  document.getElementById('modalReagEditarDatos').classList.add('activo');
}

async function guardarReagEditarDatos() {
  const id = document.getElementById('reagEditarId').value;
  const body = {
    rut_paciente: document.getElementById('reagEditarRut').value.trim(),
    nombre_paciente: document.getElementById('reagEditarNombre').value.trim(),
    correo: document.getElementById('reagEditarCorreo').value.trim(),
    telefono: document.getElementById('reagEditarTelefono').value.trim(),
    tipo_atencion: document.getElementById('reagEditarTipoAtencion').value,
    id_agencia: Number(document.getElementById('reagEditarAgencia').value) || undefined,
    motivo: document.getElementById('reagEditarMotivo').value.trim()
  };
  if (!body.rut_paciente || !body.tipo_atencion) { alert('El RUT y el tipo de atención son obligatorios'); return; }
  try {
    await api(`/reagendamiento/${id}/editar-datos`, { method: 'PUT', body: JSON.stringify(body) });
    cerrarModal('modalReagEditarDatos');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalRespuesta(idCaso) {
  document.getElementById('reagRespuestaId').value = idCaso;
  document.getElementById('reagRespuestaTipificacion').value = '';
  document.getElementById('reagRespuestaTexto').value = '';
  document.getElementById('reagRespuestaSeAgendo').value = '';
  document.getElementById('reagRespuestaFechaHora').value = '';
  document.getElementById('bloqueRespuestaFecha').style.display = 'none';
  document.getElementById('tituloModalRespuesta').textContent = 'Registrar respuesta primera línea';
  document.getElementById('modalReagRespuesta').classList.add('activo');
}

function mostrarBloqueRespuestaSegunAgendo() {
  const v = document.getElementById('reagRespuestaSeAgendo').value;
  document.getElementById('bloqueRespuestaFecha').style.display = v === 'SI' ? 'block' : 'none';
}

async function guardarReagRespuesta() {
  const id = document.getElementById('reagRespuestaId').value;
  const tipificacion = document.getElementById('reagRespuestaTipificacion').value;
  const resultado = document.getElementById('reagRespuestaTexto').value.trim();
  const seAgendo = document.getElementById('reagRespuestaSeAgendo').value;
  const fechaHora = document.getElementById('reagRespuestaFechaHora').value;
  if (!tipificacion) { alert('Selecciona la tipificación de contacto'); return; }
  if (!seAgendo) { alert('Indica si se agendó la cita'); return; }
  if (seAgendo === 'SI' && !fechaHora) { alert('Ingresa la fecha y hora del agendamiento'); return; }
  try {
    await api(`/reagendamiento/${id}/respuesta-agencia`, {
      method: 'POST',
      body: JSON.stringify({ tipificacion, resultado: resultado || undefined, se_agendo: seAgendo, hora_agendada: seAgendo === 'SI' ? fechaHora : undefined })
    });
    cerrarModal('modalReagRespuesta');
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function barraProporcion(valorA, valorB, etiquetaA, etiquetaB) {
  const total = valorA + valorB || 1;
  const pctA = ((valorA / total) * 100).toFixed(0);
  const pctB = ((valorB / total) * 100).toFixed(0);
  return `
    <div style="display:flex; height:28px; border-radius:6px; overflow:hidden; margin-bottom:10px;">
      <div style="width:${pctA}%; background:var(--verde); display:flex; align-items:center; justify-content:center; color:white; font-size:11px;">${pctA}%</div>
      <div style="width:${pctB}%; background:var(--amarillo); display:flex; align-items:center; justify-content:center; color:white; font-size:11px;">${pctB}%</div>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:12px;">
      <span><span style="display:inline-block; width:10px; height:10px; background:var(--verde); border-radius:2px; margin-right:4px;"></span>${etiquetaA} (${valorA})</span>
      <span><span style="display:inline-block; width:10px; height:10px; background:var(--amarillo); border-radius:2px; margin-right:4px;"></span>${etiquetaB} (${valorB})</span>
    </div>
  `;
}

function graficoBarrasAgencias(porAgencia) {
  if (!porAgencia || porAgencia.length === 0) return '<p style="color:#999; font-size:12px;">Sin datos aún.</p>';
  const max = Math.max(...porAgencia.map(a => a.total), 1);
  return porAgencia.map(a => `
    <div style="margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;">
        <span>${a.agencia}</span><span><b>${a.total}</b></span>
      </div>
      <div style="background:#eee; border-radius:4px; height:12px;">
        <div style="width:${(a.total / max) * 100}%; background:var(--turquesa); height:12px; border-radius:4px;"></div>
      </div>
    </div>
  `).join('');
}

async function exportarReagExcel() {
  mostrarCargandoGlobal();
  try {
    const res = await fetch(`${API_BASE}/reagendamiento/reportes/exportar-excel`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudo generar el reporte');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Reagendamiento_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error al generar el reporte: ' + err.message);
  } finally {
    ocultarCargandoGlobal();
  }
}

async function cerrarReagFinal(idCaso) {
  if (!confirm('¿Confirmas el cierre de este caso tras revisar la respuesta de la agencia?')) return;
  try {
    await api(`/reagendamiento/${idCaso}/cerrar-final`, { method: 'POST' });
    if (idReagDetalleActual) { abrirReagDetalle(idReagDetalleActual); } else { renderReagendamiento(); }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* ============================================================
   MODAL: CONTACTADO — Resolver sin derivar a agencia (EN_PROCESO_BACK)
   ============================================================ */
function abrirModalContactadoBackend(idCaso) {
  document.getElementById('contactadoBackendIdCaso').value = idCaso;
  document.getElementById('contactadoBackendFecha').value = new Date().toISOString().slice(0,10);
  document.getElementById('contactadoBackendResultado').value = '';
  document.getElementById('contactadoBackendObservaciones').value = '';
  document.getElementById('modalContactadoBackend').classList.add('activo');
}

async function guardarContactadoBackend() {
  const idCaso = document.getElementById('contactadoBackendIdCaso').value;
  const fecha = document.getElementById('contactadoBackendFecha').value;
  const resultado = document.getElementById('contactadoBackendResultado').value.trim();
  const observaciones = document.getElementById('contactadoBackendObservaciones').value.trim();

  if (!resultado) {
    alert('Ingresa el resultado del contacto');
    return;
  }

  try {
    const body = {
      fecha,
      resultado,
      observaciones: observaciones || undefined
    };
    await api(`/reagendamiento/${idCaso}/contactado-backend`, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    });
    cerrarModal('modalContactadoBackend');
    if (idReagDetalleActual) {
      abrirReagDetalle(idReagDetalleActual);
    } else {
      renderReagendamiento();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function cambiarTabFolio(tab) {
  const esReabrir = tab === 'reabrir';
  document.getElementById('panelReabrir').style.display = esReabrir ? 'block' : 'none';
  document.getElementById('panelAnular').style.display = esReabrir ? 'none' : 'block';
  document.getElementById('tabReabrir').style.background = esReabrir ? 'var(--turquesa)' : 'white';
  document.getElementById('tabReabrir').style.color = esReabrir ? 'white' : '#555';
  document.getElementById('tabReabrir').style.borderColor = esReabrir ? 'var(--turquesa)' : '#ccc';
  document.getElementById('tabAnular').style.background = esReabrir ? 'white' : 'var(--rojo)';
  document.getElementById('tabAnular').style.color = esReabrir ? '#555' : 'white';
  document.getElementById('tabAnular').style.borderColor = esReabrir ? '#ccc' : 'var(--rojo)';
}

function abrirModalReabrirFolio(idCaso) {
  document.getElementById('reabrirFolioId').value = idCaso;
  document.getElementById('reabrirPassword').value = '';
  document.getElementById('reabrirMotivo').value = '';
  document.getElementById('anularPassword').value = '';
  document.getElementById('anularMotivo').value = '';
  cambiarTabFolio('reabrir');
  document.getElementById('modalReabrirFolio').classList.add('activo');
}

async function guardarReabrirFolio() {
  const id = document.getElementById('reabrirFolioId').value;
  const password = document.getElementById('reabrirPassword').value;
  const motivo = document.getElementById('reabrirMotivo').value.trim();
  if (!password) { alert('Ingresa tu contraseña'); return; }
  if (!motivo) { alert('Ingresa el motivo de la reapertura'); return; }
  try {
    await api(`/reagendamiento/${id}/reabrir`, {
      method: 'POST',
      body: JSON.stringify({ password, motivo })
    });
    cerrarModal('modalReabrirFolio');
    alert('Folio reabierto correctamente. Vuelve a Pendiente de revisión.');
    idReagDetalleActual = null;
    cargarVista('reagendamiento');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function guardarAnularFolio() {
  const id = document.getElementById('reabrirFolioId').value;
  const password = document.getElementById('anularPassword').value;
  const motivo = document.getElementById('anularMotivo').value.trim();
  if (!password) { alert('Ingresa tu contraseña'); return; }
  if (!motivo) { alert('Ingresa el motivo de la anulación'); return; }
  try {
    await api(`/reagendamiento/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify({ password, motivo })
    });
    cerrarModal('modalReabrirFolio');
    alert('Folio anulado. Pasó al historial como Anulado.');
    idReagDetalleActual = null;
    cargarVista('reagendamiento');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirReagModalNuevaAgencia() {
  const nombre = prompt('Nombre de la nueva agencia:');
  if (!nombre) return;
  api('/reagendamiento/agencias', { method: 'POST', body: JSON.stringify({ nombre }) })
    .then(() => { cargarCatalogoAgencias().then(renderReagendamiento); })
    .catch(err => alert('Error: ' + err.message));
}

async function importarExcelBot(event) {
  const archivo = event.target.files[0];
  if (!archivo) return;
  event.target.value = '';
  const resultado = document.getElementById('botImportarResultado');
  resultado.innerHTML = '<div style="color:#534AB7; font-size:13px;">⏳ Leyendo archivo...</div>';

  try {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error('Librería XLSX no disponible. Recarga la página e intenta de nuevo.');

    const buf = await archivo.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });

    if (!filas.length) { resultado.innerHTML = '<div style="color:red;">El archivo está vacío.</div>'; return; }

    /* ---------- RUT: agrega el guion antes del último dígito ---------- */
    function normalizarRut(r) {
      if (!r) return '';
      let limpio = String(r).replace(/[.\s-]/g, '').toUpperCase();
      if (limpio.length < 2) return limpio;
      const cuerpo = limpio.slice(0, -1);
      const dv = limpio.slice(-1);
      return `${cuerpo}-${dv}`;
    }

    function normalizarTelefono(t) {
      if (!t) return '';
      let s = String(t).replace(/\D/g,'');
      if (s.startsWith('56')) s = s.slice(2);
      return '+56' + s;
    }

    /* ---------- Agencia: ignora tildes y mayúsculas al comparar ---------- */
    function normalizarTextoAgencia(t) {
      return String(t || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita tildes
        .replace(/^AGENCIA\s+/i, '')     // quita el prefijo "Agencia " si lo tuviera
        .trim()
        .toUpperCase();
    }

    function buscarAgencia(centro) {
      if (!centro) return undefined;
      const centroNormalizado = normalizarTextoAgencia(centro);
      for (const a of catalogoAgencias) {
        if (normalizarTextoAgencia(a.nombre) === centroNormalizado) return a.id_agencia;
      }
      // si no hay match exacto, intenta por coincidencia parcial (por si el nombre viene con texto extra)
      for (const a of catalogoAgencias) {
        const nombreAgenciaNorm = normalizarTextoAgencia(a.nombre);
        if (nombreAgenciaNorm.includes(centroNormalizado) || centroNormalizado.includes(nombreAgenciaNorm)) {
          return a.id_agencia;
        }
      }
      return undefined;
    }

    let ok = 0, errores = [];
    resultado.innerHTML = `<div style="color:#534AB7; font-size:13px;">⏳ Importando ${filas.length} filas...</div>`;

    for (const fila of filas) {
      const rut = normalizarRut(fila['rut_paciente_normalizado'] || fila['rut_paciente']);
      if (!rut) { errores.push('Fila sin RUT'); continue; }

      /* ---------- Tipo de atención: ENFERMERIA → Curación, resto → Control ---------- */
      const unidadTratamiento = String(fila['unidad_de_tratamiento'] || fila['tipo_cita'] || '').toUpperCase().trim();
      const tipo = unidadTratamiento.includes('ENFERMERIA') || unidadTratamiento.includes('ENFERMERÍA')
        ? 'CURACIÓN'
        : 'CONTROL';

      const centro = fila['centro_medico'] || '';
      const id_agencia = buscarAgencia(centro);
      const body = {
        rut_paciente: rut,
        nombre_paciente: String(fila['nombre_paciente'] || '').trim(),
        telefono: normalizarTelefono(fila['telefono_paciente']),
        tipo_atencion: tipo,
        reagendamiento_ley: 'NO',
        id_agencia,
        motivo: 'Paciente rechazó cita vía Callbot',
        origen: 'BOT',
        ingresado_bot: true
      };
      try {
        await api('/reagendamiento', { method: 'POST', body: JSON.stringify(body) });
        ok++;
      } catch (e) {
        errores.push(`${rut}: ${e.message}`);
      }
    }

    const color = errores.length ? '#f0ad4e' : '#00A86B';
    resultado.innerHTML = `
      <div style="background:white; border:1px solid ${color}; border-left:4px solid ${color}; border-radius:8px; padding:12px 14px; font-size:13px;">
        <b>${ok} folio${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''} correctamente</b>
        ${errores.length ? `<br><span style="color:#a32d2d;">${errores.length} con error: ${errores.slice(0,3).join('; ')}${errores.length > 3 ? '…' : ''}</span>` : ''}
      </div>`;
    if (ok > 0) setTimeout(renderReagendamiento, 1500);
  } catch (err) {
    resultado.innerHTML = `<div style="color:red; font-size:13px;">Error: ${err.message}</div>`;
  }
}
