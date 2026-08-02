/* ============================================================
   HELPER: fetch autenticado
   ============================================================ */
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  if (res.status === 401) {
    alert('Tu sesión expiró. Vuelve a iniciar sesión.');
    document.getElementById('btnLogout').click();
    throw new Error('No autorizado');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

