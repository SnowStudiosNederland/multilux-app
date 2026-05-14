export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.WEFACT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "WeFact API key not configured" });

  try {
    const { controller, action, ...params } = req.body;

    if (!controller || !action) {
      return res.status(400).json({ error: "controller and action are required" });
    }

    // Whitelist allowed controllers/actions
    const allowed = {
      debtor: ["add", "edit", "show", "list", "searchbyname"],
      invoice: ["add", "edit", "show", "list", "download"],
      invoiceline: ["add", "delete"],
    };

    if (!allowed[controller] || !allowed[controller].includes(action)) {
      return res.status(403).json({ error: `Action ${controller}/${action} not allowed` });
    }

    const response = await fetch("https://api.wefact.nl/v2/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        controller,
        action,
        ...params,
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("WeFact API error:", error);
    return res.status(500).json({ error: "WeFact API request failed", message: error.message });
  }
}
