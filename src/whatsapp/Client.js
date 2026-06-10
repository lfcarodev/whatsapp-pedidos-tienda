//const { Client, LocalAuth } = require("whatsapp-web.js");
const { Client, NoAuth } = require("whatsapp-web.js");
//const { guardarPedido } = require("../pedidos.js");
const qrcode = require("qrcode-terminal");
const clientesEnEspera = new Map();
const {
  estructurarPedido,
  crearTicketVisual,
} = require("../services/gemini.js");
const { imprimirTicket } = require("../printer/printer.js");

const client = new Client({
  authStrategy: new NoAuth(),
  //authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-extensions"],
  },
});

client.on("loading_screen", (percent, message) => {
  console.log("Cargando:", percent, message);
});

client.on("qr", (qr) => {
  console.log("Escanea este QR desde WhatsApp:\n");
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("🔐 Autenticado correctamente");
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado correctamente");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falló autenticación:", msg);
});

client.on("message", async (message) => {
  if (message.from === "status@broadcast" || message.from.endsWith("@g.us")) {
    return;
  }

  if (!message.body || message.body.trim() === "") return;

  console.log(
    `\n🔔 [ALERTA] Entró un mensaje de ${message.from}. Texto: "${message.body}"`,
  );

  const verifyChatfrom = await message.getChat();

  const MINUTOS_MAXIMOS_ANTIGUEDAD = 15;
  const ahoraEnSegundos = Math.floor(Date.now() / 1000);
  const limitePasadoEnSegundos =
    ahoraEnSegundos - MINUTOS_MAXIMOS_ANTIGUEDAD * 60;

  if (message.timestamp < limitePasadoEnSegundos) {
    console.log("Mensaje antiguo ignorado");
    return;
  }

  const contact = await message.getContact();
  const chat = await message.getChat();
  const nombreCliente =
    chat.name || contact.pushname || contact.name || "Sin nombre";
  const texto = message.body.trim();

  if (clientesEnEspera.has(nombreCliente)) {
    const datos = clientesEnEspera.get(nombreCliente);

    clearTimeout(datos.temporizador);

    datos.mensajes.push(texto);
  } else {
    clientesEnEspera.set(nombreCliente, {
      mensajes: [texto],
      temporizador: null,
    });
  }

  const datosCliente = clientesEnEspera.get(nombreCliente);

  datosCliente.temporizador = setTimeout(async () => {
    const mensajeCompleto = datosCliente.mensajes.join("\n");

    console.log(`\n🤖 Analizando el pedido de ${nombreCliente} con Gemini...`);

    try {
      const pedidoEstructurado = await estructurarPedido(mensajeCompleto);

      if (pedidoEstructurado && pedidoEstructurado.es_pedido) {
        const ticketLindo = crearTicketVisual(
          pedidoEstructurado,
          nombreCliente,
        );

        console.log("\n" + ticketLindo);

        imprimirTicket(ticketLindo);

        /*await guardarPedido({
          cliente: nombreCliente,
          ticket_impresion: ticketLindo,
          datos_crudos: pedidoEstructurado,
          fecha: new Date().toISOString(),
        });*/
      } else {
        console.log(
          `ℹ️ El mensaje de ${nombreCliente} no era un pedido o falló el análisis.`,
        );
      }
    } catch (error) {
      console.error("❌ Error en el proceso final:", error);
    }

    clientesEnEspera.delete(nombreCliente);
  }, 45000);
});

module.exports = client;
