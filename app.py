import os
import json
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Retail Sales & Inventory Copilot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# SYNTHETIC DATA ENGINE
# -------------------------------------------------------------

PRODUCTS = [
    {"id": "p1", "name": "EcoCotton Crewneck", "category": "Apparel", "unitCost": 15, "unitPrice": 45},
    {"id": "p2", "name": "Urban Fleece Hoodie", "category": "Apparel", "unitCost": 22, "unitPrice": 65},
    {"id": "p3", "name": "Stride Lite Runners", "category": "Footwear", "unitCost": 35, "unitPrice": 110},
    {"id": "p4", "name": "All-Weather Boots", "category": "Footwear", "unitCost": 48, "unitPrice": 140},
    {"id": "p5", "name": "AeroSound ANC Headphones", "category": "Electronics", "unitCost": 60, "unitPrice": 180},
    {"id": "p6", "name": "ChargeMax Powerbank", "category": "Electronics", "unitCost": 12, "unitPrice": 39},
    {"id": "p7", "name": "Nomad Canvas Backpack", "category": "Accessories", "unitCost": 20, "unitPrice": 58},
    {"id": "p8", "name": "Classic Leather Wallet", "category": "Accessories", "unitCost": 14, "unitPrice": 40},
    {"id": "p9", "name": "Ceramic Candle Set", "category": "Home Goods", "unitCost": 8, "unitPrice": 28},
    {"id": "p10", "name": "Plush Weighted Blanket", "category": "Home Goods", "unitCost": 25, "unitPrice": 75},
]

STORES = [
    {"id": "s1", "name": "Downtown Plaza", "location": "Metropolitan Center"},
    {"id": "s2", "name": "Uptown Fashion Hub", "location": "Uptown District"},
    {"id": "s3", "name": "Suburban Galleria", "location": "West End Suburbs"},
]

INVENTORY = [
    {"productId": "p5", "storeId": "s1", "stock": 2, "capacity": 50, "reorderPoint": 10, "dailyVelocity": 1.43},
    {"productId": "p8", "storeId": "s1", "stock": 120, "capacity": 150, "reorderPoint": 15, "dailyVelocity": 0.07},
    {"productId": "p1", "storeId": "s1", "stock": 35, "capacity": 80, "reorderPoint": 20, "dailyVelocity": 1.14},
    {"productId": "p2", "storeId": "s1", "stock": 42, "capacity": 80, "reorderPoint": 20, "dailyVelocity": 1.28},
    {"productId": "p3", "storeId": "s1", "stock": 18, "capacity": 60, "reorderPoint": 15, "dailyVelocity": 3.57},
    {"productId": "p4", "storeId": "s1", "stock": 22, "capacity": 50, "reorderPoint": 10, "dailyVelocity": 0.86},
    {"productId": "p6", "storeId": "s1", "stock": 45, "capacity": 100, "reorderPoint": 25, "dailyVelocity": 1.57},
    {"productId": "p7", "storeId": "s1", "stock": 28, "capacity": 70, "reorderPoint": 15, "dailyVelocity": 0.71},
    {"productId": "p9", "storeId": "s1", "stock": 40, "capacity": 120, "reorderPoint": 20, "dailyVelocity": 1.43},
    {"productId": "p10", "storeId": "s1", "stock": 15, "capacity": 60, "reorderPoint": 15, "dailyVelocity": 0.57},
    
    {"productId": "p1", "storeId": "s2", "stock": 4, "capacity": 100, "reorderPoint": 25, "dailyVelocity": 2.0},
    {"productId": "p2", "storeId": "s2", "stock": 55, "capacity": 100, "reorderPoint": 25, "dailyVelocity": 2.14},
    {"productId": "p3", "storeId": "s2", "stock": 30, "capacity": 80, "reorderPoint": 20, "dailyVelocity": 1.86},
    {"productId": "p4", "storeId": "s2", "stock": 18, "capacity": 60, "reorderPoint": 15, "dailyVelocity": 0.71},
    {"productId": "p5", "storeId": "s2", "stock": 25, "capacity": 60, "reorderPoint": 15, "dailyVelocity": 0.86},
    {"productId": "p6", "storeId": "s2", "stock": 20, "capacity": 120, "reorderPoint": 30, "dailyVelocity": 4.29},
    {"productId": "p7", "storeId": "s2", "stock": 65, "capacity": 90, "reorderPoint": 20, "dailyVelocity": 1.14},
    {"productId": "p8", "storeId": "s2", "stock": 32, "capacity": 80, "reorderPoint": 15, "dailyVelocity": 0.86},
    {"productId": "p9", "storeId": "s2", "stock": 80, "capacity": 150, "reorderPoint": 30, "dailyVelocity": 1.71},
    {"productId": "p10", "storeId": "s2", "stock": 38, "capacity": 80, "reorderPoint": 20, "dailyVelocity": 1.0},
    
    {"productId": "p4", "storeId": "s3", "stock": 85, "capacity": 100, "reorderPoint": 15, "dailyVelocity": 0.03},
    {"productId": "p10", "storeId": "s3", "stock": 150, "capacity": 100, "reorderPoint": 20, "dailyVelocity": 0.43},
    {"productId": "p1", "storeId": "s3", "stock": 50, "capacity": 80, "reorderPoint": 20, "dailyVelocity": 0.0},
    {"productId": "p2", "storeId": "s3", "stock": 34, "capacity": 80, "reorderPoint": 20, "dailyVelocity": 0.86},
    {"productId": "p3", "storeId": "s3", "stock": 22, "capacity": 60, "reorderPoint": 15, "dailyVelocity": 0.71},
    {"productId": "p5", "storeId": "s3", "stock": 12, "capacity": 50, "reorderPoint": 12, "dailyVelocity": 0.43},
    {"productId": "p6", "storeId": "s3", "stock": 58, "capacity": 100, "reorderPoint": 20, "dailyVelocity": 1.14},
    {"productId": "p7", "storeId": "s3", "stock": 40, "capacity": 70, "reorderPoint": 15, "dailyVelocity": 0.57},
    {"productId": "p8", "storeId": "s3", "stock": 45, "capacity": 80, "reorderPoint": 15, "dailyVelocity": 0.57},
    {"productId": "p9", "storeId": "s3", "stock": 72, "capacity": 120, "reorderPoint": 25, "dailyVelocity": 1.28},
]

OPERATIONAL_ALERTS = [
  {
    "id": "a1",
    "type": "stock_out_risk",
    "productId": "p5",
    "storeId": "s1",
    "title": "Critical Stock-out Risk: AeroSound ANC Headphones",
    "description": "Downtown Plaza is running extremely low on AeroSound Headphones with an active sales run rate.",
    "metric": "1.4 Days of Stock Remaining",
    "calculation": "Stock: 2 units / 7-Day Velocity: 1.43 units/day = 1.4 days of stock.",
    "recommendation": "Initiate a store transfer of 10 units from Suburban Galleria (s3 has 12 units, low sales velocity of 0.43/day) or place an expedited purchase order.",
    "actionLabel": "Transfer from Suburban Galleria",
  },
  {
    "id": "a2",
    "type": "stock_out_risk",
    "productId": "p1",
    "storeId": "s2",
    "title": "Critical Stock-out Risk: EcoCotton Crewneck",
    "description": "Uptown Fashion Hub has almost exhausted EcoCotton Crewneck inventory due to high apparel velocity.",
    "metric": "2.0 Days of Stock Remaining",
    "calculation": "Stock: 4 units / 7-Day Velocity: 2.00 units/day = 2.0 days of stock.",
    "recommendation": "Reorder 50 units immediately from the supplier, or transfer 15 units from Suburban Galleria (s3 has 50 units, velocity of 0.0).",
    "actionLabel": "Transfer 15 units from Suburban Galleria",
  },
  {
    "id": "a3",
    "type": "slow_moving",
    "productId": "p4",
    "storeId": "s3",
    "title": "Dead / Slow-Moving Stock: All-Weather Boots",
    "description": "Suburban Galleria is holding 85 units of All-Weather Boots with only 1 unit sold in the last 30 days.",
    "metric": "Carrying Cost Sink",
    "calculation": "85 units * $48 cost = $4,080 tied-up capital. 5% monthly carrying cost = $204.00/month carrying cost.",
    "recommendation": "Apply a targeted 30% discount at Suburban Galleria, or bundle with winter apparel, or relocate 30 units to Uptown Fashion Hub.",
    "actionLabel": "Apply 30% Promo Discount",
    "carryingCost": 204.00,
  },
  {
    "id": "a4",
    "type": "slow_moving",
    "productId": "p8",
    "storeId": "s1",
    "title": "Slow-Moving Stock: Classic Leather Wallet",
    "description": "Downtown Plaza holds 120 units of Classic Leather Wallets with only 2 units sold in the last 30 days.",
    "metric": "Excess Capital Tied Up",
    "calculation": "120 units * $14 cost = $1,680 tied-up capital. 5% monthly carrying cost = $84.00/month carrying cost.",
    "recommendation": "Run a \"BOGO 50% Off\" promotion or move 40 units to Suburban Galleria or Uptown Fashion Hub where accessories sales are stronger.",
    "actionLabel": "Launch BOGO 50% Promo",
    "carryingCost": 84.00,
  },
  {
    "id": "a5",
    "type": "overstock",
    "productId": "p10",
    "storeId": "s3",
    "title": "Severe Overstock: Plush Weighted Blanket",
    "description": "Suburban Galleria stock level (150) exceeds maximum store capacity (100) by 50 units.",
    "metric": "150% Capacity Exceeded",
    "calculation": "Stock: 150 units / Capacity: 100 units = 150% storage capacity reached. Excess: 50 units * $25 cost = $1,250 tied capital.",
    "recommendation": "Create a seasonal end-cap display with a 15% markdown, or halt incoming shipments immediately.",
    "actionLabel": "Halt Incoming Shipments & Create End-Cap",
    "carryingCost": 62.50,
  },
  {
    "id": "a6",
    "type": "sales_spike",
    "productId": "p3",
    "storeId": "s1",
    "title": "Sales Spike Detected: Stride Lite Runners",
    "description": "Downtown Plaza saw an unexpected 25-unit sales volume on 2026-09-02 (normally 1.2 units/day).",
    "metric": "+2,083% Daily Surge",
    "calculation": "Spike: 25 units sold vs. Daily average baseline of 1.2 units. Surge ratio of 20.8x standard volume.",
    "recommendation": "Review local event calendars (e.g. marathons, promotions) and temporarily increase the Downtown reorder point from 15 to 30 units.",
    "actionLabel": "Increase Reorder Point to 30",
  },
  {
    "id": "a7",
    "type": "sales_drop",
    "productId": "p1",
    "storeId": "s3",
    "title": "Sudden Sales Drop: EcoCotton Crewneck",
    "description": "Suburban Galleria sales dropped from ~2 units/day to 0 units/day for 4 consecutive days.",
    "metric": "Zero Sales Streak",
    "calculation": "4 days of 0 sales vs. historical average of 1.8 units/day.",
    "recommendation": "Verify physical stock on shelf. Check for inventory system discrepancy (phantom inventory) or incorrect merchandising display placement.",
    "actionLabel": "Verify Shelf Stock",
  }
]

def get_sales_history():
    records = []
    base_days = 30
    for i in range(base_days - 1, -1, -1):
        day_index = 4 - i
        month = 8 if day_index <= 0 else 9
        day = 31 + day_index if day_index <= 0 else day_index
        date_str = f"2026-{month:02d}-{day:02d}"
        
        for p in PRODUCTS:
            for s in STORES:
                units = 1
                if p["category"] == "Electronics":
                    units = 1 if s["id"] == "s1" else 0
                elif p["category"] in ["Apparel", "Footwear"]:
                    units = 2 if s["id"] == "s2" else 1
                
                if day % 7 in [5, 6]:
                    units += 1
                
                if p["id"] == "p3" and s["id"] == "s1" and date_str == "2026-09-02":
                    units = 25
                if p["id"] == "p6" and s["id"] == "s2" and date_str == "2026-09-01":
                    units = 30
                if p["id"] == "p1" and s["id"] == "s3" and date_str in ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]:
                    units = 0
                if p["id"] == "p4" and s["id"] == "s3":
                    units = 1 if date_str == "2026-08-15" else 0
                if p["id"] == "p8" and s["id"] == "s1":
                    units = 1 if date_str in ["2026-08-10", "2026-08-25"] else 0
                
                if units > 0:
                    records.append({
                        "date": date_str,
                        "productId": p["id"],
                        "storeId": s["id"],
                        "unitsSold": units,
                        "revenue": units * p["unitPrice"],
                    })
    return records

SALES_HISTORY = get_sales_history()

# -------------------------------------------------------------
# API ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/data")
async def get_retail_data():
    return {
        "products": PRODUCTS,
        "stores": STORES,
        "inventory": INVENTORY,
        "salesHistory": SALES_HISTORY,
        "operationalAlerts": OPERATIONAL_ALERTS
    }

class ChatMessage(BaseModel):
    role: str
    content: str

class CopilotRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/api/copilot")
async def handle_copilot_chat(payload: CopilotRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return JSONResponse(
            status_code=500,
            content={
                "error": "GEMINI_API_KEY is not configured.",
                "details": "Please set the GEMINI_API_KEY variable in your environment or Secrets panel."
            }
        )

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Google GenAI SDK is not installed.",
                "details": "Please run 'pip install google-genai'."
            }
        )

    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to initialize Gemini Client", "details": str(e)}
        )

    metrics_summary = {
        "30_day_total_revenue": sum(r["revenue"] for r in SALES_HISTORY),
        "total_products": len(PRODUCTS),
        "total_stores": len(STORES),
        "low_stock_alerts_count": len([i for i in INVENTORY if i["stock"] <= i["reorderPoint"]])
    }

    grounding_context = {
        "summary": metrics_summary,
        "products": PRODUCTS,
        "stores": STORES,
        "inventory_current": INVENTORY,
        "operational_alerts": OPERATIONAL_ALERTS,
        "sales_history_sample": SALES_HISTORY[-50:]
    }

    grounding_data_str = json.dumps(grounding_context, indent=2)

    system_instruction = f"""You are the Retail Sales & Inventory Copilot, an expert AI assistant for retail store managers. 
Your role is to help managers make optimal inventory and sales decisions using exact historical data and operational principles.

CRITICAL OPERATIONAL RULES:
1. GROUNDING & ACCURACY: Ground every response in the exact figures provided in the grounding data. NEVER make up numbers, extrapolate trends without calculations, or guess.
2. CALCULATIONS MANDATORY: You must show your work! For any stock recommendations, show:
   - Stock Runway (Days of Stock) = Current Stock / Daily Velocity (7-day average)
   - Monthly Carrying Cost (for slow-moving inventory) = Current Stock * Product Unit Cost * 5% (0.05)
   - Capacity Utilization = (Current Stock / Store Capacity) * 100%
3. SPECIFIC RECOMMENDATIONS: When replying, recommend specific, actionable operational interventions:
   - For Critical Stock-outs (Runway < 3 days): Recommend "reorder" from suppliers or "store transfer" from a specific store holding surplus.
   - For Dead/Slow-Moving Stock (<= 2 sales in 30 days): Recommend "BOGO discount" or targeted price markdowns with carrying costs displayed.
   - For Overstocking (Stock > Capacity): Recommend seasonal display campaigns, markdowns, or a temporary freeze on shipments.
4. REFUSE TO GUESS: If the store manager asks about a store, product, or metric that does not exist in the dataset, you MUST politely refuse to answer and state that the required data is missing from the database. NEVER invent details.
5. PROFESSIONAL TONE: Keep your tone highly professional, precise, and concise. Utilize markdown tables and bold headers for readability.

Here is the current live grounding database:
{grounding_data_str}
"""

    contents = []
    for msg in payload.messages:
        role = "model" if msg.role == "assistant" else "user"
        contents.append(types.Content(
            role=role,
            parts=[types.Part.from_text(text=msg.content)]
        ))

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
            )
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini generation error: {str(e)}")

# -------------------------------------------------------------
# STATIC FRONTEND MOUNTING & SPA ROUTING
# -------------------------------------------------------------

dist_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
assets_path = os.path.join(dist_path, "assets")

if os.path.exists(dist_path):
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(dist_path, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))
else:
    @app.get("/")
    async def index_fallback():
        return {
            "status": "API Server Active",
            "message": "Frontend static files ('dist/') not found. Please compile the applet with 'npm run build' first.",
            "instructions": "Run 'python app.py' again after building or execute 'npm run build'."
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)