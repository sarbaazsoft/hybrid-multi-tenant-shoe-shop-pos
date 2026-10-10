import { Router } from 'express';
import type { Response } from 'express';
import { requireAuth } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import { getTenantDb } from '../../db/tenantDb.ts';
import { pgClient } from '../../db/index.ts';

const router = Router();

// List / Search Customers (Strictly scoped to req.user.tenantId)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantDb = getTenantDb(req);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const customers = await tenantDb.customers.findMany(search);
    res.json({ customers });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch customers: ' + err.message });
  }
});

// Get Customer Khata Ledger History (Strictly scoped to req.user.tenantId)
router.get('/:id/ledger', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantDb = getTenantDb(req);
    const id = parseInt(req.params.id, 10);
    const data = await tenantDb.customers.findById(id);
    if (!data) {
      return res.status(404).json({ error: 'Customer not found in this store.' });
    }
    res.json({
      customer: data.customer,
      ledger: data.ledger || [],
      sales: data.sales || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch customer ledger: ' + err.message });
  }
});

// Record direct payment towards Customer Khata balance
router.post('/:id/payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const id = parseInt(req.params.id, 10);
    const { amount, paymentMethod = 'CASH', notes = '', paymentDate } = req.body;

    const parsedAmount = Math.max(0, parseFloat(amount) || 0);
    if (parsedAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0.' });
    }

    const custRes = await pgClient.query<{ id: number; current_balance: string; outstanding_balance: string }>(
      'SELECT id, COALESCE(outstanding_balance, current_balance, 0)::numeric as outstanding_balance FROM customers WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [id, tenantId]
    );
    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const prevBal = parseFloat(custRes.rows[0].outstanding_balance || '0');
    const newBal = Math.max(0, Math.round((prevBal - parsedAmount) * 100) / 100);

    await pgClient.query(
      'UPDATE customers SET outstanding_balance = $1, current_balance = $1 WHERE id = $2 AND tenant_id = $3',
      [newBal, id, tenantId]
    );

    const effectiveDate = paymentDate && typeof paymentDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(paymentDate)
      ? paymentDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const ledgerRes = await pgClient.query(
      `INSERT INTO customer_khata_ledger (
        tenant_id, customer_id, transaction_date, invoice_id, invoice_number,
        total_bill, amount_paid, balance_change, running_balance, payment_method, notes
      ) VALUES ($1, $2, $3, NULL, 'PAYMENT', 0.00, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        tenantId,
        id,
        effectiveDate,
        parsedAmount,
        -parsedAmount,
        newBal,
        paymentMethod,
        notes?.trim() || `Khata payment received (${paymentMethod})`,
      ]
    );

    res.status(201).json({
      message: 'Payment recorded to Customer Khata successfully.',
      ledgerEntry: ledgerRes.rows[0],
      previousBalance: prevBal,
      newBalance: newBal,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record customer payment: ' + err.message });
  }
});

// Single Customer with recent purchase history and Khata ledger (Strictly scoped to req.user.tenantId)
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantDb = getTenantDb(req);
    const id = parseInt(req.params.id, 10);
    const data = await tenantDb.customers.findById(id);
    if (!data) {
      return res.status(404).json({ error: 'Customer not found in this store.' });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch customer: ' + err.message });
  }
});

// Create Customer (Strictly scoped to req.user.tenantId)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantDb = getTenantDb(req);
    const {
      name,
      phone,
      shopName,
      shop_name,
      marketName,
      market_name,
      city,
      email = '',
      address = '',
      notes = '',
      creditLimit,
      credit_limit,
      ntnNumber,
      ntn_number,
      currentBalance,
      current_balance,
      outstandingBalance,
      outstanding_balance,
    } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Customer phone number is required.' });
    }

    const customer = await tenantDb.customers.create({
      name,
      phone,
      shopName: shopName ?? shop_name,
      marketName: marketName ?? market_name,
      city,
      email,
      address,
      notes,
      creditLimit: creditLimit ?? credit_limit,
      ntnNumber: ntnNumber ?? ntn_number,
      currentBalance: currentBalance ?? current_balance,
      outstandingBalance: outstandingBalance ?? outstanding_balance ?? currentBalance ?? current_balance,
    });
    res.status(201).json({ customer, message: 'Customer created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create customer: ' + err.message });
  }
});

// Update Customer (Strictly scoped to req.user.tenantId)
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantDb = getTenantDb(req);
    const id = parseInt(req.params.id, 10);
    const {
      name,
      phone,
      shopName,
      shop_name,
      marketName,
      market_name,
      city,
      email = '',
      address = '',
      notes = '',
      creditLimit,
      credit_limit,
      ntnNumber,
      ntn_number,
      currentBalance,
      current_balance,
      outstandingBalance,
      outstanding_balance,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Customer phone is required.' });
    }

    const customer = await tenantDb.customers.update(id, {
      name,
      phone,
      shopName: shopName ?? shop_name,
      marketName: marketName ?? market_name,
      city,
      email,
      address,
      notes,
      creditLimit: creditLimit ?? credit_limit,
      ntnNumber: ntnNumber ?? ntn_number,
      currentBalance: currentBalance ?? current_balance,
      outstandingBalance: outstandingBalance ?? outstanding_balance ?? currentBalance ?? current_balance,
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found in this store.' });
    }

    res.json({ customer, message: 'Customer updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update customer: ' + err.message });
  }
});

// Delete Customer (Strictly scoped to req.user.tenantId)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantDb = getTenantDb(req);
    const id = parseInt(req.params.id, 10);
    const deleted = await tenantDb.customers.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Customer not found in this store.' });
    }
    res.json({ message: 'Customer deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete customer: ' + err.message });
  }
});

export default router;
