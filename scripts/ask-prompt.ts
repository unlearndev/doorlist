// Prints the instructions Ask sends Claude with every question: the prompt
// json-render builds from our catalog, plus our own rules at the end.
import { SYSTEM } from "../server/ask/generate.ts";

console.log(SYSTEM);
