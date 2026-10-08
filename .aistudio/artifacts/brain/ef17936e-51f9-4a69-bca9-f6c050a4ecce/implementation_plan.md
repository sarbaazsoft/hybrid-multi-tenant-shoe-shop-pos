# Strict Wholesale (B2B) vs Retail (B2C) Multi-Tenant Architecture

This blueprint specifies a strict separation between **Retail (B2C)** and **Wholesale (B2B)** store types across the platform (no hybrid mixing). Each store is permanently configured at provisioning time for its business model, exactly like the store's immutable `Pricing Policy` (`FIXED` vs `NEGOTIABLE`).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Strict Separation (Confirmed by User)**: No hybrid mixing in a single store. A store is either strictly **Retail (B2C)** or strictly **Wholesale (B2B)**.

- **Store Provisioning Choice (`business_type`)**:
  - `RETAIL`: Single-pair sales, walk-in customers, retail prices, 80mm thermal slips.
  - `WHOLESALE`: Carton packaging, minimum carton selling limits, dealer accounts, Khata credit terms, A4 commercial dispatch invoices.
- **Product Form Modal (`ProductFormModal.tsx`)**:
  - When store is `WHOLESALE`: Features **Pairs Per Carton** (e.g. 12 pairs) and **Minimum Carton Selling Limit** (e.g. min 1 carton = 12 pairs).
  - When store is `RETAIL`: Clean single-pair interface without any wholesale carton clutter.

---

## 1. Architectural Comparison (Retail vs Wholesale)

| Feature | Retail Store (B2C) | Wholesale Store (B2B) |
| :--- | :--- | :--- |
| **Store Type** | `RETAIL` | `WHOLESALE` |
| **Unit of Sale** | 1 Pair | **1 Carton** (Master Box of e.g. 12, 18, or 24 Pairs) |
| **Minimum Order** | 1 Pair | **Minimum Cartons / Pairs** defined per product in `ProductFormModal` |
| **Product Form** | Cost + Retail Price (Fixed / Negotiable) | Cost + Wholesale Rate/Pr + **Carton Price** + **Pairs Per Carton** + **Min Cartons** |
| **Stock Display** | Total Pairs (e.g. `120 Pairs`) | **Total Cartons & Pairs** (e.g. `10 Cartons [120 Pairs]`) |
| **POS Checkout** | Single pair barcode scan | **Carton Qty** selection with automatic minimum order enforcement |
| **Customer Type** | Walk-in counter buyer | **Registered Dealer / Shop**: Shop Name, Market, City, NTN, Credit Limit |
| **Payment Flow** | 100% Cash / Card instant settlement | Cash, Bank, Cheque, or **Khata / Credit Terms (Udhaar)** |
| **Print Output** | 80mm / 3" Thermal Receipt | **A4 / A5 Commercial Tax Invoice & Bilty/Dispatch Challan** |

---

## 2. Product Form Modal (`ProductFormModal.tsx`) in Wholesale Stores

In a Wholesale store, Step 1 and Step 2 of `ProductFormModal` are tailored for wholesale operations:

### Step 1: Stock & Carton Packaging
1. **Pairs Per Carton (`pairs_per_carton`)**:
   - Number input (default `12`).
   - Quick preset buttons: `6 (½ Doz)`, `12 (1 Doz)`, `18`, `24 (2 Doz)`.
2. **Minimum Selling Limit (`min_order_cartons`)**:
   - Minimum cartons a dealer must buy for this article (default `1 Carton`).
   - Live badge shows: `Minimum Order: 1 Carton (= 12 Pairs)`.
   - Prevents POS cashiers from breaking cartons or selling below the threshold.
3. **Stock Entry**:
   - Enter Cartons or Pairs with real-time conversion: `10 Cartons = 120 Pairs`.

### Step 2: Pricing Specifications
1. **Cost Price per Pair**: Unit acquisition cost from manufacturer.
2. **Wholesale Selling Rate per Pair**: e.g., `Rs. 1,800 / pair`.
3. **Carton Price (Two-way auto-synced)**:
   - Form calculates `12 pairs × Rs. 1,800 = Rs. 21,600 / carton`.
   - Modifying carton price automatically adjusts the pair rate.

---

## 3. Wholesale POS Terminal Workflow

1. **Dealer Account Selection**:
   - Search by Shop Name, City, or Phone (e.g. *Bismillah Shoe Palace, Moti Bazaar, Lahore*).
   - Live pill shows current Khata balance and credit limit.
2. **Adding Cartons to Bill**:
   - Cashier enters Carton Quantity (e.g., `5 Cartons`).
   - Bill line shows: `5 Cartons × 12 Pairs = 60 Pairs @ Rs. 1,800/pr = Rs. 108,000`.
   - If cashier enters less than the product's `min_order_cartons`, the POS shows an inline error blocking checkout.
3. **Khata & B2B Payment**:
   - Enter Cash Received (e.g. `Rs. 50,000`).
   - Remaining `Rs. 58,000` is automatically booked to the customer's Khata ledger.
   - Optional cargo details: Transporter name, Bilty number, Destination city.
4. **A4 Commercial Invoice**:
   - Full A4 / A5 printable invoice with shop header, dealer info, itemized cartons/pairs table, bilty details, and previous/net Khata balance math.

---

## 4. Implementation Steps

1. **Database Schema & Mock Store**:
   - Add `business_type` (`'RETAIL'` | `'WHOLESALE'`) to `tenants` and `company_settings`.
   - Add `pairs_per_carton`, `min_order_cartons`, `wholesale_price`, `carton_price` to `products`.
   - Add `shop_name`, `market_name`, `city`, `credit_limit`, `current_balance` to `customers`.
   - Add `total_cartons`, `transport_name`, `bilty_number`, `previous_balance`, `paid_amount`, `remaining_balance` to `sales`.
2. **Store Provisioning & Onboarding**:
   - SuperAdmin store creator and Onboarding Wizard include clean 2-way radio cards: **Retail Shoe Store (B2C)** vs **Wholesale Shoe Store (B2B)**.
3. **Product Form Modal**:
   - Wholesale-specific carton packaging card, minimum selling limit, and two-way carton price calculations.
4. **Wholesale POS Terminal & A4 Invoicing**:
   - Carton quantity increments, minimum carton checks, Khata balance ledger, and A4 dispatch invoice template.
