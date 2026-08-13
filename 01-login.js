/* ============================================================
   LOGIN
   ============================================================ */
document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('errorLogin');
  const btnSubmit = document.getElementById('btnLoginSubmit');
  errorDiv.style.display = 'none';

  btnSubmit.disabled = true;
  const textoOriginalBoton = btnSubmit.textContent;
  btnSubmit.textContent = 'Ingresando...';
  mostrarCargandoGlobal();

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errorDiv.textContent = data.error || 'Error al iniciar sesión';
      errorDiv.style.display = 'block';
      return;
    }
    token = data.token;
    usuarioActual = data.usuario;
    localStorage.setItem('progresys_token', token);
    localStorage.setItem('progresys_usuario', JSON.stringify(usuarioActual));
    mostrarApp();
  } catch (err) {
    errorDiv.textContent = 'No se pudo conectar con el servidor. El backend gratuito de Render puede tardar ~30-60s en despertar si estaba inactivo — intenta de nuevo en un momento.';
    errorDiv.style.display = 'block';
  } finally {
    ocultarCargandoGlobal();
    btnSubmit.disabled = false;
    btnSubmit.textContent = textoOriginalBoton;
  }
});

document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem('progresys_token');
  localStorage.removeItem('progresys_usuario');
  token = null;
  usuarioActual = null;
  if (intervalPollingAlertas) clearInterval(intervalPollingAlertas);
  document.getElementById('app').style.display = 'none';
  document.getElementById('pantallaLogin').style.display = 'flex';
});

function mostrarPantallaBienvenida() {
  document.getElementById('tituloVista').textContent = 'Bienvenido';
  document.getElementById('contenido').innerHTML = `
    <div class="bienvenida">
      <h2>¡Bienvenido${usuarioActual.nombre ? ', ' + usuarioActual.nombre : ''}! 👋</h2>
      <p>Selecciona una opción del menú lateral para comenzar a trabajar.</p>
    </div>
  `;
}

function ocultarGruposVacios() {
  document.querySelectorAll('.menu-grupo').forEach(grupo => {
    const tieneBotonVisible = Array.from(grupo.querySelectorAll('button'))
      .some(b => b.style.display !== 'none');
    grupo.style.display = tieneBotonVisible ? '' : 'none';
  });
}

function mostrarApp() {
  document.getElementById('pantallaLogin').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('usuarioNombre').textContent = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
  document.getElementById('usuarioRol').textContent = usuarioActual.rol;
  mostrarPantallaBienvenida();

  if (usuarioActual.rol === 'EJECUTIVO') {
    // El Ejecutivo solo gestiona sus propios casos y reagendamientos: se ocultan el resto de los módulos
    document.getElementById('btnDashboard').style.display = 'none';
    document.getElementById('btnCorreos').style.display = 'none';
    document.getElementById('btnAlertas').style.display = 'none';
    document.getElementById('btnEjecutivos').style.display = 'none';
    document.getElementById('campanaWrap').style.display = 'none';
    ocultarGruposVacios();
    cargarCatalogos();
    cargarCatalogoAgencias();
    return;
  }

  if (usuarioActual.rol === 'ADMINISTRADOR' || usuarioActual.rol === 'SUPERVISOR') {
    document.getElementById('btnAuditoria').style.display = 'block';
    document.getElementById('btnReportes').style.display = 'block';
    document.getElementById('btnImportar').style.display = 'block';
  }
  document.getElementById('btnEjecutivos').style.display = 'block';
  if (usuarioActual.rol === 'ADMINISTRADOR') {
    document.getElementById('btnConfiguracion').style.display = 'block';
    document.getElementById('btnUsuarios').style.display = 'block';
    document.getElementById('btnReagConfiguracion').style.display = 'block';
  }
  ocultarGruposVacios();
  cargarCatalogos();
  cargarCatalogoAgencias();
  iniciarPollingAlertas();
}

async function cargarCatalogos() {
  try {
    catalogos = await api('/catalogos');
  } catch (err) {
    console.error('No se pudieron cargar los catálogos', err);
  }
}

// (autologin movido al final del script — ver más abajo)

