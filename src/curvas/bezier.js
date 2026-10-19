// CURVA DE BÉZIER — algoritmo de De Casteljau
// p = lista de puntos de control [{x,y}, ...]   t = número entre 0 y 1
// Idea: en cada nivel se mezclan los puntos vecinos hasta que queda uno solo.
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});

  function punto(p, t) {
    let q = p.map(v => ({ x: v.x, y: v.y }));
    for (let nivel = q.length - 1; nivel > 0; nivel--) {
      for (let i = 0; i < nivel; i++) {
        q[i] = {
          x: (1 - t) * q[i].x + t * q[i + 1].x,
          y: (1 - t) * q[i].y + t * q[i + 1].y,
        };
      }
    }
    return q[0];
  }

  Chanka.Bezier = { punto };
})(typeof window !== 'undefined' ? window : globalThis);
