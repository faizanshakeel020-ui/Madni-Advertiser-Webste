"use client";

/**
 * Client-side API helpers. All requests use relative paths.
 */
import type {
  Category,
  Order,
  Product,
  ProductListResponse,
  QuoteRequest,
} from "./types";

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

// ---------- Public catalog ----------

export type ProductQuery = {
  cat?: string;
  sub?: string;
  q?: string;
  type?: string;
  min?: number;
  max?: number;
  sort?: string;
  page?: number;
  per?: number;
  featured?: boolean;
};

export async function fetchProducts(query: ProductQuery): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (query.cat) params.set("cat", query.cat);
  if (query.sub) params.set("sub", query.sub);
  if (query.q) params.set("q", query.q);
  if (query.type) params.set("type", query.type);
  if (query.min !== undefined) params.set("min", String(query.min));
  if (query.max !== undefined) params.set("max", String(query.max));
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.per) params.set("per", String(query.per));
  if (query.featured) params.set("featured", "1");
  return jsonFetch<ProductListResponse>(`/api/products?${params.toString()}`);
}

export async function fetchProduct(slug: string): Promise<{ product: Product; related: Product[] }> {
  return jsonFetch(`/api/products/${slug}`);
}

export async function fetchCategories(): Promise<Category[]> {
  return jsonFetch<Category[]>("/api/categories");
}

// ---------- Orders ----------

export type CreateOrderPayload = {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  paymentMethod: string;
  notes?: string;
  items: {
    id: string;
    slug: string;
    name: string;
    image: string;
    price: number;
    qty: number;
    selections?: { label: string; value: string }[];
  }[];
};

export async function createOrder(payload: CreateOrderPayload): Promise<{ orderNumber: string }> {
  return jsonFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchOrder(orderNumber: string): Promise<Order> {
  return jsonFetch(`/api/orders/${orderNumber}`);
}

// ---------- Quotes ----------

export type CreateQuotePayload = {
  name: string;
  phone: string;
  email?: string;
  service: string;
  productName?: string;
  details: string;
  city: string;
  referenceImage?: string;
};

export async function createQuote(
  payload: CreateQuotePayload
): Promise<{ reference: string }> {
  return jsonFetch("/api/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ---------- Uploads ----------

export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return jsonFetch("/api/upload", { method: "POST", body: form });
}

// ---------- Admin ----------

export async function adminLogin(username: string, password: string): Promise<{ ok: boolean }> {
  return jsonFetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export async function adminLogout(): Promise<{ ok: boolean }> {
  return jsonFetch("/api/admin/logout", { method: "POST" });
}

export async function adminSession(): Promise<{ authenticated: boolean }> {
  return jsonFetch("/api/admin/session");
}

export async function adminStats(): Promise<{
  products: number;
  orders: number;
  pendingOrders: number;
  quotes: number;
  newQuotes: number;
  revenue: number;
}> {
  return jsonFetch("/api/admin/stats");
}

export async function adminFetchProducts(): Promise<Product[]> {
  return jsonFetch("/api/admin/products");
}

export async function adminSaveProduct(
  data: Partial<Product> & { id?: string }
): Promise<Product> {
  return jsonFetch(data.id ? `/api/admin/products/${data.id}` : "/api/admin/products", {
    method: data.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function adminDeleteProduct(id: string): Promise<{ ok: boolean }> {
  return jsonFetch(`/api/admin/products/${id}`, { method: "DELETE" });
}

export async function adminFetchOrders(): Promise<Order[]> {
  return jsonFetch("/api/admin/orders");
}

export async function adminUpdateOrderStatus(
  id: string,
  status: string
): Promise<{ ok: boolean }> {
  return jsonFetch(`/api/admin/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function adminFetchQuotes(): Promise<QuoteRequest[]> {
  return jsonFetch("/api/admin/quotes");
}

export async function adminUpdateQuoteStatus(
  id: string,
  status: string
): Promise<{ ok: boolean }> {
  return jsonFetch(`/api/admin/quotes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
