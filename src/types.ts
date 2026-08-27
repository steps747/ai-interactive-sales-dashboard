export type PaymentMethod = 'Credit Card' | 'Debit Card' | 'eWallet' | 'Cash';

export interface RawRow {
  orderNumber: string;
  product: string;
  price: number;
  date: string;
  paymentMethod: PaymentMethod;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  product: string;
  price: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  category: string;
  dayOfWeek: string;
  month: string;
  weekNumber: number;
}

export interface GroupedOrder {
  orderNumber: string;
  date: string;
  paymentMethod: PaymentMethod;
  items: {
    product: string;
    price: number;
    category: string;
  }[];
  totalPrice: number;
  itemCount: number;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  paymentMethods: PaymentMethod[];
  products: string[];
  categories: string[];
  minPrice: number;
  maxPrice: number;
  multiItemOnly: boolean | null; // null = all, true = multi only, false = single only
  searchQuery: string;
}

export type ViewTab = 'overview' | 'products' | 'payments' | 'temporal' | 'explorer';

export type TimeGranularity = 'daily' | 'weekly' | 'monthly';

export type MetricType = 'revenue' | 'units' | 'aov';
