// WeFact API helper - calls via Vercel serverless proxy
const WEFACT_PROXY = "/api/wefact";

async function wefactCall(controller, action, params = {}) {
  const res = await fetch(WEFACT_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ controller, action, ...params }),
  });
  const data = await res.json();
  if (data.status === "error") {
    throw new Error(data.errors?.join(", ") || "WeFact API fout");
  }
  return data;
}

// ── Debiteuren ─────────────────────────────────────────────

export async function findOrCreateDebtor({ naam, email, bedrijf, telefoon }) {
  // Strategie 1: zoek op e-mail via list
  try {
    const searchData = await wefactCall("debtor", "list", { searchat: "EmailAddress", searchfor: email });
    const debtors = searchData.debtors || [];
    if (debtors.length > 0) {
      console.log("WeFact: bestaande debiteur gevonden via e-mail", debtors[0].DebtorCode);
      return debtors[0].DebtorCode || debtors[0].Identifier || null;
    }
  } catch (e) { console.warn("WeFact zoeken op e-mail mislukt:", e.message); }

  // Strategie 2: zoek op naam
  try {
    const nameData = await wefactCall("debtor", "searchbyname", { name: naam });
    const found = nameData.debtors || [];
    const match = found.find(d => (d.EmailAddress || "").toLowerCase() === email.toLowerCase());
    if (match) {
      console.log("WeFact: bestaande debiteur gevonden via naam", match.DebtorCode);
      return match.DebtorCode || match.Identifier || null;
    }
  } catch (e) { console.warn("WeFact zoeken op naam mislukt:", e.message); }

  // Strategie 3: haal alle debiteuren op en zoek op e-mail
  try {
    const allData = await wefactCall("debtor", "list", {});
    const all = allData.debtors || [];
    const match = all.find(d => (d.EmailAddress || "").toLowerCase() === email.toLowerCase());
    if (match) {
      console.log("WeFact: bestaande debiteur gevonden in volledige lijst", match.DebtorCode);
      return match.DebtorCode || match.Identifier || null;
    }
  } catch (e) { console.warn("WeFact lijst ophalen mislukt:", e.message); }

  // Strategie 4: nieuwe debiteur aanmaken
  try {
    const parts = naam.trim().split(" ");
    const voornaam = parts[0] || "";
    const achternaam = parts.slice(1).join(" ") || naam;
    const params = { SurName: achternaam, Initials: voornaam, EmailAddress: email };
    if (bedrijf) params.CompanyName = bedrijf;
    if (telefoon) params.MobileNumber = telefoon;
    const data = await wefactCall("debtor", "add", params);
    console.log("WeFact: nieuwe debiteur aangemaakt", data.debtor?.DebtorCode);
    return data.debtor?.Identifier || data.debtor?.DebtorCode || null;
  } catch (e) { console.error("WeFact debiteur aanmaken mislukt:", e.message); }

  return null;
}

// Legacy alias
export async function createDebtor(params) {
  return findOrCreateDebtor(params);
}

export async function getDebtor(debtorCode) {
  const data = await wefactCall("debtor", "show", { DebtorCode: debtorCode });
  return data.debtor || null;
}

export async function listDebtors(page = 1) {
  const data = await wefactCall("debtor", "list", { Page: page });
  return { debtors: data.debtors || [], totalPages: data.pages || 1 };
}

export async function getAllDebtors() {
  let all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await listDebtors(page);
    all = all.concat(result.debtors);
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  return all;
}

// ── Facturen ───────────────────────────────────────────────

export async function createInvoice({ debtorCode, orderNr, items, producten }) {
  const lines = items.map(item => {
    const prod = producten.find(p => p.id === item.product_id);
    return {
      Description: `${prod?.naam || "Product"}${item.variant ? " - " + item.variant : ""} - ${item.kleur} | ${item.breedte} × ${item.hoogte} mm | ${item.montage} | Bediening: ${item.bedienzijde || "Links"}`,
      Number: item.aantal,
      PriceExcl: item.prijs || 0,
    };
  });

  const invoiceData = await wefactCall("invoice", "add", {
    DebtorCode: debtorCode,
    InvoiceLines: lines,
    Reference: orderNr,
    Comment: "Bestelling via Multilux Klantenportaal",
  });

  // Log alle beschikbare velden om het juiste te vinden
  const inv = invoiceData.invoice || {};
  return {
    code: inv.InvoiceCode || inv.InvoiceNumber || inv.Identifier || null,
    number: inv.InvoiceNumber || null,
    identifier: inv.Identifier || null,
  };
}

export async function getInvoice(invoiceCode) {
  const isNumeric = /^\d+$/.test(invoiceCode);
  const params = isNumeric ? { Identifier: parseInt(invoiceCode) } : { InvoiceCode: invoiceCode };
  const data = await wefactCall("invoice", "show", params);
  return data.invoice || null;
}

export async function listInvoices(debtorCode) {
  const params = {};
  if (debtorCode) params.DebtorCode = debtorCode;
  const data = await wefactCall("invoice", "list", params);
  return data.invoices || [];
}

export async function downloadInvoicePDF(invoiceCode) {
  // Probeer met Identifier (numeriek, verandert nooit)
  const isNumeric = /^\d+$/.test(invoiceCode);
  
  if (isNumeric) {
    try {
      const data = await wefactCall("invoice", "download", { Identifier: parseInt(invoiceCode) });
      if (data.invoice?.Base64) {
        return { base64: data.invoice.Base64, filename: data.invoice.Filename || `Factuur.pdf` };
      }
    } catch (e) { /* probeer als InvoiceCode */ }
  }

  // Probeer met InvoiceCode
  try {
    const data = await wefactCall("invoice", "download", { InvoiceCode: invoiceCode });
    if (data.invoice?.Base64) {
      return { base64: data.invoice.Base64, filename: data.invoice.Filename || `Factuur-${invoiceCode}.pdf` };
    }
  } catch (e) { /* niet gevonden */ }

  throw new Error("Factuur niet gevonden");
}

// ── Status mapping ─────────────────────────────────────────

export function mapInvoiceStatus(wefactStatus) {
  const map = {
    "0": "concept",
    "1": "creditfactuur",
    "2": "openstaand",
    "3": "deels_betaald",
    "4": "betaald",
    "5": "verlopen",
    "6": "herinnering",
    "7": "aanmaning",
    "8": "incasso",
  };
  return map[String(wefactStatus)] || "onbekend";
}
