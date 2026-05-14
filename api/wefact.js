export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(200).json({ status: "error", errors: ["Use POST"] });

  var apiKey = process.env.WEFACT_API_KEY;
  if (!apiKey) return res.status(200).json({ status: "error", errors: ["WEFACT_API_KEY not set"] });

  try {
    var body = req.body || {};
    var controller = body.controller;
    var action = body.action;

    if (!controller || !action) {
      return res.status(200).json({ status: "error", errors: ["controller and action required"] });
    }

    var payload = Object.assign({}, body, { api_key: apiKey });

    var response = await fetch("https://api.mijnwefact.nl/v2/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    var text = await response.text();
    var data;
    try { data = JSON.parse(text); } catch (e) { data = { status: "error", errors: ["WeFact antwoord: " + text.substring(0, 300)] }; }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(200).json({ status: "error", errors: [e.message] });
  }
}
