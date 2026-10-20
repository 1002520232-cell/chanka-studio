// PANEL — conecta los botones y el lienzo con el editor
// Aquí está todo lo que "se ve y se toca": botones, sliders, arrastrar, zoom, guardar.
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});
  const { Editor, Escena, Trazo, Matrices, Motivos, Archivo, Prendas, Plantillas } = Chanka;

  const $ = id => document.getElementById(id);
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const estado = () => Editor.estado();
  const mensaje = texto => { $('estado').textContent = texto; };
  const COLORES = [['Nogal', '#795337'], ['Crema', '#e6d7b9'], ['Terracota', '#a35f46'], ['Vino', '#8d3439'],
                   ['Dorado suave', '#bb9148'], ['Oliva', '#6c7458'], ['Carbón', '#373733'], ['Azul profundo', '#3c5663'],
                   ['Turquesa', '#2f8f94'], ['Rosa andino', '#c2527a'], ['Amarillo maíz', '#e3b73c'], ['Blanco lana', '#f6f1e7']];

  let zoom = 1, vx = 0, vy = 0;   // encuadre del lienzo
  let arrastre = null;            // lo que se está arrastrando ahora
  let arrastreMano = null;        // punto de curva o contorno sostenido por pinza
  let guardados = [];
  let modo = 'disenar', herramienta = 'pincel';   // pestaña y herramienta activas

  // =====================================================================
  // 1. DIBUJAR Y SINCRONIZAR
  // =====================================================================
  function dibujar() {
    const t0 = performance.now(), s = estado();
    Escena.dibujar($('lienzo'), s, {
      seleccion: Editor.seleccionado(), mostrarPuntos: $('puntos').checked,
      editarContorno: $('editarContorno').checked, puntoContorno: Editor.puntoContorno(), zoom,
      cuadricula: $('cuadricula').checked, borrar: modo === 'pintar' && herramienta === 'borrador',
    });
    $('metricas').textContent = `${s.curves.length} motivos · ${(s.paint || []).length} trazos`;

    $('deshacer').disabled = !Editor.puedeDeshacer();
    $('rehacer').disabled = !Editor.puedeRehacer();
    $('duplicar').disabled = $('eliminar').disabled = $('alFrente').disabled = $('atras').disabled = !Editor.motivo();
    $('masPunto').disabled = $('menosPunto').disabled = !$('editarContorno').checked;

    $('elementos').replaceChildren();
    s.curves.forEach((c, i) => {
      const b = document.createElement('button');
      b.textContent = `${i + 1}. ${c.preset || Motivos.NOMBRES[c.type]} · ${c.repeatX * c.repeatY} copias`;
      b.className = c.id === Editor.seleccionado() ? 'active' : '';
      b.onclick = () => { Editor.seleccionar(c.id); refrescar(); };
      $('elementos').append(b);
    });
    document.querySelectorAll('.garment').forEach(b => b.classList.toggle('active', b.dataset.prenda === s.garment));
  }

  function textosSalida() {
    $('salidaGrosor').textContent = $('grosor').value + ' px';
    $('salidaTamano').textContent = $('tamano').value + '%';
    $('salidaGiro').textContent = $('giro').value + '°';
    $('salidaPG').textContent = $('pGrosor').value + ' px';
    $('salidaPO').textContent = Math.round($('pOpacidad').value * 100) + '%';
  }

  // Copia los valores del diseño a los controles
  function syncControles() {
    const s = estado(), c = Editor.motivo();
    $('nombre').value = s.name; $('base').value = s.base; $('vista').value = s.vista;
    if (c) {
      $('tipo').value = c.type; $('color').value = c.color; $('grosor').value = c.width;
      $('tamano').value = Math.round(c.scale * 100); $('giro').value = Math.round(c.rot);
      $('repX').value = c.repeatX; $('repY').value = c.repeatY; $('sepX').value = c.gapX; $('sepY').value = c.gapY;
      $('cerrado').checked = c.closed; $('espejo').checked = c.mirror;
    }
    $('infoCurva').textContent = Motivos.DESCRIPCIONES[$('tipo').value];
    $('fotoVista').hidden = $('quitarFoto').hidden = !s.reference;
    if (s.reference) $('fotoVista').src = s.reference;
    textosSalida();
  }
  function refrescar() { syncControles(); dibujar(); }

  // =====================================================================
  // 2. ZOOM
  // =====================================================================
  function aplicarVista() {
    $('lienzo').setAttribute('viewBox', `${vx} ${vy} ${800 / zoom} ${800 / zoom}`);
    $('zoomValor').textContent = Math.round(zoom * 100) + '%';
  }
  function cambiarZoom(nuevo, ancla = { x: vx + 400 / zoom, y: vy + 400 / zoom }) {
    const antes = 800 / zoom;
    zoom = limitar(nuevo, 0.5, 5);
    const ahora = 800 / zoom;
    vx = ancla.x - ((ancla.x - vx) * ahora) / antes;
    vy = ancla.y - ((ancla.y - vy) * ahora) / antes;
    aplicarVista();
  }
  function reiniciarVista() { zoom = 1; vx = vy = 0; aplicarVista(); }

  // Convierte la posición del puntero (pantalla) a coordenadas del lienzo
  function coord(e) {
    const svg = $('lienzo'), p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  // =====================================================================
  // 3. ARRASTRAR SOBRE EL LIENZO
  // =====================================================================
  function alPulsar(e) {
    if (e.button !== 0) return;
    const pos = coord(e), d = e.target.dataset, svg = $('lienzo');

    if (modo === 'pintar') {
      svg.setPointerCapture(e.pointerId); e.preventDefault();
      if (herramienta === 'borrador') {
        if (d.trazo !== undefined && Editor.borrarTrazo(d.trazo)) dibujar();
        arrastre = { tipo: 'borrar' };
        return;
      }
      const q = { x: limitar(pos.x, 0, 800), y: limitar(pos.y, 0, 800) };
      const trazo = { id: 'p' + Date.now() + Math.random().toString(16).slice(2), color: $('pColor').value,
        width: Number($('pGrosor').value), op: Number($('pOpacidad').value), pts: [q, { x: q.x + 0.01, y: q.y }] };
      if (!Editor.agregarTrazo(trazo)) { mensaje('Máximo de 500 trazos.'); return; }
      arrastre = { tipo: 'trazo', t: trazo };
      dibujar();
      return;
    }
    if (d.contorno !== undefined) {                       // punto del contorno de la prenda
      Editor.guardarPaso();
      Editor.elegirPuntoContorno(Number(d.contorno));
      arrastre = { tipo: 'contorno', i: Number(d.contorno) };
      svg.setPointerCapture(e.pointerId);
      dibujar();
      return;
    }
    if (!d.curva) {                                       // clic en vacío: quita la selección y, con zoom, mueve la vista
      Editor.seleccionar(null); refrescar();
      if (zoom > 1) { arrastre = { tipo: 'vista', cx: e.clientX, cy: e.clientY, vx, vy }; svg.setPointerCapture(e.pointerId); }
      return;
    }

    Editor.seleccionar(d.curva);
    syncControles();
    const c = Editor.motivo();
    Editor.guardarPaso();
    arrastre = {
      tipo: d.punto !== undefined ? 'punto' : d.escala ? 'escala' : 'mover',
      punto: Number(d.punto), inicio: pos, x: c.x, y: c.y, escala: c.scale,
    };
    svg.setPointerCapture(e.pointerId);
    dibujar();
    e.preventDefault();
  }

  function alMover(e) {
    if (!arrastre) return;
    const s = estado(), c = Editor.motivo(), p = coord(e);
    if (arrastre.tipo === 'trazo') {
      const t = arrastre.t, u = t.pts[t.pts.length - 1];
      if (t.pts.length < 1500 && Math.hypot(p.x - u.x, p.y - u.y) > 2) { t.pts.push({ x: limitar(p.x, 0, 800), y: limitar(p.y, 0, 800) }); dibujar(); }
      return;
    }
    if (arrastre.tipo === 'borrar') {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.dataset && el.dataset.trazo !== undefined && Editor.borrarTrazo(el.dataset.trazo)) dibujar();
      return;
    }
    if (arrastre.tipo === 'vista') {
      const caja = $('lienzo').getBoundingClientRect();
      vx = arrastre.vx - ((e.clientX - arrastre.cx) * (800 / zoom)) / caja.width;
      vy = arrastre.vy - ((e.clientY - arrastre.cy) * (800 / zoom)) / caja.height;
      aplicarVista();
      return;
    }
    if (arrastre.tipo === 'contorno') {
      s.contour[arrastre.i] = { x: limitar(p.x, 0, 800), y: limitar(p.y, 0, 800) };
    } else if (arrastre.tipo === 'escala') {
      // el tamaño cambia según qué tan lejos del centro está el puntero
      const inicial = Math.hypot(arrastre.inicio.x - c.x, arrastre.inicio.y - c.y) || 1;
      c.scale = limitar((arrastre.escala * Math.hypot(p.x - c.x, p.y - c.y)) / inicial, 0.15, 4);
      $('tamano').value = Math.round(c.scale * 100); textosSalida();
    } else if (arrastre.tipo === 'punto') {
      // se usa la matriz inversa para volver al sistema local del motivo
      c.points[arrastre.punto] = Matrices.aplicar(Matrices.inversa(Trazo.matrizMotivo(c, 0, 0)), p);
    } else {
      c.x = arrastre.x + p.x - arrastre.inicio.x;
      c.y = arrastre.y + p.y - arrastre.inicio.y;
    }
    dibujar();
  }

  function alSoltar() {
    if (!arrastre) return;
    if (arrastre.tipo === 'trazo') { arrastre.t.pts = Trazo.alisar(arrastre.t.pts, 1); dibujar(); }
    if (arrastre.tipo !== 'vista') mensaje('Listo. Guarda para conservar los cambios.');
    arrastre = null;
  }

  // =====================================================================
  // 4. EDITAR PUNTOS DE CONTROL MEDIANTE LA CÁMARA
  // =====================================================================
  function prepararMano() {
    if (modo !== 'disenar') irAModo('disenar');
    if (!$('editarContorno').checked) {
      $('puntos').checked = true;
      if (!Editor.motivo() && estado().curves.length) Editor.seleccionar(estado().curves.at(-1).id);
    }
    refrescar();
  }

  function puntoCercano(pos) {
    const maxDistancia = 56 / zoom;
    let mejor = null, distanciaMin = maxDistancia;
    if ($('editarContorno').checked) {
      estado().contour.forEach((q, i) => {
        const d = Math.hypot(pos.x - q.x, pos.y - q.y);
        if (d < distanciaMin) { mejor = { tipo: 'contorno', i }; distanciaMin = d; }
      });
    } else {
      for (const c of (Editor.motivo() ? [Editor.motivo()] : [])) {
        c.points.forEach((p, i) => {
          const q = Matrices.aplicar(Trazo.matrizMotivo(c, 0, 0), p);
          const d = Math.hypot(pos.x - q.x, pos.y - q.y);
          if (d < distanciaMin) { mejor = { tipo: 'punto', id: c.id, i }; distanciaMin = d; }
        });
      }
    }
    return mejor;
  }

  // La posición p de la mano se expresa entre 0 y 1 sobre el lienzo visible.
  // Una única operación de pinza equivale a un solo paso de Deshacer.
  function gestoMano(p, agarrar) {
    if (!p || !agarrar || modo !== 'disenar') {
      if (arrastreMano) mensaje('Punto colocado. Puedes deshacer con Ctrl+Z.');
      arrastreMano = null;
      return;
    }
    const pos = { x: vx + p.x * 800 / zoom, y: vy + p.y * 800 / zoom };
    if (!arrastreMano) {
      arrastreMano = puntoCercano(pos);
      if (!arrastreMano) return;
      Editor.guardarPaso();
      if (arrastreMano.tipo === 'punto') Editor.seleccionar(arrastreMano.id);
      else Editor.elegirPuntoContorno(arrastreMano.i);
      syncControles();
    }
    const q = { x: limitar(pos.x, 0, 800), y: limitar(pos.y, 0, 800) };
    if (arrastreMano.tipo === 'contorno') {
      estado().contour[arrastreMano.i] = q;
    } else {
      const c = estado().curves.find(v => v.id === arrastreMano.id);
      if (!c || !c.points[arrastreMano.i]) { arrastreMano = null; return; }
      c.points[arrastreMano.i] = Matrices.aplicar(Matrices.inversa(Trazo.matrizMotivo(c, 0, 0)), q);
    }
    dibujar();
  }

  // =====================================================================
  // 5. GALERÍA DE MOTIVOS (arrastrar o pulsar)
  // =====================================================================
  function ponerMotivo(indice, pos) {
    const op = { color: $('color').value, width: Number($('grosor').value) };
    if (!Editor.agregar(Motivos.desdePreset(indice, pos.x, pos.y, op))) { mensaje('Máximo de 200 motivos por diseño.'); return; }
    refrescar();
    mensaje(Motivos.PRESETS[indice].nombre + ' añadido. Arrástralo o usa su esquina para cambiar el tamaño.');
  }

  function construirGaleria() {
    Motivos.PRESETS.forEach((preset, indice) => {
      const tarjeta = document.createElement('button');
      tarjeta.className = 'motif-card';
      tarjeta.setAttribute('aria-label', `Añadir ${preset.nombre} — ${Motivos.NOMBRES[preset.tipo]}`);

      const puntos = preset.puntos.map(([x, y]) => ({ x, y }));
      const vista = Escena.nodo('svg', { viewBox: '-5 -5 140 125', 'aria-hidden': true });
      vista.append(Escena.nodo(preset.cerrado ? 'polygon' : 'polyline', {
        points: Trazo.muestrear(preset.tipo, puntos).map(p => p.x + ',' + p.y).join(' '),
        fill: preset.cerrado ? '#996d3d' : 'none', stroke: '#996d3d', 'stroke-width': 4,
      }));
      const titulo = document.createElement('strong'); titulo.textContent = preset.nombre;
      const tipo = document.createElement('small'); tipo.textContent = Motivos.NOMBRES[preset.tipo];
      tarjeta.append(vista, titulo, tipo);

      let gesto = null;
      tarjeta.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        gesto = { x: e.clientX, y: e.clientY, movido: false };
        tarjeta.setPointerCapture(e.pointerId); e.preventDefault();
      });
      tarjeta.addEventListener('pointermove', e => {
        if (!gesto) return;
        if (Math.hypot(e.clientX - gesto.x, e.clientY - gesto.y) > 8) gesto.movido = true;
        if (!gesto.movido) return;
        let fantasma = $('fantasma');
        if (!fantasma) { fantasma = document.createElement('div'); fantasma.id = 'fantasma'; fantasma.className = 'drag-ghost'; fantasma.textContent = preset.nombre; document.body.append(fantasma); }
        fantasma.style.left = e.clientX + 'px'; fantasma.style.top = e.clientY + 'px';
      });
      tarjeta.addEventListener('pointerup', e => {
        if (!gesto) return;
        const r = $('lienzo').getBoundingClientRect();
        const sobreLienzo = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (sobreLienzo) ponerMotivo(indice, coord(e));
        else if (!gesto.movido) ponerMotivo(indice, { x: 400, y: 400 });
        else mensaje('Suelta el motivo dentro del área de la prenda.');
        gesto = null; if ($('fantasma')) $('fantasma').remove();
      });
      tarjeta.addEventListener('pointercancel', () => { gesto = null; if ($('fantasma')) $('fantasma').remove(); });
      tarjeta.addEventListener('click', e => { if (e.detail === 0) ponerMotivo(indice, { x: 400, y: 400 }); }); // teclado
      $('galeria').append(tarjeta);
    });
  }

  function construirPrendas() {
    for (const id of Prendas.orden) {
      const b = document.createElement('button');
      b.className = 'garment'; b.dataset.prenda = id;
      const icono = Escena.nodo('svg', { viewBox: '0 0 800 800' });
      Escena.miniatura(icono, id);
      const nombre = document.createElement('span'); nombre.textContent = Prendas.lista[id].nombre;
      b.append(icono, nombre);
      b.onclick = () => {
        Editor.elegirPrenda(id); reiniciarVista(); refrescar();
        mensaje(Prendas.lista[id].nombre + ' elegida. Tus motivos se conservan.');
      };
      $('prendas').append(b);
    }
  }

  // Paleta de colores: al pulsar un color se llama a alElegir(color, nombre)
  function construirPaleta(contenedor, alElegir) {
    COLORES.forEach(([nombre, color]) => {
      const b = document.createElement('button');
      b.className = 'swatch'; b.style.backgroundColor = color; b.title = nombre; b.setAttribute('aria-label', nombre);
      b.onclick = () => alElegir(color, nombre);
      contenedor.append(b);
    });
  }

  function construirPlantillas() {
    Plantillas.lista.forEach(p => {
      const b = document.createElement('button'); b.textContent = p.nombre;
      b.onclick = () => {
        if (estado().curves.length && !confirm('La plantilla reemplaza los motivos actuales (puedes deshacer). ¿Continuar?')) return;
        Editor.aplicarPlantilla(p.id); refrescar(); mensaje('Plantilla «' + p.nombre + '» aplicada. Ctrl+Z la deshace.');
      };
      $('plantillas').append(b);
    });
  }

  // ---------- Pestañas: diseñar / pintar ----------
  function irAModo(m) {
    if (m === modo) return;
    if (m !== 'disenar' && Chanka.Manos) Chanka.Manos.detener();
    modo = m; document.body.dataset.modo = m;
    document.querySelectorAll('.tab').forEach(b => { const on = b.dataset.modo === m; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    Editor.seleccionar(null); $('editarContorno').checked = false;
    refrescar();
  }
  function elegirHerramienta(h) {
    herramienta = h;
    $('hPincel').classList.toggle('active', h === 'pincel'); $('hBorrador').classList.toggle('active', h === 'borrador');
    dibujar();
  }

  // =====================================================================
  // 5. CONTROLES (sliders, colores, casillas)
  // =====================================================================
  // Mientras arrastras un slider se guarda UN solo paso para deshacer.
  function enlazar(id, aplicar, soloMotivo = false) {
    const el = $(id); let abierto = false;
    el.addEventListener('input', () => {
      if (!abierto && (!soloMotivo || Editor.motivo())) { Editor.guardarPaso(); abierto = true; }
      aplicar(el); textosSalida(); dibujar();
    });
    el.addEventListener('change', () => { abierto = false; syncControles(); });
  }

  function conectarControles() {
    enlazar('base', el => { estado().base = el.value; });
    enlazar('color', el => { const c = Editor.motivo(); if (c) c.color = el.value; }, true);
    enlazar('espejo', el => { const c = Editor.motivo(); if (c) c.mirror = el.checked; }, true);
    enlazar('cerrado', el => { const c = Editor.motivo(); if (c) c.closed = el.checked; }, true);

    // [id del control, campo del motivo, divisor]
    for (const [id, campo, divisor] of [['grosor', 'width', 1], ['tamano', 'scale', 100], ['giro', 'rot', 1],
         ['repX', 'repeatX', 1], ['repY', 'repeatY', 1], ['sepX', 'gapX', 1], ['sepY', 'gapY', 1]]) {
      enlazar(id, el => {
        const c = Editor.motivo(); if (!c) return;
        let v = limitar(Number(el.value) || Number(el.min), Number(el.min), Number(el.max));
        if (campo.startsWith('repeat')) v = Math.round(v);
        c[campo] = v / divisor;
      }, true);
    }

    $('vista').onchange = () => { Editor.guardarPaso(); estado().vista = $('vista').value; dibujar(); };
    $('nombre').onchange = () => { Editor.guardarPaso(); estado().name = $('nombre').value.trim() || 'Sin título'; syncControles(); };
    $('tipo').onchange = () => {
      if (Editor.motivo()) { Editor.cambiarTipo($('tipo').value); mensaje('Tipo cambiado; se restablecieron los puntos de este motivo.'); }
      refrescar();
    };
    $('puntos').onchange = dibujar;
    $('cuadricula').onchange = dibujar;
    for (const id of ['pGrosor', 'pOpacidad']) $(id).addEventListener('input', textosSalida);
    $('editarContorno').onchange = () => {
      Editor.seleccionar(null); refrescar();
      mensaje($('editarContorno').checked ? 'Arrastra los puntos turquesa para cambiar la forma de la prenda.' : 'Contorno confirmado.');
    };
    $('masPunto').onclick = () => { if (Editor.agregarPuntoContorno()) mensaje('Punto agregado. Arrástralo a su lugar.'); dibujar(); };
    $('menosPunto').onclick = () => { mensaje(Editor.quitarPuntoContorno() ? 'Punto quitado.' : 'Elige un punto (mínimo 3 en total).'); dibujar(); };
    $('restaurar').onclick = () => { Editor.restaurarContorno(); refrescar(); mensaje('Contorno original restaurado.'); };
  }

  // =====================================================================
  // 6. BARRA SUPERIOR Y HERRAMIENTAS
  // =====================================================================
  function puedoSalir() { return !Editor.sucio() || confirm('Hay cambios sin guardar. ¿Quieres continuar y descartarlos?'); }

  function dibujarGuardados() {
    $('guardados').replaceChildren();
    if (!guardados.length) {
      const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Aún no hay diseños guardados.';
      $('guardados').append(p);
    }
    guardados.forEach(s => {
      const fila = document.createElement('div'); fila.className = 'entry';
      const abrir = document.createElement('button'); abrir.textContent = s.name;
      abrir.onclick = () => { if (!puedoSalir()) return; Editor.reemplazar(s); reiniciarVista(); refrescar(); mensaje('Diseño abierto: ' + s.name); };
      const borrar = document.createElement('button'); borrar.textContent = '×'; borrar.setAttribute('aria-label', 'Eliminar diseño ' + s.name);
      borrar.onclick = () => {
        if (!confirm('¿Eliminar el guardado «' + s.name + '»?')) return;
        const antes = guardados;
        guardados = guardados.filter(v => v.id !== s.id);
        if (!Archivo.escribirGuardados(guardados)) { guardados = antes; mensaje('No se pudo borrar.'); }
        dibujarGuardados();
      };
      fila.append(abrir, borrar); $('guardados').append(fila);
    });
  }

  // Antes de exportar o imprimir: sin contorno de edición, sin 360 y con la prenda completa
  function prepararSalida() {
    irAModo('disenar'); $('editarContorno').checked = false; Editor.seleccionar(null);
    reiniciarVista(); dibujar();
  }

  function conectarBarra() {
    $('nuevo').onclick = () => { if (!puedoSalir()) return; Editor.nuevo(); reiniciarVista(); refrescar(); mensaje('Nuevo diseño. Tus propuestas guardadas siguen disponibles.'); };

    $('guardar').onclick = () => {
      const s = estado(); s.name = $('nombre').value.trim() || 'Sin título';
      const antes = guardados.slice();
      const i = guardados.findIndex(g => g.id === s.id);
      const copia = JSON.parse(JSON.stringify(s));
      if (i < 0) guardados.push(copia); else guardados[i] = copia;
      if (Archivo.escribirGuardados(guardados)) { Editor.marcarLimpio(); dibujarGuardados(); mensaje('Guardado: ' + s.name + '. Descarga el editable como respaldo.'); }
      else { guardados = antes; mensaje('No se pudo guardar en el navegador. Descarga el archivo editable.'); }
    };

    $('descargar').onclick = () => {
      const s = estado(); s.name = $('nombre').value.trim() || 'Sin título';
      Archivo.descargar(JSON.stringify(s, null, 2), 'application/json', Archivo.nombreSeguro(s.name) + '.json');
      Editor.marcarLimpio(); mensaje('Editable descargado. Puedes abrirlo con «Abrir archivo».');
    };

    $('abrir').onclick = () => $('archivo').click();
    $('archivo').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        if (f.size > 12000000) throw new Error('Archivo demasiado grande.');
        const s = Archivo.migrar(JSON.parse(await f.text()));
        if (!Archivo.validar(s)) throw new Error('Formato editable inválido o datos fuera del rango permitido.');
        if (!puedoSalir()) return;
        Editor.reemplazar(s); reiniciarVista(); refrescar(); mensaje('Archivo editable abierto.');
      } catch (err) { mensaje('No se pudo abrir: ' + err.message); }
      finally { e.target.value = ''; }
    };

    $('exportar').onclick = () => {
      prepararSalida();
      Archivo.descargar(Archivo.svgComoTexto($('lienzo')), 'image/svg+xml', Archivo.nombreSeguro(estado().name) + '.svg');
      mensaje('SVG exportado sin puntos de control.');
    };
    $('exportarPng').onclick = () => {
      prepararSalida();
      Archivo.exportarPng($('lienzo'), Archivo.nombreSeguro(estado().name) + '.png', () => mensaje('PNG exportado sin puntos de control.'));
    };
    $('imprimir').onclick = () => { prepararSalida(); window.print(); };

    $('deshacer').onclick = () => { Editor.deshacer(); refrescar(); };
    $('rehacer').onclick = () => { Editor.rehacer(); refrescar(); };
    $('agregar').onclick = () => {
      Editor.agregar(Motivos.nuevo($('tipo').value, { color: $('color').value, width: Number($('grosor').value) }));
      refrescar(); mensaje('Arrastra los puntos para diseñar tu curva (activa «Editar puntos»).');
    };
    $('duplicar').onclick = () => { Editor.duplicar(); refrescar(); };
    $('eliminar').onclick = () => { Editor.eliminar(); refrescar(); };
    $('alFrente').onclick = () => { Editor.moverCapa(1); refrescar(); };
    $('atras').onclick = () => { Editor.moverCapa(-1); refrescar(); };
    $('limpiarPintura').onclick = () => { Editor.limpiarPintura(); refrescar(); mensaje('Pintura borrada. Ctrl+Z la recupera.'); };

    $('zoomMas').onclick = () => cambiarZoom(zoom * 1.25);
    $('zoomMenos').onclick = () => cambiarZoom(zoom / 1.25);
    $('zoomEncajar').onclick = reiniciarVista;

    $('ayuda').onclick = () => $('dialogoAyuda').showModal();
    $('cerrarAyuda').onclick = () => $('dialogoAyuda').close();

    // Foto para calcar
    $('foto').onclick = () => $('fotoArchivo').click();
    $('fotoArchivo').onchange = e => {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type) || f.size > 6000000) { mensaje('Usa una imagen PNG, JPEG o WebP de hasta 6 MB.'); return; }
      reducirFoto(f, url => {
        Editor.ponerReferencia(url); $('editarContorno').checked = true; Editor.seleccionar(null); refrescar();
        mensaje('Foto cargada. Mueve los puntos turquesa sobre su contorno; al terminar, desactiva «Editar contorno».');
      });
    };
    $('quitarFoto').onclick = () => { Editor.ponerReferencia(null); refrescar(); };
  }

  // Reduce la foto a 1000 px para que el archivo editable no pese demasiado
  function reducirFoto(archivo, listo) {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const f = Math.min(1, 1000 / Math.max(img.width, img.height));
        const hoja = document.createElement('canvas');
        hoja.width = Math.round(img.width * f); hoja.height = Math.round(img.height * f);
        hoja.getContext('2d').drawImage(img, 0, 0, hoja.width, hoja.height);
        listo(hoja.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => mensaje('No se pudo leer la foto.');
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  }

  // =====================================================================
  // 7. INICIO
  // =====================================================================
  function iniciar() {
    construirPrendas(); construirGaleria(); construirPlantillas();
    construirPaleta($('paleta'), (color, nombre) => {
      $('color').value = color;
      const c = Editor.motivo();
      if (c) { Editor.guardarPaso(); c.color = color; }
      refrescar(); mensaje('Color: ' + nombre);
    });
    construirPaleta($('paletaPintura'), (color, nombre) => { $('pColor').value = color; elegirHerramienta('pincel'); mensaje('Pincel: ' + nombre); });
    document.querySelectorAll('.tab').forEach(b => { b.onclick = () => irAModo(b.dataset.modo); });
    $('hPincel').onclick = () => elegirHerramienta('pincel');
    $('hBorrador').onclick = () => elegirHerramienta('borrador');
    conectarControles(); conectarBarra();

    const svg = $('lienzo');
    svg.addEventListener('pointerdown', alPulsar);
    svg.addEventListener('pointermove', alMover);
    svg.addEventListener('pointerup', alSoltar);
    svg.addEventListener('pointercancel', alSoltar);
    svg.addEventListener('wheel', e => { e.preventDefault(); cambiarZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), coord(e)); }, { passive: false });

    window.addEventListener('beforeunload', e => { if (Editor.sucio()) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', e => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const tecla = e.key.toLowerCase();
      if (modo === 'disenar' && Editor.motivo()) {
        const paso = e.shiftKey ? 10 : 2;
        const mov = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[e.key];
        if (mov) { e.preventDefault(); Editor.desplazar(mov[0], mov[1]); dibujar(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); $('eliminar').click(); return; }
        if ((e.ctrlKey || e.metaKey) && tecla === 'd') { e.preventDefault(); $('duplicar').click(); return; }
      }
      if ((e.ctrlKey || e.metaKey) && tecla === 'z') { e.preventDefault(); e.shiftKey ? $('rehacer').click() : $('deshacer').click(); }
      if ((e.ctrlKey || e.metaKey) && tecla === 'y') { e.preventDefault(); $('rehacer').click(); }
    });

    guardados = Archivo.leerGuardados();
    dibujarGuardados();
    refrescar();
    Chanka.Manos.iniciar();
  }

  Chanka.Panel = { iniciar, prepararMano, gestoMano };
})(typeof window !== 'undefined' ? window : globalThis);
