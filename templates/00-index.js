import { hello } from "./01-hello-world.js";

function getInfo() {
  return {
    id: "myextension",
    name: "My Extension",
    blocks: [
      {
        opcode: "hello",
        blockType: Scratch.BlockType.REPORTER,
        text: "Hello!",
      },
    ],
  };
}
