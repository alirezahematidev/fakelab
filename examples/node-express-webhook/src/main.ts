import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.post("/server-started", (req, res) => {
  console.info("Webhook delivered server:started event within body: %s", req.body);

  res.send(true);
});

app.post("/server-shutdown", (req, res) => {
  console.info("Webhook delivered server:shutdown event within body: %s", req.body);

  res.send(true);
});

app.post("/snapshot-captured", (req, res) => {
  console.info("Webhook delivered snapshot:captured event within body: %s", req.body);

  res.send(true);
});

app.post("/snapshot-refreshed", (req, res) => {
  console.info("Webhook delivered snapshot:refreshed event within body: %s", req.body);

  res.send(true);
});

app.post("/snapshot-deleted", (req, res) => {
  console.info("Webhook delivered snapshot:deleted event within body: %s", req.body);

  res.send(true);
});

app.listen(50002, () => {
  console.log("Express server is running at port 50002...");
});
