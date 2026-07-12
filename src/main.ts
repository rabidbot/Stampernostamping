// main.ts — entry. Creates the pixel-canvas game directly (no DOM splash).
// First pointer click also unlocks audio (Tone.js gesture requirement).
import { Game } from "./game/loop";
import "./style.css";

const app = document.getElementById("app")!;
// The Game constructor creates the canvas inside #app.
const game = new Game(app);
void game.start();
export {};