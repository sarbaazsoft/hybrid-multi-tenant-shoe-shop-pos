import React, { useEffect, useMemo, useRef } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  BookOpen,
  Building,
  User,
  Truck,
  Printer,
  AlertTriangle,
  Receipt,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { formatStockPrice } from '../../utils/priceFormat.ts';
import type { CartItem } from '../../types.ts';

interface PosCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  customers: any[];
  selectedCustomerId: number | null;
  onSelectCustomer: (id: number | null) => void;
  paymentMethod: 'KHATA' | 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ONLINE';
  onSelectPaymentMethod: (method: any) => void;
  amountReceived: number | '';
  onChangeAmountReceived: (val: number | '') => void;
  currentItemsTotal: number;
  currencySymbol: string;
  isWholesaleStore: boolean;
  transportName: string;
  onChangeTransportName: (val: string) => void;
  biltyNumber: string;
  onChangeBiltyNumber: (val: string) => void;
  bookingDestination: string;
  onChangeBookingDestination: (val: string) => void;
  notes: string;
  onChangeNotes: (val: string) => void;
  isSubmitting: boolean;
  onConfirmCheckout: () => void;
  activeExchange?: any;
  exchangeCredit?: number;
}

export const PosCheckoutModal: React.FC<PosCheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  paymentMethod,
  onSelectPaymentMethod,
  amountReceived,
  onChangeAmountReceived,
  currentItemsTotal,
  currencySymbol,
  isWholesaleStore,
  transportName,
  onChangeTransportName,
  biltyNumber,
  onChangeBiltyNumber,
  bookingDestination,
  onChangeBookingDestination,
  notes,
  onChangeNotes,
  isSubmitting,
  onConfirmCheckout,
  activeExchange,
  exchangeCredit = 0,
}) => {
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Selected customer/dealer
  const selectedCustomer = useMemo(
    () => customers.find((c: any) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  // Previous Khata Balance (Authoritative from Customer model)
  const previousKhataBalance = useMemo(() => {
    if (!selectedCustomer) return 0;
    const raw =
      selectedCustomer.outstanding_balance ??
      selectedCustomer.outstandingBalance ??
      selectedCustomer.current_balance ??
      selectedCustomer.currentBalance ??
      selectedCustomer.balance ??
      0;
    return Math.max(0, parseFloat(String(raw)) || 0);
  }, [selectedCustomer]);

  // Calculations per Prompt Requirements:
  // Current Items Total: Rs. X
  // Previous Khata Balance: Rs. Y
  // Net Payable Amount: Rs. (X + Y)
  // Remaining Balance to Khata: Rs. Z = Net Payable Amount - Amount Received
  const itemsTotal = Math.max(0, currentItemsTotal);
  const netPayableAmount = Math.round((itemsTotal + previousKhataBalance) * 100) / 100;
  const numericReceived =
    typeof amountReceived === 'number'
      ? amountReceived
      : amountReceived === ''
      ? 0
      : parseFloat(String(amountReceived)) || 0;

  const remainingBalanceToKhata = Math.max(0, Math.round((netPayableAmount - numericReceived) * 100) / 100);
  const changeGiven = numericReceived > netPayableAmount
    ? Math.round((numericReceived - netPayableAmount) * 100) / 100
    : 0;

  const totalCartonsSum = useMemo(() => {
    return cart
      .reduce((acc, i) => acc + i.quantity / (Number(i.minimumPairs) === 16 ? 16 : 12), 0)
      .toFixed(1)
      .replace(/\.0$/, '');
  }, [cart]);

  const totalPairsCount = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);

  // Focus the input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close, Enter to submit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-purple-800/80 my-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-purple-800/80 bg-slate-50 dark:bg-gradient-to-r dark:from-purple-900 dark:via-indigo-950 dark:to-slate-900 text-slate-900 dark:text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-xl border border-purple-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  {isWholesaleStore ? 'Wholesale POS Checkout & Khata Settlement' : 'POS Checkout & Bill Settlement'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono">
                  {isWholesaleStore ? 'B2B WHOLESALE' : 'RETAIL POS'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review carried forward balances and record payment to customer Khata.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-purple-300 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. CUSTOMER / DEALER SELECTION */}
          <div className="p-3 bg-slate-50 dark:bg-[#1A2235] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Customer / Dealer Account</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              {selectedCustomer && (
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  Phone: {selectedCustomer.phone}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  onSelectCustomer(val);
                }}
                className="flex-1 px-3 py-2 bg-white dark:bg-[#0B0F1A] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-xs outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="">-- Walk-in Counter Customer (No Khata) --</option>
                {customers.map((c: any) => {
                  const custBal =
                    c.outstanding_balance ??
                    c.outstandingBalance ??
                    c.current_balance ??
                    c.currentBalance ??
                    c.balance ??
                    0;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.shop_name || c.shopName ? `${c.shop_name || c.shopName} (${c.name})` : c.name}
                      {c.city ? ` - ${c.city}` : ''} | Khata: {currencySymbol} {formatStockPrice(custBal)}
                    </option>
                  );
                })}
              </select>
            </div>

            {paymentMethod === 'KHATA' && !selectedCustomerId && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Khata (Udhaar) checkout requires selecting a registered Customer/Dealer account.</span>
              </div>
            )}
          </div>

          {/* 2. CORE KHATA CALCULATION MATRIX (EXACT 5 POINTS SPECIFIED IN REQUIREMENTS) */}
          <div className="p-4 bg-gradient-to-b from-indigo-50/70 to-purple-50/50 dark:from-[#172036] dark:to-[#131A2D] rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60 dark:border-indigo-800/50">
              <span className="font-extrabold text-xs uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Customer Khata Ledger Breakdown</span>
              </span>
              {isWholesaleStore && (
                <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-300 font-bold">
                  {totalCartonsSum} Cartons ({totalPairsCount} Pairs)
                </span>
              )}
            </div>

            {/* 5-ROW BREAKDOWN REQUIRED BY PROMPT */}
            <div className="space-y-2 text-xs">
              {/* Point 1: Current Items Total: Rs. X */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-[#0B0F1A]/80 border border-slate-200/70 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  • Current Items Total:
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {currencySymbol} {formatStockPrice(itemsTotal)}
                </span>
              </div>

              {/* Point 2: Previous Khata Balance: Rs. Y */}
              <div className={`flex items-center justify-between p-2 rounded-xl border ${
                previousKhataBalance > 0
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                  : 'bg-white/80 dark:bg-[#0B0F1A]/80 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">• Previous Khata Balance:</span>
                  {previousKhataBalance > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/70 dark:bg-amber-900/60 font-bold uppercase">
                      Carried Forward
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm font-bold">
                  {currencySymbol} {formatStockPrice(previousKhataBalance)}
                </span>
              </div>

              {/* Point 3: Net Payable Amount: Rs. (X + Y) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-md shadow-purple-600/20">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm uppercase tracking-wide">• Net Payable Amount:</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">
                    ({currencySymbol} {formatStockPrice(itemsTotal)} + {currencySymbol} {formatStockPrice(previousKhataBalance)})
                  </span>
                </div>
                <span className="font-mono text-xl font-black tracking-tight">
                  {currencySymbol} {formatStockPrice(netPayableAmount)}
                </span>
              </div>

              {/* Point 4: Amount Received: Input Field */}
              <div className="p-3 bg-white dark:bg-[#0B0F1A] rounded-xl border-2 border-indigo-500/60 dark:border-indigo-500/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="pos-modal-amount-received" className="font-black text-xs text-indigo-950 dark:text-indigo-200">
                    • Amount Received (Payment Collected Now):
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {paymentMethod === 'KHATA' ? 'Partial or Rs. 0 for full credit' : 'Cash tendered'}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-base">
                    {currencySymbol}
                  </span>
                  <input
                    id="pos-modal-amount-received"
                    ref={amountInputRef}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter amount paid by customer..."
                    value={amountReceived === '' || isNaN(Number(amountReceived)) ? '' : amountReceived}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        onChangeAmountReceived('');
                      } else {
                        const parsed = parseFloat(e.target.value);
                        onChangeAmountReceived(isNaN(parsed) ? '' : Math.round(parsed));
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 text-right font-mono font-black text-lg bg-slate-50 dark:bg-[#131B2E] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                {/* Quick Fill Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1 text-[11px] font-bold">
                  {selectedCustomerId && (
                    <button
                      type="button"
                      onClick={() => onChangeAmountReceived(0)}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2235] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                      Rs. 0 (Full Credit)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onChangeAmountReceived(itemsTotal)}
                    className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                  >
                    Bill Only ({formatStockPrice(itemsTotal)})
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeAmountReceived(netPayableAmount)}
                    className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                  >
                    Pay All ({formatStockPrice(netPayableAmount)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = typeof amountReceived === 'number' ? amountReceived : 0;
                      onChangeAmountReceived(cur + 1000);
                    }}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2235] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    +1,000
                  </button>
                </div>
              </div>

              {/* Point 5: Remaining Balance to Khata: Rs. Z */}
              <div className={`flex items-center justify-between p-3 rounded-xl border ${
                remainingBalanceToKhata > 0
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                  : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs uppercase tracking-wide">
                    • Remaining Balance to Khata:
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    remainingBalanceToKhata > 0
                      ? 'bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100'
                      : 'bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100'
                  }`}>
                    {remainingBalanceToKhata > 0 ? 'Carried Forward to Customer Ledger' : 'Account Settled'}
                  </span>
                </div>
                <span className={`font-mono text-base sm:text-lg font-black ${
                  remainingBalanceToKhata > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  {currencySymbol} {formatStockPrice(remainingBalanceToKhata)}
                </span>
              </div>

              {/* Change Given (if cash tendered exceeds net payable) */}
              {changeGiven > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-bold">
                  <span>Change Due to Customer:</span>
                  <span className="font-mono text-base font-black text-emerald-700 dark:text-emerald-300">
                    {currencySymbol} {formatStockPrice(changeGiven)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. PAYMENT METHOD SELECTION */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Payment Mode</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(isWholesaleStore
                ? (['KHATA', 'CASH', 'BANK_TRANSFER', 'CARD'] as const)
                : (['CASH', 'KHATA', 'CARD', 'BANK_TRANSFER'] as const)
              ).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => onSelectPaymentMethod(method)}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer text-xs ${
                    paymentMethod === method
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                      : 'bg-slate-100 dark:bg-[#1A2235] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {method === 'KHATA' && <BookOpen className="w-3.5 h-3.5" />}
                  {method === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                  {method === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                  {method === 'BANK_TRANSFER' && <Building className="w-3.5 h-3.5" />}
                  <span>{method === 'KHATA' ? 'Khata (Udhaar)' : method === 'BANK_TRANSFER' ? 'Transfer' : method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. WHOLESALE CARGO / BILTY DISPATCH DETAILS */}
          {isWholesaleStore && (
            <div className="p-3 bg-slate-50 dark:bg-[#1A2235] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Wholesale Cargo & Bilty Dispatch</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {totalCartonsSum} Cartons to Dispatch
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Transport Name (e.g. Faisal Movers)"
                  value={transportName}
                  onChange={(e) => onChangeTransportName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Bilty / LR # (e.g. LR-9041)"
                  value={biltyNumber}
                  onChange={(e) => onChangeBiltyNumber(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Booking Destination City"
                  value={bookingDestination}
                  onChange={(e) => onChangeBookingDestination(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* 5. NOTES */}
          <div>
            <input
              type="text"
              placeholder="Sale notes (optional)..."
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-gradient-to-r dark:from-purple-900/90 dark:via-indigo-950/85 dark:to-slate-900 border-t border-slate-200 dark:border-purple-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            Cancel (Esc)
          </button>

          <button
            type="button"
            onClick={onConfirmCheckout}
            disabled={isSubmitting || (paymentMethod === 'KHATA' && !selectedCustomerId)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 text-white rounded-xl font-extrabold text-sm shadow-md shadow-purple-600/30 flex items-center space-x-2 transition cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording Khata Sale...' : 'Confirm Sale & Print Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
