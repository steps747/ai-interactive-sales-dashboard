import { OrderRecord, GroupedOrder, PaymentMethod, TimeGranularity } from '../types';

export function formatDateUkrainian(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}`;
  }
  return dateStr;
}

export const PAYMENT_METHOD_NAMES_UA: Record<PaymentMethod, string> = {
  'Credit Card': 'Кредитна картка',
  'Debit Card': 'Дебетова картка',
  'eWallet': 'Електронний гаманець',
  'Cash': 'Готівка',
};

export const DAY_NAMES_UA: Record<string, string> = {
  Monday: 'Понеділок',
  Tuesday: 'Вівторок',
  Wednesday: 'Середа',
  Thursday: 'Четвер',
  Friday: "П'ятниця",
  Saturday: 'Субота',
  Sunday: 'Неділя',
};

export const DAY_NAMES_SHORT_UA: Record<string, string> = {
  Monday: 'Пн',
  Tuesday: 'Вт',
  Wednesday: 'Ср',
  Thursday: 'Чт',
  Friday: 'Пт',
  Saturday: 'Сб',
  Sunday: 'Нд',
};

export const MONTH_NAMES_UA: Record<string, string> = {
  'August 2025': 'Серпень 2025',
  'September 2025': 'Вересень 2025',
  'October 2025': 'Жовтень 2025',
};

export const CATEGORY_NAMES_UA: Record<string, string> = {
  'Formal & Suiting': 'Діловий та класичний одяг',
  'Smart Casual': 'Смарт-кежуал',
  'Denim': 'Денім',
  'Activewear': 'Спортивний одяг',
  'Workwear & Utility': 'Робочий та утилітарний стиль',
  'Summer Resort': 'Літній курортний одяг',
};

export function groupRecordsByOrder(records: OrderRecord[]): GroupedOrder[] {
  const map = new Map<string, GroupedOrder>();

  records.forEach((r) => {
    if (!map.has(r.orderNumber)) {
      map.set(r.orderNumber, {
        orderNumber: r.orderNumber,
        date: r.date,
        paymentMethod: r.paymentMethod,
        items: [],
        totalPrice: 0,
        itemCount: 0,
      });
    }

    const order = map.get(r.orderNumber)!;
    order.items.push({
      product: r.product,
      price: r.price,
      category: r.category,
    });
    order.totalPrice += r.price;
    order.itemCount += 1;
  });

  return Array.from(map.values());
}

export function computeSummaryMetrics(records: OrderRecord[]) {
  const totalRevenue = records.reduce((sum, r) => sum + r.price, 0);
  const totalUnits = records.length;
  const groupedOrders = groupRecordsByOrder(records);
  const totalOrders = groupedOrders.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const avgItemPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

  const multiItemOrders = groupedOrders.filter((o) => o.itemCount > 1);
  const multiItemRate = totalOrders > 0 ? (multiItemOrders.length / totalOrders) * 100 : 0;

  // Product counts & revenues
  const productStats: Record<string, { units: number; revenue: number }> = {};
  records.forEach((r) => {
    if (!productStats[r.product]) {
      productStats[r.product] = { units: 0, revenue: 0 };
    }
    productStats[r.product].units += 1;
    productStats[r.product].revenue += r.price;
  });

  const sortedByRevenue = Object.entries(productStats).sort((a, b) => b[1].revenue - a[1].revenue);
  const sortedByUnits = Object.entries(productStats).sort((a, b) => b[1].units - a[1].units);

  const topProductByRevenue = sortedByRevenue[0]
    ? { name: sortedByRevenue[0][0], revenue: sortedByRevenue[0][1].revenue, units: sortedByRevenue[0][1].units }
    : null;

  const topProductByUnits = sortedByUnits[0]
    ? { name: sortedByUnits[0][0], units: sortedByUnits[0][1].units, revenue: sortedByUnits[0][1].revenue }
    : null;

  // Payment method stats
  const paymentStats: Record<PaymentMethod, { count: number; revenue: number }> = {
    'Credit Card': { count: 0, revenue: 0 },
    'Debit Card': { count: 0, revenue: 0 },
    'eWallet': { count: 0, revenue: 0 },
    'Cash': { count: 0, revenue: 0 },
  };

  records.forEach((r) => {
    paymentStats[r.paymentMethod].count += 1;
    paymentStats[r.paymentMethod].revenue += r.price;
  });

  const topPayment = Object.entries(paymentStats).sort((a, b) => b[1].revenue - a[1].revenue)[0];

  return {
    totalRevenue,
    totalUnits,
    totalOrders,
    aov,
    avgItemPrice,
    multiItemOrdersCount: multiItemOrders.length,
    multiItemRate,
    topProductByRevenue,
    topProductByUnits,
    topPayment: topPayment ? { method: topPayment[0] as PaymentMethod, revenue: topPayment[1].revenue, count: topPayment[1].count } : null,
    paymentStats,
  };
}

export function computeTimeSeries(records: OrderRecord[], granularity: TimeGranularity) {
  if (records.length === 0) return [];

  // Sort records chronologically
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  if (granularity === 'daily') {
    const dailyMap = new Map<string, { date: string; displayDate: string; revenue: number; units: number; orders: Set<string>; 'Credit Card': number; 'Debit Card': number; eWallet: number; Cash: number }>();

    // Fill all dates in range
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);

    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = formatDateShort(dateStr);
      dailyMap.set(dateStr, {
        date: dateStr,
        displayDate,
        revenue: 0,
        units: 0,
        orders: new Set(),
        'Credit Card': 0,
        'Debit Card': 0,
        eWallet: 0,
        Cash: 0,
      });
    }

    sorted.forEach((r) => {
      const entry = dailyMap.get(r.date);
      if (entry) {
        entry.revenue += r.price;
        entry.units += 1;
        entry.orders.add(r.orderNumber);
        entry[r.paymentMethod] += r.price;
      }
    });

    let cumulativeRevenue = 0;
    const array = Array.from(dailyMap.values()).map((item, idx, arr) => {
      cumulativeRevenue += item.revenue;
      
      // Compute 7-day rolling average
      const startIdx = Math.max(0, idx - 6);
      const slice = arr.slice(startIdx, idx + 1);
      const rollingAvg = slice.reduce((acc, curr) => acc + curr.revenue, 0) / slice.length;

      return {
        key: item.date,
        date: item.date,
        displayLabel: item.displayDate,
        fullDateUA: formatDateUkrainian(item.date),
        revenue: Math.round(item.revenue * 100) / 100,
        units: item.units,
        orderCount: item.orders.size,
        aov: item.orders.size > 0 ? Math.round((item.revenue / item.orders.size) * 100) / 100 : 0,
        cumulativeRevenue: Math.round(cumulativeRevenue * 100) / 100,
        rollingAvg: Math.round(rollingAvg * 100) / 100,
        'Credit Card': item['Credit Card'],
        'Debit Card': item['Debit Card'],
        eWallet: item.eWallet,
        Cash: item.Cash,
      };
    });

    return array;
  }

  if (granularity === 'weekly') {
    const weeklyMap = new Map<string, { weekLabel: string; revenue: number; units: number; orders: Set<string>; 'Credit Card': number; 'Debit Card': number; eWallet: number; Cash: number }>();

    sorted.forEach((r) => {
      const key = `Тиждень ${r.weekNumber}`;
      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, {
          weekLabel: key,
          revenue: 0,
          units: 0,
          orders: new Set(),
          'Credit Card': 0,
          'Debit Card': 0,
          eWallet: 0,
          Cash: 0,
        });
      }
      const entry = weeklyMap.get(key)!;
      entry.revenue += r.price;
      entry.units += 1;
      entry.orders.add(r.orderNumber);
      entry[r.paymentMethod] += r.price;
    });

    let cumulativeRevenue = 0;
    return Array.from(weeklyMap.values()).map((item) => {
      cumulativeRevenue += item.revenue;
      return {
        key: item.weekLabel,
        displayLabel: item.weekLabel,
        fullDateUA: item.weekLabel,
        revenue: Math.round(item.revenue * 100) / 100,
        units: item.units,
        orderCount: item.orders.size,
        aov: item.orders.size > 0 ? Math.round((item.revenue / item.orders.size) * 100) / 100 : 0,
        cumulativeRevenue: Math.round(cumulativeRevenue * 100) / 100,
        'Credit Card': item['Credit Card'],
        'Debit Card': item['Debit Card'],
        eWallet: item.eWallet,
        Cash: item.Cash,
      };
    });
  }

  // Monthly
  const monthlyMap = new Map<string, { monthLabel: string; revenue: number; units: number; orders: Set<string>; 'Credit Card': number; 'Debit Card': number; eWallet: number; Cash: number }>();

  sorted.forEach((r) => {
    const rawKey = r.month;
    const uaKey = MONTH_NAMES_UA[rawKey] || rawKey;
    if (!monthlyMap.has(uaKey)) {
      monthlyMap.set(uaKey, {
        monthLabel: uaKey,
        revenue: 0,
        units: 0,
        orders: new Set(),
        'Credit Card': 0,
        'Debit Card': 0,
        eWallet: 0,
        Cash: 0,
      });
    }
    const entry = monthlyMap.get(uaKey)!;
    entry.revenue += r.price;
    entry.units += 1;
    entry.orders.add(r.orderNumber);
    entry[r.paymentMethod] += r.price;
  });

  let cumulativeRevenue = 0;
  return Array.from(monthlyMap.values()).map((item) => {
    cumulativeRevenue += item.revenue;
    return {
      key: item.monthLabel,
      displayLabel: item.monthLabel,
      fullDateUA: item.monthLabel,
      revenue: Math.round(item.revenue * 100) / 100,
      units: item.units,
      orderCount: item.orders.size,
      aov: item.orders.size > 0 ? Math.round((item.revenue / item.orders.size) * 100) / 100 : 0,
      cumulativeRevenue: Math.round(cumulativeRevenue * 100) / 100,
      'Credit Card': item['Credit Card'],
      'Debit Card': item['Debit Card'],
      eWallet: item.eWallet,
      Cash: item.Cash,
    };
  });
}

export function computeProductBreakdown(records: OrderRecord[]) {
  const totalRevenueAll = records.reduce((s, r) => s + r.price, 0);
  const totalUnitsAll = records.length;

  const productMap = new Map<
    string,
    {
      product: string;
      category: string;
      unitPrice: number;
      units: number;
      revenue: number;
      orders: Set<string>;
      paymentBreakdown: Record<PaymentMethod, number>;
    }
  >();

  records.forEach((r) => {
    if (!productMap.has(r.product)) {
      productMap.set(r.product, {
        product: r.product,
        category: r.category,
        unitPrice: r.price,
        units: 0,
        revenue: 0,
        orders: new Set(),
        paymentBreakdown: {
          'Credit Card': 0,
          'Debit Card': 0,
          eWallet: 0,
          Cash: 0,
        },
      });
    }

    const item = productMap.get(r.product)!;
    item.units += 1;
    item.revenue += r.price;
    item.orders.add(r.orderNumber);
    item.paymentBreakdown[r.paymentMethod] += 1;
  });

  return Array.from(productMap.values()).map((p) => ({
    ...p,
    revenueShare: totalRevenueAll > 0 ? (p.revenue / totalRevenueAll) * 100 : 0,
    volumeShare: totalUnitsAll > 0 ? (p.units / totalUnitsAll) * 100 : 0,
    orderCount: p.orders.size,
  }));
}

export function computeCategoryBreakdown(records: OrderRecord[]) {
  const catMap = new Map<string, { category: string; revenue: number; units: number; products: Set<string> }>();

  records.forEach((r) => {
    if (!catMap.has(r.category)) {
      catMap.set(r.category, { category: r.category, revenue: 0, units: 0, products: new Set() });
    }
    const cat = catMap.get(r.category)!;
    cat.revenue += r.price;
    cat.units += 1;
    cat.products.add(r.product);
  });

  const totalRev = records.reduce((s, r) => s + r.price, 0);
  return Array.from(catMap.values()).map((c) => ({
    category: c.category,
    revenue: c.revenue,
    units: c.units,
    productCount: c.products.size,
    revenueShare: totalRev > 0 ? (c.revenue / totalRev) * 100 : 0,
  })).sort((a, b) => b.revenue - a.revenue);
}

export function computeDayOfWeekAnalysis(records: OrderRecord[]) {
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayStats: Record<string, { day: string; revenue: number; units: number; orders: Set<string> }> = {};

  daysOrder.forEach((d) => {
    dayStats[d] = { day: d, revenue: 0, units: 0, orders: new Set() };
  });

  records.forEach((r) => {
    if (dayStats[r.dayOfWeek]) {
      dayStats[r.dayOfWeek].revenue += r.price;
      dayStats[r.dayOfWeek].units += 1;
      dayStats[r.dayOfWeek].orders.add(r.orderNumber);
    }
  });

  return daysOrder.map((d) => {
    const stat = dayStats[d];
    return {
      day: d,
      dayUA: DAY_NAMES_UA[d] || d,
      shortDay: d.slice(0, 3),
      shortDayUA: DAY_NAMES_SHORT_UA[d] || d.slice(0, 3),
      revenue: Math.round(stat.revenue * 100) / 100,
      units: stat.units,
      orderCount: stat.orders.size,
      aov: stat.orders.size > 0 ? Math.round((stat.revenue / stat.orders.size) * 100) / 100 : 0,
    };
  });
}

export function computeCooccurrence(records: OrderRecord[]) {
  const grouped = groupRecordsByOrder(records);
  const pairCounts = new Map<string, { pair: [string, string]; count: number; combinedPrice: number }>();

  grouped.forEach((order) => {
    if (order.items.length > 1) {
      for (let i = 0; i < order.items.length; i++) {
        for (let j = i + 1; j < order.items.length; j++) {
          const p1 = order.items[i].product;
          const p2 = order.items[j].product;
          const key = [p1, p2].sort().join(' + ');

          if (!pairCounts.has(key)) {
            pairCounts.set(key, {
              pair: [p1, p2],
              count: 0,
              combinedPrice: order.items[i].price + order.items[j].price,
            });
          }
          pairCounts.get(key)!.count += 1;
        }
      }
    }
  });

  return Array.from(pairCounts.entries())
    .map(([key, val]) => ({
      pairLabel: key,
      productA: val.pair[0],
      productB: val.pair[1],
      count: val.count,
      combinedPrice: val.combinedPrice,
    }))
    .sort((a, b) => b.count - a.count);
}
