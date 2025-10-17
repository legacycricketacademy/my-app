import { Router } from 'express';
import { listPayments, createPayment } from '../storage/paymentsStore.js';
import type { Currency, PayMethod, PayStatus } from '../types/payments.js';

const r = Router();

// Reuse your real auth guard if you have it (createAuthMiddleware). This minimal one keeps behavior same.
function requireAuth(req:any, res:any, next:any){
  if (req.user?.id) return next();
  return res.status(401).json({ ok:false, error:'unauthorized', message:'Login required' });
}

r.get('/', requireAuth, (req,res) => {
  try {
    const params = {
      playerId: req.query.playerId as string | undefined,
      status: req.query.status as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    };
    console.log('[PAYMENTS_LIST]', { userId: req.user.id, params });
    const data = listPayments(params);
    res.json({ ok:true, data });
  } catch (e:any) {
    console.error('[PAYMENTS_LIST_ERROR]', e);
    res.status(500).json({ ok:false, error:'list_failed', message:e?.message || 'Failed to list payments' });
  }
});

r.post('/', requireAuth, (req,res) => {
  try {
    const body = req.body ?? {};
    console.log('[PAYMENTS_CREATE_IN]', { userId: req.user.id, body });

    const { playerId, playerName, amount, currency, method, status, reference, notes } = body;

    if (!playerId || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      console.warn('[PAYMENTS_CREATE_VALIDATION]', { playerId, amount });
      return res.status(400).json({ ok:false, error:'validation', message:'playerId and amount>0 required' });
    }

    const c = (currency ?? 'INR') as Currency;
    const m = (method ?? 'cash') as PayMethod;
    const s = (status ?? 'paid') as PayStatus;

    const created = createPayment(
      { playerId, playerName, amount, currency:c, method:m, status:s, reference, notes },
      req.user.id
    );

    console.log('[PAYMENTS_CREATE_OK]', { id: created.id });
    res.status(201).json({ ok:true, data: created });
  } catch (e:any) {
    console.error('[PAYMENTS_CREATE_ERROR]', e);
    res.status(500).json({ ok:false, error:'create_failed', message:e?.message || 'Failed to create payment' });
  }
});

export default r;
