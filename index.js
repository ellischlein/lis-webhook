const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = "https://api.tasmc.org.il/api/bi/GetByCodes?codes[]=9&codes[]=10&codes[]=11&codes[]=12&codes[]=6&codes[]=7&codes[]=8&codes[]=5";

async function fetchWithProxies() {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(API_URL)}`,
    `https://corsproxy.io/?${encodeURIComponent(API_URL)}`,
    `https://thingproxy.freeboard.io/fetch/${API_URL}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      console.log("Trying proxy:", proxyUrl);
      const response = await fetch(proxyUrl);
      console.log("Status:", response.status);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log("Success with proxy:", proxyUrl);
          return data;
        }
      }
    } catch (err) {
      console.log("Proxy failed:", err.message);
    }
  }
  return null;
}

app.get("/lis-stats", async (req, res) => {
  try {
    const data = await fetchWithProxies();

    if (!data) {
      return res.status(500).json({ error: "All proxies failed" });
    }

    const getValue = (code) => {
      const entries = data
        .filter((item) => item.Code === String(code))
        .sort((a, b) => new Date(b.Date) - new Date(a.Date));
      return entries.length > 0 ? entries[0].Value : null;
    };

    const getLatestMonthly = (code) => {
      const entries = data
        .filter((item) => item.Code === String(code) && item.Period === "חודשי")
        .sort((a, b) => new Date(b.Date) - new Date(a.Date));
      if (entries.length === 0) return null;
      const latest = entries[0];
      const month = new Date(latest.Date).toLocaleString("en-US", { month: "long", year: "numeric" });
      return { value: latest.Value, month };
    };

    const result = {
      births_since_start_of_year: getValue(5),
      boys_born: getValue(6),
      girls_born: getValue(7),
      twins_born: getValue(8),
      surgeries: getLatestMonthly(9),
      er_visits: getLatestMonthly(10),
      clinic_visits: getLatestMonthly(11),
      hospitalizations: getLatestMonthly(12),
      summary:
        `Since the start of the year, Lis Hospital has had ${getValue(5)} births — ` +
        `${getValue(6)} boys and ${getValue(7)} girls, including ${getValue(8)} twins.`,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Lis webhook running on port ${PORT}`);
});
