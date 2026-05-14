// Prijsopzoek module voor Multilux
// Ondersteunt: breedte-only (rolgordijnen) en 2D matrix (plissé, jaloezie, etc.)

/**
 * Zoek de prijs op in de prijsmatrix van een product
 * @param {object} product - Het product met prijsmatrix
 * @param {string} variantNaam - Naam van de variant (bijv. "Rolgordijnen - Buis 34 mm")
 * @param {string} prijsgroep - Prijsgroep code (bijv. "PG1", "Prijsgroep 1")
 * @param {number} breedteMm - Breedte in mm
 * @param {number} hoogteMm - Hoogte in mm
 * @returns {{ prijs: number, gevonden: boolean, info: string }}
 */
export function zoekPrijs(product, variantNaam, prijsgroep, breedteMm, hoogteMm) {
  if (!product?.prijsmatrix?.varianten) {
    return { prijs: 0, gevonden: false, info: "Geen prijsmatrix beschikbaar" };
  }

  // Converteer mm naar cm (matrices zijn in cm)
  const breedteCm = Math.ceil(breedteMm / 10);
  const hoogteCm = Math.ceil(hoogteMm / 10);

  // Zoek de variant
  const variant = product.prijsmatrix.varianten.find(v => v.naam === variantNaam);
  if (!variant) {
    return { prijs: 0, gevonden: false, info: "Variant niet gevonden" };
  }

  // Type 1: Breedte-only (rolgordijnen)
  if (variant.data?.[0]?.type === "breedte_only") {
    return zoekPrijsBreedteOnly(variant.data[0], prijsgroep, breedteCm);
  }

  // Type 2: 2D matrix (hoogte × breedte)
  return zoekPrijs2D(variant.data, prijsgroep, breedteCm, hoogteCm);
}

function zoekPrijsBreedteOnly(data, prijsgroep, breedteCm) {
  // Zoek de juiste prijsgroep kolom
  const pgIndex = data.prijsgroepen.findIndex(pg =>
    pg.toLowerCase().replace(/\s/g, "") === prijsgroep.toLowerCase().replace(/\s/g, "") ||
    pg.includes(prijsgroep.replace("Prijsgroep ", "").replace("PG", ""))
  );

  if (pgIndex === -1) {
    return { prijs: 0, gevonden: false, info: `Prijsgroep "${prijsgroep}" niet gevonden` };
  }

  // Zoek de juiste breedte (rond omhoog af naar dichtstbijzijnde stap)
  const rij = vindDichtstbijzijndeRij(data.rijen, "breedte", breedteCm);
  if (!rij) {
    return { prijs: 0, gevonden: false, info: `Breedte ${breedteCm} cm buiten bereik` };
  }

  const pgNaam = data.prijsgroepen[pgIndex];
  const prijs = rij.prijzen[pgNaam];
  if (!prijs) {
    return { prijs: 0, gevonden: false, info: "Geen prijs voor deze combinatie" };
  }

  return { prijs: Math.round(prijs * 100) / 100, gevonden: true, info: `${pgNaam}, breedte ${rij.breedte} cm` };
}

function zoekPrijs2D(sections, prijsgroep, breedteCm, hoogteCm) {
  // Zoek de juiste prijsgroep sectie
  const section = sections.find(s =>
    s.prijsgroep?.toLowerCase().replace(/\s/g, "") === prijsgroep.toLowerCase().replace(/\s/g, "")
  );

  if (!section) {
    return { prijs: 0, gevonden: false, info: `Prijsgroep "${prijsgroep}" niet gevonden` };
  }

  // Zoek de juiste breedte kolom (rond omhoog af)
  const breedteIndex = vindDichtstbijzijndeIndex(section.breedtes, breedteCm);
  if (breedteIndex === -1) {
    return { prijs: 0, gevonden: false, info: `Breedte ${breedteCm} cm buiten bereik` };
  }

  // Zoek de juiste hoogte rij (rond omhoog af)
  const rij = vindDichtstbijzijndeRij(section.rijen, "hoogte", hoogteCm);
  if (!rij) {
    return { prijs: 0, gevonden: false, info: `Hoogte ${hoogteCm} cm buiten bereik` };
  }

  const prijs = rij.prijzen[breedteIndex];
  if (!prijs && prijs !== 0) {
    return { prijs: 0, gevonden: false, info: "Geen prijs voor deze maat-combinatie" };
  }

  return {
    prijs: Math.round(prijs * 100) / 100,
    gevonden: true,
    info: `${section.prijsgroep}, ${section.breedtes[breedteIndex]}×${rij.hoogte} cm`
  };
}

function vindDichtstbijzijndeRij(rijen, veld, waarde) {
  // Zoek de eerste rij die >= de gevraagde waarde is (omhoog afronden)
  const numRijen = rijen
    .map(r => ({ ...r, val: typeof r[veld] === "string" ? parseInt(r[veld]) : r[veld] }))
    .filter(r => !isNaN(r.val))
    .sort((a, b) => a.val - b.val);

  for (const rij of numRijen) {
    if (rij.val >= waarde) return rij;
  }
  // Als waarde groter is dan alle stappen, pak de laatste
  return numRijen.length > 0 ? numRijen[numRijen.length - 1] : null;
}

function vindDichtstbijzijndeIndex(breedtes, waarde) {
  const numBreedtes = breedtes.map((b, i) => {
    const num = typeof b === "string" ? parseInt(b.split("-").pop()) : b;
    return { index: i, val: num };
  }).filter(b => !isNaN(b.val)).sort((a, b) => a.val - b.val);

  for (const b of numBreedtes) {
    if (b.val >= waarde) return b.index;
  }
  return numBreedtes.length > 0 ? numBreedtes[numBreedtes.length - 1].index : -1;
}

/**
 * Haal alle beschikbare varianten op voor een product
 */
export function getVarianten(product) {
  if (!product?.prijsmatrix?.varianten) return [];
  return product.prijsmatrix.varianten.map(v => v.naam);
}

/**
 * Haal alle prijsgroepen op voor een specifieke variant
 */
export function getPrijsgroepen(product, variantNaam) {
  if (!product?.prijsmatrix?.varianten) return [];
  const variant = product.prijsmatrix.varianten.find(v => v.naam === variantNaam);
  if (!variant) return [];

  if (variant.data?.[0]?.type === "breedte_only") {
    return variant.data[0].prijsgroepen || [];
  }

  return variant.data.map(s => s.prijsgroep).filter(Boolean);
}

/**
 * Haal min/max maten op voor een variant + prijsgroep
 */
export function getMatenBereik(product, variantNaam, prijsgroep) {
  if (!product?.prijsmatrix?.varianten) return null;
  const variant = product.prijsmatrix.varianten.find(v => v.naam === variantNaam);
  if (!variant) return null;

  if (variant.data?.[0]?.type === "breedte_only") {
    const rijen = variant.data[0].rijen;
    const breedtes = rijen.map(r => r.breedte).sort((a, b) => a - b);
    return {
      minBreedte: breedtes[0] * 10, // naar mm
      maxBreedte: breedtes[breedtes.length - 1] * 10,
      minHoogte: null,
      maxHoogte: null,
      breedteOnly: true,
    };
  }

  const section = variant.data.find(s => s.prijsgroep === prijsgroep) || variant.data[0];
  if (!section) return null;

  const breedtes = section.breedtes.map(b => typeof b === "string" ? parseInt(b.split("-").pop()) : b).filter(b => !isNaN(b));
  const hoogtes = section.rijen.map(r => r.hoogte).sort((a, b) => a - b);

  return {
    minBreedte: Math.min(...breedtes) * 10,
    maxBreedte: Math.max(...breedtes) * 10,
    minHoogte: Math.min(...hoogtes) * 10,
    maxHoogte: Math.max(...hoogtes) * 10,
    breedteOnly: false,
  };
}
