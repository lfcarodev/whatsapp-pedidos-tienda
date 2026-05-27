require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("No se encontró GEMINI_API_KEY en el archivo .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function estructurarPedido(textoCliente) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
    Eres el asistente de ventas de una tienda. Tu tarea es leer el mensaje de un cliente y extraer el pedido en un formato JSON estricto.
    
    Reglas:
    1. Corrige la ortografía de los productos.
    2. Si el cliente menciona su método de pago, anótalo. Si no, pon "Pendiente".
    3. Si el mensaje es solo un saludo o una pregunta sin intención de compra, pon "es_pedido": false.
    4. Si hace saber como quiere algo deja notas (ej: "el cerdo en lonchas pequeñas", "las papas que no sean tan grandes"), ponlo en "notas".
    
    Estructura JSON obligatoria:
    {
      "es_pedido": true o false,
      "metodo_pago": "Efectivo" | "Transferencia" | "Pendiente",
      "productos": [
        { "cantidad": "ej: 1kg, 2, 500g", "nombre": "nombre limpio del producto" }
      ],
      "notas": "notas adicionales o preguntas, vacío si no hay"
    }

    Mensaje del cliente: "${textoCliente}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("❌ Error al procesar con Gemini:", error);
    return null;
  }
}

function crearTicketVisual(pedidoJSON, nombreCliente) {
  let ticket = `============================\n`;
  ticket += `NUEVO PEDIDO\n`;
  ticket += `============================\n`;
  ticket += `Cliente: ${nombreCliente}\n`;
  ticket += `Pago: ${pedidoJSON.metodo_pago}\n`;
  ticket += `----------------------------\n`;

  pedidoJSON.productos.forEach((item) => {
    ticket += `▪ ${item.cantidad} x ${item.nombre}\n`;
  });

  if (pedidoJSON.notas) {
    ticket += `----------------------------\n`;
    ticket += `Notas:\n${pedidoJSON.notas}\n`;
  }
  ticket += `============================\n`;

  return ticket;
}

module.exports = {
  estructurarPedido,
  crearTicketVisual,
};
