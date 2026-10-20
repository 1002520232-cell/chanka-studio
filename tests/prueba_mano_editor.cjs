// Integra el controlador gestual al modelo del editor con DOM simulado (sin webcam).
const assert = require('node:assert/strict');
const path = require('node:path');
for (const f of ['curvas/bezier', 'curvas/hermite', 'curvas/bspline', 'geometria/matrices', 'geometria/trazo',
  'render/prendas', 'editor/motivos', 'editor/plantillas', 'editor/archivo', 'editor/editor']) {
  require(path.join(__dirname, '..', 'src', f + '.js'));
}
const C = globalThis.Chanka;
const elementos = new Map();
const crear = () => ({ value: '', checked: false, disabled: false, textContent: '', src: '', hidden: false,
  replaceChildren() {}, append() {}, classList: { toggle() {} } });
globalThis.document = {
  getElementById(id) { if (!elementos.has(id)) elementos.set(id, crear()); return elementos.get(id); },
  querySelectorAll() { return []; },
  createElement() { return crear(); },
};
elementos.set('elementos', crear());
C.Escena = { dibujar() {} };
require(path.join(__dirname, '..', 'src/ui/panel.js'));
C.Editor.nuevo();
C.Editor.agregar(C.Motivos.nuevo('bezier'));
const curva = C.Editor.motivo();
const inicial = { ...curva.points[0] };
C.Panel.prepararMano();
assert.equal(elementos.get('puntos').checked, true, 'Habilita los puntos');
const p = C.Matrices.aplicar(C.Trazo.matrizMotivo(curva, 0, 0), curva.points[0]);
C.Panel.gestoMano({ x: p.x / 800, y: p.y / 800 }, true);
C.Panel.gestoMano({ x: (p.x + 30) / 800, y: (p.y + 35) / 800 }, true);
C.Panel.gestoMano(null, false);
const final = C.Editor.motivo().points[0];
assert.notDeepEqual(final, inicial, 'Mueve el punto seleccionado');
assert.equal(C.Editor.puedeDeshacer(), true, 'Movimiento queda en el historial');
C.Editor.deshacer();
assert.deepEqual(C.Editor.motivo().points[0], inicial, 'Deshacer restaura el punto');
C.Editor.rehacer();
assert.notDeepEqual(C.Editor.motivo().points[0], inicial, 'Rehacer mueve otra vez');
// El contorno de una prenda puede editarse por cámara también.
elementos.get('editarContorno').checked = true;
const contorno = { ...C.Editor.estado().contour[0] };
C.Panel.prepararMano();
C.Panel.gestoMano({ x: contorno.x / 800, y: contorno.y / 800 }, true);
C.Panel.gestoMano({ x: (contorno.x + 20) / 800, y: (contorno.y + 25) / 800 }, true);
C.Panel.gestoMano(null, false);
assert.notDeepEqual(C.Editor.estado().contour[0], contorno, 'Mueve el contorno');
C.Editor.deshacer();
assert.deepEqual(C.Editor.estado().contour[0], contorno, 'Contorno restaurado');
console.log('7 verificaciones de integración mano/editor correctas.');
