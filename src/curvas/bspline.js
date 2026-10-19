// B-SPLINE CÚBICA — algoritmo de De Boor
// Con 6 puntos de control y nudos "abiertos" la curva empieza en el primer
// punto y termina en el último; los del medio solo la "jalan".
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});

  // Vector de nudos abierto uniforme. Ejemplo con 6 puntos: [0,0,0,0, 1/3, 2/3, 1,1,1,1]
  function nudos(n, grado) {
    const u = [];
    for (let i = 0; i < n + grado + 1; i++) {
      if (i <= grado) u.push(0);
      else if (i >= n) u.push(1);
      else u.push((i - grado) / (n - grado));
    }
    return u;
  }

  function punto(p, t) {
    const n = p.length - 1;
    const grado = Math.min(3, n);
    const u = nudos(p.length, grado);

    // 1) buscar en qué tramo de nudos está t
    let k = grado;
    if (t >= 1) k = n;
    else while (k < n && t >= u[k + 1]) k++;

    // 2) copiar los puntos que influyen y mezclarlos nivel por nivel
    const d = [];
    for (let j = 0; j <= grado; j++) d.push({ ...p[k - grado + j] });
    for (let r = 1; r <= grado; r++) {
      for (let j = grado; j >= r; j--) {
        const i = k - grado + j;
        const den = u[i + grado - r + 1] - u[i];
        const a = den ? (t - u[i]) / den : 0;
        d[j] = {
          x: (1 - a) * d[j - 1].x + a * d[j].x,
          y: (1 - a) * d[j - 1].y + a * d[j].y,
        };
      }
    }
    return d[grado];
  }

  Chanka.Bspline = { punto, nudos };
})(typeof window !== 'undefined' ? window : globalThis);
