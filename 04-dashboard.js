/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard() {
  const kpi = await api('/dashboard');
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = `
    <div class="kpis">
      <div class="kpi-card"><div class="valor">${kpi.casos_recibidos}</div><div class="etiqueta">Casos recibidos</div></div>
      <div class="kpi-card"><div class="valor">${kpi.casos_pendientes}</div><div class="etiqueta">Casos pendientes</div></div>
      <div class="kpi-card"><div class="valor">${kpi.casos_gestionados}</div><div class="etiqueta">Casos gestionados</div></div>
      <div class="kpi-card"><div class="valor">${kpi.casos_cerrados}</div><div class="etiqueta">Casos cerrados</div></div>
      <div class="kpi-card"><div class="valor">${(kpi.contactabilidad_pct * 100).toFixed(0)}%</div><div class="etiqueta">Contactabilidad</div></div>
      <div class="kpi-card alerta"><div class="valor">${kpi.sla_vencidos}</div><div class="etiqueta">SLA vencidos</div></div>
      <div class="kpi-card alerta"><div class="valor">${kpi.alertas_activas}</div><div class="etiqueta">Alertas activas</div></div>
      <div class="kpi-card"><div class="valor">${kpi.tiempo_prom_primera_gestion_min ?? '—'}</div><div class="etiqueta">Min. prom. 1ª gestión</div></div>
    </div>
  `;
}

