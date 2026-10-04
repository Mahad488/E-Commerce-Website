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
}

export const products: Product[] = [
  {
    id: 1,
    name: "Premium Casual Jacket",
    category: "Fashion",
    price: 89.99,
    oldPrice: 120,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    description:
      "A stylish premium casual jacket designed for everyday comfort and modern fashion.",
    stock: 15,
  },
  {
    id: 2,
    name: "Classic Sneakers",
    category: "Fashion",
    price: 65,
    oldPrice: 85,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    description:
      "Comfortable everyday sneakers with a modern design and durable sole.",
    stock: 20,
  },
  {
    id: 3,
    name: "Minimal Wrist Watch",
    category: "Accessories",
    price: 110,
    oldPrice: 140,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    description:
      "A minimal wristwatch suitable for both casual and formal occasions.",
    stock: 12,
  },
  {
    id: 4,
    name: "Modern Headphones",
    category: "Electronics",
    price: 75,
    oldPrice: 99,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    description:
      "Modern headphones designed for immersive audio and comfortable listening.",
    stock: 18,
  },
  {
    id: 5,
    name: "Premium Backpack",
    category: "Lifestyle",
    price: 55,
    oldPrice: 75,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    description:
      "A versatile backpack for daily use, travel, and carrying essentials.",
    stock: 25,
  },
  {
    id: 6,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 95,
    oldPrice: 125,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    description:
      "Wireless audio headphones with a sleek design for everyday entertainment.",
    stock: 10,
  },
  {
    id: 7,
    name: "Classic Sunglasses",
    category: "Accessories",
    price: 35,
    oldPrice: 50,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
    description:
      "Classic sunglasses that add a stylish finishing touch to your outfit.",
    stock: 30,
  },
  {
    id: 8,
    name: "Casual T-Shirt",
    category: "Fashion",
    price: 29,
    oldPrice: 40,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    description:
      "A comfortable casual T-shirt with a clean and versatile everyday style.",
    stock: 40,
  },
];