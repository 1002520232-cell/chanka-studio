// TRANSFORMACIONES 2D CON MATRICES
// Una matriz es una lista [a, b, c, d, e, f] que significa:
//     x' = a·x + c·y + e
//     y' = b·x + d·y + f
// (equivale a la matriz 3x3 [[a c e],[b d f],[0 0 1]])
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});

  const identidad = () => [1, 0, 0, 1, 0, 0];
  const trasladar = (x, y) => [1, 0, 0, 1, x, y];
  const escalar = (sx, sy = sx) => [sx, 0, 0, sy, 0, 0];

  function rotar(grados) {
    const r = (grados * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    return [c, s, -s, c, 0, 0];
  }

  // A·B : primero se aplica B y después A
  function multiplicar(A, B) {
    return [
      A[0] * B[0] + A[2] * B[1],
      A[1] * B[0] + A[3] * B[1],
      A[0] * B[2] + A[2] * B[3],
      A[1] * B[2] + A[3] * B[3],
      A[0] * B[4] + A[2] * B[5] + A[4],
      A[1] * B[4] + A[3] * B[5] + A[5],
    ];
  }

  function aplicar(M, p) {
    return { x: M[0] * p.x + M[2] * p.y + M[4], y: M[1] * p.x + M[3] * p.y + M[5] };
  }

  const aplicarLista = (M, lista) => lista.map(p => aplicar(M, p));

  // Matriz inversa: sirve para pasar de la pantalla al sistema del motivo
  function inversa(M) {
    const det = M[0] * M[3] - M[1] * M[2];
    const a = M[3] / det, b = -M[1] / det, c = -M[2] / det, d = M[0] / det;
    return [a, b, c, d, -(a * M[4] + c * M[5]), -(b * M[4] + d * M[5])];
  }

  Chanka.Matrices = { identidad, trasladar, escalar, rotar, multiplicar, aplicar, aplicarLista, inversa };
})(typeof window !== 'undefined' ? window : globalThis);
