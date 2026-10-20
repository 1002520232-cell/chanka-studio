# Chanka Studio — editor de diseño textil 2D

> **Actualización:** incluye pantalla de login de demostración y control de puntos con cámara y gestos de pinza; la cámara ahora puede activarse incluso sin curvas añadidas y muestra errores comprensibles. Lee **[GUIA_LOGIN_Y_CAMARA.md](GUIA_LOGIN_Y_CAMARA.md)** para ejecutarlo, entrar, registrarte y usar la webcam. Para la cámara se requiere **localhost o HTTPS**, internet para descargar MediaPipe y permiso del usuario. El login es **solo local** y no sustituye una autenticación real de servidor.


Editor web para diseñar **cualquier prenda** (poncho, chompa, polera, casaca, chaleco, pantalón, falda, vestido, gorro, manta o una prenda libre) y decorarla con motivos hechos con curvas **Bézier, Hermite y B-spline**. Las curvas están programadas desde cero (De Casteljau, funciones base de Hermite y De Boor), sin bibliotecas.

## Cómo abrirlo
1. Descarga o clona el repositorio.
2. Abre la carpeta en Visual Studio Code.
3. Para usar **login y cámara** en VS Code, instala **Live Server**, abre `index.html` con **Open with Live Server** y entra en `http://127.0.0.1:5500/index.html` en Chrome o Edge. No necesitas Python. La cámara descarga un detector desde CDN (requiere internet). Si falla, abre `probar_camara.html` desde Live Server para revisar el permiso de webcam por separado.

## Cómo diseñar
1. **Elige una prenda** a la izquierda. Cambiar de prenda conserva tus motivos.
2. **¿Tu prenda no está?** Activa *Editar contorno* y arrastra los puntos turquesa (+ Punto / − Punto agregan o quitan). También puedes *cargar una foto para calcar*: aparece detrás y dibujas el contorno encima.
3. **Arrastra un motivo** del panel derecho hasta la prenda (o púlsalo).
4. Muévelo, cambia su tamaño con la esquina, gíralo con el slider *Giro* y actívale *Espejo* para que sea simétrico.
5. Usa *Repeticiones* para armar franjas y patrones. *Editar puntos* muestra los puntos matemáticos de la curva.
6. **Guardar** (en el navegador), **Descargar editable** (.json), **Exportar SVG** o **Imprimir**.

## Pestañas
- **Diseñar:** prendas, plantillas, motivos con curvas Bézier / Hermite / B-spline, repeticiones y acabado (textura o boceto). Atajos: Ctrl+D, Supr, flechas, *Al frente / Atrás*, *Cuadrícula y eje*.
- **Pintar:** pincel (color, grosor, opacidad) y borrador de trazos, a mano alzada y recortado a la prenda.
- **Plantillas:** composiciones listas (franjas, borde de picos, gotas, simétrico, olas) que se editan después.
- **Exportar:** SVG, PNG (1600 px) o imprimir.

## Estructura del proyecto
```
chanka-studio/
├── index.html              Página principal
├── css/estilos.css         Colores y distribución
├── src/
│   ├── main.js             Arranque
│   ├── curvas/             Matemática de las curvas
│   │   ├── bezier.js       De Casteljau
│   │   ├── hermite.js      Funciones base de Hermite
│   │   └── bspline.js      De Boor
│   ├── geometria/
│   │   ├── matrices.js     Mover, escalar, girar con matrices
│   │   └── trazo.js        Curvas → puntos; copias, repeticiones y espejo
│   ├── render/
│   │   ├── prendas.js      Catálogo de prendas (solo datos)
│   │   └── escena.js       Dibuja prenda y motivos en SVG
│   ├── editor/
│   │   ├── motivos.js      Motivos de la galería
│   │   ├── plantillas.js   Diseños de partida
│   │   ├── editor.js       Estado del diseño, deshacer/rehacer
│   │   └── archivo.js      Guardar, abrir, validar, exportar
│   └── ui/panel.js         Botones, arrastre, zoom, sliders
├── tests/verificar.cjs     Pruebas automáticas (node tests/verificar.cjs)
└── docs/                   Guía técnica y guía de GitHub
```
Cada archivo empieza con un comentario que explica qué hace. Las dependencias van de arriba hacia abajo: `curvas` → `geometria` → `render` → `editor` → `ui`.

## Agregar una prenda nueva
Abre `src/render/prendas.js`, copia una prenda existente, cambia sus puntos y agrega su nombre a la lista `orden`. No hay que tocar nada más.

## Pruebas
```
node tests/verificar.cjs
```
39 comprobaciones de curvas, matrices, motivos, prendas, editor y archivos, además de 12 comprobaciones nuevas de gestos y perfiles mediante `node tests/nuevas_funciones.cjs`, y 7 pruebas de integración mano/editor mediante `node tests/prueba_mano_editor.cjs`.

## Límites (para ser honestos en la sustentación)
- Las prendas son **esquemas 2D**, no patrones de corte ni medidas reales.
- Las pruebas automáticas y una simulación de la interfaz se ejecutaron sin errores, pero el arrastre con ratón/táctil debe comprobarse a mano en Chrome o Edge.
- Los motivos son figuras geométricas de demostración, **no símbolos chanka históricos acreditados**.
- «Cerrar y rellenar» une los extremos con una recta; no evita autointersecciones.
- Guardar usa el navegador (se puede perder al limpiar datos): descarga siempre el `.json`.
- El inicio de sesión es **local y de demostración**, no apto para proteger datos reales ni para cuentas compartidas por internet.
- El seguimiento de manos requiere conexión para obtener MediaPipe, permisos de cámara y pruebas con una webcam física.
- Si usas una foto, asegúrate de tener permiso de uso.

## Equipo y asistencia de IA
Ver `CONTRIBUCIONES.md`. Declarar el apoyo de IA según las indicaciones del docente.
