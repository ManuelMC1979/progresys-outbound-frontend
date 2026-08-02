/* ============================================================
   CONFIGURACIÓN
   ============================================================ */
// Reemplaza esto por la URL real de tu backend en Render
const API_BASE = 'https://progresys-outbound-api.onrender.com/api';

let token = localStorage.getItem('progresys_token') || null;
let usuarioActual = JSON.parse(localStorage.getItem('progresys_usuario') || 'null');
let resultadosCache = null;
let catalogos = null;
let idCasoDetalleActual = null;

