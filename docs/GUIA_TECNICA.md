# Guía técnica

## Objetivo
Crear y comparar propuestas textiles 2D con curvas editables, colores, giros, espejo y repeticiones, para cualquier prenda. La necesidad real (reducir bocetos repetidos) debe validarse con un beneficiario; este paquete no incluye entrevista ni actividad RSU.

## Arquitectura
Todos los archivos son scripts normales (sin módulos) que se cuelgan de un objeto global `Chanka`, así la página abre con doble clic. El orden de carga está en `index.html` y las dependencias van en una sola dirección:

`curvas` → `geometria` → `render` → `editor` → `ui`

Flujo de datos: controles → `Editor` (estado) → `Trazo` (puntos de cada curva con 100 pasos) → matrices (mover/girar/escalar/espejo) → `Escena` (polilíneas SVG).
SVG solo dibuja segmentos ya calculados: no se usan `bezierCurveTo`, `quadraticCurveTo` ni comandos Bézier de SVG.

## Curvas
**Bézier (De Casteljau).** En cada nivel: P_i^(r)(t) = (1−t)·P_i^(r−1) + t·P_(i+1)^(r−1). Con 4 puntos es cúbica; P0 y P3 son extremos.

**Hermite.** H(t) = h00·P0 + h01·P1 + h10·T0 + h11·T1, con h00 = 2t³−3t²+1, h01 = −2t³+3t², h10 = t³−2t²+t, h11 = t³−t². T0 = manejador inicial − P0; T1 = manejador final − P1.

**B-spline (De Boor).** Grado 3 con 6 puntos y nudos abiertos U = [0,0,0,0,1/3,2/3,1,1,1,1]; interpola el primer y el último punto. En cada intervalo α = (t − U_i)/(U_(i+p−r+1) − U_i).

## Matrices y motivos
Una matriz 2D es `[a,b,c,d,e,f]` con x' = a·x + c·y + e, y' = b·x + d·y + f. Un motivo se coloca con

M = T(x + i·sepX, y + j·sepY) · R(giro) · S(tamaño) · T(−cx, −cy)

(se mueve el pivote al origen, se escala, se gira y se lleva al lugar). El espejo aplica x' = 800 − x a cada copia. Para editar un punto con el ratón se usa la **matriz inversa** y se vuelve al sistema local del motivo.

## Prendas
Cada prenda es una lista de puntos (en un lienzo de 800×800) más detalles Bézier. Si `suave` es verdadero, el contorno se redondea con un Bézier entre cada par de puntos (Catmull-Rom convertido a Bézier, controlado por `tension`). El contorno es editable: se guarda en el diseño.

## Guardado
JSON con nombre, id, prenda, color, contorno, foto de referencia (si hay), vista (textura/boceto) y motivos. `Archivo.validar` revisa formato, tipos, rangos y cantidades antes de abrir un archivo. Los diseños de la versión 1 se convierten con `Archivo.migrar`.

## Pintura y plantillas
La pintura se guarda en `paint`: lista de trazos `{id, color, width, op, pts}` (hasta 500, 1500 puntos al dibujar). Al soltar el pincel, `Trazo.alisar` corta esquinas (Chaikin) y se dibuja recortada a la prenda, bajo los motivos. El borrador quita el trazo pulsado. Las plantillas (`editor/plantillas.js`) son funciones que devuelven motivos creados con `Motivos.desdePreset`; `Editor.aplicarPlantilla` guarda un paso de historial, así Ctrl+Z las deshace. Los diseños sin `paint` siguen abriendo.

## Pruebas
`node tests/verificar.cjs` → comprobaciones de curvas, matrices, trazo, prendas, editor y archivos. No sustituyen una prueba en navegador real.

## Límites
- Muestras fijas: 100 segmentos por curva.
- Repeticiones de 1 a 10 por dirección; demasiadas copias bajan el rendimiento.
- Prendas esquemáticas; sin medidas de confección ni física de tela.
- Arrastre táctil conviene comprobarlo en Chrome o Edge.
