const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client();

client.on("qr", (qr) => {
  console.log("Escanea este QR desde WhatsApp Business:\n");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado correctamente");
});

client.on("message", async (message) => {
  const contact = await message.getContact();

  console.log("\n---------------------------");
  console.log("📩 Nuevo mensaje");
  console.log(`Cliente: ${contact.pushname || contact.number}`);
  console.log(`Número: ${contact.number}`);
  console.log(`Mensaje: ${message.body}`);
  console.log("---------------------------\n");
});

module.exports = client;