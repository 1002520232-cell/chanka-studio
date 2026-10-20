// CURVA DE HERMITE
// p = [inicio, fin, manejadorInicio, manejadorFin]
// Los manejadores marcan hacia dónde sale y llega la curva (las tangentes).
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});

  function punto(p, t) {
    const t2 = t * t, t3 = t2 * t;
    // Las 4 funciones base de Hermite
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h01 = -2 * t3 + 3 * t2;
    const h10 = t3 - 2 * t2 + t;
    const h11 = t3 - t2;

    const inicio = p[0], fin = p[1];
    const tan0 = { x: p[2].x - inicio.x, y: p[2].y - inicio.y };
    const tan1 = { x: p[3].x - fin.x, y: p[3].y - fin.y };

    return {
      x: h00 * inicio.x + h01 * fin.x + h10 * tan0.x + h11 * tan1.x,
      y: h00 * inicio.y + h01 * fin.y + h10 * tan0.y + h11 * tan1.y,
    };
  }

  Chanka.Hermite = { punto };
})(typeof window !== 'undefined' ? window : globalThis);
