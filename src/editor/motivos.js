// MOTIVOS — figuras listas para arrastrar sobre la prenda
// Un motivo es una curva (Bézier, Hermite o B-spline) con color, tamaño, giro y repeticiones.
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});
  const { Trazo } = Chanka;

  const NOMBRES = { bezier: 'Bézier', hermite: 'Hermite', bspline: 'B-spline' };
  const DESCRIPCIONES = {
    bezier: 'Bézier (De Casteljau): 4 puntos — extremos y dos controles que tiran de la curva.',
    hermite: 'Hermite: 2 extremos + 2 manejadores (tangentes) que orientan la salida y la llegada.',
    bspline: 'B-spline cúbica (De Boor): 6 puntos de control; la curva pasa por el primero y el último.',
  };

  // Puntos iniciales de cada tipo de curva
  const PUNTOS_BASE = {
    bezier: [[0, 50], [25, -25], [75, 125], [100, 50]],
    hermite: [[0, 50], [100, 50], [30, -80], [130, 180]],
    bspline: [[0, 50], [20, 0], [40, 90], [60, 10], [80, 100], [100, 50]],
  };

  // Galería del panel derecho
  const PRESETS = [
    { nombre: 'Onda', tipo: 'bezier', puntos: [[0, 50], [35, -20], [75, 120], [110, 50]] },
    { nombre: 'Arco', tipo: 'hermite', puntos: [[0, 70], [110, 70], [0, -140], [110, 280]] },
    { nombre: 'Serpentina', tipo: 'bspline', puntos: [[0, 55], [20, 0], [45, 110], [70, 0], [95, 110], [120, 55]] },
    { nombre: 'Gota', tipo: 'bezier', puntos: [[10, 60], [85, -30], [85, 150], [10, 60]], cerrado: true },
    { nombre: 'Gancho', tipo: 'hermite', puntos: [[0, 65], [95, 20], [120, 65], [95, -100]] },
    { nombre: 'Franja', tipo: 'bspline', puntos: [[0, 50], [24, 20], [48, 80], [72, 20], [96, 80], [120, 50]] },
    { nombre: 'Media luna', tipo: 'bezier', puntos: [[0, 60], [40, -40], [100, -40], [130, 60]], cerrado: true },
    { nombre: 'Picos', tipo: 'bspline', puntos: [[0, 90], [20, 0], [40, 90], [60, 0], [80, 90], [100, 0]] },
  ];

  // Crea un motivo nuevo. 'op' puede traer: tipo, puntos, x, y, color, width, cerrado, nombre
  function nuevo(tipo, op = {}) {
    const puntos = (op.puntos || PUNTOS_BASE[tipo]).map(([x, y]) => ({ x, y }));
    // El pivote (cx, cy) es el centro de la curva: el motivo gira y se escala alrededor de él
    const caja = Trazo.caja(Trazo.muestrear(tipo, puntos));
    return {
      id: 'c' + Date.now() + Math.random().toString(16).slice(2),
      type: tipo, preset: op.nombre || null, points: puntos,
      cx: (caja.x0 + caja.x1) / 2, cy: (caja.y0 + caja.y1) / 2,
      x: op.x ?? 400, y: op.y ?? 400, scale: 1, rot: 0,
      color: op.color || '#f3ce7e', width: op.width ?? 4,
      repeatX: 1, repeatY: 1, gapX: 110, gapY: 90,
      closed: !!op.cerrado, mirror: false,
    };
  }

  function desdePreset(indice, x, y, op = {}) {
    const p = PRESETS[indice];
    return nuevo(p.tipo, { ...op, puntos: p.puntos, nombre: p.nombre, cerrado: p.cerrado, x, y });
  }

  Chanka.Motivos = { NOMBRES, DESCRIPCIONES, PRESETS, nuevo, desdePreset };
})(typeof window !== 'undefined' ? window : globalThis);
