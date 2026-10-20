// CATÁLOGO DE PRENDAS
// Cada prenda es solo DATOS (no hay código complicado):
//   nombre   → texto que se ve en el botón
//   color    → color inicial de la tela
//   suave    → true: el contorno se redondea con curvas / false: líneas rectas
//   tension  → qué tan redondeado (0 a 1), solo si suave = true
//   puntos   → esquinas del contorno, en un lienzo de 800 x 800 (el centro es x = 400)
//   detalles → líneas decorativas (pliegues, cuellos, costuras): 4 puntos Bézier cada una
//
// ¿Quieres agregar una prenda nueva? Copia una de abajo, cambia los puntos
// y agrega su nombre en la lista "orden" del final. ¡Listo!
(function (G) {
  const Chanka = (G.Chanka = G.Chanka || {});

  // Atajos para escribir los detalles más rápido
  const pliegue = p => ({ p, color: '#1e120b', ancho: 5, op: 0.18 });
  const costura = (p, color = '#d9a749') => ({ p, color, ancho: 3, op: 1 });

  const lista = {
    poncho: {
      nombre: 'Poncho', color: '#805238', suave: true, tension: 0.7,
      puntos: [[325, 95], [400, 165], [475, 95], [590, 130], [700, 470], [720, 690],
               [560, 712], [400, 700], [240, 712], [80, 690], [100, 470], [210, 130]],
      detalles: [
        pliegue([[210, 140], [190, 300], [170, 500], [150, 690]]),
        pliegue([[590, 140], [610, 300], [630, 500], [650, 690]]),
        pliegue([[400, 165], [388, 320], [409, 520], [400, 700]]),
        costura([[325, 95], [350, 125], [375, 150], [400, 165]]),
        costura([[475, 95], [450, 125], [425, 150], [400, 165]]),
        costura([[85, 672], [240, 695], [560, 695], [715, 672]]),
      ],
    },
    manta: {
      nombre: 'Manta', color: '#8d3439', suave: true, tension: 0.5,
      puntos: [[100, 140], [400, 125], [700, 140], [695, 420], [700, 690], [400, 710], [100, 690], [105, 420]],
      detalles: [
        pliegue([[145, 160], [140, 310], [155, 495], [145, 675]]),
        pliegue([[310, 145], [298, 330], [325, 510], [310, 684]]),
        pliegue([[530, 140], [518, 370], [545, 520], [530, 694]]),
        costura([[110, 660], [290, 680], [500, 655], [690, 665]], '#e1c794'),
      ],
    },
    chompa: {
      nombre: 'Chompa', color: '#6c7458', suave: true, tension: 0.75,
      puntos: [[270, 115], [325, 85], [400, 155], [475, 85], [530, 115], [575, 190], [625, 430], [650, 645],
               [565, 670], [530, 435], [515, 340], [520, 700], [280, 700], [285, 340], [265, 435], [235, 670],
               [150, 645], [175, 430], [220, 190]],
      detalles: [
        pliegue([[273, 130], [290, 250], [295, 280], [285, 340]]),
        pliegue([[527, 130], [510, 250], [505, 280], [515, 340]]),
        costura([[326, 92], [350, 140], [375, 157], [400, 165]], '#d4c8ab'),
        costura([[400, 165], [425, 157], [450, 140], [474, 92]], '#d4c8ab'),
        costura([[282, 672], [350, 684], [450, 684], [518, 672]], '#d4c8ab'),
      ],
    },
    polera: {
      nombre: 'Polera', color: '#3c5663', suave: false, tension: 0,
      puntos: [[335, 100], [400, 145], [465, 100], [560, 120], [690, 250], [625, 322], [545, 265],
               [545, 700], [255, 700], [255, 265], [175, 322], [110, 250], [240, 120]],
      detalles: [
        costura([[335, 100], [355, 125], [375, 140], [400, 145]], '#e6d7b9'),
        costura([[465, 100], [445, 125], [425, 140], [400, 145]], '#e6d7b9'),
        costura([[258, 682], [330, 690], [470, 690], [542, 682]], '#e6d7b9'),
      ],
    },
    casaca: {
      nombre: 'Casaca', color: '#373733', suave: false, tension: 0,
      puntos: [[330, 100], [400, 128], [470, 100], [560, 120], [640, 200], [690, 640], [610, 652],
               [555, 330], [550, 690], [250, 690], [245, 330], [190, 652], [110, 640], [160, 200], [240, 120]],
      detalles: [
        costura([[400, 128], [400, 330], [400, 520], [400, 690]], '#d5b993'),
        costura([[330, 100], [350, 135], [380, 150], [400, 128]], '#d5b993'),
        costura([[470, 100], [450, 135], [420, 150], [400, 128]], '#d5b993'),
        pliegue([[300, 470], [300, 500], [350, 500], [350, 470]]),
        pliegue([[450, 470], [450, 500], [500, 500], [500, 470]]),
      ],
    },
    chaleco: {
      nombre: 'Chaleco', color: '#a35f46', suave: false, tension: 0,
      puntos: [[330, 90], [400, 210], [470, 90], [560, 120], [580, 300], [560, 690], [240, 690], [220, 300], [240, 120]],
      detalles: [
        costura([[400, 210], [400, 400], [400, 560], [400, 690]], '#e6d7b9'),
        costura([[330, 90], [350, 140], [380, 180], [400, 210]], '#e6d7b9'),
        costura([[470, 90], [450, 140], [420, 180], [400, 210]], '#e6d7b9'),
      ],
    },
    pantalon: {
      nombre: 'Pantalón', color: '#3c5663', suave: false, tension: 0,
      puntos: [[260, 90], [540, 90], [570, 720], [425, 720], [400, 290], [375, 720], [230, 720]],
      detalles: [
        costura([[260, 125], [330, 135], [470, 135], [540, 125]], '#e6d7b9'),
        costura([[400, 135], [400, 200], [400, 250], [400, 290]], '#e6d7b9'),
        pliegue([[300, 300], [292, 450], [296, 600], [290, 715]]),
        pliegue([[500, 300], [508, 450], [504, 600], [510, 715]]),
      ],
    },
    falda: {
      nombre: 'Falda', color: '#8d3439', suave: false, tension: 0,
      puntos: [[290, 110], [510, 110], [645, 680], [400, 705], [155, 680]],
      detalles: [
        costura([[290, 140], [350, 150], [450, 150], [510, 140]], '#e1c794'),
        pliegue([[340, 160], [320, 350], [290, 520], [260, 690]]),
        pliegue([[400, 160], [400, 350], [400, 520], [400, 705]]),
        pliegue([[460, 160], [480, 350], [510, 520], [540, 690]]),
        costura([[165, 650], [300, 672], [500, 672], [635, 650]], '#e1c794'),
      ],
    },
    vestido: {
      nombre: 'Vestido', color: '#bb9148', suave: false, tension: 0,
      puntos: [[320, 90], [360, 90], [400, 118], [440, 90], [480, 90], [515, 190], [520, 330],
               [650, 710], [400, 730], [150, 710], [280, 330], [285, 190]],
      detalles: [
        costura([[285, 330], [350, 345], [450, 345], [520, 330]], '#6c3a2a'),
        pliegue([[330, 350], [300, 480], [270, 600], [240, 715]]),
        pliegue([[400, 350], [400, 500], [400, 620], [400, 728]]),
        pliegue([[470, 350], [500, 480], [530, 600], [560, 715]]),
      ],
    },
    gorro: {
      nombre: 'Gorro', color: '#8b3447', suave: true, tension: 0.6,
      puntos: [[400, 165], [470, 185], [550, 260], [600, 400], [595, 540], [560, 690], [510, 690],
               [485, 540], [315, 540], [290, 690], [240, 690], [205, 540], [200, 400], [250, 260], [330, 185]],
      detalles: [
        costura([[205, 505], [300, 520], [500, 520], [595, 505]], '#e6d7b9'),
        pliegue([[400, 175], [400, 300], [400, 420], [400, 505]]),
        pliegue([[330, 195], [310, 300], [305, 400], [305, 505]]),
        pliegue([[470, 195], [490, 300], [495, 400], [495, 505]]),
      ],
    },
    libre: {
      nombre: 'Prenda libre', color: '#795337', suave: true, tension: 0.5,
      puntos: [[180, 140], [400, 130], [620, 140], [630, 420], [620, 700], [400, 710], [180, 700], [170, 420]],
      detalles: [],
    },
  };

  // Orden en que aparecen los botones
  const orden = ['poncho', 'manta', 'chompa', 'polera', 'casaca', 'chaleco', 'pantalon', 'falda', 'vestido', 'gorro', 'libre'];

  Chanka.Prendas = { lista, orden };
})(typeof window !== 'undefined' ? window : globalThis);
