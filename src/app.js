const client = require("./whatsapp/client");
const readline = require("readline");

client.initialize();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(
  "\n💡 Escribe la palabra 'salir' y presiona Enter para apagar el bot de forma segura.",
);

rl.on("line", async (input) => {
  if (input.trim().toLowerCase() === "salir") {
    console.log("\n Avisándole a WhatsApp que cierre la sesión...");

    if (client) {
      try {
        await client.logout();

        console.log(
          " Esperando 10 segundos a que los servidores registren la salida...",
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));

        await client.destroy();
        console.log(" Dispositivo desvinculado de tu celular exitosamente.");
      } catch (error) {
        console.error(" No se pudo desvincular:", error.message);
      }
    }

    console.log(
      " Programa terminado. Ya puedes cerrar esta ventana con la X.",
    );
    process.exit(0);
  }
});
