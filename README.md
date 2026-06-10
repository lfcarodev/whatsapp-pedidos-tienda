# Bot de Pedidos por WhatsApp

Sistema de automatización de pedidos para tiendas de barrio mediante WhatsApp/WhatsApp Business.

El sistema recibe mensajes desde WhatsApp, agrupa mensajes enviados por un mismo cliente, interpreta el pedido mediante Inteligencia Artificial y genera una versión estructurada lista para impresión en una impresora térmica.

## Características Principales

* Conexión con WhatsApp mediante whatsapp-web.js
* Autenticación persistente con LocalAuth
* Agrupación automática de mensajes del cliente
* Ignora grupos y estados de WhatsApp
* Ignora mensajes vacíos
* Filtrado de mensajes antiguos al iniciar
* Procesamiento de pedidos mediante IA (Gemini)
* Preparación de pedidos para impresión térmica
* Cierre de sesion seguro

## Requisitos Previos

Antes de instalar, asegúrate de tener en tu máquina:
* [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada).
* Google Chrome instalado en su ruta por defecto.
* Los drivers de la impresora térmica POS80 correctamente instalados y configurados en Windows.
* Una API Key válida de Google Gemini.

## Instalación y Configuración

1. **Clonar el repositorio o descargar los archivos:**
   \`\`\`bash
   git clone [tu-repositorio]
   cd [nombre-de-tu-carpeta]
   \`\`\`

2. **Instalar las dependencias:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configurar Variables de Entorno:**
   Crea un archivo llamado `.env` en la raíz del proyecto y agrega tu clave de Gemini:
   \`\`\`env
   GEMINI_API_KEY=tu_clave_secreta_aqui
   \`\`\`

## Uso del Sistema

Para arrancar el bot en el día a día, simplemente ejecuta el archivo por lotes preparado:

1. Haz doble clic en **`Iniciar_Bot.bat`** (o ejecuta `node app.js` en la consola).
2. Si es la primera vez, escanea el código QR con el WhatsApp de la tienda.
3. Espera el mensaje de `WhatsApp conectado correctamente`. ¡El bot ya está escuchando!

## Comandos de Consola

* **`salir`**: Escribe esta palabra en la consola negra y presiona Enter para cerrar la sesión de WhatsApp, borrar la caché local y apagar el bot de forma 100% segura.

## Estructura del Proyecto

* `app.js` - Punto de entrada y gestión del cierre seguro por consola.
* `src/whatsapp/client.js` - Lógica principal, filtros de mensajes y conexión a WhatsApp Web.
* `src/services/gemini.js` - Prompts estructurados y conexión con la IA.
* `src/printer/printer.js` - Generación de tickets e impresión en la POS80.

## Autor

@lfcarodev