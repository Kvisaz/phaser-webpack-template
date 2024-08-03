import packageInfo from "../package.json";
import { phaserGameConfig } from "./config";

console.log(`${packageInfo.name} ${packageInfo.version} starting...`);
console.log(`${packageInfo.description}`);
console.log('...................');


new Phaser.Game(phaserGameConfig);
