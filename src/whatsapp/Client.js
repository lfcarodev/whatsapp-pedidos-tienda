const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

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
  const contact = await message.getContact();
  const chat = await message.getChat();

  console.log("\n==============================");
  console.log("📦 NUEVO PEDIDO / MENSAJE");
  console.log("Cliente:", contact.pushname || contact.name || "Sin nombre");
  console.log("Chat:", chat.name || "Sin nombre");
  console.log("Mensaje:", message.body);
  console.log("==============================\n");
});

module.exports = client;