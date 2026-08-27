import React from 'react';
import { DollarSign, ShoppingCart, Package, TrendingUp, CreditCard, Sparkles } from 'lucide-react';
import { OrderRecord } from '../types';
import { computeSummaryMetrics, PAYMENT_METHOD_NAMES_UA } from '../utils/analytics';

interface KpiMetricsProps {
  records: OrderRecord[];
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ records }) => {
  const metrics = computeSummaryMetrics(records);

  const dominantPaymentLabel = metrics.topPayment
    ? PAYMENT_METHOD_NAMES_UA[metrics.topPayment.method] || metrics.topPayment.method
    : '—';

  const kpis = [
    {
      id: 'revenue',
      title: 'Загальний виторг',
      value: `$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${metrics.totalUnits} од. у ${metrics.totalOrders} замовленнях`,
      icon: <DollarSign className="w-5 h-5 text-stone-700" />,
      badge: 'Загальний обсяг',
      badgeColor: 'bg-stone-100 text-stone-800',
    },
    {
      id: 'aov',
      title: 'Сер. вартість замовлення',
      value: `$${metrics.aov.toFixed(2)}`,
      subtitle: `Сер. ціна товару: $${metrics.avgItemPrice.toFixed(2)}`,
      icon: <TrendingUp className="w-5 h-5 text-stone-700" />,
      badge: `${metrics.multiItemRate.toFixed(1)}% Багатотоварні`,
      badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    },
    {
      id: 'top-product',
      title: 'Лідер за виторгом',
      value: metrics.topProductByRevenue ? metrics.topProductByRevenue.name : '—',
      subtitle: metrics.topProductByRevenue
        ? `$${metrics.topProductByRevenue.revenue.toFixed(2)} (${metrics.topProductByRevenue.units} од. продано)`
        : '',
      icon: <Package className="w-5 h-5 text-stone-700" />,
      badge: 'Лідер за доходом',
      badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200',
    },
    {
      id: 'volume-product',
      title: 'Лідер за кількістю',
      value: metrics.topProductByUnits ? metrics.topProductByUnits.name : '—',
      subtitle: metrics.topProductByUnits
        ? `${metrics.topProductByUnits.units} од. ($${metrics.topProductByUnits.revenue.toFixed(2)} виторгу)`
        : '',
      icon: <ShoppingCart className="w-5 h-5 text-stone-700" />,
      badge: 'Лідер за обсягом',
      badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200',
    },
    {
      id: 'payment',
      title: 'Основний спосіб оплати',
      value: dominantPaymentLabel,
      subtitle: metrics.topPayment
        ? `$${metrics.topPayment.revenue.toFixed(2)} (${metrics.topPayment.count} транзакцій)`
        : '',
      icon: <CreditCard className="w-5 h-5 text-stone-700" />,
      badge: 'Пріоритетний метод',
      badgeColor: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    },
    {
      id: 'orders-count',
      title: 'Замовлення',
      value: `${metrics.totalOrders} Замовлень`,
      subtitle: `${metrics.multiItemOrdersCount} комплектів (${(metrics.totalUnits / (metrics.totalOrders || 1)).toFixed(2)} од./замовлення)`,
      icon: <Sparkles className="w-5 h-5 text-stone-700" />,
      badge: `Всього ${metrics.totalUnits} од.`,
      badgeColor: 'bg-stone-100 text-stone-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          id={`kpi-${kpi.id}`}
          className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {kpi.title}
            </span>
            <div className="p-1.5 rounded-lg bg-stone-100">
              {kpi.icon}
            </div>
          </div>

          <div>
            <div className="text-xl font-bold text-stone-900 tracking-tight truncate" title={kpi.value}>
              {kpi.value}
            </div>
            <p className="text-xs text-stone-500 mt-1 truncate" title={kpi.subtitle}>
              {kpi.subtitle}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${kpi.badgeColor}`}>
              {kpi.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
