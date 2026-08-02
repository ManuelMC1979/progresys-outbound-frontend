/* ============================================================
   GESTIÓN DE USUARIOS
   ============================================================ */
async function renderUsuarios() {
  const usuarios = await api('/usuarios');
  const contenido = document.getElementById('contenido');

  contenido.innerHTML = `
    <div class="toolbar">
      <button class="btn" onclick="abrirModalNuevoUsuario()">+ Nuevo usuario</button>
    </div>
    <table>
      <thead><tr>
        <th>Nombre</th><th>Correo</th><th>Rol</th><th>Ejecutivo vinculado</th>
        <th>Estado</th><th>Último acceso</th><th>Acciones</th>
      </tr></thead>
      <tbody>
        ${usuarios.map(u => `
          <tr>
            <td>${u.nombre} ${u.apellido}</td>
            <td>${u.email}</td>
            <td>${u.rol}</td>
            <td>${u.ejecutivo_vinculado || '—'}</td>
            <td>${estadoUsuarioBadge(u.estado)}</td>
            <td>${formatFecha(u.ultimo_acceso)}</td>
            <td>
              <button class="btn secundario" onclick="abrirModalResetPassword('${u.id_usuario}')">Resetear clave</button>
              ${u.estado === 'ACTIVO'
                ? `<button class="btn secundario" onclick="cambiarEstadoUsuario('${u.id_usuario}', 'INACTIVO')">Desactivar</button>`
                : `<button class="btn secundario" onclick="cambiarEstadoUsuario('${u.id_usuario}', 'ACTIVO')">Activar</button>`}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function estadoUsuarioBadge(estado) {
  const colores = { ACTIVO: 'gestionado', INACTIVO: 'cerrado', BLOQUEADO: 'pendiente' };
  return `<span class="badge ${colores[estado] || 'pendiente'}">${estado}</span>`;
}

async function abrirModalNuevoUsuario() {
  if (!catalogos) await cargarCatalogos();
  document.getElementById('nuNombre').value = '';
  document.getElementById('nuApellido').value = '';
  document.getElementById('nuEmail').value = '';
  document.getElementById('nuPassword').value = '';
  document.getElementById('nuRol').value = 'EJECUTIVO';
  document.getElementById('nuIdEjecutivo').innerHTML = (catalogos.ejecutivos || [])
    .map(e => `<option value="${e.id_ejecutivo}">${e.nombre}</option>`).join('');
  mostrarSelectEjecutivoSiCorresponde();
  document.getElementById('modalNuevoUsuario').classList.add('activo');
}

function mostrarSelectEjecutivoSiCorresponde() {
  const rol = document.getElementById('nuRol').value;
  document.getElementById('filaEjecutivoVinculado').style.display = rol === 'EJECUTIVO' ? 'block' : 'none';
}

async function guardarNuevoUsuario() {
  const body = {
    nombre: document.getElementById('nuNombre').value.trim(),
    apellido: document.getElementById('nuApellido').value.trim(),
    email: document.getElementById('nuEmail').value.trim(),
    password: document.getElementById('nuPassword').value,
    rol: document.getElementById('nuRol').value,
    id_ejecutivo: document.getElementById('nuRol').value === 'EJECUTIVO' ? document.getElementById('nuIdEjecutivo').value : null
  };
  if (!body.nombre || !body.apellido || !body.email || body.password.length < 6) {
    alert('Completa todos los campos (contraseña mínimo 6 caracteres)');
    return;
  }
  try {
    await api('/usuarios', { method: 'POST', body: JSON.stringify(body) });
    cerrarModal('modalNuevoUsuario');
    renderUsuarios();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function cambiarEstadoUsuario(idUsuario, nuevoEstado) {
  if (!confirm(`¿Confirmas cambiar el estado a ${nuevoEstado}?`)) return;
  try {
    await api(`/usuarios/${idUsuario}/estado`, { method: 'PUT', body: JSON.stringify({ estado: nuevoEstado }) });
    renderUsuarios();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function abrirModalResetPassword(idUsuario) {
  document.getElementById('resetIdUsuario').value = idUsuario;
  document.getElementById('resetPassword').value = '';
  document.getElementById('modalResetPassword').classList.add('activo');
}

async function guardarResetPassword() {
  const idUsuario = document.getElementById('resetIdUsuario').value;
  const password = document.getElementById('resetPassword').value;
  if (password.length < 6) { alert('La contraseña debe tener al menos 6 caracteres'); return; }
  try {
    await api(`/usuarios/${idUsuario}/resetear-password`, { method: 'POST', body: JSON.stringify({ password }) });
    cerrarModal('modalResetPassword');
    alert('Contraseña actualizada. Comunícasela de forma segura al usuario.');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

