export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(200).json({ status: "error", errors: ["Use POST"] });

  var apiKey = process.env.WEFACT_API_KEY;
  if (!apiKey) return res.status(200).json({ status: "error", errors: ["WEFACT_API_KEY not set"] });

  var body = req.body || {};
  var controller = body.controller;
  var action = body.action;
  if (!controller || !action) return res.status(200).json({ status: "error", errors: ["controller and action required"] });

  var parts = ["api_key=" + encodeURIComponent(apiKey), "controller=" + encodeURIComponent(controller), "action=" + encodeURIComponent(action)];

  function addParams(obj, prefix) {
    if (!obj || typeof obj !== "object") return;
    Object.keys(obj).forEach(function(key) {
      if (key === "controller" || key === "action") return;
      var value = obj[key];
      var pk = prefix ? prefix + "[" + key + "]" : key;
      if (Array.isArray(value)) {
        value.forEach(function(item, i) {
          if (typeof item === "object" && item !== null) { addParams(item, pk + "[" + i + "]"); }
          else { parts.push(encodeURIComponent(pk + "[" + i + "]") + "=" + encodeURIComponent(String(item))); }
        });
      } else if (typeof value === "object" && value !== null) { addParams(value, pk); }
      else { parts.push(encodeURIComponent(pk) + "=" + encodeURIComponent(String(value))); }
    });
  }

  var params = Object.assign({}, body);
  delete params.controller;
  delete params.action;
  addParams(params, "");
  var postData = parts.join("&");

  // Test 1: kan de functie überhaupt een externe URL bereiken?
  try {
    var testRes = await fetch("https://httpbin.org/post", { method: "POST", body: "test=1" });
    var testOk = testRes.ok;
  } catch(e) {
    return res.status(200).json({ status: "error", errors: ["Geen internet: " + e.message + " | cause: " + JSON.stringify(e.cause)] });
  }

  // Test 2: WeFact API
  try {
    var response = await fetch("https://api.wefact.nl/v2/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: postData,
    });
    var text = await response.text();
    var data;
    try { data = JSON.parse(text); } catch(e) { data = { status: "error", errors: ["WeFact antwoord: " + text.substring(0, 300)] }; }
    return res.status(200).json(data);
  } catch(e) {
    var causeMsg = "";
    try { causeMsg = JSON.stringify(e.cause); } catch(x) { causeMsg = String(e.cause); }
    return res.status(200).json({ status: "error", errors: ["WeFact fetch: " + e.message + " | cause: " + causeMsg + " | internet werkt: " + testOk] });
  }
}
