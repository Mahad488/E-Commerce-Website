export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  color?: string;
  color_image?: string;
  product_name?: string;
  product_image?: string;
}

export interface Order {
  id: number;
  user_name?: string;
  user_email?: string;
  total_amount: string | number;
  status: string;
  address?: string;
  city?: string;
  country?: string;
  mobile_number?: string;
  payment_method?: string;
  created_at: string;
  items?: OrderItem[];
}

export function getColorHex(colorName?: string): string {
  if (!colorName) return "#f97316";
  const lower = colorName.toLowerCase();
  if (lower.includes("black") || lower.includes("dark") || lower.includes("stealth") || lower.includes("charcoal")) return "#111827";
  if (lower.includes("white") || lower.includes("clean") || lower.includes("pure")) return "#ffffff";
  if (lower.includes("red") || lower.includes("crimson")) return "#dc2626";
  if (lower.includes("blue") || lower.includes("navy") || lower.includes("cobalt")) return "#2563eb";
  if (lower.includes("green") || lower.includes("electric") || lower.includes("emerald")) return "#16a34a";
  if (lower.includes("grey") || lower.includes("gray") || lower.includes("heather")) return "#6b7280";
  if (lower.includes("brown")) return "#78350f";
  if (lower.includes("beige")) return "#d6c7b2";
  if (lower.includes("pink")) return "#ec4899";
  if (lower.includes("purple")) return "#9333ea";
  if (lower.includes("yellow") || lower.includes("gold")) return "#eab308";
  if (lower.includes("orange")) return "#ea580c";
  return "#f97316";
}
