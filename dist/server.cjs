var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");

// src/shared/storeData.ts
var products = [
  { id: "p1", name: "EcoCotton Crewneck", category: "Apparel", unitCost: 15, unitPrice: 45 },
  { id: "p2", name: "Urban Fleece Hoodie", category: "Apparel", unitCost: 22, unitPrice: 65 },
  { id: "p3", name: "Stride Lite Runners", category: "Footwear", unitCost: 35, unitPrice: 110 },
  { id: "p4", name: "All-Weather Boots", category: "Footwear", unitCost: 48, unitPrice: 140 },
  { id: "p5", name: "AeroSound ANC Headphones", category: "Electronics", unitCost: 60, unitPrice: 180 },
  { id: "p6", name: "ChargeMax Powerbank", category: "Electronics", unitCost: 12, unitPrice: 39 },
  { id: "p7", name: "Nomad Canvas Backpack", category: "Accessories", unitCost: 20, unitPrice: 58 },
  { id: "p8", name: "Classic Leather Wallet", category: "Accessories", unitCost: 14, unitPrice: 40 },
  { id: "p9", name: "Ceramic Candle Set", category: "Home Goods", unitCost: 8, unitPrice: 28 },
  { id: "p10", name: "Plush Weighted Blanket", category: "Home Goods", unitCost: 25, unitPrice: 75 }
];
var stores = [
  { id: "s1", name: "Downtown Plaza", location: "Metropolitan Center" },
  { id: "s2", name: "Uptown Fashion Hub", location: "Uptown District" },
  { id: "s3", name: "Suburban Galleria", location: "West End Suburbs" }
];
var generateSalesHistory = () => {
  const records = [];
  const baseDate = /* @__PURE__ */ new Date("2026-09-04");
  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    products.forEach((p) => {
      stores.forEach((s) => {
        let units = 0;
        if (p.category === "Electronics") {
          units = s.id === "s1" ? 1 : 0;
        } else if (p.category === "Apparel" || p.category === "Footwear") {
          units = s.id === "s2" ? 2 : 1;
        } else {
          units = 1;
        }
        const day = d.getDay();
        if (day === 0 || day === 6) {
          units += 1;
        }
        if (p.id === "p3" && s.id === "s1" && dateStr === "2026-09-02") {
          units = 25;
        }
        if (p.id === "p6" && s.id === "s2" && dateStr === "2026-09-01") {
          units = 30;
        }
        if (p.id === "p1" && s.id === "s3" && d >= /* @__PURE__ */ new Date("2026-09-01")) {
          units = 0;
        }
        if (p.id === "p4" && s.id === "s3") {
          units = dateStr === "2026-08-15" ? 1 : 0;
        }
        if (p.id === "p8" && s.id === "s1") {
          units = dateStr === "2026-08-10" || dateStr === "2026-08-25" ? 1 : 0;
        }
        if (units > 0) {
          records.push({
            date: dateStr,
            productId: p.id,
            storeId: s.id,
            unitsSold: units,
            revenue: units * p.unitPrice
          });
        }
      });
    });
  }
  return records;
};
var salesHistory = generateSalesHistory();
var inventory = [
  // --- Downtown Plaza (s1) ---
  // Critical Stock-out: AeroSound Headphones (p5) - High 7-day velocity, extremely low stock
  // Sales in last 7 days: ~10 units. Daily velocity = 1.43/day. Stock = 2. Will stock-out in 1.4 days!
  { productId: "p5", storeId: "s1", stock: 2, capacity: 50, reorderPoint: 10, dailyVelocity: 1.43 },
  // Classic Leather Wallet (p8) - Slow moving stock: Stock = 120 (high inventory), only 2 sales in 30 days.
  { productId: "p8", storeId: "s1", stock: 120, capacity: 150, reorderPoint: 15, dailyVelocity: 0.07 },
  { productId: "p1", storeId: "s1", stock: 35, capacity: 80, reorderPoint: 20, dailyVelocity: 1.14 },
  { productId: "p2", storeId: "s1", stock: 42, capacity: 80, reorderPoint: 20, dailyVelocity: 1.28 },
  { productId: "p3", storeId: "s1", stock: 18, capacity: 60, reorderPoint: 15, dailyVelocity: 3.57 },
  // High velocity due to spike
  { productId: "p4", storeId: "s1", stock: 22, capacity: 50, reorderPoint: 10, dailyVelocity: 0.86 },
  { productId: "p6", storeId: "s1", stock: 45, capacity: 100, reorderPoint: 25, dailyVelocity: 1.57 },
  { productId: "p7", storeId: "s1", stock: 28, capacity: 70, reorderPoint: 15, dailyVelocity: 0.71 },
  { productId: "p9", storeId: "s1", stock: 40, capacity: 120, reorderPoint: 20, dailyVelocity: 1.43 },
  { productId: "p10", storeId: "s1", stock: 15, capacity: 60, reorderPoint: 15, dailyVelocity: 0.57 },
  // --- Uptown Fashion Hub (s2) ---
  // Critical Stock-out: EcoCotton Crewneck (p1) - High velocity uptown, low stock. Stock = 4, 7-day sales = 14 (2.0/day). Run-out in 2 days.
  { productId: "p1", storeId: "s2", stock: 4, capacity: 100, reorderPoint: 25, dailyVelocity: 2 },
  { productId: "p2", storeId: "s2", stock: 55, capacity: 100, reorderPoint: 25, dailyVelocity: 2.14 },
  { productId: "p3", storeId: "s2", stock: 30, capacity: 80, reorderPoint: 20, dailyVelocity: 1.86 },
  { productId: "p4", storeId: "s2", stock: 18, capacity: 60, reorderPoint: 15, dailyVelocity: 0.71 },
  { productId: "p5", storeId: "s2", stock: 25, capacity: 60, reorderPoint: 15, dailyVelocity: 0.86 },
  { productId: "p6", storeId: "s2", stock: 20, capacity: 120, reorderPoint: 30, dailyVelocity: 4.29 },
  // High velocity due to spike
  { productId: "p7", storeId: "s2", stock: 65, capacity: 90, reorderPoint: 20, dailyVelocity: 1.14 },
  { productId: "p8", storeId: "s2", stock: 32, capacity: 80, reorderPoint: 15, dailyVelocity: 0.86 },
  { productId: "p9", storeId: "s2", stock: 80, capacity: 150, reorderPoint: 30, dailyVelocity: 1.71 },
  { productId: "p10", storeId: "s2", stock: 38, capacity: 80, reorderPoint: 20, dailyVelocity: 1 },
  // --- Suburban Galleria (s3) ---
  // Dead Stock: All-Weather Boots (p4) - High stock (85), only 1 sale in last 30 days. Velocity = 0.03.
  { productId: "p4", storeId: "s3", stock: 85, capacity: 100, reorderPoint: 15, dailyVelocity: 0.03 },
  // Overstock: Plush Weighted Blanket (p10) - Stock is 150, capacity is 100. Carrying cost is very high!
  { productId: "p10", storeId: "s3", stock: 150, capacity: 100, reorderPoint: 20, dailyVelocity: 0.43 },
  { productId: "p1", storeId: "s3", stock: 50, capacity: 80, reorderPoint: 20, dailyVelocity: 0 },
  // Sudden drop to zero
  { productId: "p2", storeId: "s3", stock: 34, capacity: 80, reorderPoint: 20, dailyVelocity: 0.86 },
  { productId: "p3", storeId: "s3", stock: 22, capacity: 60, reorderPoint: 15, dailyVelocity: 0.71 },
  { productId: "p5", storeId: "s3", stock: 12, capacity: 50, reorderPoint: 12, dailyVelocity: 0.43 },
  { productId: "p6", storeId: "s3", stock: 58, capacity: 100, reorderPoint: 20, dailyVelocity: 1.14 },
  { productId: "p7", storeId: "s3", stock: 40, capacity: 70, reorderPoint: 15, dailyVelocity: 0.57 },
  { productId: "p8", storeId: "s3", stock: 45, capacity: 80, reorderPoint: 15, dailyVelocity: 0.57 },
  { productId: "p9", storeId: "s3", stock: 72, capacity: 120, reorderPoint: 25, dailyVelocity: 1.28 }
];
var operationalAlerts = [
  {
    id: "a1",
    type: "stock_out_risk",
    productId: "p5",
    storeId: "s1",
    title: "Critical Stock-out Risk: AeroSound ANC Headphones",
    description: "Downtown Plaza is running extremely low on AeroSound Headphones with an active sales run rate.",
    metric: "1.4 Days of Stock Remaining",
    calculation: "Stock: 2 units / 7-Day Velocity: 1.43 units/day = 1.4 days of stock.",
    recommendation: "Initiate a store transfer of 10 units from Suburban Galleria (s3 has 12 units, low sales velocity of 0.43/day) or place an expedited purchase order.",
    actionLabel: "Transfer from Suburban Galleria"
  },
  {
    id: "a2",
    type: "stock_out_risk",
    productId: "p1",
    storeId: "s2",
    title: "Critical Stock-out Risk: EcoCotton Crewneck",
    description: "Uptown Fashion Hub has almost exhausted EcoCotton Crewneck inventory due to high apparel velocity.",
    metric: "2.0 Days of Stock Remaining",
    calculation: "Stock: 4 units / 7-Day Velocity: 2.00 units/day = 2.0 days of stock.",
    recommendation: "Reorder 50 units immediately from the supplier, or transfer 15 units from Suburban Galleria (s3 has 50 units, velocity of 0.0).",
    actionLabel: "Transfer 15 units from Suburban Galleria"
  },
  {
    id: "a3",
    type: "slow_moving",
    productId: "p4",
    storeId: "s3",
    title: "Dead / Slow-Moving Stock: All-Weather Boots",
    description: "Suburban Galleria is holding 85 units of All-Weather Boots with only 1 unit sold in the last 30 days.",
    metric: "Carrying Cost Sink",
    calculation: "85 units * $48 cost = $4,080 tied-up capital. 5% monthly carrying cost = $204.00/month carrying cost.",
    recommendation: "Apply a targeted 30% discount at Suburban Galleria, or bundle with winter apparel, or relocate 30 units to Uptown Fashion Hub.",
    actionLabel: "Apply 30% Promo Discount",
    carryingCost: 204
  },
  {
    id: "a4",
    type: "slow_moving",
    productId: "p8",
    storeId: "s1",
    title: "Slow-Moving Stock: Classic Leather Wallet",
    description: "Downtown Plaza holds 120 units of Classic Leather Wallets with only 2 units sold in the last 30 days.",
    metric: "Excess Capital Tied Up",
    calculation: "120 units * $14 cost = $1,680 tied-up capital. 5% monthly carrying cost = $84.00/month carrying cost.",
    recommendation: 'Run a "BOGO 50% Off" promotion or move 40 units to Suburban Galleria or Uptown Fashion Hub where accessories sales are stronger.',
    actionLabel: "Launch BOGO 50% Promo",
    carryingCost: 84
  },
  {
    id: "a5",
    type: "overstock",
    productId: "p10",
    storeId: "s3",
    title: "Severe Overstock: Plush Weighted Blanket",
    description: "Suburban Galleria stock level (150) exceeds maximum store capacity (100) by 50 units.",
    metric: "150% Capacity Exceeded",
    calculation: "Stock: 150 units / Capacity: 100 units = 150% storage capacity reached. Excess: 50 units * $25 cost = $1,250 tied capital.",
    recommendation: "Create a seasonal end-cap display with a 15% markdown, or halt incoming shipments immediately.",
    actionLabel: "Halt Incoming Shipments & Create End-Cap",
    carryingCost: 62.5
  },
  {
    id: "a6",
    type: "sales_spike",
    productId: "p3",
    storeId: "s1",
    title: "Sales Spike Detected: Stride Lite Runners",
    description: "Downtown Plaza saw an unexpected 25-unit sales volume on 2026-09-02 (normally 1.2 units/day).",
    metric: "+2,083% Daily Surge",
    calculation: "Spike: 25 units sold vs. Daily average baseline of 1.2 units. Surge ratio of 20.8x standard volume.",
    recommendation: "Review local event calendars (e.g. marathons, promotions) and temporarily increase the Downtown reorder point from 15 to 30 units.",
    actionLabel: "Increase Reorder Point to 30"
  },
  {
    id: "a7",
    type: "sales_drop",
    productId: "p1",
    storeId: "s3",
    title: "Sudden Sales Drop: EcoCotton Crewneck",
    description: "Suburban Galleria sales dropped from ~2 units/day to 0 units/day for 4 consecutive days.",
    metric: "Zero Sales Streak",
    calculation: "4 days of 0 sales vs. historical average of 1.8 units/day.",
    recommendation: "Verify physical stock on shelf. Check for inventory system discrepancy (phantom inventory) or incorrect merchandising display placement.",
    actionLabel: "Verify Shelf Stock"
  }
];

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/data", (req, res) => {
    res.json({
      products,
      stores,
      inventory,
      salesHistory,
      operationalAlerts
    });
  });
  app.post("/api/copilot", async (req, res) => {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured.",
        details: "Please set the GEMINI_API_KEY variable in your developer Secrets panel."
      });
    }
    try {
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const totalRev = salesHistory.reduce((acc, r) => acc + r.revenue, 0);
      const lowStockCount = inventory.filter((i) => i.stock <= i.reorderPoint).length;
      const groundingContext = {
        summary: {
          "30_day_total_revenue": totalRev,
          "total_products": products.length,
          "total_stores": stores.length,
          "low_stock_alerts_count": lowStockCount
        },
        products,
        stores,
        inventory_current: inventory,
        operational_alerts: operationalAlerts,
        sales_history_sample: salesHistory.slice(-50)
        // keep token payload modest
      };
      const systemInstruction = `You are the Retail Sales & Inventory Copilot, an expert AI assistant for retail store managers. 
Your role is to help managers make optimal inventory and sales decisions using exact historical data and operational principles.

CRITICAL OPERATIONAL RULES:
1. GROUNDING & ACCURACY: Ground every response in the exact figures provided in the grounding data. NEVER make up numbers, extrapolate trends without calculations, or guess.
2. CALCULATIONS MANDATORY: You must show your work! For any stock recommendations, show:
   - Stock Runway (Days of Stock) = Current Stock / Daily Velocity (7-day average). If Daily Velocity is 0, explicitly describe this as "Infinite/Stable Stock Runway (No recent sales)" instead of dividing by zero.
   - Monthly Carrying Cost (for slow-moving inventory) = Current Stock * Product Unit Cost * 5% (0.05)
   - Capacity Utilization = (Current Stock / Store Capacity) * 100%
3. SPECIFIC RECOMMENDATIONS: When replying, recommend specific, actionable operational interventions:
   - For Critical Stock-outs (Runway < 3 days): Recommend "reorder" from suppliers or "store transfer" from a specific store holding surplus.
   - For Dead/Slow-Moving Stock (<= 2 sales in 30 days): Recommend "BOGO discount" or targeted price markdowns with carrying costs displayed.
   - For Overstocking (Stock > Capacity): Recommend seasonal display campaigns, markdowns, or a temporary freeze on shipments.
4. REFUSE TO GUESS: If the store manager asks about a store, product, or metric that does not exist in the dataset, you MUST politely refuse to answer and state that the required data is missing from the database. NEVER invent details.
5. PROFESSIONAL TONE: Keep your tone highly professional, precise, and concise. Utilize markdown tables and bold headers for readability.

Here is the current live grounding database:
${JSON.stringify(groundingContext, null, 2)}
`;
      const contents = (messages || []).filter((msg) => msg && typeof msg.content === "string" && msg.content.trim() !== "").map((msg) => {
        const role = msg.role === "assistant" ? "model" : "user";
        return {
          role,
          parts: [{ text: msg.content }]
        };
      });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.2
          // minimal temperature for reliable operational grounding
        }
      });
      res.json({ response: response.text });
    } catch (err) {
      console.error("Gemini API Error:", err);
      res.status(500).json({
        error: "Gemini generation error",
        details: err.message || String(err)
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static file assets...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application successfully booted on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
