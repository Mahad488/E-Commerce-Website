import { useState } from "react";
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  FileText,
  Mail,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";

export interface InvoiceData {
  id: number;
  created_at?: string;
  total_amount: string | number;
  status?: string;
  address?: string;
  mobile_number?: string;
  city?: string;
  country?: string;
  payment_method?: string;
  payment_status?: string;
  transaction_id?: string;
  customer_name?: string;
  customer_email?: string;
  items?: Array<{
    id?: number;
    product_name?: string;
    name?: string;
    quantity: number;
    price: string | number;
    color?: string;
    product_image?: string;
    color_image?: string;
    image?: string;
  }>;
}

interface OrderInvoiceModalProps {
  order: InvoiceData | null;
  onClose: () => void;
}

export default function OrderInvoiceModal({ order, onClose }: OrderInvoiceModalProps) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const invoiceNumber = `INV-${new Date(order.created_at || Date.now()).getFullYear()}-${String(
    order.id
  ).padStart(5, "0")}`;

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const isPaid =
    order.payment_status === "Paid" ||
    order.status === "Delivered" ||
    (order.payment_method &&
      (order.payment_method.toLowerCase().includes("card") ||
        order.payment_method.toLowerCase().includes("wallet") ||
        order.payment_method.toLowerCase().includes("jazzcash") ||
        order.payment_method.toLowerCase().includes("easypaisa")));

  const totalNum = Number(order.total_amount) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Scoped Media Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            visibility: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          #printable-order-invoice, #printable-order-invoice * {
            visibility: visible !important;
          }
          #printable-order-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: #111827 !important;
            display: block !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl my-auto">
        {/* Floating Top Control Toolbar (Hidden in print) */}
        <div className="no-print bg-gray-900/90 text-white backdrop-blur-md px-5 py-3.5 rounded-2xl mb-3 flex items-center justify-between shadow-2xl border border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Official Invoice Preview
              </p>
              <p className="text-sm font-black text-white">{invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRef}
              title="Copy invoice number"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy Ref"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white transition shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition ml-1"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CANVAS */}
        <div
          id="printable-order-invoice"
          className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 font-sans p-6 sm:p-10 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible"
        >
          {/* 1. Official Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950">
                  NOVA<span className="text-orange-500">.</span>
                </span>
                <span className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                  Store
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Premium Online Shopping & Retail
              </p>
              <div className="text-[11px] text-gray-400 mt-3 space-y-0.5">
                <p>NOVA Commerce Hub, Main Boulevard, Gulberg III</p>
                <p>Lahore, Pakistan • NTN: 948201-7</p>
                <p>Support: support@novastore.com • +92 (300) 123-4567</p>
              </div>
            </div>

            <div className="text-left sm:text-right flex flex-col sm:items-end">
              <span className="text-xs font-black uppercase tracking-widest text-orange-500">
                Official Tax Invoice / Receipt
              </span>
              <p className="text-xl sm:text-2xl font-black text-gray-900 font-mono mt-1">
                {invoiceNumber}
              </p>
              <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                <p className="flex items-center gap-1 sm:justify-end">
                  <Clock size={12} className="text-gray-400" />
                  Date: <span className="font-semibold text-gray-800">{formattedDate}</span>
                </p>
                <p className="flex items-center gap-1 sm:justify-end">
                  Order ID: <span className="font-mono font-bold text-gray-800">#{order.id}</span>
                </p>
              </div>

              {/* Status Stamp */}
              <div className="mt-3">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    PAID ONLINE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300">
                    <Clock size={13} className="text-amber-600" />
                    CASH ON DELIVERY
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Customer & Payment Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-gray-200 text-xs">
            {/* Bill To */}
            <div className="space-y-1.5">
              <h4 className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                Billed / Shipped To:
              </h4>
              <p className="text-sm font-bold text-gray-900">
                {order.customer_name || "Valued Customer"}
              </p>
              {order.customer_email && (
                <p className="text-gray-600 flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-400" />
                  {order.customer_email}
                </p>
              )}
              {order.mobile_number && (
                <p className="text-gray-600 flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-400" />
                  {order.mobile_number}
                </p>
              )}
              <p className="text-gray-700 flex items-start gap-1.5 pt-0.5">
                <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                <span>
                  {order.address || "Standard Customer Address"}
                  {order.city ? `, ${order.city}` : ""}
                  {order.country ? `, ${order.country}` : ", Pakistan"}
                </span>
              </p>
            </div>

            {/* Payment & Delivery Info */}
            <div className="space-y-2 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70">
              <h4 className="font-black text-gray-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <CreditCard size={12} className="text-orange-500" />
                Payment & Fulfillment
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-bold text-gray-900">
                  {order.payment_method === "cod"
                    ? "Cash On Delivery (COD)"
                    : order.payment_method || "Online Payment"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Status:</span>
                <span className={`font-black ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                  {isPaid ? "Paid in Full" : "Pending on Delivery"}
                </span>
              </div>
              {order.transaction_id && (
                <div className="flex justify-between items-center pt-1 border-t border-gray-200/60">
                  <span className="text-gray-500">Transaction Ref:</span>
                  <span className="font-mono font-bold text-gray-800 select-all">
                    {order.transaction_id}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Order Status:</span>
                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  {order.status || "Processing"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Items Table */}
          <div className="py-6">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-3">
              Order Items Breakdown
            </h4>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider text-[10px] font-extrabold border-b border-gray-200">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4 text-center">Color / Variant</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => {
                      const itemName = it.product_name || it.name || `Product Item #${idx + 1}`;
                      const itemPrice = Number(it.price) || 0;
                      const itemTotal = itemPrice * (it.quantity || 1);
                      const itemColor = it.color || "Standard";

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-center text-gray-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-900">{itemName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              SKU: NOVA-PRD-{it.id || idx + 101}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                              {itemColor}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-800">
                            {it.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-gray-600">
                            ${itemPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-gray-900">
                            ${itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-400">
                        Purchased items details summary (${totalNum.toFixed(2)})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Financial Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4 border-t border-gray-200">
            <div className="space-y-1 text-xs text-gray-500 max-w-sm">
              <p className="font-bold text-gray-800 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                30-Day Official Return & Warranty Policy
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Thank you for shopping with NOVA. This digital document serves as an authentic tax
                receipt for your purchases and warranty claims.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-gray-900">${totalNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping & Handling:</span>
                <span className="font-bold text-emerald-600">FREE ($0.00)</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sales Tax / VAT (0%):</span>
                <span className="font-semibold text-gray-900">$0.00</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between items-baseline">
                <span className="font-black text-sm uppercase text-gray-950">Grand Total:</span>
                <span className="text-xl font-black text-orange-500">${totalNum.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 5. Authentic Barcode & Verification Footer */}
          <div className="mt-8 pt-6 border-t border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              {/* Simulated Barcode */}
              <div className="font-mono text-gray-800 tracking-[0.3em] font-black text-base select-none">
                ||| | |||| || ||| |||| | ||| |||||| | ||
              </div>
              <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                *{invoiceNumber}*
              </p>
            </div>

            <div className="text-xs text-gray-400">
              <p className="font-semibold text-gray-700">NOVA Online Store Digital Verification</p>
              <p className="text-[10px]">Printed from official web portal • All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
