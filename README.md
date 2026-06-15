# Sistema de Automatización de Pedidos

Sistema de automatización de pedidos para tiendas de barrio mediante WhatsApp/WhatsApp Business.

El sistema recibe mensajes desde WhatsApp, agrupa mensajes enviados por un mismo cliente, interpreta el pedido mediante Inteligencia Artificial y genera una versión estructurada lista para impresión en una impresora térmica.

## Características Principales

- Conexión ultraligera con WhatsApp mediante WebSockets (Baileys)
- Autenticación persistente sin depender de navegadores web
- Agrupación automática de mensajes del cliente
- Ignora grupos, estados y archivos multimedia para ahorrar memoria
- Filtrado de mensajes antiguos al iniciar
- Procesamiento de pedidos mediante IA (Gemini)
- Preparación de pedidos para impresión térmica
- Cierre de sesión seguro por consola

## Requisitos Previos

Antes de instalar, asegúrate de tener en tu máquina:

- Node.js
- Los drivers de la impresora térmica POS80 correctamente instalados.
- Una API Key válida de Google Gemini.

## Instalación y Configuración

1. **Clonar el repositorio:**

   ```bash
   git clone [link]
   cd whatsapp-pedidos-tienda/
   ```

2. **Instalar las dependencias:**

   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Crea un archivo llamado `.env` en la raíz del proyecto y agrega tu clave de Gemini:

   ```env
   GEMINI_API_KEY=tu_clave_secreta_aqui
   ```

4. **Crear el ejecutable de inicio (.bat)**

5. Abre el **Bloc de notas** en tu computadora.
6. Copia y pega el siguiente código:

```bat
@echo off
if not "%1"=="max" (
    start "" /max cmd /c "%~f0" max
    exit
)

title Sistema de Pedidos - WhatsApp
cd %USERPROFILE%\Desktop\whatsapp-pedidos-tienda

node --no-deprecation src/app.js

pause
```

8. Ve a Archivo > Guardar como.
9. En "Tipo", selecciona "Todos los archivos".
10. Ponle de nombre Iniciar_Bot.bat (asegúrate de que termine en .bat y no en .txt).
11. Guárdalo en escritorio o en la misma ruta donde clonaste el repositorio.

¡Listo! Ahora, cada vez que abras la tienda, solo tienes que hacer doble clic en ese archivo Iniciar_Bot.bat para poner el bot en marcha.

## Uso del Sistema

Para arrancar el bot en el día a día, simplemente ejecuta el archivo por lotes preparado:

1. Haz doble clic en **`Iniciar_Bot.bat`** (o ejecuta `node app.js` en la consola).
2. Si es la primera vez, escanea el código QR con el WhatsApp de la tienda.
3. Espera el mensaje de `WhatsApp conectado correctamente`.

## Comandos de Consola

- **`salir`**: Escribe esta palabra en la consola y presiona Enter para desconectar y apagar el bot de forma 100% segura, manteniendo la sesión intacta para el próximo inicio.

## Estructura del Proyecto

- `app.js` - Punto de entrada y gestión del cierre seguro por consola.
- `src/whatsapp/client.js` - Lógica principal, filtros de mensajes y conexión a WhatsApp vía WebSockets.
- `src/services/gemini.js` - Prompts estructurados y conexión con la IA.
- `src/printer/printer.js` - Generación de tickets e impresión en la POS80.

## Autor

@lfcarodev
