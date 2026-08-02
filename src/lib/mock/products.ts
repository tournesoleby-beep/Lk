// Temporary mock data for the /admin/products page.
// Shaped to mirror the Prisma `Product` model so swapping this out for a
// real query later (e.g. via src/lib/queries) is a drop-in replacement.

export type MockProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type MockProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  status: MockProductStatus;
  featured: boolean;
  stock: number;
  imageUrl: string | null;
  updatedAt: string;
};

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "prod_001",
    name: "Linen Wrap Blouse",
    slug: "linen-wrap-blouse",
    sku: "LK-BLS-001",
    category: "Fashion",
    price: 1990000,
    compareAtPrice: 2450000,
    currency: "IDR",
    status: "ACTIVE",
    featured: true,
    stock: 42,
    imageUrl: null,
    updatedAt: "2026-07-18",
  },
  {
    id: "prod_002",
    name: "Hand-thrown Ceramic Bowl Set",
    slug: "hand-thrown-ceramic-bowl-set",
    sku: "LK-HME-014",
    category: "Production",
    price: 1190000,
    compareAtPrice: null,
    currency: "IDR",
    status: "ACTIVE",
    featured: false,
    stock: 15,
    imageUrl: null,
    updatedAt: "2026-07-15",
  },
  {
    id: "prod_003",
    name: "Small-batch Sea Salt Caramels",
    slug: "small-batch-sea-salt-caramels",
    sku: "LK-FOD-007",
    category: "Food",
    price: 289000,
    compareAtPrice: null,
    currency: "IDR",
    status: "ACTIVE",
    featured: true,
    stock: 120,
    imageUrl: null,
    updatedAt: "2026-07-27",
  },
  {
    id: "prod_004",
    name: "Tailored Wool Trousers",
    slug: "tailored-wool-trousers",
    sku: "LK-BTM-022",
    category: "Fashion",
    price: 3350000,
    compareAtPrice: 4050000,
    currency: "IDR",
    status: "DRAFT",
    featured: false,
    stock: 0,
    imageUrl: null,
    updatedAt: "2026-07-30",
  },
  {
    id: "prod_005",
    name: "Cold-pressed Botanical Oil",
    slug: "cold-pressed-botanical-oil",
    sku: "LK-BTY-003",
    category: "Production",
    price: 650000,
    compareAtPrice: null,
    currency: "IDR",
    status: "ACTIVE",
    featured: false,
    stock: 63,
    imageUrl: null,
    updatedAt: "2026-07-10",
  },
  {
    id: "prod_006",
    name: "Heirloom Grain Sampler",
    slug: "heirloom-grain-sampler",
    sku: "LK-FOD-011",
    category: "Food",
    price: 530000,
    compareAtPrice: null,
    currency: "IDR",
    status: "ARCHIVED",
    featured: false,
    stock: 0,
    imageUrl: null,
    updatedAt: "2026-06-02",
  },
  {
    id: "prod_007",
    name: "Silk Slip Dress",
    slug: "silk-slip-dress",
    sku: "LK-DRS-009",
    category: "Fashion",
    price: 2890000,
    compareAtPrice: 3430000,
    currency: "IDR",
    status: "ACTIVE",
    featured: true,
    stock: 8,
    imageUrl: null,
    updatedAt: "2026-07-29",
  },
  {
    id: "prod_008",
    name: "Woven Storage Basket, Large",
    slug: "woven-storage-basket-large",
    sku: "LK-HME-020",
    category: "Production",
    price: 899000,
    compareAtPrice: null,
    currency: "IDR",
    status: "DRAFT",
    featured: false,
    stock: 27,
    imageUrl: null,
    updatedAt: "2026-07-22",
  },
];
