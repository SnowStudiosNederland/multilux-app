module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.WEFACT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "WEFACT_API_KEY not set" });

  try {
    const { controller, action, ...params } = req.body || {};

    if (!controller || !action) {
      return res.status(400).json({ error: "controller and action required" });
    }

    const allowed = {
      debtor: ["add", "edit", "show", "list", "searchbyname"],
      invoice: ["add", "edit", "show", "list", "download"],
      invoiceline: ["add", "delete"],
    };

    if (!allowed[controller] || !allowed[controller].includes(action)) {
      return res.status(403).json({ error: "Not allowed: " + controller + "/" + action });
    }

    const response = await fetch("https://api.wefact.nl/v2/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, controller, action, ...params }),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { status: "error", errors: [text] }; }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
