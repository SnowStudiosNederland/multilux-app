export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(200).json({ status: "error", errors: ["Use POST"] });

  var apiKey, body, controller, action, postData, response, text, data;

  try { apiKey = process.env.WEFACT_API_KEY; } catch(e) { return res.status(200).json({ status: "error", errors: ["env error: " + e.message] }); }
  if (!apiKey) return res.status(200).json({ status: "error", errors: ["WEFACT_API_KEY not set"] });

  try { body = req.body || {}; } catch(e) { return res.status(200).json({ status: "error", errors: ["body error: " + e.message] }); }

  controller = body.controller;
  action = body.action;
  if (!controller || !action) return res.status(200).json({ status: "error", errors: ["controller and action required"] });

  try {
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
    postData = parts.join("&");
  } catch(e) { return res.status(200).json({ status: "error", errors: ["params error: " + e.message] }); }

  try {
    response = await fetch("https://api.wefact.nl/v2/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: postData,
    });
  } catch(e) { return res.status(200).json({ status: "error", errors: ["fetch error: " + e.message] }); }

  try { text = await response.text(); } catch(e) { return res.status(200).json({ status: "error", errors: ["response error: " + e.message] }); }

  try { data = JSON.parse(text); } catch(e) { data = { status: "error", errors: ["WeFact returned: " + text.substring(0, 200)] }; }

  return res.status(200).json(data);
}
