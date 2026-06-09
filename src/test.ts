import net from "net";

const IP = "10.28.205.222";
const PORT = 4370; // sesuaikan

const client = new net.Socket();

client.connect(PORT, IP, () => {
  console.log(`Connected to ${IP}:${PORT}`);
});

client.on("data", (data) => {
  console.log("TEXT:", data.toString());
  console.log("HEX :", data.toString("hex"));
});

client.on("error", (err) => {
  console.error(err);
});

client.on("close", () => {
  console.log("Disconnected");
});
