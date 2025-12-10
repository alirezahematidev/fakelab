import fs from "fs/promises";
import fse from "fs-extra";

async function postbuild() {
  await Promise.all([fse.remove("lib/views"), fse.remove("lib/public")]);
  await Promise.all([fs.cp("src/views", "lib/views", { recursive: true }), fs.cp("src/public", "lib/public", { recursive: true })]);
}

export default postbuild;
