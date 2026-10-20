// ESCENA — dibuja la prenda y los motivos en un <svg>
// Solo recibe datos y los convierte en figuras. No guarda nada ni reacciona a clics.
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});
  const { Trazo, Prendas } = Chanka;
  const NS = 'http://www.w3.org/2000/svg';

  function nodo(etiqueta, atributos = {}) {
    const n = document.createElementNS(NS, etiqueta);
    for (const k in atributos) n.setAttribute(k, atributos[k]);
    return n;
  }
  const texto = pts => pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');

  // Puntos del contorno ya suavizado (o rectos si la prenda es angular)
  function contorno(s) {
    return s.suave ? Trazo.suavizar(s.contour, s.tension, 8) : s.contour;
  }

  // ---------- Prenda (tela, textura, sombra y detalles) ----------
  function dibujarPrenda(svg, s, prefijo, opacidad = 1, mini = false) {
    const pts = texto(contorno(s));
    const defs = nodo('defs');

    const recorte = nodo('clipPath', { id: prefijo + '-recorte' });
    recorte.append(nodo('polygon', { points: pts }));

    const sombra = nodo('linearGradient', { id: prefijo + '-sombra', x1: '0%', x2: '100%' });
    [['0%', '#000', 0.4], ['25%', '#fff', 0.13], ['46%', '#000', 0.32], ['60%', '#fff', 0.18], ['83%', '#000', 0.2], ['100%', '#000', 0.43]]
      .forEach(([offset, color, op]) => sombra.append(nodo('stop', { offset, 'stop-color': color, 'stop-opacity': op })));

    const tela = nodo('pattern', { id: prefijo + '-tela', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-24)' });
    tela.append(nodo('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#28180d', 'stroke-width': 1, opacity: 0.25 }));
    tela.append(nodo('line', { x1: 2, y1: 0, x2: 2, y2: 6, stroke: '#fff', 'stroke-width': 0.5, opacity: 0.12 }));

    defs.append(recorte, sombra, tela);
    svg.append(defs);

    svg.append(nodo('polygon', { points: pts, fill: s.base, 'fill-opacity': opacidad, stroke: '#50331e', 'stroke-width': mini ? 5 : 2 }));
    if (s.vista === 'boceto' || opacidad < 1) return;

    svg.append(nodo('polygon', { points: pts, fill: `url(#${prefijo}-tela)` }));
    svg.append(nodo('polygon', { points: pts, fill: `url(#${prefijo}-sombra)` }));

    const prenda = Prendas.lista[s.garment];
    for (const d of prenda ? prenda.detalles : []) {
      const puntos = d.p.map(([x, y]) => ({ x, y }));
      svg.append(nodo('polyline', {
        points: texto(Trazo.muestrear('bezier', puntos, 24)), fill: 'none', stroke: d.color,
        'stroke-width': d.ancho, opacity: d.op, 'stroke-linecap': 'round', 'clip-path': `url(#${prefijo}-recorte)`,
      }));
    }
  }

  // ---------- Motivos ----------
  function dibujarMotivo(svg, c) {
    const grupo = nodo('g', { 'clip-path': 'url(#prenda-recorte)' });
    const etiqueta = c.closed ? 'polygon' : 'polyline';
    for (const copia of Trazo.copiasMotivo(c)) {
      const pts = texto(copia);
      // figura visible
      grupo.append(nodo(etiqueta, {
        points: pts, stroke: c.color, fill: c.closed ? c.color : 'none',
        'stroke-width': c.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }));
      // misma figura, transparente y más gruesa: es el "área de clic"
      grupo.append(nodo(etiqueta, {
        points: pts, stroke: 'transparent', fill: c.closed ? 'transparent' : 'none',
        'stroke-width': Math.max(16, c.width), 'pointer-events': c.closed ? 'all' : 'stroke',
        'data-curva': c.id, class: 'editable',
      }));
    }
    svg.append(grupo);
  }

  // Cuadro punteado + tirador de tamaño
  function dibujarSeleccion(svg, c) {
    const caja = Trazo.caja(Trazo.curvaMotivo(c));
    const x = caja.x0 - 12, y = caja.y0 - 12;
    const w = Math.max(24, caja.x1 - x + 12), h = Math.max(24, caja.y1 - y + 12);
    const g = nodo('g', { class: 'editing-ui' });
    g.append(nodo('rect', { x, y, width: w, height: h, fill: 'none', stroke: '#47818d', 'stroke-dasharray': '5 4', 'stroke-width': 1.5, 'data-curva': c.id, class: 'editable' }));
    g.append(nodo('rect', { x: x + w - 7, y: y + h - 7, width: 14, height: 14, rx: 3, fill: '#fff', stroke: '#47818d', 'stroke-width': 2, 'data-curva': c.id, 'data-escala': 'si', class: 'resize-handle' }));
    svg.append(g);
  }

  // Puntos de control (P0, P1... o T0, T1 en Hermite)
  function dibujarPuntos(svg, c) {
    const M = Trazo.matrizMotivo(c, 0, 0);
    const P = Chanka.Matrices.aplicarLista(M, c.points);
    const g = nodo('g', { class: 'editing-ui' });
    if (c.type === 'hermite') {
      for (const [a, b] of [[0, 2], [1, 3]]) g.append(nodo('line', { x1: P[a].x, y1: P[a].y, x2: P[b].x, y2: P[b].y, stroke: '#307baf', 'stroke-dasharray': '5 4' }));
    } else {
      g.append(nodo('polyline', { points: texto(P), fill: 'none', stroke: '#777', 'stroke-dasharray': '5 4' }));
    }
    P.forEach((p, i) => {
      const esTangente = c.type === 'hermite' && i > 1;
      g.append(nodo('circle', { cx: p.x, cy: p.y, r: 7, fill: esTangente ? '#307baf' : '#fff', stroke: '#30251c', 'stroke-width': 2, class: 'handle', 'data-punto': i, 'data-curva': c.id }));
      const rotulo = nodo('text', { x: p.x + 10, y: p.y - 10, fill: '#30251c', 'font-size': 13 });
      rotulo.textContent = (esTangente ? 'T' + (i - 2) : 'P' + i);
      g.append(rotulo);
    });
    svg.append(g);
  }

  // Puntos turquesa para cambiar la forma de la prenda
  function dibujarContorno(svg, s, ui) {
    const g = nodo('g', { class: 'editing-ui' });
    g.append(nodo('polygon', { points: texto(contorno(s)), fill: 'none', stroke: '#12a5ae', 'stroke-width': 2, 'pointer-events': 'none' }));
    s.contour.forEach((p, i) => g.append(nodo('circle', {
      cx: p.x, cy: p.y, r: 7 / Math.sqrt(ui.zoom || 1), 'stroke-width': 2, stroke: '#147881',
      fill: i === ui.puntoContorno ? '#ffd36b' : '#fff', class: 'handle', 'data-contorno': i,
    })));
    svg.append(g);
  }

  // Pintura a mano alzada (recortada a la prenda). Con 'borrar' cada trazo se puede pulsar.
  function dibujarPintura(svg, s, borrar) {
    if (!s.paint || !s.paint.length) return;
    const g = nodo('g', { 'clip-path': 'url(#prenda-recorte)' });
    for (const t of s.paint) {
      const pts = texto(t.pts);
      g.append(nodo('polyline', { points: pts, fill: 'none', stroke: t.color, 'stroke-width': t.width, opacity: t.op ?? 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none' }));
      if (borrar) g.append(nodo('polyline', { points: pts, fill: 'none', stroke: 'transparent', 'stroke-width': Math.max(14, t.width), 'stroke-linecap': 'round', 'pointer-events': 'stroke', 'data-trazo': t.id, class: 'editable' }));
    }
    svg.append(g);
  }

  // Cuadrícula de 50 px y eje de simetría (x = 400); no se exportan
  function dibujarGuias(svg) {
    const g = nodo('g', { class: 'editing-ui', 'pointer-events': 'none' });
    for (let v = 0; v <= 800; v += 50) {
      const eje = v === 400;
      g.append(nodo('line', { x1: v, y1: 0, x2: v, y2: 800, stroke: '#47818d', opacity: eje ? 0.8 : 0.18, 'stroke-width': eje ? 1.5 : 1, 'stroke-dasharray': eje ? '6 4' : '0' }));
      g.append(nodo('line', { x1: 0, y1: v, x2: 800, y2: v, stroke: '#47818d', opacity: 0.18 }));
    }
    svg.append(g);
  }

  // ---------- Función principal ----------
  // ui = { seleccion, mostrarPuntos, editarContorno, puntoContorno, zoom }
  function dibujar(svg, s, ui = {}) {
    svg.replaceChildren();
    const trazando = ui.editarContorno && s.reference;
    if (trazando) svg.append(nodo('image', { href: s.reference, x: 40, y: 40, width: 720, height: 720, preserveAspectRatio: 'xMidYMid meet', class: 'editing-ui', 'pointer-events': 'none' }));
    dibujarPrenda(svg, s, 'prenda', trazando ? 0.4 : 1);
    dibujarPintura(svg, s, ui.borrar);
    s.curves.forEach(c => dibujarMotivo(svg, c));
    const elegido = s.curves.find(c => c.id === ui.seleccion);
    if (elegido) dibujarSeleccion(svg, elegido);
    if (elegido && ui.mostrarPuntos) dibujarPuntos(svg, elegido);
    if (ui.cuadricula) dibujarGuias(svg);
    if (ui.editarContorno) dibujarContorno(svg, s, ui);
  }

  // Dibujito pequeño para los botones de prendas
  function miniatura(svg, id) {
    const p = Prendas.lista[id];
    const s = { garment: id, base: p.color, suave: p.suave, tension: p.tension, vista: 'textura', contour: p.puntos.map(([x, y]) => ({ x, y })) };
    dibujarPrenda(svg, s, 'mini-' + id, 1, true);
  }

  Chanka.Escena = { NS, nodo, contorno, dibujar, miniatura };
})(typeof window !== 'undefined' ? window : globalThis);
