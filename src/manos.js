// MANOS — abrir webcam y detectar gestos con MediaPipe Hands.
// Las imágenes se procesan en el navegador y no se suben a nuestro servidor.
(function (G) {
  'use strict';
  const Chanka = (G.Chanka = G.Chanka || {});
  const $ = id => document.getElementById(id);
  const VERSION = '0.4.1675469240';
  const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${VERSION}/`;
  let activo = false, iniciando = false, flujo = null, modelo = null;
  let sosteniendo = false, generacion = 0, descarga = null;

  function mensaje(texto) { $('mensajeCamara').textContent = texto; }
  function tienePuntos() {
    return $('editarContorno').checked || Chanka.Editor.estado().curves.length > 0;
  }
  function cursor(p) {
    const el = $('cursorMano'), svg = $('lienzo'), wrap = $('canvasWrap');
    if (!p) { el.hidden = true; return; }
    const vb = svg.viewBox.baseVal, q = svg.createSVGPoint();
    q.x = vb.x + p.x * vb.width; q.y = vb.y + p.y * vb.height;
    const matrix = svg.getScreenCTM();
    if (!matrix) { el.hidden = true; return; }
    const pixel = q.matrixTransform(matrix), caja = wrap.getBoundingClientRect();
    el.style.left = (pixel.x - caja.left) + 'px';
    el.style.top = (pixel.y - caja.top) + 'px';
    el.classList.toggle('agarrando', sosteniendo);
    el.hidden = false;
  }
  function procesar(res) {
    if (!activo) return;
    const puntos = res.multiHandLandmarks && res.multiHandLandmarks[0];
    if (!puntos) {
      sosteniendo = false;
      Chanka.Panel.gestoMano(null, false);
      cursor(null);
      mensaje('Cámara encendida. Coloca una mano frente a ella.');
      return;
    }
    const p = Chanka.Gestos.indice(puntos);
    sosteniendo = Chanka.Gestos.pinza(puntos, sosteniendo);
    cursor(p);
    Chanka.Panel.gestoMano(p, sosteniendo);
    mensaje(!tienePuntos()
      ? '✓ Mano detectada. Pulsa «+ Añadir curva» o activa «Editar contorno» para mover puntos.'
      : sosteniendo ? '✊ Pinza activa: moviendo punto.' : '☝ Apunta a un punto y junta pulgar e índice.');
  }
  function cargarScript() {
    if (G.Hands) return Promise.resolve();
    if (descarga) return descarga;
    descarga = new Promise((resolver, rechazar) => {
      const script = document.createElement('script');
      let terminado = false;
      const timeout = G.setTimeout(() => terminar(new Error('La descarga del detector tardó demasiado. Comprueba internet o bloqueadores de contenido.')), 15000);
      function terminar(error) {
        if (terminado) return;
        terminado = true;
        G.clearTimeout(timeout);
        if (error) { script.remove(); rechazar(error); }
        else resolver();
      }
      script.src = CDN + 'hands.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => terminar(G.Hands ? null : new Error('Se descargó MediaPipe, pero no se pudo iniciar.'));
      script.onerror = () => terminar(new Error('No se pudo descargar MediaPipe. Comprueba internet y que cdn.jsdelivr.net no esté bloqueado.'));
      document.head.appendChild(script);
    }).catch(e => { descarga = null; throw e; });
    return descarga;
  }
  function detalleError(e) {
    const nombre = e && e.name;
    if (nombre === 'NotAllowedError' || nombre === 'PermissionDeniedError' || nombre === 'SecurityError')
      return 'Permiso de cámara denegado. Pulsa el candado junto a la dirección, permite Cámara y recarga la página.';
    if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError')
      return 'No se detectó ninguna webcam. Comprueba que esté conectada y habilitada en Windows.';
    if (nombre === 'NotReadableError' || nombre === 'TrackStartError')
      return 'Windows no pudo abrir la cámara. Cierra Zoom, Teams u otra aplicación que la use e inténtalo otra vez.';
    if (nombre === 'OverconstrainedError')
      return 'La cámara no admite la configuración solicitada.';
    if (nombre === 'AbortError') return 'El sistema interrumpió el inicio de la cámara. Inténtalo nuevamente.';
    return (e && e.message) || 'No se pudo activar la cámara. Abre la consola con F12 para obtener más detalles.';
  }
  function detener() {
    activo = false;
    iniciando = false;
    generacion++;
    sosteniendo = false;
    Chanka.Panel.gestoMano(null, false);
    cursor(null);
    if (flujo) { flujo.getTracks().forEach(t => t.stop()); flujo = null; }
    const video = $('videoMano');
    video.pause();
    video.srcObject = null;
    if (modelo) {
      const anterior = modelo;
      modelo = null;
      try { Promise.resolve(anterior.close()).catch(() => {}); } catch (_) { /* cámara apagada */ }
    }
    $('botonCamara').disabled = false;
    $('botonCamara').textContent = '📷 Activar cámara y mano';
    $('botonCamara').classList.remove('active');
    $('panelCamara').hidden = true;
  }
  async function activar() {
    if (activo || iniciando) { detener(); return; }
    $('panelCamara').hidden = false;
    if (!G.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mensaje('Abre index.html con Live Server (http://127.0.0.1:5500 o localhost), no como archivo ni por HTTP remoto.');
      return;
    }
    const token = ++generacion;
    iniciando = true;
    $('botonCamara').textContent = '✕ Cancelar apertura de cámara';
    mensaje('Solicitando permiso de cámara… Cuando el navegador lo pregunte, pulsa Permitir.');
    try {
      // Pedir el permiso PRIMERO: el usuario ve la solicitud de inmediato, sin depender del CDN.
      const nuevoFlujo = await navigator.mediaDevices.getUserMedia({
        audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (token !== generacion) { nuevoFlujo.getTracks().forEach(t => t.stop()); return; }
      flujo = nuevoFlujo;
      const video = $('videoMano');
      video.srcObject = flujo;
      await video.play();
      if (token !== generacion) return;
      mensaje('✓ Cámara encendida. Cargando detector de manos desde internet…');
      await cargarScript();
      if (token !== generacion) return;
      const nuevoModelo = new G.Hands({ locateFile: archivo => CDN + archivo });
      modelo = nuevoModelo;
      modelo.setOptions({ maxNumHands: 1, modelComplexity: 0,
        minDetectionConfidence: 0.55, minTrackingConfidence: 0.5 });
      modelo.onResults(procesar);
      activo = true;
      iniciando = false;
      $('botonCamara').textContent = '⏹ Apagar cámara';
      $('botonCamara').classList.add('active');
      mensaje(tienePuntos()
        ? '✓ Cámara activada. Acerca tu mano y apunta a un punto.'
        : '✓ Cámara activada. Pulsa «+ Añadir curva» o activa «Editar contorno» para mover puntos.');
      async function procesarFrame() {
        if (!activo || token !== generacion) return;
        try {
          if (video.readyState >= 2) await nuevoModelo.send({ image: video });
        } catch (e) {
          if (activo && token === generacion) {
            console.error('MediaPipe Hands:', e);
            detener();
            $('panelCamara').hidden = false;
            mensaje('Error al detectar la mano: ' + detalleError(e));
          }
          return;
        }
        if (activo && token === generacion) G.requestAnimationFrame(procesarFrame);
      }
      G.requestAnimationFrame(procesarFrame);
    } catch (e) {
      if (token !== generacion) return;
      console.error('Inicio de cámara/mano:', e);
      const descripcion = detalleError(e);
      detener();
      $('panelCamara').hidden = false;
      mensaje('No se pudo iniciar: ' + descripcion);
    } finally {
      if (token === generacion) iniciando = false;
    }
  }
  function iniciar() {
    $('botonCamara').onclick = () => {
      if (activo || iniciando) return detener();
      // No bloquear la cámara porque todavía no haya una curva en el diseño.
      Chanka.Panel.prepararMano();
      return activar();
    };
    G.addEventListener('pagehide', detener);
    document.addEventListener('visibilitychange', () => { if (document.hidden && (activo || iniciando)) detener(); });
  }
  Chanka.Manos = { iniciar, activar, detener };
})(typeof window !== 'undefined' ? window : globalThis);
