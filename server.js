const express = require('express');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Coordenadas de campos del formulario PDF (basadas en análisis visual)
// El PDF tiene páginas de 612x792 pts pero rotadas 90°, así que es 792x612 efectivos
const FIELD_COORDS = {
  page1: {
    // Encabezado
    oficina: { x: 135, y: 555 },
    numero: { x: 295, y: 555 },
    fecha: { x: 375, y: 555 },
    hora: { x: 450, y: 555 },
    
    // DATOS DEL SOLICITANTE (lado derecho)
    solicitante: {
      rut_numero: { x: 560, y: 555 },
      rut_dv: { x: 625, y: 555 },
      nacionalidad: { x: 745, y: 555 },
      nombres: { x: 560, y: 530 },
      primer_apellido: { x: 560, y: 510 },
      segundo_apellido: { x: 560, y: 490 },
      calle: { x: 560, y: 470 },
      numero_calle: { x: 710, y: 470 },
      letra: { x: 755, y: 470 },
      resto_domicilio: { x: 560, y: 450 },
      comuna: { x: 560, y: 430 },
      region: { x: 680, y: 430 },
      medio_contacto: { x: 560, y: 410 },
      correo: { x: 630, y: 410 },
      telefono: { x: 755, y: 410 }
    },
    
    // DATOS DEL CAUSANTE (lado izquierdo)
    causante: {
      rut_numero: { x: 90, y: 520 },
      rut_dv: { x: 155, y: 520 },
      fecha_nacimiento_dd: { x: 250, y: 520 },
      fecha_nacimiento_mm: { x: 290, y: 520 },
      fecha_nacimiento_aaaa: { x: 330, y: 520 },
      nombres: { x: 90, y: 495 },
      primer_apellido: { x: 90, y: 475 },
      segundo_apellido: { x: 90, y: 455 },
      fecha_defuncion_dd: { x: 90, y: 430 },
      fecha_defuncion_mm: { x: 130, y: 430 },
      fecha_defuncion_aaaa: { x: 170, y: 430 },
      estado_civil: { x: 280, y: 430 },
      nacionalidad: { x: 380, y: 430 },
      actividad: { x: 90, y: 400 }
    },
    
    // PARTIDA DE DEFUNCIÓN
    partida: {
      circunscripcion: { x: 90, y: 370 },
      tipo_registro: { x: 230, y: 370 },
      ano: { x: 400, y: 370 },
      n_inscripcion: { x: 90, y: 350 },
      lugar_defuncion: { x: 230, y: 350 }
    },
    
    // ÚLTIMO DOMICILIO DEL CAUSANTE
    domicilio_causante: {
      calle: { x: 90, y: 320 },
      numero: { x: 340, y: 320 },
      letra: { x: 400, y: 320 },
      resto: { x: 90, y: 300 },
      comuna: { x: 90, y: 280 },
      region: { x: 280, y: 280 }
    },
    
    // RÉGIMEN PATRIMONIAL
    regimen_patrimonial: { x: 170, y: 250 },
    subinscripciones: { x: 350, y: 250 },
    
    // DATOS DEL REPRESENTANTE (lado derecho inferior)
    representante: {
      rut_numero: { x: 560, y: 375 },
      rut_dv: { x: 625, y: 375 },
      tipo: { x: 720, y: 375 },
      cesionario: { x: 770, y: 375 },
      nombres: { x: 560, y: 355 },
      primer_apellido: { x: 560, y: 335 },
      segundo_apellido: { x: 560, y: 315 },
      calle: { x: 560, y: 295 },
      numero_calle: { x: 710, y: 295 },
      letra: { x: 755, y: 295 },
      resto_domicilio: { x: 560, y: 275 },
      comuna: { x: 560, y: 255 },
      region: { x: 680, y: 255 },
      documento_fundante: { x: 560, y: 235 },
      autorizante: { x: 650, y: 235 },
      fecha_doc: { x: 755, y: 235 },
      correo: { x: 560, y: 215 },
      telefono: { x: 755, y: 215 }
    },
    
    // HEREDEROS (filas 1-8) - coordenadas base y espaciado
    herederos: {
      startY: 175,
      rowHeight: 18,
      cols: {
        numero: 35,
        rut: 65,
        nombres: 145,
        primer_apellido: 225,
        segundo_apellido: 305,
        fecha_nacimiento: 395,
        fecha_defuncion: 455,
        calidad: 515,
        run_rep: 580,
        domicilio: 650,
        comuna: 705,
        region: 750,
        cedente: 780
      }
    }
  },
  
  page2: {
    // HEREDEROS continuación (filas 9-20)
    herederos: {
      startY: 530,
      rowHeight: 18,
      cols: {
        numero: 35,
        rut: 65,
        nombres: 145,
        primer_apellido: 225,
        segundo_apellido: 305,
        fecha_nacimiento: 395,
        fecha_defuncion: 455,
        calidad: 515,
        run_rep: 580,
        domicilio: 650,
        comuna: 705,
        region: 750,
        cedente: 780
      }
    },
    observaciones: { x: 50, y: 260, maxWidth: 700 }
  },
  
  page3: {
    // Encabezado
    oficina: { x: 150, y: 545 },
    numero: { x: 330, y: 545 },
    fecha: { x: 455, y: 545 },
    hora: { x: 545, y: 545 },
    inventario_hojas: { x: 745, y: 555 },
    beneficio_inventario: { x: 755, y: 530 },
    presuncion_20: { x: 775, y: 485 },
    
    // Bienes Raíces (A1)
    bienes_raices: {
      startY: 460,
      rowHeight: 15,
      cols: {
        numero: 35,
        tipo: 55,
        rol_sii: 85,
        comuna: 145,
        fecha_adq: 205,
        fojas: 265,
        numero_cbr: 305,
        ano_cbr: 345,
        conservador: 385,
        ps: 455,
        valoracion: 495,
        exencion: 565
      }
    },
    total_bienes_raices: { x: 495, y: 390 },
    
    // Vehículos (B1)
    vehiculos: {
      startY: 365,
      rowHeight: 15,
      cols: {
        numero: 35,
        ppu: 60,
        codigo_sii: 110,
        tipo: 165,
        marca: 205,
        modelo: 260,
        ano: 320,
        n_identificacion: 360,
        ps: 440,
        valoracion: 480
      }
    },
    total_vehiculos: { x: 350, y: 290 },
    
    // Menaje (B2)
    menaje: {
      startY: 460,
      rowHeight: 13,
      cols: {
        numero: 605,
        descripcion: 635,
        ps: 730,
        valoracion: 760
      }
    },
    total_menaje: { x: 760, y: 290 },
    
    // Bienes Inmuebles Excluidos (C1)
    inmuebles_excluidos: {
      startY: 260,
      rowHeight: 15,
      cols: {
        numero: 35,
        descripcion: 60,
        referencia: 230,
        ps: 280,
        valoracion: 310,
        exencion: 380
      }
    },
    total_inmuebles_excluidos: { x: 215, y: 195 },
    
    // Otros Bienes Muebles (C2)
    otros_muebles: {
      startY: 165,
      rowHeight: 15,
      cols: {
        numero: 35,
        descripcion: 60,
        ps: 310,
        valoracion: 350
      }
    },
    total_otros_muebles: { x: 250, y: 90 },
    
    // Otros Bienes - acciones, valores (C3)
    otros_bienes: {
      startY: 260,
      rowHeight: 15,
      cols: {
        numero: 440,
        descripcion: 465,
        institucion: 555,
        n_certificado: 615,
        ps: 660,
        valoracion: 695,
        exencion: 765
      }
    },
    total_otros_bienes: { x: 590, y: 195 },
    
    // Armas de fuego (C4)
    armas: {
      startY: 165,
      rowHeight: 15,
      cols: {
        numero: 440,
        descripcion: 465,
        ps: 630,
        valoracion: 670,
        hurto: 750
      }
    },
    total_armas: { x: 590, y: 90 }
  },
  
  page4: {
    // Encabezado
    oficina: { x: 245, y: 555 },
    numero: { x: 525, y: 555 },
    fecha: { x: 645, y: 555 },
    hora: { x: 745, y: 555 },
    
    // Pasivos
    pasivos: {
      startY: 485,
      rowHeight: 18,
      cols: {
        numero: 35,
        descripcion: 60,
        acreedor: 385,
        n_documento: 510,
        valoracion: 635
      }
    },
    total_pasivos: { x: 635, y: 395 },
    
    // Arancel
    total_activos: { x: 215, y: 335 },
    total_pasivos_calc: { x: 215, y: 315 },
    masa_hereditaria: { x: 215, y: 295 },
    valor_arancel: { x: 215, y: 265 },
    valor_utm: { x: 215, y: 245 },
    
    // Declaración
    nombre_causante_decl: { x: 595, y: 315 },
    exentas_todas: { x: 465, y: 280 },
    afectas_algunas: { x: 465, y: 260 },
    afectas_todas: { x: 465, y: 240 }
  }
};

// Función para formatear RUT
function formatRut(rut) {
  if (!rut) return { numero: '', dv: '' };
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return { numero: '', dv: '' };
  return {
    numero: clean.slice(0, -1),
    dv: clean.slice(-1).toUpperCase()
  };
}

// Función para formatear fecha
function formatDate(dateStr) {
  if (!dateStr) return { dd: '', mm: '', aaaa: '' };
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return { aaaa: parts[0], mm: parts[1], dd: parts[2] };
  }
  return { dd: '', mm: '', aaaa: '' };
}

// Función para formatear moneda
function formatMoney(value) {
  if (!value) return '';
  const num = parseInt(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('es-CL');
}

// Función principal para llenar el PDF
async function fillPDF(formData) {
  // Leer el PDF original
  const pdfPath = path.join(__dirname, 'template', 'Formulario_de_Posesion_Efectiva-2-1.pdf');
  const existingPdfBytes = fs.readFileSync(pdfPath);
  
  // Cargar el PDF
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pages = pdfDoc.getPages();
  const fontSize = 8;
  const smallFontSize = 7;
  
  // Las páginas están rotadas 90°, necesitamos ajustar coordenadas
  // Página original: 612x792, rotada: efectivamente 792x612
  
  // Helper para dibujar texto
  const drawText = (page, text, x, y, options = {}) => {
    if (!text && text !== 0) return;
    const { size = fontSize, font = helveticaFont, color = rgb(0, 0, 0) } = options;
    
    // Ajustar coordenadas para la rotación
    // El PDF está rotado 90° clockwise, así que:
    // x_pdf = y_original
    // y_pdf = width - x_original
    const pageWidth = 792;
    const pageHeight = 612;
    
    // Convertir de coordenadas de imagen (1000x772) a PDF (792x612)
    const scaleX = pageWidth / 1000;
    const scaleY = pageHeight / 772;
    
    const pdfX = x * scaleX;
    const pdfY = pageHeight - (y * scaleY);
    
    page.drawText(String(text), {
      x: pdfX,
      y: pdfY,
      size,
      font,
      color
    });
  };
  
  // ===== PÁGINA 1 =====
  const page1 = pages[0];
  
  // Encabezado
  drawText(page1, formData.oficina || '', 135, 42);
  drawText(page1, formData.numero || '', 295, 42);
  drawText(page1, formData.fecha || '', 375, 42);
  drawText(page1, formData.hora || '', 450, 42);
  
  // DATOS DEL SOLICITANTE
  const sol = formData.solicitante || {};
  const rutSol = formatRut(sol.rut);
  drawText(page1, rutSol.numero, 565, 52);
  drawText(page1, rutSol.dv, 640, 52);
  drawText(page1, sol.nacionalidad || '1', 780, 52);
  drawText(page1, sol.nombres || '', 565, 70);
  drawText(page1, sol.primer_apellido || '', 565, 85);
  drawText(page1, sol.segundo_apellido || '', 565, 100);
  drawText(page1, sol.calle || '', 565, 118);
  drawText(page1, sol.numero_calle || '', 740, 118);
  drawText(page1, sol.letra || '', 780, 118);
  drawText(page1, sol.resto_domicilio || '', 565, 135);
  drawText(page1, sol.comuna || '', 565, 152);
  drawText(page1, sol.region || '', 700, 152);
  drawText(page1, sol.medio_contacto || '1', 565, 175);
  drawText(page1, sol.correo || '', 640, 175, { size: 6 });
  drawText(page1, sol.telefono || '', 770, 175);
  
  // DATOS DEL CAUSANTE
  const cau = formData.causante || {};
  const rutCau = formatRut(cau.rut);
  const fechaNac = formatDate(cau.fecha_nacimiento);
  const fechaDef = formatDate(cau.fecha_defuncion);
  
  drawText(page1, rutCau.numero, 90, 80);
  drawText(page1, rutCau.dv, 155, 80);
  drawText(page1, fechaNac.dd, 260, 80);
  drawText(page1, fechaNac.mm, 300, 80);
  drawText(page1, fechaNac.aaaa, 340, 80);
  drawText(page1, cau.nombres || '', 65, 105);
  drawText(page1, cau.primer_apellido || '', 65, 120);
  drawText(page1, cau.segundo_apellido || '', 65, 138);
  drawText(page1, fechaDef.dd, 65, 160);
  drawText(page1, fechaDef.mm, 105, 160);
  drawText(page1, fechaDef.aaaa, 145, 160);
  drawText(page1, cau.estado_civil || '', 280, 160);
  drawText(page1, cau.nacionalidad || '1', 395, 160);
  drawText(page1, cau.actividad || '', 115, 182);
  
  // PARTIDA DE DEFUNCIÓN
  const part = formData.partida || {};
  drawText(page1, part.circunscripcion || '', 90, 208);
  drawText(page1, part.tipo_registro || '', 248, 208);
  drawText(page1, part.ano || '', 410, 208);
  drawText(page1, part.n_inscripcion || '', 90, 225);
  drawText(page1, part.lugar_defuncion || '', 248, 225);
  
  // ÚLTIMO DOMICILIO DEL CAUSANTE
  const domCau = formData.domicilio_causante || {};
  drawText(page1, domCau.calle || '', 65, 250);
  drawText(page1, domCau.numero || '', 355, 250);
  drawText(page1, domCau.letra || '', 415, 250);
  drawText(page1, domCau.resto || '', 95, 268);
  drawText(page1, domCau.comuna || '', 65, 288);
  drawText(page1, domCau.region || '', 310, 288);
  
  // RÉGIMEN PATRIMONIAL
  drawText(page1, formData.regimen_patrimonial || '', 170, 318);
  drawText(page1, formData.subinscripciones || '', 380, 318);
  
  // DATOS DEL REPRESENTANTE
  const rep = formData.representante || {};
  if (rep.rut) {
    const rutRep = formatRut(rep.rut);
    drawText(page1, rutRep.numero, 565, 210);
    drawText(page1, rutRep.dv, 640, 210);
    drawText(page1, rep.tipo || '', 750, 210);
    drawText(page1, rep.cesionario || '2', 800, 210);
    drawText(page1, rep.nombres || '', 565, 230);
    drawText(page1, rep.primer_apellido || '', 565, 248);
    drawText(page1, rep.segundo_apellido || '', 565, 265);
    drawText(page1, rep.calle || '', 565, 283);
    drawText(page1, rep.numero_calle || '', 740, 283);
    drawText(page1, rep.letra || '', 780, 283);
    drawText(page1, rep.resto_domicilio || '', 565, 300);
    drawText(page1, rep.comuna || '', 565, 320);
    drawText(page1, rep.region || '', 700, 320);
    drawText(page1, rep.documento_fundante || '', 565, 345);
    drawText(page1, rep.autorizante || '', 660, 345);
    drawText(page1, rep.fecha_doc || '', 780, 345);
    drawText(page1, rep.correo || '', 565, 365, { size: 6 });
    drawText(page1, rep.telefono || '', 770, 365);
  }
  
  // HEREDEROS (página 1, filas 1-8)
  const herederos = formData.herederos || [];
  let herederoY = 448;
  for (let i = 0; i < Math.min(8, herederos.length); i++) {
    const h = herederos[i];
    if (!h) continue;
    const rutH = formatRut(h.rut);
    const fechaNacH = h.fecha_nacimiento ? h.fecha_nacimiento.replace(/-/g, '/') : '';
    const fechaDefH = h.fecha_defuncion ? h.fecha_defuncion.replace(/-/g, '/') : '';
    
    drawText(page1, (i + 1).toString(), 32, herederoY, { size: smallFontSize });
    drawText(page1, `${rutH.numero}-${rutH.dv}`, 55, herederoY, { size: smallFontSize });
    drawText(page1, h.nombres || '', 138, herederoY, { size: smallFontSize });
    drawText(page1, h.primer_apellido || '', 228, herederoY, { size: smallFontSize });
    drawText(page1, h.segundo_apellido || '', 318, herederoY, { size: smallFontSize });
    drawText(page1, fechaNacH, 408, herederoY, { size: 6 });
    drawText(page1, fechaDefH, 473, herederoY, { size: 6 });
    drawText(page1, h.calidad || '', 538, herederoY, { size: smallFontSize });
    drawText(page1, h.run_representacion || '', 608, herederoY, { size: 6 });
    drawText(page1, h.domicilio || '', 680, herederoY, { size: 6 });
    drawText(page1, h.comuna || '', 755, herederoY, { size: 6 });
    drawText(page1, h.region || '', 815, herederoY, { size: 6 });
    drawText(page1, h.cedente || '', 875, herederoY, { size: smallFontSize });
    
    herederoY += 21;
  }
  
  // ===== PÁGINA 2 =====
  const page2 = pages[1];
  
  // HEREDEROS continuación (filas 9-20)
  herederoY = 75;
  for (let i = 8; i < Math.min(20, herederos.length); i++) {
    const h = herederos[i];
    if (!h) continue;
    const rutH = formatRut(h.rut);
    const fechaNacH = h.fecha_nacimiento ? h.fecha_nacimiento.replace(/-/g, '/') : '';
    const fechaDefH = h.fecha_defuncion ? h.fecha_defuncion.replace(/-/g, '/') : '';
    
    drawText(page2, (i + 1).toString(), 32, herederoY, { size: smallFontSize });
    drawText(page2, `${rutH.numero}-${rutH.dv}`, 55, herederoY, { size: smallFontSize });
    drawText(page2, h.nombres || '', 138, herederoY, { size: smallFontSize });
    drawText(page2, h.primer_apellido || '', 228, herederoY, { size: smallFontSize });
    drawText(page2, h.segundo_apellido || '', 318, herederoY, { size: smallFontSize });
    drawText(page2, fechaNacH, 408, herederoY, { size: 6 });
    drawText(page2, fechaDefH, 473, herederoY, { size: 6 });
    drawText(page2, h.calidad || '', 538, herederoY, { size: smallFontSize });
    drawText(page2, h.run_representacion || '', 608, herederoY, { size: 6 });
    drawText(page2, h.domicilio || '', 680, herederoY, { size: 6 });
    drawText(page2, h.comuna || '', 755, herederoY, { size: 6 });
    drawText(page2, h.region || '', 815, herederoY, { size: 6 });
    drawText(page2, h.cedente || '', 875, herederoY, { size: smallFontSize });
    
    herederoY += 19;
  }
  
  // Observaciones
  if (formData.observaciones) {
    drawText(page2, formData.observaciones, 50, 405, { size: 7 });
  }
  
  // ===== PÁGINA 3 - INVENTARIO =====
  const page3 = pages[2];
  
  // Encabezado
  drawText(page3, formData.oficina || '', 145, 57);
  drawText(page3, formData.numero || '', 330, 57);
  drawText(page3, formData.fecha || '', 455, 57);
  drawText(page3, formData.hora || '', 545, 57);
  drawText(page3, formData.inventario_hojas || '1', 852, 35);
  drawText(page3, formData.beneficio_inventario || '1', 855, 60);
  drawText(page3, formData.presuncion_20 || '2', 875, 105);
  
  // BIENES RAÍCES
  const bienesRaices = formData.bienes_raices || [];
  let brY = 148;
  let totalBR = 0;
  for (let i = 0; i < Math.min(4, bienesRaices.length); i++) {
    const br = bienesRaices[i];
    if (!br) continue;
    drawText(page3, (i + 1).toString(), 32, brY, { size: 6 });
    drawText(page3, br.tipo || '', 55, brY, { size: 6 });
    drawText(page3, br.rol_sii || '', 80, brY, { size: 6 });
    drawText(page3, br.comuna || '', 148, brY, { size: 6 });
    drawText(page3, br.fecha_adquisicion || '', 228, brY, { size: 6 });
    drawText(page3, br.fojas || '', 298, brY, { size: 6 });
    drawText(page3, br.numero_cbr || '', 343, brY, { size: 6 });
    drawText(page3, br.ano_cbr || '', 393, brY, { size: 6 });
    drawText(page3, br.conservador || '', 430, brY, { size: 6 });
    drawText(page3, br.ps || 'P', 498, brY, { size: 6 });
    drawText(page3, formatMoney(br.valoracion) || '', 525, brY, { size: 6 });
    drawText(page3, formatMoney(br.exencion) || '', 585, brY, { size: 6 });
    totalBR += parseInt(br.valoracion) || 0;
    brY += 17;
  }
  drawText(page3, formatMoney(totalBR), 525, 216);
  
  // VEHÍCULOS
  const vehiculos = formData.vehiculos || [];
  let vehY = 248;
  let totalVeh = 0;
  for (let i = 0; i < Math.min(4, vehiculos.length); i++) {
    const v = vehiculos[i];
    if (!v) continue;
    drawText(page3, (i + 1).toString(), 32, vehY, { size: 6 });
    drawText(page3, v.ppu || '', 55, vehY, { size: 6 });
    drawText(page3, v.codigo_sii || '', 110, vehY, { size: 6 });
    drawText(page3, v.tipo || '', 158, vehY, { size: 6 });
    drawText(page3, v.marca || '', 203, vehY, { size: 6 });
    drawText(page3, v.modelo || '', 260, vehY, { size: 6 });
    drawText(page3, v.ano || '', 320, vehY, { size: 6 });
    drawText(page3, v.n_identificacion || '', 365, vehY, { size: 6 });
    drawText(page3, v.ps || 'P', 448, vehY, { size: 6 });
    drawText(page3, formatMoney(v.valoracion) || '', 478, vehY, { size: 6 });
    totalVeh += parseInt(v.valoracion) || 0;
    vehY += 18;
  }
  drawText(page3, formatMoney(totalVeh), 330, 320);
  
  // MENAJE
  const menaje = formData.menaje || [];
  let menY = 125;
  let totalMenaje = 0;
  for (let i = 0; i < Math.min(11, menaje.length); i++) {
    const m = menaje[i];
    if (!m) continue;
    drawText(page3, (i + 1).toString(), 605, menY, { size: 6 });
    drawText(page3, m.descripcion || '', 630, menY, { size: 6 });
    drawText(page3, m.ps || 'P', 785, menY, { size: 6 });
    drawText(page3, formatMoney(m.valoracion) || '', 815, menY, { size: 6 });
    totalMenaje += parseInt(m.valoracion) || 0;
    menY += 15;
  }
  drawText(page3, formatMoney(totalMenaje), 815, 320);
  
  // OTROS BIENES MUEBLES (C2)
  const otrosMuebles = formData.otros_muebles || [];
  let omY = 460;
  let totalOM = 0;
  for (let i = 0; i < Math.min(4, otrosMuebles.length); i++) {
    const om = otrosMuebles[i];
    if (!om) continue;
    drawText(page3, (i + 1).toString(), 32, omY, { size: 6 });
    drawText(page3, om.descripcion || '', 60, omY, { size: 6 });
    drawText(page3, om.ps || 'P', 315, omY, { size: 6 });
    drawText(page3, formatMoney(om.valoracion) || '', 345, omY, { size: 6 });
    totalOM += parseInt(om.valoracion) || 0;
    omY += 17;
  }
  drawText(page3, formatMoney(totalOM), 240, 530);
  
  // OTROS BIENES - acciones (C3)
  const otrosBienes = formData.otros_bienes || [];
  let obY = 368;
  let totalOB = 0;
  for (let i = 0; i < Math.min(3, otrosBienes.length); i++) {
    const ob = otrosBienes[i];
    if (!ob) continue;
    drawText(page3, (i + 1).toString(), 445, obY, { size: 6 });
    drawText(page3, ob.descripcion || '', 470, obY, { size: 6 });
    drawText(page3, ob.institucion || '', 570, obY, { size: 6 });
    drawText(page3, ob.n_certificado || '', 635, obY, { size: 6 });
    drawText(page3, ob.ps || 'P', 695, obY, { size: 6 });
    drawText(page3, formatMoney(ob.valoracion) || '', 725, obY, { size: 6 });
    drawText(page3, formatMoney(ob.exencion) || '', 795, obY, { size: 6 });
    totalOB += parseInt(ob.valoracion) || 0;
    obY += 17;
  }
  drawText(page3, formatMoney(totalOB), 670, 425);
  
  // ===== PÁGINA 4 =====
  const page4 = pages[3];
  
  // Encabezado
  drawText(page4, formData.oficina || '', 245, 52);
  drawText(page4, formData.numero || '', 530, 52);
  drawText(page4, formData.fecha || '', 645, 52);
  drawText(page4, formData.hora || '', 745, 52);
  
  // PASIVOS
  const pasivos = formData.pasivos || [];
  let pasY = 115;
  let totalPasivos = 0;
  for (let i = 0; i < Math.min(4, pasivos.length); i++) {
    const p = pasivos[i];
    if (!p) continue;
    drawText(page4, (i + 1).toString(), 32, pasY, { size: 6 });
    drawText(page4, p.descripcion || '', 60, pasY, { size: 6 });
    drawText(page4, p.acreedor || '', 400, pasY, { size: 6 });
    drawText(page4, p.n_documento || '', 535, pasY, { size: 6 });
    drawText(page4, formatMoney(p.valoracion) || '', 680, pasY, { size: 6 });
    totalPasivos += parseInt(p.valoracion) || 0;
    pasY += 20;
  }
  drawText(page4, formatMoney(totalPasivos), 680, 205);
  
  // Cálculos de arancel
  const totalActivos = totalBR + totalVeh + totalMenaje + totalOM + totalOB;
  const masaHereditaria = totalActivos - totalPasivos;
  
  drawText(page4, formatMoney(totalActivos), 250, 270);
  drawText(page4, formatMoney(totalPasivos), 250, 295);
  drawText(page4, formatMoney(masaHereditaria), 250, 320);
  
  // Declaración exento/afecto
  const causanteNombre = `${cau.nombres || ''} ${cau.primer_apellido || ''} ${cau.segundo_apellido || ''}`.trim();
  drawText(page4, causanteNombre, 600, 280, { size: 6 });
  
  // Marcar checkbox según declaración
  const decl = formData.declaracion_impuesto || 'exentas';
  if (decl === 'exentas') {
    drawText(page4, 'X', 470, 355);
  } else if (decl === 'afectas_algunas') {
    drawText(page4, 'X', 470, 380);
  } else if (decl === 'afectas_todas') {
    drawText(page4, 'X', 470, 405);
  }
  
  // Guardar el PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Ruta principal - sirve el formulario HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para generar el PDF
app.post('/api/generar-pdf', async (req, res) => {
  try {
    const formData = req.body;
    console.log('Datos recibidos:', JSON.stringify(formData, null, 2));
    
    const pdfBytes = await fillPDF(formData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=posesion_efectiva_completada.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF', details: error.message });
  }
});

// API para guardar borrador (JSON)
app.post('/api/guardar-borrador', (req, res) => {
  try {
    const formData = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `borrador_${timestamp}.json`;
    const filepath = path.join(__dirname, 'borradores', filename);
    
    // Crear carpeta si no existe
    if (!fs.existsSync(path.join(__dirname, 'borradores'))) {
      fs.mkdirSync(path.join(__dirname, 'borradores'));
    }
    
    fs.writeFileSync(filepath, JSON.stringify(formData, null, 2));
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar borrador', details: error.message });
  }
});

// API para cargar borrador
app.get('/api/cargar-borrador/:filename', (req, res) => {
  try {
    const filepath = path.join(__dirname, 'borradores', req.params.filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Borrador no encontrado' });
    }
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar borrador', details: error.message });
  }
});

// API para listar borradores
app.get('/api/borradores', (req, res) => {
  try {
    const borradorDir = path.join(__dirname, 'borradores');
    if (!fs.existsSync(borradorDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(borradorDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        filename: f,
        created: fs.statSync(path.join(borradorDir, f)).birthtime
      }))
      .sort((a, b) => b.created - a.created);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar borradores', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Posesión Efectiva corriendo en http://localhost:${PORT}`);
  console.log('📝 Formulario disponible en la ruta principal');
  console.log('📄 API de generación de PDF en POST /api/generar-pdf');
});
