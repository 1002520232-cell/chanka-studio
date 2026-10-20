// EDITOR — el "cerebro": guarda el diseño actual y sabe cambiarlo
// No toca la pantalla (eso lo hace ui/panel.js), por eso se puede probar sin navegador.
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});
  const { Prendas, Motivos, Plantillas } = Chanka;

  let estado, seleccionado = null, puntoContorno = null;
  let historial = [], futuro = [], sucio = false;
  const copiar = v => JSON.parse(JSON.stringify(v));

  // ---------- Diseño nuevo ----------
  function aplicarPrenda(s, id) {
    const p = Prendas.lista[id];
    s.garment = id; s.base = p.color; s.suave = p.suave; s.tension = p.tension;
    s.contour = p.puntos.map(([x, y]) => ({ x, y }));
  }
  function crearEstado(prenda = 'poncho') {
    const s = {
      format: 'chanka-studio', version: 2,
      id: G.crypto && G.crypto.randomUUID ? G.crypto.randomUUID() : String(Date.now()),
      name: 'Mi diseño textil', vista: 'textura', reference: null, curves: [], paint: [],
    };
    aplicarPrenda(s, prenda);
    return s;
  }
  estado = crearEstado();

  // ---------- Historial (deshacer / rehacer) ----------
  // Llama a guardarPaso() ANTES de cambiar algo.
  function guardarPaso() {
    historial.push(copiar(estado));
    if (historial.length > 60) historial.shift();
    futuro = [];
    sucio = true;
  }
  function reubicarSeleccion() {
    if (!estado.curves.some(c => c.id === seleccionado)) seleccionado = estado.curves.length ? estado.curves[estado.curves.length - 1].id : null;
    if (puntoContorno !== null && puntoContorno >= estado.contour.length) puntoContorno = null;
  }
  function deshacer() {
    if (!historial.length) return;
    futuro.push(copiar(estado)); estado = historial.pop(); sucio = true; reubicarSeleccion();
  }
  function rehacer() {
    if (!futuro.length) return;
    historial.push(copiar(estado)); estado = futuro.pop(); sucio = true; reubicarSeleccion();
  }

  // ---------- Diseño completo ----------
  function nuevo() {
    estado = crearEstado(); seleccionado = null; puntoContorno = null; historial = []; futuro = []; sucio = false;
  }
  function reemplazar(s) {
    estado = copiar(s); estado.paint = estado.paint || []; seleccionado = estado.curves[0] ? estado.curves[0].id : null;
    puntoContorno = null; historial = []; futuro = []; sucio = false;
  }
  // Cambiar de prenda conserva los motivos, para probar el mismo diseño en otra ropa
  function elegirPrenda(id) {
    guardarPaso(); aplicarPrenda(estado, id); puntoContorno = null;
  }

  // ---------- Motivos ----------
  function agregar(motivo) {
    if (estado.curves.length >= 200) return false;
    guardarPaso(); estado.curves.push(motivo); seleccionado = motivo.id;
    return true;
  }
  function duplicar() {
    const c = motivo();
    if (!c) return;
    guardarPaso();
    const copia = copiar(c);
    copia.id = 'c' + Date.now() + Math.random().toString(16).slice(2);
    copia.x += 25; copia.y += 45;
    estado.curves.push(copia); seleccionado = copia.id;
  }
  function eliminar() {
    if (!motivo()) return;
    guardarPaso();
    estado.curves = estado.curves.filter(c => c.id !== seleccionado);
    seleccionado = null; reubicarSeleccion();
  }
  function cambiarTipo(tipo) {
    const c = motivo();
    if (!c) return;
    guardarPaso();
    const base = Motivos.nuevo(tipo);
    Object.assign(c, { type: tipo, points: base.points, cx: base.cx, cy: base.cy, preset: null });
  }

  // Orden de capas: +1 al frente, -1 hacia atrás
  function moverCapa(d) {
    const i = estado.curves.findIndex(c => c.id === seleccionado), j = i + d;
    if (i < 0 || j < 0 || j >= estado.curves.length) return;
    guardarPaso();
    estado.curves.splice(j, 0, estado.curves.splice(i, 1)[0]);
  }
  function desplazar(dx, dy) { const c = motivo(); if (c) { guardarPaso(); c.x += dx; c.y += dy; } }

  // ---------- Pintura a mano alzada ----------
  function agregarTrazo(t) {
    if ((estado.paint || []).length >= 500) return false;
    guardarPaso(); (estado.paint = estado.paint || []).push(t);
    return true;
  }
  function borrarTrazo(id) {
    if (!(estado.paint || []).some(t => t.id === id)) return false;
    guardarPaso(); estado.paint = estado.paint.filter(t => t.id !== id);
    return true;
  }
  function limpiarPintura() { if ((estado.paint || []).length) { guardarPaso(); estado.paint = []; } }

  // ---------- Plantillas ----------
  function aplicarPlantilla(id) {
    const p = Plantillas.lista.find(q => q.id === id);
    if (!p) return false;
    guardarPaso(); estado.curves = p.crear(); if (p.base) estado.base = p.base;
    seleccionado = null; reubicarSeleccion();
    return true;
  }

  // ---------- Contorno de la prenda ----------
  // Inserta un punto nuevo entre el punto elegido y el siguiente
  function agregarPuntoContorno() {
    const i = puntoContorno === null ? 0 : puntoContorno, n = estado.contour.length;
    if (n >= 100) return false;
    guardarPaso();
    const a = estado.contour[i], b = estado.contour[(i + 1) % n];
    estado.contour.splice(i + 1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    puntoContorno = i + 1;
    return true;
  }
  function quitarPuntoContorno() {
    if (puntoContorno === null || estado.contour.length <= 3) return false;
    guardarPaso();
    estado.contour.splice(puntoContorno, 1); puntoContorno = null;
    return true;
  }
  function restaurarContorno() {
    guardarPaso(); aplicarPrenda(estado, estado.garment); puntoContorno = null;
  }

  // ---------- Consultas ----------
  const motivo = () => estado.curves.find(c => c.id === seleccionado) || null;

  Chanka.Editor = {
    estado: () => estado,
    motivo,
    seleccionado: () => seleccionado,
    seleccionar: id => { seleccionado = id; },
    puntoContorno: () => puntoContorno,
    elegirPuntoContorno: i => { puntoContorno = i; },
    sucio: () => sucio,
    marcarLimpio: () => { sucio = false; },
    puedeDeshacer: () => historial.length > 0,
    puedeRehacer: () => futuro.length > 0,
    guardarPaso, deshacer, rehacer, nuevo, reemplazar, elegirPrenda,
    agregar, duplicar, eliminar, cambiarTipo, moverCapa, desplazar,
    agregarTrazo, borrarTrazo, limpiarPintura, aplicarPlantilla,
    agregarPuntoContorno, quitarPuntoContorno, restaurarContorno,
    ponerReferencia(url) { guardarPaso(); estado.reference = url; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
