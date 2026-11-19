// nwgeo Muestreo — captura offline de puntos de muestreo geoquímico interior mina
// Todo vive en localStorage del iPhone. Sin servidor, sin internet.

const LS_KEY = "nwgeo_muestreo_v1";

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if (!s) return defaultState();
    // compatibilidad con respaldos guardados antes de que existieran las capas de mapeo
    if (!s.capaActiva) s.capaActiva = "muestreo";
    return s;
  } catch (e) {
    return defaultState();
  }
}
function defaultState() {
  return {
    proyecto: {
      proyecto: "Congreso-León · San Pedro Corralitos",
      nivel: "04",
      resp: "Ing. Gerardo Pérez Reveles",
      sistema: "WGS84 / UTM 13N · EPSG:32613",
    },
    puntos: [],      // {id, capa, clave, tipo, longCanal, campos, nivel, tramo, notas, este, norte, fecha}
    activePlano: null, // {kind:'preset'|'custom', tramo, file, w, h, x0,x1,y0,y1} o {kind:'custom', cal:[{px,py,e,n}]}
    nextLocalId: 1,
    capaActiva: "muestreo", // qué tipo de punto se crea al tocar el plano
  };
}

// ---------- capas de mapeo ----------
// "muestreo" usa sus propios campos (tipo/longCanal) por compatibilidad con lo ya capturado.
// Las demás capas guardan sus campos propios dentro de pt.campos = {id: valor, ...}.
const CAPAS = {
  muestreo: { label: "Muestreo geoquímico", color: "#C9A227", campos: [] },
  alteracion: {
    label: "Alteración", color: "#A98CE0",
    campos: [
      { id: "tipoAlt", label: "Tipo de alteración", type: "select", options: [
        ["propilitica", "Propilítica"], ["argilica", "Argílica"], ["sericitica", "Sericítica / fílica"],
        ["potasica", "Potásica"], ["silicificacion", "Silicificación"],
        ["limonita_insitu", "Limonita in situ"], ["limonita_halo", "Limonita de halo"],
        ["limonita_exotica", "Limonita exótica"], ["otra", "Otra"],
      ] },
      { id: "intensidad", label: "Intensidad", type: "select",
        options: [["debil", "Débil"], ["moderada", "Moderada"], ["fuerte", "Fuerte"]] },
    ],
  },
  litologico: {
    label: "Litológico", color: "#6FA8DC",
    campos: [
      { id: "unidad", label: "Unidad litológica", type: "text" },
      { id: "textura", label: "Textura / fábrica de roca", type: "text" },
    ],
  },
  estructural: {
    label: "Estructural", color: "#E06C6C",
    campos: [
      { id: "tipoEstr", label: "Tipo de estructura", type: "select",
        options: [["falla", "Falla"], ["veta", "Veta"], ["vetilla", "Vetilla"],
          ["contacto", "Contacto"], ["fractura", "Fractura"]] },
      { id: "rumbo", label: "Rumbo (azimut °)", type: "number" },
      { id: "echado", label: "Echado (°)", type: "number" },
      { id: "bloque", label: "Bloque", type: "select",
        options: [["", "—"], ["alto", "Bloque del alto"], ["bajo", "Bloque del bajo"]] },
    ],
  },
  superficie: {
    label: "Superficie", color: "#6FAE6F",
    campos: [
      { id: "afloramiento", label: "Tipo de afloramiento", type: "select",
        options: [["roca_in_situ", "Roca in situ"], ["suelo_residual", "Suelo residual"],
          ["aluvion", "Aluvión"], ["otro", "Otro"]] },
      { id: "descripcion", label: "Descripción general", type: "textarea" },
    ],
  },
};

function renderCapaBar() {
  const bar = document.getElementById("capaBar");
  bar.innerHTML = "";
  Object.keys(CAPAS).forEach(id => {
    const c = CAPAS[id];
    const chip = document.createElement("div");
    chip.className = "capaChip" + (state.capaActiva === id ? " active" : "");
    chip.innerHTML = `<span class="dot" style="background:${c.color}"></span><span>${c.label}</span>`;
    chip.addEventListener("click", () => {
      state.capaActiva = id;
      save();
      renderCapaBar();
    });
    bar.appendChild(chip);
  });
}
let state = load();
renderCapaBar();

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// ---------- tabs ----------
document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".screen").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById("screen-" + t.dataset.screen).classList.add("active");
    if (t.dataset.screen === "lista") renderLista();
  });
});

// ---------- proyecto ----------
function fillProyectoForm() {
  document.getElementById("pProyecto").value = state.proyecto.proyecto || "";
  document.getElementById("pNivel").value = state.proyecto.nivel || "";
  document.getElementById("pResp").value = state.proyecto.resp || "";
  document.getElementById("pSistema").value = state.proyecto.sistema || "";
}
fillProyectoForm();

document.getElementById("btnGuardaProy").addEventListener("click", () => {
  state.proyecto = {
    proyecto: document.getElementById("pProyecto").value,
    nivel: document.getElementById("pNivel").value,
    resp: document.getElementById("pResp").value,
    sistema: document.getElementById("pSistema").value,
  };
  save();
  document.getElementById("projLine").textContent =
    (state.proyecto.proyecto || "") + (state.proyecto.nivel ? (" · Nivel " + state.proyecto.nivel) : "");
  alert("Guardado.");
});
document.getElementById("projLine").textContent =
  (state.proyecto.proyecto || "") + (state.proyecto.nivel ? (" · Nivel " + state.proyecto.nivel) : "");

// ---------- plano: preset Nivel 04 ----------
let NIVEL04 = null;
fetch("assets/nivel04_manifest.json").then(r => r.json()).then(j => { NIVEL04 = j; buildPresetButtons(); }).catch(() => {});

function buildPresetButtons() {
  if (!NIVEL04) return;
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = "<h3>Nivel 04 — tramos precargados</h3>" +
    "<p class=\"muted\">Ya vienen calibrados: no hace falta marcar puntos de control. Elige el tramo que vas a muestrear.</p>" +
    "<div id=\"presetBtns\" style=\"display:flex;flex-wrap:wrap;gap:8px;\"></div>";
  document.querySelector("#screen-proyecto .panel").insertBefore(
    card, document.querySelector("#screen-proyecto .panel .card:nth-child(2)")
  );
  const wrap = card.querySelector("#presetBtns");
  Object.keys(NIVEL04.tiles).forEach(clave => {
    const t = NIVEL04.tiles[clave];
    const b = document.createElement("button");
    b.className = "btn-ghost btn-sm";
    b.textContent = clave === "FULL" ? "Plano completo" : ("Tramo " + clave);
    if (clave === "FULL") { b.style.background = "#2c313a"; b.style.borderColor = "#C9A227"; }
    b.style.flex = "0 0 auto";
    b.addEventListener("click", () => loadPreset(clave));
    wrap.appendChild(b);
  });
}

function loadPreset(clave) {
  const t = NIVEL04.tiles[clave];
  state.activePlano = {
    kind: "preset", tramo: clave, file: "assets/" + t.file,
    w: t.w_px, h: t.h_px, x0: t.x0, x1: t.x1, y0: t.y0, y1: t.y1,
  };
  save();
  mostrarPlano();
  switchTab("mapa");
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.screen === name));
  document.querySelectorAll(".screen").forEach(x => x.classList.toggle("active", x.id === "screen-" + name));
  if (name === "lista") renderLista();
}

// ---------- plano: imagen propia + calibración manual ----------
document.getElementById("fileImg").addEventListener("change", (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.activePlano = { kind: "custom", dataUrl: e.target.result, cal: [] };
    save();
    mostrarPlano();
    document.getElementById("imgInfo").textContent = "Cargado: " + file.name + ". Ahora calibra 2 puntos.";
  };
  reader.readAsDataURL(file);
});

let calibrando = null; // 1 o 2
document.getElementById("btnCal1").addEventListener("click", () => { calibrando = 1; switchTab("mapa"); alert("Toca en el plano el primer punto de control."); });
document.getElementById("btnCal2").addEventListener("click", () => { calibrando = 2; switchTab("mapa"); alert("Toca en el plano el segundo punto de control."); });
document.getElementById("btnCalReset").addEventListener("click", () => {
  if (state.activePlano && state.activePlano.kind === "custom") {
    state.activePlano.cal = [];
    save();
    renderCalLayer();
    updateCalStatus();
  }
});

function updateCalStatus() {
  const el = document.getElementById("calStatus");
  const p = state.activePlano;
  if (!p || p.kind !== "custom") { el.textContent = "Plano precargado del nivel 04: ya calibrado."; return; }
  const n = (p.cal || []).length;
  if (n === 0) el.textContent = "Sin calibrar.";
  else if (n === 1) el.textContent = "1 de 2 puntos fijados.";
  else el.textContent = "Calibrado con 2 puntos ✓";
}

// ---------- mostrar plano ----------
function mostrarPlano() {
  const p = state.activePlano;
  const placeholder = document.getElementById("placeholder");
  const wrap = document.getElementById("imgWrap");
  const img = document.getElementById("planImg");
  const toolbar = document.getElementById("mapToolbar");
  if (!p) { placeholder.style.display = "block"; wrap.style.display = "none"; toolbar.style.display = "none"; return; }
  placeholder.style.display = "none";
  wrap.style.display = "block";
  toolbar.style.display = "flex";
  exitCropView();
  img.onload = () => { cropMeters = null; renderCalLayer(); renderPuntos(); renderGridOverlay(); };
  img.src = p.kind === "preset" ? p.file : p.dataUrl;
  updateCalStatus();
}

// ---------- seleccionar área / zoom a escala ----------
let seleccionando = null; // null | 1 | 2 | "extra" | "confirm"
let selPuntos = []; // esquinas tocadas hasta ahora: [{px,py}, ...] — el recuadro es su caja envolvente
let cropMeters = null; // null = plano completo, o {e0,e1,n0,n1} del área ampliada

function bboxDePuntos(pts) {
  return {
    x0: Math.min(...pts.map(p => p.px)), x1: Math.max(...pts.map(p => p.px)),
    y0: Math.min(...pts.map(p => p.py)), y1: Math.max(...pts.map(p => p.py)),
  };
}

function pickStep(extentMeters) {
  const candidatos = [5, 10, 25, 50, 100, 250, 500, 1000, 2000];
  const target = 10; // apunta a ~10 líneas cruzando el lado más chico
  for (const c of candidatos) {
    if (extentMeters / c <= target) return c;
  }
  return candidatos[candidatos.length - 1];
}

function renderGridOverlay() {
  const svg = document.getElementById("gridLayer");
  svg.innerHTML = "";
  const p = state.activePlano;
  const img = document.getElementById("planImg");
  if (!p || p.kind !== "preset" || !img.naturalWidth) return;

  const e0 = cropMeters ? cropMeters.e0 : p.x0;
  const e1 = cropMeters ? cropMeters.e1 : p.x1;
  const n0 = cropMeters ? cropMeters.n0 : p.y0;
  const n1 = cropMeters ? cropMeters.n1 : p.y1;
  const step = pickStep(Math.min(e1 - e0, n1 - n0));

  svg.setAttribute("viewBox", `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
  const ns = "http://www.w3.org/2000/svg";
  const color = "#C9A227";

  // grosor adaptativo: el svg se estira a img.clientWidth aunque el viewBox esté en px
  // naturales, así que un stroke-width fijo en px naturales se ve cada vez MÁS grueso
  // conforme amplías (clientWidth crece sobre naturalWidth al ampliar un área pequeña).
  // Se corrige al grosor real en pantalla (displayScale) y además se afina un poco más
  // mientras la escala de la grilla baja hacia el mínimo de 5 m, para que no se vea
  // pesada cuando hay muchas líneas juntas.
  const displayScale = (img.clientWidth / img.naturalWidth) || 1;
  // el grosor objetivo está en px DE PANTALLA (no de la imagen): así es válido en
  // cualquier nivel de ampliación, incluida la escala mínima de 5 m
  const desiredScreenPx = 0.6 + Math.min(1, step / 100) * 0.8; // 0.64px (5 m) a 1.4px (100+ m)
  const strokeW = desiredScreenPx / displayScale;

  const eStart = Math.ceil(e0 / step) * step;
  for (let e = eStart; e <= e1; e += step) {
    const px = ((e - p.x0) / (p.x1 - p.x0)) * img.naturalWidth;
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", px); line.setAttribute("x2", px);
    line.setAttribute("y1", 0); line.setAttribute("y2", img.naturalHeight);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", strokeW);
    line.setAttribute("stroke-opacity", "0.55");
    svg.appendChild(line);
  }
  const nStart = Math.ceil(n0 / step) * step;
  for (let n = nStart; n <= n1; n += step) {
    const py = img.naturalHeight - ((n - p.y0) / (p.y1 - p.y0)) * img.naturalHeight;
    const line = document.createElementNS(ns, "line");
    line.setAttribute("y1", py); line.setAttribute("y2", py);
    line.setAttribute("x1", 0); line.setAttribute("x2", img.naturalWidth);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", strokeW);
    line.setAttribute("stroke-opacity", "0.55");
    svg.appendChild(line);
  }

  const lbl = document.createElement("div");
  // etiqueta de la escala de grilla actual, como texto flotante (no bloquea toques)
  let tag = document.getElementById("gridStepTag");
  if (!tag) {
    tag = document.createElement("div");
    tag.id = "gridStepTag";
    // fijo a la pantalla (no a la imagen): si va dentro de imgWrap, al recortar/ampliar el
    // transform lo saca de la parte visible y deja de verse
    tag.style.cssText = "position:fixed;right:10px;background:rgba(20,23,28,.88);" +
      "color:#E4C765;font-size:11px;padding:4px 8px;border-radius:5px;pointer-events:none;z-index:45;" +
      "top:calc(env(safe-area-inset-top,0px) + 108px);";
    document.getElementById("screen-mapa").appendChild(tag);
  }
  tag.textContent = "grilla cada " + step + " m";
}

function setSelBanner(text) {
  const b = document.getElementById("selBanner");
  if (!text) { b.style.display = "none"; b.innerHTML = ""; return; }
  b.style.display = "block";
  b.textContent = text;
}

// dibuja el recuadro rojo punteado de la selección (en coordenadas de pantalla, no de la imagen)
let pendingCrop = null; // {x0,y0,x1,y1} en px naturales de la imagen, esperando confirmación
function posicionarSelRect() {
  if (!pendingCrop) { document.getElementById("selRect").style.display = "none"; return; }
  const img = document.getElementById("planImg");
  const rx = img.clientWidth / img.naturalWidth, ry = img.clientHeight / img.naturalHeight;
  const r = document.getElementById("selRect");
  r.style.left = (pendingCrop.x0 * rx) + "px";
  r.style.top = (pendingCrop.y0 * ry) + "px";
  r.style.width = ((pendingCrop.x1 - pendingCrop.x0) * rx) + "px";
  r.style.height = ((pendingCrop.y1 - pendingCrop.y0) * ry) + "px";
  r.style.display = "block";
}
function ocultarSelRect() {
  pendingCrop = null;
  document.getElementById("selRect").style.display = "none";
}

// muestra el recuadro de la selección + pregunta de confirmación con botones
function showSelConfirm(x0, y0, x1, y1) {
  pendingCrop = { x0, y0, x1, y1 };
  posicionarSelRect();
  const b = document.getElementById("selBanner");
  b.style.display = "block";
  b.innerHTML = "";
  const txt = document.createElement("div");
  txt.textContent = "¿Ampliar esta área?";
  b.appendChild(txt);
  const row = document.createElement("div");
  row.className = "selBtnRow";
  const btnSi = document.createElement("button");
  btnSi.className = "selBtnSi";
  btnSi.textContent = "Sí, ampliar";
  btnSi.addEventListener("click", () => {
    const c = pendingCrop;
    ocultarSelRect();
    seleccionando = null;
    selPuntos = [];
    setSelBanner(null);
    enterCropView(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
  });
  const btnMas = document.createElement("button");
  btnMas.className = "selBtnNo";
  btnMas.textContent = "Agregar otro punto";
  btnMas.addEventListener("click", () => {
    // sigue en modo selección: el siguiente toque (o el dedo mientras se mueve) amplía
    // el recuadro actual para que también incluya ese punto nuevo
    seleccionando = "extra";
    setSelBanner("Toca otro punto para ampliar el recuadro de selección.");
  });
  const btnNo = document.createElement("button");
  btnNo.className = "selBtnNo";
  btnNo.textContent = "Elegir de nuevo";
  btnNo.addEventListener("click", () => {
    ocultarSelRect();
    seleccionando = 1;
    selPuntos = [];
    setSelBanner("Toca la primera esquina del área que quieres ampliar.");
  });
  row.appendChild(btnSi);
  row.appendChild(btnMas);
  row.appendChild(btnNo);
  b.appendChild(row);
}

function enterCropView(cropX0, cropY0, cropW, cropH) {
  const img = document.getElementById("planImg");
  const imgWrap = document.getElementById("imgWrap");
  const mapScroll = document.getElementById("mapScroll");
  const PAD = 10; // px de "aire" alrededor del área elegida
  cropX0 = Math.max(0, cropX0 - PAD);
  cropY0 = Math.max(0, cropY0 - PAD);
  cropW = Math.min(img.naturalWidth - cropX0, cropW + PAD * 2);
  cropH = Math.min(img.naturalHeight - cropY0, cropH + PAD * 2);
  const availW = mapScroll.clientWidth - 24; // padding del contenedor (12px cada lado)
  const scale = availW / cropW;
  const dispW = img.naturalWidth * scale;
  const dispH = img.naturalHeight * scale;
  img.style.width = dispW + "px";
  img.style.height = dispH + "px";
  imgWrap.style.width = dispW + "px";
  imgWrap.style.height = dispH + "px";
  imgWrap.style.transformOrigin = "0 0";
  imgWrap.style.transform = `translate(${-cropX0 * scale}px, ${-cropY0 * scale}px)`;
  // el alto del contenedor es box-sizing:border-box, hay que sumar el padding (12px arriba+abajo);
  // y hay que anular el flex:1 1 auto (si no, el contenedor se estira a toda la pantalla y
  // la altura fija de abajo no tiene efecto)
  mapScroll.style.flex = "0 0 auto";
  const csPad = getComputedStyle(mapScroll);
  const padV = parseFloat(csPad.paddingTop) + parseFloat(csPad.paddingBottom);
  mapScroll.style.height = (cropH * scale + padV) + "px";
  mapScroll.style.overflow = "hidden";

  const p = state.activePlano;
  const e0 = p.x0 + (cropX0 / img.naturalWidth) * (p.x1 - p.x0);
  const e1 = p.x0 + ((cropX0 + cropW) / img.naturalWidth) * (p.x1 - p.x0);
  const n1 = p.y1 - (cropY0 / img.naturalHeight) * (p.y1 - p.y0);
  const n0 = p.y1 - ((cropY0 + cropH) / img.naturalHeight) * (p.y1 - p.y0);
  cropMeters = { e0, e1, n0, n1 };

  renderCalLayer();
  renderPuntos();
  renderGridOverlay();
  document.getElementById("btnVerCompleto").style.display = "inline-block";
  document.getElementById("btnSeleccionArea").textContent = "Seleccionar otra área";
}

function exitCropView() {
  const img = document.getElementById("planImg");
  const imgWrap = document.getElementById("imgWrap");
  const mapScroll = document.getElementById("mapScroll");
  img.style.width = "100%";
  img.style.height = "auto";
  imgWrap.style.width = "100%";
  imgWrap.style.height = "";
  imgWrap.style.transform = "";
  mapScroll.style.flex = "1 1 auto";
  mapScroll.style.height = "";
  mapScroll.style.overflow = "auto";
  seleccionando = null;
  selPuntos = [];
  ocultarCrosshair();
  ocultarSelRect();
  setSelBanner(null);
  document.getElementById("btnVerCompleto").style.display = "none";
  document.getElementById("btnSeleccionArea").textContent = "Seleccionar área";
  cropMeters = null;
  renderCalLayer();
  renderPuntos();
  renderGridOverlay();
}

document.getElementById("btnSeleccionArea").addEventListener("click", () => {
  if (!state.activePlano) { setSelBanner("Primero carga un plano en Proyecto."); setTimeout(() => setSelBanner(null), 2500); return; }
  seleccionando = 1;
  selPuntos = [];
  ocultarCrosshair();
  ocultarSelRect();
  setSelBanner("Toca la primera esquina del área que quieres ampliar.");
});
document.getElementById("btnVerCompleto").addEventListener("click", () => { exitCropView(); setSelBanner(null); });

// convierte evento táctil/click en px relativos a resolución natural de la imagen
function eventToImgPx(ev) {
  const img = document.getElementById("planImg");
  const rect = img.getBoundingClientRect();
  const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
  const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
  const px = ((clientX - rect.left) / rect.width) * img.naturalWidth;
  const py = ((clientY - rect.top) / rect.height) * img.naturalHeight;
  return { px, py, rect, clientX, clientY };
}

function pxToUTM(px, py) {
  const p = state.activePlano;
  if (!p) return null;
  if (p.kind === "preset") {
    const e = p.x0 + (px / p.w) * (p.x1 - p.x0);
    const n = p.y1 - (py / p.h) * (p.y1 - p.y0);
    return { e, n };
  }
  if (p.kind === "custom" && p.cal && p.cal.length === 2) {
    const [A, B] = p.cal;
    // transformación de semejanza 2D (Helmert) a partir de 2 puntos: escala+rotación+traslación
    const dpx = B.px - A.px, dpy = B.py - A.py;
    const de = B.e - A.e, dn = B.n - A.n;
    const denom = dpx * dpx + dpy * dpy;
    if (denom === 0) return null;
    // resolver [de;dn] = [[a,-b],[b,a]] * [dpx;dpy]
    const a = (dpx * de + dpy * dn) / denom;
    const b = (dpx * dn - dpy * de) / denom;
    const e = A.e + a * (px - A.px) - b * (py - A.py);
    const n = A.n + b * (px - A.px) + a * (py - A.py);
    return { e, n };
  }
  return null;
}

// mientras se arma el recuadro (esperando la 2ª esquina o un punto extra), el recuadro se
// dibuja EN VIVO siguiendo el dedo, sin necesidad de soltar/tocar para verlo crecer
function onSelMove(ev) {
  if (seleccionando !== 2 && seleccionando !== "extra") return;
  if (selPuntos.length === 0) return;
  if (ev.cancelable) ev.preventDefault(); // evita que el mapa haga scroll mientras arrastras
  const { px, py } = eventToImgPx(ev);
  const b = bboxDePuntos(selPuntos.concat([{ px, py }]));
  pendingCrop = b;
  posicionarSelRect();
}
document.getElementById("imgWrap").addEventListener("touchmove", onSelMove, { passive: false });
document.getElementById("imgWrap").addEventListener("mousemove", onSelMove);

let pendingTap = null;
document.getElementById("imgWrap").addEventListener("click", (ev) => {
  if (ev.target.id !== "planImg") return;
  const { px, py } = eventToImgPx(ev);
  const p = state.activePlano;

  if (seleccionando === "confirm") return; // esperando que use los botones de abajo

  if (seleccionando === 1) {
    selPuntos = [{ px, py }];
    seleccionando = 2;
    mostrarCrosshair(px, py);
    setSelBanner("Mueve el dedo y toca la esquina opuesta del área.");
    return;
  }
  if (seleccionando === 2 || seleccionando === "extra") {
    selPuntos.push({ px, py });
    ocultarCrosshair();
    const b = bboxDePuntos(selPuntos);
    if (b.x1 - b.x0 < 5 || b.y1 - b.y0 < 5) {
      setSelBanner("Área muy pequeña — toca de nuevo la primera esquina.");
      selPuntos = [];
      seleccionando = 1;
      return;
    }
    seleccionando = "confirm";
    showSelConfirm(b.x0, b.y0, b.x1, b.y1);
    return;
  }

  if (p && p.kind === "custom" && calibrando) {
    const e = prompt("Este (UTM), para el punto " + calibrando + ":");
    if (e === null) { calibrando = null; return; }
    const n = prompt("Norte (UTM), para el punto " + calibrando + ":");
    if (n === null) { calibrando = null; return; }
    p.cal = p.cal || [];
    p.cal[calibrando - 1] = { px, py, e: parseFloat(e), n: parseFloat(n) };
    calibrando = null;
    save();
    renderCalLayer();
    updateCalStatus();
    return;
  }

  const utm = pxToUTM(px, py);
  if (!utm) { alert("Este plano aún no está calibrado. Ve a Proyecto → Calibración."); return; }
  abrirModalNuevo(px, py, utm);
});

function renderCalLayer() {
  const layer = document.getElementById("calLayer");
  layer.innerHTML = "";
  const p = state.activePlano;
  const img = document.getElementById("planImg");
  if (!p || p.kind !== "custom" || !p.cal) return;
  p.cal.forEach((c, i) => {
    if (!c) return;
    const d = document.createElement("div");
    d.className = "calpt";
    d.style.left = (c.px / img.naturalWidth * img.clientWidth) + "px";
    d.style.top = (c.py / img.naturalHeight * img.clientHeight) + "px";
    layer.appendChild(d);
  });
}

function renderPuntos() {
  const layer = document.getElementById("ptLayer");
  layer.innerHTML = "";
  const img = document.getElementById("planImg");
  const p = state.activePlano;
  if (!p) return;
  const tramoActual = p.kind === "preset" ? p.tramo : "custom";
  state.puntos
    .filter(pt => pt.tramo === tramoActual || (p.kind === "custom"))
    .forEach(pt => {
      if (pt._px == null) return;
      const color = (CAPAS[pt.capa] || CAPAS.muestreo).color;
      const d = document.createElement("div");
      d.className = "pt";
      d.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 0C6.5 0 2 4.5 2 10c0 7.5 10 14 10 14s10-6.5 10-14C22 4.5 17.5 0 12 0z" fill="' + color + '" stroke="#14171C" stroke-width="1"/><circle cx="12" cy="10" r="4" fill="#14171C"/></svg>';
      d.style.left = (pt._px / img.naturalWidth * img.clientWidth) + "px";
      d.style.top = (pt._py / img.naturalHeight * img.clientHeight) + "px";
      const lbl = document.createElement("div");
      lbl.className = "pt-label";
      lbl.textContent = pt.clave || "(sin clave)";
      d.appendChild(lbl);
      d.style.pointerEvents = "auto";
      d.addEventListener("click", (e) => { e.stopPropagation(); abrirModalEditar(pt); });
      layer.appendChild(d);
    });
}

// ---------- mira (cruz de hilos) sobre el punto que se está marcando ----------
let crosshairPxPy = null;
function mostrarCrosshair(px, py) {
  crosshairPxPy = { px, py };
  posicionarCrosshair();
  document.getElementById("crosshair").style.display = "block";
}
function ocultarCrosshair() {
  crosshairPxPy = null;
  document.getElementById("crosshair").style.display = "none";
}
function posicionarCrosshair() {
  if (!crosshairPxPy) return;
  const img = document.getElementById("planImg");
  const ch = document.getElementById("crosshair");
  ch.style.left = (crosshairPxPy.px / img.naturalWidth * img.clientWidth) + "px";
  ch.style.top = (crosshairPxPy.py / img.naturalHeight * img.clientHeight) + "px";
}

// re-render puntos (y reubicar la mira) si la imagen cambia de tamaño (pinch zoom nativo)
window.addEventListener("resize", () => { renderCalLayer(); renderPuntos(); renderGridOverlay(); posicionarCrosshair(); posicionarSelRect(); });
document.getElementById("mapScroll").addEventListener("scroll", () => {}, { passive: true });

// ---------- modal de punto ----------
const modalBg = document.getElementById("modalPunto");
let modalEditId = null;
let modalPxPy = null;

function abrirModalNuevo(px, py, utm) {
  modalEditId = null;
  modalPxPy = { px, py };
  mostrarCrosshair(px, py);
  document.getElementById("modalTitulo").textContent = "Nuevo punto";
  document.getElementById("modalCoords").textContent =
    "E " + utm.e.toFixed(2) + "   N " + utm.n.toFixed(2);
  document.getElementById("mClave").value = "";
  document.getElementById("mTipo").value = "canal";
  document.getElementById("mLong").value = "";
  document.getElementById("mNivel").value = state.proyecto.nivel || "";
  document.getElementById("mNotas").value = "";
  const capaNueva = state.capaActiva || "muestreo";
  modalBg._capa = capaNueva;
  aplicarCapaEnModal(capaNueva);
  construirCamposExtra(capaNueva, null);
  document.getElementById("mBtnBorrar").style.display = "none";
  modalBg.classList.add("show");
  modalBg._utm = utm;
}

function aplicarCapaEnModal(capa) {
  const conf = CAPAS[capa] || CAPAS.muestreo;
  document.getElementById("mMuestreoFields").style.display = (capa === "muestreo") ? "block" : "none";
  const badge = document.getElementById("modalCapaBadge");
  badge.querySelector(".dot").style.background = conf.color;
  badge.querySelector("span:last-child").textContent = conf.label;
}

function construirCamposExtra(capa, valores) {
  const cont = document.getElementById("mCamposExtra");
  cont.innerHTML = "";
  const conf = CAPAS[capa] || CAPAS.muestreo;
  conf.campos.forEach(f => {
    const lbl = document.createElement("label");
    lbl.textContent = f.label;
    cont.appendChild(lbl);
    let el;
    if (f.type === "select") {
      el = document.createElement("select");
      f.options.forEach(([val, txt]) => {
        const o = document.createElement("option");
        o.value = val; o.textContent = txt;
        el.appendChild(o);
      });
    } else if (f.type === "textarea") {
      el = document.createElement("textarea");
    } else {
      el = document.createElement("input");
      el.type = f.type === "number" ? "number" : "text";
      if (f.type === "number") el.step = "0.1";
    }
    el.id = "mx_" + f.id;
    // en un <select> asignar "" cuando ninguna opción tiene ese valor deja el campo SIN
    // selección (selectedIndex=-1); si no hay valor guardado, se deja la 1ª opción por defecto
    if (valores && valores[f.id] != null) el.value = valores[f.id];
    else if (f.type !== "select") el.value = "";
    cont.appendChild(el);
  });
}

function abrirModalEditar(pt) {
  modalEditId = pt.id;
  modalPxPy = { px: pt._px, py: pt._py };
  mostrarCrosshair(pt._px, pt._py);
  const capa = pt.capa || "muestreo";
  modalBg._capa = capa;
  document.getElementById("modalTitulo").textContent = "Editar punto";
  document.getElementById("modalCoords").textContent =
    "E " + pt.este.toFixed(2) + "   N " + pt.norte.toFixed(2);
  document.getElementById("mClave").value = pt.clave || "";
  document.getElementById("mTipo").value = pt.tipo || "canal";
  document.getElementById("mLong").value = pt.longCanal || "";
  document.getElementById("mNivel").value = pt.nivel || "";
  document.getElementById("mNotas").value = pt.notas || "";
  aplicarCapaEnModal(capa);
  construirCamposExtra(capa, pt.campos || null);
  document.getElementById("mBtnBorrar").style.display = "inline-block";
  modalBg.classList.add("show");
  modalBg._utm = { e: pt.este, n: pt.norte };
}

document.getElementById("mBtnCancelar").addEventListener("click", () => { modalBg.classList.remove("show"); ocultarCrosshair(); });

document.getElementById("mBtnGuardar").addEventListener("click", () => {
  const clave = document.getElementById("mClave").value.trim();
  if (!clave) { alert("Falta la clave de estación."); return; }
  const utm = modalBg._utm;
  const p = state.activePlano;
  const tramo = p.kind === "preset" ? p.tramo : "custom";
  const capa = modalBg._capa || "muestreo";
  const data = {
    capa,
    clave,
    nivel: document.getElementById("mNivel").value,
    notas: document.getElementById("mNotas").value,
    este: utm.e, norte: utm.n,
    tramo,
    _px: modalPxPy.px, _py: modalPxPy.py,
  };
  if (capa === "muestreo") {
    data.tipo = document.getElementById("mTipo").value;
    data.longCanal = document.getElementById("mLong").value;
  } else {
    const campos = {};
    (CAPAS[capa] || CAPAS.muestreo).campos.forEach(f => {
      const el = document.getElementById("mx_" + f.id);
      if (el) campos[f.id] = el.value;
    });
    data.campos = campos;
  }
  if (modalEditId) {
    const i = state.puntos.findIndex(x => x.id === modalEditId);
    if (i >= 0) state.puntos[i] = { ...state.puntos[i], ...data };
  } else {
    data.id = "p" + (state.nextLocalId++);
    data.fecha = new Date().toISOString();
    state.puntos.push(data);
  }
  save();
  modalBg.classList.remove("show");
  ocultarCrosshair();
  renderPuntos();
});

document.getElementById("mBtnBorrar").addEventListener("click", () => {
  if (!confirm("¿Borrar este punto?")) return;
  state.puntos = state.puntos.filter(x => x.id !== modalEditId);
  save();
  modalBg.classList.remove("show");
  ocultarCrosshair();
  renderPuntos();
});

// ---------- lista ----------
function resumenCapa(pt) {
  const capa = pt.capa || "muestreo";
  if (capa === "muestreo") return pt.tipo || "";
  const conf = CAPAS[capa];
  if (!conf || !pt.campos) return "";
  const primero = conf.campos[0];
  return primero ? (pt.campos[primero.id] || "") : "";
}

function renderLista() {
  const wrap = document.getElementById("tablaWrap");
  if (state.puntos.length === 0) {
    wrap.innerHTML = '<div class="empty">Aún no hay puntos capturados.</div>';
    return;
  }
  let html = "<table><thead><tr><th>Clave</th><th>Capa</th><th>Detalle</th><th>Tramo</th><th>Este</th><th>Norte</th></tr></thead><tbody>";
  state.puntos.forEach(pt => {
    const conf = CAPAS[pt.capa || "muestreo"] || CAPAS.muestreo;
    html += `<tr data-id="${pt.id}"><td>${pt.clave}</td>` +
      `<td><span class="pill" style="color:${conf.color};">${conf.label}</span></td>` +
      `<td>${resumenCapa(pt)}</td>` +
      `<td>${pt.tramo || ""}</td><td>${pt.este.toFixed(1)}</td><td>${pt.norte.toFixed(1)}</td></tr>`;
  });
  html += "</tbody></table>";
  wrap.innerHTML = html;
  wrap.querySelectorAll("tr[data-id]").forEach(tr => {
    tr.addEventListener("click", () => {
      const pt = state.puntos.find(x => x.id === tr.dataset.id);
      if (pt) abrirModalEditar(pt);
    });
  });
}

// ---------- exportar ----------
// columnas extra: la unión de los campos propios de todas las capas (alteración, litológico,
// estructural, superficie); quedan vacías en las filas de una capa que no las usa
const EXTRA_FIELD_IDS = [];
Object.values(CAPAS).forEach(c => c.campos.forEach(f => {
  if (!EXTRA_FIELD_IDS.includes(f.id)) EXTRA_FIELD_IDS.push(f.id);
}));

function csvCampo(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }

function toCSV() {
  const headers = ["capa", "clave", "tipo", "long_canal_m", ...EXTRA_FIELD_IDS,
    "nivel", "tramo", "este_utm13n", "norte_utm13n", "notas", "fecha"];
  const rows = [headers.join(",")];
  state.puntos.forEach(pt => {
    const extras = EXTRA_FIELD_IDS.map(id => csvCampo(pt.campos ? pt.campos[id] : ""));
    const vals = [csvCampo((CAPAS[pt.capa || "muestreo"] || CAPAS.muestreo).label),
      csvCampo(pt.clave), csvCampo(pt.tipo || ""), csvCampo(pt.longCanal || ""),
      ...extras,
      csvCampo(pt.nivel), csvCampo(pt.tramo),
      pt.este.toFixed(3), pt.norte.toFixed(3),
      csvCampo(pt.notas || ""), csvCampo(pt.fecha)];
    rows.push(vals.join(","));
  });
  return rows.join("\n");
}

function toGeoJSON() {
  return JSON.stringify({
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::32613" } },
    features: state.puntos.map(pt => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [pt.este, pt.norte] },
      properties: { capa: (CAPAS[pt.capa || "muestreo"] || CAPAS.muestreo).label,
        clave: pt.clave, tipo: pt.tipo || null, long_canal_m: pt.longCanal || null,
        ...(pt.campos || {}),
        nivel: pt.nivel, tramo: pt.tramo, notas: pt.notas, fecha: pt.fecha },
    })),
  }, null, 2);
}

function descargar(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

document.getElementById("btnExport").addEventListener("click", () => {
  if (state.puntos.length === 0) { alert("No hay puntos que exportar todavía."); return; }
  const fecha = new Date().toISOString().slice(0, 10);
  const nivel = state.proyecto.nivel || "XX";
  descargar(`muestreo_nivel${nivel}_${fecha}.csv`, toCSV(), "text/csv");
  setTimeout(() => descargar(`muestreo_nivel${nivel}_${fecha}.geojson`, toGeoJSON(), "application/geo+json"), 400);
});

document.getElementById("btnBackupJSON").addEventListener("click", () => {
  descargar("nwgeo_muestreo_backup.json", JSON.stringify(state, null, 2), "application/json");
});

document.getElementById("fileRestore").addEventListener("change", (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const restored = JSON.parse(e.target.result);
      if (!confirm("Esto reemplaza todos los puntos y planos cargados por los del respaldo. ¿Continuar?")) return;
      if (!restored.capaActiva) restored.capaActiva = "muestreo";
      state = restored;
      save();
      fillProyectoForm();
      renderCapaBar();
      mostrarPlano();
      renderLista();
      alert("Respaldo restaurado.");
    } catch (err) {
      alert("Ese archivo no es un respaldo válido.");
    }
  };
  reader.readAsText(file);
});

// ---------- init ----------
if (state.activePlano) mostrarPlano();

// service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
