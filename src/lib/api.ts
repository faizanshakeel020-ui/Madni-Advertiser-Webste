"use client";

/**
 * Client-side API helpers. All requests use relative paths.
 */
import type {
  Category,
  Client,
  ClientProject,
  Order,
  Product,
  ProductListResponse,
  QuoteRequest,
  ServiceSub,
} from "./types";

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

const publicRequestCache = new Map<string, Promise<unknown>>();

function cachedJsonFetch<T>(input: string): Promise<T> {
  const cached = publicRequestCache.get(input);
  if (cached) return cached as Promise<T>;
  const request = jsonFetch<T>(input);
  publicRequestCache.set(input, request);
  const clear = () => {
    if (publicRequestCache.get(input) === request) publicRequestCache.delete(input);
  };
  void request.then(clear, clear);
  return request;
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
  return cachedJsonFetch<Category[]>("/api/categories");
}

export async function fetchClients(): Promise<Client[]> {
  return cachedJsonFetch<Client[]>("/api/clients");
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

export async function uploadImage(file: File): Promise<{ url: string; urls: string[] }> {
  const form = new FormData();
  form.append("file", file);
  return jsonFetch("/api/upload", { method: "POST", body: form });
}

/** Upload several images at once — returns the stored URLs in order. */
export async function uploadImages(files: File[]): Promise<{ url: string; urls: string[] }> {
  const form = new FormData();
  for (const f of files) form.append("files", f);
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

// ---------- Admin: clients & their projects ----------

export type AdminClientPayload = {
  id?: string;
  name: string;
  slug?: string;
  logo: string;
  industry?: string | null;
  sortOrder?: number;
};

export async function adminFetchClients(): Promise<Client[]> {
  return jsonFetch("/api/admin/clients");
}

export async function adminSaveClient(data: AdminClientPayload): Promise<Client> {
  return jsonFetch(data.id ? `/api/admin/clients/${data.id}` : "/api/admin/clients", {
    method: data.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function adminDeleteClient(id: string): Promise<{ ok: boolean }> {
  return jsonFetch(`/api/admin/clients/${id}`, { method: "DELETE" });
}

export type AdminClientProjectPayload = {
  id?: string;
  clientId: string;
  title: string;
  description: string;
  images: string[];
  year?: number | null;
};

export async function adminSaveClientProject(data: AdminClientProjectPayload): Promise<ClientProject> {
  return jsonFetch(
    data.id ? `/api/admin/projects/${data.id}` : `/api/admin/clients/${data.clientId}/projects`,
    {
      method: data.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
}

export async function adminDeleteClientProject(id: string): Promise<{ ok: boolean }> {
  return jsonFetch(`/api/admin/projects/${id}`, { method: "DELETE" });
}

export type CategorizeResponse = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategorySlug: string | null;
  subcategoryName: string | null;
  method: string;
};

/** AI auto-detect the category + subcategory for a product name. */
export async function adminCategorizeProduct(
  name: string,
  description?: string
): Promise<CategorizeResponse> {
  return jsonFetch("/api/admin/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
}

export type GenerateDescriptionResponse = {
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  wordCount: number;
  method: string;
};

/** AI-write an SEO-optimized product description. */
export async function adminGenerateDescription(data: {
  name: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  type?: "BUY_NOW" | "CUSTOM_ORDER" | "BOTH";
  price?: number | null;
  hints?: string;
  variation?: number;
}): Promise<GenerateDescriptionResponse> {
  return jsonFetch("/api/admin/generate-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ---------- Admin: services & portfolio (site content) ----------

export type AdminServicePayload = {
  id?: string;
  name: string;
  slug?: string;
  shortName?: string;
  tagline?: string;
  description?: string;
  hero?: string;
  icon?: string;
  subServices?: { name: string; description: string; image: string }[];
  projectTags?: string[];
  sortOrder?: number;
};

export async function adminFetchServices(): Promise<
  (AdminServicePayload & { id: string; slug: string; sortOrder: number })[]
> {
  return jsonFetch("/api/admin/services");
}

export async function adminSaveService(data: AdminServicePayload) {
  return jsonFetch(data.id ? `/api/admin/services/${data.id}` : "/api/admin/services", {
    method: data.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function adminDeleteService(id: string): Promise<{ ok: boolean }> {
  return jsonFetch(`/api/admin/services/${id}`, { method: "DELETE" });
}

// ---------- Admin: service sub-services (nested under a service, like client projects) ----------

export type AdminServiceSubPayload = {
  name: string;
  description: string;
  image: string;
};

export async function adminAddServiceSub(
  serviceId: string,
  sub: AdminServiceSubPayload
): Promise<{ ok: boolean; subServices: ServiceSub[] }> {
  return jsonFetch(`/api/admin/services/${serviceId}/subservices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
}

export async function adminUpdateServiceSub(
  serviceId: string,
  index: number,
  sub: AdminServiceSubPayload
): Promise<{ ok: boolean; subServices: ServiceSub[] }> {
  return jsonFetch(`/api/admin/services/${serviceId}/subservices`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index, ...sub }),
  });
}

export async function adminDeleteServiceSub(
  serviceId: string,
  index: number
): Promise<{ ok: boolean }> {
  return jsonFetch(
    `/api/admin/services/${serviceId}/subservices?index=${index}`,
    { method: "DELETE" }
  );
}

export type AdminPortfolioPayload = {
  id?: string;
  title: string;
  client?: string;
  city?: string;
  category?: string;
  image?: string;
  description?: string;
  sortOrder?: number;
};

export async function adminFetchPortfolio(): Promise<
  (AdminPortfolioPayload & { id: string; sortOrder: number })[]
> {
  return jsonFetch("/api/admin/portfolio");
}

export async function adminSavePortfolioItem(data: AdminPortfolioPayload) {
  return jsonFetch(data.id ? `/api/admin/portfolio/${data.id}` : "/api/admin/portfolio", {
    method: data.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function adminDeletePortfolioItem(id: string): Promise<{ ok: boolean }> {
  return jsonFetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
}

// ---------- Admin: portfolio categories (group projects like client cards) ----------

export async function adminRenamePortfolioCategory(
  category: string,
  name: string
): Promise<{ ok: boolean; updated: number }> {
  return jsonFetch("/api/admin/portfolio/category", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, name }),
  });
}

export async function adminDeletePortfolioCategory(
  category: string
): Promise<{ ok: boolean; deleted: number }> {
  return jsonFetch(
    `/api/admin/portfolio/category?category=${encodeURIComponent(category)}`,
    { method: "DELETE" }
  );
}

export async function adminFetchOrders(): Promise<Order[]> {
  return jsonFetch("/api/admin/orders");
}

/** AI-write a LONG, SEO-optimized client-project case-study description. */
export async function adminGenerateProjectDescription(data: {
  clientId?: string | null;
  clientName?: string;
  title: string;
  year?: number | null;
  hints?: string;
  imageUrl?: string | null;
  variation?: number;
}): Promise<GenerateDescriptionResponse> {
  return jsonFetch("/api/admin/generate-project-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
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
