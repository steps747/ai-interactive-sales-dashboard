import React, { useState } from 'react';
import { RawRow, PaymentMethod } from '../types';
import { PAYMENT_METHOD_NAMES_UA } from '../utils/analytics';
import { Plus, ShoppingBag, X } from 'lucide-react';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newRecord: RawRow) => void;
  existingProductNames: string[];
  productCatalog: { name: string; price: number }[];
  nextOrderNumber: string;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  productCatalog,
  nextOrderNumber,
}) => {
  const [orderNumber, setOrderNumber] = useState(nextOrderNumber);
  const [selectedProduct, setSelectedProduct] = useState(productCatalog[0]?.name || 'Slim-Fit Denim Jeans');
  const [price, setPrice] = useState<number>(productCatalog[0]?.price || 88.00);
  const [date, setDate] = useState('2025-10-08');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');

  if (!isOpen) return null;

  const handleProductChange = (prodName: string) => {
    setSelectedProduct(prodName);
    const match = productCatalog.find((p) => p.name === prodName);
    if (match) {
      setPrice(match.price);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      orderNumber,
      product: selectedProduct,
      price: Number(price),
      date,
      paymentMethod,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-stone-900 text-white">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Додати новий запис замовлення</h3>
              <p className="text-xs text-stone-500">Додавання позиції покупки одягу до динамічного набору даних</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Номер замовлення</label>
            <input
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-stone-900 bg-stone-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Товар одягу</label>
            <select
              value={selectedProduct}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-stone-50 focus:bg-white"
            >
              {productCatalog.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} (${p.price.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Ціна ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-stone-900 bg-stone-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Дата покупки</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Спосіб оплати</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-stone-50 focus:bg-white"
            >
              <option value="Credit Card">{PAYMENT_METHOD_NAMES_UA['Credit Card']}</option>
              <option value="Debit Card">{PAYMENT_METHOD_NAMES_UA['Debit Card']}</option>
              <option value="eWallet">{PAYMENT_METHOD_NAMES_UA['eWallet']}</option>
              <option value="Cash">{PAYMENT_METHOD_NAMES_UA['Cash']}</option>
            </select>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center justify-center space-x-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Додати запис</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
