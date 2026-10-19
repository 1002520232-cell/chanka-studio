// TRAZO — convierte curvas y motivos en listas de puntos listas para dibujar
// Depende de: curvas/*.js y geometria/matrices.js
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});
  const { Bezier, Hermite, Bspline, Matrices } = Chanka;
  const EJE_X = 400; // centro del lienzo (800x800): aquí se refleja el espejo

  // Calcula 'pasos+1' puntos de una curva ('bezier', 'hermite' o 'bspline')
  function muestrear(tipo, puntos, pasos = 100) {
    const f = { bezier: Bezier.punto, hermite: Hermite.punto, bspline: Bspline.punto }[tipo];
    if (!f) throw new Error('Curva desconocida: ' + tipo);
    const lista = [];
    for (let i = 0; i <= pasos; i++) lista.push(f(puntos, i / pasos));
    return lista;
  }

  // Une puntos formando un contorno cerrado y suave (Bézier entre cada par).
  // tension 0 = líneas rectas, 1 = muy redondeado.
  function suavizar(puntos, tension = 1, pasos = 8) {
    const n = puntos.length, k = tension / 6, salida = [];
    for (let i = 0; i < n; i++) {
      const a = puntos[(i + n - 1) % n], b = puntos[i], c = puntos[(i + 1) % n], d = puntos[(i + 2) % n];
      const tramo = [
        b,
        { x: b.x + (c.x - a.x) * k, y: b.y + (c.y - a.y) * k },
        { x: c.x - (d.x - b.x) * k, y: c.y - (d.y - b.y) * k },
        c,
      ];
      salida.push(...muestrear('bezier', tramo, pasos).slice(0, -1));
    }
    return salida;
  }

  // Suaviza un trazo a mano alzada cortando esquinas (Chaikin)
  function alisar(pts, vueltas = 1) {
    for (let v = 0; v < vueltas && pts.length > 2; v++) {
      const s = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        s.push({ x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y }, { x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y });
      }
      s.push(pts[pts.length - 1]); pts = s;
    }
    return pts;
  }

  // ¿El punto (x,y) está dentro del polígono? (cruce de rayos)
  function dentro(x, y, poligono) {
    let adentro = false;
    for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
      const a = poligono[i], b = poligono[j];
      if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) adentro = !adentro;
    }
    return adentro;
  }

  // Rectángulo que contiene a todos los puntos
  function caja(pts) {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }

  // Matriz de un motivo: mover al centro, girar y escalar alrededor de su pivote (cx, cy)
  function matrizMotivo(c, i = 0, j = 0) {
    const { trasladar, rotar, escalar, multiplicar } = Matrices;
    let M = trasladar(c.x + i * c.gapX, c.y + j * c.gapY);
    M = multiplicar(M, rotar(c.rot || 0));
    M = multiplicar(M, escalar(c.scale));
    return multiplicar(M, trasladar(-c.cx, -c.cy));
  }

  // Puntos de la primera copia del motivo, ya en coordenadas del lienzo
  function curvaMotivo(c) {
    return Matrices.aplicarLista(matrizMotivo(c, 0, 0), muestrear(c.type, c.points));
  }

  // Todas las copias del motivo (repeticiones + espejo)
  function copiasMotivo(c) {
    const base = muestrear(c.type, c.points);
    const espejo = Matrices.multiplicar(Matrices.trasladar(2 * EJE_X, 0), Matrices.escalar(-1, 1));
    const copias = [];
    for (let j = 0; j < c.repeatY; j++) {
      for (let i = 0; i < c.repeatX; i++) {
        const M = matrizMotivo(c, i, j);
        copias.push(Matrices.aplicarLista(M, base));
        if (c.mirror) copias.push(Matrices.aplicarLista(Matrices.multiplicar(espejo, M), base));
      }
    }
    return copias;
  }

  Chanka.Trazo = { EJE_X, muestrear, suavizar, alisar, dentro, caja, matrizMotivo, curvaMotivo, copiasMotivo };
})(typeof window !== 'undefined' ? window : globalThis);
