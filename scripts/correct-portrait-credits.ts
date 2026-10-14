import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

interface PortraitCredit {
  slug: string;
  title: string;
  file: string;
  licence: string;
  author: string;
  url: string;
  attribution?: string;
  licenceNotice?: string;
  originalSource?: string;
  licenceUrl?: string;
}

const file = "src/data/figure-credits.json";
const credits: Record<string, PortraitCredit> = JSON.parse(readFileSync(file, "utf8"));
const bhutto = credits["benazir-bhutto"];
// Commons specifies this credit separately from the Artist metadata fetched originally.
// https://commons.wikimedia.org/wiki/File:Oliver_Mark_-_Benazir_Bhutto,_Dubai_2006_(cropped).jpg
assert.equal(bhutto.file, "Oliver_Mark_-_Benazir_Bhutto,_Dubai_2006_(cropped).jpg");
assert.equal(bhutto.licence, "CC BY-SA 4.0");
credits[bhutto.slug] = { ...bhutto, author: "\u00a9 Oliver Mark" };

function addNotice(slug: string, sourceFile: string, notice: Partial<PortraitCredit>) {
  const credit = credits[slug];
  assert.equal(credit.file, sourceFile);
  assert.equal(credit.licence, "Attribution");
  credits[slug] = { ...credit, licenceUrl: credit.url, ...notice };
}

addNotice("sandro-pertini", "Pertini_ritratto.jpg", {
  attribution: "Presidency of the Italian Republic, Quirinale.it.",
  licenceNotice: "Attribution-only permission for this image, first published on Commons in 2008. The permission covers Quirinale files published before 10 September 2024.",
  originalSource: "https://presidenti.quirinale.it/elementi/237164",
});
addNotice("tommy-douglas", "Premier_Tommy_Douglas_(F1257_s1057_it2743).jpg", {
  attribution: "City of Toronto Archives, Fonds 1257, Series 1057, Item 2743. Photographer: Alexandra Studio.",
  originalSource: "https://gencat.eloquent-systems.com/city-of-toronto-archives-m-permalink.html?key=213541",
});
addNotice("cleisthenes", "Cleisthenes.jpg", {
  attribution: "Ohio Channel, www.ohiochannel.org. Photographer unknown.",
  originalSource: "http://www.ohiostatehouse.org/Multimedia/MediaLibrary/Media.aspx?fileId=117260",
});
addNotice("mario-soares", "Medalha_de_Galiza_1993_-_5.jpg", {
  attribution: "Xunta de Galicia, Medallas de Galicia, 1993.",
  originalSource: "https://www.xunta.gal/medallas-de-galicia/1993",
  licenceUrl: "https://www.xunta.gal/aviso-legal-do-portal-da-xunta",
});
// Source numbers and archival quotas checked on the collection's individual pages,
// 14 October 2026. Ceaușescu's source publishes the quota incompletely as "4/".
addNotice("nicolae-ceausescu", "Nicolae_Ceaușescu_(3x4_cropped).jpg", {
  attribution: "Romanian National Archives, Fototeca online a comunismului românesc, photo E594, archival quota as published: 4/ (14.10.2026). Photographer unknown.",
  originalSource: "https://fototeca.iiccmer.ro/picdetails.php?picid=33364X156X537",
});
addNotice("pol-pot", "Pol_Pot_(cropped).jpg", {
  attribution: "Romanian National Archives, Fototeca online a comunismului românesc, photo BA403, archival quota 173/1978 (14.10.2026). Photographer unknown.",
  originalSource: "https://fototeca.iiccmer.ro/picdetails.php?picid=45014X1X4",
});
addNotice("jean-bedel-bokassa", "Bokassa_with_Ceausescu_(cropped).jpg", {
  attribution: "Romanian National Archives, Fototeca online a comunismului românesc, photo Z260, archival quota 75/1970 (14.10.2026). Photographer unknown.",
  originalSource: "https://fototeca.iiccmer.ro/picdetails.php?picid=36860X4X5",
});
addNotice("john-von-neumann", "JohnvonNeumann-LosAlamos.gif", {
  attribution: "Los Alamos National Laboratory (LANL), Los Alamos National Security, LLC (LANS), U.S. Department of Energy.",
  licenceNotice: "Unless otherwise indicated, this information has been authored by an employee or employees of the Los Alamos National Security, LLC (LANS), operator of the Los Alamos National Laboratory under Contract No. DE-AC52-06NA25396 with the U.S. Department of Energy. The U.S. Government has rights to use, reproduce, and distribute this information. The public may copy and use this information without charge, provided that this Notice and any statement of authorship are reproduced on all copies. Neither the Government nor LANS makes any warranty, express or implied, or assumes any liability or responsibility for the use of this information.",
});
writeFileSync(file, JSON.stringify(credits, null, 1));
console.log("Corrected Oliver Mark attribution and added eight source-specific portrait notices.");
