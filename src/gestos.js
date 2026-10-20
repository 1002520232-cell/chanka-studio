// GESTOS — cálculos de mano independientes de la cámara, para poder probarlos.
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function pinza(puntos, agarrando = false) {
    if (!puntos || !puntos[4] || !puntos[8]) return false;
    // Histéresis: un umbral para agarrar y otro para soltar, sin parpadeos.
    return distancia(puntos[4], puntos[8]) < (agarrando ? 0.105 : 0.065);
  }
  function indice(puntos) {
    if (!puntos || !puntos[8]) return null;
    return { x: Math.max(0, Math.min(1, 1 - puntos[8].x)), y: Math.max(0, Math.min(1, puntos[8].y)) };
  }
  Chanka.Gestos = { distancia, pinza, indice };
})(typeof window !== 'undefined' ? window : globalThis);
