// ARCHIVO — guardar, abrir, descargar y exportar
// Los diseños se guardan en el navegador (localStorage) y como archivo .json editable.
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});
  const { Prendas, Trazo, Motivos } = Chanka;
  const CLAVE = 'chanka-designs-v2';
  const CLAVE_ANTIGUA = 'chanka-designs-v1';
  let usuarioActual = 'invitado';
  function establecerUsuario(id) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error('Usuario no válido');
    usuarioActual = id;
  }
  const claveGuardados = () => usuarioActual === 'invitado' ? CLAVE : CLAVE + ':' + usuarioActual;

  // ¿Este objeto es un diseño válido? (se usa antes de abrir cualquier archivo)
  function validar(s) {
    const hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
    const num = (v, a, b) => typeof v === 'number' && Number.isFinite(v) && v >= a && v <= b;
    if (!s || s.format !== 'chanka-studio' || s.version !== 2) return false;
    if (typeof s.id !== 'string' || typeof s.name !== 'string' || s.name.length > 200) return false;
    if (!Prendas.lista[s.garment] || !hex(s.base) || typeof s.suave !== 'boolean' || !num(s.tension, 0, 1)) return false;
    if (!['textura', 'boceto'].includes(s.vista)) return false;
    if (!Array.isArray(s.contour) || s.contour.length < 3 || s.contour.length > 100) return false;
    if (!s.contour.every(p => p && num(p.x, -200, 1000) && num(p.y, -200, 1000))) return false;
    if (s.reference !== null && !(typeof s.reference === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(s.reference) && s.reference.length < 4000000)) return false;
    if (!Array.isArray(s.curves) || s.curves.length > 200) return false;

    const trazoOk = t => t && typeof t.id === 'string' && hex(t.color) && num(t.width, 1, 60) && (t.op === undefined || num(t.op, 0.1, 1)) &&
      Array.isArray(t.pts) && t.pts.length >= 1 && t.pts.length <= 3000 && t.pts.every(p => p && num(p.x, -200, 1000) && num(p.y, -200, 1000));
    if (s.paint !== undefined && !(Array.isArray(s.paint) && s.paint.length <= 500 && s.paint.every(trazoOk))) return false;

    const ids = new Set();
    return s.curves.every(c => {
      if (!c || typeof c.id !== 'string' || ids.has(c.id) || !Motivos.NOMBRES[c.type]) return false;
      ids.add(c.id);
      const cantidad = c.type === 'bspline' ? 6 : 4;
      return Array.isArray(c.points) && c.points.length === cantidad &&
        c.points.every(p => p && num(p.x, -10000, 10000) && num(p.y, -10000, 10000)) &&
        (c.preset === null || typeof c.preset === 'string') &&
        hex(c.color) && num(c.x, -10000, 10000) && num(c.y, -10000, 10000) &&
        num(c.cx, -10000, 10000) && num(c.cy, -10000, 10000) &&
        num(c.scale, 0.15, 4) && num(c.rot, -360, 360) && num(c.width, 1, 16) &&
        Number.isInteger(c.repeatX) && num(c.repeatX, 1, 10) && Number.isInteger(c.repeatY) && num(c.repeatY, 1, 10) &&
        num(c.gapX, 20, 600) && num(c.gapY, 20, 600) &&
        typeof c.closed === 'boolean' && typeof c.mirror === 'boolean';
    });
  }

  // Convierte diseños de la versión 1 al formato actual
  function migrar(s) {
    if (!s || s.version !== 1) return s;
    const id = s.garment === 'custom' ? 'libre' : s.garment;
    const prenda = Prendas.lista[id];
    if (!prenda) return null;
    return {
      format: 'chanka-studio', version: 2, id: s.id, name: s.name, garment: id, base: s.base,
      suave: prenda.suave, tension: prenda.tension, vista: 'textura',
      contour: prenda.puntos.map(([x, y]) => ({ x, y })), reference: s.reference || null,
      curves: (s.curves || []).map(c => {
        const caja = Trazo.caja(Trazo.muestrear(c.type, c.points));
        const cx = (caja.x0 + caja.x1) / 2, cy = (caja.y0 + caja.y1) / 2;
        return { ...c, preset: c.preset || null, cx, cy, x: c.x + c.scale * cx, y: c.y + c.scale * cy, rot: 0, mirror: false };
      }),
    };
  }

  // ----- Guardado en el navegador -----
  function leerGuardados() {
    const leer = clave => { try { const d = JSON.parse(localStorage.getItem(clave) || '[]'); return Array.isArray(d) ? d : []; } catch { return []; } };
    // El perfil invitado conserva los guardados del proyecto original.
    const lista = (usuarioActual === 'invitado'
      ? [...leer(CLAVE), ...leer(CLAVE_ANTIGUA).map(migrar)]
      : leer(claveGuardados())).filter(validar);
    return lista.filter((s, i) => lista.findIndex(o => o.id === s.id) === i);
  }
  function escribirGuardados(lista) {
    try { localStorage.setItem(claveGuardados(), JSON.stringify(lista)); return true; } catch { return false; }
  }

  // ----- Descargas -----
  function descargar(contenido, tipo, nombre) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function nombreSeguro(nombre) {
    return (nombre.replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'diseno').slice(0, 70);
  }
  // SVG limpio (sin puntos de control ni cuadros de selección)
  function svgLimpio(svg) {
    const copia = svg.cloneNode(true);
    copia.querySelectorAll('.editing-ui').forEach(n => n.remove());
    copia.setAttribute('viewBox', '0 0 800 800');
    copia.setAttribute('width', '800');
    copia.setAttribute('height', '800');
    return copia;
  }
  const svgComoTexto = svg => new XMLSerializer().serializeToString(svgLimpio(svg));

  // PNG de 1600 px (fondo blanco) a partir del SVG del lienzo
  function exportarPng(svg, nombre, listo) {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 1600;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1600, 1600); x.drawImage(img, 0, 0, 1600, 1600);
      c.toBlob(b => { descargar(b, 'image/png', nombre); if (listo) listo(); });
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgComoTexto(svg));
  }

  Chanka.Archivo = { validar, migrar, exportarPng, leerGuardados, escribirGuardados, establecerUsuario, descargar, nombreSeguro, svgLimpio, svgComoTexto };
})(typeof window !== 'undefined' ? window : globalThis);
