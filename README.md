TRACK_ID=PS03

# Track 3: Retail - Sales and Inventory Copilot

An advanced, production-ready AI Copilot and analytics suite designed for retail store managers. The solution ingests fragmented store inventory sheets, catalogues, and daily historical sales records to automatically predict stock-out runouts, compute capital tied-up losses (carrying costs), detect daily market anomalies, and prescribe precise operational actions via Gemini 2.5-Flash.

---

## ⚡ Quick Start (Single Command Launch)

As required by the critical hackathon constraints, you can launch the **entire application** (FastAPI backend + compiled React frontend together) with a single sequence:

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Boot the unified server on Port 8000
python app.py
```

Visit **`http://localhost:8000`** in your browser.

> **Note on Compilation**: If you do not have the compiled frontend static folder (`dist/`) present on startup, `app.py` has custom defensive coding to automatically check, run `npm install`, and execute `npm run build` so that the entire dashboard is served flawlessly without manual steps.

---

## 🌟 Key Capabilities & Features

### 1. Unified FastAPI & Python Backend (`app.py`)
- Employs **FastAPI** to expose high-performance endpoints:
  - `/api/data`: Returns detailed synthetic tables containing products, stores, current stocks, capacities, reorders, and 30-day records.
  - `/api/copilot`: Conversations endpoint using the official **Google GenAI Python SDK (`google-genai`)** with model **`gemini-2.5-flash`**.
- Leverages strict, mathematical system instructions to guarantee all chatbot answers contain exact figures, show calculations, and reject speculation or guessing if requested data is missing.

### 2. High-Fidelity React & Tailwind Dashboard (`src/`)
- **Top Metrics Bar**: Visualizes 30-Day Revenue, Active Sales Anomalies, Low Stock Alert Counts, and overall Daily Sales Velocity.
- **Attention Panel ("What Needs Attention Today")**: Expandable diagnostic cards highlighting critical stock-outs, severe overstocking, sales spikes, or sudden drops. Cards feature full mathematical proofs and calculated tied-up capital carrying losses (5% monthly carrying cost).
- **30-Day Sales Trend Chart**: Built with **Recharts**, featuring interactive overlays for both unit volumes and revenues, supporting filters by stores and product categories.
- **Catalogue & Inventory Explorer**: Search, filter, and adjust current stock counts with quick increment buttons and manual entry selectors.
- **AI Copilot Chat Drawer**: Converse with the model using suggeted prompts, responsive load indicators, and a **Live Grounding Database toggle** displaying the raw JSON payload passed to Gemini.

---

## 📐 Mathematical Formulas Injected into Grounding Engine

The copilot is grounded in standard operational retail formulas:
1. **Stock Runway (Days of Stock)**: 
   $$\text{Runway} = \frac{\text{Current Stock}}{\text{7-Day Average Daily Velocity}}$$
2. **Monthly Inventory Carrying Cost**:
   $$\text{Carrying Cost} = \text{Current Stock} \times \text{Product Unit Cost} \times 5\% \text{ (0.05 monthly carrying rate)}$$
3. **Storage Capacity Utilization**:
   $$\text{Utilization} = \left( \frac{\text{Current Stock}}{\text{Maximum Store Capacity}} \right) \times 100\%$$

---

## 🛠️ File Structure

```
/
├── app.py                # Unified FastAPI Backend & Static File Server
├── requirements.txt      # Minimal Python dependencies (google-genai, fastapi, uvicorn)
├── package.json          # React, Vite, Recharts, and Lucide package manifests
├── vite.config.ts        # Vite configuration binding
├── README.md             # This file (starts with TRACK_ID=PS03)
└── src/
    ├── App.tsx           # Master React Dashboard Layout & State Orchestrator
    ├── shared/
    │   └── storeData.ts  # Structured Synthetic Data Layer & Type Declarations
    └── components/
        ├── AttentionPanel.tsx  # Dynamic list of critical stock alerts & calculations
        ├── CatalogExplorer.tsx # Searchable list of product catalog vs max capacities
        ├── SalesTrendChart.tsx # Recharts sales volume trend graphs
        └── CopilotChat.tsx     # Converstational AI Chat panel with grounding JSON inspector
```
