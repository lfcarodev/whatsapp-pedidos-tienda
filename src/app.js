const { iniciarBot } = require("./whatsapp/client");
const readline = require("readline");

iniciarBot();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(
  "\n========================================================",
  "\n INICIANDO BOT DE LA TIENDA",
  "\n========================================================",
  "\n Escribe la palabra 'salir' y presiona Enter para apagar el bot de forma segura.\n",
);

rl.on("line", (input) => {
  if (input.trim().toLowerCase() === "salir") {
    console.log("\n Cerrando la conexión directa con WhatsApp...");
    console.log(" Programa terminado. Ya puedes cerrar esta terminal.");
    process.exit(0);
  }
});
