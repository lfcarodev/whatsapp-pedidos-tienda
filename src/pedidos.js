const fs = require("fs");
const path = require("path");

const pedidosPath = path.join(__dirname, "../data/pedidos.json");

function guardarPedido(pedido) {
  let pedidos = [];
  const carpetaPath = path.dirname(pedidosPath);

  if (!fs.existsSync(carpetaPath)) {
    fs.mkdirSync(carpetaPath, { recursive: true });
  }

  if (fs.existsSync(pedidosPath)) {
    const data = fs.readFileSync(pedidosPath, "utf8");
    try {
      pedidos = JSON.parse(data);
    } catch {
      pedidos = [];
    }
  }
  pedidos.push(pedido);

  fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2), "utf8");
  console.log("💾 Pedido estructurado guardado con éxito en JSON.");
}

module.exports = {
  guardarPedido,
};
