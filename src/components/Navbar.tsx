import React from 'react';
import { ViewTab } from '../types';
import { LayoutDashboard, ShoppingBag, CreditCard, CalendarDays, Table, Download, Plus, RotateCcw } from 'lucide-react';

interface NavbarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  totalRecords: number;
  filteredRecords: number;
  onResetFilters: () => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  hasActiveFilters: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalRecords,
  filteredRecords,
  onResetFilters,
  onOpenAddModal,
  onExportCSV,
  onExportJSON,
  hasActiveFilters,
}) => {
  const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Огляд показників', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: 'Аналіз товарів', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'payments', label: 'Аналіз оплат', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'temporal', label: 'Динаміка та періоди', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'explorer', label: 'Дані та таблиця', icon: <Table className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white font-semibold text-lg shadow-xs">
              TT
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                  Аналітика замовлень одягу
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Активний набір даних
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Діапазон дат: <span className="font-medium text-stone-700">15.08.2025 – 07.10.2025</span> • {filteredRecords === totalRecords ? `${totalRecords} записів перевірено` : `Відображено ${filteredRecords} з ${totalRecords} записів`}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                title="Скинути всі фільтри до початкових"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Скинути фільтри</span>
              </button>
            )}

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Додати замовлення</span>
            </button>

            <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <button
                onClick={onExportCSV}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors border-r border-stone-200"
                title="Експортувати відфільтровані записи у CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={onExportJSON}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                title="Експортувати відфільтровані записи у JSON"
              >
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Dashboard Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
