import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { OrderRecord } from '../types';
import {
  computeDayOfWeekAnalysis,
  computeCooccurrence,
  groupRecordsByOrder,
  formatDateUkrainian,
} from '../utils/analytics';
import { CalendarDays, ShoppingCart, Layers, Flame } from 'lucide-react';

interface TemporalViewProps {
  records: OrderRecord[];
}

export const TemporalView: React.FC<TemporalViewProps> = ({ records }) => {
  const [dayMetric, setDayMetric] = useState<'revenue' | 'units' | 'aov'>('revenue');
  const dayStats = computeDayOfWeekAnalysis(records);
  const cooccurrence = computeCooccurrence(records);
  const groupedOrders = groupRecordsByOrder(records);

  // Grouped basket metrics
  const singleItemOrders = groupedOrders.filter((o) => o.itemCount === 1);
  const multiItemOrders = groupedOrders.filter((o) => o.itemCount > 1);

  const singleItemAvg =
    singleItemOrders.length > 0
      ? singleItemOrders.reduce((s, o) => s + o.totalPrice, 0) / singleItemOrders.length
      : 0;
  const multiItemAvg =
    multiItemOrders.length > 0
      ? multiItemOrders.reduce((s, o) => s + o.totalPrice, 0) / multiItemOrders.length
      : 0;

  // Generate calendar heatmap cells for all dates from 2025-08-15 to 2025-10-07
  const dateMap = new Map<string, { revenue: number; units: number; items: string[] }>();
  records.forEach((r) => {
    if (!dateMap.has(r.date)) {
      dateMap.set(r.date, { revenue: 0, units: 0, items: [] });
    }
    const d = dateMap.get(r.date)!;
    d.revenue += r.price;
    d.units += 1;
    d.items.push(r.product);
  });

  const heatmapDays: { dateStr: string; displayDate: string; fullDateUA: string; revenue: number; units: number; items: string[] }[] = [];
  const startD = new Date('2025-08-15T00:00:00');
  const endD = new Date('2025-10-07T00:00:00');

  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const data = dateMap.get(dateStr) || { revenue: 0, units: 0, items: [] };
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    heatmapDays.push({
      dateStr,
      displayDate: `${dayOfMonth}.${month}`,
      fullDateUA: formatDateUkrainian(dateStr),
      revenue: data.revenue,
      units: data.units,
      items: data.items,
    });
  }

  const maxHeatmapRevenue = Math.max(...heatmapDays.map((h) => h.revenue), 1);

  const getHeatmapColor = (rev: number) => {
    if (rev === 0) return 'bg-stone-100 text-stone-400 border-stone-200';
    const ratio = rev / maxHeatmapRevenue;
    if (ratio < 0.3) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (ratio < 0.6) return 'bg-amber-200 text-amber-950 border-amber-400';
    if (ratio < 0.85) return 'bg-amber-400 text-stone-950 border-amber-500 font-bold';
    return 'bg-amber-600 text-white border-amber-700 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* 1. Day of Week Sales Velocity */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-stone-800" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Тижневий ритм та активність за днями
              </h3>
              <p className="text-xs text-stone-500">
                Показники продажів з понеділка по неділю
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium border border-stone-200">
            <button
              onClick={() => setDayMetric('revenue')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dayMetric === 'revenue' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              Виторг ($)
            </button>
            <button
              onClick={() => setDayMetric('units')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dayMetric === 'units' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              Кількість (од.)
            </button>
            <button
              onClick={() => setDayMetric('aov')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dayMetric === 'aov' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              Сер. чек ($)
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="shortDayUA" stroke="#78716c" fontSize={11} />
              <YAxis
                stroke="#78716c"
                fontSize={11}
                tickFormatter={(val) => (dayMetric === 'units' ? `${val}` : `$${val}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e7e5e4',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(val: number | string | undefined) => {
                  const num = typeof val === 'number' ? val : Number(val || 0);
                  if (dayMetric === 'units') return [`${num} од.`, 'Обсяг'];
                  if (dayMetric === 'aov') return [`$${num.toFixed(2)}`, 'Середній чек'];
                  return [`$${num.toFixed(2)}`, 'Виторг'];
                }}
                labelFormatter={(label, payload) => {
                  const fullDay = payload?.[0]?.payload?.dayUA;
                  return `День тижня: ${fullDay || label}`;
                }}
              />
              <Bar dataKey={dayMetric} fill="#1c1917" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Interactive Calendar Activity Heatmap */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Теплова карта активності продажів (15.08.2025 – 07.10.2025)
              </h3>
              <p className="text-xs text-stone-500">
                Щоденна щільність замовлень та інтенсивність виторгу
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-stone-500">
            <span>Низька</span>
            <div className="flex space-x-1">
              <span className="w-3 h-3 rounded bg-stone-100 border border-stone-200 inline-block"></span>
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block"></span>
              <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400 inline-block"></span>
              <span className="w-3 h-3 rounded bg-amber-400 border border-amber-500 inline-block"></span>
              <span className="w-3 h-3 rounded bg-amber-600 border border-amber-700 inline-block"></span>
            </div>
            <span>Висока</span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 gap-2 pt-1">
          {heatmapDays.map((day) => (
            <div
              key={day.dateStr}
              className={`p-2 rounded-lg border text-center transition-transform hover:scale-105 cursor-pointer shadow-2xs ${getHeatmapColor(
                day.revenue
              )}`}
              title={`${day.fullDateUA}: $${day.revenue.toFixed(2)} (${day.units} од.)\n${day.items.join(', ')}`}
            >
              <div className="text-[10px] opacity-80">{day.displayDate}</div>
              <div className="text-xs font-bold mt-0.5">${day.revenue.toFixed(0)}</div>
              <div className="text-[9px] opacity-75">{day.units} од.</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Basket Size & Co-occurrence Bundle Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Single vs Multi-Item Order Distribution */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-stone-100">
              <ShoppingCart className="w-5 h-5 text-stone-800" />
              <h3 className="text-sm font-bold text-stone-900">
                Розподіл розміру кошика
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">Покупки з 1 товаром</span>
                  <span className="font-mono font-bold text-stone-900">{singleItemOrders.length} Замовлень</span>
                </div>
                <div className="text-lg font-bold text-stone-900 mt-1">
                  ${singleItemAvg.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-stone-500">Середня вартість</span>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  Становить {((singleItemOrders.length / (groupedOrders.length || 1)) * 100).toFixed(1)}% від обсягу замовлень
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">Комплектні замовлення (2+ товари)</span>
                  <span className="font-mono font-bold text-emerald-900">{multiItemOrders.length} Замовлень</span>
                </div>
                <div className="text-lg font-bold text-emerald-900 mt-1">
                  ${multiItemAvg.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-emerald-700">Сер. вартість (+{((multiItemAvg / (singleItemAvg || 1) - 1) * 100).toFixed(0)}% приріст)</span>
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Становить {((multiItemOrders.length / (groupedOrders.length || 1)) * 100).toFixed(1)}% купівельних кошиків
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
            Всього унікальних замовлень: {groupedOrders.length}
          </div>
        </div>

        {/* Co-occurring Product Bundles Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-stone-800" />
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Супутні товари та комбіновані покупки
                </h3>
                <p className="text-xs text-stone-500">
                  Товари, які найчастіше замовляють разом в одному кошику
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-stone-100 font-medium text-stone-700">
              {cooccurrence.length} пар
            </span>
          </div>

          <div className="overflow-y-auto max-h-64 divide-y divide-stone-100">
            {cooccurrence.map((pair, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5 pr-2">
                  <div className="font-semibold text-stone-900">{pair.pairLabel}</div>
                  <div className="text-stone-500 text-[11px]">
                    Сумарна ціна: ${pair.combinedPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-900 text-white">
                    {pair.count} замовл.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
