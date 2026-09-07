export type ProductType = "BUY_NOW" | "CUSTOM_ORDER";

export type ProductSpec = { label: string; value: string };
export type ProductOption = { label: string; values: string[] };

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  productCount?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number | null;
  oldPrice: number | null;
  type: ProductType;
  categoryId: string;
  category?: Pick<Category, "id" | "slug" | "name">;
  images: string[];
  specs: ProductSpec[];
  options: ProductOption[];
  badge: string | null;
  stock: number;
  featured: boolean;
  popularity: number;
  createdAt: string;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  selections?: { label: string; value: string }[];
};

export type OrderItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  selections?: { label: string; value: string }[];
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  items: OrderItem[];
  subtotal: number;
  paymentMethod: string;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
};

export type QuoteStatus = "NEW" | "CONTACTED" | "QUOTED" | "CLOSED";

export type QuoteRequest = {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  productName: string | null;
  details: string;
  city: string;
  referenceImage: string | null;
  status: QuoteStatus;
  createdAt: string;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
};

export type ServiceSub = {
  name: string;
  description: string;
  image: string;
};

export type ServicePillar = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  hero: string;
  icon: string;
  subServices: ServiceSub[];
  projectTags: string[];
};

export type PortfolioProject = {
  id: string;
  title: string;
  client: string;
  city: string;
  category: string;
  image: string;
  description: string;
};
