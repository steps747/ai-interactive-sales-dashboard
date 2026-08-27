import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';
import { OrderRecord, TimeGranularity, MetricType } from '../types';
import {
  computeTimeSeries,
  computeProductBreakdown,
  computeSummaryMetrics,
  PAYMENT_METHOD_NAMES_UA,
} from '../utils/analytics';
import { TrendingUp, BarChart3, PieChart as PieIcon, ArrowUpRight, Zap, Info } from 'lucide-react';

interface OverviewViewProps {
  records: OrderRecord[];
}

const PAYMENT_COLORS: Record<string, string> = {
  'Credit Card': '#2563eb', // blue-600
  'Debit Card': '#059669', // emerald-600
  eWallet: '#7c3aed', // purple-600
  Cash: '#d97706', // amber-600
};

export const OverviewView: React.FC<OverviewViewProps> = ({ records }) => {
  const [granularity, setGranularity] = useState<TimeGranularity>('daily');
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [showRollingAvg, setShowRollingAvg] = useState<boolean>(true);
  const [productLeaderboardMetric, setProductLeaderboardMetric] = useState<'revenue' | 'units'>('revenue');

  const timeSeriesData = computeTimeSeries(records, granularity);
  const productStats = computeProductBreakdown(records);
  const summary = computeSummaryMetrics(records);

  // Sort products for leaderboard
  const sortedProducts = [...productStats].sort((a, b) =>
    productLeaderboardMetric === 'revenue' ? b.revenue - a.revenue : b.units - a.units
  );

  // Data for payment pie chart
  const paymentPieData = Object.entries(summary.paymentStats).map(([method, data]) => ({
    name: method,
    uaName: PAYMENT_METHOD_NAMES_UA[method as any] || method,
    value: data.revenue,
    count: data.count,
    color: PAYMENT_COLORS[method] || '#6b7280',
    share: summary.totalRevenue > 0 ? (data.revenue / summary.totalRevenue) * 100 : 0,
  }));

  // Find highest single revenue date
  const peakDay = [...timeSeriesData].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="space-y-6">
      {/* 1. Main Timeline Card */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-stone-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-stone-800" />
              <h2 className="text-base font-bold text-stone-900">
                Динаміка продажів
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Хронологічний розвиток замовлень за період серпень – жовтень 2025 року
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Granularity selector */}
            <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium border border-stone-200">
              <button
                onClick={() => setGranularity('daily')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  granularity === 'daily' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                По днях
              </button>
              <button
                onClick={() => setGranularity('weekly')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  granularity === 'weekly' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                По тижнях
              </button>
              <button
                onClick={() => setGranularity('monthly')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  granularity === 'monthly' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                По місяцях
              </button>
            </div>

            {/* Metric Switcher */}
            <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium border border-stone-200">
              <button
                onClick={() => setMetric('revenue')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metric === 'revenue' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Виторг ($)
              </button>
              <button
                onClick={() => setMetric('units')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metric === 'units' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Кількість (од.)
              </button>
              <button
                onClick={() => setMetric('aov')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metric === 'aov' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Сер. чек ($)
              </button>
            </div>

            {/* 7-Day Rolling Average Toggle (only on daily) */}
            {granularity === 'daily' && metric === 'revenue' && (
              <button
                onClick={() => setShowRollingAvg(!showRollingAvg)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                  showRollingAvg
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Ковзне середнє (7 днів): {showRollingAvg ? 'УВІМК' : 'ВИМК'}
              </button>
            )}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1c1917" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1c1917" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="displayLabel"
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
              />
              <YAxis
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (metric === 'units' ? `${val}` : `$${val}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e7e5e4',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
                formatter={(val: number | string | undefined, name: string | undefined) => {
                  const numVal = typeof val === 'number' ? val : Number(val || 0);
                  if (name === 'revenue') {
                    return [`$${numVal.toFixed(2)}`, 'Виторг'];
                  }
                  if (name === 'aov') {
                    return [`$${numVal.toFixed(2)}`, 'Середній чек (AOV)'];
                  }
                  if (name === 'rollingAvg') {
                    return [`$${numVal.toFixed(2)}`, 'Ковзне сер. (7 днів)'];
                  }
                  return [numVal, 'Одиниць'];
                }}
                labelFormatter={(label, payload) => {
                  const fullDate = payload?.[0]?.payload?.fullDateUA;
                  return `Дата/Період: ${fullDate || label}`;
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#1c1917"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMetric)"
                dot={granularity !== 'daily'}
              />
              {granularity === 'daily' && metric === 'revenue' && showRollingAvg && (
                <Line
                  type="monotone"
                  dataKey="rollingAvg"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="rollingAvg"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline Quick Micro-Insights */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-2">
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Піковий день: <span className="font-semibold text-stone-900">{peakDay?.fullDateUA || peakDay?.displayLabel || '—'}</span> ($
              {peakDay?.revenue.toFixed(2) || '0.00'})
            </span>
          </div>
          <div className="text-stone-500">
            Середньодобовий виторг: <span className="font-semibold text-stone-900">${(summary.totalRevenue / Math.max(timeSeriesData.length, 1)).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 2. Grid: Product Leaderboard & Payment Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Leaderboard (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-stone-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  Рейтинг товарів за продажами
                </h3>
              </div>
              <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium border border-stone-200">
                <button
                  onClick={() => setProductLeaderboardMetric('revenue')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    productLeaderboardMetric === 'revenue'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Виторг ($)
                </button>
                <button
                  onClick={() => setProductLeaderboardMetric('units')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    productLeaderboardMetric === 'units'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Кількість (од.)
                </button>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#78716c"
                    fontSize={11}
                    tickFormatter={(val) => (productLeaderboardMetric === 'revenue' ? `$${val}` : `${val}`)}
                  />
                  <YAxis
                    type="category"
                    dataKey="product"
                    stroke="#44403c"
                    fontSize={11}
                    width={150}
                    tickLine={false}
                    axisLine={{ stroke: '#e7e5e4' }}
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
                      return [
                        productLeaderboardMetric === 'revenue' ? `$${num.toFixed(2)}` : `${num} од.`,
                        productLeaderboardMetric === 'revenue' ? 'Загальний виторг' : 'Продано одиниць',
                      ];
                    }}
                  />
                  <Bar
                    dataKey={productLeaderboardMetric}
                    fill="#1c1917"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500 flex justify-between items-center">
            <span>Відображено всі {sortedProducts.length} моделей каталогу</span>
            <span className="font-medium text-stone-700">Діапазон цін: $58.00 – $175.00</span>
          </div>
        </div>

        {/* Payment Method Distribution (1 Col) */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <PieIcon className="w-5 h-5 text-stone-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  Канали оплати
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                За виторгом
              </span>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number | string | undefined, name: string | undefined) => {
                      const num = typeof val === 'number' ? val : Number(val || 0);
                      const uaName = PAYMENT_METHOD_NAMES_UA[name as any] || name;
                      return [`$${num.toFixed(2)}`, `${uaName} (Виторг)`];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend & Share Breakdown */}
            <div className="space-y-2 pt-2">
              {paymentPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-stone-800">{item.uaName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-stone-900">${item.value.toFixed(2)}</span>
                    <span className="text-stone-400 ml-1.5 font-mono">({item.share.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Всього транзакцій: {summary.totalUnits}</span>
            <span>Сума: ${summary.totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 3. Executive Insights Card */}
      <div className="bg-stone-900 text-stone-100 p-5 rounded-xl border border-stone-800 shadow-md">
        <div className="flex items-center space-x-2 mb-3">
          <Info className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Ключові автоматизовані висновки
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-300">
          <div className="bg-stone-800/80 p-3.5 rounded-lg border border-stone-700/60">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>Головний драйвер доходу</span>
            </div>
            <p>
              Товар <strong className="text-white">{summary.topProductByRevenue?.name}</strong> забезпечує найбільший виторг у розмірі{' '}
              <strong className="text-white">${summary.topProductByRevenue?.revenue.toFixed(2)}</strong> при обсязі {summary.topProductByRevenue?.units} од. завдяки преміальній ціні $175.
            </p>
          </div>

          <div className="bg-stone-800/80 p-3.5 rounded-lg border border-stone-700/60">
            <div className="flex items-center space-x-1.5 text-blue-400 font-semibold mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>Обсяг та розмір кошика</span>
            </div>
            <p>
              <strong className="text-white">{summary.multiItemRate.toFixed(1)}% усіх замовлень</strong> містять кілька одиниць одягу, формуючи середній чек (AOV) на рівні{' '}
              <strong className="text-white">${summary.aov.toFixed(2)}</strong> для {summary.totalOrders} унікальних покупок.
            </p>
          </div>

          <div className="bg-stone-800/80 p-3.5 rounded-lg border border-stone-700/60">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>Баланс способів оплати</span>
            </div>
            <p>
              Розподіл виторгу стабільно збалансований між електронними каналами та готівкою: спосіб{' '}
              <strong className="text-white">{summary.topPayment ? PAYMENT_METHOD_NAMES_UA[summary.topPayment.method] || summary.topPayment.method : '—'}</strong> генерує найбільший обсяг на суму{' '}
              <strong className="text-white">${summary.topPayment?.revenue.toFixed(2)}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
