import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import { OrderRecord } from '../types';
import { computeProductBreakdown, computeCategoryBreakdown, CATEGORY_NAMES_UA } from '../utils/analytics';
import { ShoppingBag, DollarSign, Layers, Tag } from 'lucide-react';

interface ProductsViewProps {
  records: OrderRecord[];
}

export const ProductsView: React.FC<ProductsViewProps> = ({ records }) => {
  const [sortField, setSortField] = useState<'revenue' | 'units' | 'unitPrice' | 'name'>('revenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [categoryMetric, setCategoryMetric] = useState<'revenue' | 'units'>('revenue');

  const products = computeProductBreakdown(records);
  const categories = computeCategoryBreakdown(records).map((c) => ({
    ...c,
    categoryUA: CATEGORY_NAMES_UA[c.category] || c.category,
  }));

  // Price tier breakdown
  const priceTiers = [
    { tier: '$50 – $75', min: 50, max: 75, count: 0, revenue: 0, products: [] as string[] },
    { tier: '$76 – $99', min: 76, max: 99, count: 0, revenue: 0, products: [] as string[] },
    { tier: '$100 – $149', min: 100, max: 149, count: 0, revenue: 0, products: [] as string[] },
    { tier: '$150 – $200', min: 150, max: 200, count: 0, revenue: 0, products: [] as string[] },
  ];

  records.forEach((r) => {
    const tier = priceTiers.find((t) => r.price >= t.min && r.price <= t.max);
    if (tier) {
      tier.count += 1;
      tier.revenue += r.price;
      if (!tier.products.includes(r.product)) tier.products.push(r.product);
    }
  });

  const sortedProducts = [...products].sort((a, b) => {
    if (sortField === 'name') {
      return sortAsc ? a.product.localeCompare(b.product) : b.product.localeCompare(a.product);
    }
    if (sortField === 'unitPrice') {
      return sortAsc ? a.unitPrice - b.unitPrice : b.unitPrice - a.unitPrice;
    }
    if (sortField === 'units') {
      return sortAsc ? a.units - b.units : b.units - a.units;
    }
    return sortAsc ? a.revenue - b.revenue : b.revenue - a.revenue;
  });

  // Scatter plot data for Price vs Volume
  const scatterData = products.map((p) => ({
    name: p.product,
    price: p.unitPrice,
    units: p.units,
    revenue: p.revenue,
    category: p.category,
    categoryUA: CATEGORY_NAMES_UA[p.category] || p.category,
  }));

  const handleSort = (field: 'revenue' | 'units' | 'unitPrice' | 'name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Price Elasticity Scatter Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scatter Plot: Price vs Quantity Matrix */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-stone-800" />
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Матриця еластичності цін та обсягів
                </h3>
                <p className="text-xs text-stone-500">
                  Ціна за од. ($) проти кількості проданих (розмір бульбашки відображає виторг)
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md font-medium">
              {products.length} унікальних SKU
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  dataKey="price"
                  name="Ціна за од."
                  unit="$"
                  domain={[50, 190]}
                  stroke="#78716c"
                  fontSize={11}
                  label={{ value: 'Ціна за од. ($)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#78716c' }}
                />
                <YAxis
                  type="number"
                  dataKey="units"
                  name="Продано одиниць"
                  stroke="#78716c"
                  fontSize={11}
                  domain={[0, 16]}
                  label={{ value: 'Продано (од.)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#78716c' }}
                />
                <ZAxis type="number" dataKey="revenue" range={[60, 400]} name="Виторг" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-stone-200 rounded-lg shadow-md text-xs space-y-1">
                          <p className="font-bold text-stone-900">{data.name}</p>
                          <p className="text-stone-500">{data.categoryUA || data.category}</p>
                          <div className="pt-1 border-t border-stone-100 space-y-0.5 font-medium">
                            <p className="text-stone-700">Ціна за од.: <span className="font-bold text-stone-900">${data.price.toFixed(2)}</span></p>
                            <p className="text-stone-700">Продано: <span className="font-bold text-stone-900">{data.units} од.</span></p>
                            <p className="text-stone-700">Виторг: <span className="font-bold text-emerald-600">${data.revenue.toFixed(2)}</span></p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Товари" data={scatterData} fill="#1c1917" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Масовий сегмент: $58 – $88</span>
            <span>Преміальний сегмент: $145 – $175</span>
          </div>
        </div>

        {/* Category Revenue Distribution */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-stone-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  Розподіл за категоріями
                </h3>
              </div>
              <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium border border-stone-200">
                <button
                  onClick={() => setCategoryMetric('revenue')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    categoryMetric === 'revenue' ? 'bg-stone-900 text-white' : 'text-stone-600'
                  }`}
                >
                  Виторг
                </button>
                <button
                  onClick={() => setCategoryMetric('units')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    categoryMetric === 'units' ? 'bg-stone-900 text-white' : 'text-stone-600'
                  }`}
                >
                  Кількість
                </button>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#78716c"
                    fontSize={10}
                    tickFormatter={(val) => (categoryMetric === 'revenue' ? `$${val}` : `${val}`)}
                  />
                  <YAxis
                    type="category"
                    dataKey="categoryUA"
                    stroke="#44403c"
                    fontSize={10}
                    width={110}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: number | string | undefined) => {
                      const num = typeof val === 'number' ? val : Number(val || 0);
                      return [categoryMetric === 'revenue' ? `$${num.toFixed(2)}` : `${num} од.`, categoryMetric === 'revenue' ? 'Виторг' : 'Кількість'];
                    }}
                  />
                  <Bar dataKey={categoryMetric} fill="#44403c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500 flex justify-between">
            <span>{categories.length} категорій</span>
            <span className="font-medium text-stone-700">«Костюми та діловий одяг» лідирує</span>
          </div>
        </div>
      </div>

      {/* 2. Price Tiers Histogram Ribbon */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-stone-100">
          <Tag className="w-4 h-4 text-stone-700" />
          <h3 className="text-sm font-bold text-stone-900">
            Розподіл за ціновими діапазонами
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {priceTiers.map((tier) => (
            <div key={tier.tier} className="bg-stone-50 p-3.5 rounded-lg border border-stone-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">{tier.tier}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white text-stone-700 font-semibold border border-stone-200">
                  {tier.count} од. продано
                </span>
              </div>
              <div className="text-lg font-bold text-stone-900 mt-2">
                ${tier.revenue.toFixed(2)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1 truncate" title={tier.products.join(', ')}>
                {tier.products.join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Comprehensive Product Performance Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-stone-800" />
            <h3 className="text-sm font-bold text-stone-900">
              Детальний звіт ефективності товарів
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            Натисніть на заголовок колонки для сортування
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase font-semibold">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
                >
                  Назва товару {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-3">Категорія</th>
                <th
                  onClick={() => handleSort('unitPrice')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-stone-100 transition-colors"
                >
                  Ціна за од. {sortField === 'unitPrice' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => handleSort('units')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-stone-100 transition-colors"
                >
                  Продано (од.) {sortField === 'units' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-stone-100 transition-colors"
                >
                  Виторг {sortField === 'revenue' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-3 text-right">Частка виторгу</th>
                <th className="px-4 py-3 text-right">Замовлень</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {sortedProducts.map((p) => (
                <tr key={p.product} className="hover:bg-stone-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-stone-900">{p.product}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700">
                      {CATEGORY_NAMES_UA[p.category] || p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-stone-700">
                    ${p.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-stone-900">{p.units}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-stone-900">
                    ${p.revenue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <div className="w-16 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-stone-800 h-full rounded-full"
                          style={{ width: `${Math.min(100, p.revenueShare * 4)}%` }}
                        />
                      </div>
                      <span className="font-mono text-stone-600 text-[11px] w-10 text-right">
                        {p.revenueShare.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-stone-600">{p.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
