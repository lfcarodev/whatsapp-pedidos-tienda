require("dotenv").config({ quiet: true });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("No se encontró GEMINI_API_KEY en el archivo .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const modelLite = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: { responseMimeType: "application/json" },
});

const modelFlash = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

async function estructurarPedido(textoCliente) {
  const prompt = `Actúa como el sistema automatizado de una tienda. Tu única tarea es convertir el mensaje del cliente en un objeto JSON estricto y válido.

REGLAS:
1. "es_pedido": true (si está pidiendo) o false (si es solo saludo/pregunta).
2. "metodo_pago": Usa "Efectivo", "Transferencia"(Si dice "nequi" o "neki" o "neqi") usar "Transferencia", o "Pendiente" si no lo menciona.
3. Cantidades monetarias: Si piden por valor (ej. "15000 de carne"), pon "15000" en cantidad y el producto en nombre.
4. Nombres descriptivos: Une marcas, cortes o tamaños al nombre (ej. "carne blanda en lonchas", "aceite botella mediana").
5. Ojo: Cuando el cliente paga en efectivo,se le pregunta de cuanto es el billete, puede responder "de a 20", "billete de 50", o "billete de 20.000", esto NO es un producto.
6. REGLA DE ORO: Devuelve ÚNICAMENTE el JSON. Cero texto extra, cero explicaciones y NO uses bloques de código con comillas invertidas (\`\`\`json).

ESTRUCTURA EXACTA:
{
  "es_pedido": boolean,
  "metodo_pago": string,
  "productos": [
    { "cantidad": string, "nombre": string }
  ]
}

MENSAJE DEL CLIENTE: "${textoCliente}"`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await modelLite.generateContent(prompt);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error) {
      const esSaturacion =
        error.status === 503 ||
        (error.message && error.message.includes("503"));

      if (esSaturacion && attempt < 3) {
        console.log(
          `\n Lite saturado (503). Reintentando en 3s... (Intento ${attempt} de 3)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        console.log(
          `\n El modelo Lite falló definitivamente tras ${attempt} intentos. Pasando al Plan B...`,
        );
        break;
      }
    }
  }

  console.log(
    `\n Activando modelo Flash (Estándar) para asegurar el pedido...`,
  );
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await modelFlash.generateContent(prompt);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error) {
      const esSaturacion =
        error.status === 503 ||
        (error.message && error.message.includes("503"));

      if (esSaturacion && attempt < 3) {
        console.log(
          `\n Flash saturado (503). Reintentando en 3s... (Intento ${attempt} de 3)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        console.error(
          `\n Error crítico: Ambos modelos fallaron. Último error:`,
          error.message,
        );
        return null;
      }
    }
  }

  return null;
}

function crearTicketVisual(pedidoJSON, nombreCliente) {
  let ticket = `Cliente: ${nombreCliente}\n`;
  ticket += `Pago: ${pedidoJSON.metodo_pago}\n`;
  ticket += `----------------------------\n`;

  pedidoJSON.productos.forEach((item) => {
    ticket += `- ${item.cantidad} x ${item.nombre}\n`;
  });

  ticket += `============================\n`;

  let ticketLimpio = ticket
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .replace(/Ñ/gi, "N");

  return ticketLimpio;
}

module.exports = {
  estructurarPedido,
  crearTicketVisual,
};
