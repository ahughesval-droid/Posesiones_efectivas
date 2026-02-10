# Sistema de Posesión Efectiva - Chile

Sistema completo para generar solicitudes de Posesión Efectiva ante el Servicio de Registro Civil e Identificación de Chile.

## 🚀 Características

- **Formulario web completo** con todas las secciones del formulario oficial
- **Generación automática de PDF** que completa el formulario oficial del Registro Civil
- **Interfaz moderna y responsive** que funciona en desktop y móvil
- **Sistema de borradores** para guardar y continuar después
- **Cálculo automático de totales** de bienes y masa hereditaria
- **Validaciones** de campos requeridos

## 📋 Secciones del Formulario

1. **Datos Personales**
   - Datos de oficina
   - Datos del solicitante
   - Datos del causante (fallecido)
   - Partida de defunción
   - Último domicilio del causante
   - Régimen patrimonial
   - Datos del representante (opcional)

2. **Herederos**
   - Hasta 20 herederos con todos sus datos
   - Calidad de heredero (Cónyuge, Hijo, Nieto, etc.)
   - Observaciones adicionales

3. **Bienes (Activos)**
   - Bienes raíces (hasta 4)
   - Vehículos (hasta 4)
   - Menaje (hasta 11 items)
   - Otros bienes muebles (hasta 4)
   - Otros bienes financieros (hasta 3)

4. **Pasivos**
   - Deudas acreditadas (hasta 4)
   - Declaración de impuesto a las herencias
   - Resumen de masa hereditaria

## 🛠️ Instalación

### Requisitos
- Node.js 18 o superior
- npm

### Pasos

```bash
# 1. Descomprimir el archivo
unzip posesion-efectiva-backend.zip
cd posesion-efectiva

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📖 Uso

1. Abra el navegador en `http://localhost:3000`
2. Complete el formulario por secciones usando las pestañas
3. Use los botones para agregar herederos, bienes y pasivos según necesite
4. Haga clic en "Generar PDF" para descargar el formulario completado
5. Opcionalmente, use "Guardar Borrador" para continuar después

## 🔧 API

### POST /api/generar-pdf
Genera el PDF completado con los datos del formulario.

**Request Body:** JSON con todos los datos del formulario
**Response:** Archivo PDF

### POST /api/guardar-borrador
Guarda un borrador del formulario.

**Request Body:** JSON con los datos del formulario
**Response:** `{ success: true, filename: "borrador_xxx.json" }`

### GET /api/borradores
Lista todos los borradores guardados.

**Response:** Array de objetos con filename y fecha de creación

### GET /api/cargar-borrador/:filename
Carga un borrador específico.

**Response:** JSON con los datos del formulario guardado

## 📁 Estructura del Proyecto

```
posesion-efectiva/
├── server.js           # Servidor Express y lógica de PDF
├── package.json        # Dependencias del proyecto
├── public/
│   └── index.html      # Formulario web completo
├── template/
│   └── Formulario_de_Posesion_Efectiva-2-1.pdf  # PDF oficial
└── borradores/         # Carpeta de borradores (se crea automáticamente)
```

## ⚙️ Configuración

El servidor usa el puerto 3000 por defecto. Para cambiar el puerto:

```bash
PORT=8080 npm start
```

## 🔒 Notas de Seguridad

- Este sistema es para uso interno/local
- No exponer directamente a Internet sin protección adicional
- Los borradores se guardan en texto plano en el servidor

## 📝 Licencia

Uso interno - TotalAbogados

---

Desarrollado para automatizar la generación de solicitudes de Posesión Efectiva en Chile.
