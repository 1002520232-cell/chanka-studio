# CHANKA STUDIO — Guía de inicio de sesión y control con la mano

## 1. Cómo ejecutar el proyecto

Es un proyecto **web (HTML, CSS y JavaScript)**. No se abre desde Unity.

1. Descomprime el ZIP y entra en la carpeta `proyecto_webgl_mejorado`.
2. Abre la carpeta con VS Code.
3. En VS Code, instala la extensión **Live Server (Ritwick Dey)**. Haz clic derecho sobre `index.html` y pulsa **Open with Live Server**. **No hace falta instalar Python**.
4. Abre la dirección mostrada, normalmente **http://127.0.0.1:5500/index.html**, en Chrome o Edge. Alternativamente, con Python disponible puedes usar `python -m http.server 8000` y `http://localhost:8000`.
5. Para publicar, usa una página HTTPS: la cámara no funciona en una web HTTP normal fuera de `localhost`.

Las funciones básicas funcionan sin conexión, pero **el control de manos requiere internet la primera vez y mientras descarga MediaPipe**, servido desde `cdn.jsdelivr.net`. Después, el procesamiento del video se realiza localmente en el navegador. Se necesita una webcam real con permiso del usuario.

## 2. Login (acceso de demostración)

- La primera pantalla muestra **Iniciar sesión**, **Crear una cuenta** y **Continuar como invitado**.
- Elige **Crear una cuenta**, introduce nombre, correo y contraseña de **8 caracteres como mínimo**.
- A partir de entonces puedes entrar con ese correo y contraseña desde **el mismo navegador y dispositivo**.
- Haz clic en **Salir** para cerrar la sesión.
- La sección **Diseños guardados** se separa por cuenta; los diseños antiguos que se guardaron antes de añadir el login siguen disponibles en el perfil **Invitado**.
- Usa **Descargar editable** para respaldar tus diseños y transferirlos a otro navegador/equipo.

**IMPORTANTE:** Es un login de demostración, sin servidor ni base de datos en línea. Los correos, la huella criptográfica de la contraseña y los diseños se guardan en el almacenamiento local del navegador. No uses una contraseña real o importante. No hay recuperación de cuenta, sincronización entre dispositivos ni protección de datos de nivel producción. Para acceso real por internet integra un backend de autenticación (Firebase Auth, Supabase Auth o similar) y una base de datos con reglas de acceso.

## 3. Mover los puntos con la cámara

1. Inicia sesión (o entra como invitado).
2. En **Diseñar**, pulsa **📷 Activar cámara y mano**. Funciona aunque todavía no hayas añadido curvas.
3. **Permite el acceso** a la cámara cuando el navegador te lo solicite. Aparecerá el vídeo y luego se descargará MediaPipe. Si no tienes curvas, pulsa **+ Añadir curva** o activa **Editar contorno**.
4. La opción **Editar puntos** se activa automáticamente, mostrando los puntos de la curva seleccionada.
5. Mira el recuadro de video: funciona como un espejo. Mueve el **dedo índice** delante de la cámara para situar el cursor circular sobre un punto.
6. **Junta la punta del pulgar con la punta del índice** para agarrar el punto; mantén ambos dedos juntos mientras desplazas la mano.
7. **Separa los dedos** para soltarlo. Puedes deshacer con **Ctrl+Z** y guardar con **Guardar**.
8. Pulsa **⏹ Apagar cámara** para detener la captura. Se detiene automáticamente al entrar en **Pintar**, al cerrar sesión o al salir de la pestaña.

### También permite cambiar el contorno de la prenda

Si primero activas **Cambiar la forma → Editar contorno**, la cámara controlará los puntos turquesa del contorno en lugar de los puntos de la curva.

### Si la cámara no funciona

- Usa Chrome o Edge actualizado y abre el proyecto con **Live Server** en `http://127.0.0.1:5500` o `http://localhost` (o un sitio **HTTPS**, no HTTP remoto).
- Abre **probar_camara.html** con Live Server para comprobar la webcam de forma independiente, sin MediaPipe. Si tampoco funciona ahí, revisa permisos del sistema.
- En Windows ve a **Configuración → Privacidad y seguridad → Cámara** y habilita el acceso a la cámara y a aplicaciones de escritorio.
- Si ves el vídeo, pero aparece «No se pudo descargar MediaPipe», revisa tu internet y los bloqueadores de `cdn.jsdelivr.net`.
- Concede el permiso de cámara desde la barra del navegador.
- Comprueba que ninguna otra aplicación esté usando la webcam y que exista conexión a internet para descargar el detector de manos.
- Usa una habitación iluminada y mantén la mano entera visible.
- Si el movimiento falla, puedes seguir trabajando con el **mouse**, arrastrando los puntos normalmente.

## 4. Archivos que se añadieron

- `src/auth.js`: registro, login y cierre de sesión local, con derivación PBKDF2-SHA256 y sal aleatoria.
- `src/gestos.js`: interpretación del gesto de pinza y coordenadas de la mano.
- `src/manos.js`: gestión de permisos de webcam y reconocimiento MediaPipe Hands desde CDN.
- `src/ui/panel.js`: edición de puntos del lienzo con coordenadas recibidas desde la mano.
- `tests/nuevas_funciones.cjs`: pruebas de gestos y aislamiento de diseños por usuario.
- `tests/prueba_activacion_camara.cjs`: pruebas del botón, permisos y apagado con cámara simulada.
- `probar_camara.html`: prueba local de la webcam sin biblioteca externa.

## 5. Pruebas

Desde una terminal, dentro de la carpeta del proyecto:

```bash
node tests/verificar.cjs
node tests/nuevas_funciones.cjs
node tests/prueba_mano_editor.cjs
node tests/prueba_activacion_camara.cjs
```

Las pruebas de lógica no reemplazan las comprobaciones del permiso de cámara, la webcam y la detección de gestos en el navegador del usuario.
