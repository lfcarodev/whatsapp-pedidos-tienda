require("dotenv").config();
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

  const prompt = `
    Eres el asistente de ventas de una tienda. Tu tarea es leer el mensaje de un cliente y extraer el pedido en un formato JSON estricto.
    
    Reglas:
    1. Si el cliente menciona su método de pago, anótalo. Si no, pon "Pendiente".
    2. Si el mensaje es solo un saludo o una pregunta sin intención de compra, pon "es_pedido": false.
    3. Si el cliente pide por valor monetario (ej: '15000 de carne', '1000 de cebollin'), pon el número exacto en 'cantidad' y el producto en 'nombre'.
    4. Si el cliente especifica tamaños, envases, cortes o marcas (ej: 'pequeño', 'botella', 'en lonchas pequeñas', 'Colgate'), inclúyelos TODOS directamente en el 'nombre'. 
    
    Estructura JSON obligatoria (NUNCA agregues un campo de notas):
    {
      "es_pedido": true o false,
      "metodo_pago": "Efectivo" | "Transferencia" | "Pendiente",
      "productos": [
        { "cantidad": "ej: 15000, 1 botella, 2, 500g", "nombre": "ej: carne blanda, aceite mediano, tomates, cerdo en lonchas pequeñas" }
      ]
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
