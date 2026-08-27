/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { ViewTab, FilterState, PaymentMethod } from './types';
import { INITIAL_RAW_DATA, RawRow, enrichRawData } from './data/rawOrders';
import { groupRecordsByOrder } from './utils/analytics';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { KpiMetrics } from './components/KpiMetrics';
import { OverviewView } from './components/OverviewView';
import { ProductsView } from './components/ProductsView';
import { PaymentsView } from './components/PaymentsView';
import { TemporalView } from './components/TemporalView';
import { DataExplorerView } from './components/DataExplorerView';
import { AddOrderModal } from './components/AddOrderModal';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_FILTERS: FilterState = {
  startDate: '2025-08-15',
  endDate: '2025-10-07',
  paymentMethods: ['Credit Card', 'Debit Card', 'eWallet', 'Cash'],
  products: [],
  categories: [],
  minPrice: 50,
  maxPrice: 180,
  multiItemOnly: null,
  searchQuery: '',
};

export default function App() {
  const [rawData, setRawData] = useState<RawRow[]>(INITIAL_RAW_DATA);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Enrich raw records with metadata
  const allRecords = useMemo(() => enrichRawData(rawData), [rawData]);

  // Distinct catalog list for modal and filters
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, number>();
    rawData.forEach((r) => map.set(r.product, r.price));
    return Array.from(map.entries()).map(([name, price]) => ({ name, price }));
  }, [rawData]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(allRecords.map((r) => r.category))).sort();
  }, [allRecords]);

  // Pre-calculate order-level grouping for multi-item filter
  const orderItemCountMap = useMemo(() => {
    const map = new Map<string, number>();
    rawData.forEach((r) => {
      map.set(r.orderNumber, (map.get(r.orderNumber) || 0) + 1);
    });
    return map;
  }, [rawData]);

  // Apply interactive filters
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // Date filter
      if (r.date < filters.startDate || r.date > filters.endDate) {
        return false;
      }

      // Payment method
      if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(r.paymentMethod)) {
        return false;
      }

      // Category
      if (filters.categories.length > 0 && !filters.categories.includes(r.category)) {
        return false;
      }

      // Price range
      if (r.price < filters.minPrice || r.price > filters.maxPrice) {
        return false;
      }

      // Multi-item basket filter
      if (filters.multiItemOnly !== null) {
        const count = orderItemCountMap.get(r.orderNumber) || 1;
        if (filters.multiItemOnly && count <= 1) return false;
        if (!filters.multiItemOnly && count > 1) return false;
      }

      // Search query
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const match =
          r.orderNumber.toLowerCase().includes(query) ||
          r.product.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query) ||
          r.paymentMethod.toLowerCase().includes(query) ||
          r.date.includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [allRecords, filters, orderItemCountMap]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.startDate !== '2025-08-15' ||
      filters.endDate !== '2025-10-07' ||
      filters.paymentMethods.length < 4 ||
      filters.categories.length > 0 ||
      filters.maxPrice < 180 ||
      filters.multiItemOnly !== null ||
      filters.searchQuery.trim() !== ''
    );
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleAddNewRecord = (newRow: RawRow) => {
    setRawData((prev) => [...prev, newRow]);
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Product', 'Category', 'Price', 'Date', 'Day of Week', 'Payment Method'];
    const rows = filteredRecords.map((r) => [
      r.orderNumber,
      `"${r.product}"`,
      `"${r.category}"`,
      r.price.toFixed(2),
      r.date,
      r.dayOfWeek,
      r.paymentMethod,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apparel_orders_export_${filters.startDate}_to_${filters.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `apparel_orders_export_${filters.startDate}_to_${filters.endDate}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Next order number suggestion
  const nextOrderNumber = `TT-${1000 + rawData.length + 1}`;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col antialiased">
      {/* Top App Header & Tabs */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRecords={allRecords.length}
        filteredRecords={filteredRecords.length}
        onResetFilters={handleResetFilters}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Global Interactive Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableProducts={uniqueProducts.map((p) => p.name)}
        availableCategories={availableCategories}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Real-time KPI Ribbon (recalculates with filters) */}
        <KpiMetrics records={filteredRecords} />

        {/* View Tabs Transition Canvas */}
        <div className="relative min-h-[480px]">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center shadow-xs space-y-3">
              <p className="text-base font-semibold text-stone-800">
                Не знайдено замовлень, які відповідають вибраним критеріям фільтра
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Спробуйте розширити діапазон дат, очистити параметри пошуку або скинути фільтри оплати.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors"
              >
                Скинути всі фільтри
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'overview' && <OverviewView records={filteredRecords} />}
                {activeTab === 'products' && <ProductsView records={filteredRecords} />}
                {activeTab === 'payments' && <PaymentsView records={filteredRecords} />}
                {activeTab === 'temporal' && <TemporalView records={filteredRecords} />}
                {activeTab === 'explorer' && (
                  <DataExplorerView
                    records={filteredRecords}
                    onExportCSV={handleExportCSV}
                    onExportJSON={handleExportJSON}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-stone-800">Аналітика замовлень одягу</span>
            <span>•</span>
            <span>Точні розрахунки на основі 116 первинних записів замовлень (TT-1001 – TT-1098)</span>
          </div>
          <div>
            Діапазон дат: <span className="font-medium text-stone-700">15.08.2025 – 07.10.2025</span>
          </div>
        </div>
      </footer>

      {/* Add Order Simulation Modal */}
      <AddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddNewRecord}
        existingProductNames={uniqueProducts.map((p) => p.name)}
        productCatalog={uniqueProducts}
        nextOrderNumber={nextOrderNumber}
      />
    </div>
  );
}
