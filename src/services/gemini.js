require("dotenv").config({ quiet: true });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("No se encontró GEMINI_API_KEY en el archivo .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function estructurarPedido(textoCliente) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `Actúa como el sistema automatizado de una tienda. Tu única tarea es convertir el mensaje del cliente en un objeto JSON estricto y válido.

REGLAS:
1. "es_pedido": true (si está pidiendo) o false (si es solo saludo/pregunta).
2. "metodo_pago": Usa "Efectivo", "Transferencia", o "Pendiente" si no lo menciona.
3. Cantidades monetarias: Si piden por valor (ej. "15000 de carne"), pon "15000" en cantidad y el producto en nombre.
4. Nombres descriptivos: Une marcas, cortes o tamaños al nombre (ej. "carne blanda en lonchas", "aceite botella mediana").
5. REGLA DE ORO: Devuelve ÚNICAMENTE el JSON. Cero texto extra, cero explicaciones y NO uses bloques de código con comillas invertidas (\`\`\`json).

ESTRUCTURA EXACTA:
{
  "es_pedido": boolean,
  "metodo_pago": string,
  "productos": [
    { "cantidad": string, "nombre": string }
  ]
}

MENSAJE DEL CLIENTE: "${textoCliente}"`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error(" Error al procesar con Gemini:", error);
    return null;
  }
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
