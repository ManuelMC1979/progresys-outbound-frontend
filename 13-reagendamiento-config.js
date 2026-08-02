/* ============================================================
   CONFIGURACIÓN SLA — REAGENDAMIENTO (independiente de Outbound)
   ============================================================ */
const etiquetasParamsReag = {
  corte_hora_am_pm: 'Hora de corte AM/PM (0-23) — tramo Ejecutivo → Administrador',
  hora_limite_mismo_dia_pm: 'Hora límite mismo día (si ingresó antes del corte)',
  hora_limite_dia_siguiente_am: 'Hora límite día siguiente (si ingresó en o después del corte)',
  sla_administrador_agencia_horas: 'Horas para que la agencia responda — tramo Administrador → Agencia',
  sla_agencia_administrador_horas: 'Horas para que Administración cierre tras la respuesta — tramo Agencia → Administrador'
};

async function renderReagConfiguracion() {
  const parametros = await api('/reagendamiento/parametros');
  const contenido = document.getElementById('contenido');

  contenido.innerHTML = `
    <p style="color:#555; max-width:640px; margin-bottom:16px;">
      Estos parámetros son propios del módulo Reagendamiento y no afectan el SLA de Outbound.
      Controlan los 3 tramos de tiempo: <b>Ejecutivo → Administrador</b>, <b>Administrador → Agencia</b>
      y <b>Agencia → Administrador</b>. Solo el Administrador puede modificarlos.
    </p>
    <table>
      <thead><tr><th>Parámetro</th><th>Valor actual</th><th>Última actualización</th><th></th></tr></thead>
      <tbody>
        ${parametros.map(p => `
          <tr>
            <td style="max-width:320px;">${etiquetasParamsReag[p.clave] || p.clave}</td>
            <td><input type="text" id="reagParam_${p.clave}" value="${p.valor}" style="width:90px; padding:4px 8px; border:1px solid #ccc; border-radius:4px;"></td>
            <td style="font-size:12px; color:#888;">${formatFecha(p.fecha_actualizacion)}</td>
            <td><button class="btn secundario" onclick="guardarParametroReag('${p.clave}')">Guardar</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function guardarParametroReag(clave) {
  const valor = document.getElementById(`reagParam_${clave}`).value.trim();
  if (!valor) { alert('El valor no puede estar vacío'); return; }
  try {
    await api(`/reagendamiento/parametros/${clave}`, { method: 'PUT', body: JSON.stringify({ valor }) });
    renderReagConfiguracion();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

