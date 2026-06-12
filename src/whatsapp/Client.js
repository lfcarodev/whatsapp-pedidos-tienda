const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const {
  estructurarPedido,
  crearTicketVisual,
} = require("../services/gemini.js");
const { imprimirTicket } = require("../printer/printer.js");

const clientesEnEspera = new Map();

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_tienda");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: ["Bot de la Tienda", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n Escanea este QR desde el WhatsApp de la tienda:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const codigoError = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const debeReconectarse = codigoError !== DisconnectReason.loggedOut;

      console.log(
        `\n Conexion cerrada, Razon: ${codigoError}. Reconectando: ${debeReconectarse}`,
      );

      if (debeReconectarse) {
        iniciarBot();
      }
    } else if (connection === "open") {
      console.log("\n=============================================");
      console.log(" WHATSAPP CONECTADO CORRECTAMENTE");
      console.log("=============================================\n");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;

    if (jid === "status@broadcast" || jid.endsWith("@g.us")) {
      return;
    }

    const tipoMensaje = Object.keys(msg.message)[0];
    if (
      tipoMensaje !== "conversation" &&
      tipoMensaje !== "extendedTextMessage"
    ) {
      return;
    }

    const textoRaw =
      msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!textoRaw || textoRaw.trim() === "") return;
    const texto = textoRaw.trim();

    const minMax = 15;
    const ahoraEnSegundos = Math.floor(Date.now() / 1000);
    const limitePasadoEnSegundos = ahoraEnSegundos - minMax * 60;
    const mensajeTimestamp = msg.messageTimestamp;

    if (mensajeTimestamp < limitePasadoEnSegundos) {
      console.log("Mensaje antiguo ignorado");
      return;
    }

    const nombreCliente = msg.pushName || jid.split("@")[0] || "Sin nombre";

    console.log(
      `\n [ALERTA] Entro un mensaje de ${nombreCliente}. Texto: "${texto}"`,
    );

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

      console.log(`\n Analizando el pedido de ${nombreCliente} con Gemini...`);

      try {
        const pedidoEstructurado = await estructurarPedido(mensajeCompleto);

        if (pedidoEstructurado && pedidoEstructurado.es_pedido) {
          const ticketLindo = crearTicketVisual(
            pedidoEstructurado,
            nombreCliente,
          );

          console.log("\n" + ticketLindo);
          imprimirTicket(ticketLindo);
        } else {
          console.log(` El mensaje de ${nombreCliente} no era un pedido.`);
        }
      } catch (error) {
        console.error(" Error en el proceso final:", error);
      }

      clientesEnEspera.delete(nombreCliente);
    }, 40000);
  });
}

module.exports = { iniciarBot };
