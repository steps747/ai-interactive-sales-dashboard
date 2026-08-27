import React, { useState } from 'react';
import { OrderRecord, GroupedOrder } from '../types';
import {
  groupRecordsByOrder,
  formatDateUkrainian,
  PAYMENT_METHOD_NAMES_UA,
  CATEGORY_NAMES_UA,
  DAY_NAMES_UA,
} from '../utils/analytics';
import { Table, ChevronLeft, ChevronRight, Download, Eye, Layers } from 'lucide-react';

interface DataExplorerViewProps {
  records: OrderRecord[];
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  records,
  onExportCSV,
  onExportJSON,
}) => {
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sortField, setSortField] = useState<string>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<GroupedOrder | null>(null);

  const groupedOrders = groupRecordsByOrder(records);

  // Sorting
  const sortedRecords = [...records].sort((a, b) => {
    let aVal: any = (a as any)[sortField];
    let bVal: any = (b as any)[sortField];

    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const sortedGrouped = [...groupedOrders].sort((a, b) => {
    if (sortField === 'orderNumber') {
      return sortAsc ? a.orderNumber.localeCompare(b.orderNumber) : b.orderNumber.localeCompare(a.orderNumber);
    }
    if (sortField === 'date') {
      return sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    }
    if (sortField === 'price' || sortField === 'totalPrice') {
      return sortAsc ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice;
    }
    return sortAsc ? a.itemCount - b.itemCount : b.itemCount - a.itemCount;
  });

  const activeDataset = viewMode === 'flat' ? sortedRecords : sortedGrouped;
  const totalPages = Math.ceil(activeDataset.length / pageSize) || 1;
  const paginatedData = activeDataset.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Controls Header */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-stone-100">
            <Table className="w-5 h-5 text-stone-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Репозиторій замовлень
            </h3>
            <p className="text-xs text-stone-500">
              {viewMode === 'flat' ? `${records.length} товарних позицій` : `${groupedOrders.length} замовлень клієнтів`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium border border-stone-200">
            <button
              onClick={() => {
                setViewMode('flat');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'flat' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Позиції ({records.length})
            </button>
            <button
              onClick={() => {
                setViewMode('grouped');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'grouped' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Замовлення ({groupedOrders.length})
            </button>
          </div>

          {/* Page size dropdown */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 focus:outline-none"
          >
            <option value={15}>15 на стор.</option>
            <option value={20}>20 на стор.</option>
            <option value={50}>50 на стор.</option>
            <option value={100}>100 на стор.</option>
          </select>

          {/* Export buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onExportCSV}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={onExportJSON}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'flat' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase font-semibold">
                <tr>
                  <th
                    onClick={() => handleSort('orderNumber')}
                    className="px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    № замовлення {sortField === 'orderNumber' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('product')}
                    className="px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    Товар {sortField === 'product' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3">Категорія</th>
                  <th
                    onClick={() => handleSort('price')}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    Ціна {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('date')}
                    className="px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    Дата {sortField === 'date' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3">День тижня</th>
                  <th
                    onClick={() => handleSort('paymentMethod')}
                    className="px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    Спосіб оплати {sortField === 'paymentMethod' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {(paginatedData as OrderRecord[]).map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-stone-900">{r.orderNumber}</td>
                    <td className="px-4 py-2.5 font-medium text-stone-900">{r.product}</td>
                    <td className="px-4 py-2.5 text-stone-500">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 font-medium">
                        {CATEGORY_NAMES_UA[r.category] || r.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-stone-900">
                      ${r.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-stone-600">{formatDateUkrainian(r.date)}</td>
                    <td className="px-4 py-2.5 text-stone-500">{DAY_NAMES_UA[r.dayOfWeek] || r.dayOfWeek}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          r.paymentMethod === 'Credit Card'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : r.paymentMethod === 'Debit Card'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : r.paymentMethod === 'eWallet'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {PAYMENT_METHOD_NAMES_UA[r.paymentMethod] || r.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase font-semibold">
                <tr>
                  <th
                    onClick={() => handleSort('orderNumber')}
                    className="px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    № замовлення {sortField === 'orderNumber' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('date')}
                    className="px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    Дата {sortField === 'date' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3">Товари у кошику</th>
                  <th
                    onClick={() => handleSort('itemCount')}
                    className="px-4 py-3 text-center cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    К-сть {sortField === 'itemCount' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('price')}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    Сума {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3">Спосіб оплати</th>
                  <th className="px-4 py-3 text-right">Дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {(paginatedData as GroupedOrder[]).map((o) => (
                  <tr key={o.orderNumber} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-stone-900">{o.orderNumber}</td>
                    <td className="px-4 py-2.5 font-mono text-stone-600">{formatDateUkrainian(o.date)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {o.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px] font-medium"
                          >
                            {it.product} (${it.price.toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          o.itemCount > 1
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {o.itemCount} од.
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-stone-900 text-sm">
                      ${o.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          o.paymentMethod === 'Credit Card'
                            ? 'bg-blue-50 text-blue-800'
                            : o.paymentMethod === 'Debit Card'
                            ? 'bg-emerald-50 text-emerald-800'
                            : o.paymentMethod === 'eWallet'
                            ? 'bg-purple-50 text-purple-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {PAYMENT_METHOD_NAMES_UA[o.paymentMethod] || o.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Деталі</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600">
          <div>
            Показано {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, activeDataset.length)} із {activeDataset.length} записів
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-stone-900 px-2">
              Сторінка {currentPage} з {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Order Inspector Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-stone-800" />
                <div>
                  <h3 className="font-bold text-stone-900">
                    Деталі замовлення: {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-stone-500">{formatDateUkrainian(selectedOrder.date)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase text-stone-500">
                Придбані позиції
              </span>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg p-2 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-medium text-stone-900">{it.product}</div>
                      <div className="text-[10px] text-stone-500">{CATEGORY_NAMES_UA[it.category] || it.category}</div>
                    </div>
                    <div className="font-mono font-bold text-stone-900">
                      ${it.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
              <div>
                <span className="text-xs text-stone-500">Оплата: </span>
                <span className="text-xs font-bold text-stone-900">{PAYMENT_METHOD_NAMES_UA[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500">Сума: </span>
                <span className="text-base font-mono font-extrabold text-stone-900">
                  ${selectedOrder.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800"
            >
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
