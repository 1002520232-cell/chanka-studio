// PLANTILLAS — diseños de partida: un clic arma una composición lista para editar
// Cada plantilla es solo datos + una función que devuelve motivos (usa los de motivos.js).
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});
  const { Motivos } = Chanka;
  const indice = nombre => Motivos.PRESETS.findIndex(p => p.nombre === nombre);

  // Fila de n copias de un motivo, centrada en el lienzo (x = 400)
  function fila(nombre, y, n, sep, op = {}) {
    const c = Motivos.desdePreset(indice(nombre), 400 - ((n - 1) * sep) / 2, y, { color: op.color });
    c.repeatX = n; c.gapX = sep; c.scale = op.escala || 1;
    return c;
  }
  function simetrico(nombre, x, y, color) {
    const c = Motivos.desdePreset(indice(nombre), x, y, { color });
    c.mirror = true;
    return c;
  }

  const lista = [
    { id: 'blanco', nombre: 'En blanco', crear: () => [] },
    { id: 'franjas', nombre: 'Franjas andinas', base: '#e6d7b9', crear: () => [
      fila('Franja', 250, 4, 150, { color: '#8d3439', escala: 1.1 }),
      fila('Picos', 420, 5, 120, { color: '#3c5663' }),
      fila('Franja', 590, 4, 150, { color: '#8d3439', escala: 1.1 })] },
    { id: 'borde', nombre: 'Borde de picos', base: '#373733', crear: () => [
      fila('Onda', 560, 5, 140, { color: '#bb9148' }),
      fila('Picos', 640, 6, 115, { color: '#f3ce7e', escala: 0.9 })] },
    { id: 'gotas', nombre: 'Campo de gotas', base: '#6c7458', crear: () => {
      const g = fila('Gota', 300, 4, 130, { color: '#e6d7b9' });
      g.repeatY = 3; g.gapY = 130;
      return [g];
    } },
    { id: 'simetrico', nombre: 'Centro simétrico', base: '#a35f46', crear: () => [
      simetrico('Media luna', 300, 400, '#f3ce7e'), simetrico('Gancho', 250, 260, '#e6d7b9')] },
    { id: 'olas', nombre: 'Olas verticales', base: '#3c5663', crear: () => [
      fila('Serpentina', 300, 3, 200, { color: '#e6d7b9' }),
      fila('Serpentina', 480, 3, 200, { color: '#f3ce7e' })] },
  ];

  Chanka.Plantillas = { lista };
})(typeof window !== 'undefined' ? window : globalThis);
