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
  // Eerst zoeken op e-mail
  try {
    const searchData = await wefactCall("debtor", "list", { searchat: "EmailAddress", searchfor: email });
    const debtors = searchData.debtors || [];
    if (debtors.length > 0) {
      return debtors[0].DebtorCode || debtors[0].Identifier || null;
    }
  } catch (e) { /* zoeken mislukt, probeer aanmaken */ }

  // Niet gevonden, nieuwe debiteur aanmaken
  const parts = naam.trim().split(" ");
  const voornaam = parts[0] || "";
  const achternaam = parts.slice(1).join(" ") || naam;

  const params = {
    SurName: achternaam,
    Initials: voornaam,
    EmailAddress: email,
  };
  if (bedrijf) params.CompanyName = bedrijf;
  if (telefoon) params.MobileNumber = telefoon;

  const data = await wefactCall("debtor", "add", params);
  return data.debtor?.Identifier || data.debtor?.DebtorCode || null;
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

  return {
    code: invoiceData.invoice?.InvoiceCode || null,
    number: invoiceData.invoice?.InvoiceNumber || null,
  };
}

export async function getInvoice(invoiceCode) {
  const data = await wefactCall("invoice", "show", { InvoiceCode: invoiceCode });
  return data.invoice || null;
}

export async function listInvoices(debtorCode) {
  const params = {};
  if (debtorCode) params.DebtorCode = debtorCode;
  const data = await wefactCall("invoice", "list", params);
  return data.invoices || [];
}

export async function downloadInvoicePDF(invoiceCode) {
  const data = await wefactCall("invoice", "download", { InvoiceCode: invoiceCode });
  if (data.invoice?.Base64) {
    return { base64: data.invoice.Base64, filename: data.invoice.Filename || `Factuur-${invoiceCode}.pdf` };
  }
  throw new Error(data.errors?.join(", ") || "Geen PDF beschikbaar");
}

// ── Status mapping ─────────────────────────────────────────

export function mapInvoiceStatus(wefactStatus) {
  const map = {
    "0": "concept",
    "1": "openstaand",
    "2": "betaald",
    "3": "verlopen",
    "4": "herinnering",
    "5": "aanmaning",
    "6": "incasso",
    "7": "gecrediteerd",
  };
  return map[wefactStatus] || "onbekend";
}
