// PRUEBAS — ejecutar con:  node tests/verificar.cjs
// No necesita instalar nada ni abrir el navegador. Comprueba las matemáticas y la lógica del editor.
const path = require('path');
const orden = ['curvas/bezier', 'curvas/hermite', 'curvas/bspline', 'geometria/matrices', 'geometria/trazo',
  'render/prendas', 'editor/motivos', 'editor/plantillas', 'editor/archivo', 'editor/editor'];
orden.forEach(f => require(path.join(__dirname, '..', 'src', f + '.js')));
const { Bezier, Hermite, Bspline, Matrices, Trazo, Prendas, Motivos, Archivo, Editor } = globalThis.Chanka;

let bien = 0, mal = 0;
function prueba(nombre, fn) {
  try { fn(); bien++; console.log('  ✓', nombre); }
  catch (e) { mal++; console.log('  ✗', nombre, '\n     ', e.message); }
}
function igual(a, b, msg = '') { if (Math.abs(a - b) > 1e-9) throw new Error(`${msg} se esperaba ${b} y salió ${a}`); }
function cierto(c, msg) { if (!c) throw new Error(msg); }
const P = (x, y) => ({ x, y });

console.log('\nCurvas');
prueba('Bézier pasa por el primer y el último punto', () => {
  const p = [P(0, 0), P(10, 50), P(60, 50), P(100, 0)];
  igual(Bezier.punto(p, 0).x, 0); igual(Bezier.punto(p, 1).x, 100);
});
prueba('Bézier en t=0.5 de una cúbica da el punto esperado', () => {
  const p = [P(0, 0), P(0, 100), P(100, 100), P(100, 0)];
  igual(Bezier.punto(p, 0.5).x, 50); igual(Bezier.punto(p, 0.5).y, 75);
});
prueba('Hermite pasa por inicio y fin', () => {
  const p = [P(0, 0), P(100, 0), P(30, 50), P(130, 50)];
  igual(Hermite.punto(p, 0).x, 0); igual(Hermite.punto(p, 1).x, 100);
});
prueba('Hermite sale en la dirección de la tangente', () => {
  const p = [P(0, 0), P(100, 0), P(0, 80), P(100, 80)];   // tangente inicial hacia arriba
  cierto(Hermite.punto(p, 0.05).y > 0, 'la curva debía subir al inicio');
});
prueba('B-spline abierta: empieza y termina en los extremos', () => {
  const p = [P(0, 50), P(20, 0), P(40, 90), P(60, 10), P(80, 100), P(100, 50)];
  igual(Bspline.punto(p, 0).x, 0); igual(Bspline.punto(p, 1).x, 100); igual(Bspline.punto(p, 1).y, 50);
});
prueba('B-spline: vector de nudos de 6 puntos', () => {
  const u = Bspline.nudos(6, 3), esperado = [0, 0, 0, 0, 1 / 3, 2 / 3, 1, 1, 1, 1];
  esperado.forEach((v, i) => igual(u[i], v));
});
prueba('B-spline con puntos en línea recta da una recta', () => {
  const p = [0, 1, 2, 3, 4, 5].map(i => P(i * 10, i * 10));
  for (let t = 0; t <= 1; t += 0.1) { const q = Bspline.punto(p, t); igual(q.x, q.y); }
});
prueba('muestrear devuelve 101 puntos finitos', () => {
  for (const [tipo, n] of [['bezier', 4], ['hermite', 4], ['bspline', 6]]) {
    const pts = Trazo.muestrear(tipo, Array.from({ length: n }, (_, i) => P(i * 20, (i % 2) * 40)));
    cierto(pts.length === 101 && pts.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)), tipo);
  }
});

console.log('\nMatrices');
prueba('trasladar, escalar y rotar', () => {
  const p = Matrices.aplicar(Matrices.trasladar(5, 7), P(1, 1)); igual(p.x, 6); igual(p.y, 8);
  const q = Matrices.aplicar(Matrices.escalar(2), P(3, 4)); igual(q.x, 6); igual(q.y, 8);
  const r = Matrices.aplicar(Matrices.rotar(90), P(1, 0)); igual(r.x, 0); igual(r.y, 1);
});
prueba('multiplicar aplica primero la matriz de la derecha', () => {
  const M = Matrices.multiplicar(Matrices.trasladar(10, 0), Matrices.escalar(2));
  const p = Matrices.aplicar(M, P(1, 1)); igual(p.x, 12); igual(p.y, 2);
});
prueba('la inversa deshace la transformación', () => {
  let M = Matrices.multiplicar(Matrices.trasladar(30, -12), Matrices.multiplicar(Matrices.rotar(37), Matrices.escalar(1.7)));
  const p = Matrices.aplicar(Matrices.inversa(M), Matrices.aplicar(M, P(14, 9)));
  igual(p.x, 14); igual(p.y, 9);
});

console.log('\nTrazo y motivos');
prueba('dentro() distingue puntos dentro y fuera', () => {
  const cuadro = [P(0, 0), P(10, 0), P(10, 10), P(0, 10)];
  cierto(Trazo.dentro(5, 5, cuadro) && !Trazo.dentro(15, 5, cuadro), 'dentro/fuera incorrecto');
});
prueba('suavizar da un contorno cerrado con puntos finitos', () => {
  const pts = Trazo.suavizar([P(0, 0), P(100, 0), P(100, 100), P(0, 100)], 1, 8);
  cierto(pts.length === 32 && pts.every(p => Number.isFinite(p.x)), 'contorno incorrecto');
});
prueba('copiasMotivo: repeticiones y espejo', () => {
  const c = Motivos.nuevo('bezier'); c.repeatX = 3; c.repeatY = 2;
  cierto(Trazo.copiasMotivo(c).length === 6, 'debían ser 6 copias');
  c.mirror = true;
  cierto(Trazo.copiasMotivo(c).length === 12, 'con espejo debían ser 12');
});
prueba('el espejo refleja respecto al centro (x = 400)', () => {
  const c = Motivos.nuevo('bezier', { x: 300, y: 300 }); c.mirror = true;
  const [normal, espejo] = Trazo.copiasMotivo(c);
  igual(normal[0].x + espejo[0].x, 800); igual(normal[0].y, espejo[0].y);
});
prueba('el giro mantiene el centro del motivo en (x, y)', () => {
  const c = Motivos.nuevo('bezier', { x: 250, y: 330 }); c.rot = 73;
  const centro = Matrices.aplicar(Trazo.matrizMotivo(c), { x: c.cx, y: c.cy });
  igual(centro.x, 250); igual(centro.y, 330);
});

console.log('\nPrendas');
for (const id of Prendas.orden) {
  prueba(`prenda «${id}»: contorno válido`, () => {
    const p = Prendas.lista[id], pts = p.puntos.map(([x, y]) => P(x, y));
    cierto(pts.length >= 3, 'muy pocos puntos');
    cierto(pts.every(q => q.x >= 0 && q.x <= 800 && q.y >= 0 && q.y <= 800), 'puntos fuera del lienzo');
    const borde = p.suave ? Trazo.suavizar(pts, p.tension, 8) : pts;
    cierto(borde.length >= 3 && borde.every(q => Number.isFinite(q.x) && Number.isFinite(q.y)), 'contorno inválido');
    p.detalles.forEach(d => cierto(d.p.length === 4, 'un detalle necesita 4 puntos'));
  });
}
prueba('la lista "orden" y el catálogo coinciden', () => {
  cierto(Prendas.orden.every(id => Prendas.lista[id]) && Object.keys(Prendas.lista).length === Prendas.orden.length, 'no coinciden');
});

console.log('\nEditor');
prueba('un diseño nuevo es válido', () => { Editor.nuevo(); cierto(Archivo.validar(Editor.estado()), 'inválido'); });
prueba('agregar, duplicar y eliminar motivos', () => {
  Editor.nuevo();
  Editor.agregar(Motivos.nuevo('bezier')); Editor.duplicar();
  cierto(Editor.estado().curves.length === 2, 'debían ser 2');
  Editor.eliminar();
  cierto(Editor.estado().curves.length === 1, 'debía quedar 1');
});
prueba('deshacer y rehacer', () => {
  Editor.nuevo(); Editor.agregar(Motivos.nuevo('hermite'));
  Editor.deshacer(); cierto(Editor.estado().curves.length === 0, 'deshacer falló');
  Editor.rehacer(); cierto(Editor.estado().curves.length === 1, 'rehacer falló');
});
prueba('cambiar de prenda conserva los motivos', () => {
  Editor.nuevo(); Editor.agregar(Motivos.nuevo('bspline')); Editor.elegirPrenda('vestido');
  cierto(Editor.estado().garment === 'vestido' && Editor.estado().curves.length === 1, 'se perdieron motivos');
});
prueba('contorno: agregar, quitar y restaurar puntos', () => {
  Editor.nuevo(); const n = Editor.estado().contour.length;
  Editor.agregarPuntoContorno(); cierto(Editor.estado().contour.length === n + 1, 'no agregó');
  Editor.quitarPuntoContorno(); cierto(Editor.estado().contour.length === n, 'no quitó');
  Editor.estado().contour[0].x = 1; Editor.restaurarContorno();
  cierto(Editor.estado().contour[0].x !== 1, 'no restauró');
});
prueba('cambiar el tipo de curva restablece sus puntos', () => {
  Editor.nuevo(); Editor.agregar(Motivos.nuevo('bezier')); Editor.cambiarTipo('bspline');
  cierto(Editor.motivo().points.length === 6, 'debía tener 6 puntos');
});

console.log('\nArchivos');
prueba('rechaza datos inválidos', () => {
  Editor.nuevo(); Editor.agregar(Motivos.nuevo('bezier'));
  const base = JSON.parse(JSON.stringify(Editor.estado()));
  const mal = [s => { s.base = 'rojo'; }, s => { s.garment = 'capa'; }, s => { s.curves[0].scale = 99; },
               s => { s.curves[0].points.pop(); }, s => { s.contour = []; }, s => { s.format = 'otro'; }];
  for (const romper of mal) { const s = JSON.parse(JSON.stringify(base)); romper(s); cierto(!Archivo.validar(s), 'aceptó datos malos'); }
});
prueba('migra un diseño de la versión 1', () => {
  const v1 = { format: 'chanka-studio', version: 1, id: 'abc', name: 'Antiguo', garment: 'poncho', base: '#805238', reference: null,
    curves: [{ id: 'c1', type: 'bezier', points: [P(0, 50), P(25, -25), P(75, 125), P(100, 50)], x: 230, y: 300, color: '#f3ce7e', width: 4, scale: 1, repeatX: 1, repeatY: 1, gapX: 110, gapY: 90, closed: false }] };
  cierto(Archivo.validar(Archivo.migrar(v1)), 'la migración no produjo un diseño válido');
});

console.log('\nPlantillas y pintura');
prueba('todas las plantillas producen diseños válidos', () => {
  for (const p of globalThis.Chanka.Plantillas.lista) {
    Editor.nuevo(); Editor.aplicarPlantilla(p.id);
    cierto(Archivo.validar(JSON.parse(JSON.stringify(Editor.estado()))), p.nombre);
  }
});
prueba('pintar, borrar y deshacer un trazo', () => {
  Editor.nuevo();
  Editor.agregarTrazo({ id: 't1', color: '#ff0000', width: 8, op: 1, pts: [P(10, 10), P(20, 20)] });
  cierto(Archivo.validar(Editor.estado()), 'diseño con pintura inválido');
  Editor.borrarTrazo('t1'); cierto(Editor.estado().paint.length === 0, 'no se borró');
  Editor.deshacer(); cierto(Editor.estado().paint.length === 1, 'no se deshizo');
});
prueba('alisar conserva extremos', () => {
  const r = Trazo.alisar([P(0, 0), P(10, 10), P(20, 0)]);
  igual(r[0].x, 0); igual(r[r.length - 1].x, 20);
});

console.log(`\n${bien} correctas, ${mal} con error\n`);
process.exit(mal ? 1 : 0);
