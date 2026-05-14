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

    // WeFact expects form-urlencoded data
    const formData = new URLSearchParams();
    formData.append("api_key", apiKey);
    formData.append("controller", controller);
    formData.append("action", action);

    // Flatten nested params for WeFact
    function appendParams(obj, prefix) {
      for (const [key, value] of Object.entries(obj)) {
        const paramKey = prefix ? prefix + "[" + key + "]" : key;
        if (Array.isArray(value)) {
          value.forEach((item, i) => {
            if (typeof item === "object" && item !== null) {
              appendParams(item, paramKey + "[" + i + "]");
            } else {
              formData.append(paramKey + "[" + i + "]", String(item));
            }
          });
        } else if (typeof value === "object" && value !== null) {
          appendParams(value, paramKey);
        } else {
          formData.append(paramKey, String(value));
        }
      }
    }
    appendParams(params, "");

    const response = await fetch("https://api.wefact.nl/v2/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { status: "error", errors: [text.substring(0, 200)] }; }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
