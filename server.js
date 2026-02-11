const express = require('express');
const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

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
  if (!value && value !== 0) return '';
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
  const tinyFontSize = 6;
  
  // Helper para dibujar texto en páginas rotadas 90°
  const drawTextRotated = (page, text, imgX, imgY, options = {}) => {
    if (!text && text !== 0) return;
    const { size = fontSize, font = helveticaFont, color = rgb(0, 0, 0) } = options;
    
    // Dimensiones de imagen de referencia
    const imgWidth = 1000;
    const imgHeight = 772;
    
    // Dimensiones reales del PDF (rotado)
    const pageWidth = 792;
    const pageHeight = 612;
    
    const scaleX = pageHeight / imgWidth;
    const scaleY = pageWidth / imgHeight;
    
    const pdfX = imgY * scaleY;
    const pdfY = (imgWidth - imgX) * scaleX;
    
    page.drawText(String(text), {
      x: pdfX,
      y: pdfY,
      size,
      font,
      color,
      rotate: degrees(90)
    });
  };
  
  // ===== PÁGINA 1 =====
  const page1 = pages[0];
  
  // Encabezado
  drawTextRotated(page1, formData.oficina || '', 135, 42);
  drawTextRotated(page1, formData.numero || '', 295, 42);
  drawTextRotated(page1, formData.fecha || '', 375, 42);
  drawTextRotated(page1, formData.hora || '', 450, 42);
  
  // DATOS DEL SOLICITANTE
  const sol = formData.solicitante || {};
  const rutSol = formatRut(sol.rut);
  drawTextRotated(page1, rutSol.numero, 565, 52);
  drawTextRotated(page1, rutSol.dv, 640, 52);
  drawTextRotated(page1, sol.nacionalidad || '1', 780, 52, { size: smallFontSize });
  drawTextRotated(page1, sol.nombres || '', 565, 70);
  drawTextRotated(page1, sol.primer_apellido || '', 565, 85);
  drawTextRotated(page1, sol.segundo_apellido || '', 565, 100);
  drawTextRotated(page1, sol.calle || '', 565, 118, { size: smallFontSize });
  drawTextRotated(page1, sol.numero_calle || '', 740, 118);
  drawTextRotated(page1, sol.letra || '', 780, 118);
  drawTextRotated(page1, sol.resto_domicilio || '', 565, 135, { size: smallFontSize });
  drawTextRotated(page1, sol.comuna || '', 565, 152);
  drawTextRotated(page1, sol.region || '', 700, 152);
  drawTextRotated(page1, sol.medio_contacto || '1', 565, 175, { size: smallFontSize });
  drawTextRotated(page1, sol.correo || '', 655, 175, { size: tinyFontSize });
  drawTextRotated(page1, sol.telefono || '', 790, 175, { size: smallFontSize });
  
  // DATOS DEL CAUSANTE
  const cau = formData.causante || {};
  const rutCau = formatRut(cau.rut);
  const fechaNac = formatDate(cau.fecha_nacimiento);
  const fechaDef = formatDate(cau.fecha_defuncion);
  
  drawTextRotated(page1, rutCau.numero, 90, 80);
  drawTextRotated(page1, rutCau.dv, 155, 80);
  drawTextRotated(page1, fechaNac.dd, 260, 80);
  drawTextRotated(page1, fechaNac.mm, 300, 80);
  drawTextRotated(page1, fechaNac.aaaa, 340, 80);
  drawTextRotated(page1, cau.nombres || '', 65, 105);
  drawTextRotated(page1, cau.primer_apellido || '', 65, 120);
  drawTextRotated(page1, cau.segundo_apellido || '', 65, 138);
  drawTextRotated(page1, fechaDef.dd, 65, 160);
  drawTextRotated(page1, fechaDef.mm, 105, 160);
  drawTextRotated(page1, fechaDef.aaaa, 145, 160);
  drawTextRotated(page1, cau.estado_civil || '', 280, 160, { size: smallFontSize });
  drawTextRotated(page1, cau.nacionalidad || '1', 395, 160, { size: smallFontSize });
  drawTextRotated(page1, cau.actividad || '', 115, 182, { size: smallFontSize });
  
  // PARTIDA DE DEFUNCIÓN
  const part = formData.partida || {};
  drawTextRotated(page1, part.circunscripcion || '', 90, 208, { size: smallFontSize });
  drawTextRotated(page1, part.tipo_registro || '', 248, 208, { size: smallFontSize });
  drawTextRotated(page1, part.ano || '', 410, 208);
  drawTextRotated(page1, part.n_inscripcion || '', 90, 225);
  drawTextRotated(page1, part.lugar_defuncion || '', 248, 225, { size: smallFontSize });
  
  // ÚLTIMO DOMICILIO DEL CAUSANTE
  const domCau = formData.domicilio_causante || {};
  drawTextRotated(page1, domCau.calle || '', 65, 250, { size: smallFontSize });
  drawTextRotated(page1, domCau.numero || '', 355, 250);
  drawTextRotated(page1, domCau.letra || '', 415, 250);
  drawTextRotated(page1, domCau.resto || '', 95, 268, { size: smallFontSize });
  drawTextRotated(page1, domCau.comuna || '', 65, 288);
  drawTextRotated(page1, domCau.region || '', 310, 288);
  
  // RÉGIMEN PATRIMONIAL
  drawTextRotated(page1, formData.regimen_patrimonial || '', 170, 318, { size: smallFontSize });
  drawTextRotated(page1, formData.subinscripciones || '', 380, 318, { size: smallFontSize });
  
  // DATOS DEL REPRESENTANTE
  const rep = formData.representante || {};
  if (rep.rut) {
    const rutRep = formatRut(rep.rut);
    drawTextRotated(page1, rutRep.numero, 565, 210);
    drawTextRotated(page1, rutRep.dv, 640, 210);
    drawTextRotated(page1, rep.tipo || '', 750, 210, { size: smallFontSize });
    drawTextRotated(page1, rep.cesionario || '2', 800, 210, { size: smallFontSize });
    drawTextRotated(page1, rep.nombres || '', 565, 230, { size: smallFontSize });
    drawTextRotated(page1, rep.primer_apellido || '', 565, 248, { size: smallFontSize });
    drawTextRotated(page1, rep.segundo_apellido || '', 565, 265, { size: smallFontSize });
    drawTextRotated(page1, rep.calle || '', 565, 283, { size: tinyFontSize });
    drawTextRotated(page1, rep.numero_calle || '', 740, 283);
    drawTextRotated(page1, rep.letra || '', 780, 283);
    drawTextRotated(page1, rep.resto_domicilio || '', 565, 300, { size: tinyFontSize });
    drawTextRotated(page1, rep.comuna || '', 565, 320, { size: smallFontSize });
    drawTextRotated(page1, rep.region || '', 700, 320, { size: smallFontSize });
    drawTextRotated(page1, rep.documento_fundante || '', 565, 345, { size: smallFontSize });
    drawTextRotated(page1, rep.autorizante || '', 675, 345, { size: smallFontSize });
    drawTextRotated(page1, rep.fecha_doc || '', 790, 345, { size: smallFontSize });
    drawTextRotated(page1, rep.correo || '', 565, 365, { size: tinyFontSize });
    drawTextRotated(page1, rep.telefono || '', 790, 365, { size: smallFontSize });
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
    
    drawTextRotated(page1, (i + 1).toString(), 32, herederoY, { size: tinyFontSize });
    drawTextRotated(page1, `${rutH.numero}-${rutH.dv}`, 55, herederoY, { size: tinyFontSize });
    drawTextRotated(page1, h.nombres || '', 138, herederoY, { size: tinyFontSize });
    drawTextRotated(page1, h.primer_apellido || '', 228, herederoY, { size: tinyFontSize });
    drawTextRotated(page1, h.segundo_apellido || '', 318, herederoY, { size: tinyFontSize });
    drawTextRotated(page1, fechaNacH, 408, herederoY, { size: 5 });
    drawTextRotated(page1, fechaDefH, 473, herederoY, { size: 5 });
    drawTextRotated(page1, h.calidad || '', 538, herederoY, { size: tinyFontSize });
    drawTextRotated(page1, h.run_representacion || '', 608, herederoY, { size: 5 });
    drawTextRotated(page1, h.domicilio || '', 680, herederoY, { size: 5 });
    drawTextRotated(page1, h.comuna || '', 775, herederoY, { size: 5 });
    drawTextRotated(page1, h.region || '', 845, herederoY, { size: 5 });
    drawTextRotated(page1, h.cedente || '', 925, herederoY, { size: tinyFontSize });
    
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
    
    drawTextRotated(page2, (i + 1).toString(), 32, herederoY, { size: tinyFontSize });
    drawTextRotated(page2, `${rutH.numero}-${rutH.dv}`, 55, herederoY, { size: tinyFontSize });
    drawTextRotated(page2, h.nombres || '', 138, herederoY, { size: tinyFontSize });
    drawTextRotated(page2, h.primer_apellido || '', 228, herederoY, { size: tinyFontSize });
    drawTextRotated(page2, h.segundo_apellido || '', 318, herederoY, { size: tinyFontSize });
    drawTextRotated(page2, fechaNacH, 408, herederoY, { size: 5 });
    drawTextRotated(page2, fechaDefH, 473, herederoY, { size: 5 });
    drawTextRotated(page2, h.calidad || '', 538, herederoY, { size: tinyFontSize });
    drawTextRotated(page2, h.run_representacion || '', 608, herederoY, { size: 5 });
    drawTextRotated(page2, h.domicilio || '', 680, herederoY, { size: 5 });
    drawTextRotated(page2, h.comuna || '', 775, herederoY, { size: 5 });
    drawTextRotated(page2, h.region || '', 845, herederoY, { size: 5 });
    drawTextRotated(page2, h.cedente || '', 925, herederoY, { size: tinyFontSize });
    
    herederoY += 19;
  }
  
  // Observaciones
  if (formData.observaciones) {
    drawTextRotated(page2, formData.observaciones, 50, 405, { size: tinyFontSize });
  }
  
  // ===== PÁGINA 3 - INVENTARIO =====
  const page3 = pages[2];
  
  // Encabezado
  drawTextRotated(page3, formData.oficina || '', 145, 57);
  drawTextRotated(page3, formData.numero || '', 330, 57);
  drawTextRotated(page3, formData.fecha || '', 455, 57);
  drawTextRotated(page3, formData.hora || '', 545, 57);
  
  // Calcular número de hojas basado en cantidad de items
  const bienesRaices = formData.bienes_raices || [];
  const vehiculos = formData.vehiculos || [];
  const menaje = formData.menaje || [];
  const otrosMuebles = formData.otros_muebles || [];
  const otrosBienes = formData.otros_bienes || [];
  const pasivos = formData.pasivos || [];
  
  const totalItems = bienesRaices.length + vehiculos.length + menaje.length + 
                     otrosMuebles.length + otrosBienes.length;
  const numHojas = Math.max(1, Math.ceil(totalItems / 15));
  
  drawTextRotated(page3, formData.inventario_hojas || numHojas.toString(), 882, 35);
  drawTextRotated(page3, formData.beneficio_inventario || '1', 895, 60, { size: smallFontSize });
  drawTextRotated(page3, formData.presuncion_20 || '2', 935, 105, { size: smallFontSize });
  
  // BIENES RAÍCES - sin límite
  let brY = 148;
  let totalBR = 0;
  let totalExBR = 0;
  const maxBRPage3 = 4;
  
  for (let i = 0; i < bienesRaices.length; i++) {
    const br = bienesRaices[i];
    if (!br) continue;
    totalBR += parseInt(br.valoracion) || 0;
    totalExBR += parseInt(br.exencion) || 0;
    
    if (i < maxBRPage3) {
      drawTextRotated(page3, (i + 1).toString(), 32, brY, { size: tinyFontSize });
      drawTextRotated(page3, br.tipo || '', 55, brY, { size: tinyFontSize });
      drawTextRotated(page3, br.rol_sii || '', 80, brY, { size: tinyFontSize });
      drawTextRotated(page3, br.comuna || '', 148, brY, { size: 5 });
      drawTextRotated(page3, br.fecha_adquisicion || '', 228, brY, { size: 5 });
      drawTextRotated(page3, br.fojas || '', 298, brY, { size: tinyFontSize });
      drawTextRotated(page3, br.numero_cbr || '', 343, brY, { size: tinyFontSize });
      drawTextRotated(page3, br.ano_cbr || '', 393, brY, { size: tinyFontSize });
      drawTextRotated(page3, br.conservador || '', 430, brY, { size: 5 });
      drawTextRotated(page3, br.ps || 'P', 498, brY, { size: tinyFontSize });
      drawTextRotated(page3, formatMoney(br.valoracion) || '', 525, brY, { size: tinyFontSize });
      drawTextRotated(page3, formatMoney(br.exencion) || '', 575, brY, { size: tinyFontSize });
      brY += 17;
    }
  }
  
  if (bienesRaices.length > maxBRPage3) {
    drawTextRotated(page3, `(+${bienesRaices.length - maxBRPage3} más en anexo)`, 80, brY, { size: 5 });
  }
  
  drawTextRotated(page3, formatMoney(totalBR), 525, 216);
  drawTextRotated(page3, formatMoney(totalExBR), 575, 216);
  
  // VEHÍCULOS - sin límite
  let vehY = 248;
  let totalVeh = 0;
  const maxVehPage3 = 4;
  
  for (let i = 0; i < vehiculos.length; i++) {
    const v = vehiculos[i];
    if (!v) continue;
    totalVeh += parseInt(v.valoracion) || 0;
    
    if (i < maxVehPage3) {
      drawTextRotated(page3, (i + 1).toString(), 32, vehY, { size: tinyFontSize });
      drawTextRotated(page3, v.ppu || '', 55, vehY, { size: tinyFontSize });
      drawTextRotated(page3, v.codigo_sii || '', 110, vehY, { size: tinyFontSize });
      drawTextRotated(page3, v.tipo || '', 158, vehY, { size: 5 });
      drawTextRotated(page3, v.marca || '', 203, vehY, { size: 5 });
      drawTextRotated(page3, v.modelo || '', 260, vehY, { size: 5 });
      drawTextRotated(page3, v.ano || '', 320, vehY, { size: tinyFontSize });
      drawTextRotated(page3, v.n_identificacion || '', 365, vehY, { size: 5 });
      drawTextRotated(page3, v.ps || 'P', 448, vehY, { size: tinyFontSize });
      drawTextRotated(page3, formatMoney(v.valoracion) || '', 478, vehY, { size: tinyFontSize });
      vehY += 18;
    }
  }
  
  if (vehiculos.length > maxVehPage3) {
    drawTextRotated(page3, `(+${vehiculos.length - maxVehPage3} más)`, 80, vehY, { size: 5 });
  }
  
  drawTextRotated(page3, formatMoney(totalVeh), 350, 320);
  
  // MENAJE - manejar presunción del 20%
  let totalMenaje = 0;
  const usaPresuncion = formData.presuncion_20 === '1';
  
  if (usaPresuncion && bienesRaices.length > 0) {
    // Calcular 20% del primer bien raíz
    const valorPrimerBR = parseInt(bienesRaices[0].valoracion) || 0;
    totalMenaje = Math.round(valorPrimerBR * 0.20);
    drawTextRotated(page3, '1', 605, 125, { size: tinyFontSize });
    drawTextRotated(page3, 'Presunción 20% bien raíz', 630, 125, { size: 5 });
    drawTextRotated(page3, 'P', 785, 125, { size: tinyFontSize });
    drawTextRotated(page3, formatMoney(totalMenaje), 815, 125, { size: tinyFontSize });
  } else {
    // Menaje manual - sin límite
    let menY = 125;
    const maxMenPage3 = 11;
    
    for (let i = 0; i < menaje.length; i++) {
      const m = menaje[i];
      if (!m) continue;
      totalMenaje += parseInt(m.valoracion) || 0;
      
      if (i < maxMenPage3) {
        drawTextRotated(page3, (i + 1).toString(), 605, menY, { size: tinyFontSize });
        drawTextRotated(page3, m.descripcion || '', 630, menY, { size: 5 });
        drawTextRotated(page3, m.ps || 'P', 785, menY, { size: tinyFontSize });
        drawTextRotated(page3, formatMoney(m.valoracion) || '', 815, menY, { size: tinyFontSize });
        menY += 15;
      }
    }
    
    if (menaje.length > maxMenPage3) {
      drawTextRotated(page3, `(+${menaje.length - maxMenPage3} más)`, 630, menY, { size: 5 });
    }
  }
  
  drawTextRotated(page3, formatMoney(totalMenaje), 815, 320);
  
  // OTROS BIENES MUEBLES (C2) - sin límite
  let omY = 460;
  let totalOM = 0;
  const maxOMPage3 = 4;
  
  for (let i = 0; i < otrosMuebles.length; i++) {
    const om = otrosMuebles[i];
    if (!om) continue;
    totalOM += parseInt(om.valoracion) || 0;
    
    if (i < maxOMPage3) {
      drawTextRotated(page3, (i + 1).toString(), 32, omY, { size: tinyFontSize });
      drawTextRotated(page3, om.descripcion || '', 60, omY, { size: 5 });
      drawTextRotated(page3, om.ps || 'P', 315, omY, { size: tinyFontSize });
      drawTextRotated(page3, formatMoney(om.valoracion) || '', 345, omY, { size: tinyFontSize });
      omY += 17;
    }
  }
  
  if (otrosMuebles.length > maxOMPage3) {
    drawTextRotated(page3, `(+${otrosMuebles.length - maxOMPage3} más)`, 60, omY, { size: 5 });
  }
  
  drawTextRotated(page3, formatMoney(totalOM), 240, 530);
  
  // OTROS BIENES - acciones (C3) - sin límite
  let obY = 368;
  let totalOB = 0;
  let totalExOB = 0;
  const maxOBPage3 = 3;
  
  for (let i = 0; i < otrosBienes.length; i++) {
    const ob = otrosBienes[i];
    if (!ob) continue;
    totalOB += parseInt(ob.valoracion) || 0;
    totalExOB += parseInt(ob.exencion) || 0;
    
    if (i < maxOBPage3) {
      drawTextRotated(page3, (i + 1).toString(), 445, obY, { size: tinyFontSize });
      drawTextRotated(page3, ob.descripcion || '', 470, obY, { size: 5 });
      drawTextRotated(page3, ob.institucion || '', 570, obY, { size: 5 });
      drawTextRotated(page3, ob.n_certificado || '', 635, obY, { size: 5 });
      drawTextRotated(page3, ob.ps || 'P', 695, obY, { size: tinyFontSize });
      drawTextRotated(page3, formatMoney(ob.valoracion) || '', 725, obY, { size: tinyFontSize });
      drawTextRotated(page3, formatMoney(ob.exencion) || '', 795, obY, { size: tinyFontSize });
      obY += 17;
    }
  }
  
  if (otrosBienes.length > maxOBPage3) {
    drawTextRotated(page3, `(+${otrosBienes.length - maxOBPage3} más)`, 470, obY, { size: 5 });
  }
  
  drawTextRotated(page3, formatMoney(totalOB), 670, 425);
  drawTextRotated(page3, formatMoney(totalExOB), 740, 425);
  
  // ===== PÁGINA 4 =====
  const page4 = pages[3];
  
  // Encabezado
  drawTextRotated(page4, formData.oficina || '', 245, 52);
  drawTextRotated(page4, formData.numero || '', 530, 52);
  drawTextRotated(page4, formData.fecha || '', 645, 52);
  drawTextRotated(page4, formData.hora || '', 745, 52);
  
  // PASIVOS - sin límite
  let pasY = 115;
  let totalPasivos = 0;
  const maxPasPage4 = 4;
  
  for (let i = 0; i < pasivos.length; i++) {
    const p = pasivos[i];
    if (!p) continue;
    totalPasivos += parseInt(p.valoracion) || 0;
    
    if (i < maxPasPage4) {
      drawTextRotated(page4, (i + 1).toString(), 32, pasY, { size: tinyFontSize });
      drawTextRotated(page4, p.descripcion || '', 60, pasY, { size: 5 });
      drawTextRotated(page4, p.acreedor || '', 400, pasY, { size: 5 });
      drawTextRotated(page4, p.n_documento || '', 535, pasY, { size: 5 });
      drawTextRotated(page4, formatMoney(p.valoracion) || '', 680, pasY, { size: tinyFontSize });
      pasY += 20;
    }
  }
  
  if (pasivos.length > maxPasPage4) {
    drawTextRotated(page4, `(+${pasivos.length - maxPasPage4} más en anexo)`, 60, pasY, { size: 5 });
  }
  
  drawTextRotated(page4, formatMoney(totalPasivos), 680, 205);
  
  // Cálculos de arancel
  const totalActivos = totalBR + totalVeh + totalMenaje + totalOM + totalOB;
  const masaHereditaria = totalActivos - totalPasivos;
  
  drawTextRotated(page4, formatMoney(totalActivos), 250, 270);
  drawTextRotated(page4, formatMoney(totalPasivos), 250, 295);
  drawTextRotated(page4, formatMoney(masaHereditaria), 250, 320);
  
  // Declaración exento/afecto
  const causanteNombre = `${cau.nombres || ''} ${cau.primer_apellido || ''} ${cau.segundo_apellido || ''}`.trim();
  drawTextRotated(page4, causanteNombre, 600, 280, { size: tinyFontSize });
  
  // Marcar checkbox según declaración
  const decl = formData.declaracion_impuesto || 'exentas';
  if (decl === 'exentas') {
    drawTextRotated(page4, 'X', 470, 355);
  } else if (decl === 'afectas_algunas') {
    drawTextRotated(page4, 'X', 470, 380);
  } else if (decl === 'afectas_todas') {
    drawTextRotated(page4, 'X', 470, 405);
  }
  
  // ===== PÁGINAS ANEXAS para items adicionales =====
  const needsAnnex = bienesRaices.length > 4 || vehiculos.length > 4 || 
                     (!usaPresuncion && menaje.length > 11) || otrosMuebles.length > 4 || 
                     otrosBienes.length > 3 || pasivos.length > 4;
  
  if (needsAnnex) {
    const annexPage = pdfDoc.addPage([792, 612]);
    let yPos = 580;
    const lineHeight = 12;
    
    annexPage.drawText('ANEXO - CONTINUACIÓN DE INVENTARIO', {
      x: 250,
      y: yPos,
      size: 12,
      font: helveticaBold
    });
    yPos -= 25;
    
    // Bienes Raíces adicionales
    if (bienesRaices.length > 4) {
      annexPage.drawText('A1. BIENES RAÍCES (continuación):', { x: 50, y: yPos, size: 10, font: helveticaBold });
      yPos -= 15;
      for (let i = 4; i < bienesRaices.length; i++) {
        const br = bienesRaices[i];
        const text = `${i+1}. ${br.tipo || ''} - ROL: ${br.rol_sii || ''} - ${br.comuna || ''} - $${formatMoney(br.valoracion)}`;
        annexPage.drawText(text, { x: 60, y: yPos, size: 8, font: helveticaFont });
        yPos -= lineHeight;
        if (yPos < 50) {
          yPos = 580;
          pdfDoc.addPage([792, 612]);
        }
      }
      yPos -= 10;
    }
    
    // Vehículos adicionales
    if (vehiculos.length > 4) {
      annexPage.drawText('B1. VEHÍCULOS (continuación):', { x: 50, y: yPos, size: 10, font: helveticaBold });
      yPos -= 15;
      for (let i = 4; i < vehiculos.length; i++) {
        const v = vehiculos[i];
        const text = `${i+1}. ${v.ppu || ''} - ${v.marca || ''} ${v.modelo || ''} ${v.ano || ''} - $${formatMoney(v.valoracion)}`;
        annexPage.drawText(text, { x: 60, y: yPos, size: 8, font: helveticaFont });
        yPos -= lineHeight;
      }
      yPos -= 10;
    }
    
    // Menaje adicional
    if (!usaPresuncion && menaje.length > 11) {
      annexPage.drawText('B2. MENAJE (continuación):', { x: 50, y: yPos, size: 10, font: helveticaBold });
      yPos -= 15;
      for (let i = 11; i < menaje.length; i++) {
        const m = menaje[i];
        const text = `${i+1}. ${m.descripcion || ''} - $${formatMoney(m.valoracion)}`;
        annexPage.drawText(text, { x: 60, y: yPos, size: 8, font: helveticaFont });
        yPos -= lineHeight;
      }
      yPos -= 10;
    }
    
    // Otros muebles adicionales
    if (otrosMuebles.length > 4) {
      annexPage.drawText('C2. OTROS BIENES MUEBLES (continuación):', { x: 50, y: yPos, size: 10, font: helveticaBold });
      yPos -= 15;
      for (let i = 4; i < otrosMuebles.length; i++) {
        const om = otrosMuebles[i];
        const text = `${i+1}. ${om.descripcion || ''} - $${formatMoney(om.valoracion)}`;
        annexPage.drawText(text, { x: 60, y: yPos, size: 8, font: helveticaFont });
        yPos -= lineHeight;
      }
      yPos -= 10;
    }
    
    // Otros bienes adicionales
    if (otrosBienes.length > 3) {
      annexPage.drawText('C3. OTROS BIENES (continuación):', { x: 50, y: yPos, size: 10, font: helveticaBold });
      yPos -= 15;
      for (let i = 3; i < otrosBienes.length; i++) {
        const ob = otrosBienes[i];
        const text = `${i+1}. ${ob.descripcion || ''} - ${ob.institucion || ''} - $${formatMoney(ob.valoracion)}`;
        annexPage.drawText(text, { x: 60, y: yPos, size: 8, font: helveticaFont });
        yPos -= lineHeight;
      }
      yPos -= 10;
    }
    
    // Pasivos adicionales
    if (pasivos.length > 4) {
      annexPage.drawText('2. PASIVOS (continuación):', { x: 50, y: yPos, size: 10, font: helveticaBold });
      yPos -= 15;
      for (let i = 4; i < pasivos.length; i++) {
        const p = pasivos[i];
        const text = `${i+1}. ${p.descripcion || ''} - ${p.acreedor || ''} - $${formatMoney(p.valoracion)}`;
        annexPage.drawText(text, { x: 60, y: yPos, size: 8, font: helveticaFont });
        yPos -= lineHeight;
      }
    }
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

// API para guardar borrador (JSON) - con nombre personalizado
app.post('/api/guardar-borrador', (req, res) => {
  try {
    console.log('Recibido para guardar:', JSON.stringify(req.body, null, 2).substring(0, 500));
    
    // Extraer datos correctamente
    let formData, nombre;
    if (req.body.data) {
      // Formato: { data: {...}, nombre: "..." }
      formData = req.body.data;
      nombre = req.body.nombre;
    } else {
      // Formato directo: los datos vienen directamente
      formData = req.body;
      nombre = null;
    }
    
    // Generar nombre de archivo
    let filename;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    if (nombre && nombre.trim()) {
      const safeName = nombre.trim().replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '').substring(0, 50);
      filename = `${safeName}_${timestamp}.json`;
    } else {
      const causante = formData.causante || {};
      const apellido = (causante.primer_apellido || '').trim();
      const nombres = (causante.nombres || '').trim();
      const nombreCausante = apellido || nombres ? `${apellido}_${nombres}`.replace(/\s+/g, '_').replace(/_+$/, '') : 'sin_nombre';
      filename = `borrador_${nombreCausante}_${timestamp}.json`;
    }
    
    // Crear directorio si no existe
    const borradorDir = path.join(__dirname, 'borradores');
    if (!fs.existsSync(borradorDir)) {
      fs.mkdirSync(borradorDir, { recursive: true });
    }
    
    const filepath = path.join(borradorDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(formData, null, 2));
    
    console.log('Borrador guardado en:', filepath);
    res.json({ success: true, filename });
  } catch (error) {
    console.error('Error guardando borrador:', error);
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
      .map(f => {
        const stat = fs.statSync(path.join(borradorDir, f));
        const content = JSON.parse(fs.readFileSync(path.join(borradorDir, f), 'utf8'));
        const causante = content.causante || {};
        return {
          filename: f,
          created: stat.birthtime,
          modified: stat.mtime,
          causante: `${causante.nombres || ''} ${causante.primer_apellido || ''} ${causante.segundo_apellido || ''}`.trim() || 'Sin nombre'
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar borradores', details: error.message });
  }
});

// API para eliminar borrador
app.delete('/api/borrador/:filename', (req, res) => {
  try {
    const filepath = path.join(__dirname, 'borradores', req.params.filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Borrador no encontrado' });
    }
    fs.unlinkSync(filepath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar borrador', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Posesión Efectiva corriendo en http://localhost:${PORT}`);
  console.log('📝 Formulario disponible en la ruta principal');
  console.log('📄 API de generación de PDF en POST /api/generar-pdf');
});
