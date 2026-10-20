// Prueba del botón sin puntos, permiso de cámara, apagado y errores (webcam simulada).
const assert = require('node:assert/strict');
const path = require('node:path');
const elementos = new Map();
function elemento() {
  return { checked: false, hidden: true, textContent: '', style: {}, readyState: 2,
    classList: { add() {}, remove() {}, toggle() {} },
    async play() {}, pause() {}, srcObject: null };
}
const obtener = id => { if (!elementos.has(id)) elementos.set(id, elemento()); return elementos.get(id); };
let detenido = 0, preparaciones = 0, gestos = 0, peticiones = 0;
let denegado = false;
globalThis.isSecureContext = true;
globalThis.document = {
  getElementById: obtener,
  addEventListener() {},
  createElement() { return { remove() {}, onload: null, onerror: null }; },
  head: { appendChild(script) { script.onerror(); } },
};
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { mediaDevices: { async getUserMedia() {
    peticiones++;
    if (denegado) { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; }
    return { getTracks() { return [{ stop() { detenido++; } }]; } };
  } } },
});
globalThis.requestAnimationFrame = () => 0;
globalThis.addEventListener = () => {};
globalThis.Hands = class {
  setOptions() {}
  onResults(callback) { this.callback = callback; }
  send() { this.callback({ multiHandLandmarks: [] }); return Promise.resolve(); }
  close() { return Promise.resolve(); }
};
globalThis.Chanka = {
  Panel: { prepararMano() { preparaciones++; }, gestoMano() { gestos++; } },
  Editor: { estado() { return { curves: [] }; } },
  Gestos: { pinza() { return false; }, indice() { return { x: 0.5, y: 0.5 }; } },
};
require(path.join(__dirname, '..', 'src/manos.js'));
const boton = obtener('botonCamara');
globalThis.Chanka.Manos.iniciar();
assert.equal(typeof boton.onclick, 'function', 'El botón tiene evento de clic');
(async () => {
  await boton.onclick(); // No existe ninguna curva: debe solicitar la cámara de todas maneras.
  assert.equal(peticiones, 1, 'Solicita permiso incluso sin curvas');
  assert.equal(obtener('panelCamara').hidden, false, 'Se ve el vídeo');
  assert.match(boton.textContent, /Apagar cámara/);
  assert.match(obtener('mensajeCamara').textContent, /Añadir curva/);
  boton.onclick();
  assert.equal(detenido, 1, 'Detiene la pista de vídeo');
  assert.equal(obtener('panelCamara').hidden, true);
  assert.match(boton.textContent, /Activar cámara/);
  denegado = true;
  // Se silencia el error de consola, pero se conserva el mensaje visible de error.
  const antiguo = console.error; console.error = () => {};
  try { await boton.onclick(); } finally { console.error = antiguo; }
  assert.equal(peticiones, 2, 'Permite volver a intentar');
  assert.equal(obtener('panelCamara').hidden, false, 'Muestra error al usuario');
  assert.match(obtener('mensajeCamara').textContent, /Permiso de cámara denegado/);
  assert.equal(preparaciones, 2);
  assert.ok(gestos >= 2);
  globalThis.Chanka.Manos.detener();
  console.log('9 verificaciones de activación / permisos de cámara correctas.');
})().catch(e => { console.error(e); process.exitCode = 1; });
