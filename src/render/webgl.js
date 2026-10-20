// VISTA 360° — maqueta con volumen aproximado usando WebGL
// Toma el contorno de la prenda, lo convierte en triángulos y lo deja girar.
// No es una simulación de tela: es una ayuda para imaginar la prenda de lado y de espalda.
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});

  // ---------- 1. Triangulación por recorte de orejas ----------
  // Funciona también con contornos cóncavos (como las mangas).
  const cruz = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

  function triangular(P) {
    let area = 0;
    P.forEach((p, i) => { const q = P[(i + 1) % P.length]; area += p.x * q.y - p.y * q.x; });
    const orden = P.map((_, i) => i);
    if (area < 0) orden.reverse();

    const triangulos = [];
    let seguridad = 0;
    while (orden.length > 3 && seguridad++ < P.length * P.length) {
      let recortada = false;
      for (let i = 0; i < orden.length; i++) {
        const a = orden[(i + orden.length - 1) % orden.length], b = orden[i], c = orden[(i + 1) % orden.length];
        if (cruz(P[a], P[b], P[c]) <= 0.0001) continue; // esquina hacia adentro: no es "oreja"
        const hayOtroPunto = orden.some(j => j !== a && j !== b && j !== c &&
          cruz(P[a], P[b], P[j]) >= 0 && cruz(P[b], P[c], P[j]) >= 0 && cruz(P[c], P[a], P[j]) >= 0);
        if (hayOtroPunto) continue;
        triangulos.push(a, b, c);
        orden.splice(i, 1);
        recortada = true;
        break;
      }
      if (!recortada) throw new Error('El contorno se cruza consigo mismo. Ajusta sus puntos para usar la vista 360°.');
    }
    if (orden.length === 3) triangulos.push(...orden);
    return triangulos;
  }

  // ---------- 2. Programas de la tarjeta gráfica (shaders) ----------
  const SHADER_VERTICES = `
    attribute vec3 p; attribute vec2 uv;
    uniform vec2 angulo; uniform float zoom; uniform float aspecto;
    varying vec2 v; varying float luz;
    void main() {
      float cy = cos(angulo.x), sy = sin(angulo.x), cx = cos(angulo.y), sx = sin(angulo.y);
      vec3 q = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);   // girar a los lados
      q = vec3(q.x, cx * q.y - sx * q.z, sx * q.y + cx * q.z);          // inclinar arriba/abajo
      float z = 3.3 - q.z;
      gl_Position = vec4(q.x * zoom / aspecto, q.y * zoom, z * 0.8 - 0.5, z);
      v = uv;
      luz = 0.62 + 0.38 * abs(cy * cx);
    }`;
  const SHADER_COLOR = `
    precision mediump float;
    uniform sampler2D tex; uniform bool lateral; uniform vec3 tela;
    varying vec2 v; varying float luz;
    void main() {
      vec4 c = lateral ? vec4(tela, 1.0) : texture2D(tex, v);
      if (c.a < 0.08) discard;
      gl_FragColor = vec4(c.rgb * luz, 1.0);
    }`;

  function compilar(gl, tipo, fuente) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('No se pudo preparar la vista 360°.');
    return s;
  }

  // ---------- 3. Iniciar el visor ----------
  // puntos: contorno de la prenda; urlFrente / urlEspalda: imágenes (SVG) que se pegan como textura
  function iniciar(canvas, puntos, urlFrente, urlEspalda) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
    if (!gl) throw new Error('Este navegador no dispone de WebGL para la vista 360°.');

    const programa = gl.createProgram();
    gl.attachShader(programa, compilar(gl, gl.VERTEX_SHADER, SHADER_VERTICES));
    gl.attachShader(programa, compilar(gl, gl.FRAGMENT_SHADER, SHADER_COLOR));
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error('No se pudo enlazar el visor.');
    gl.useProgram(programa);

    // Vértice = [x, y, z, u, v]. La parte de atrás se curva un poco hacia el otro lado.
    const vertice = (i, atras = false) => {
      const p = puntos[i], x = (p.x - 400) / 300, y = (400 - p.y) / 300;
      const z = 0.17 * (1 - Math.min(1, (x * x) / 2)) + (atras ? -0.18 : 0.1);
      return [x, y, z, atras ? 1 - p.x / 800 : p.x / 800, p.y / 800];
    };

    const tri = triangular(puntos), frente = [], espalda = [], lados = [];
    for (const i of tri) frente.push(...vertice(i));
    for (let i = 0; i < tri.length; i += 3) for (const j of [tri[i + 2], tri[i + 1], tri[i]]) espalda.push(...vertice(j, true));
    for (let i = 0; i < puntos.length; i++) {
      const j = (i + 1) % puntos.length;
      const a = vertice(i), b = vertice(j), c = vertice(i, true), d = vertice(j, true);
      lados.push(...a, ...b, ...c, ...b, ...d, ...c);
    }

    const buffer = gl.createBuffer(), texturas = [];
    let cargadas = 0, detenido = false, giro = 0, inclinacion = 0, zoom = 2.5;

    function textura(url) {
      const tex = gl.createTexture();
      texturas.push(tex);
      const img = new Image();
      img.onload = () => {
        if (detenido) return;
        // se pasa por un canvas 2D: es la forma más segura de usar un SVG como textura
        const hoja = document.createElement('canvas');
        hoja.width = hoja.height = 1024;
        hoja.getContext('2d').drawImage(img, 0, 0, 1024, 1024);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hoja);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        cargadas++;
        dibujar();
      };
      img.src = url;
      return tex;
    }
    const texFrente = textura(urlFrente), texEspalda = textura(urlEspalda);
    const uniforme = nombre => gl.getUniformLocation(programa, nombre);

    function dibujar() {
      if (detenido || cargadas < 2) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.92, 0.95, 0.94, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.uniform2f(uniforme('angulo'), giro, inclinacion);
      gl.uniform1f(uniforme('zoom'), zoom);
      gl.uniform1f(uniforme('aspecto'), canvas.width / canvas.height);
      gl.uniform3f(uniforme('tela'), 0.42, 0.3, 0.21);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      for (const [nombre, cantidad, desplazamiento] of [['p', 3, 0], ['uv', 2, 12]]) {
        const lugar = gl.getAttribLocation(programa, nombre);
        gl.enableVertexAttribArray(lugar);
        gl.vertexAttribPointer(lugar, cantidad, gl.FLOAT, false, 20, desplazamiento);
      }
      for (const [datos, tex, esLateral] of [[espalda, texEspalda, false], [frente, texFrente, false], [lados, texFrente, true]]) {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(datos), gl.STATIC_DRAW);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(uniforme('lateral'), esLateral ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, datos.length / 5);
      }
    }

    // Arrastrar con el puntero para girar; rueda para acercar
    let ultimo = null;
    canvas.onpointerdown = e => { ultimo = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); };
    canvas.onpointermove = e => {
      if (!ultimo) return;
      giro += (e.clientX - ultimo.x) * 0.012;
      inclinacion = Math.max(-0.8, Math.min(0.8, inclinacion + (e.clientY - ultimo.y) * 0.008));
      ultimo = { x: e.clientX, y: e.clientY };
      dibujar();
    };
    canvas.onpointerup = canvas.onpointercancel = () => { ultimo = null; };
    canvas.onwheel = e => {
      e.preventDefault();
      zoom = Math.max(1.3, Math.min(4, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
      dibujar();
    };

    return {
      fijarAngulo(a) { giro = a; inclinacion = 0; dibujar(); },
      detener() {
        detenido = true;
        texturas.forEach(t => gl.deleteTexture(t));
        gl.deleteBuffer(buffer);
        gl.deleteProgram(programa);
        canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = canvas.onwheel = null;
      },
    };
  }

  Chanka.Vista360 = { triangular, iniciar };
})(typeof window !== 'undefined' ? window : globalThis);
