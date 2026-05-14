import express from "express";
import setupConfig from "./injectConfig";

setupConfig();

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(router);

const server = app.listen(5000, () => {
  const address = server?.address() as any;

  const host = address?.address === "::" ? "localhost" : address?.address;
  const port = address?.port;

  console.log(`\x1B[34mhttp://${host}:${port}`, "\x1B[0m");
});
