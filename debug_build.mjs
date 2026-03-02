import { build } from './node_modules/vite/dist/node/index.js';

async function run() {
  try {
    console.log("Starting build...");
    await build();
    console.log("Build successful!");
  } catch (err) {
    console.log("CAUGHT ERROR:", err);
    if (err) {
      console.log("NAME:", err.name);
      console.log("MESSAGE:", err.message);
      console.log("STACK:", err.stack);
    }
    process.exit(1);
  }
}
run();
