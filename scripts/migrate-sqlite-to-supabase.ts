import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();

const sqlitePath = path.join(process.cwd(), "db", "custom.db");
const sqlite = new Database(sqlitePath, { readonly: true });

function getRows(table: string) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all() as any[];
}

async function main() {
  console.log("========================================");
  console.log(" SQLite → Supabase Migration");
  console.log("========================================");
  console.log("");

  // -----------------------------------------
  // 1. Category
  // -----------------------------------------
  const categories = getRows("Category");

  console.log(`Migrating ${categories.length} categories...`);

  if (categories.length > 0) {
    await prisma.category.createMany({
      data: categories.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        image: row.image,
        sortOrder: row.sortOrder,
        createdAt: new Date(row.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 2. Subcategory
  // -----------------------------------------
  const subcategories = getRows("Subcategory");

  console.log(`Migrating ${subcategories.length} subcategories...`);

  if (subcategories.length > 0) {
    await prisma.subcategory.createMany({
      data: subcategories.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        categoryId: row.categoryId,
        sortOrder: row.sortOrder,
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 3. Product
  // -----------------------------------------
  const products = getRows("Product");

  console.log(`Migrating ${products.length} products...`);

  if (products.length > 0) {
    await prisma.product.createMany({
      data: products.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        price: row.price,
        oldPrice: row.oldPrice,
        type: row.type,
        categoryId: row.categoryId,
        subcategoryId: row.subcategoryId,
        images: row.images,
        specs: row.specs,
        options: row.options,
        badge: row.badge,
        stock: row.stock,
        featured: Boolean(row.featured),
        popularity: row.popularity,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 4. AdminUser
  // -----------------------------------------
  const adminUsers = getRows("AdminUser");

  console.log(`Migrating ${adminUsers.length} admin users...`);

  if (adminUsers.length > 0) {
    await prisma.adminUser.createMany({
      data: adminUsers.map((row) => ({
        id: row.id,
        username: row.username,
        passwordHash: row.passwordHash,
        createdAt: new Date(row.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 5. Client
  // -----------------------------------------
  const clients = getRows("Client");

  console.log(`Migrating ${clients.length} clients...`);

  if (clients.length > 0) {
    await prisma.client.createMany({
      data: clients.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        logo: row.logo,
        industry: row.industry,
        sortOrder: row.sortOrder,
        createdAt: new Date(row.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 6. ClientProject
  // -----------------------------------------
  const clientProjects = getRows("ClientProject");

  console.log(`Migrating ${clientProjects.length} client projects...`);

  if (clientProjects.length > 0) {
    await prisma.clientProject.createMany({
      data: clientProjects.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        images: row.images,
        year: row.year,
        sortOrder: row.sortOrder,
        clientId: row.clientId,
        createdAt: new Date(row.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 7. Service
  // -----------------------------------------
  const services = getRows("Service");

  console.log(`Migrating ${services.length} services...`);

  if (services.length > 0) {
    await prisma.service.createMany({
      data: services.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        shortName: row.shortName,
        tagline: row.tagline,
        description: row.description,
        hero: row.hero,
        icon: row.icon,
        subServices: row.subServices,
        projectTags: row.projectTags,
        sortOrder: row.sortOrder,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 8. PortfolioItem
  // -----------------------------------------
  const portfolioItems = getRows("PortfolioItem");

  console.log(`Migrating ${portfolioItems.length} portfolio items...`);

  if (portfolioItems.length > 0) {
    await prisma.portfolioItem.createMany({
      data: portfolioItems.map((row) => ({
        id: row.id,
        title: row.title,
        client: row.client,
        city: row.city,
        category: row.category,
        image: row.image,
        description: row.description,
        sortOrder: row.sortOrder,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 9. Order
  // -----------------------------------------
  const orders = getRows("Order");

  console.log(`Migrating ${orders.length} orders...`);

  if (orders.length > 0) {
    await prisma.order.createMany({
      data: orders.map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        phone: row.phone,
        email: row.email,
        address: row.address,
        city: row.city,
        items: row.items,
        subtotal: row.subtotal,
        paymentMethod: row.paymentMethod,
        status: row.status,
        notes: row.notes,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  // -----------------------------------------
  // 10. QuoteRequest
  // -----------------------------------------
  const quoteRequests = getRows("QuoteRequest");

  console.log(`Migrating ${quoteRequests.length} quote requests...`);

  if (quoteRequests.length > 0) {
    await prisma.quoteRequest.createMany({
      data: quoteRequests.map((row) => ({
        id: row.id,
        reference: row.reference,
        name: row.name,
        phone: row.phone,
        email: row.email,
        service: row.service,
        productName: row.productName,
        details: row.details,
        city: row.city,
        referenceImage: row.referenceImage,
        status: row.status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  console.log("");
  console.log("========================================");
  console.log(" Migration completed successfully!");
  console.log("========================================");

  sqlite.close();
}

main()
  .catch((error) => {
    console.error("");
    console.error("Migration failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });