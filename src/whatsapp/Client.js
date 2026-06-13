const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
const {
  estructurarPedido,
  crearTicketVisual,
} = require("../services/gemini.js");
const { imprimirTicket } = require("../printer/printer.js");

const clientesEnEspera = new Map();

const pathContactos = path.join(__dirname, "../../contactos.json");
let contactosGuardados = {};

if (fs.existsSync(pathContactos)) {
  try {
    const datosRaw = JSON.parse(fs.readFileSync(pathContactos));
    for (const key in datosRaw) {
      if (typeof datosRaw[key] === "string") {
        contactosGuardados[key] = { nombre: datosRaw[key], origen: "agenda" };
      } else {
        contactosGuardados[key] = datosRaw[key];
      }
    }
  } catch (e) {
    console.error("Error leyendo contactos.json, iniciando vacío", e);
    contactosGuardados = {};
  }
}

function guardarContactos() {
  fs.writeFileSync(pathContactos, JSON.stringify(contactosGuardados, null, 2));
}

function registrarNombre(id, nombre, origen = "agenda") {
  if (!id || !nombre) return false;
  if (id.endsWith("@g.us") || id === "status@broadcast") return false;
  if (nombre.startsWith("+") || /^\d+$/.test(nombre.replace(/\s+/g, "")))
    return false;

  const idLimpio = jidNormalizedUser(id);
  const registroExistente = contactosGuardados[idLimpio];

  if (registroExistente) {
    if (registroExistente.origen === "agenda" && origen === "pushName") {
      return false;
    }
    if (
      registroExistente.nombre === nombre &&
      registroExistente.origen === origen
    ) {
      return false;
    }
  }

  contactosGuardados[idLimpio] = { nombre, origen };
  return true;
}

function procesarContactos(contacts) {
  if (!contacts) return;
  let huboCambios = false;

  for (const contacto of contacts) {
    const nombreReal = contacto.name || contacto.verifiedName;
    if (nombreReal) {
      if (registrarNombre(contacto.id, nombreReal, "agenda"))
        huboCambios = true;
      if (contacto.lid && registrarNombre(contacto.lid, nombreReal, "agenda"))
        huboCambios = true;
    }
  }
  if (huboCambios) guardarContactos();
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_tienda");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: ["Bot de la Tienda", "Chrome", "1.0.0"],
    syncFullHistory: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messaging-history.set", ({ chats, contacts }) => {
    if (contacts) procesarContactos(contacts);

    if (chats) {
      let huboCambiosChats = false;
      chats.forEach((ch) => {
        if (ch.name) {
          if (registrarNombre(ch.id, ch.name, "agenda"))
            huboCambiosChats = true;
          if (ch.lid && registrarNombre(ch.lid, ch.name, "agenda"))
            huboCambiosChats = true;
        }
      });
      if (huboCambiosChats) guardarContactos();
    }
  });

  sock.ev.on("contacts.upsert", (contacts) => {
    if (contacts) procesarContactos(contacts);
  });

  sock.ev.on("chats.upsert", (chats) => {
    let huboCambios = false;
    chats.forEach((ch) => {
      if (ch.name) {
        if (registrarNombre(ch.id, ch.name, "agenda")) huboCambios = true;
        if (ch.lid && registrarNombre(ch.lid, ch.name, "agenda"))
          huboCambios = true;
      }
    });
    if (huboCambios) guardarContactos();
  });

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
        `\n Conexión cerrada. Razón: ${codigoError}. Reconectando: ${debeReconectarse}`,
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
    const jidLimpio = jidNormalizedUser(jid);

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

    if (msg.pushName) {
      if (registrarNombre(jidLimpio, msg.pushName, "pushName")) {
        guardarContactos();
      }
    }

    let nombreCliente = "Sin nombre";

    if (contactosGuardados[jidLimpio]) {
      nombreCliente = contactosGuardados[jidLimpio].nombre;
    } else if (msg.pushName) {
      nombreCliente = msg.pushName;
    } else {
      nombreCliente = `+${jidLimpio.split("@")[0]}`;
    }

    console.log(
      `\n [ALERTA] Entró un mensaje de ${nombreCliente}. Texto: "${texto}"`,
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
    }, 30000);
  });
}

module.exports = { iniciarBot };
