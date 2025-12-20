import path from "node:path";
import { fileURLToPath } from "node:url";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

const CWD = process.cwd();

export { CWD, DIRNAME };
