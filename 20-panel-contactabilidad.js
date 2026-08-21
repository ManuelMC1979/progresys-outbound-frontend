/* ============================================================
   PANEL DE CONTACTABILIDAD
   Portado desde panel_contactabilidad_v24.html (herramienta standalone).
   Datos persistidos en la base de datos vía /api/contactabilidad (antes
   vivían solo en localStorage del navegador).
   ============================================================ */

const PC_HTML = `
<div class="pc-view" id="pc-view-root">
<div class="pc-shell">
<div class="sidebar">
  <div class="sidebar-logo">
    <h1>PANEL DE<br>CONTACTABILIDAD</h1>
    <p>Sistema de Control</p>
  </div>
  <nav>
    <div class="nav-section">Resumen</div>
    <div class="nav-item active" onclick="PC.showPage('dashboard')"><span class="icon">◈</span> Dashboard</div>
    <div class="nav-section">Análisis</div>
    <div class="nav-item" onclick="PC.showPage('individual')"><span class="icon">▤</span> Por Ejecutivo</div>
    <div class="nav-item" onclick="PC.showPage('proceso')"><span class="icon">◉</span> Por Proceso</div>
    <div class="nav-item" onclick="PC.showPage('diario')"><span class="icon">◷</span> Análisis Diario</div>
    <div class="nav-item" onclick="PC.showPage('semanal')"><span class="icon">◫</span> Análisis Semanal</div>
    <div class="nav-item" onclick="PC.showPage('carga')"><span class="icon">▦</span> Carga por Ejecutivo</div>
    <div class="nav-item" onclick="PC.showPage('alertas')"><span class="icon">⚠</span> Alertas Retraso <span class="nav-badge" id="nav-delay-badge"></span></div>
    <div class="nav-section">Datos</div>
    <div class="nav-item" onclick="PC.showPage('base')"><span class="icon">▣</span> Base de Datos</div>
    <div class="nav-item" onclick="PC.showPage('configuracion')"><span class="icon">◎</span> Configuración</div>
  </nav>
  <div class="sidebar-footer"><span id="total-records-footer">— registros</span></div>
</div>

<div class="pc-main">
  <div class="topbar">
    <h2 id="page-title">Dashboard</h2>
    <div class="topbar-right">
      <button class="theme-toggle" id="theme-btn" onclick="PC.toggleTheme()">🌙 Oscuro</button>
      <span class="badge" id="topbar-meta">META 85%</span>
      <span class="badge" id="topbar-date"></span>
    </div>
  </div>

  <!-- DASHBOARD -->
  <div id="page-dashboard" class="content page">
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="btn" onclick="PC.openTeamsReport()" style="background:rgba(98,100,167,0.18);border-color:rgba(98,100,167,0.5);color:#a8aaff;font-size:12px;display:flex;align-items:center;gap:8px;padding:9px 18px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><rect x="2" y="5" width="14" height="14" rx="3" fill="rgba(98,100,167,0.5)" stroke="#a8aaff" stroke-width="1.5"/><path d="M16 9h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3" stroke="#a8aaff" stroke-width="1.5"/><circle cx="17.5" cy="6.5" r="2" fill="#a8aaff"/></svg>
        📋 Generar Reporte Teams
      </button>
    </div>
    <div id="delay-panel-dash"></div>
    <div class="kpi-grid" id="kpi-grid"></div>
    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="card-head"><span class="card-title">Contactabilidad Global</span></div>
        <div class="gauge-wrap">
          <div class="gauge-pct" id="dash-pct-main">—</div>
          <div class="gauge-label">% Contactabilidad</div>
          <div class="meta-line" id="dash-meta-line">—</div>
        </div>
        <div class="kpi-bar" style="margin-top:16px"><div class="kpi-bar-fill" id="dash-global-bar" style="width:0%"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:10px;font-family:'DM Mono',monospace;color:var(--muted)">
          <span>0%</span><span style="color:var(--warn)">META 85%</span><span>100%</span>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Distribución de Estados</span></div>
        <div class="donut-wrap" id="donut-wrap"></div>
      </div>
    </div>
    <div class="section-title">Rendimiento por Ejecutivo</div>
    <div class="card" style="margin-bottom:20px">
      <div class="table-wrap"><table class="rend-table" id="rend-table-dash">
        <thead><tr>
          <th>Ejecutivo</th>
          <th>Contactados</th>
          <th>% Contactabilidad</th>
          <th>Cumple Meta</th>
        </tr></thead>
        <tbody id="rend-tbody-dash"></tbody>
      </table></div>
    </div>
  </div>

  <!-- INDIVIDUAL -->
  <div id="page-individual" class="content page hidden">
    <div class="filters">
      <select id="fi-ejecutivo" onchange="PC.renderIndividual()"><option value="">Todos los ejecutivos</option></select>
      <select id="fi-proceso" onchange="PC.renderIndividual()"><option value="">Todos los procesos</option></select>
    </div>
    <div class="kpi-grid" id="ind-kpi-grid"></div>
    <div class="card">
      <div class="card-head"><span class="card-title">Detalle por Ejecutivo</span></div>
      <div class="table-wrap">
        <table><thead><tr><th>Ejecutivo</th><th>Contactados</th><th>No Contactados</th><th>Total Trabajados</th><th>% Contactabilidad</th><th>Cumple Meta</th></tr></thead>
        <tbody id="ind-tbody"></tbody></table>
      </div>
    </div>
    <div style="margin-top:20px" class="card">
      <div class="card-head"><span class="card-title">Gráfico por Ejecutivo</span></div>
      <div class="chart-bar-container" id="ind-chart"></div>
    </div>
  </div>

  <!-- PROCESO -->
  <div id="page-proceso" class="content page hidden">
    <div class="filters">
      <select id="fp-ejecutivo" onchange="PC.renderProceso()"><option value="">Todos los ejecutivos</option></select>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-head"><span class="card-title">Resumen por Proceso</span></div>
      <div class="table-wrap">
        <table><thead><tr><th>Proceso</th><th>Total Casos</th><th>Contactados</th><th>No Contactados</th><th>% Contactabilidad</th><th>Meta</th></tr></thead>
        <tbody id="proc-tbody"></tbody></table>
      </div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-head"><span class="card-title">Por Ejecutivo y Proceso</span></div>
      <div class="table-wrap">
        <table><thead><tr><th>Ejecutivo</th><th>Correos Gestionados</th><th>Pendientes Hoy</th><th>Total Casos</th><th>% Gestionados</th></tr></thead>
        <tbody id="proc-exec-tbody"></tbody></table>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><span class="card-title">&#x1F4CB; Gestionados Hoy</span><span id="proc-gest-hoy-badge" style="font-size:11px;color:var(--accent2);font-family:'DM Mono',monospace"></span></div>
        <div class="table-wrap" style="max-height:320px;overflow-y:auto"><table><thead><tr><th>Ejecutivo</th><th>Proceso</th><th>RUT</th><th>Nombre Gesti&#xF3;n</th><th>Estado</th></tr></thead><tbody id="proc-gest-hoy-tbody"></tbody></table></div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">&#x23F3; Pendientes Hoy</span><span id="proc-pend-hoy-badge" style="font-size:11px;color:var(--warn);font-family:'DM Mono',monospace"></span></div>
        <div class="table-wrap" style="max-height:320px;overflow-y:auto"><table><thead><tr><th>Ejecutivo</th><th>RUT</th><th>Nombre Gesti&#xF3;n</th></tr></thead><tbody id="proc-pend-hoy-tbody"></tbody></table></div>
      </div>
    </div>
  </div>

  <!-- DIARIO -->
  <div id="page-diario" class="content page hidden">
    <div class="filters">
      <input type="date" id="fd-desde" onchange="PC.renderDiario()">
      <input type="date" id="fd-hasta" onchange="PC.renderDiario()">
      <button class="btn secondary" onclick="document.getElementById('fd-desde').value='';document.getElementById('fd-hasta').value='';PC.renderDiario()">Limpiar</button>
    </div>
    <div class="kpi-grid" id="dia-kpi-grid"></div>
    <div class="card">
      <div class="card-head"><span class="card-title">Detalle por Fecha</span></div>
      <div class="table-wrap">
        <table><thead><tr><th>Fecha</th><th>Total Registros</th><th>Contactados</th><th>No Contactados</th><th>% Contactabilidad</th><th>Cumple Meta</th></tr></thead>
        <tbody id="dia-tbody"></tbody></table>
      </div>
    </div>
    <div style="margin-top:20px" class="card">
      <div class="card-head"><span class="card-title">Tendencia Diaria</span></div>
      <div class="chart-bar-container" id="dia-chart"></div>
    </div>
  </div>

  <!-- SEMANAL -->
  <div id="page-semanal" class="content page hidden">
    <div class="card" style="margin-bottom:20px">
      <div class="card-head"><span class="card-title">Resumen Semanal</span></div>
      <div class="table-wrap">
        <table><thead><tr><th>Semana</th><th>Período</th><th>Total Registros</th><th>Contactados</th><th>No Contactados</th><th>% Contactabilidad</th><th>Cumple Meta</th></tr></thead>
        <tbody id="sem-tbody"></tbody></table>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Contactabilidad por Semana</span></div>
      <div class="chart-bar-container" id="sem-chart"></div>
    </div>
  </div>

  <!-- CARGA -->
  <div id="page-carga" class="content page hidden">
    <div class="filters">
      <select id="fc-ejecutivo" onchange="PC.renderCarga()"><option value="">Todos los ejecutivos</option></select>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">RUTs Trabajados por Ejecutivo por Día</span></div>
      <div class="table-wrap">
        <table id="carga-table"><thead id="carga-thead"></thead><tbody id="carga-tbody"></tbody></table>
      </div>
    </div>
  </div>

  <!-- ALERTAS RETRASO -->
  <div id="page-alertas" class="content page hidden">
    <div class="kpi-grid" id="alerta-kpi-grid"></div>
    <div class="filters">
      <select id="fa-ejecutivo" onchange="PC.renderAlertas()"><option value="">Todos los ejecutivos</option></select>
      <select id="fa-dias" onchange="PC.renderAlertas()">
        <option value="">Todos los retrasos</option>
        <option value="1">1 día</option>
        <option value="2">2 días</option>
        <option value="3">3+ días</option>
      </select>
    </div>
    <div class="card">
      <div class="card-head">
        <span class="card-title">Casos Pendientes con Retraso</span>
        <span id="alerta-total-badge" style="font-size:11px;color:var(--warn);font-family:'DM Mono',monospace"></span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Ejecutivo</th>
            <th>Nombre Gestión</th>
            <th>RUT Paciente</th>
            <th>Fecha Registro</th>
            <th>Días Retraso</th>
            <th>Tipo Cita</th>
          </tr></thead>
          <tbody id="alerta-tbody"></tbody>
        </table>
      </div>
      <div class="pagination" id="alerta-pagination"></div>
    </div>
  </div>

  <!-- BASE DE DATOS -->
  <div id="page-base" class="content page hidden">
    <div class="filters">
      <input type="text" id="fb-search" placeholder="Buscar RUT, ejecutivo, gestión..." oninput="PC.renderBase()" style="min-width:250px">
      <select id="fb-estado" onchange="PC.renderBase()"><option value="">Todos los estados</option></select>
      <select id="fb-ejecutivo" onchange="PC.renderBase()"><option value="">Todos los ejecutivos</option></select>
      <select id="fb-proceso" onchange="PC.renderBase()"><option value="">Todos los procesos</option></select>
      <select id="fb-tipo" onchange="PC.renderBase()"><option value="">Todos los tipos</option></select>
      <button class="btn success" onclick="PC.openAddModal()">+ Nuevo Registro</button>
      <button class="btn" onclick="PC.openBulkModal()" style="background:rgba(0,255,157,0.08);border-color:rgba(0,255,157,0.35);color:var(--accent2)">⬆ Carga Masiva</button>
      <button class="btn secondary" onclick="PC.exportCSV()">↓ Exportar CSV</button>
      <button class="btn" onclick="PC.startNewMonth()" style="background:rgba(255,107,53,0.1);border-color:rgba(255,107,53,0.35);color:var(--warn)" title="Traslada los RUT no gestionados al nuevo mes y elimina el resto">🔄 Iniciar Nuevo Mes</button>
      <button class="btn" onclick="PC.openTurnosModal()" style="background:rgba(0,212,255,0.08);border-color:rgba(0,212,255,0.35);color:var(--accent)" title="Configura el turno semanal de cada ejecutivo">🕐 Turnos Semanales</button>
      <button class="btn" onclick="PC.openCalendarioModal()" style="background:rgba(155,89,182,0.1);border-color:rgba(155,89,182,0.35);color:#9b59b6" title="Calendario mensual completo de turnos, editable">📅 Calendario Mensual</button>
      <button class="btn danger" onclick="PC.clearAllRecords()" title="Eliminar todos los registros para empezar un nuevo mes">🗑 Limpiar Todo</button>
    </div>
    <!-- BARRA DE ACCIÓN MASIVA -->
    <div class="bulk-bar" id="bulk-action-bar">
      <span class="bulk-bar-count" id="bulk-selected-count">0 seleccionados</span>
      <input type="date" id="bulk-fecha-sel" style="min-width:150px" title="Cambiar Fecha">
      <div class="bulk-bar-sep"></div>
      <select id="bulk-estado-sel" style="min-width:160px" onchange="PC.syncBulkBarContactado()">
        <option value="">— Cambiar Estado —</option>
        <option value="CONTACTADO">CONTACTADO</option>
        <option value="NO CONTACTADO">NO CONTACTADO</option>
      </select>
      <select id="bulk-contactado-sel" style="min-width:200px">
        <option value="">— Cambiar Contactado —</option>
        <option value="CONFIRMA CITA">CONFIRMA CITA</option>
        <option value="NO CONFIRMA CITA">NO CONFIRMA CITA</option>
        <option value="NO CONTESTA">NO CONTESTA</option>
        <option value="NO DISPONIBLE">NO DISPONIBLE</option>
        <option value="NUMERO EQUIVOCADO">NUMERO EQUIVOCADO</option>
        <option value="NO CONTACTADO">NO CONTACTADO</option>
      </select>
      <select id="bulk-proceso-sel" style="min-width:180px">
        <option value="">— Cambiar Proceso —</option>
      </select>
      <select id="bulk-ejecutivo-sel" style="min-width:200px">
        <option value="">— Cambiar Ejecutivo —</option>
      </select>
      <select id="bulk-tipo-sel" style="min-width:180px" title="Corregir Tipo de Cita en forma masiva">
        <option value="">— Cambiar Tipo Cita —</option>
        <option value="BLOQUEO">BLOQUEO</option>
        <option value="CUENTAS CORRIENTES">CUENTAS CORRIENTES</option>
        <option value="PENSION">PENSION</option>
      </select>
      <button class="btn success" onclick="PC.applyBulkEdit()">✔ Aplicar a Seleccionados</button>
      <div class="bulk-bar-sep"></div>
      <button class="btn danger" onclick="PC.deleteBulkSelected()" style="font-size:11px">🗑 Eliminar Seleccionados</button>
      <button class="btn secondary" onclick="PC.deselectAll()" style="font-size:11px">✕ Limpiar selección</button>
    </div>
    <div class="alert info" id="base-count-alert">Cargando...</div>
    <div class="card">
      <div class="table-wrap">
        <table><thead><tr><th style="width:36px;text-align:center"><input type="checkbox" id="select-all-check" onchange="PC.toggleSelectAll()" title="Seleccionar todos"></th><th>Fecha</th><th>RUT Paciente</th><th>Estado</th><th>Contactado</th><th>Ejecutivo</th><th>Nombre Gestión</th><th>Proceso</th><th>Tipo Cita</th><th>Acciones</th></tr></thead>
        <tbody id="base-tbody"></tbody></table>
      </div>
      <div class="pagination" id="base-pagination"></div>
    </div>
  </div>

  <!-- CONFIGURACIÓN -->
  <div id="page-configuracion" class="content page hidden">
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><span class="card-title">Ejecutivos</span><button class="btn" onclick="PC.addEjecutivo()">+ Agregar</button></div>
        <div id="cfg-ejecutivos-list"></div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Procesos</span><button class="btn" onclick="PC.addProceso()">+ Agregar</button></div>
        <div id="cfg-procesos-list"></div>
      </div>
    </div>
    <div style="margin-top:20px" class="card">
      <div class="card-head"><span class="card-title">Configuración General</span></div>
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div class="form-group" style="flex:0 0 auto">
          <label>Meta de Contactabilidad (%)</label>
          <input type="number" id="cfg-meta" value="85" min="0" max="100" style="width:120px" onchange="PC.setMeta(this.value)">
        </div>
        <div style="font-size:12px;color:var(--muted)">Cambiar la meta actualiza todos los análisis.</div>
      </div>
    </div>
  </div>
</div>
</div>

<!-- MODAL REPORTE TEAMS -->
<div class="modal-overlay" id="teams-modal-overlay" onclick="if(event.target===this)PC.closeTeamsModal()">
  <div class="modal" style="width:620px;max-width:96vw">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div class="modal-title" style="margin-bottom:0">📋 Reporte para Teams</div>
      <button class="btn secondary" onclick="PC.closeTeamsModal()" style="padding:4px 12px;font-size:12px">✕</button>
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:18px;font-family:'DM Mono',monospace;font-size:12.5px;line-height:1.75;white-space:pre-wrap;word-break:break-word;max-height:55vh;overflow-y:auto;color:var(--text)" id="teams-report-text"></div>
    <div class="modal-footer" style="margin-top:16px">
      <button class="btn secondary" onclick="PC.closeTeamsModal()">Cerrar</button>
      <button class="btn success" id="teams-copy-btn" onclick="PC.copyTeamsReport()" style="min-width:140px">📋 Copiar Texto</button>
    </div>
  </div>
</div>

<!-- MODAL CARGA MASIVA -->
<div class="modal-overlay" id="bulk-modal-overlay" onclick="if(event.target===this)PC.closeBulkModal()">
  <div class="modal" style="width:680px">
    <div class="modal-title">⬆ Carga Masiva de Registros</div>
    <div class="alert info" style="margin-bottom:16px">Ingresa los RUTs uno por línea. Se crearán registros para <strong>todos</strong> con los mismos datos del ejecutivo y gestión.</div>
    <div class="form-grid">
      <div class="form-group"><label>Fecha</label><input type="date" id="bm-fecha"></div>
      <div class="form-group"><label>Ejecutivo</label><select id="bm-ejecutivo"></select></div>
      <div class="form-group"><label>Estado</label>
        <select id="bm-estado" onchange="PC.syncBulkContactado()">
          <option value="">— Sin estado (pendiente) —</option>
          <option value="CONTACTADO">CONTACTADO</option>
          <option value="NO CONTACTADO">NO CONTACTADO</option>
        </select>
      </div>
      <div class="form-group"><label>Contactado</label>
        <select id="bm-contactado">
          <option value="">— Sin estado —</option>
          <option value="CONFIRMA CITA">CONFIRMA CITA</option>
          <option value="NO CONTACTADO">NO CONTACTADO</option>
        </select>
      </div>
      <div class="form-group"><label>Proceso</label><select id="bm-proceso"></select></div>
      <div class="form-group"><label>Tipo Cita</label>
        <select id="bm-tipo"><option>BLOQUEO</option><option>CUENTAS CORRIENTES</option><option>PENSION</option></select>
      </div>
      <div class="form-group full"><label>Nombre Gestión</label><input type="text" id="bm-gestion" placeholder="Ej: BLOQUEO DR NAVARRO 05.02.2026"></div>
      <div class="form-group full">
        <label>RUTs a cargar (uno por línea)</label>
        <textarea id="bm-ruts" placeholder="12345678-9&#10;98765432-1&#10;..." style="min-height:140px" oninput="PC.updateBulkPreview()"></textarea>
      </div>
    </div>
    <div id="bm-preview" style="margin-top:14px;display:none">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Vista Previa</div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;max-height:160px;overflow-y:auto">
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr>
            <th style="text-align:left;padding:4px 8px;color:var(--muted);font-size:10px;border-bottom:1px solid var(--border)">#</th>
            <th style="text-align:left;padding:4px 8px;color:var(--muted);font-size:10px;border-bottom:1px solid var(--border)">RUT</th>
            <th style="text-align:left;padding:4px 8px;color:var(--muted);font-size:10px;border-bottom:1px solid var(--border)">VALIDACIÓN</th>
          </tr></thead>
          <tbody id="bm-preview-body"></tbody>
        </table>
      </div>
      <div id="bm-summary" style="margin-top:8px;font-size:11px;font-family:'DM Mono',monospace;color:var(--muted)"></div>
    </div>
    <div class="modal-footer">
      <button class="btn secondary" onclick="PC.closeBulkModal()">Cancelar</button>
      <button class="btn success" id="bm-save-btn" onclick="PC.saveBulkRecords()" disabled>Cargar Registros</button>
    </div>
  </div>
</div>

<!-- MODAL NUEVO/EDITAR -->
<div class="modal-overlay" id="modal-overlay" onclick="if(event.target===this)PC.closeModal()">
  <div class="modal">
    <div class="modal-title" id="modal-title">Nuevo Registro</div>
    <div class="form-grid">
      <input type="hidden" id="edit-idx" value="">
      <div class="form-group"><label>Fecha</label><input type="date" id="m-fecha"></div>
      <div class="form-group"><label>RUT Paciente</label><input type="text" id="m-rut" placeholder="12345678-9" oninput="this.value=PC.normalizeRut(this.value)"></div>
      <div class="form-group"><label>Estado</label>
        <select id="m-estado" onchange="PC.syncModalContactado()">
          <option value="">— Sin estado (pendiente) —</option>
          <option value="CONTACTADO">CONTACTADO</option>
          <option value="NO CONTACTADO">NO CONTACTADO</option>
        </select>
      </div>
      <div class="form-group"><label>Contactado</label>
        <select id="m-contactado">
          <option value="">— Sin estado —</option>
          <option value="CONFIRMA CITA">CONFIRMA CITA</option>
          <option value="NO CONTACTADO">NO CONTACTADO</option>
        </select>
      </div>
      <div class="form-group"><label>Ejecutivo</label><select id="m-ejecutivo"></select></div>
      <div class="form-group"><label>Proceso</label><select id="m-proceso"></select></div>
      <div class="form-group full"><label>Nombre Gestión</label><input type="text" id="m-gestion"></div>
      <div class="form-group"><label>Tipo Cita</label>
        <select id="m-tipo"><option>BLOQUEO</option><option>CUENTAS CORRIENTES</option><option>PENSION</option></select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn secondary" onclick="PC.closeModal()">Cancelar</button>
      <button class="btn success" onclick="PC.saveRecord()">Guardar</button>
    </div>
  </div>
</div>

<!-- MODAL SISTEMA DE TURNOS -->
<div class="modal-overlay" id="turnos-modal-overlay" onclick="if(event.target===this)PC.closeTurnosModal()">
  <div class="modal" style="width:900px">
    <div class="modal-title">🕐 Sistema de Turnos (Semanal)</div>
    <div class="alert info" style="margin-bottom:14px">Asigna el turno de cada ejecutivo para cada día de la semana. El sistema alertará automáticamente 30 minutos antes de que finalice el turno del día y cuando ya haya finalizado, al intentar cargarle un RUT.</div>
    <div style="margin-bottom:16px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;line-height:1.8">
      Turno A: 08:30 a 18:30 &nbsp;·&nbsp; Turno B: 08:30 a 17:30<br>
      Turno C: 08:30 a 16:30 &nbsp;·&nbsp; Turno D: 09:30 a 18:30
    </div>
    <div id="turnos-list" style="max-height:340px;overflow-y:auto"></div>
    <div class="modal-footer">
      <button class="btn secondary" onclick="PC.closeTurnosModal()">Cancelar</button>
      <button class="btn success" onclick="PC.saveTurnosModal()">Guardar Turnos</button>
    </div>
  </div>
</div>

<!-- MODAL CALENDARIO MENSUAL DE TURNOS -->
<div class="modal-overlay" id="calendario-modal-overlay" onclick="if(event.target===this)PC.closeCalendarioModal()">
  <div class="modal" style="width:97vw;max-width:97vw">
    <div class="modal-title">📅 Calendario Mensual de Turnos</div>
    <div class="alert info" style="margin-bottom:10px">Asigna el turno de cada ejecutivo para cada día de la semana. El sistema alertará automáticamente 30 minutos antes de que finalice el turno del día y cuando ya haya finalizado, al intentar cargarle un RUT. Editable: haz clic en cualquier celda y elige el turno. Los totales se recalculan automáticamente. <span id="cal-backup-note"></span></div>
    <div style="margin-bottom:10px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">
      A: 08:30-18:30 &nbsp;·&nbsp; B: 08:30-17:30 &nbsp;·&nbsp; C: 08:30-16:30 &nbsp;·&nbsp; D: 09:30-18:30 &nbsp;·&nbsp; V: Vacaciones &nbsp;·&nbsp; L: Libre/Feriado
    </div>
    <div id="calendario-container" style="max-height:64vh;overflow:auto"></div>
    <div class="modal-footer">
      <button class="btn secondary" onclick="PC.closeCalendarioModal()">Cerrar</button>
      <button class="btn success" onclick="PC.exportCalendarioCSV()">↓ Exportar CSV</button>
    </div>
  </div>
</div>
</div>
`;

async function renderPanelContactabilidad() {
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = PC_HTML;
  await PC.init();
}

const PC = (function () {
  // ---------------------------------------------------------------
  // DATA (antes cargada de un array hardcodeado + localStorage;
  // ahora se obtiene de la API al inicializar el módulo)
  // ---------------------------------------------------------------
  let records = [];
  let META = 0.85;
  let ejecutivos = [];
  let procesos = [];
  let estados = [];
  let tipos = [];
  let fechas = [];

  let basePage = 1, basePerPage = 50, baseFiltered = [];
  let alertaPage = 1, alertaPerPage = 50, alertaFiltered = [];
  let selectedIndices = new Set();

  const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  function recalcListas() {
    ejecutivos = [...new Set(records.map(r => r.ejecutivo).filter(Boolean))].sort();
    procesos = [...new Set(records.map(r => r.proceso).filter(Boolean))].sort();
    estados = [...new Set(records.map(r => r.estado).filter(Boolean))].sort();
    tipos = [...new Set(records.map(r => r.tipo_cita).filter(Boolean))].sort();
    fechas = [...new Set(records.map(r => r.fecha))].sort();
  }

  function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function businessDaysBetween(dateStr, today) {
    const d = parseLocalDate(dateStr);
    let count = 0;
    let cur = new Date(d);
    cur.setDate(cur.getDate() + 1);
    while (cur <= today) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  // NAVIGATION
  const pages = ['dashboard', 'individual', 'proceso', 'diario', 'semanal', 'carga', 'alertas', 'base', 'configuracion'];
  const titles = { dashboard: 'Dashboard', individual: 'Análisis por Ejecutivo', proceso: 'Análisis por Proceso', diario: 'Análisis Diario', semanal: 'Análisis Semanal', carga: 'Carga por Ejecutivo', alertas: 'Alertas de Retraso', base: 'Base de Datos', configuracion: 'Configuración' };

  function showPage(page) {
    pages.forEach(p => document.getElementById('page-' + p).classList.toggle('hidden', p !== page));
    document.querySelectorAll('.pc-view .nav-item').forEach(el => {
      el.classList.toggle('active', (el.getAttribute('onclick') || '').includes("'" + page + "'"));
    });
    document.getElementById('page-title').textContent = titles[page] || page;
    renderPage(page);
  }
  function renderAll() { renderPage(currentPage()); }
  function currentPage() {
    for (const p of pages) { if (!document.getElementById('page-' + p).classList.contains('hidden')) return p; }
    return 'dashboard';
  }
  function renderPage(page) {
    if (page === 'dashboard') renderDashboard();
    else if (page === 'individual') renderIndividual();
    else if (page === 'proceso') renderProceso();
    else if (page === 'diario') renderDiario();
    else if (page === 'semanal') renderSemanal();
    else if (page === 'carga') renderCarga();
    else if (page === 'alertas') renderAlertas();
    else if (page === 'base') renderBase();
    else if (page === 'configuracion') renderConfig();
  }
  function setMeta(val) { META = val / 100; renderAll(); }

  // UTILS
  function pct(n, d) { return d ? n / d : 0; }
  function fmtPct(v) { return Math.round(v * 100) + '%'; }
  function fmtNum(v) { return v.toLocaleString('es-CL'); }
  function statusBadge(p) { return p >= META ? '<span class="status-ok">✓ SÍ</span>' : '<span class="status-bad">✗ NO</span>'; }
  function metaBadge(pctVal) {
    const pctNum = Math.round(pctVal * 100) + '%';
    const color = pctVal >= META ? 'var(--accent2)' : pctVal >= META * 0.9 ? 'var(--warn)' : 'var(--danger)';
    const barClass = pctVal >= META ? '' : 'bad';
    return `<div class="pct-bar"><div class="mini-bar"><div class="mini-bar-fill ${barClass}" style="width:${Math.min(pctVal * 100, 100)}%"></div></div><span style="color:${color};font-weight:700">${pctNum}</span></div>`;
  }
  function groupBy(arr, key) {
    return arr.reduce((acc, r) => { const k = r[key] || 'SIN DATO'; if (!acc[k]) acc[k] = []; acc[k].push(r); return acc; }, {});
  }
  function filterRecords(f = {}) {
    return records.filter(r => {
      if (f.ejecutivo && r.ejecutivo !== f.ejecutivo) return false;
      if (f.proceso && r.proceso !== f.proceso) return false;
      if (f.estado && r.estado !== f.estado) return false;
      if (f.tipo && r.tipo_cita !== f.tipo) return false;
      if (f.desde && r.fecha < f.desde) return false;
      if (f.hasta && r.fecha > f.hasta) return false;
      if (f.search) { const s = f.search.toLowerCase(); if (!(r.rut.toLowerCase().includes(s) || r.ejecutivo.toLowerCase().includes(s) || (r.nombre_gestion || '').toLowerCase().includes(s))) return false; }
      return true;
    });
  }
  function populateSelect(sel, arr) {
    if (sel.options.length === 1) arr.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
  }
  function fillModalSelect(sel, arr, selectedVal) {
    const currentVal = selectedVal !== undefined ? selectedVal : sel.value;
    while (sel.options.length > 0) sel.remove(0);
    arr.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
    if (currentVal) sel.value = currentVal;
  }
  function arrowIcon(pctVal) {
    if (pctVal > META + 0.05) return '<span class="arrow-up">▲</span>';
    if (pctVal >= META - 0.02) return '<span class="arrow-right">▶</span>';
    return '<span class="arrow-down">▼</span>';
  }

  // DELAY LOGIC
  function getDelayedCases() {
    return records
      .filter(r => (!r.estado || r.estado === ''))
      .map(r => ({ ...r, diasRetraso: businessDaysBetween(r.fecha, TODAY) }))
      .filter(r => r.diasRetraso >= 1)
      .sort((a, b) => b.diasRetraso - a.diasRetraso);
  }
  function delayTagClass(dias) {
    if (dias >= 3) return 'delay-3';
    if (dias === 2) return 'delay-2';
    return 'delay-1';
  }
  function renderDelayBanner(containerId) {
    const delayed = getDelayedCases();
    const cont = document.getElementById(containerId);
    if (!cont) return;
    if (!delayed.length) { cont.innerHTML = ''; return; }
    cont.innerHTML = `
      <div class="delay-panel">
        <div class="delay-header" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.delay-chevron').style.transform=this.nextElementSibling.classList.contains('open')?'rotate(90deg)':''">
          <span style="font-size:16px">⚠</span>
          <h3>Casos Pendientes con Retraso — ${delayed.length} caso${delayed.length !== 1 ? 's' : ''}</h3>
          <span class="delay-count">${delayed.length}</span>
          <span class="delay-chevron">▶</span>
        </div>
        <div class="delay-body">
          <table class="delay-table">
            <thead><tr><th>Ejecutivo</th><th>Nombre Gestión</th><th>RUT</th><th>Fecha</th><th>Días Retraso</th></tr></thead>
            <tbody>
              ${delayed.slice(0, 20).map(r => `<tr>
                <td style="font-family:'Sora',sans-serif;font-weight:600">${r.ejecutivo}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.nombre_gestion || '—'}</td>
                <td>${r.rut}</td>
                <td>${r.fecha}</td>
                <td><span class="delay-tag ${delayTagClass(r.diasRetraso)}">${r.diasRetraso} día${r.diasRetraso !== 1 ? 's' : ''}</span></td>
              </tr>`).join('')}
              ${delayed.length > 20 ? `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:10px">... y ${delayed.length - 20} más. Ver sección <strong>Alertas Retraso</strong></td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // DASHBOARD
  function renderDashboard() {
    const total = records.length;
    const contactados = records.filter(r => r.estado === 'CONTACTADO').length;
    const noContactados = records.filter(r => r.estado === 'NO CONTACTADO').length;
    const pendientes = records.filter(r => !r.estado || r.estado === '').length;
    const pctCont = pct(contactados, contactados + noContactados);
    const delayed = getDelayedCases();

    document.getElementById('total-records-footer').textContent = fmtNum(total) + ' registros';
    const badge = document.getElementById('nav-delay-badge');
    if (delayed.length) { badge.textContent = delayed.length; badge.style.display = 'inline'; }
    else badge.style.display = 'none';

    document.getElementById('kpi-grid').innerHTML = [
      { label: 'Total Registros', value: fmtNum(total), sub: 'En base de datos', color: '' },
      { label: 'Contactados', value: fmtNum(contactados), sub: `${fmtPct(pctCont)} contactabilidad`, color: 'good', bar: pctCont },
      { label: 'No Contactados', value: fmtNum(noContactados), sub: 'Sin contacto exitoso', color: 'bad' },
      { label: 'Pendientes', value: fmtNum(pendientes), sub: 'Sin gestionar aún', color: '', bar: pct(pendientes, total) },
      { label: 'Ejecutivos', value: ejecutivos.length, sub: 'Activos' },
      { label: 'Casos Retrasados', value: fmtNum(delayed.length), sub: 'Pendientes sin gestión', color: delayed.length ? 'bad' : 'good' },
    ].map(k => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value ${k.color || ''}">${k.value}</div><div class="kpi-sub">${k.sub}</div>${k.bar !== undefined ? `<div class="kpi-bar"><div class="kpi-bar-fill" style="width:${Math.min(k.bar * 100, 100)}%"></div></div>` : ''}</div>`).join('');

    document.getElementById('dash-pct-main').textContent = fmtPct(pctCont);
    document.getElementById('dash-pct-main').style.color = pctCont >= META ? 'var(--accent2)' : 'var(--danger)';
    document.getElementById('dash-meta-line').innerHTML = pctCont >= META
      ? `<span style="color:var(--accent2)">✓ Supera la meta de ${fmtPct(META)}</span>`
      : `<span style="color:var(--danger)">✗ Bajo la meta (faltan ${fmtPct(META - pctCont)})</span>`;
    document.getElementById('dash-global-bar').style.width = Math.min(pctCont * 100, 100) + '%';

    const r = 50, cx = 70, cy = 70, stroke = 18, circ = 2 * Math.PI * r;
    const dashC = (pctCont * circ).toFixed(1);
    document.getElementById('donut-wrap').innerHTML = `
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--accent2)" stroke-width="${stroke}"
          stroke-dasharray="${dashC} ${(circ - parseFloat(dashC)).toFixed(1)}"
          stroke-dashoffset="${(circ * 0.25).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
        <text x="${cx}" y="${cy - 5}" text-anchor="middle" fill="var(--text)" font-size="18" font-weight="800" font-family="Sora,sans-serif">${Math.round(pctCont * 100)}%</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="var(--muted)" font-size="10" font-family="Sora,sans-serif">contactados</text>
      </svg>
      <div class="donut-labels">
        <div class="donut-item"><div class="donut-dot" style="background:var(--accent2)"></div><span>Contactados<br><strong>${fmtNum(contactados)}</strong></span></div>
        <div class="donut-item"><div class="donut-dot" style="background:var(--danger)"></div><span>No Contactados<br><strong>${fmtNum(noContactados)}</strong></span></div>
        <div class="donut-item"><div class="donut-dot" style="background:var(--muted)"></div><span>Pendientes<br><strong>${fmtNum(pendientes)}</strong></span></div>
      </div>`;

    const execData = ejecutivos.map(e => {
      const recs = records.filter(r => r.ejecutivo === e && (r.estado === 'CONTACTADO' || r.estado === 'NO CONTACTADO'));
      const cont = recs.filter(r => r.estado === 'CONTACTADO').length;
      return { exec: e, cont, total: recs.length, p: pct(cont, recs.length) };
    }).filter(e => e.total > 0).sort((a, b) => b.p - a.p);

    const totalCont = execData.reduce((s, e) => s + e.cont, 0);
    const totalTrab = execData.reduce((s, e) => s + e.total, 0);
    const totalPct = pct(totalCont, totalTrab);

    document.getElementById('rend-tbody-dash').innerHTML = execData.map(e => `<tr>
      <td>${e.exec}</td>
      <td>${fmtNum(e.cont)} ${arrowIcon(e.p)}</td>
      <td style="color:${e.p >= META ? 'var(--accent2)' : e.p >= META * 0.9 ? 'var(--warn)' : 'var(--danger)'};font-weight:700">${fmtPct(e.p)} ${arrowIcon(e.p)}</td>
      <td>${statusBadge(e.p)}</td>
    </tr>`).join('') + `<tr class="total-row">
      <td>TOTAL EQUIPO</td>
      <td>${fmtNum(totalCont)} ${arrowIcon(totalPct)}</td>
      <td style="font-weight:800">${fmtPct(totalPct)} ${arrowIcon(totalPct)}</td>
      <td>${statusBadge(totalPct)}</td>
    </tr>`;

    renderDelayBanner('delay-panel-dash');
  }

  // ALERTAS
  function renderAlertas() {
    populateSelect(document.getElementById('fa-ejecutivo'), ejecutivos);
    const selExec = document.getElementById('fa-ejecutivo').value;
    const selDias = document.getElementById('fa-dias').value;

    let delayed = getDelayedCases();
    if (selExec) delayed = delayed.filter(r => r.ejecutivo === selExec);
    if (selDias === '1') delayed = delayed.filter(r => r.diasRetraso === 1);
    else if (selDias === '2') delayed = delayed.filter(r => r.diasRetraso === 2);
    else if (selDias === '3') delayed = delayed.filter(r => r.diasRetraso >= 3);

    alertaFiltered = delayed;

    const byExec = groupBy(delayed, 'ejecutivo');
    const maxDias = delayed.length ? Math.max(...delayed.map(r => r.diasRetraso)) : 0;
    document.getElementById('alerta-kpi-grid').innerHTML = [
      { label: 'Total Casos Retrasados', value: fmtNum(delayed.length), color: delayed.length ? 'bad' : 'good' },
      { label: 'Ejecutivos Afectados', value: Object.keys(byExec).length, color: '' },
      { label: 'Max. Días de Retraso', value: maxDias, color: maxDias >= 3 ? 'bad' : maxDias >= 2 ? '' : 'good' },
      { label: 'Retraso 1 día', value: fmtNum(delayed.filter(r => r.diasRetraso === 1).length), color: '' },
      { label: 'Retraso 2 días', value: fmtNum(delayed.filter(r => r.diasRetraso === 2).length), color: '' },
      { label: 'Retraso 3+ días', value: fmtNum(delayed.filter(r => r.diasRetraso >= 3).length), color: delayed.filter(r => r.diasRetraso >= 3).length ? 'bad' : '' },
    ].map(k => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value ${k.color || ''}">${k.value}</div></div>`).join('');

    document.getElementById('alerta-total-badge').textContent = `${fmtNum(delayed.length)} caso${delayed.length !== 1 ? 's' : ''}`;
    alertaPage = 1;
    renderAlertaPage();
  }
  function renderAlertaPage() {
    const start = (alertaPage - 1) * alertaPerPage;
    const pageData = alertaFiltered.slice(start, start + alertaPerPage);
    document.getElementById('alerta-tbody').innerHTML = pageData.map(r => `<tr>
      <td style="font-family:'Sora',sans-serif;font-weight:600">${r.ejecutivo}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.nombre_gestion || ''}">${r.nombre_gestion || '—'}</td>
      <td>${r.rut}</td>
      <td>${r.fecha}</td>
      <td><span class="delay-tag ${delayTagClass(r.diasRetraso)}">${r.diasRetraso} día${r.diasRetraso !== 1 ? 's' : ''}</span></td>
      <td>${r.tipo_cita || '—'}</td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">✓ Sin casos con retraso</td></tr>';

    const totalPages = Math.ceil(alertaFiltered.length / alertaPerPage);
    let pag = `<span class="page-info">${fmtNum(alertaFiltered.length)} casos · Pág. ${alertaPage}/${totalPages}</span>`;
    if (alertaPage > 1) pag += `<button class="page-btn" onclick="PC.prevAlertaPage()">‹</button>`;
    for (let p = Math.max(1, alertaPage - 2); p <= Math.min(totalPages, alertaPage + 2); p++) pag += `<button class="page-btn ${p === alertaPage ? 'active' : ''}" onclick="PC.gotoAlertaPage(${p})">${p}</button>`;
    if (alertaPage < totalPages) pag += `<button class="page-btn" onclick="PC.nextAlertaPage()">›</button>`;
    document.getElementById('alerta-pagination').innerHTML = pag;
  }
  function gotoAlertaPage(p) { alertaPage = p; renderAlertaPage(); }
  function prevAlertaPage() { alertaPage--; renderAlertaPage(); }
  function nextAlertaPage() { alertaPage++; renderAlertaPage(); }

  // INDIVIDUAL
  function renderIndividual() {
    populateSelect(document.getElementById('fi-ejecutivo'), ejecutivos);
    populateSelect(document.getElementById('fi-proceso'), procesos);
    const selExec = document.getElementById('fi-ejecutivo').value;
    const selProc = document.getElementById('fi-proceso').value;
    const filtered = filterRecords({ ejecutivo: selExec || undefined, proceso: selProc || undefined });
    const worked = filtered.filter(r => r.estado === 'CONTACTADO' || r.estado === 'NO CONTACTADO');
    const totalCont = worked.filter(r => r.estado === 'CONTACTADO').length;
    const pctG = pct(totalCont, worked.length);

    document.getElementById('ind-kpi-grid').innerHTML = [
      { label: 'Total Registros', value: fmtNum(filtered.length), color: '' },
      { label: 'Trabajados', value: fmtNum(worked.length), color: '' },
      { label: 'Contactados', value: fmtNum(totalCont), color: 'good' },
      { label: 'No Contactados', value: fmtNum(worked.length - totalCont), color: 'bad' },
      { label: '% Contactabilidad', value: fmtPct(pctG), color: pctG >= META ? 'good' : 'bad' },
    ].map(k => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value ${k.color}">${k.value}</div></div>`).join('');

    const execList = selExec ? [selExec] : ejecutivos;
    const rows = execList.map(e => {
      const recs = filtered.filter(r => r.ejecutivo === e && (r.estado === 'CONTACTADO' || r.estado === 'NO CONTACTADO'));
      const cont = recs.filter(r => r.estado === 'CONTACTADO').length;
      const noCont = recs.filter(r => r.estado === 'NO CONTACTADO').length;
      return { e, cont, noCont, total: recs.length, p: pct(cont, recs.length) };
    }).filter(r => r.total > 0);

    document.getElementById('ind-tbody').innerHTML = rows.map(r => `<tr>
      <td style="font-family:Sora,sans-serif;font-weight:600">${r.e}</td>
      <td style="color:var(--accent2)">${fmtNum(r.cont)}</td>
      <td style="color:var(--danger)">${fmtNum(r.noCont)}</td>
      <td>${fmtNum(r.total)}</td>
      <td>${metaBadge(r.p)}</td>
      <td>${statusBadge(r.p)}</td>
    </tr>`).join('');

    document.getElementById('ind-chart').innerHTML = rows.sort((a, b) => b.p - a.p).map(r => `
      <div class="chart-row">
        <div class="chart-label">${r.e.split(' ').slice(0, 2).join(' ')}</div>
        <div class="chart-bar-wrap"><div class="chart-bar-inner" style="width:${r.p * 100}%;${r.p < META ? 'background:linear-gradient(90deg,var(--warn),var(--danger))' : ''}">${r.cont}/${r.total}</div></div>
        <div class="chart-bar-pct">${fmtPct(r.p)}</div>
      </div>`).join('');
  }

  // PROCESO
  function renderProceso() {
    populateSelect(document.getElementById('fp-ejecutivo'), ejecutivos);
    const selExec = document.getElementById('fp-ejecutivo').value;
    const filtered = filterRecords({ ejecutivo: selExec || undefined });

    document.getElementById('proc-tbody').innerHTML = procesos.map(p => {
      const recs = filtered.filter(r => r.proceso === p);
      const cont = recs.filter(r => r.estado === 'CONTACTADO').length;
      const noCont = recs.filter(r => r.estado === 'NO CONTACTADO').length;
      const p2 = pct(cont, cont + noCont);
      return recs.length ? `<tr><td style="font-family:Sora,sans-serif;font-weight:600">${p}</td><td>${fmtNum(recs.length)}</td><td style="color:var(--accent2)">${fmtNum(cont)}</td><td style="color:var(--danger)">${fmtNum(noCont)}</td><td>${metaBadge(p2)}</td><td style="color:var(--warn);font-family:'DM Mono',monospace">${fmtPct(META)}</td></tr>` : '';
    }).join('');

    const execList = selExec ? [selExec] : ejecutivos;
    document.getElementById('proc-exec-tbody').innerHTML = execList.map(e => {
      const recs = filtered.filter(r => r.ejecutivo === e);
      const gest = recs.filter(r => r.proceso === 'CORREOS GESTIONADOS').length;
      const pend = recs.filter(r => !r.estado || r.estado === '').length;
      return recs.length ? `<tr><td style="font-family:Sora,sans-serif;font-weight:600">${e}</td><td style="color:var(--accent)">${fmtNum(gest)}</td><td style="color:var(--warn);font-weight:700">${fmtNum(pend)}</td><td>${fmtNum(recs.length)}</td><td>${metaBadge(pct(gest, recs.length))}</td></tr>` : '';
    }).join('');

    renderProcesoHoy(filtered);
  }

  function renderProcesoHoy(filtered) {
    const todayStr = new Date().toISOString().slice(0, 10);

    const gestHoy = filtered.filter(r => r.fecha === todayStr && r.estado && r.estado !== '');
    const gestBadge = document.getElementById('proc-gest-hoy-badge');
    const gestTbody = document.getElementById('proc-gest-hoy-tbody');
    if (gestBadge) gestBadge.textContent = gestHoy.length + ' registro' + (gestHoy.length !== 1 ? 's' : '');
    if (gestTbody) gestTbody.innerHTML = gestHoy.length
      ? gestHoy.map(r => `<tr>
          <td style="font-family:Sora,sans-serif;font-weight:600;font-size:11px">${r.ejecutivo}</td>
          <td style="font-size:10px;color:var(--muted)">${r.proceso}</td>
          <td style="font-family:'DM Mono',monospace">${r.rut}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px">${r.nombre_gestion || '—'}</td>
          <td>${r.estado === 'CONTACTADO' ? '<span class="status-ok">CONTACTADO</span>' : '<span class="status-bad">NO CONTACTADO</span>'}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">Sin gestiones hoy</td></tr>';

    const pendHoy = filtered.filter(r => r.proceso === 'CORREOS PENDIENTES DE HOY' && r.fecha === todayStr && (!r.estado || r.estado === ''));
    const pendBadge = document.getElementById('proc-pend-hoy-badge');
    const pendTbody = document.getElementById('proc-pend-hoy-tbody');
    if (pendBadge) pendBadge.textContent = pendHoy.length + ' pendiente' + (pendHoy.length !== 1 ? 's' : '');
    if (pendTbody) pendTbody.innerHTML = pendHoy.length
      ? pendHoy.map(r => `<tr>
          <td style="font-family:Sora,sans-serif;font-weight:600;font-size:11px">${r.ejecutivo}</td>
          <td style="font-family:'DM Mono',monospace">${r.rut}</td>
          <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px">${r.nombre_gestion || '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">Sin pendientes hoy</td></tr>';
  }

  // DIARIO
  function renderDiario() {
    const desde = document.getElementById('fd-desde').value;
    const hasta = document.getElementById('fd-hasta').value;
    const filtered = filterRecords({ desde: desde || undefined, hasta: hasta || undefined });
    const worked = filtered.filter(r => r.estado === 'CONTACTADO' || r.estado === 'NO CONTACTADO');
    const totalCont = worked.filter(r => r.estado === 'CONTACTADO').length;
    const pctG = pct(totalCont, worked.length);

    document.getElementById('dia-kpi-grid').innerHTML = [
      { label: 'Total Registros', value: fmtNum(filtered.length) },
      { label: 'Trabajados', value: fmtNum(worked.length) },
      { label: 'Contactados', value: fmtNum(totalCont), color: 'good' },
      { label: 'No Contactados', value: fmtNum(worked.length - totalCont), color: 'bad' },
      { label: '% Período', value: fmtPct(pctG), color: pctG >= META ? 'good' : 'bad' },
    ].map(k => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value ${k.color || ''}">${k.value}</div></div>`).join('');

    const usedFechas = [...new Set(filtered.map(r => r.fecha))].sort();
    const byDate = groupBy(filtered, 'fecha');
    const rows = usedFechas.map(f => {
      const recs = byDate[f] || [];
      const cont = recs.filter(r => r.estado === 'CONTACTADO').length;
      const noCont = recs.filter(r => r.estado === 'NO CONTACTADO').length;
      return { f, total: recs.length, cont, noCont, p2: pct(cont, cont + noCont) };
    });

    document.getElementById('dia-tbody').innerHTML = rows.map(r => `<tr>
      <td>${r.f}</td><td>${fmtNum(r.total)}</td>
      <td style="color:var(--accent2)">${fmtNum(r.cont)}</td>
      <td style="color:var(--danger)">${fmtNum(r.noCont)}</td>
      <td>${metaBadge(r.p2)}</td><td>${statusBadge(r.p2)}</td>
    </tr>`).join('');

    document.getElementById('dia-chart').innerHTML = rows.map(r => `
      <div class="chart-row">
        <div class="chart-label">${r.f}</div>
        <div class="chart-bar-wrap"><div class="chart-bar-inner" style="width:${r.p2 * 100}%;${r.p2 < META ? 'background:linear-gradient(90deg,var(--warn),var(--danger))' : ''}">${fmtPct(r.p2)}</div></div>
        <div class="chart-bar-pct">${r.total} reg.</div>
      </div>`).join('');
  }

  // SEMANAL
  function getISOWeek(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const year = d.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay() || 7;
    const offset = jan1Day - 1;
    const dayOfYear = Math.floor((d - jan1) / 86400000) + 1;
    const week = Math.ceil((dayOfYear + offset) / 7);
    const day = d.getDay() || 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day - 1));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { week, year, monday: mon, sunday: sun };
  }
  function fmtDate(d) {
    return d.toISOString().slice(0, 10);
  }
  function renderSemanal() {
    const byWeekKey = {};
    records.forEach(r => {
      const { week, year } = getISOWeek(r.fecha);
      const key = `${year}-W${String(week).padStart(2, '0')}`;
      if (!byWeekKey[key]) byWeekKey[key] = [];
      byWeekKey[key].push(r);
    });

    const rows = Object.keys(byWeekKey).sort().map(key => {
      const recs = byWeekKey[key];
      const { week, year, monday, sunday } = getISOWeek(recs[0].fecha);
      const wDates = [...new Set(recs.map(r => r.fecha))].sort();
      const cont = recs.filter(r => r.estado === 'CONTACTADO').length;
      const noCont = recs.filter(r => r.estado === 'NO CONTACTADO').length;
      const p2 = pct(cont, cont + noCont);
      const periodo = `${fmtDate(monday)} → ${fmtDate(sunday)}`;
      return { week, year, key, total: recs.length, cont, noCont, p2, periodo, wDates };
    });

    document.getElementById('sem-tbody').innerHTML = rows.map(r => `<tr>
      <td style="font-family:Sora,sans-serif;font-weight:600">Semana ${r.week} · ${r.year}</td>
      <td style="color:var(--muted);font-size:10px">${r.periodo}</td>
      <td>${fmtNum(r.total)}</td>
      <td style="color:var(--accent2)">${fmtNum(r.cont)}</td>
      <td style="color:var(--danger)">${fmtNum(r.noCont)}</td>
      <td>${metaBadge(r.p2)}</td><td>${statusBadge(r.p2)}</td>
    </tr>`).join('');

    document.getElementById('sem-chart').innerHTML = rows.map(r => `
      <div class="chart-row">
        <div class="chart-label">Sem. ${r.week}</div>
        <div class="chart-bar-wrap"><div class="chart-bar-inner" style="width:${r.p2 * 100}%;${r.p2 < META ? 'background:linear-gradient(90deg,var(--warn),var(--danger))' : ''}">${fmtPct(r.p2)}</div></div>
        <div class="chart-bar-pct">${r.total} reg.</div>
      </div>`).join('');
  }

  // CARGA
  function renderCarga() {
    populateSelect(document.getElementById('fc-ejecutivo'), ejecutivos);
    const selExec = document.getElementById('fc-ejecutivo').value;
    const execList = selExec ? [selExec] : ejecutivos;
    document.getElementById('carga-thead').innerHTML = '<tr><th>Ejecutivo</th>' + fechas.map(f => `<th>${f.slice(5)}</th>`).join('') + '<th>TOTAL</th></tr>';
    const rows = execList.map(e => {
      const byDate = fechas.map(f => records.filter(r => r.ejecutivo === e && r.fecha === f).length);
      const total = byDate.reduce((a, b) => a + b, 0);
      return `<tr><td style="font-family:Sora,sans-serif;font-weight:600;white-space:nowrap">${e}</td>${byDate.map(v => `<td style="${v > 0 ? 'color:var(--accent)' : 'color:var(--border)'}">${v > 0 ? v : '—'}</td>`).join('')}<td style="font-weight:700;color:var(--accent2)">${total}</td></tr>`;
    });
    const totals = fechas.map(f => records.filter(r => execList.includes(r.ejecutivo) && r.fecha === f).length);
    const grand = totals.reduce((a, b) => a + b, 0);
    rows.push(`<tr style="border-top:2px solid var(--accent);font-weight:700"><td style="color:var(--accent)">TOTAL</td>${totals.map(v => `<td style="color:var(--accent)">${v || '—'}</td>`).join('')}<td style="color:var(--accent2)">${grand}</td></tr>`);
    document.getElementById('carga-tbody').innerHTML = rows.join('');
  }

  // BASE DE DATOS
  const PROCESOS_FIJOS = ['CORREOS GESTIONADOS', 'CORREOS PENDIENTES DE HOY', 'NO CONFIRMA CITA'];
  function asegurarProcesosFijos(sel) {
    PROCESOS_FIJOS.forEach(v => {
      if (![...sel.options].some(o => o.value === v)) {
        const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o);
      }
    });
  }
  function initBaseFilters() {
    populateSelect(document.getElementById('fb-estado'), estados);
    populateSelect(document.getElementById('fb-ejecutivo'), ejecutivos);
    populateSelect(document.getElementById('fb-proceso'), procesos);
    populateSelect(document.getElementById('fb-tipo'), tipos);
    populateSelect(document.getElementById('bulk-proceso-sel'), procesos);
    populateSelect(document.getElementById('bulk-ejecutivo-sel'), ejecutivos);
    asegurarProcesosFijos(document.getElementById('fb-proceso'));
    asegurarProcesosFijos(document.getElementById('bulk-proceso-sel'));
  }

  function onRowCheck(cb) {
    const idx = parseInt(cb.dataset.idx);
    if (cb.checked) selectedIndices.add(idx); else selectedIndices.delete(idx);
    const allOnPage = [...document.querySelectorAll('.pc-view .row-check')].map(c => parseInt(c.dataset.idx));
    const allChecked = allOnPage.every(i => selectedIndices.has(i));
    const someChecked = allOnPage.some(i => selectedIndices.has(i));
    const saCheck = document.getElementById('select-all-check');
    if (saCheck) { saCheck.checked = allChecked; saCheck.indeterminate = !allChecked && someChecked; }
    updateBulkBar();
    const tr = cb.closest('tr');
    if (tr) tr.style.background = cb.checked ? 'rgba(0,212,255,0.07)' : '';
  }

  function toggleSelectAll() {
    const cb = document.getElementById('select-all-check');
    const allOnPage = [...document.querySelectorAll('.pc-view .row-check')];
    allOnPage.forEach(c => {
      const idx = parseInt(c.dataset.idx);
      c.checked = cb.checked;
      const tr = c.closest('tr');
      if (tr) tr.style.background = cb.checked ? 'rgba(0,212,255,0.07)' : '';
      if (cb.checked) selectedIndices.add(idx); else selectedIndices.delete(idx);
    });
    updateBulkBar();
  }

  function deselectAll() {
    selectedIndices.clear();
    renderBasePage();
  }

  function updateBulkBar() {
    const bar = document.getElementById('bulk-action-bar');
    const cnt = document.getElementById('bulk-selected-count');
    if (selectedIndices.size > 0) {
      bar.classList.add('visible');
      cnt.textContent = `${selectedIndices.size} seleccionado${selectedIndices.size !== 1 ? 's' : ''}`;
    } else {
      bar.classList.remove('visible');
    }
  }

  function syncBulkBarContactado() {
    const est = document.getElementById('bulk-estado-sel').value;
    const contSel = document.getElementById('bulk-contactado-sel');
    const procSel = document.getElementById('bulk-proceso-sel');
    if (est === 'NO CONTACTADO') {
      contSel.value = 'NO CONTACTADO';
      if (procSel) {
        if (![...procSel.options].some(o => o.value === 'CORREOS GESTIONADOS')) {
          const o = document.createElement('option'); o.value = 'CORREOS GESTIONADOS'; o.textContent = 'CORREOS GESTIONADOS'; procSel.appendChild(o);
        }
        procSel.value = 'CORREOS GESTIONADOS';
      }
    } else if (est === 'CONTACTADO') {
      contSel.value = 'CONFIRMA CITA';
      if (procSel) {
        if (![...procSel.options].some(o => o.value === 'CORREOS GESTIONADOS')) {
          const o = document.createElement('option'); o.value = 'CORREOS GESTIONADOS'; o.textContent = 'CORREOS GESTIONADOS'; procSel.appendChild(o);
        }
        procSel.value = 'CORREOS GESTIONADOS';
      }
    } else if (est === 'NO CONFIRMA CITA') {
      contSel.value = 'NO CONFIRMA CITA';
      if (procSel) {
        if (![...procSel.options].some(o => o.value === 'NO CONFIRMA CITA')) {
          const o = document.createElement('option'); o.value = 'NO CONFIRMA CITA'; o.textContent = 'NO CONFIRMA CITA'; procSel.appendChild(o);
        }
        procSel.value = 'NO CONFIRMA CITA';
      }
    } else {
      contSel.value = '';
    }
  }

  async function deleteBulkSelected() {
    if (selectedIndices.size === 0) return;
    const n = selectedIndices.size;
    if (!confirm(`¿Eliminar ${n} registro${n !== 1 ? 's' : ''} seleccionado${n !== 1 ? 's' : ''}?\nEsta acción no se puede deshacer.`)) return;
    const ids = [...selectedIndices].map(idx => records[idx] && records[idx].id).filter(Boolean);
    try {
      await api('/contactabilidad/registros/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) });
    } catch (err) { alert('Error al eliminar: ' + err.message); return; }
    const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
    sortedIndices.forEach(idx => { records.splice(idx, 1); });
    recalcListas();
    selectedIndices.clear();
    renderBase();
    const a = document.getElementById('base-count-alert');
    a.textContent = `🗑 Se eliminaron ${n} registro${n !== 1 ? 's' : ''}`;
    a.style.background = 'rgba(255,60,90,0.06)'; a.style.borderLeftColor = 'var(--danger)'; a.style.color = 'var(--danger)';
    setTimeout(() => renderBase(), 3000);
  }

  async function applyBulkEdit() {
    if (selectedIndices.size === 0) return;
    const newFecha = document.getElementById('bulk-fecha-sel').value;
    const newEstado = document.getElementById('bulk-estado-sel').value;
    const newContactado = document.getElementById('bulk-contactado-sel').value;
    const newProceso = document.getElementById('bulk-proceso-sel').value;
    const newEjecutivo = document.getElementById('bulk-ejecutivo-sel').value;
    const newTipo = document.getElementById('bulk-tipo-sel').value;
    if (!newFecha && !newEstado && !newContactado && !newProceso && !newEjecutivo && !newTipo) { alert('Selecciona al menos un campo para modificar.'); return; }
    const n = selectedIndices.size;
    const cambios = [newFecha ? 'Fecha → ' + newFecha : '', newEstado ? 'Estado → ' + newEstado : '', newContactado ? 'Contactado → ' + newContactado : '', newProceso ? 'Proceso → ' + newProceso : '', newEjecutivo ? 'Ejecutivo → ' + newEjecutivo : '', newTipo ? 'Tipo Cita → ' + newTipo : ''].filter(Boolean).join('\n');
    if (!confirm(`¿Aplicar cambios a ${n} registro${n !== 1 ? 's' : ''}?\n${cambios}`)) return;

    const changes = {};
    if (newFecha) changes.fecha = newFecha;
    if (newEstado) changes.estado = newEstado;
    if (newContactado) changes.contactado = newContactado;
    if (newProceso) changes.proceso = newProceso;
    if (newEjecutivo) changes.ejecutivo = newEjecutivo;
    if (newTipo) changes.tipo_cita = newTipo;
    const ids = [...selectedIndices].map(idx => records[idx] && records[idx].id).filter(Boolean);

    let actualizados;
    try {
      actualizados = await api('/contactabilidad/registros/bulk-update', { method: 'POST', body: JSON.stringify({ ids, changes }) });
    } catch (err) { alert('Error al actualizar: ' + err.message); return; }
    const byId = {};
    actualizados.forEach(r => { byId[r.id] = r; });
    selectedIndices.forEach(idx => { if (records[idx] && byId[records[idx].id]) records[idx] = byId[records[idx].id]; });
    recalcListas();

    selectedIndices.clear();
    document.getElementById('bulk-fecha-sel').value = '';
    document.getElementById('bulk-estado-sel').value = '';
    document.getElementById('bulk-contactado-sel').value = '';
    document.getElementById('bulk-proceso-sel').value = '';
    document.getElementById('bulk-ejecutivo-sel').value = '';
    document.getElementById('bulk-tipo-sel').value = '';
    renderBase();
    const a = document.getElementById('base-count-alert');
    a.textContent = `✓ Se actualizaron ${n} registro${n !== 1 ? 's' : ''}`;
    a.style.background = 'rgba(0,255,157,0.06)'; a.style.borderLeftColor = 'var(--accent2)'; a.style.color = 'var(--accent2)';
    setTimeout(() => renderBase(), 3000);
  }

  function renderBase() {
    selectedIndices.clear();
    initBaseFilters();
    baseFiltered = filterRecords({
      search: document.getElementById('fb-search').value || undefined,
      estado: document.getElementById('fb-estado').value || undefined,
      ejecutivo: document.getElementById('fb-ejecutivo').value || undefined,
      proceso: document.getElementById('fb-proceso').value || undefined,
      tipo: document.getElementById('fb-tipo').value || undefined,
    });
    const el = document.getElementById('base-count-alert');
    el.textContent = `Mostrando ${fmtNum(baseFiltered.length)} de ${fmtNum(records.length)} registros`;
    el.style.cssText = '';
    basePage = 1;
    renderBasePage();
  }
  function renderBasePage() {
    const start = (basePage - 1) * basePerPage;
    const pageData = baseFiltered.slice(start, start + basePerPage);
    document.getElementById('base-tbody').innerHTML = pageData.map(r => {
      const idx = records.indexOf(r);
      const checked = selectedIndices.has(idx) ? 'checked' : '';
      let estadoBadge;
      if (!r.estado || r.estado === '') estadoBadge = '<span class="status-blank">— PENDIENTE</span>';
      else if (r.estado === 'CONTACTADO') estadoBadge = '<span class="status-ok">✓ CONTACTADO</span>';
      else estadoBadge = '<span class="status-bad">✗ NO CONTACTADO</span>';
      return `<tr style="${selectedIndices.has(idx) ? 'background:rgba(0,212,255,0.07)' : ''}">
        <td style="text-align:center"><input type="checkbox" class="row-check" data-idx="${idx}" ${checked} onchange="PC.onRowCheck(this)"></td>
        <td>${r.fecha}</td><td>${r.rut}</td>
        <td>${estadoBadge}</td>
        <td>${r.contactado || '—'}</td><td>${r.ejecutivo}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${r.nombre_gestion || '—'}</td>
        <td>${r.proceso}</td><td>${r.tipo_cita || '—'}</td>
        <td style="display:flex;gap:6px">
          <button class="btn" style="padding:4px 8px;font-size:10px" onclick="PC.editRecord(${idx})">✎</button>
          <button class="btn danger" style="padding:4px 8px;font-size:10px" onclick="PC.deleteRecord(${idx})">✕</button>
        </td>
      </tr>`;
    }).join('');
    const allOnPage = pageData.map(r => records.indexOf(r));
    const allChecked = allOnPage.length > 0 && allOnPage.every(i => selectedIndices.has(i));
    const someChecked = allOnPage.some(i => selectedIndices.has(i));
    const saCheck = document.getElementById('select-all-check');
    if (saCheck) { saCheck.checked = allChecked; saCheck.indeterminate = !allChecked && someChecked; }
    updateBulkBar();
    const totalPages = Math.ceil(baseFiltered.length / basePerPage);
    let pag = `<span class="page-info">${fmtNum(baseFiltered.length)} reg. · Pág. ${basePage}/${totalPages}</span>`;
    if (basePage > 1) pag += `<button class="page-btn" onclick="PC.prevBasePage()">‹</button>`;
    for (let p = Math.max(1, basePage - 2); p <= Math.min(totalPages, basePage + 2); p++) pag += `<button class="page-btn ${p === basePage ? 'active' : ''}" onclick="PC.gotoBasePage(${p})">${p}</button>`;
    if (basePage < totalPages) pag += `<button class="page-btn" onclick="PC.nextBasePage()">›</button>`;
    document.getElementById('base-pagination').innerHTML = pag;
  }
  function gotoBasePage(p) { basePage = p; renderBasePage(); }
  function prevBasePage() { basePage--; renderBasePage(); }
  function nextBasePage() { basePage++; renderBasePage(); }

  // CRUD
  function openAddModal() {
    document.getElementById('edit-idx').value = '';
    document.getElementById('modal-title').textContent = 'Nuevo Registro';
    document.getElementById('m-fecha').value = new Date().toISOString().slice(0, 10);
    document.getElementById('m-rut').value = '';
    document.getElementById('m-gestion').value = '';
    document.getElementById('m-estado').value = '';
    document.getElementById('m-contactado').value = '';
    fillModalSelect(document.getElementById('m-ejecutivo'), ejecutivos, '');
    fillModalSelect(document.getElementById('m-proceso'), procesos, '');
    asegurarProcesosFijos(document.getElementById('m-proceso'));
    document.getElementById('modal-overlay').classList.add('open');
  }
  function editRecord(idx) {
    const r = records[idx];
    document.getElementById('edit-idx').value = idx;
    document.getElementById('modal-title').textContent = 'Editar Registro';
    document.getElementById('m-fecha').value = r.fecha;
    document.getElementById('m-rut').value = r.rut;
    document.getElementById('m-estado').value = r.estado || '';
    document.getElementById('m-contactado').value = r.contactado || '';
    document.getElementById('m-gestion').value = r.nombre_gestion || '';
    document.getElementById('m-tipo').value = r.tipo_cita || 'BLOQUEO';
    fillModalSelect(document.getElementById('m-ejecutivo'), ejecutivos, r.ejecutivo);
    fillModalSelect(document.getElementById('m-proceso'), procesos, r.proceso);
    asegurarProcesosFijos(document.getElementById('m-proceso'));
    document.getElementById('modal-overlay').classList.add('open');
  }

  // SISTEMA DE TURNOS (SEMANAL)
  const TURNOS = {
    'A': { inicio: '08:30', fin: '18:30' },
    'B': { inicio: '08:30', fin: '17:30' },
    'C': { inicio: '08:30', fin: '16:30' },
    'D': { inicio: '09:30', fin: '18:30' }
  };
  const DIAS_SEMANA = [
    { key: 'lun', label: 'Lun' }, { key: 'mar', label: 'Mar' }, { key: 'mie', label: 'Mié' },
    { key: 'jue', label: 'Jue' }, { key: 'vie', label: 'Vie' }, { key: 'sab', label: 'Sáb' }, { key: 'dom', label: 'Dom' }
  ];
  let turnosEjecutivos = {};
  function getDiaKeyHoy() {
    const map = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    return map[new Date().getDay()];
  }
  async function loadTurnos() {
    try { turnosEjecutivos = (await api('/contactabilidad/config/turnos')) || {}; }
    catch (err) { console.error('Error cargando turnos:', err); turnosEjecutivos = {}; }
  }
  async function saveTurnosStorage() {
    await api('/contactabilidad/config/turnos', { method: 'PUT', body: JSON.stringify({ valor: turnosEjecutivos }) });
  }
  function openTurnosModal() {
    if (!ejecutivos.length) {
      document.getElementById('turnos-list').innerHTML = '<div class="alert warn">No hay ejecutivos cargados aún.</div>';
    } else {
      let html = '<div class="table-wrap"><table><thead><tr><th>Ejecutivo</th>' + DIAS_SEMANA.map(d => `<th>${d.label}</th>`).join('') + '</tr></thead><tbody>';
      ejecutivos.forEach(e => {
        const cfg = turnosEjecutivos[e] || {};
        html += `<tr><td>${e}</td>`;
        DIAS_SEMANA.forEach(d => {
          const actual = cfg[d.key] || '';
          const opts = ['', 'A', 'B', 'C', 'D'].map(k => `<option value="${k}" ${k === actual ? 'selected' : ''}>${k || '—'}</option>`).join('');
          html += `<td><select class="turno-select" data-ejecutivo="${e.replace(/"/g, '&quot;')}" data-dia="${d.key}" style="min-width:56px;padding:4px">${opts}</select></td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      document.getElementById('turnos-list').innerHTML = html;
    }
    document.getElementById('turnos-modal-overlay').classList.add('open');
  }
  function closeTurnosModal() { document.getElementById('turnos-modal-overlay').classList.remove('open'); }
  async function saveTurnosModal() {
    const nuevo = {};
    document.querySelectorAll('.pc-view .turno-select').forEach(sel => {
      const ejecutivo = sel.getAttribute('data-ejecutivo');
      const dia = sel.getAttribute('data-dia');
      if (!nuevo[ejecutivo]) nuevo[ejecutivo] = {};
      if (sel.value) nuevo[ejecutivo][dia] = sel.value;
    });
    turnosEjecutivos = nuevo;
    try { await saveTurnosStorage(); }
    catch (err) { alert('Error al guardar turnos: ' + err.message); return; }
    closeTurnosModal();
    alert('✅ Turnos semanales guardados correctamente.');
  }
  function minutosDesdeMedianoche(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }
  function checkTurnoAlerta(ejecutivo) {
    const hoyISO = new Date().toISOString().slice(0, 10);
    const codigoCalendario = checkCalendarioAlerta(ejecutivo, hoyISO);
    let turnoKey;
    if (codigoCalendario !== undefined) {
      if (codigoCalendario === 'L') return `⛔ ATENCIÓN: Hoy es día LIBRE/FERIADO para ${ejecutivo} según el calendario mensual.\nNo deberías cargarle RUT.\n\n¿Deseas continuar de todas formas?`;
      if (codigoCalendario === 'V') return `⛔ ATENCIÓN: Hoy ${ejecutivo} está de VACACIONES según el calendario mensual.\nNo deberías cargarle RUT.\n\n¿Deseas continuar de todas formas?`;
      turnoKey = codigoCalendario;
    } else {
      const diaHoy = getDiaKeyHoy();
      const cfg = turnosEjecutivos[ejecutivo];
      turnoKey = cfg ? cfg[diaHoy] : null;
    }
    if (!turnoKey || !TURNOS[turnoKey]) return null;
    const turno = TURNOS[turnoKey];
    const ahora = new Date();
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const minFin = minutosDesdeMedianoche(turno.fin);
    const minAlerta = minFin - 30;
    if (minAhora >= minFin) {
      return `⛔ ATENCIÓN: Hoy el Turno ${turnoKey} de ${ejecutivo} ya FINALIZÓ (${turno.fin}).\nNo deberías cargarle RUT nuevos.\n\n¿Deseas continuar de todas formas?`;
    } else if (minAhora >= minAlerta) {
      const restantes = minFin - minAhora;
      return `⚠️ ATENCIÓN: Hoy el Turno ${turnoKey} de ${ejecutivo} finaliza en ${restantes} minuto(s) (${turno.fin}).\nEvita cargarle más RUT.\n\n¿Deseas continuar de todas formas?`;
    }
    return null;
  }

  // CALENDARIO MENSUAL DE TURNOS
  const CAL_MES_FECHAS = ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31'];
  const CAL_MES_FERIADO = '2026-06-29';
  const CAL_MES_DATOS_INICIALES = {
    'KATIA HALD': ['L', 'B', 'A', 'A', 'C', 'A', 'B', 'C', 'A', 'A', 'V', 'V', 'V', 'V', 'V', 'A', 'A', 'A', 'B', 'C', 'A', 'A', 'A', 'B', 'C'],
    'DANIELA RODRIGUEZ': ['L', 'C', 'A', 'A', 'B', 'A', 'B', 'C', 'A', 'A', 'A', 'A', 'D', 'C', 'A', 'A', 'A', 'A', 'B', 'C', 'A', 'A', 'A', 'B', 'C'],
    'ALEJANDRA ORELLANA': ['L', 'B', 'A', 'A', 'B', 'A', 'C', 'B', 'A', 'A', 'A', 'A', 'D', 'C', 'A', 'A', 'A', 'A', 'C', 'C', 'B', 'A', 'A', 'A', 'C'],
    'MAXIMILANO OLIVARES': ['L', 'A', 'B', 'C', 'A', 'V', 'V', 'V', 'V', 'V', 'A', 'A', 'C', 'A', 'D', 'A', 'A', 'A', 'C', 'B', 'B', 'A', 'A', 'A', 'C'],
    'MELISSA SALGADO': ['L', 'B', 'C', 'A', 'A', 'A', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'A', 'A', 'A', 'A', 'B', 'C', 'A', 'D', 'C', 'A', 'A', 'A'],
    'ELSA GONGORA': ['L', 'V', 'V', 'V', 'V', 'C', 'A', 'A', 'A', 'B', 'A', 'B', 'C', 'A', 'A', 'C', 'A', 'A', 'A', 'A', 'B', 'A', 'A', 'D', 'C'],
    'ATALY GARCIA': ['L', 'A', 'C', 'D', 'A', 'B', 'A', 'A', 'A', 'C', 'A', 'C', 'B', 'A', 'A', 'B', 'A', 'A', 'A', 'C', 'A', 'C', 'A', 'D', 'A'],
    'MARIA LORETO': ['L', 'C', 'A', 'A', 'D', 'B', 'A', 'A', 'C', 'A', 'A', 'C', 'B', 'A', 'A', 'B', 'A', 'A', 'C', 'A', 'C', 'A', 'A', 'A', 'D'],
    'JOHANA LLANCAPICHUN': ['L', 'A', 'A', 'B', 'C', 'A', 'D', 'C', 'A', 'A', 'A', 'A', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'A', 'A', 'A', 'A', 'B', 'C'],
    'ALEJANDRA CHACON': ['L', 'A', 'A', 'B', 'C', 'A', 'A', 'D', 'C', 'A', 'A', 'A', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'A', 'A', 'A', 'A', 'B', 'C'],
    'MANUELA ASTUDILLO': ['L', 'A', 'A', 'C', 'B', 'A', 'C', 'A', 'D', 'A', 'A', 'A', 'A', 'C', 'B', 'A', 'C', 'B', 'A', 'A', 'A', 'A', 'A', 'C', 'B'],
    'MANUEL MONSALVE': ['L', 'A', 'A', 'C', 'B', 'C', 'A', 'A', 'D', 'A', 'A', 'A', 'A', 'C', 'B', 'A', 'C', 'B', 'A', 'A', 'A', 'A', 'A', 'C', 'B'],
    'NANCI MENDEZ': ['L', 'A', 'A', 'B', 'C', 'A', 'A', 'A', 'B', 'C', 'A', 'A', 'B', 'C', 'A', 'D', 'C', 'A', 'A', 'A', 'B', 'C', 'A', 'A', 'A'],
    'TOMAS MAULEN': ['L', 'A', 'C', 'A', 'A', 'A', 'A', 'A', 'B', 'C', 'C', 'A', 'A', 'A', 'B', 'A', 'A', 'D', 'C', 'A', 'A', 'B', 'C', 'A', 'A'],
    'CATHERINE AEDO': ['L', 'A', 'B', 'C', 'A', 'A', 'A', 'A', 'C', 'B', 'B', 'A', 'A', 'A', 'C', 'A', 'C', 'A', 'D', 'A', 'A', 'C', 'B', 'A', 'A'],
    'ANA MARIA ASTORGA': ['L', 'C', 'B', 'A', 'A', 'A', 'A', 'C', 'B', 'B', 'A', 'A', 'C', 'A', 'C', 'A', 'A', 'A', 'D', 'A', 'C', 'B', 'A', 'A', 'A']
  };
  const CAL_CODIGOS = { 'A': '', 'B': '#d9ead3', 'C': '#ffb84d', 'D': '#fff176', 'V': '#a4c2f4', 'L': '#e06666', '': '' };
  let calendarioTurnos = {};
  async function loadCalendarioTurnos() {
    try { calendarioTurnos = (await api('/contactabilidad/config/calendario')) || {}; }
    catch (err) { console.error('Error cargando calendario:', err); calendarioTurnos = {}; }
    if (!calendarioTurnos || Object.keys(calendarioTurnos).length === 0) {
      calendarioTurnos = {};
      Object.keys(CAL_MES_DATOS_INICIALES).forEach(ej => {
        calendarioTurnos[ej] = {};
        CAL_MES_FECHAS.forEach((f, i) => { calendarioTurnos[ej][f] = CAL_MES_DATOS_INICIALES[ej][i]; });
      });
    }
  }
  async function saveCalendarioTurnos() {
    try { await api('/contactabilidad/config/calendario', { method: 'PUT', body: JSON.stringify({ valor: calendarioTurnos }) }); }
    catch (err) { console.error('Error guardando calendario:', err); }
  }
  function calDiaLabel(iso) {
    const d = new Date(iso + 'T12:00:00');
    const map = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return map[d.getDay()];
  }
  function openCalendarioModal() {
    const ejecs = Object.keys(calendarioTurnos);
    let html = '<table style="border-collapse:collapse;width:100%;font-size:11px"><thead><tr>';
    html += '<th style="position:sticky;left:0;background:var(--surface);z-index:2;padding:4px 8px;text-align:left;border:1px solid var(--border);min-width:150px">Ejecutivo</th>';
    CAL_MES_FECHAS.forEach(f => {
      const dia = f.slice(8, 10);
      html += `<th style="padding:2px;border:1px solid var(--border);min-width:34px;text-align:center">${dia}<br><span style="font-weight:400;opacity:.7">${calDiaLabel(f)}</span></th>`;
    });
    html += '<th style="padding:4px;border:1px solid var(--border)">A</th><th style="padding:4px;border:1px solid var(--border)">B</th><th style="padding:4px;border:1px solid var(--border)">C</th><th style="padding:4px;border:1px solid var(--border)">D</th>';
    html += '</tr></thead><tbody>';
    ejecs.forEach(ej => {
      html += `<tr><td style="position:sticky;left:0;background:var(--surface);z-index:1;padding:4px 8px;border:1px solid var(--border);white-space:nowrap">${ej}</td>`;
      CAL_MES_FECHAS.forEach(f => {
        const val = calendarioTurnos[ej][f] || 'A';
        const isFeriado = f === CAL_MES_FERIADO;
        const bg = CAL_CODIGOS[val] || '';
        const opts = ['A', 'B', 'C', 'D', 'V', 'L'].map(c => `<option value="${c}" ${c === val ? 'selected' : ''}>${c}</option>`).join('');
        html += `<td style="padding:0;border:1px solid var(--border);text-align:center"><select class="cal-cell" data-ejecutivo="${ej.replace(/"/g, '&quot;')}" data-fecha="${f}" onchange="PC.updateCalCell(this)" style="width:34px;border:none;background:${bg || 'transparent'};text-align:center;font-size:11px;padding:3px 0" ${isFeriado ? 'title="Feriado"' : ''}>${opts}</select></td>`;
      });
      ['A', 'B', 'C', 'D'].forEach(c => {
        html += `<td class="cal-total" data-ejecutivo="${ej.replace(/"/g, '&quot;')}" data-codigo="${c}" style="padding:4px;border:1px solid var(--border);text-align:center;font-weight:700"></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('calendario-container').innerHTML = html || '<div class="alert warn">No hay datos de calendario cargados.</div>';
    recalcCalTotales();
    document.getElementById('calendario-modal-overlay').classList.add('open');
  }
  function closeCalendarioModal() { document.getElementById('calendario-modal-overlay').classList.remove('open'); }
  function updateCalCell(sel) {
    const ej = sel.getAttribute('data-ejecutivo'), f = sel.getAttribute('data-fecha'), val = sel.value;
    if (!calendarioTurnos[ej]) calendarioTurnos[ej] = {};
    calendarioTurnos[ej][f] = val;
    sel.style.background = CAL_CODIGOS[val] || 'transparent';
    saveCalendarioTurnos();
    recalcCalTotales();
  }
  function recalcCalTotales() {
    document.querySelectorAll('.pc-view .cal-total').forEach(td => {
      const ej = td.getAttribute('data-ejecutivo'), codigo = td.getAttribute('data-codigo');
      const datos = calendarioTurnos[ej] || {};
      const count = Object.values(datos).filter(v => v === codigo).length;
      td.textContent = count;
    });
  }
  function exportCalendarioCSV() {
    const ejecs = Object.keys(calendarioTurnos);
    const headers = ['Ejecutivo', ...CAL_MES_FECHAS];
    const rows = ejecs.map(ej => [ej, ...CAL_MES_FECHAS.map(f => calendarioTurnos[ej][f] || 'A')].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'calendario_turnos.csv'; a.click();
  }
  function checkCalendarioAlerta(ejecutivo, fechaISO) {
    const datos = calendarioTurnos[ejecutivo];
    if (!datos) return undefined;
    return datos[fechaISO];
  }

  async function saveRecord() {
    const idx = document.getElementById('edit-idx').value;
    const rec = { fecha: document.getElementById('m-fecha').value, rut: document.getElementById('m-rut').value, estado: document.getElementById('m-estado').value, contactado: document.getElementById('m-contactado').value, ejecutivo: document.getElementById('m-ejecutivo').value, nombre_gestion: document.getElementById('m-gestion').value, proceso: document.getElementById('m-proceso').value, tipo_cita: document.getElementById('m-tipo').value };
    if (idx === '') {
      const alerta = checkTurnoAlerta(rec.ejecutivo);
      if (alerta && !confirm(alerta)) return;
    }
    try {
      if (idx === '') {
        const creado = await api('/contactabilidad/registros', { method: 'POST', body: JSON.stringify(rec) });
        records.push(creado);
      } else {
        const existente = records[parseInt(idx)];
        const actualizado = await api(`/contactabilidad/registros/${existente.id}`, { method: 'PUT', body: JSON.stringify(rec) });
        records[parseInt(idx)] = actualizado;
      }
    } catch (err) { alert('Error al guardar: ' + err.message); return; }
    recalcListas();
    closeModal(); renderBase();
  }
  async function deleteRecord(idx) {
    if (!confirm('¿Eliminar este registro?')) return;
    const rec = records[idx];
    try { await api(`/contactabilidad/registros/${rec.id}`, { method: 'DELETE' }); }
    catch (err) { alert('Error al eliminar: ' + err.message); return; }
    records.splice(idx, 1);
    renderBase();
  }
  function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
  function ensureOption(sel, val) {
    if (sel && ![...sel.options].some(o => o.value === val)) {
      const o = document.createElement('option'); o.value = val; o.textContent = val; sel.appendChild(o);
    }
  }
  function syncModalContactado() {
    const est = document.getElementById('m-estado').value;
    const cont = document.getElementById('m-contactado');
    const proc = document.getElementById('m-proceso');
    if (est === 'CONTACTADO') {
      cont.value = 'CONFIRMA CITA';
      ensureOption(proc, 'CORREOS GESTIONADOS');
      proc.value = 'CORREOS GESTIONADOS';
    } else if (est === 'NO CONTACTADO') {
      cont.value = 'NO CONTACTADO';
      ensureOption(proc, 'CORREOS GESTIONADOS');
      proc.value = 'CORREOS GESTIONADOS';
    } else {
      cont.value = '';
    }
  }
  function exportCSV() {
    const headers = ['Fecha', 'RUT', 'Estado', 'Contactado', 'Ejecutivo', 'Nombre Gestion', 'Proceso', 'Tipo Cita'];
    const rows = baseFiltered.map(r => [r.fecha, r.rut, r.estado || '', r.contactado || '', r.ejecutivo, (r.nombre_gestion || '').replace(/,/g, ';'), r.proceso, r.tipo_cita || ''].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'contactabilidad.csv'; a.click();
  }

  // CARGA MASIVA
  function openBulkModal() {
    fillModalSelect(document.getElementById('bm-ejecutivo'), ejecutivos, '');
    fillModalSelect(document.getElementById('bm-proceso'), procesos, '');
    asegurarProcesosFijos(document.getElementById('bm-proceso'));
    document.getElementById('bm-fecha').value = new Date().toISOString().slice(0, 10);
    document.getElementById('bm-ruts').value = '';
    document.getElementById('bm-estado').value = '';
    document.getElementById('bm-contactado').value = '';
    document.getElementById('bm-preview').style.display = 'none';
    document.getElementById('bm-save-btn').disabled = true;
    document.getElementById('bm-save-btn').textContent = 'Cargar Registros';
    document.getElementById('bulk-modal-overlay').classList.add('open');
  }
  function closeBulkModal() { document.getElementById('bulk-modal-overlay').classList.remove('open'); }
  function syncBulkContactado() {
    const est = document.getElementById('bm-estado').value;
    if (est === 'NO CONTACTADO') {
      document.getElementById('bm-contactado').value = 'NO CONTACTADO';
      const bmProceso = document.getElementById('bm-proceso');
      if (bmProceso) {
        if (![...bmProceso.options].some(o => o.value === 'CORREOS GESTIONADOS')) {
          const o = document.createElement('option'); o.value = 'CORREOS GESTIONADOS'; o.textContent = 'CORREOS GESTIONADOS'; bmProceso.appendChild(o);
        }
        bmProceso.value = 'CORREOS GESTIONADOS';
      }
    } else if (est === 'CONTACTADO') {
      document.getElementById('bm-contactado').value = 'CONFIRMA CITA';
      const bmProceso = document.getElementById('bm-proceso');
      if (bmProceso) {
        if (![...bmProceso.options].some(o => o.value === 'CORREOS GESTIONADOS')) {
          const o = document.createElement('option'); o.value = 'CORREOS GESTIONADOS'; o.textContent = 'CORREOS GESTIONADOS'; bmProceso.appendChild(o);
        }
        bmProceso.value = 'CORREOS GESTIONADOS';
      }
    } else {
      document.getElementById('bm-contactado').value = '';
    }
  }
  function normalizeRut(rut) {
    return rut.trim().toUpperCase()
      .replace(/^RU[T]?/i, '')
      .replace(/\./g, '')
      .trim();
  }
  function isValidRut(rut) { return /^\d{6,9}-[\dkK]$/i.test(normalizeRut(rut)); }
  function updateBulkPreview() {
    const lines = document.getElementById('bm-ruts').value.split('\n').map(l => normalizeRut(l)).filter(l => l);
    if (!lines.length) { document.getElementById('bm-preview').style.display = 'none'; document.getElementById('bm-save-btn').disabled = true; return; }
    document.getElementById('bm-preview').style.display = 'block';
    const seen = new Set(); let valid = 0;
    const tbody = lines.map((rut, i) => {
      const t = rut.toUpperCase().trim();
      const ok = isValidRut(t), dup = seen.has(t);
      if (ok && !dup) valid++;
      if (ok) seen.add(t);
      const badge = !ok ? '<span style="color:var(--danger);font-size:10px">✕ Inválido</span>' : dup ? '<span style="color:var(--warn);font-size:10px">⚠ Duplicado</span>' : '<span style="color:var(--accent2);font-size:10px">✓ OK</span>';
      return `<tr><td style="padding:4px 8px;color:var(--muted)">${i + 1}</td><td style="padding:4px 8px;font-family:'DM Mono',monospace">${t}</td><td style="padding:4px 8px">${badge}</td></tr>`;
    }).join('');
    document.getElementById('bm-preview-body').innerHTML = tbody;
    document.getElementById('bm-summary').innerHTML = `Total: <strong>${lines.length}</strong> · <span style="color:var(--accent2)">Válidos únicos: <strong>${valid}</strong></span>`;
    document.getElementById('bm-save-btn').textContent = `Cargar ${valid} Registros`;
    document.getElementById('bm-save-btn').disabled = valid === 0;
  }
  async function saveBulkRecords() {
    const fecha = document.getElementById('bm-fecha').value, ejecutivo = document.getElementById('bm-ejecutivo').value;
    if (!fecha || !ejecutivo) { alert('Completa Fecha y Ejecutivo.'); return; }
    const alertaTurno = checkTurnoAlerta(ejecutivo);
    if (alertaTurno && !confirm(alertaTurno)) return;
    const lines = document.getElementById('bm-ruts').value.split('\n').map(l => normalizeRut(l)).filter(l => l);
    const seen = new Set(); const nuevos = [];
    lines.forEach(rut => {
      if (!isValidRut(rut) || seen.has(rut)) return;
      seen.add(rut);
      nuevos.push({ fecha, rut, estado: document.getElementById('bm-estado').value, contactado: document.getElementById('bm-contactado').value, ejecutivo, nombre_gestion: document.getElementById('bm-gestion').value, proceso: document.getElementById('bm-proceso').value, tipo_cita: document.getElementById('bm-tipo').value });
    });
    if (!nuevos.length) { alert('No hay RUT válidos para cargar.'); return; }
    let creados;
    try { creados = await api('/contactabilidad/registros/bulk-create', { method: 'POST', body: JSON.stringify({ records: nuevos }) }); }
    catch (err) { alert('Error al cargar registros: ' + err.message); return; }
    records.push(...creados);
    recalcListas();
    closeBulkModal(); renderBase();
    const a = document.getElementById('base-count-alert');
    a.textContent = `✓ Se cargaron ${creados.length} registros para ${ejecutivo}`;
    a.style.background = 'rgba(0,255,157,0.06)'; a.style.borderLeftColor = 'var(--accent2)'; a.style.color = 'var(--accent2)';
    setTimeout(() => renderBase(), 3000);
  }

  // CONFIGURACIÓN
  function renderConfig() {
    document.getElementById('cfg-ejecutivos-list').innerHTML = ejecutivos.map((e, i) => `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-family:'DM Mono',monospace;font-size:12px;display:flex;align-items:center;justify-content:space-between"><span>${e}</span><button class="btn danger" style="padding:3px 10px;font-size:10px" onclick="PC.deleteEjecutivo(${i})">✕ Eliminar</button></div>`).join('');
    document.getElementById('cfg-procesos-list').innerHTML = procesos.map((p, i) => `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-family:'DM Mono',monospace;font-size:12px;display:flex;align-items:center;justify-content:space-between"><span>${p}</span><button class='btn danger' style='padding:3px 10px;font-size:10px' onclick='PC.deleteProceso(${i})'>✕ Eliminar</button></div>`).join('');
    document.getElementById('cfg-meta').value = Math.round(META * 100);
  }
  async function clearAllRecords() {
    if (!confirm('⚠️ ¿Eliminar TODOS los registros?\nEsta acción no se puede deshacer.')) return;
    if (!confirm('Confirmar: se borrarán ' + records.length + ' registros para iniciar un nuevo mes.')) return;
    try { await api('/contactabilidad/registros', { method: 'DELETE' }); }
    catch (err) { alert('Error al limpiar la base: ' + err.message); return; }
    records = [];
    fechas = []; estados = []; tipos = [];
    renderBase();
    renderDashboard();
    alert('✅ Base de datos limpiada. Lista para el nuevo mes.');
  }
  function downloadCsvBackup(recs, filename) {
    const headers = ['Fecha', 'RUT', 'Estado', 'Contactado', 'Ejecutivo', 'Nombre Gestion', 'Proceso', 'Tipo Cita'];
    const rows = recs.map(r => [r.fecha, r.rut, r.estado || '', r.contactado || '', r.ejecutivo, (r.nombre_gestion || '').replace(/,/g, ';'), r.proceso, r.tipo_cita || ''].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }
  async function startNewMonth() {
    if (!records.length) { alert('No hay registros cargados.'); return; }
    const pendientes = records.filter(r => !r.estado || String(r.estado).trim() === '');
    const gestionados = records.filter(r => r.estado && String(r.estado).trim() !== '');

    if (!confirm(`🔄 INICIAR NUEVO MES\n\nSe detectaron:\n• ${pendientes.length} RUT SIN GESTIONAR (estado vacío) → se trasladarán al nuevo mes\n• ${gestionados.length} RUT ya gestionados (CONTACTADO / NO CONTACTADO) → se eliminarán de la base\n\nSe descargará primero un respaldo CSV completo del mes actual.\n\n¿Continuar?`)) return;

    const nuevaFecha = prompt('Ingresa la fecha para los RUT pendientes que se trasladan al nuevo mes (AAAA-MM-DD):', new Date().toISOString().slice(0, 10));
    if (!nuevaFecha || !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) { alert('Fecha inválida o cancelada. No se realizaron cambios.'); return; }

    if (!confirm(`Confirmación final:\n\n• Se eliminarán ${gestionados.length} registros ya gestionados.\n• Se trasladarán ${pendientes.length} RUT pendientes a la fecha ${nuevaFecha}.\n\nEsta acción no se puede deshacer (pero ya tendrás el respaldo CSV descargado).\n\n¿Proceder?`)) return;

    downloadCsvBackup(records, 'respaldo_mes_anterior_' + new Date().toISOString().slice(0, 10) + '.csv');

    try {
      if (gestionados.length) await api('/contactabilidad/registros/bulk-delete', { method: 'POST', body: JSON.stringify({ ids: gestionados.map(r => r.id) }) });
      if (pendientes.length) await api('/contactabilidad/registros/bulk-update', { method: 'POST', body: JSON.stringify({ ids: pendientes.map(r => r.id), changes: { fecha: nuevaFecha } }) });
    } catch (err) { alert('Error al iniciar el nuevo mes: ' + err.message); return; }

    records = pendientes.map(r => ({ ...r, fecha: nuevaFecha }));
    recalcListas();

    renderBase();
    renderDashboard();
    alert(`✅ Nuevo mes iniciado.\n${records.length} RUT pendientes trasladados a ${nuevaFecha}.\nSe descargó un respaldo CSV con los ${gestionados.length + pendientes.length} registros del mes anterior.`);
  }
  function deleteEjecutivo(idx) {
    const name = ejecutivos[idx];
    if (!confirm('¿Eliminar ejecutivo "' + name + '"?\nSolo se elimina de la lista de configuración. Los registros existentes con este ejecutivo no se borran.')) return;
    ejecutivos.splice(idx, 1);
    renderConfig();
  }
  function addProceso() {
    const name = prompt('Nombre del proceso:');
    if (name && !procesos.includes(name.toUpperCase())) { procesos.push(name.toUpperCase()); procesos.sort(); renderConfig(); }
  }
  function deleteProceso(idx) {
    const name = procesos[idx];
    if (!confirm('¿Eliminar proceso "' + name + '"?\nSolo se elimina de la lista de configuración. Los registros existentes con este proceso no se borran.')) return;
    procesos.splice(idx, 1);
    renderConfig();
  }
  function addEjecutivo() {
    const name = prompt('Nombre del ejecutivo:');
    if (name && !ejecutivos.includes(name.toUpperCase())) { ejecutivos.push(name.toUpperCase()); ejecutivos.sort(); renderConfig(); }
  }

  // TEMA (aislado del <body> global: usa la raíz .pc-view)
  function toggleTheme() {
    const root = document.getElementById('pc-view-root');
    if (!root) return;
    const isLight = root.classList.toggle('pc-light');
    document.getElementById('theme-btn').textContent = isLight ? '🌑 Oscuro' : '☀️ Claro';
    localStorage.setItem('pc_theme', isLight ? 'light' : 'dark');
  }
  function initTheme() {
    const root = document.getElementById('pc-view-root');
    if (!root) return;
    const saved = localStorage.getItem('pc_theme');
    const useLight = saved ? saved === 'light' : window.matchMedia('(prefers-color-scheme: light)').matches;
    if (useLight) { root.classList.add('pc-light'); document.getElementById('theme-btn').textContent = '🌑 Oscuro'; }
    else document.getElementById('theme-btn').textContent = '☀️ Claro';
  }

  // REPORTE TEAMS
  function openTeamsReport() {
    const report = generateTeamsReport();
    document.getElementById('teams-report-text').textContent = report;
    document.getElementById('teams-modal-overlay').classList.add('open');
    const btn = document.getElementById('teams-copy-btn');
    btn.textContent = '📋 Copiar Texto';
    btn.style.background = '';
  }
  function closeTeamsModal() {
    document.getElementById('teams-modal-overlay').classList.remove('open');
  }
  function copyTeamsReport() {
    const text = document.getElementById('teams-report-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('teams-copy-btn');
      btn.textContent = '✓ ¡Copiado!';
      btn.style.background = 'rgba(0,255,157,0.2)';
      setTimeout(() => { btn.textContent = '📋 Copiar Texto'; btn.style.background = ''; }, 2200);
    });
  }
  function generateTeamsReport() {
    const worked = records.filter(r => r.estado === 'CONTACTADO' || r.estado === 'NO CONTACTADO');
    const totalContactados = worked.filter(r => r.estado === 'CONTACTADO').length;
    const globalPct = worked.length ? Math.round((totalContactados / worked.length) * 100) : 0;
    const metaPct = Math.round(META * 100);

    const execData = ejecutivos.map(e => {
      const recs = records.filter(r => r.ejecutivo === e && (r.estado === 'CONTACTADO' || r.estado === 'NO CONTACTADO'));
      const cont = recs.filter(r => r.estado === 'CONTACTADO').length;
      return { exec: e, cont, total: recs.length, p: recs.length ? Math.round((cont / recs.length) * 100) : 0 };
    }).filter(e => e.total > 0).sort((a, b) => b.p - a.p);

    if (execData.length === 0) {
      return '⚠️ No hay datos suficientes aún para generar el reporte.\nCarga registros en la Base de Datos primero.';
    }

    const top = execData.filter(e => e.p >= 90);
    const bien = execData.filter(e => e.p >= metaPct && e.p < 90);
    const cerca = execData.filter(e => e.p >= Math.round(metaPct * 0.9) && e.p < metaPct);
    const bajo = execData.filter(e => e.p < Math.round(metaPct * 0.9));
    const superaMeta = globalPct >= metaPct;
    const promedio = execData.length ? Math.round(execData.reduce((s, e) => s + e.p, 0) / execData.length) : 0;

    let lines = [];

    if (superaMeta && globalPct >= 90) {
      lines.push('🔥 ¡Equipo imparable! Seguimos empujando el techo 🔥');
    } else if (superaMeta) {
      lines.push('🔥 ¡Seguimos subiendo el nivel equipo! 🔥');
    } else if (globalPct >= Math.round(metaPct * 0.92)) {
      lines.push('💪 ¡Vamos equipo, estamos muy cerca de la meta! 💪');
    } else {
      lines.push('⚡ Equipo, hay oportunidad real de mejorar hoy ⚡');
    }

    if (superaMeta && globalPct >= promedio) {
      lines.push(`Cerramos este avance con ${globalPct}% de contactabilidad, mejorando el resultado anterior y consolidándonos sobre la meta 💪`);
    } else if (superaMeta) {
      lines.push(`Cerramos con ${globalPct}% de contactabilidad. Estamos sobre la meta de ${metaPct}%, buen trabajo 💪`);
    } else {
      lines.push(`Vamos en ${globalPct}% de contactabilidad. La meta es ${metaPct}% — tenemos ${metaPct - globalPct} puntos por recuperar 🎯`);
    }

    lines.push('');
    lines.push('📊 Lo más potente de hoy:');
    if (top.length > 0 || bien.length > 0) lines.push('• Ya no solo cumplimos... estamos empujando el promedio hacia arriba');
    if (top.length > 0) lines.push(`• ${top.length} ejecutivo${top.length > 1 ? 's' : ''} sobre 90%, marcando un estándar sólido 🏆`);
    const cumplen = execData.filter(e => e.p >= metaPct).length;
    if (cumplen > 0) lines.push(`• ${cumplen} de ${execData.length} ejecutivos cumpliendo o superando la meta de ${metaPct}%`);

    if (top.length > 0) {
      lines.push(''); lines.push('🏆 Liderando resultados:');
      top.forEach(e => lines.push(`   ${fmtNombreTeams(e.exec)} (${e.p}%)`));
    }
    if (bien.length > 0) {
      lines.push(''); lines.push('🚀 Muy buen desempeño:');
      bien.forEach(e => lines.push(`   ${fmtNombreTeams(e.exec)} (${e.p}%)`));
    }
    if (cerca.length > 0) {
      lines.push(''); lines.push('📈 Muy cerca de la meta:');
      cerca.forEach(e => lines.push(`   ${fmtNombreTeams(e.exec)} (${e.p}%)`));
    }
    if (bajo.length > 0) {
      lines.push(''); lines.push('🔔 Con oportunidad de mejorar:');
      bajo.forEach(e => lines.push(`   ${fmtNombreTeams(e.exec)} (${e.p}%)`));
    }

    lines.push('');
    if (superaMeta) {
      lines.push(`⚡ Clave ahora: no conformarnos. Este ${globalPct}% puede seguir subiendo si mantenemos intensidad y foco en cada contacto.`);
      if (bajo.length > 0 || cerca.length > 0) lines.push('A quienes están un poco más abajo: están totalmente dentro de rango para recuperarse rápido. Ajustes pequeños → impacto grande.');
      const objetivo = Math.min(100, Math.ceil((globalPct + 1) / 5) * 5);
      lines.push(`🎯 Vamos por ese ${objetivo}% equipo. Se puede.`);
    } else {
      lines.push(`⚡ Todavía hay tiempo. Necesitamos ${metaPct - globalPct} puntos más para llegar a la meta.`);
      lines.push('Cada contacto cuenta. Foco, intensidad y constancia en cada llamada.');
      lines.push(`🎯 Vamos por ese ${metaPct}% equipo. Se puede.`);
    }

    return lines.join('\n');
  }
  function fmtNombreTeams(nombre) {
    return nombre.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // INIT
  async function init() {
    document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    initTheme();
    try {
      records = await api('/contactabilidad/registros');
    } catch (err) {
      document.getElementById('page-dashboard').innerHTML = `<div class="alert danger">No se pudo cargar el Panel de Contactabilidad: ${err.message}</div>`;
      return;
    }
    recalcListas();
    await Promise.all([loadTurnos(), loadCalendarioTurnos()]);
    renderDashboard();
  }

  return {
    init, showPage, setMeta,
    openTeamsReport, closeTeamsModal, copyTeamsReport,
    openAddModal, editRecord, deleteRecord, saveRecord, closeModal, syncModalContactado, normalizeRut,
    openBulkModal, closeBulkModal, updateBulkPreview, saveBulkRecords, syncBulkContactado,
    exportCSV, openCalendarioModal, closeCalendarioModal, updateCalCell, exportCalendarioCSV,
    openTurnosModal, closeTurnosModal, saveTurnosModal,
    toggleSelectAll, onRowCheck, deselectAll, applyBulkEdit, deleteBulkSelected, syncBulkBarContactado,
    startNewMonth, clearAllRecords, deleteEjecutivo, addProceso, deleteProceso, addEjecutivo,
    toggleTheme,
    renderIndividual, renderProceso, renderDiario, renderSemanal, renderCarga, renderAlertas, renderBase,
    gotoBasePage, prevBasePage, nextBasePage, gotoAlertaPage, prevAlertaPage, nextAlertaPage
  };
})();
