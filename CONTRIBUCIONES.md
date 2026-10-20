# Contribuciones del equipo

El proyecto se dividió en **3 partes**. Cada integrante sube su parte a su propia rama y la une a `main` con un Pull Request. Orden recomendado para unir: **1 → 2 → 3** (la parte 3 carga los archivos de las otras dos).

| | Integrante 1 | Integrante 2 | Integrante 3 |
|---|---|---|---|
| **Nombre** | _(escribir)_ | _(escribir)_ | _(escribir)_ |
| **Rama** | `integrante-1-matematica` | `integrante-2-dibujo` | `integrante-3-editor-ui` |
| **Parte** | Matemática, motivos y plantillas | Dibujo y exportación | Editor, pestañas y pintura |

## Integrante 1 — Matemática, motivos y plantillas
- `src/curvas/bezier.js`, `hermite.js`, `bspline.js`
- `src/geometria/matrices.js` · `src/geometria/trazo.js` (incluye `alisar` para la pintura)
- `src/editor/motivos.js` · `src/editor/plantillas.js`
- `tests/verificar.cjs` · `docs/GUIA_TECNICA.md`

## Integrante 2 — Dibujo y exportación
- `src/render/prendas.js` · `escena.js` (pintura, cuadrícula y eje)
- `src/editor/archivo.js` (validar pintura, SVG, PNG)
- `css/estilos.css` · `README.md`

## Integrante 3 — Editor, pestañas y pintura
- `src/editor/editor.js` (historial, capas, trazos, plantillas)
- `src/ui/panel.js` (pestañas Diseñar / Pintar, pincel, borrador, atajos)
- `index.html` · `src/main.js`
- `CONTRIBUCIONES.md` · `docs/GUIA_GITHUB.md`

## Asistencia de IA
_(Completar: qué herramienta se usó, para qué partes y qué cambió el equipo después. El docente pide declararlo.)_

## Qué debe poder explicar cada integrante
- **1:** cómo se calcula un punto en cada curva, el vector de nudos, el orden de las matrices, cómo `alisar` suaviza un trazo y cómo se arma una plantilla.
- **2:** cómo una lista de puntos se vuelve prenda, cómo se recorta la pintura a la prenda y cómo se exporta a SVG/PNG.
- **3:** cómo funciona el historial, cómo cambia la interfaz según la pestaña, cómo se convierte el puntero a coordenadas del lienzo y qué pasa al pintar o borrar un trazo.
