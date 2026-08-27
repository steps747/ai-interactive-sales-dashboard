import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { OrderRecord, PaymentMethod } from '../types';
import {
  computeProductBreakdown,
  computeTimeSeries,
  computeSummaryMetrics,
  PAYMENT_METHOD_NAMES_UA,
} from '../utils/analytics';
import { CreditCard, Wallet, Banknote, DollarSign } from 'lucide-react';

interface PaymentsViewProps {
  records: OrderRecord[];
}

const PAYMENT_THEMES: Record<
  PaymentMethod,
  { color: string; fill: string; lightBg: string; border: string; icon: React.ReactNode }
> = {
  'Credit Card': {
    color: '#2563eb',
    fill: '#2563eb',
    lightBg: 'bg-blue-50 text-blue-900',
    border: 'border-blue-200',
    icon: <CreditCard className="w-4 h-4 text-blue-600" />,
  },
  'Debit Card': {
    color: '#059669',
    fill: '#059669',
    lightBg: 'bg-emerald-50 text-emerald-900',
    border: 'border-emerald-200',
    icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
  },
  eWallet: {
    color: '#7c3aed',
    fill: '#7c3aed',
    lightBg: 'bg-purple-50 text-purple-900',
    border: 'border-purple-200',
    icon: <Wallet className="w-4 h-4 text-purple-600" />,
  },
  Cash: {
    color: '#d97706',
    fill: '#d97706',
    lightBg: 'bg-amber-50 text-amber-900',
    border: 'border-amber-200',
    icon: <Banknote className="w-4 h-4 text-amber-600" />,
  },
};

export const PaymentsView: React.FC<PaymentsViewProps> = ({ records }) => {
  const [timelineMode, setTimelineMode] = useState<'weekly' | 'daily'>('weekly');
  const summary = computeSummaryMetrics(records);
  const products = computeProductBreakdown(records);
  const timeSeries = computeTimeSeries(records, timelineMode);

  // Stacked bar data by product
  const productPaymentData = products.map((p) => ({
    name: p.product,
    'Credit Card': p.paymentBreakdown['Credit Card'],
    'Debit Card': p.paymentBreakdown['Debit Card'],
    eWallet: p.paymentBreakdown.eWallet,
    Cash: p.paymentBreakdown.Cash,
    totalUnits: p.units,
  })).sort((a, b) => b.totalUnits - a.totalUnits);

  return (
    <div className="space-y-6">
      {/* 1. Payment Method KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['Credit Card', 'Debit Card', 'eWallet', 'Cash'] as PaymentMethod[]).map((method) => {
          const stats = summary.paymentStats[method];
          const share = summary.totalRevenue > 0 ? (stats.revenue / summary.totalRevenue) * 100 : 0;
          const avgPerTx = stats.count > 0 ? stats.revenue / stats.count : 0;
          const theme = PAYMENT_THEMES[method];
          const uaMethod = PAYMENT_METHOD_NAMES_UA[method];

          return (
            <div
              key={method}
              className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${theme.lightBg} ${theme.border} border`}>
                    {theme.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{uaMethod}</h4>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {stats.count} покупок (частка {share.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xl font-bold text-stone-900 tracking-tight">
                  ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
                  <span>Сер. ціна товару:</span>
                  <span className="font-semibold text-stone-800">${avgPerTx.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100">
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${share}%`,
                      backgroundColor: theme.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Product Payment Preference Breakdown (Stacked Bar) */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-stone-800" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Частка способів оплати за моделями товарів
              </h3>
              <p className="text-xs text-stone-500">
                Розподіл каналів оплати для кожної моделі одягу
              </p>
            </div>
          </div>
          <div className="text-xs text-stone-500 font-medium">
            Кількість одиниць за типом оплати
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={productPaymentData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" stroke="#78716c" fontSize={11} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#44403c"
                fontSize={11}
                width={150}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e7e5e4',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(val: number | string | undefined, name: string | undefined) => {
                  const uaName = PAYMENT_METHOD_NAMES_UA[name as PaymentMethod] || name;
                  return [`${val} од.`, uaName];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => PAYMENT_METHOD_NAMES_UA[value as PaymentMethod] || value}
              />
              <Bar dataKey="Credit Card" name="Credit Card" stackId="a" fill="#2563eb" />
              <Bar dataKey="Debit Card" name="Debit Card" stackId="a" fill="#059669" />
              <Bar dataKey="eWallet" name="eWallet" stackId="a" fill="#7c3aed" />
              <Bar dataKey="Cash" name="Cash" stackId="a" fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Payment Preference Trajectory Over Time */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Динаміка виторгу за способами оплати
            </h3>
            <p className="text-xs text-stone-500">
              Порівняльний графік виторгу за типами оплати ($)
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium border border-stone-200">
            <button
              onClick={() => setTimelineMode('weekly')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timelineMode === 'weekly' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              По тижнях
            </button>
            <button
              onClick={() => setTimelineMode('daily')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timelineMode === 'daily' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              По днях
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="displayLabel" stroke="#78716c" fontSize={11} />
              <YAxis stroke="#78716c" fontSize={11} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(val: number | string | undefined, name: string | undefined) => {
                  const num = typeof val === 'number' ? val : Number(val || 0);
                  const uaName = PAYMENT_METHOD_NAMES_UA[name as PaymentMethod] || name;
                  return [`$${num.toFixed(2)}`, uaName];
                }}
                labelFormatter={(label, payload) => {
                  const fullDate = payload?.[0]?.payload?.fullDateUA;
                  return `Дата/Період: ${fullDate || label}`;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => PAYMENT_METHOD_NAMES_UA[value as PaymentMethod] || value}
              />
              <Line type="monotone" dataKey="Credit Card" name="Credit Card" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Debit Card" name="Debit Card" stroke="#059669" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="eWallet" name="eWallet" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Cash" name="Cash" stroke="#d97706" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
