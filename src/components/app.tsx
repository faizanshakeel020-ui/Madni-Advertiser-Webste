"use client";

/**
 * App shell — hash router + site chrome (header/footer/WhatsApp button).
 * All "pages" render client-side on the single "/" route.
 */
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, useRoute } from "@/lib/router";
import { ContentProvider } from "@/lib/content";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { HomeView } from "@/components/views/home-view";
import { ShopView } from "@/components/views/shop-view";
import { ProductDetailView } from "@/components/views/product-detail-view";
import { ServicesIndexView, ServiceCategoryView } from "@/components/views/services-view";
import { CartView } from "@/components/views/cart-view";
import { CheckoutView, OrderConfirmationView } from "@/components/views/checkout-view";
import { QuoteView } from "@/components/views/quote-view";
import { AboutView } from "@/components/views/about-view";
import { PortfolioView } from "@/components/views/portfolio-view";
import { ContactView } from "@/components/views/contact-view";
import { CaseStudyView } from "@/components/views/case-study-view";

const AdminView = dynamic(
  () => import("@/components/views/admin/admin-view").then((module) => module.AdminView),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-zinc-100" aria-label="Loading admin panel" />,
  }
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function RouteSwitch() {
  const { route } = useRoute();
  const [first, second, third] = route.segments;

  // Admin panel — standalone chrome
  if (first === "admin") {
    return <AdminView />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {first === undefined && <HomeView />}
        {first === "shop" && <ShopView key={route.query.q ?? ""} />}
        {first === "product" && second && <ProductDetailView key={second} slug={second} />}
        {first === "services" && !second && <ServicesIndexView />}
        {first === "services" && second && <ServiceCategoryView slug={second} />}
        {first === "cart" && <CartView />}
        {first === "checkout" && <CheckoutView />}
        {first === "order" && second && <OrderConfirmationView orderNumber={second} />}
        {first === "quote" && <QuoteView />}
        {first === "about" && <AboutView />}
        {first === "portfolio" && <PortfolioView />}
        {first === "casestudy" && second === "portfolio" && third && (
          <CaseStudyView key={third} slug={third} />
        )}
        {first === "contact" && <ContactView />}
        {first !== undefined &&
          !["shop", "product", "services", "cart", "checkout", "order", "quote", "about", "portfolio", "casestudy", "contact", "admin"].includes(first) && (
            <NotFoundView />
          )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function NotFoundView() {
  const { navigate } = useRoute();
  return (
    <div className="container-site flex flex-col items-center py-24 text-center">
      <p className="font-display text-6xl font-bold text-primary">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-zinc-900">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
      >
        Back to Home
      </button>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContentProvider>
        <RouterProvider>
          <RouteSwitch />
        </RouterProvider>
      </ContentProvider>
    </QueryClientProvider>
  );
}
