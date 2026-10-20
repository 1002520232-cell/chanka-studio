// Pruebas de las funciones añadidas. Ejecutar: node tests/nuevas_funciones.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const base = path.join(__dirname, '..', 'src');
const memoria = new Map();
globalThis.localStorage = {
  getItem: clave => memoria.has(clave) ? memoria.get(clave) : null,
  setItem: (clave, v) => memoria.set(clave, String(v)),
};
for (const ruta of ['curvas/bezier', 'curvas/hermite', 'curvas/bspline', 'geometria/matrices', 'geometria/trazo',
  'render/prendas', 'editor/motivos', 'editor/plantillas', 'editor/archivo', 'editor/editor', 'gestos']) {
  require(path.join(base, ruta + '.js'));
}
const { Gestos, Editor, Archivo } = globalThis.Chanka;
function mano(xIndice, xPulgar) {
  const puntos = Array.from({ length: 21 }, () => ({ x: .3, y: .3 }));
  puntos[8] = { x: xIndice, y: .5 };
  puntos[4] = { x: xPulgar, y: .5 };
  return puntos;
}
assert.equal(Gestos.pinza(mano(.5, .53), false), true, 'Pinza cerrada');
assert.equal(Gestos.pinza(mano(.5, .59), false), false, 'Pinza abierta');
assert.equal(Gestos.pinza(mano(.5, .59), true), true, 'Histéresis mantiene agarre');
assert.equal(Gestos.pinza(mano(.5, .63), true), false, 'Pinza suelta');
assert.deepEqual(Gestos.indice(mano(.2, .22)), { x: .8, y: .5 }, 'Reflejo horizontal');
assert.equal(Gestos.indice(null), null, 'Sin mano');
const diseño = JSON.parse(JSON.stringify(Editor.estado()));
Archivo.establecerUsuario('usuario-a');
assert.equal(Archivo.escribirGuardados([diseño]), true);
assert.equal(Archivo.leerGuardados().length, 1, 'Primer perfil ve su diseño');
Archivo.establecerUsuario('usuario-b');
assert.equal(Archivo.leerGuardados().length, 0, 'Segundo perfil no ve datos del primero');
Archivo.establecerUsuario('invitado');
assert.equal(Archivo.leerGuardados().length, 0, 'Invitado no ve datos de cuentas');
Archivo.establecerUsuario('usuario-a');
assert.equal(Archivo.leerGuardados().length, 1, 'Conserva al cambiar de cuenta');
assert.throws(() => Archivo.establecerUsuario('../fuera'), /no válido/);
console.log('12 verificaciones nuevas correctas.');
