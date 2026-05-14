export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.WEFACT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "WEFACT_API_KEY not set" });

  try {
    const body = req.body || {};
    const controller = body.controller;
    const action = body.action;

    if (!controller || !action) {
      return res.status(400).json({ error: "controller and action required" });
    }

    const formParts = [];
    formParts.push("api_key=" + encodeURIComponent(apiKey));
    formParts.push("controller=" + encodeURIComponent(controller));
    formParts.push("action=" + encodeURIComponent(action));

    function addParams(obj, prefix) {
      if (!obj || typeof obj !== "object") return;
      for (const key of Object.keys(obj)) {
        if (key === "controller" || key === "action") continue;
        const value = obj[key];
        const paramKey = prefix ? prefix + "[" + key + "]" : key;
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] === "object" && value[i] !== null) {
              addParams(value[i], paramKey + "[" + i + "]");
            } else {
              formParts.push(encodeURIComponent(paramKey + "[" + i + "]") + "=" + encodeURIComponent(String(value[i])));
            }
          }
        } else if (typeof value === "object" && value !== null) {
          addParams(value, paramKey);
        } else {
          formParts.push(encodeURIComponent(paramKey) + "=" + encodeURIComponent(String(value)));
        }
      }
    }

    const params = { ...body };
    delete params.controller;
    delete params.action;
    addParams(params, "");

    const postData = formParts.join("&");

    const response = await globalThis.fetch("https://api.wefact.nl/v2/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: postData,
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { status: "error", errors: [text.substring(0, 300)] }; }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}
