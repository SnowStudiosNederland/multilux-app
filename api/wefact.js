var https = require("https");
var querystring = require("querystring");

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var apiKey = process.env.WEFACT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "WEFACT_API_KEY not set" });

  var body = req.body || {};
  var controller = body.controller;
  var action = body.action;

  if (!controller || !action) {
    return res.status(400).json({ error: "controller and action required" });
  }

  var allowed = {
    debtor: ["add", "edit", "show", "list", "searchbyname"],
    invoice: ["add", "edit", "show", "list", "download"],
    invoiceline: ["add", "delete"],
  };

  if (!allowed[controller] || !allowed[controller].indexOf(action) === -1) {
    return res.status(403).json({ error: "Not allowed" });
  }

  // Build form data
  var formParts = [];
  formParts.push("api_key=" + encodeURIComponent(apiKey));
  formParts.push("controller=" + encodeURIComponent(controller));
  formParts.push("action=" + encodeURIComponent(action));

  function addParams(obj, prefix) {
    if (!obj || typeof obj !== "object") return;
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key === "controller" || key === "action") continue;
      var value = obj[key];
      var paramKey = prefix ? prefix + "[" + key + "]" : key;
      if (Array.isArray(value)) {
        for (var j = 0; j < value.length; j++) {
          if (typeof value[j] === "object" && value[j] !== null) {
            addParams(value[j], paramKey + "[" + j + "]");
          } else {
            formParts.push(encodeURIComponent(paramKey + "[" + j + "]") + "=" + encodeURIComponent(String(value[j])));
          }
        }
      } else if (typeof value === "object" && value !== null) {
        addParams(value, paramKey);
      } else {
        formParts.push(encodeURIComponent(paramKey) + "=" + encodeURIComponent(String(value)));
      }
    }
  }

  // Add remaining params (exclude controller and action)
  var params = Object.assign({}, body);
  delete params.controller;
  delete params.action;
  addParams(params, "");

  var postData = formParts.join("&");

  var options = {
    hostname: "api.wefact.nl",
    path: "/v2/",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  var request = https.request(options, function (response) {
    var chunks = [];
    response.on("data", function (chunk) { chunks.push(chunk); });
    response.on("end", function () {
      var text = Buffer.concat(chunks).toString();
      var data;
      try { data = JSON.parse(text); } catch (e) { data = { status: "error", errors: [text.substring(0, 300)] }; }
      res.status(200).json(data);
    });
  });

  request.on("error", function (error) {
    res.status(500).json({ error: error.message });
  });

  request.write(postData);
  request.end();
};
