export type Trend = 'up' | 'down';

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: Trend;
  spark: number[];
  icon: 'profit' | 'sales' | 'inventory' | 'customers';
  color: string;
}

export interface SalesPoint {
  day: string;
  sales: number;
  target: number;
}

export interface CategorySlice {
  label: string;
  value: number;
  color: string;
}

export interface Activity {
  id: string;
  type: 'sale' | 'inventory' | 'customer' | 'order' | 'system';
  message: string;
  time: string;
}

export type OrderStatus = 'Delivered' | 'Pending' | 'Processing';

export interface Order {
  id: string;
  client: string;
  amount: number;
  status: OrderStatus;
  date: string;
}

export interface Appointment {
  id: string;
  title: string;
  time: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  sold: number;
  stock: number;
  revenue: string;
  image: string;
}

export const metrics: MetricCard[] = [
  {
    id: 'profit',
    label: 'Total Profits',
    value: '$284,920',
    change: 12.5,
    trend: 'up',
    spark: [30, 45, 38, 52, 48, 65, 72, 68, 80, 88],
    icon: 'profit',
    color: '#7ee8e8',
  },
  {
    id: 'sales',
    label: 'Total Sales',
    value: '$1,204,380',
    change: 8.2,
    trend: 'up',
    spark: [40, 42, 50, 47, 55, 60, 58, 65, 70, 74],
    icon: 'sales',
    color: '#a78bfa',
  },
  {
    id: 'inventory',
    label: 'Total Inventory',
    value: '48,209',
    change: -3.1,
    trend: 'down',
    spark: [80, 78, 75, 73, 70, 68, 66, 64, 62, 60],
    icon: 'inventory',
    color: '#f0abfc',
  },
  {
    id: 'customers',
    label: 'Total Customers',
    value: '12,847',
    change: 15.8,
    trend: 'up',
    spark: [20, 28, 35, 40, 48, 55, 62, 70, 78, 85],
    icon: 'customers',
    color: '#fbbf24',
  },
];

export const salesPerformance: SalesPoint[] = [
  { day: 'Mon', sales: 42000, target: 40000 },
  { day: 'Tue', sales: 58000, target: 45000 },
  { day: 'Wed', sales: 51000, target: 50000 },
  { day: 'Thu', sales: 72000, target: 55000 },
  { day: 'Fri', sales: 89000, target: 60000 },
  { day: 'Sat', sales: 104000, target: 70000 },
  { day: 'Sun', sales: 96000, target: 65000 },
];

export const categoryDistribution: CategorySlice[] = [
  { label: 'Food Items', value: 32, color: '#7ee8e8' },
  { label: 'Drinks', value: 18, color: '#a78bfa' },
  { label: 'Supplies', value: 15, color: '#f0abfc' },
  { label: 'Personal Products', value: 12, color: '#fbbf24' },
  { label: 'Others', value: 23, color: '#34d399' },
];

export const activities: Activity[] = [
  { id: 'a1', type: 'sale', message: 'New Sales Transaction Complete', time: 'Just now' },
  { id: 'a2', type: 'inventory', message: 'Inventory Item Added #SN-784', time: '3 min ago' },
  { id: 'a3', type: 'customer', message: 'New Customer Registered: Sarah K.', time: '12 min ago' },
  { id: 'a4', type: 'order', message: 'Order #ORD-2049 marked Delivered', time: '28 min ago' },
  { id: 'a5', type: 'system', message: 'Daily backup completed successfully', time: '1 hr ago' },
  { id: 'a6', type: 'sale', message: 'Refund processed for Order #ORD-2031', time: '2 hr ago' },
  { id: 'a7', type: 'inventory', message: 'Low stock alert: Organic Milk', time: '3 hr ago' },
];

export const orders: Order[] = [
  { id: 'ORD-2049', client: 'Sarah Khalil', amount: 342.5, status: 'Delivered', date: 'Oct 21' },
  { id: 'ORD-2048', client: 'Mohamed Ali', amount: 1280.0, status: 'Processing', date: 'Oct 21' },
  { id: 'ORD-2047', client: 'Lina Hassan', amount: 86.75, status: 'Pending', date: 'Oct 20' },
  { id: 'ORD-2046', client: 'Omar Farouk', amount: 540.2, status: 'Delivered', date: 'Oct 20' },
  { id: 'ORD-2045', client: 'Yasmin Adel', amount: 2190.0, status: 'Processing', date: 'Oct 19' },
  { id: 'ORD-2044', client: 'Khaled Nabil', amount: 175.3, status: 'Delivered', date: 'Oct 19' },
];

export const appointments: Appointment[] = [
  { id: 'ap1', title: 'Supplier review meeting', time: '09:00 AM', done: true, priority: 'high' },
  { id: 'ap2', title: 'Inventory audit — Branch B', time: '11:30 AM', done: false, priority: 'high' },
  { id: 'ap3', title: 'Q4 financial sync', time: '01:00 PM', done: false, priority: 'medium' },
  { id: 'ap4', title: 'Customer feedback call', time: '03:15 PM', done: false, priority: 'low' },
  { id: 'ap5', title: 'Staff training session', time: '05:00 PM', done: false, priority: 'medium' },
];

export const topProducts: TopProduct[] = [
  { id: 'p1', name: 'Organic Cold Brew', category: 'Drinks', sold: 1840, stock: 320, revenue: '$18,400', image: 'drink' },
  { id: 'p2', name: 'Artisan Sourdough', category: 'Food Items', sold: 1520, stock: 145, revenue: '$12,160', image: 'bread' },
  { id: 'p3', name: 'Aloe Vera Serum', category: 'Personal Products', sold: 980, stock: 76, revenue: '$19,600', image: 'serum' },
  { id: 'p4', name: 'Eco Tote Bag', category: 'Supplies', sold: 760, stock: 410, revenue: '$3,800', image: 'tote' },
  { id: 'p5', name: 'Matcha Latte Mix', category: 'Drinks', sold: 690, stock: 28, revenue: '$6,900', image: 'matcha' },
];
