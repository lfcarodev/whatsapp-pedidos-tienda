const { Client, LocalAuth } = require("whatsapp-web.js");
const { guardarPedido } = require("../pedidos");
const qrcode = require("qrcode-terminal");
const clientesEnEspera = new Map();

const client = new Client({
  authStrategy: new LocalAuth(),
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
  if (!message.body || message.body.trim() === "") return;

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

  datosCliente.temporizador = setTimeout(() => {
    const mensajeCompleto = datosCliente.mensajes.join("\n");

    console.log("\n==============================");
    console.log("📦 PEDIDO AGRUPADO");
    console.log("Cliente:", nombreCliente);
    console.log("Mensaje:\n", mensajeCompleto);
    console.log("==============================\n");

    guardarPedido({
      cliente: nombreCliente,
      mensaje: mensajeCompleto,
      fecha: new Date().toISOString(),
    });

    clientesEnEspera.delete(nombreCliente);
  }, 35000);
});

module.exports = client;
