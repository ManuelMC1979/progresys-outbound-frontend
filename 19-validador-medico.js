/* ============================================================
   VALIDADOR MÉDICO — validación de archivos de carga masiva
   (Adaptado desde la herramienta standalone "Validador_Médico_v4_6")
   ============================================================ */

// ─── CONFIGURACIÓN DE CAMPOS ────────────────────────────────────────────
const VM_CAMPOS_BASE = [
  {campo:'TELEFONO',        tipo:'telefono',   oblig:true},
  {campo:'FECHA_ORIGINAL',  tipo:'fecha',      oblig:true},
  {campo:'HORA_ORIGINAL',   tipo:'hora',       oblig:true},
  {campo:'FECHA_NUEVA',     tipo:'fecha',      oblig:false},
  {campo:'HORA_NUEVA',      tipo:'hora',       oblig:false},
  {campo:'RUT',             tipo:'rut',        oblig:true},
  {campo:'NOMBRE_PACIENTE', tipo:'texto',      oblig:true},
  {campo:'MEDICO',          tipo:'texto',      oblig:true},
  {campo:'UNIDAD_DE_TRATAMIENTO',tipo:'texto', oblig:true},
  {campo:'MODALIDAD_ATENCION',   tipo:'enum',  oblig:true,  valores:['PRESENCIAL','TELEFONICA','VIDEOCONSULTA']},
  {campo:'PRIORIZACION',    tipo:'texto',      oblig:false},
  {campo:'CAMPO_VARIABLE',  tipo:'texto',      oblig:false},
  {campo:'TIPO_SOLICITUD',  tipo:'enum',       oblig:true,  valores:['ANULACION','BLOQUEO Y CAMBIO DE CITA','CONFIRMACION','PROCEDIMIENTO']},
  {campo:'TIPO_PROCEDIMIENTO',tipo:'texto',    oblig:false},
  {campo:'EXAMEN',          tipo:'texto',      oblig:false},
  {campo:'LUGAR',           tipo:'texto',      oblig:true},
  {campo:'DIRECCION_CENTRO',tipo:'texto',      oblig:true},
  {campo:'fecha_carga',     tipo:'fecha_carga',oblig:true},
  {campo:'DESCRIPCION_CARGA',tipo:'texto',     oblig:true},
  {campo:'ZONA_HORARIA',    tipo:'texto',      oblig:true},
];
const VM_COLS_AUX = Array.from({length:20},(_,i)=>'AUX'+(i+1)).concat(['GENESYS1','GENESYS2','GENESYS3','GENESYS4','GENESYS5']);

const VM_MAPA_MEDICO_DIRECCION = new Map([
  ['TF AGENCIA SANTIAGO','Agustinas 1428 Santiago'],
  ['TF AGENCIA TEMUCO','rancia 324 Temuco'],
  ['TF AGENCIA SAN BERNARDO','Eyzaguirre 61 San Bernardo'],
  ['TF AGENCIA QUILICURA','Calle numero dos 9346 Panamericana Norte Quilicura'],
  ['TF AGENCIA ANTOFAGASTA','Avenida Grecia 840 Antofagasta'],
  ['TF AGENCIA LA FLORIDA','Avenida Vicuña Mackena Poniente 6903 La Florida'],
  ['TF AGENCIA MAIPU','Avenida Pajaritos 2521 Maipu'],
  ['TF AGENCIA SAN VICENTE','German Riesco 1185 san vicente'],
  ['TF AGENCIA LA CALERA','La torre 20 La calera'],
  ['TF AGENCIA PUENTE ALTO','Juan rojas maldonado 135 puente Alto'],
  ['TF AGENCIA LA SERENA','balmaceda 947 la serena'],
  ['AGENCIA LOS ANDES','Avenida Argentina 50 los andes'],
  ['AGENCIA RANCAGUA','avenida llibertador bernardo ohiggins 0317 rancagua'],
  ['TF AGENCIA CHILLAN','Avenida collin 532 chillan'],
  ['TF AGENCIA LA REINA','avenida jorge alesandri 50 la reina'],
  ['AGENCIA PUENTE ALTO','Juan rojas maldonado 135 puente Alto'],
  ['TF AGENCIA COYHAIQUE','Avenida ogana 1018 Coyhaique'],
  ['TF AGENCIA COQUIMBO','profesor zepeda 02 coquimbo'],
  ['TF AGENCIA LOS ANGELES','avenida alemania 800 los angeles'],
  ['AGENCIA LINARES','Brasil 921 Linares'],
  ['TF AGENCIA OSORNO','avenida zenteno 15 29 osorno'],
  ['AGENCIA PARQUE LAS AMERICAS','avenida monterrey 2975 conchali'],
  ['TF AGENCIA PARQUE LAS AMERICAS','avenida monterrey 2975 conchali'],
  ['AGENCIA SAN ANTONIO','avenida barros luco 1575 san antonio'],
  ['AGENCIA LA SERENA','balmaceda 947 la serena'],
  ['AGENCIA SAN BERNARDO','Eyzaguirre 61 San Bernardo'],
  ['TF AGENCIA TALCA','4 NORTE 1610 TALCA'],
  ['TF AGENCIA VALPARAISO','Edwards 150 valparaiso'],
  ['TF AGENCIA CONCEPCION','cardenio avello 70 concepcion'],
  ['AGENCIA LA FLORIDA','Avenida Vicuña Mackena Poniente 6903 La Florida'],
  ['TF AGENCIA BUIN','Carlos Condell 755 Buin'],
  ['TF AGENCIA LAS CONDES','Avenida Las condes 6830 Las condes'],
  ['TF AGENCIA VIÑA DEL MAR','7 norte 550 viña del mar'],
  ['TF AGENCIA SAN MIGUEL','avenida alcalde pedro alarcon 970 san miguel'],
  ['AGENCIA ILLAPEL','independencia 562 illapel'],
  ['TF AGENCIA CONSTITUCION','onederra 385 constitucion'],
  ['TF AGENCIA TALCAHUANO','colon 3138 talcahuano'],
  ['TF AGENCIA PUNTA ARENAS','avenida presidente bulnes 01448 a punta arenas'],
  ['AGENCIA SANTIAGO','Agustinas 1428 Santiago'],
  ['AGENCIA PUNTA ARENAS','avenida presidente bulnes 01448 a punta arenas'],
  ['AGENCIA CONSTITUCIÓN','onederra 385 constitucion'],
  ['TF AGENCIA SAN ANTONIO','avenida barros luco 1575 san antonio'],
  ['TF AGENCIA IQUIQUE','amunategui 1517 iquique'],
  ['AGENCIA SAN MIGUEL','avenida alcalde pedro alarcon 970 san miguel'],
  ['AGENCIA MAIPU','Avenida Pajaritos 2521 Maipu'],
  ['AGENCIA LA CALERA','La torre 20 La calera'],
  ['AGENCIA PARRAL','anibal pinto 247 parral'],
  ['TF AGENCIA SAN MIGUEL','avenida pedro alarcon 970 san miguel'],
  ['TF AGENCIA VALLENAR','merced 1150 vallenar'],
  ['TF AGENCIA PEÑAFLOR','vicuña mackena 1294 peñaflor'],
  ['TF AGENCIA OVALLE','miguel aguirre perry 132 Ovalle'],
  ['TF AGENCIA SAN FELIPE','SAN MARTIN 120 SAN FELIPE'],
  ['TF AGENCIA SAN FERNANDO','QUECHEREGUAS 577 SAN FERNANDO'],
  ['TF AGENCIA LOS ANDES','Avenida Argentina 50 los andes'],
  ['TF AGENCIA ARICA','JUAN NOE 1367 ARICA'],
  ['TF AGENCIA VALDIVIA','beauchef 705 valdivia'],
  ['TF AGENCIA TALAGANTE','21 DE MAYO 1121 TALAGANTE'],
  ['AGENCIA PEÑAFLOR','vicuña mackena 1294 peñaflor'],
  ['AGENCIA ANCUD','almirante latorre 1322 ancud'],
  ['AGENCIA LAS CONDES','Avenida Las condes 6830 Las condes'],
  ['AGENCIA VALDIVIA','beauchef 705 valdivia'],
  ['AGENCIA QUILICURA','Calle numero dos 9346 Panamericana Norte Quilicura'],
  ['AGENCIA CHILLAN','Avenida collin 532 chillan'],
  ['AGENCIA COQUIMBO','profesor zepeda 02 coquimbo'],
  ['AGENCIA SAN VICENTE','German Riesco 1185 san vicente'],
  ['AGENCIA TEMUCO','rancia 324 Temuco'],
  ['AGENCIA CONSTITUCION','onederra 385 constitucion'],
  ['TF AGENCIA CURICO','carrera 095 curico'],
  ['AGENCIA SAN FERNANDEO','QUECHEREGUAS 577 SAN FERNANDO'],
  ['TF AGENCIA CORONEL','LOS CARRERA 299 CORONEL'],
  ['TF AGENCIA LA FLORDA','Avenida Vicuña Mackena Poniente 6903 La Florida'],
  ['TF AGENCIA RANCAGUA','avenida llibertador bernardo ohiggins 0317 rancagua'],
  ['AGENCIA COPIAPO','Vallejos 570 Copiapo'],
  ['AGENCIA SAN FERNANDO','QUECHEREGUAS 577 SAN FERNANDO'],
  ['SAN BERNARDO','Eyzaguirre 61 San Bernardo'],
  ['AGENCIA SANTA CRUZ','JJ CARVACHO 101 SANTA CRUZ'],
  ['AGENCIA PENAFLOR','vicuña mackena 1294 peñaflor'],
  ['AGENCIA TALAGANTE','21 DE MAYO 1121 TALAGANTE'],
  ['AG SAN FERNANDO','QUECHEREGUAS 577 SAN FERNANDO'],
  ['AG SAN VICENTE','German Riesco 1185 san vicente'],
  ['AG MAIPU','Avenida Pajaritos 2521 Maipu'],
  ['AG PUENTE ALTO','Juan rojas maldonado 135 puente Alto'],
  ['AG SANTIAGO','Agustinas 1428 Santiago'],
  ['AGENCIA CASTRO','Freire 498 Castro'],
  ['AGENCIA CURANILAHUE','la colcha sn acceso norte Curanilahue'],
  ['AGENCIA MELIPILLA','MERCED 710 MELIPILLA'],
  ['AGENCIA NATALES','BAQUEDANO 230 PUERTO NATALES'],
  ['AGENCIA COLINA','Carretera General san martin 085 Collina'],
  ['AGENCIA BUIN','Carlos Condell 755 Buin'],
  ['AGENCIA ALAMEDA',' Avenida Libertador Bernardo o higgins 4227 estación central'],
  ['AGENCIA ALAMENDA',' Avenida Libertador Bernardo o higgins 4227 estación central'],
  ['AGENCIA VIÑA DEL MAR','7 norte 550 viña del mar'],
  ['AGENCIA VESPUCIO OESTE','Avenida Vespucio Oeste 560 Las Condes'],
  ['AGENCIA ARAUCO','Horcones Sin numero Interior Celulosa Arauco SA']
].map(([k,v])=>[k.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\./g,'').replace(/\s+/g,' ').trim().toUpperCase(),v]));

// Diccionario de unidades: {dir, piso, sector}
const VM_MAPA_UNIDAD_DIRECCION = new Map([
  ['UT CONSULTA EXTREMIDAD SUPERIOR',           {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA ANESTESIOLOGIA',                {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA DERMATOLOGIA',                  {dir:'Ramón Carnicer 185',        piso:'',        sector:''}],
  ['UT CONSULTA CIRUGIA VASCULAR',              {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT CONSULTA PSIQUIATRIA',                   {dir:'Vicuña Mackenna 200',       piso:'Piso 3',  sector:'C'}],
  ['UT CONSULTA PSICOLOGIA',                    {dir:'Vicuña Mackenna 200',       piso:'Piso 3',  sector:'C'}],
  ['UT TERAPIA FISICA EEII',                    {dir:'Ramón Carnicer 185',        piso:'Piso 1',  sector:'E'}],
  ['UT NUTRICIONISTA',                          {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT CONSULTA UNIDAD MUSCULOESQUELETICA',     {dir:'Ramón Carnicer 185',        piso:'Piso 2',  sector:'A'}],
  ['UT CONSULTA CIEL',                          {dir:'Vicuña Mackenna 200',       piso:'Piso 4',  sector:'C'}],
  ['UT TERAPIA FISICA COLUMNA',                 {dir:'Ramón Carnicer 185',        piso:'Piso 1',  sector:'E'}],
  ['UT CONSULTA INFECTOLOGIA',                  {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT CONSULTA RODILLA',                       {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA MEDICINA INTERNA',              {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT PROVOCACION BRONQUIAL',                  {dir:'Ramón Carnicer 185',        piso:'',        sector:''}],
  ['UT BIOMECANICA HT',                         {dir:'Ramón Carnicer 185',        piso:'Piso 1',  sector:'E'}],
  ['UT CONSULTA GRUPAL PSICOLOGIA',             {dir:'Vicuña Mackenna 200',       piso:'Piso 3',  sector:''}],
  ['UT SCANNER',                                {dir:'Ramón Carnicer 185',        piso:'Piso -2', sector:'B'}],
  ['UT CONSULTA NEUROCIRUGIA',                  {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA TMT GENERAL',                   {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA HOMBRO',                        {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA FONOAUDIOLOGIA',                {dir:'Vicuña Mackenna 200',       piso:'Piso 3',  sector:'C'}],
  ['UQ PABELLON CENTRAL',                       {dir:'Ramón Carnicer 185',        piso:'Piso 6',  sector:'E'}],
  ['UT CONSULTA CIRUGIA GENERAL',               {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA MEDICINA REHABILITACION (FISIATRIA)', {dir:'Ramón Carnicer 185',  piso:'Piso 4',  sector:'A'}],
  ['UT TERAPIA FISICA EESS',                    {dir:'Ramón Carnicer 185',        piso:'Piso 1',  sector:'E'}],
  ['UT CONSULTA CADERA Y PELVIS',               {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT ECOTOMOGRAFIA HT',                       {dir:'Ramón Carnicer 185',        piso:'Piso -2', sector:'B'}],
  ['UT CONSULTA DOLOR CRONICO',                 {dir:'Vicuña Mackenna 200',       piso:'Piso 4',  sector:'A'}],
  ['UT LABORATORIO DE EVALUACION AUDITIVA',     {dir:'Vicuña Mackenna 200',       piso:'Piso 3',  sector:'C'}],
  ['UT NEURORREHABILITACION',                   {dir:'Ramón Carnicer 185',        piso:'Piso 1',  sector:'F'}],
  ['UT CONSULTA CIRUGIA MAXILOFACIAL',          {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT CONSULTA NEUROLOGIA',                    {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT FONOAUDIOLOGIA LABORATORIO DE LA VOZ',   {dir:'Vicuña Mackenna 200',       piso:'Piso 3',  sector:'C'}],
  ['UT CONSULTA MEDICA SEP',                    {dir:'Ramón Carnicer 185',        piso:'',        sector:''}],
  ['UT POLI DE RECONSTRUCCION',                 {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA ATENCION ESPONTANEO',           {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['ENFERMERIA CAA',                            {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT TELEVIDEO LARINGOSCOPIA',                {dir:'Ramón Carnicer 185',        piso:'',        sector:''}],
  ['UT TERAPIA OCUPACIONAL',                    {dir:'Ramón Carnicer 185',        piso:'Piso 1',  sector:'F'}],
  ['UT CONS MAXILO FACIAL DENTAL',              {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT CONSULTA ATENCION PRIMARIA',             {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT CONSULTA ENFERMEDADES RESPIRATORIAS',    {dir:'Ramón Carnicer 185',        piso:'',        sector:''}],
  ['UT CONSULTA TOBILLO Y PIE',                 {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA COLUMNA',                       {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA OFTALMOLOGIA',                  {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT CONSULTA OTORRINOLARINGOLOGIA',          {dir:'Ramón Carnicer 185',        piso:'',        sector:''}],
  ['UT CONSULTA ANESTESIA VSC',                 {dir:'Ramón Carnicer 185',        piso:'',        sector:''}],
  ['UT TERAPIA FISICA RESPIRATORIO',            {dir:'Ramón Carnicer 185',        piso:'Piso 1',  sector:'E'}],
  ['UT LABORATORIO FUNCIONAL',                  {dir:'Vicuña Mackenna 200',       piso:'Piso 3',  sector:'C'}],
  ['UT RAYOS X HT',                             {dir:'Ramón Carnicer 185',        piso:'Piso -2', sector:'B'}],
  ['UT CONSULTA UROLOGIA',                      {dir:'Ramón Carnicer 185',        piso:'Piso 4',  sector:'A'}],
  ['UT RESONANCIA MAGNETICA',                   {dir:'Ramón Carnicer 185',        piso:'Piso -2', sector:'B'}],
  ['UT CONSULTA SALUD OCUPACIO.Y TOXICOLOGIA',  {dir:'Ramón Carnicer 185',        piso:'',        sector:''}],
  ['UT ENFERMERIA PREQUIRURGICO',               {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT ENFERMERIA EXAMENES',                    {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT CONSULTA CX PLASTICA QUEMADOS',          {dir:'Ramón Carnicer 185',        piso:'Piso 3',  sector:'A'}],
  ['UT TERAPIA FISICA GENERAL',                 {dir:'Ramón Carnicer 185',        piso:'Piso 1',  sector:'E'}],
].map(([k,v])=>[k.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase(),v]));

function vmGetDireccionPorUnidad(unidad){
  if(!unidad) return null;
  const clave = String(unidad).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
  if(VM_MAPA_UNIDAD_DIRECCION.has(clave)) return VM_MAPA_UNIDAD_DIRECCION.get(clave);
  for(const [k,v] of VM_MAPA_UNIDAD_DIRECCION){
    if(clave === k || clave.includes(k) || k.includes(clave)) return v;
  }
  return null;
}

function vmFormatearDireccionUnidad(info){
  if(!info) return null;
  const partes = [info.dir];
  if(info.piso)   partes.push(info.piso);
  if(info.sector) partes.push('Sector ' + info.sector);
  partes.push('Providencia');
  return partes.join(', ');
}

const VM_GLOSARIO_TRADUCCION = new Map();
[
  ['TMT EESS','TRAUMATOLOGIA MANO Y CODO'],
  ['TMT HOMBRO','Traumatología Hombro'],
  ['TMT RODILLA','Traumatología Rodilla'],
  ['TMT TYP','Traumatología tobillo y pie'],
  ['MAXILOFACIAL','MAXILOFACIAL'],
  ['TMT EEII','Extremidad inferior'],
  ['EESS','Extremidad superior'],
  ['EEII','Extremidad inferior'],
  ['FISIATRIA','FISIATRIA'],
  ['PSIQUIATRIA','PSIQUIATRIA'],
  ['ATENCION PRIMARIA','ATENCION PRIMARIA'],
  ['NEUROLOGIA','NEUROLOGIA'],
  ['RX','RAYOS X'],
  ['CPQ','Cirugía Plastica'],
  ['CIRUGIA GRAL','Cirugía general'],
  ['TMT CYP','Traumatologia Cadera y pelvis'],
  ['ECO','ECOGRAFIA'],
  ['TMT COLUMNA','Traumatologia Columna'],
  ['TMT TOBILLO Y PIE','Traumatología Tobillo y pie'],
  ['TMT EXTREMIDAD SUPERIOR','Traumatología extremedidad superior'],
  ['TAC MUÑECA IZQ','Tac de muñeca izquierda'],
  ['TMT CADERA','Traumatología Cadera'],
  ['TMT MANO','Traumatología Mano'],
  ['TMT BECADO','Traumatología general'],
  ['CQ','Cirugia y quemados'],
  ['TO','TERAPIA OCUPACIONAL'],
  ['ESS','Traumatología mano y codo'],
  ['EMG','Electromio'],
  ['PSQ','PSIQUIATRIA'],
  ['OTL','OFTALMOLOGIA']
].forEach(([k,v])=>{
  const key = k.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\./g,'').replace(/\s+/g,' ').trim().toUpperCase();
  VM_GLOSARIO_TRADUCCION.set(key,v);
});

const VM_CAMPOS_BASE_KEYS = VM_CAMPOS_BASE.map(c=>c.campo.toUpperCase());

// ─── ESTADO GLOBAL ───────────────────────────────────────────────────────
let vmRegistros = [];
let vmColsDetectadas = [];
let vmColsAuxDetectadas = [];
let vmFiltroActivo = 'todos';
let vmServicioExportacion = '';
let vmModoExportar = null;

// ─── RENDER PRINCIPAL ────────────────────────────────────────────────────
async function renderValidadorMedico(){
  const contenido = document.getElementById('contenido');

  vmRegistros = [];
  vmColsDetectadas = [];
  vmColsAuxDetectadas = [];
  vmFiltroActivo = 'todos';

  contenido.innerHTML = `
    <div class="vm-view">
      <div class="upload-zone" id="vm-drop-zone">
        <input type="file" id="vm-file-input" accept=".txt,.csv,.xlsx,.xls,.tsv">
        <div class="upload-icon">📁</div>
        <h2>Arrastra tu archivo aquí o haz clic para seleccionar</h2>
        <p>El archivo debe seguir la estructura de columnas del ejemplo oficial</p>
        <div class="ftypes"><span>.XLSX</span><span>.XLS</span><span>.CSV</span><span>.TSV</span><span>.TXT</span></div>
        <button class="btn btn-outline" style="margin-top:14px;" onclick="event.stopPropagation();vmDescargarPlantilla()">⬇ Descargar Plantilla de Ejemplo</button>
      </div>

      <div id="vm-status">📄 Sube un archivo para comenzar la validación.</div>

      <div id="vm-results">
        <div class="cards">
          <div class="card total"><div class="num" id="vm-cnt-total">0</div><div class="lbl">Registros</div></div>
          <div class="card ok"><div class="num" id="vm-cnt-ok">0</div><div class="lbl">Sin errores</div></div>
          <div class="card err"><div class="num" id="vm-cnt-err">0</div><div class="lbl">Con errores</div></div>
          <div class="card warn"><div class="num" id="vm-cnt-falt">0</div><div class="lbl">Campos vacíos</div></div>
        </div>

        <div class="panel">
          <div class="panel-hdr">
            <h3>🔍 Revisión campo a campo</h3>
            <span class="hint">Los campos en rojo requieren corrección</span>
          </div>
          <div class="panel-body">
            <div class="tabs">
              <button class="tab active" onclick="vmSetTab(event,'todos')">Todos</button>
              <button class="tab" onclick="vmSetTab(event,'errores')">Solo con errores</button>
              <button class="tab" onclick="vmSetTab(event,'ok')">Solo correctos</button>
            </div>
            <div class="legend">
              <span><span class="dot ok"></span>Valor correcto</span>
              <span><span class="dot err"></span>Error detectado</span>
              <span><span class="dot empty"></span>Campo vacío</span>
            </div>
            <input class="search-box" type="text" id="vm-buscar" placeholder="🔎 Buscar por RUT, nombre, médico, teléfono..." oninput="vmRenderTabla()">
            <div class="table-scroll-top" id="vm-table-scroll-top" style="display:block"><div></div></div>
            <div class="table-wrap" id="vm-table-wrap">
              <table id="vm-tabla-main">
                <thead id="vm-thead"></thead>
                <tbody id="vm-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="panel" id="vm-export-panel">
          <div class="panel-hdr">
            <h3>📤 Exportar archivo corregido</h3>
          </div>
          <div class="panel-body">
            <div style="background:var(--cyan-glow);border-left:4px solid var(--cyan);padding:12px 14px;border-radius:var(--radius-sm);margin-bottom:16px;">
              <p style="font-size:12px;color:var(--text);font-weight:500;margin:0;">
                ℹ️ <strong>Importante:</strong> Al descargar, se te pedirá el nombre del servicio. El archivo se guardará como <code style="background:#fff;padding:2px 6px;border-radius:4px;font-family:var(--mono);font-size:11px;">CL_CALLBOT_OUTBOUND_CAA_[SERVICIO]</code>
              </p>
            </div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:14px;">
              Descarga el archivo con todos los registros. Los registros se exportan corregidos en texto, manteniendo las columnas AUX y GENESYS completas. También puedes exportar solo los registros sin errores.
            </p>
            <div class="actions" style="flex-wrap:wrap;gap:10px;">
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <button class="btn btn-green" onclick="vmPedirAviso('todos')">⬇ Exportar TODO (.xlsx)</button>
                <span style="font-size:10.5px;color:var(--muted);text-align:center;">Exporta todos los registros<br>(con y sin errores)</span>
              </div>
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <button class="btn btn-orange" onclick="vmPedirAviso('errores')">⬇ Solo con errores (.xlsx)</button>
                <span style="font-size:10.5px;color:var(--muted);text-align:center;">Solo registros que tienen<br>al menos un error detectado</span>
              </div>
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <button class="btn btn-outline" onclick="vmPedirAviso('ok')">⬇ Solo correctos (.xlsx)</button>
                <span style="font-size:10.5px;color:var(--muted);text-align:center;">Solo registros sin ningún<br>error ni campo faltante</span>
              </div>
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <button class="btn" style="background:#fff;border:1.5px solid var(--border-strong);color:var(--text);gap:6px;" onclick="vmLimpiarTodo()">🗑 Limpiar</button>
                <span style="font-size:10.5px;color:var(--muted);text-align:center;">Borra los datos cargados<br>y resetea el validador</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-overlay" id="vm-modal-servicio">
          <div class="modal">
            <div class="modal-title">🏢 Nombre del servicio</div>
            <div class="modal-desc">
              Ingresa el nombre del servicio. El archivo se descargará como:<br>
              <code style="background:var(--surface);padding:4px 8px;border-radius:4px;font-family:var(--mono);font-size:12px;">CL_CALLBOT_OUTBOUND_CAA_[TU_SERVICIO]</code>
            </div>
            <input type="text" id="vm-input-servicio" class="modal-input" placeholder="Ej: CITAS, ATENCIONES, LABORATORIO..." onkeypress="if(event.key==='Enter') vmConfirmarServicio()">
            <div class="modal-actions">
              <button class="modal-btn modal-btn-cancel" onclick="vmCerrarModalServicio()">Cancelar</button>
              <button class="modal-btn modal-btn-confirm" id="vm-btn-confirmar" onclick="vmConfirmarServicio()">Descargar</button>
            </div>
          </div>
        </div>

        <div class="modal-overlay" id="vm-modal-aviso">
          <div class="modal modal-aviso">
            <div class="modal-title">⚠️ Revisa antes de enviar</div>
            <div class="modal-desc" style="margin-bottom:12px;">Por favor, ten en cuenta las siguientes indicaciones antes de usar este archivo:</div>
            <ul class="aviso-lista">
              <li>Revisa cada registro del archivo antes de enviarlo al sistema.</li>
              <li>Verifica que los nombres, fechas y horas estén correctamente escritos.</li>
              <li><strong>No uses abreviaturas.</strong> El bot no reconoce términos abreviados. Escribe siempre las palabras completas (por ejemplo: "Traumatología" en lugar de "Trauma", "Doctor" en lugar de "Dr.").</li>
              <li>Asegúrate de que la dirección y el lugar de atención correspondan correctamente a cada paciente.</li>
            </ul>
            <div class="modal-actions">
              <button class="modal-btn modal-btn-cancel" onclick="vmCancelarAviso()">Cancelar</button>
              <button class="modal-btn modal-btn-confirm" onclick="vmConfirmarAviso()">Entendido, continuar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('vm-results').style.display = 'none';
  document.getElementById('vm-export-panel').style.display = 'none';

  vmInicializarView();
}

function vmInicializarView(){
  const dz = document.getElementById('vm-drop-zone');
  const fi = document.getElementById('vm-file-input');
  if(dz && fi){
    dz.addEventListener('click', ()=>fi.click());
    dz.addEventListener('dragover', e=>{e.preventDefault();dz.classList.add('drag');});
    dz.addEventListener('dragleave', ()=>dz.classList.remove('drag'));
    dz.addEventListener('drop', e=>{e.preventDefault();dz.classList.remove('drag');const f=e.dataTransfer.files[0];if(f)vmProcesar(f);});
    fi.addEventListener('change', e=>{if(e.target.files[0])vmProcesar(e.target.files[0]);});
  }

  const tableWrap = document.getElementById('vm-table-wrap');
  const tableScrollTop = document.getElementById('vm-table-scroll-top');
  if(tableWrap && tableScrollTop){
    tableWrap.addEventListener('scroll',()=>{tableScrollTop.scrollLeft=tableWrap.scrollLeft;});
    tableScrollTop.addEventListener('scroll',()=>{tableWrap.scrollLeft=tableScrollTop.scrollLeft;});
  }
  vmAjustarScrollerSuperior();
}

window.addEventListener('resize', function(){
  if(document.getElementById('vm-table-scroll-top')) vmAjustarScrollerSuperior();
});

function vmSetStatus(msg,spin){
  const el = document.getElementById('vm-status');
  if(el) el.innerHTML=(spin?'<span class="spinner"></span>':'')+msg;
}

async function vmProcesar(file){
  vmSetStatus('Procesando <strong>'+file.name+'</strong>…',true);
  document.getElementById('vm-results').style.display='none';
  document.getElementById('vm-export-panel').style.display='none';
  const ext=file.name.split('.').pop().toLowerCase();
  const esEspecial = vmEsArchivoEspecial(file.name);
  let filas=[];
  try{
    if(['xlsx','xls'].includes(ext)) filas=await vmLeerExcel(file);
    else{const txt=await vmLeerTexto(file);filas=vmParsearPlano(txt,ext);}
  }catch(e){vmSetStatus('❌ Error al leer el archivo: '+e.message);return;}
  if(!filas.length){
    if(esEspecial){ vmSetStatus('📄 Sube un archivo para comenzar la validación.'); return; }
    vmSetStatus('⚠ No se encontraron datos en el archivo.');
    return;
  }
  vmProcesarFilas(filas, esEspecial);
}

function vmLeerTexto(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=e=>res(e.target.result);
    r.onerror=()=>rej(new Error('No se pudo leer'));
    r.readAsText(file,'UTF-8');
  });
}

function vmParseMesHoja(sheetName){
  const meses = {
    ENERO:1, FEBRERO:2, MARZO:3, ABRIL:4, MAYO:5, JUNIO:6,
    JULIO:7, AGOSTO:8, SEPTIEMBRE:9, OCTUBRE:10, NOVIEMBRE:11, DICIEMBRE:12
  };
  const nombre = String(sheetName||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
  const match = nombre.match(/^(\d{1,2})[-_\s\.]+([A-ZÑ]+)$/);
  if(!match) return null;
  const dia = Number(match[1]);
  const mesNombre = match[2].trim();
  const mes = meses[mesNombre] || parseInt(mesNombre,10);
  if(!dia || !mes || mes < 1 || mes > 12) return null;
  return {dia,mes,hoja:sheetName};
}

function vmSeleccionarHojaFechaMasActual(wb){
  const fechas = wb.SheetNames.map(vmParseMesHoja).filter(Boolean);
  if(!fechas.length) return null;
  fechas.sort((a,b)=>{if(a.mes!==b.mes) return a.mes-b.mes; return a.dia-b.dia;});
  return fechas[fechas.length-1].hoja;
}

function vmEsArchivoEspecial(nombre){
  return /^PLANTILLA\s+CL_CALLBOT_OUTBOUND_CAA/i.test(String(nombre||'').replace(/\s+/g,' '));
}

function vmDetectarHojaCorrecta(wb, fileName){
  if(vmEsArchivoEspecial(fileName)){
    const hojaActual = vmSeleccionarHojaFechaMasActual(wb);
    if(hojaActual) return hojaActual;
  }

  const camposObligatorios=['TELEFONO','FECHA_ORIGINAL','HORA_ORIGINAL','FECHA_NUEVA','HORA_NUEVA','RUT','NOMBRE_PACIENTE','MEDICO','UNIDAD_DE_TRATAMIENTO','MODALIDAD_ATENCION','PRIORIZACION','CAMPO_VARIABLE','TIPO_SOLICITUD','TIPO_PROCEDIMIENTO','EXAMEN','LUGAR','DIRECCION_CENTRO','FECHA_CARGA','DESCRIPCION_CARGA','ZONA_HORARIA','AUX1','AUX2','AUX3','AUX4','AUX5','AUX6','AUX7','AUX8','AUX9','AUX10','AUX11','AUX12','AUX13','AUX14','AUX15','AUX16','AUX17','AUX18','AUX19','AUX20','GENESYS1','GENESYS2','GENESYS3','GENESYS4','GENESYS5'];

  for(const sheetName of wb.SheetNames){
    const ws=wb.Sheets[sheetName];
    const testRow=XLSX.utils.sheet_to_json(ws,{defval:'',raw:true,cellDates:false}).slice(0,1);
    if(testRow.length===0)continue;
    const headers=Object.keys(testRow[0]).map(h=>h.trim().toUpperCase());
    const tieneBase=camposObligatorios.every(campo=>headers.some(h=>h===campo));
    if(tieneBase) return sheetName;
  }
  return wb.SheetNames[0];
}

function vmLeerExcel(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=e=>{
      try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true});
        const sheetNameCorreto=vmDetectarHojaCorrecta(wb,file.name);
        const ws=wb.Sheets[sheetNameCorreto];
        const rows=XLSX.utils.sheet_to_json(ws,{defval:'',raw:true,cellDates:true});
        const parsed = rows.map(row=>{
          const rec={};
          Object.keys(row).forEach(k=>{
            let v=row[k];
            if(v instanceof Date && !isNaN(v)){
              if(v.getFullYear()<=1900){
                const hh=String(v.getHours()).padStart(2,'0');
                const mm=String(v.getMinutes()).padStart(2,'0');
                v=hh+':'+mm;
              } else {
                const dd=String(v.getDate()).padStart(2,'0');
                const mm=String(v.getMonth()+1).padStart(2,'0');
                const yyyy=v.getFullYear();
                v=dd+'-'+mm+'-'+yyyy;
              }
            } else {
              v=vmLimpiarWhitespace(v);
            }
            rec[k.trim()]=v;
          });
          return rec;
        }).filter(r=>!vmEsFilaVacia(r) && !vmEsFilaSinContenidoBase(r));
        res(parsed);
      }catch(e){rej(e);}
    };
    r.onerror=()=>rej(new Error('Error leyendo Excel'));
    r.readAsArrayBuffer(file);
  });
}

function vmLimpiarWhitespace(v){
  return String(v||'').replace(/[\u00A0\u200B-\u200F]/g,' ').trim();
}

function vmEsFilaVacia(fila){
  return !Object.values(fila).some(v=>vmLimpiarWhitespace(v) !== '');
}

function vmEsFilaSinContenidoBase(fila){
  const campos = Object.keys(fila);
  return !VM_CAMPOS_BASE_KEYS.some(base=>{
    const clave = campos.find(c=>c.trim().toUpperCase()===base);
    return clave && vmLimpiarWhitespace(fila[clave]) !== '';
  });
}

function vmParsearPlano(txt,ext){
  const sep=ext==='tsv'||txt.includes('\t')?'\t':',';
  const lineas=txt.split('\n').filter(l=>vmLimpiarWhitespace(l) !== '');
  if(lineas.length<2)return[];
  const headers=lineas[0].split(sep).map(h=>vmLimpiarWhitespace(h).replace(/^"|"$/g,''));
  return lineas.slice(1).map(l=>{
    const vals=l.split(sep).map(v=>vmLimpiarWhitespace(v).replace(/^"|"$/g,''));
    const rec={};
    headers.forEach((h,i)=>{rec[h]=vals[i]||'';});
    return rec;
  }).filter(r=>!vmEsFilaVacia(r) && !vmEsFilaSinContenidoBase(r));
}

// ─── PROCESAMIENTO ───────────────────────────────────────────────────────
function vmProcesarFilas(filas, esEspecial){
  filas=filas.filter(f=>!vmEsFilaVacia(f));
  if(!filas.length){
    if(esEspecial){ vmSetStatus('📄 Sube un archivo para comenzar la validación.'); return; }
    vmSetStatus('⚠ El archivo no contiene datos válidos.');
    return;
  }

  const primeraFila=filas[0];
  const todasCols=Object.keys(primeraFila);
  vmColsAuxDetectadas=todasCols.filter(c=>!VM_CAMPOS_BASE_KEYS.includes(c.trim().toUpperCase()));
  vmColsDetectadas=[...VM_CAMPOS_BASE.map(b=>b.campo),...vmColsAuxDetectadas];

  const ALIAS_COLUMNAS = { TELEFONOS:"TELEFONO", FONO:"TELEFONO", CELULAR:"TELEFONO" };
  const mapaCol={};
  VM_CAMPOS_BASE.forEach(b=>{
    let real=todasCols.find(c=>c.trim().toUpperCase()===b.campo.toUpperCase());
    if(!real) real=todasCols.find(c=>{
      const cu=c.trim().toUpperCase();
      return ALIAS_COLUMNAS[cu] && ALIAS_COLUMNAS[cu].toUpperCase()===b.campo.toUpperCase();
    });
    if(real)mapaCol[b.campo]=real;
  });

  let ultimaDescripcion='';
  vmRegistros=filas.map((fila,i)=>{
    const valores={};
    const errores={};
    const autoCorrecciones=[];

    VM_CAMPOS_BASE.forEach(def=>{
      const realKey=mapaCol[def.campo];
      const rawVal=realKey!==undefined?fila[realKey]:'';
      let v=String(rawVal||'').trim();

      if(def.tipo==='fecha' && v) v=vmNormalizarFecha(v);
      if(def.tipo==='fecha_carga' && v) v=vmNormalizarFechaCarga(v);
      if(def.tipo==='hora' && v) v=vmNormalizarHora(v);
      if(def.tipo==='rut' && v) v=vmNormalizarRut(v);
      if(def.campo==='TELEFONO' && v) v=vmNormalizarTelefono(v);
      if(def.campo==='NOMBRE_PACIENTE' && v) v=vmNormalizarNombrePaciente(v);
      if(def.campo==='MEDICO' && v) v=vmReordenarNombreApellido(String(v).replace(/\./g,'').replace(/\s+/g,' ').trim());
      if(def.campo==='UNIDAD_DE_TRATAMIENTO' && v){
        const trad = vmTraducirGlosario(v);
        if(trad) v = trad;
      }
      if(def.campo==='CAMPO_VARIABLE' && v){
        v = v.replace(/[\/\.]/g,' ').replace(/\s+/g,' ').trim();
        v = v.replace(/\bHT\b/gi, 'HOSPITAL DEL TRABAJADOR');
        v = v.replace(/\bTO\b/gi, 'TERAPIA OCUPACIONAL');
      }
      if(def.campo==='PRIORIZACION' && (!v || String(v).trim() === '')){
        v = '0';
      }
      if(def.campo==='LUGAR' && /^AGENCIA\b/i.test(valores.MEDICO || '')){
        v = valores.MEDICO;
      }
      if(def.campo==='TIPO_PROCEDIMIENTO' && v){
        v = v.replace(/^TF\s+AGENCIA\b/i,'TERAPIA FISICA AGENCIA');
      }
      if(def.campo==='DIRECCION_CENTRO' && v){
        v=vmLimpiarDireccionCentro(v);
      }
      if(def.campo==='ZONA_HORARIA'){
        v=vmNormalizarZonaHoraria(v);
      }
      if(def.tipo==='enum' && v){
        const norm=vmNormalizarEnum(v,def.valores);
        if(norm && norm!==v){ v=norm; }
      }

      valores[def.campo]=v;

      const errs=[];
      if(!v||v===''||v==='null'||v==='undefined'){
        if(def.oblig) errs.push(vmMensajeCampoVacio(def));
      } else {
        const e=vmValidarCampo(def,v);
        if(e)errs.push(e);
      }
      if(errs.length)errores[def.campo]=errs;
    });

    const tipoSolicitudAntes = valores.TIPO_SOLICITUD;
    vmAplicarReglaTipoSolicitud(valores);
    if(tipoSolicitudAntes !== valores.TIPO_SOLICITUD){
      autoCorrecciones.push('TIPO_SOLICITUD corregido a "'+valores.TIPO_SOLICITUD+'"');
      delete errores.TIPO_SOLICITUD;
    }
    if(valores.TIPO_SOLICITUD){
      delete errores.TIPO_SOLICITUD;
      const tipoSolicitudValido = vmValidarCampo({tipo:'enum',valores:['ANULACION','BLOQUEO Y CAMBIO DE CITA','CONFIRMACION','PROCEDIMIENTO']}, valores.TIPO_SOLICITUD);
      if(tipoSolicitudValido) errores.TIPO_SOLICITUD = [tipoSolicitudValido];
    }

    if(!valores.DESCRIPCION_CARGA || !/\w/.test(valores.DESCRIPCION_CARGA)){
      valores.DESCRIPCION_CARGA = ultimaDescripcion;
    } else {
      ultimaDescripcion = valores.DESCRIPCION_CARGA;
    }

    if(!valores['fecha_carga'] || !/^\d{8}$/.test(String(valores['fecha_carga']))){
      valores['fecha_carga'] = vmFechaActualAAAAMMDD();
    }

    const esAgencia = valores.LUGAR ? (vmGetDireccionPorLugar(valores.LUGAR) !== null) : false;
    if(esAgencia){
      if(String(valores.DIRECCION_CENTRO||'').trim() === ''){
        valores.DIRECCION_CENTRO = vmGetDireccionPorLugar(valores.LUGAR);
      }
      delete errores.DIRECCION_CENTRO;
    } else {
      const infoUnidad = vmGetDireccionPorUnidad(valores.UNIDAD_DE_TRATAMIENTO);
      if(infoUnidad){
        valores.DIRECCION_CENTRO = vmFormatearDireccionUnidad(infoUnidad);
        delete errores.DIRECCION_CENTRO;
      } else {
        valores.DIRECCION_CENTRO = 'Ramón Carnicer 185, Providencia';
        delete errores.DIRECCION_CENTRO;
      }
    }

    const ok=Object.keys(errores).length===0;
    return{num:i+1,valores,errores,ok,autoCorrecciones};
  });

  vmActualizarContadores();
  vmRenderTabla();
  document.getElementById('vm-results').style.display='block';
  document.getElementById('vm-export-panel').style.display='block';
  vmSetStatus('');
}

// ─── VALIDACIONES ────────────────────────────────────────────────────────
function vmValidarCampo(def,v){
  switch(def.tipo){
    case 'telefono':
      if(!/^\d{8,12}$/.test(v.replace(/[\s\-\+\(\)]/g,'')))
        return 'Teléfono inválido (debe tener 8-12 dígitos)';
      break;
    case 'fecha':
      if(!vmEsFecha(v))
        return 'Fecha inválida "'+v+'" (ej: DD-MM-YYYY o YYYYMMDD)';
      break;
    case 'fecha_carga':
      if(!/^\d{8}$/.test(v.replace(/[\-\/]/g,'')))
        return 'Fecha de carga inválida "'+v+'" (debe ser YYYYMMDD)';
      break;
    case 'hora':
      if(!/^\d{1,2}:\d{2}(:\d{2})?$/.test(v.trim()))
        return 'Hora inválida "'+v+'" (ej: HH:MM)';
      break;
    case 'rut':
      if(!/^\d{1,8}-?[\dkK]$/.test(v.replace(/\./g,'')))
        return 'RUT inválido "'+v+'" (ej: 12345678-9)';
      break;
    case 'enum':{
      const norm=vmNormalizarEnum(v,def.valores);
      if(!norm)
        return 'Valor no permitido "'+v+'". Valores válidos: '+def.valores.join(', ');
      break;
    }
    case 'texto':
      if(v.length<1)return 'Campo vacío';
      break;
  }
  return null;
}

function vmMensajeCampoVacio(def){
  switch(def.campo){
    case 'DESCRIPCION_CARGA': return 'Falta DESCRIPCION_CARGA: debe indicar el asunto del correo';
    case 'MEDICO': return 'Falta MEDICO: debe indicar el nombre del médico';
    case 'UNIDAD_DE_TRATAMIENTO': return 'Falta UNIDAD_DE_TRATAMIENTO: indica la unidad de tratamiento';
    case 'MODALIDAD_ATENCION': return 'Falta MODALIDAD_ATENCION: indica PRESENCIAL, TELEFONICA o VIDEOCONSULTA';
    case 'TELEFONO': return 'Falta TELEFONO: ingresa el número de teléfono del paciente';
    case 'FECHA_ORIGINAL': return 'Falta FECHA_ORIGINAL: indica la fecha original de la cita';
    case 'HORA_ORIGINAL': return 'Falta HORA_ORIGINAL: indica la hora original de la cita';
    case 'RUT': return 'Falta RUT: ingresa el RUT del paciente';
    case 'NOMBRE_PACIENTE': return 'Falta NOMBRE_PACIENTE: ingresa el nombre del paciente';
    default: return 'Campo obligatorio vacío';
  }
}

function vmNormalizarEnum(v, valoresValidos){
  const vUp = vmNormalizarTexto(v);
  if(valoresValidos.includes('VIDEOCONSULTA') && /TELEMEDICINA/.test(vUp)) return 'VIDEOCONSULTA';
  if(valoresValidos.includes('TELEFONICA') && /^TELEFONICO$/.test(vUp)) return 'TELEFONICA';
  const directo = valoresValidos.find(vv => vv.toUpperCase() === v.toUpperCase());
  if(directo) return directo;
  const sinPrefijo = v.replace(/^[\w\s]+\s*[-–]\s*/,'').trim();
  const conSinPrefijo = valoresValidos.find(vv => vv.toUpperCase() === sinPrefijo.toUpperCase());
  if(conSinPrefijo) return conSinPrefijo;
  const contenido = valoresValidos.find(vv => v.toUpperCase().includes(vv.toUpperCase()));
  if(contenido) return contenido;
  return null;
}

function vmReordenarNombreApellido(v){
  var raw = String(v||'').replace(/\./g,'').replace(/\s+/g,' ').trim();
  if(!raw) return '';
  if(raw.indexOf(',') !== -1){
    var partes = raw.split(',');
    var apellido = partes[0].trim();
    var nombre   = partes.slice(1).join(' ').trim();
    return (nombre + ' ' + apellido).replace(/\s+/g,' ').trim();
  }
  var partes = raw.split(/\s+/).filter(function(p){ return p; });
  if(partes.length <= 2) return partes.slice().reverse().join(' ');
  var apellidos = partes.slice(0, 2);
  var nombres   = partes.slice(2);
  return nombres.concat(apellidos).join(' ');
}

function vmNormalizarNombrePaciente(v){
  let nombre=String(v||'').trim();
  nombre = nombre.replace(/\./g,'').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim();
  return nombre;
}

function vmTraducirGlosario(v){
  const clave = String(v||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/\./g,'')
    .replace(/\s+/g,' ')
    .trim()
    .toUpperCase();
  return VM_GLOSARIO_TRADUCCION.get(clave) || null;
}

function vmNormalizarTelefono(v){
  const texto = String(v||'').trim();
  const match = texto.match(/(\d{7,12})/);
  return match ? match[1] : texto.replace(/[^0-9]/g,'').slice(0,12);
}

function vmAplicarReglaTipoSolicitud(valores){
  const tieneFechaOriginal = String(valores.FECHA_ORIGINAL||'').trim() !== '';
  const tieneHoraOriginal  = String(valores.HORA_ORIGINAL ||'').trim() !== '';
  const tieneFechaNueva    = String(valores.FECHA_NUEVA   ||'').trim() !== '';
  const tieneHoraNueva     = String(valores.HORA_NUEVA    ||'').trim() !== '';
  const tieneCampoVariable = String(valores.CAMPO_VARIABLE||'').trim() !== '';

  if(tieneCampoVariable){
    valores.TIPO_SOLICITUD = 'PROCEDIMIENTO';
    return;
  }
  if(tieneFechaOriginal && tieneHoraOriginal && tieneFechaNueva && tieneHoraNueva){
    valores.TIPO_SOLICITUD = 'BLOQUEO Y CAMBIO DE CITA';
    return;
  }
  if(tieneFechaOriginal && tieneHoraOriginal && !tieneFechaNueva && !tieneHoraNueva){
    valores.TIPO_SOLICITUD = 'CONFIRMACION';
    return;
  }
  if(!tieneFechaOriginal && !tieneHoraOriginal && tieneFechaNueva && tieneHoraNueva){
    valores.TIPO_SOLICITUD = 'CONFIRMACION';
    return;
  }
}

function vmNormalizarZonaHoraria(v){
  const texto = String(v||'').trim();
  if(!texto || !texto.includes('/')) return 'America/Santiago';
  return texto;
}

function vmNormalizarFechaCarga(v){
  const fecha = String(v||'').trim().replace(/[\.\/]/g,'-');
  const m1 = fecha.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if(m1){
    const dd = m1[1].padStart(2,'0');
    const mm = m1[2].padStart(2,'0');
    let yyyy = m1[3];
    if(yyyy.length === 2) yyyy = '20' + yyyy;
    return yyyy + mm + dd;
  }
  const m2 = fecha.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(m2){
    return m2[1] + m2[2].padStart(2,'0') + m2[3].padStart(2,'0');
  }
  const digits = fecha.replace(/[^0-9]/g,'');
  if(/^\d{8}$/.test(digits)) return digits;
  return vmFechaActualAAAAMMDD();
}

function vmFechaActualAAAAMMDD(){
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth()+1).padStart(2,'0');
  const dd = String(hoy.getDate()).padStart(2,'0');
  return ''+yyyy+mm+dd;
}

function vmNormalizarTexto(v){
  return String(v||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toUpperCase();
}

function vmNormalizarFecha(v){
  const fecha=v.trim().replace(/[\/\.]/g,'-');
  let m = fecha.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if(m){
    const dd=m[1].padStart(2,'0');
    const mm=m[2].padStart(2,'0');
    let yyyy=m[3];
    if(yyyy.length===2) yyyy='20'+yyyy;
    return dd+'-'+mm+'-'+yyyy;
  }
  m = fecha.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(m){
    return m[3].padStart(2,'0')+'-'+m[2].padStart(2,'0')+'-'+m[1];
  }
  return v;
}

function vmNormalizarHora(v){
  const hora = String(v||'').trim().replace(/[.,]/g,':');
  if(hora.includes(':')){
    const parts = hora.split(':').filter(Boolean);
    const hh = (parts[0]||'').replace(/\D/g,'');
    const mm = (parts[1]||'').replace(/\D/g,'');
    if(hh==='') return hora;
    return hh.padStart(2,'0') + ':' + (mm? mm.padStart(2,'0') : '00');
  }
  const soloDigitos = hora.replace(/\D/g,'');
  if(soloDigitos.length===4){
    return soloDigitos.slice(0,2).padStart(2,'0') + ':' + soloDigitos.slice(2,4);
  }
  if(soloDigitos.length===3){
    return soloDigitos.slice(0,1).padStart(2,'0') + ':' + soloDigitos.slice(1,3);
  }
  if(soloDigitos.length===2){
    return soloDigitos.padStart(2,'0') + ':00';
  }
  if(soloDigitos.length===1){
    return soloDigitos.padStart(2,'0') + ':00';
  }
  return hora;
}

function vmNormalizarRut(v){
  let rut=String(v||'').toUpperCase().replace(/[\.\s]/g,'');
  rut = rut.replace(/^[^0-9]+/,'');
  rut = rut.replace(/[^0-9K]/g,'');
  if(rut.length < 2) return v;
  const dv = rut.slice(-1);
  const body = rut.slice(0,-1).replace(/\D/g,'');
  if(!body) return v;
  return body+'-'+dv;
}

function vmLimpiarDireccionCentro(v){
  return String(v||'').replace(/\s+/g,' ').trim();
}

function vmNormalizarClaveCentro(s){
  return String(s||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/\./g,'')
    .replace(/\s+/g,' ')
    .trim()
    .toUpperCase();
}

function vmGetDireccionPorLugar(lugar){
  const clave = vmNormalizarClaveCentro(lugar);
  if(VM_MAPA_MEDICO_DIRECCION.has(clave)) return VM_MAPA_MEDICO_DIRECCION.get(clave);
  for(const [k,v] of VM_MAPA_MEDICO_DIRECCION){
    if(clave === k || clave.includes(k) || k.includes(clave)){
      return v;
    }
  }
  return null;
}

function vmEsFecha(v){
  return /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(v)||
         /^\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}$/.test(v)||
         /^\d{8}$/.test(v);
}

// ─── TABLA ────────────────────────────────────────────────────────────────
function vmSetTab(ev,tab){
  vmFiltroActivo=tab;
  const contenedor = document.getElementById('contenido');
  contenedor.querySelectorAll('.vm-view .tab').forEach(t=>t.classList.remove('active'));
  ev.target.classList.add('active');
  vmRenderTabla();
}

function vmActualizarContadores(){
  const total=vmRegistros.length;
  const ok=vmRegistros.filter(r=>r.ok).length;
  const err=vmRegistros.filter(r=>!r.ok).length;
  const falt=vmRegistros.reduce((a,r)=>a+Object.values(r.errores).flat().filter(e=>e.includes('obligatorio')).length,0);
  document.getElementById('vm-cnt-total').textContent=total;
  document.getElementById('vm-cnt-ok').textContent=ok;
  document.getElementById('vm-cnt-err').textContent=err;
  document.getElementById('vm-cnt-falt').textContent=falt;
}

function vmRenderTabla(){
  const thead=document.getElementById('vm-thead');
  const tbody=document.getElementById('vm-tbody');
  if(!thead || !tbody) return;
  const busq=document.getElementById('vm-buscar').value.toLowerCase();

  let lista=vmRegistros.slice();
  if(vmFiltroActivo==='errores')lista=lista.filter(r=>!r.ok);
  if(vmFiltroActivo==='ok')lista=lista.filter(r=>r.ok);
  if(busq)lista=lista.filter(r=>JSON.stringify(r.valores).toLowerCase().includes(busq));

  const topScroller = document.getElementById('vm-table-scroll-top');
  if(topScroller) topScroller.style.display = 'block';

  const camposHead=['#','ESTADO',...VM_CAMPOS_BASE.map(b=>b.campo),...vmColsAuxDetectadas];
  thead.innerHTML='<tr>'+camposHead.map(c=>'<th>'+c+'</th>').join('')+'</tr>';

  tbody.innerHTML='';
  if(!lista.length){
    tbody.innerHTML='<tr><td colspan="'+(camposHead.length)+'" style="text-align:center;color:var(--muted);padding:20px;">Sin registros para mostrar.</td></tr>';
    return;
  }

  lista.forEach(reg=>{
    const tr=document.createElement('tr');
    tr.className=reg.ok?'row-ok':'row-err';
    let celdas='';
    celdas+='<td><span class="badge num">'+reg.num+'</span></td>';
    celdas+='<td><span class="badge '+(reg.ok?'ok':'err')+'">'+(reg.ok?'✓ OK':'✕ Error')+'</span></td>';
    VM_CAMPOS_BASE.forEach(def=>{
      const v=reg.valores[def.campo]||'';
      const errs=reg.errores[def.campo]||[];
      if(errs.length){
        const label = v? vmEscH(v) : '(vacío)';
        celdas+='<td><span class="cell-err">'+label+'</span><span class="err-tip">⚠ '+vmEscH(errs[0])+'</span></td>';
      } else if(!v){
        celdas+='<td><span class="cell-empty">(vacío)</span></td>';
      } else {
        if(def.campo==='TIPO_SOLICITUD' && reg.autoCorrecciones && reg.autoCorrecciones.length){
          celdas+='<td><span class="cell-auto">'+vmEscH(v)+'</span> <span class="badge auto" title="'+vmEscH(reg.autoCorrecciones.join('; '))+'">AUTO</span></td>';
        } else {
          celdas+='<td>'+vmEscH(v)+'</td>';
        }
      }
    });
    vmColsAuxDetectadas.forEach(col=>{
      const v=reg.valores[col]||'';
      celdas+='<td style="color:var(--muted);">'+(v?vmEscH(v):'')+'</td>';
    });
    tr.innerHTML=celdas;
    tbody.appendChild(tr);
  });
  requestAnimationFrame(vmAjustarScrollerSuperior);
}

function vmAjustarScrollerSuperior(){
  const top=document.getElementById('vm-table-scroll-top');
  if(!top) return;
  const inner=top.firstElementChild;
  const wrap=document.getElementById('vm-table-wrap');
  const table = wrap ? wrap.querySelector('table') : null;
  if(inner){
    const anchoTabla = table ? table.offsetWidth : 0;
    const anchoScroll = wrap ? wrap.scrollWidth : 0;
    const anchoReal = Math.max(anchoTabla, anchoScroll);
    if(anchoReal > 0){
      inner.style.width = anchoReal + 'px';
    } else {
      inner.style.width = Math.max(top.clientWidth * 3, 2000) + 'px';
    }
  }
  if(wrap) top.scrollLeft = wrap.scrollLeft;
}

// ─── DESCARGAR PLANTILLA ───────────────────────────────────────────────────
function vmDescargarPlantilla(){
  const colsBase = ['TELEFONO','FECHA_ORIGINAL','HORA_ORIGINAL','FECHA_NUEVA','HORA_NUEVA','RUT','NOMBRE_PACIENTE','MEDICO','UNIDAD_DE_TRATAMIENTO','MODALIDAD_ATENCION','PRIORIZACION','CAMPO_VARIABLE','TIPO_SOLICITUD','TIPO_PROCEDIMIENTO','EXAMEN','LUGAR','DIRECCION_CENTRO','fecha_carga','DESCRIPCION_CARGA','ZONA_HORARIA'];
  const aux = Array.from({length:20}, (_,i) => `AUX${i+1}`);
  const genesys = Array.from({length:5}, (_,i) => `GENESYS${i+1}`);
  const todasLasColumnas = [...colsBase, ...aux, ...genesys];

  const filas = [
    [996933627,'15-06-2026','13:20','','','17839283-2','CRISTIAN RIQUELME','ILUFI KARINA FERNANDA','CONSULTA EXTREMIDAD SUPERIOR','PRESENCIAL','0','','ANULACION','','','Hospital Del Trabajador','Ramon Carnicer 185 Providencia','20260528','TITULO DEL ASUNTO CORREO','America/Santiago',...Array(25).fill('')],
    [996933627,'15-06-2026','13:20','17-06-2026','13:20','17839283-2','CRISTIAN RIQUELME','ILUFI KARINA FERNANDA','PSICOLOGIA','TELEFONICA','0','','BLOQUEO Y CAMBIO DE CITA','','','Hospital Del Trabajador','AV Vicuña Mackenna 200 Providencia','20260528','TITULO DEL ASUNTO CORREO','America/Santiago',...Array(25).fill('')],
    [996933627,'15-06-2026','13:20','','','17839283-2','CRISTIAN RIQUELME','ILUFI KARINA FERNANDA','PSIQUIATRIA','VIDEOCONSULTA','0','','CONFIRMACION','','','Hospital Del Trabajador','AV Vicuña Mackenna 200 Providencia','20260528','TITULO DEL ASUNTO CORREO','America/Santiago',...Array(25).fill('')],
    [996933627,'15-06-2026','13:20','','','17839283-2','CRISTIAN RIQUELME','ILUFI KARINA FERNANDA','TERAPIA FISICA','PRESENCIAL','0','Por favor, ten en consideracion las siguientes indicaciones: (Indicaciones segun corresponda)','PROCEDIMIENTO','PACIENTES TERAPIA FISICA INGRESOS','TEST','Hospital Del Trabajador','Ramon Carnicer 185 Providencia','20260528','TITULO DEL ASUNTO CORREO','America/Santiago',...Array(25).fill('')]
  ];

  const wb = XLSX.utils.book_new();
  const wsData = [todasLasColumnas, ...filas];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = [12,12.125,11.125,13.375,12.875,10.125,34.25,20.875,18,21.875,13.625,58.75,25,32.875,8.375,22.375,39.125,11.625,25.875,16.875];
  ws['!cols'] = todasLasColumnas.map((_, i) => ({wch: colWidths[i] || 10}));

  const hdrS = {fill:{fgColor:{rgb:'003B7E'}},font:{color:{rgb:'FFFFFF'},bold:true},alignment:{horizontal:'center',vertical:'center'}};
  const dataS = {font:{color:{rgb:'000000'}},alignment:{vertical:'center'}};
  const boldCols = [0,1,2,5,6,7,8,9,12];

  todasLasColumnas.forEach((col, ci) => {
    const hRef = XLSX.utils.encode_cell({r:0, c:ci});
    if(!ws[hRef]) ws[hRef]={v:col,t:'s'};
    ws[hRef].s = hdrS;
  });

  filas.forEach((fila, ri) => {
    fila.forEach((val, ci) => {
      const ref = XLSX.utils.encode_cell({r:ri+1, c:ci});
      if(!ws[ref]) ws[ref]={v:val, t: typeof val==='number'?'n':'s'};
      ws[ref].s = {...dataS, font:{...dataS.font, bold: boldCols.includes(ci)}};
    });
  });

  ws['!dataValidation'] = ws['!dataValidation'] || [];
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

  const wsRef = XLSX.utils.aoa_to_sheet([
    ['MODALIDAD_ATENCION','TIPO_SOLICITUD'],
    ['PRESENCIAL','ANULACION'],
    ['TELEFONICA','BLOQUEO Y CAMBIO DE CITA'],
    ['VIDEOCONSULTA','CONFIRMACION'],
    ['','PROCEDIMIENTO']
  ]);
  XLSX.utils.book_append_sheet(wb, wsRef, 'Hoja1');

  XLSX.writeFile(wb, 'Modelo_de_plantilla.xlsx');
}

// ─── LIMPIAR ────────────────────────────────────────────────────────────
function vmLimpiarTodo(){
  vmRegistros=[];
  vmColsDetectadas=[];
  vmColsAuxDetectadas=[];
  vmFiltroActivo='todos';
  document.getElementById('vm-thead').innerHTML='';
  document.getElementById('vm-tbody').innerHTML='';
  document.getElementById('vm-cnt-total').textContent='0';
  document.getElementById('vm-cnt-ok').textContent='0';
  document.getElementById('vm-cnt-err').textContent='0';
  document.getElementById('vm-cnt-falt').textContent='0';
  document.getElementById('vm-buscar').value='';
  document.getElementById('vm-results').style.display='none';
  document.getElementById('vm-export-panel').style.display='none';
  vmSetStatus('📄 Sube un archivo para comenzar la validación.');

  const contenedor = document.getElementById('contenido');
  contenedor.querySelectorAll('.vm-view .tab').forEach(t=>t.classList.remove('active'));
  const btnTodos = contenedor.querySelector('.vm-view .tab');
  if(btnTodos) btnTodos.classList.add('active');

  const inp=document.getElementById('vm-file-input');
  if(inp)inp.value='';

  vmAjustarScrollerSuperior();
}

// ─── MODAL AVISO EXPORTAR ──────────────────────────────────────────────────
function vmPedirAviso(modo){
  if(!vmRegistros.length){ alert('No hay registros cargados.'); return; }
  vmModoExportar = modo;
  document.getElementById('vm-modal-aviso').classList.add('active');
}

function vmCancelarAviso(){
  document.getElementById('vm-modal-aviso').classList.remove('active');
  vmModoExportar = null;
}

function vmConfirmarAviso(){
  document.getElementById('vm-modal-aviso').classList.remove('active');
  if(vmModoExportar === 'todos'){
    vmMostrarModalServicio();
  } else {
    vmExportar(vmModoExportar);
  }
  vmModoExportar = null;
}

function vmMostrarModalServicio(){
  vmServicioExportacion = '';
  document.getElementById('vm-input-servicio').value = '';
  document.getElementById('vm-input-servicio').focus();
  document.getElementById('vm-modal-servicio').classList.add('active');
}

function vmCerrarModalServicio(){
  document.getElementById('vm-modal-servicio').classList.remove('active');
  vmServicioExportacion = '';
}

function vmConfirmarServicio(){
  const servicio = document.getElementById('vm-input-servicio').value.trim();
  if(!servicio){
    alert('Por favor ingresa el nombre del servicio');
    return;
  }
  vmServicioExportacion = servicio;
  document.getElementById('vm-modal-servicio').classList.remove('active');
  vmExportar('todos');
}

function vmExportar(modo){
  let lista=vmRegistros.slice();
  if(modo==='errores')lista=lista.filter(r=>!r.ok);
  if(modo==='ok')lista=lista.filter(r=>r.ok);

  const headers=[...VM_CAMPOS_BASE.map(b=>b.campo),
    ...[...new Set([
      ...vmColsAuxDetectadas,
      ...Array.from({length:20},(_,i)=>`AUX${i+1}`),
      ...Array.from({length:5},(_,i)=>`GENESYS${i+1}`)
    ])]
  ];

  const datos=[headers];
  lista.forEach(reg=>{
    const fila=VM_CAMPOS_BASE.map(b=>reg.valores[b.campo]||'');
    headers.slice(VM_CAMPOS_BASE.length).forEach(col=>fila.push(reg.valores[col]||''));
    datos.push(fila);
  });

  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet(datos);

  const camposIdx={};
  VM_CAMPOS_BASE.forEach((b,i)=>{camposIdx[b.campo]=i;});

  lista.forEach((reg,ri)=>{
    Object.keys(reg.errores).forEach(campo=>{
      const ci=camposIdx[campo];
      if(ci===undefined)return;
      const celRef=XLSX.utils.encode_cell({r:ri+1,c:ci});
      if(!ws[celRef])ws[celRef]={v:'',t:'s'};
      ws[celRef].s={fill:{fgColor:{rgb:'FDECEA'}},font:{color:{rgb:'8B1A1A'}}};
    });
  });

  const wsText = {};
  Object.keys(ws).forEach(address => {
    if(address[0] === '!'){
      wsText[address] = ws[address];
      return;
    }
    const cell = ws[address];
    wsText[address] = {
      v: String(cell.v===null||cell.v===undefined?'':cell.v),
      t: 's',
      z: '@'
    };
  });
  XLSX.utils.book_append_sheet(wb,wsText,'Registros');

  let nombreArchivo;
  if(modo==='todos' && vmServicioExportacion){
    const hoy = new Date();
    const dd = String(hoy.getDate()).padStart(2,'0');
    const mm = String(hoy.getMonth()+1).padStart(2,'0');
    const yyyy = hoy.getFullYear();
    const fecha = `${dd}-${mm}-${yyyy}`;
    nombreArchivo = `CL_CALLBOT_OUTBOUND_CAA_${vmServicioExportacion.toUpperCase()}_${fecha}.xlsx`;
  } else {
    const nombres={todos:'registros_completos',errores:'registros_con_errores',ok:'registros_correctos'};
    nombreArchivo = nombres[modo]+'.xlsx';
  }

  XLSX.writeFile(wb, nombreArchivo);
  vmServicioExportacion = '';
}

function vmEscH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
