export interface Product {
  id: string;
  name: string;
  category: string;
  unitCost: number;
  unitPrice: number;
  discontinued?: boolean;
}

export interface Store {
  id: string;
  name: string;
  location: string;
}

export interface InventoryItem {
  productId: string;
  storeId: string;
  stock: number;
  capacity: number;
  reorderPoint: number;
  // Computed fields
  dailyVelocity: number; // 7-day daily velocity (sales / 7)
}

export interface SalesRecord {
  date: string; // YYYY-MM-DD
  productId: string;
  storeId: string;
  unitsSold: number;
  revenue: number;
}

export interface OperationalAlert {
  id: string;
  type: 'stock_out_risk' | 'slow_moving' | 'sales_spike' | 'sales_drop' | 'overstock';
  productId: string;
  storeId: string;
  title: string;
  description: string;
  metric: string;
  calculation: string;
  recommendation: string;
  actionLabel: string;
  carryingCost?: number; // 5% monthly carrying cost of excess inventory
}

// 10 Products
export const products: Product[] = [
  { id: 'p1', name: 'EcoCotton Crewneck', category: 'Apparel', unitCost: 15, unitPrice: 45 },
  { id: 'p2', name: 'Urban Fleece Hoodie', category: 'Apparel', unitCost: 22, unitPrice: 65 },
  { id: 'p3', name: 'Stride Lite Runners', category: 'Footwear', unitCost: 35, unitPrice: 110 },
  { id: 'p4', name: 'All-Weather Boots', category: 'Footwear', unitCost: 48, unitPrice: 140 },
  { id: 'p5', name: 'AeroSound ANC Headphones', category: 'Electronics', unitCost: 60, unitPrice: 180 },
  { id: 'p6', name: 'ChargeMax Powerbank', category: 'Electronics', unitCost: 12, unitPrice: 39 },
  { id: 'p7', name: 'Nomad Canvas Backpack', category: 'Accessories', unitCost: 20, unitPrice: 58 },
  { id: 'p8', name: 'Classic Leather Wallet', category: 'Accessories', unitCost: 14, unitPrice: 40 },
  { id: 'p9', name: 'Ceramic Candle Set', category: 'Home Goods', unitCost: 8, unitPrice: 28 },
  { id: 'p10', name: 'Plush Weighted Blanket', category: 'Home Goods', unitCost: 25, unitPrice: 75 },
];

// 3 Stores
export const stores: Store[] = [
  { id: 's1', name: 'Downtown Plaza', location: 'Metropolitan Center' },
  { id: 's2', name: 'Uptown Fashion Hub', location: 'Uptown District' },
  { id: 's3', name: 'Suburban Galleria', location: 'West End Suburbs' },
];

// Injected sales history over 30 days (ending 2026-09-04)
// Generates a predictable dataset with specific anomalies
export const generateSalesHistory = (): SalesRecord[] => {
  const records: SalesRecord[] = [];
  const baseDate = new Date('2026-09-04');

  // Let's seed predictable daily sales
  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // For each store and product, generate baseline sales
    products.forEach(p => {
      stores.forEach(s => {
        let units = 0;
        // Baseline sales based on product price & store popularity
        if (p.category === 'Electronics') {
          units = s.id === 's1' ? 1 : 0; // Electronics sell more downtown
        } else if (p.category === 'Apparel' || p.category === 'Footwear') {
          units = s.id === 's2' ? 2 : 1; // Apparel sells more uptown
        } else {
          units = 1;
        }

        // Add some random weekday/weekend variation
        const day = d.getDay();
        if (day === 0 || day === 6) {
          units += 1; // Weekend lift
        }

        // --- INJECT ANOMALIES ---
        // 1. Sales Spike: Stride Lite Runners (p3) at Downtown Plaza (s1) had a massive spike 2 days ago (2026-09-02)
        if (p.id === 'p3' && s.id === 's1' && dateStr === '2026-09-02') {
          units = 25; // Massive spike
        }

        // 2. Sales Spike: ChargeMax Powerbank (p6) at Uptown Fashion Hub (s2) had a spike 3 days ago (2026-09-01)
        if (p.id === 'p6' && s.id === 's2' && dateStr === '2026-09-01') {
          units = 30;
        }

        // 3. Sudden Sales Drop: EcoCotton Crewneck (p1) at Suburban Galleria (s3) dropped to 0 sales for last 4 days (2026-09-01 to 2026-09-04)
        if (p.id === 'p1' && s.id === 's3' && d >= new Date('2026-09-01')) {
          units = 0; // Sudden drop from normal baseline of ~2 units/day
        }

        // 4. Slow Moving Stock: All-Weather Boots (p4) at Suburban Galleria (s3) has almost zero sales
        if (p.id === 'p4' && s.id === 's3') {
          // Only 1 sale in the last 30 days (on 2026-08-15)
          units = dateStr === '2026-08-15' ? 1 : 0;
        }

        // 5. Slow Moving Stock: Classic Leather Wallet (p8) at Downtown Plaza (s1) has very low sales
        if (p.id === 'p8' && s.id === 's1') {
          // Only 2 sales in 30 days (on 2026-08-10 and 2026-08-25)
          units = (dateStr === '2026-08-10' || dateStr === '2026-08-25') ? 1 : 0;
        }

        if (units > 0) {
          records.push({
            date: dateStr,
            productId: p.id,
            storeId: s.id,
            unitsSold: units,
            revenue: units * p.unitPrice,
          });
        }
      });
    });
  }

  return records;
};

export const salesHistory: SalesRecord[] = generateSalesHistory();

// Compute 7-day daily velocity for a given product at a store
export const get7DayVelocity = (productId: string, storeId: string): number => {
  const cutoffDate = new Date('2026-09-04');
  cutoffDate.setDate(cutoffDate.getDate() - 7);
  
  const recentSales = salesHistory.filter(r => 
    r.productId === productId && 
    r.storeId === storeId && 
    new Date(r.date) > cutoffDate
  );

  const totalSold = recentSales.reduce((acc, r) => acc + r.unitsSold, 0);
  return parseFloat((totalSold / 7).toFixed(2));
};

// Current Inventory sheet including critical edge cases
export const inventory: InventoryItem[] = [
  // --- Downtown Plaza (s1) ---
  // Critical Stock-out: AeroSound Headphones (p5) - High 7-day velocity, extremely low stock
  // Sales in last 7 days: ~10 units. Daily velocity = 1.43/day. Stock = 2. Will stock-out in 1.4 days!
  { productId: 'p5', storeId: 's1', stock: 2, capacity: 50, reorderPoint: 10, dailyVelocity: 1.43 },
  // Classic Leather Wallet (p8) - Slow moving stock: Stock = 120 (high inventory), only 2 sales in 30 days.
  { productId: 'p8', storeId: 's1', stock: 120, capacity: 150, reorderPoint: 15, dailyVelocity: 0.07 },
  
  { productId: 'p1', storeId: 's1', stock: 35, capacity: 80, reorderPoint: 20, dailyVelocity: 1.14 },
  { productId: 'p2', storeId: 's1', stock: 42, capacity: 80, reorderPoint: 20, dailyVelocity: 1.28 },
  { productId: 'p3', storeId: 's1', stock: 18, capacity: 60, reorderPoint: 15, dailyVelocity: 3.57 }, // High velocity due to spike
  { productId: 'p4', storeId: 's1', stock: 22, capacity: 50, reorderPoint: 10, dailyVelocity: 0.86 },
  { productId: 'p6', storeId: 's1', stock: 45, capacity: 100, reorderPoint: 25, dailyVelocity: 1.57 },
  { productId: 'p7', storeId: 's1', stock: 28, capacity: 70, reorderPoint: 15, dailyVelocity: 0.71 },
  { productId: 'p9', storeId: 's1', stock: 40, capacity: 120, reorderPoint: 20, dailyVelocity: 1.43 },
  { productId: 'p10', storeId: 's1', stock: 15, capacity: 60, reorderPoint: 15, dailyVelocity: 0.57 },

  // --- Uptown Fashion Hub (s2) ---
  // Critical Stock-out: EcoCotton Crewneck (p1) - High velocity uptown, low stock. Stock = 4, 7-day sales = 14 (2.0/day). Run-out in 2 days.
  { productId: 'p1', storeId: 's2', stock: 4, capacity: 100, reorderPoint: 25, dailyVelocity: 2.0 },
  
  { productId: 'p2', storeId: 's2', stock: 55, capacity: 100, reorderPoint: 25, dailyVelocity: 2.14 },
  { productId: 'p3', storeId: 's2', stock: 30, capacity: 80, reorderPoint: 20, dailyVelocity: 1.86 },
  { productId: 'p4', storeId: 's2', stock: 18, capacity: 60, reorderPoint: 15, dailyVelocity: 0.71 },
  { productId: 'p5', storeId: 's2', stock: 25, capacity: 60, reorderPoint: 15, dailyVelocity: 0.86 },
  { productId: 'p6', storeId: 's2', stock: 20, capacity: 120, reorderPoint: 30, dailyVelocity: 4.29 }, // High velocity due to spike
  { productId: 'p7', storeId: 's2', stock: 65, capacity: 90, reorderPoint: 20, dailyVelocity: 1.14 },
  { productId: 'p8', storeId: 's2', stock: 32, capacity: 80, reorderPoint: 15, dailyVelocity: 0.86 },
  { productId: 'p9', storeId: 's2', stock: 80, capacity: 150, reorderPoint: 30, dailyVelocity: 1.71 },
  { productId: 'p10', storeId: 's2', stock: 38, capacity: 80, reorderPoint: 20, dailyVelocity: 1.0 },

  // --- Suburban Galleria (s3) ---
  // Dead Stock: All-Weather Boots (p4) - High stock (85), only 1 sale in last 30 days. Velocity = 0.03.
  { productId: 'p4', storeId: 's3', stock: 85, capacity: 100, reorderPoint: 15, dailyVelocity: 0.03 },
  // Overstock: Plush Weighted Blanket (p10) - Stock is 150, capacity is 100. Carrying cost is very high!
  { productId: 'p10', storeId: 's3', stock: 150, capacity: 100, reorderPoint: 20, dailyVelocity: 0.43 },
  
  { productId: 'p1', storeId: 's3', stock: 50, capacity: 80, reorderPoint: 20, dailyVelocity: 0.0 }, // Sudden drop to zero
  { productId: 'p2', storeId: 's3', stock: 34, capacity: 80, reorderPoint: 20, dailyVelocity: 0.86 },
  { productId: 'p3', storeId: 's3', stock: 22, capacity: 60, reorderPoint: 15, dailyVelocity: 0.71 },
  { productId: 'p5', storeId: 's3', stock: 12, capacity: 50, reorderPoint: 12, dailyVelocity: 0.43 },
  { productId: 'p6', storeId: 's3', stock: 58, capacity: 100, reorderPoint: 20, dailyVelocity: 1.14 },
  { productId: 'p7', storeId: 's3', stock: 40, capacity: 70, reorderPoint: 15, dailyVelocity: 0.57 },
  { productId: 'p8', storeId: 's3', stock: 45, capacity: 80, reorderPoint: 15, dailyVelocity: 0.57 },
  { productId: 'p9', storeId: 's3', stock: 72, capacity: 120, reorderPoint: 25, dailyVelocity: 1.28 },
];

// Helper to pre-populate operational alerts with exact calculations
export const operationalAlerts: OperationalAlert[] = [
  {
    id: 'a1',
    type: 'stock_out_risk',
    productId: 'p5',
    storeId: 's1',
    title: 'Critical Stock-out Risk: AeroSound ANC Headphones',
    description: 'Downtown Plaza is running extremely low on AeroSound Headphones with an active sales run rate.',
    metric: '1.4 Days of Stock Remaining',
    calculation: 'Stock: 2 units / 7-Day Velocity: 1.43 units/day = 1.4 days of stock.',
    recommendation: 'Initiate a store transfer of 10 units from Suburban Galleria (s3 has 12 units, low sales velocity of 0.43/day) or place an expedited purchase order.',
    actionLabel: 'Transfer from Suburban Galleria',
  },
  {
    id: 'a2',
    type: 'stock_out_risk',
    productId: 'p1',
    storeId: 's2',
    title: 'Critical Stock-out Risk: EcoCotton Crewneck',
    description: 'Uptown Fashion Hub has almost exhausted EcoCotton Crewneck inventory due to high apparel velocity.',
    metric: '2.0 Days of Stock Remaining',
    calculation: 'Stock: 4 units / 7-Day Velocity: 2.00 units/day = 2.0 days of stock.',
    recommendation: 'Reorder 50 units immediately from the supplier, or transfer 15 units from Suburban Galleria (s3 has 50 units, velocity of 0.0).',
    actionLabel: 'Transfer 15 units from Suburban Galleria',
  },
  {
    id: 'a3',
    type: 'slow_moving',
    productId: 'p4',
    storeId: 's3',
    title: 'Dead / Slow-Moving Stock: All-Weather Boots',
    description: 'Suburban Galleria is holding 85 units of All-Weather Boots with only 1 unit sold in the last 30 days.',
    metric: 'Carrying Cost Sink',
    calculation: '85 units * $48 cost = $4,080 tied-up capital. 5% monthly carrying cost = $204.00/month carrying cost.',
    recommendation: 'Apply a targeted 30% discount at Suburban Galleria, or bundle with winter apparel, or relocate 30 units to Uptown Fashion Hub.',
    actionLabel: 'Apply 30% Promo Discount',
    carryingCost: 204.00,
  },
  {
    id: 'a4',
    type: 'slow_moving',
    productId: 'p8',
    storeId: 's1',
    title: 'Slow-Moving Stock: Classic Leather Wallet',
    description: 'Downtown Plaza holds 120 units of Classic Leather Wallets with only 2 units sold in the last 30 days.',
    metric: 'Excess Capital Tied Up',
    calculation: '120 units * $14 cost = $1,680 tied-up capital. 5% monthly carrying cost = $84.00/month carrying cost.',
    recommendation: 'Run a "BOGO 50% Off" promotion or move 40 units to Suburban Galleria or Uptown Fashion Hub where accessories sales are stronger.',
    actionLabel: 'Launch BOGO 50% Promo',
    carryingCost: 84.00,
  },
  {
    id: 'a5',
    type: 'overstock',
    productId: 'p10',
    storeId: 's3',
    title: 'Severe Overstock: Plush Weighted Blanket',
    description: 'Suburban Galleria stock level (150) exceeds maximum store capacity (100) by 50 units.',
    metric: '150% Capacity Exceeded',
    calculation: 'Stock: 150 units / Capacity: 100 units = 150% storage capacity reached. Excess: 50 units * $25 cost = $1,250 tied capital.',
    recommendation: 'Create a seasonal end-cap display with a 15% markdown, or halt incoming shipments immediately.',
    actionLabel: 'Halt Incoming Shipments & Create End-Cap',
    carryingCost: 62.50,
  },
  {
    id: 'a6',
    type: 'sales_spike',
    productId: 'p3',
    storeId: 's1',
    title: 'Sales Spike Detected: Stride Lite Runners',
    description: 'Downtown Plaza saw an unexpected 25-unit sales volume on 2026-09-02 (normally 1.2 units/day).',
    metric: '+2,083% Daily Surge',
    calculation: 'Spike: 25 units sold vs. Daily average baseline of 1.2 units. Surge ratio of 20.8x standard volume.',
    recommendation: 'Review local event calendars (e.g. marathons, promotions) and temporarily increase the Downtown reorder point from 15 to 30 units.',
    actionLabel: 'Increase Reorder Point to 30',
  },
  {
    id: 'a7',
    type: 'sales_drop',
    productId: 'p1',
    storeId: 's3',
    title: 'Sudden Sales Drop: EcoCotton Crewneck',
    description: 'Suburban Galleria sales dropped from ~2 units/day to 0 units/day for 4 consecutive days.',
    metric: 'Zero Sales Streak',
    calculation: '4 days of 0 sales vs. historical average of 1.8 units/day.',
    recommendation: 'Verify physical stock on shelf. Check for inventory system discrepancy (phantom inventory) or incorrect merchandising display placement.',
    actionLabel: 'Verify Shelf Stock',
  }
];

// Helper functions for summary metrics
export const getSummaryMetrics = () => {
  const totalRevenue = salesHistory.reduce((acc, r) => acc + r.revenue, 0);
  const totalCost = salesHistory.reduce((acc, r) => {
    const p = products.find(prod => prod.id === r.productId);
    return acc + (r.unitsSold * (p?.unitCost || 0));
  }, 0);
  
  const anomaliesCount = operationalAlerts.filter(a => a.type === 'sales_spike' || a.type === 'sales_drop').length;
  const lowStockCount = inventory.filter(i => i.stock <= i.reorderPoint).length;
  
  // Total units sold divided by 30 days across all stores/products
  const totalUnitsSold = salesHistory.reduce((acc, r) => acc + r.unitsSold, 0);
  const averageDailyVelocity = parseFloat((totalUnitsSold / 30).toFixed(1));

  return {
    revenue30Day: totalRevenue,
    profit30Day: totalRevenue - totalCost,
    anomaliesCount,
    lowStockCount,
    dailyVelocity: averageDailyVelocity,
  };
};
