import express from "express";
import cors from "cors";

import routes from "./modules/routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",

    credentials: true,
  }),
);
app.use(express.json());

app.use("/api", routes);

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

export default app;
