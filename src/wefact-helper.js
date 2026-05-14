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

export async function createDebtor({ naam, email, bedrijf, telefoon }) {
  const parts = naam.trim().split(" ");
  const voornaam = parts[0] || "";
  const achternaam = parts.slice(1).join(" ") || naam;

  const params = {
    SurName: achternaam,
    Initials: voornaam,
    EmailAddress: email,
  };
  if (bedrijf) params.CompanyName = bedrijf;
  if (telefoon) params.PhoneNumber = telefoon;

  const data = await wefactCall("debtor", "add", params);
  return data.debtor?.Identifier || data.debtor?.DebtorCode || null;
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
  // Maak factuur aan
  const invoiceData = await wefactCall("invoice", "add", {
    DebtorCode: debtorCode,
    InvoiceLines: items.map(item => {
      const prod = producten.find(p => p.id === item.product_id);
      return {
        Description: `${prod?.naam || "Product"} - ${item.kleur}\n${item.breedte} × ${item.hoogte} cm | ${item.montage}`,
        Number: item.aantal,
        PriceExcl: 0, // Prijs moet later in WeFact worden ingevuld
      };
    }),
    Reference: orderNr,
  });

  return invoiceData.invoice?.InvoiceCode || null;
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
