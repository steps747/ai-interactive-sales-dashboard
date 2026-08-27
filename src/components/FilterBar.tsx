import React, { useState } from 'react';
import { FilterState, PaymentMethod } from '../types';
import { Search, Filter, Calendar, X, DollarSign, Layers } from 'lucide-react';
import { PAYMENT_METHOD_NAMES_UA, CATEGORY_NAMES_UA } from '../utils/analytics';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  availableProducts: string[];
  availableCategories: string[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Credit Card', 'Debit Card', 'eWallet', 'Cash'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableCategories,
  hasActiveFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleDatePreset = (preset: 'all' | 'aug' | 'sep' | 'oct') => {
    if (preset === 'all') {
      onFilterChange({ startDate: '2025-08-15', endDate: '2025-10-07' });
    } else if (preset === 'aug') {
      onFilterChange({ startDate: '2025-08-15', endDate: '2025-08-31' });
    } else if (preset === 'sep') {
      onFilterChange({ startDate: '2025-09-01', endDate: '2025-09-30' });
    } else if (preset === 'oct') {
      onFilterChange({ startDate: '2025-10-01', endDate: '2025-10-07' });
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    const current = filters.paymentMethods;
    if (current.includes(method)) {
      onFilterChange({
        paymentMethods: current.filter((m) => m !== method),
      });
    } else {
      onFilterChange({
        paymentMethods: [...current, method],
      });
    }
  };

  const toggleCategory = (cat: string) => {
    const current = filters.categories;
    if (current.includes(cat)) {
      onFilterChange({
        categories: current.filter((c) => c !== cat),
      });
    } else {
      onFilterChange({
        categories: [...current, cat],
      });
    }
  };

  return (
    <div className="bg-stone-50 border-b border-stone-200 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Primary Row: Search & Quick Presets & Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Пошук за № замовлення, товаром або категорією..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-xs text-stone-500 font-medium mr-1.5 hidden md:inline">Період:</span>
            <button
              onClick={() => handleDatePreset('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filters.startDate === '2025-08-15' && filters.endDate === '2025-10-07'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Весь час (54 дні)
            </button>
            <button
              onClick={() => handleDatePreset('aug')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filters.startDate === '2025-08-15' && filters.endDate === '2025-08-31'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Серпень 2025
            </button>
            <button
              onClick={() => handleDatePreset('sep')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filters.startDate === '2025-09-01' && filters.endDate === '2025-09-30'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Вересень 2025
            </button>
            <button
              onClick={() => handleDatePreset('oct')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filters.startDate === '2025-10-01' && filters.endDate === '2025-10-07'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Жовтень 2025
            </button>

            {/* Expand filters toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ml-2 ${
                isExpanded || hasActiveFilters
                  ? 'bg-stone-200 border-stone-300 text-stone-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Фільтри</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              )}
            </button>
          </div>
        </div>

        {/* Payment Method Selector Bar (Always visible for easy access) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-stone-500 font-medium mr-1">Спосіб оплати:</span>
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = filters.paymentMethods.includes(pm);
            return (
              <button
                key={pm}
                onClick={() => togglePaymentMethod(pm)}
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  isSelected
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>{PAYMENT_METHOD_NAMES_UA[pm] || pm}</span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-stone-300 mx-1 hidden sm:block"></div>

          {/* Multi-item basket toggle */}
          <span className="text-xs text-stone-500 font-medium mr-1 hidden sm:inline">Розмір кошика:</span>
          <div className="inline-flex rounded-md shadow-2xs bg-white border border-stone-200 p-0.5 text-xs">
            <button
              onClick={() => onFilterChange({ multiItemOnly: null })}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filters.multiItemOnly === null ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Усі
            </button>
            <button
              onClick={() => onFilterChange({ multiItemOnly: false })}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filters.multiItemOnly === false ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Один товар
            </button>
            <button
              onClick={() => onFilterChange({ multiItemOnly: true })}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filters.multiItemOnly === true ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Комплекти (2+ товари)
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Tray */}
        {isExpanded && (
          <div className="pt-3 border-t border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Custom Date Range */}
            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-stone-200">
              <label className="text-xs font-semibold text-stone-700 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Діапазон дат (ДД.ММ.РРРР)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase">З</span>
                  <input
                    type="date"
                    min="2025-08-15"
                    max="2025-10-07"
                    value={filters.startDate}
                    onChange={(e) => onFilterChange({ startDate: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-stone-300 rounded bg-stone-50 text-stone-800 focus:bg-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase">По</span>
                  <input
                    type="date"
                    min="2025-08-15"
                    max="2025-10-07"
                    value={filters.endDate}
                    onChange={(e) => onFilterChange({ endDate: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-stone-300 rounded bg-stone-50 text-stone-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-stone-500" />
                  <span>Діапазон ціни товару</span>
                </label>
                <span className="text-xs font-mono font-medium text-stone-600">
                  ${filters.minPrice} – ${filters.maxPrice}
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="50"
                  max="180"
                  step="5"
                  value={filters.maxPrice}
                  onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
                  className="w-full accent-stone-900 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Мін.: $50 (Shorts)</span>
                  <span>Макс.: $175 (Tailored Trousers)</span>
                </div>
              </div>
            </div>

            {/* Categories Filter */}
            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-stone-500" />
                  <span>Категорії товарів</span>
                </label>
                {filters.categories.length > 0 && (
                  <button
                    onClick={() => onFilterChange({ categories: [] })}
                    className="text-[10px] text-stone-500 hover:text-stone-900 underline"
                  >
                    Очистити
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                {availableCategories.map((cat) => {
                  const isSelected = filters.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {CATEGORY_NAMES_UA[cat] || cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
