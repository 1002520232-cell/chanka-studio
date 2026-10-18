import { crearRenderer } from "./render/webgl.js";

const canvas = document.getElementById("lienzo");
const render = crearRenderer(canvas);

// Prueba: cuatro puntos unidos con una línea
const puntos = [100, 500, 350, 100, 650, 500, 900, 100];

render.limpiar(0.96, 0.94, 0.9);
render.dibujarLinea(puntos, [0.64, 0.2, 0.12]);
render.dibujarPuntos(puntos, [0.1, 0.1, 0.1]);