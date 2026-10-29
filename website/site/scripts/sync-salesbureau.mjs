// Kopieert het Salesbureau (bron: werkomgeving/index.html) naar private/salesbureau.html, het bestand dat /intern/ uitserveert.
// Draai dit na elke wijziging aan het Salesbureau: node scripts/sync-salesbureau.mjs
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync(new URL("../private/", import.meta.url), { recursive: true });
copyFileSync(new URL("../../../werkomgeving/index.html", import.meta.url), new URL("../private/salesbureau.html", import.meta.url));
console.log("private/salesbureau.html bijgewerkt");
