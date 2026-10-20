# Cómo subir el proyecto a GitHub entre 3 personas

Objetivo: que en GitHub se vea **quién hizo qué**. Cada integrante usa su propia rama, hace varios commits con su nombre y une su trabajo con un Pull Request.

## Antes de empezar (los 3)
1. Instalar Git y crear cuenta en GitHub.
2. Configurar **su propio nombre** (si no, los commits salen con el nombre de otra persona):
   ```
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-correo@ejemplo.com"
   ```
   Usar el mismo correo que tiene la cuenta de GitHub.

## Paso 0 — Una persona crea el repositorio (solo una vez)
1. En GitHub: **New repository** → nombre `chanka-studio` → marcar *Add a README* → Create.
2. En *Settings → Collaborators* agregar a los otros dos integrantes.

## Paso 1 — Cada integrante (en su computadora)
```
git clone https://github.com/USUARIO/chanka-studio.git
cd chanka-studio
git checkout -b integrante-1-matematica      # o integrante-2-dibujo / integrante-3-editor-ui
```
Copiar **solo los archivos de su parte** (están en su paquete .zip, con las carpetas ya armadas) dentro de la carpeta del repositorio.

## Paso 2 — Commits pequeños y con mensaje claro
No subir todo en un solo commit: un commit por archivo o por idea. Ejemplo para el Integrante 1:
```
git add src/curvas/bezier.js
git commit -m "Agrega curva de Bézier con De Casteljau"

git add src/curvas/hermite.js
git commit -m "Agrega curva de Hermite"

git add src/curvas/bspline.js
git commit -m "Agrega B-spline cúbica con De Boor"

git add src/geometria/matrices.js
git commit -m "Agrega matrices 2D: trasladar, escalar, rotar e inversa"

git add src/geometria/trazo.js
git commit -m "Agrega muestreo, suavizado, repeticiones y espejo"

git add src/editor/motivos.js tests docs/GUIA_TECNICA.md
git commit -m "Agrega motivos de la galería, pruebas y guía técnica"
```
Los mensajes de los otros dos pueden seguir la misma idea (uno por archivo de su lista en `CONTRIBUCIONES.md`).

Importante: **los commits deben reflejar el trabajo real**. Si durante la semana mejoran o corrigen algo, háganlo con un commit nuevo (así queda el historial verdadero).

## Paso 3 — Subir la rama y abrir Pull Request
```
git push -u origin integrante-1-matematica
```
En GitHub aparece el botón **Compare & pull request** → escribir un título como «Parte 1: matemática y geometría» → Create pull request.

## Paso 4 — Unir todo
- Otro integrante revisa el Pull Request (pestaña *Files changed*) y pulsa **Merge pull request**.
- Cuando los 3 Pull Requests estén unidos, `main` tiene el proyecto completo. Descargarlo con `git checkout main && git pull` y abrir `index.html` para comprobar que todo funciona.
- Al final, completar los nombres y la asistencia de IA en `CONTRIBUCIONES.md`.

## Qué verá el profesor
- Pestaña **Commits**: cada commit con el nombre de quien lo hizo.
- Pestaña **Pull requests**: 3 PR, uno por integrante.
- Pestaña **Insights → Contributors**: gráfico de aportes por persona.
- `CONTRIBUCIONES.md`: la tabla de quién hizo qué.

## Si algo sale mal
- «Permission denied»: falta agregar al colaborador (Paso 0).
- Conflicto al unir: no debería ocurrir porque cada uno toca archivos distintos. Si ocurre en `README.md`, conservar ambas versiones.
- Subiste un archivo por error: `git rm archivo` y un commit nuevo.
