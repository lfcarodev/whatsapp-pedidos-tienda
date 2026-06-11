const client = require("./whatsapp/client");
const readline = require("readline");

client.initialize();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(
  "\n Escribe la palabra 'salir' y presiona Enter para apagar el bot de forma segura.",
);

rl.on("line", async (input) => {
  if (input.trim().toLowerCase() === "salir") {
    console.log("\n Cerrando el navegador y guardando la sesión local...");

    if (client) {
      try {
        await client.destroy();
        console.log(
          " Navegador cerrado. La sesión se mantuvo guardada.",
        );
      } catch (error) {
        console.error(" Hubo un problema al cerrar:", error.message);
      }
    }

    console.log(" Programa terminado. Ya puedes cerrar esta ventana.");
    process.exit(0);
  }
});
