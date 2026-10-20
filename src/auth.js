// AUTENTICACIÓN DE DEMOSTRACIÓN (sin servidor): cuentas y sesiones locales.
// No reemplaza un proveedor de identidad ni es apropiada para cuentas reales en producción.
(function (G) {
  'use strict';
  const Chanka = (G.Chanka = G.Chanka || {});
  const CUENTAS = 'chanka-usuarios-demo-v1';
  const SESION = 'chanka-sesion-demo-v1';
  const $ = id => document.getElementById(id);
  const correoNormal = valor => String(valor || '').trim().toLowerCase();
  const limpiar = valor => String(valor || '').trim().slice(0, 60);

  const leer = () => {
    try {
      const lista = JSON.parse(localStorage.getItem(CUENTAS) || '[]');
      return Array.isArray(lista) ? lista.filter(u => u && typeof u.correo === 'string' && typeof u.id === 'string') : [];
    } catch (_) { return []; }
  };
  const hexadecimal = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  const aBytes = texto => Uint8Array.from(texto.match(/.{2}/g) || [], par => parseInt(par, 16));

  async function claveDerivada(contrasena, sal) {
    if (!G.crypto || !G.crypto.subtle) throw new Error('Abre el proyecto desde localhost o HTTPS para habilitar el inicio de sesión.');
    const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(contrasena), 'PBKDF2', false, ['deriveBits']);
    const resultado = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: aBytes(sal), iterations: 210000, hash: 'SHA-256' }, clave, 256);
    return hexadecimal(resultado);
  }
  function nuevaSal() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return hexadecimal(bytes);
  }
  function crearSesion(usuario) {
    sessionStorage.setItem(SESION, usuario.id);
    G.location.reload();
  }
  function msg(texto) { $('authEstado').textContent = texto; }

  function iniciar() {
    const existente = (() => { try { return sessionStorage.getItem(SESION); } catch (_) { return null; } })();
    const usuario = existente === 'invitado'
      ? { id: 'invitado', nombre: 'Invitado' }
      : leer().find(u => u.id === existente);
    if (usuario) {
      Chanka.Archivo.establecerUsuario(usuario.id);
      $('usuarioActivo').textContent = usuario.nombre;
      document.body.classList.remove('bloqueado');
      $('pantallaAcceso').hidden = true;
      Chanka.Panel.iniciar();
    } else {
      document.body.classList.add('bloqueado');
      $('pantallaAcceso').hidden = false;
      try { sessionStorage.removeItem(SESION); } catch (_) { /* modo privado */ }
    }

    let registrar = false;
    $('cambiarAuth').onclick = () => {
      registrar = !registrar;
      $('formAcceso').reset();
      $('campoNombre').hidden = !registrar;
      $('nombreUsuario').required = registrar;
      $('enviarAuth').textContent = registrar ? 'Crear cuenta e ingresar' : 'Iniciar sesión';
      $('cambiarAuth').textContent = registrar ? 'Ya tengo cuenta: iniciar sesión' : 'Crear una cuenta';
      $('authTitulo').textContent = registrar ? 'Crear cuenta' : 'Iniciar sesión';
      msg('');
    };
    $('formAcceso').onsubmit = async e => {
      e.preventDefault();
      const boton = $('enviarAuth');
      const correo = correoNormal($('correoUsuario').value);
      const pass = $('claveUsuario').value;
      const nombre = limpiar($('nombreUsuario').value);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return msg('Ingresa un correo válido.');
      if (pass.length < 8) return msg('La contraseña debe tener al menos 8 caracteres.');
      boton.disabled = true;
      msg('Comprobando los datos…');
      try {
        const lista = leer();
        const existente = lista.find(u => u.correo === correo);
        if (registrar) {
          if (existente) throw new Error('Este correo ya está registrado en este navegador.');
          if (!nombre) throw new Error('Escribe tu nombre.');
          const sal = nuevaSal();
          const huella = await claveDerivada(pass, sal);
          const id = crypto.randomUUID ? crypto.randomUUID() : 'u-' + hexadecimal(crypto.getRandomValues(new Uint8Array(16)).buffer);
          const cuenta = { id, nombre, correo, sal, huella };
          localStorage.setItem(CUENTAS, JSON.stringify([...lista, cuenta]));
          crearSesion(cuenta);
        } else {
          if (!existente) throw new Error('Correo o contraseña incorrectos.');
          const huella = await claveDerivada(pass, existente.sal);
          if (huella !== existente.huella) throw new Error('Correo o contraseña incorrectos.');
          crearSesion(existente);
        }
      } catch (error) {
        msg(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
        boton.disabled = false;
      }
    };
    $('entrarInvitado').onclick = () => {
      try { crearSesion({ id: 'invitado' }); } catch (_) { msg('El navegador bloquea el almacenamiento de sesión.'); }
    };
    $('cerrarSesion').onclick = () => {
      if (Chanka.Editor.sucio() && !G.confirm('Tienes cambios sin guardar. ¿Cerrar sesión y descartarlos?')) return;
      if (Chanka.Manos) Chanka.Manos.detener();
      sessionStorage.removeItem(SESION);
      G.location.reload();
    };
  }
  Chanka.Auth = { iniciar };
})(typeof window !== 'undefined' ? window : globalThis);
