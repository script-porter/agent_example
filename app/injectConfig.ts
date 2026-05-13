import dotenv from "dotenv";

export function dotenvConfig() {
  dotenv.config({ path: "./.env", debug: true });
}

export default function setupConfig() {
  dotenvConfig();
}
