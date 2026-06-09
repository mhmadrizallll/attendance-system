const ZKLib = require("node-zklib");

async function test() {
  const zk = new ZKLib("10.28.205.222", 4370, 10000, 4000);

  await zk.createSocket();

  const result = await zk.executeCmd(80);

  console.log("HEX :", result.toString("hex"));
  console.log("LEN :", result.length);
  console.log("BUF :", result);

  for (let i = 0; i < result.length; i++) {
    console.log(i, result[i]);
  }

  await zk.disconnect();
}

test().catch(console.error);
