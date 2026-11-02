export interface ProductColorVariant {
  name: string;
  hex: string;
  image?: string;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  rating: number;
  image: string;
  description: string;
  stock: number;
  colors?: ProductColorVariant[];
  reviewCount?: number;
  soldCount?: number;
  createdAt?: string;
}

/**
 * Offline demo catalogue — mirrors backend/database/seed.js so the storefront
 * still works (read-only) when the API isn't running.
 */
export const products: Product[] = [
  {
    id: 1,
    name: "Premium Casual Jacket",
    category: "Fashion",
    price: 89.99,
    oldPrice: 120,
    rating: 4.5,
    reviewCount: 2,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    description: "A tailored casual jacket in breathable cotton twill with a soft brushed lining. Clean lines, two-way zip and deep pockets make it the layer you reach for every day.",
    stock: 15,
    colors: [
      {
        name: "Olive",
        hex: "#556b2f",
        quantity: 7,
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Midnight Black",
        hex: "#111111",
        quantity: 5
      },
      {
        name: "Desert Tan",
        hex: "#c8a27a",
        quantity: 3
      }
    ]
  },
  {
    id: 2,
    name: "Essential Cotton Tee",
    category: "Fashion",
    price: 29,
    oldPrice: 40,
    rating: 4,
    reviewCount: 1,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    description: "Heavyweight 220gsm organic cotton with a relaxed fit and reinforced collar that keeps its shape wash after wash.",
    stock: 40,
    colors: [
      {
        name: "Cloud White",
        hex: "#f5f5f5",
        quantity: 18
      },
      {
        name: "Jet Black",
        hex: "#1a1a1a",
        quantity: 14
      },
      {
        name: "Navy",
        hex: "#1f2a44",
        quantity: 8
      }
    ]
  },
  {
    id: 3,
    name: "Urban Pullover Hoodie",
    category: "Fashion",
    price: 59,
    oldPrice: 79,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    description: "Brushed-fleece hoodie with a double-lined hood, kangaroo pocket and ribbed cuffs. Built for cold mornings and late nights.",
    stock: 22
  },
  {
    id: 4,
    name: "Classic Street Sneakers",
    category: "Footwear",
    price: 65,
    oldPrice: 85,
    rating: 4.5,
    reviewCount: 2,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    description: "Everyday sneakers with a cushioned midsole, grippy rubber outsole and a breathable upper that looks sharp with anything.",
    stock: 20,
    colors: [
      {
        name: "Crimson Red",
        hex: "#c0262d",
        quantity: 12,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Multi Colour",
        hex: "#e8c547",
        quantity: 8,
        image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: 5,
    name: "AirFlow Running Shoes",
    category: "Footwear",
    price: 95,
    oldPrice: 130,
    rating: 5,
    reviewCount: 1,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    description: "Lightweight running shoes with responsive foam, a knit upper that moves with your foot and a heel counter for stability on long runs.",
    stock: 4
  },
  {
    id: 6,
    name: "Everyday Canvas Sneakers",
    category: "Footwear",
    price: 49,
    oldPrice: 0,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80",
    description: "Low-top canvas sneakers with a vulcanised sole. Simple, comfortable and made to be worn in.",
    stock: 30
  },
  {
    id: 7,
    name: "Minimal Wrist Watch",
    category: "Accessories",
    price: 110,
    oldPrice: 140,
    rating: 5,
    reviewCount: 1,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    description: "A minimalist 40mm watch with sapphire-coated glass, Japanese quartz movement and an interchangeable leather strap.",
    stock: 12,
    colors: [
      {
        name: "Silver",
        hex: "#c0c0c0",
        quantity: 7,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Onyx Black",
        hex: "#222222",
        quantity: 5,
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: 8,
    name: "Classic Aviator Sunglasses",
    category: "Accessories",
    price: 35,
    oldPrice: 50,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
    description: "Polarised UV400 lenses in a lightweight metal frame. Timeless shape, modern protection.",
    stock: 30
  },
  {
    id: 9,
    name: "Retro Round Sunglasses",
    category: "Accessories",
    price: 42,
    oldPrice: 0,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
    description: "Round acetate frames with gradient lenses — a vintage silhouette with all-day comfort.",
    stock: 3
  },
  {
    id: 10,
    name: "Signature Eau de Parfum",
    category: "Accessories",
    price: 78,
    oldPrice: 95,
    rating: 4,
    reviewCount: 1,
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=800&q=80",
    description: "Warm amber, cedar and a hint of bergamot. A long-lasting 100ml fragrance for day and night.",
    stock: 18
  },
  {
    id: 11,
    name: "Studio Wireless Headphones",
    category: "Electronics",
    price: 95,
    oldPrice: 125,
    rating: 4.5,
    reviewCount: 2,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    description: "Over-ear headphones with active noise cancelling, 40-hour battery life and memory-foam ear cushions for long listening sessions.",
    stock: 10,
    colors: [
      {
        name: "Graphite",
        hex: "#2d2d2d",
        quantity: 6,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Pearl White",
        hex: "#ececec",
        quantity: 4,
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: 12,
    name: "Pro Wireless Earbuds",
    category: "Electronics",
    price: 129,
    oldPrice: 159,
    rating: 5,
    reviewCount: 1,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    description: "True wireless earbuds with adaptive ANC, transparency mode and a pocket-sized wireless charging case.",
    stock: 14
  },
  {
    id: 13,
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    price: 69,
    oldPrice: 0,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    description: "360° sound, deep bass and 18 hours of playtime in a waterproof, drop-resistant body.",
    stock: 25
  },
  {
    id: 14,
    name: "Vintage Instant Camera",
    category: "Electronics",
    price: 149,
    oldPrice: 189,
    rating: 5,
    reviewCount: 1,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
    description: "Classic rangefinder styling with modern internals. Shoot, print and share in seconds.",
    stock: 5
  },
  {
    id: 15,
    name: "Premium Leather Backpack",
    category: "Lifestyle",
    price: 55,
    oldPrice: 75,
    rating: 5,
    reviewCount: 1,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    description: "Full-grain leather backpack with a padded 15-inch laptop sleeve and water-resistant lining.",
    stock: 25
  },
  {
    id: 16,
    name: "Ceramic Coffee Mug",
    category: "Lifestyle",
    price: 18,
    oldPrice: 0,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80",
    description: "Hand-glazed 350ml stoneware mug. Microwave and dishwasher safe, and nice to hold.",
    stock: 60
  },
  {
    id: 17,
    name: "Insulated Steel Bottle",
    category: "Lifestyle",
    price: 25,
    oldPrice: 32,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
    description: "Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12. Leak-proof lid.",
    stock: 40
  },
  {
    id: 18,
    name: "Mechanical RGB Keyboard",
    category: "Gaming & Tech",
    price: 119,
    oldPrice: 149,
    rating: 4.5,
    reviewCount: 2,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    description: "Hot-swappable switches, per-key RGB lighting and an aluminium top plate. Feels as good as it sounds.",
    stock: 9
  },
  {
    id: 19,
    name: "Precision Wireless Mouse",
    category: "Gaming & Tech",
    price: 45,
    oldPrice: 0,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
    description: "26K DPI sensor, 70-hour battery and an ergonomic shape for long sessions.",
    stock: 35
  },
  {
    id: 20,
    name: "Smart Fitness Band",
    category: "Gaming & Tech",
    price: 49,
    oldPrice: 69,
    rating: 0,
    reviewCount: 0,
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80",
    description: "Heart rate, sleep and SpO2 tracking with a 10-day battery and a bright AMOLED display.",
    stock: 2
  }
];
