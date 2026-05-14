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

    const formData = new URLSearchParams();
    formData.append("api_key", apiKey);
    formData.append("controller", controller);
    formData.append("action", action);

    function appendParams(obj, prefix) {
      for (var key in obj) {
        var value = obj[key];
        var paramKey = prefix ? prefix + "[" + key + "]" : key;
        if (Array.isArray(value)) {
          for (var i = 0; i < value.length; i++) {
            if (typeof value[i] === "object" && value[i] !== null) {
              appendParams(value[i], paramKey + "[" + i + "]");
            } else {
              formData.append(paramKey + "[" + i + "]", String(value[i]));
            }
          }
        } else if (typeof value === "object" && value !== null) {
          appendParams(value, paramKey);
        } else {
          formData.append(paramKey, String(value));
        }
      }
    }
    appendParams(params, "");

    var response = await fetch("https://api.wefact.nl/v2/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    var text = await response.text();
    var data;
    try { data = JSON.parse(text); } catch (e) { data = { status: "error", errors: [text.substring(0, 300)] }; }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
