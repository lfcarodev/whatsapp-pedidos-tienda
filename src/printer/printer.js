const fs = require("fs");

function imprimirTicket(textoTicket) {
  const printerPath = "\\\\localhost\\POS80";

  try {
    const comandoLetraGrande = "\x1D\x21\x01";
    const comandoCorte = "\x1D\x56\x00";
    const ticketCompleto =
      comandoLetraGrande + textoTicket + "\n\n\n\n\n" + comandoCorte;

    fs.writeFileSync(printerPath, ticketCompleto, "utf8");

    console.log(" ¡Ticket enviado a la impresora con éxito!");
  } catch (error) {
    console.error(" Error al intentar imprimir el ticket:", error.message);
  }
}

module.exports = {
  imprimirTicket,
};
