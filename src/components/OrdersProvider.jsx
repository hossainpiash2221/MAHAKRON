


'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const KEY = 'orders.v1';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const NOTIFIED_KEY = 'telegram.failed-notifications.v1';

const Ctx = createContext(null);
export const useOrders = () => useContext(Ctx);

const prune = (list) =>
  (Array.isArray(list) ? list : [])
    .filter((o) => o && o.rid && Date.now() - o.createdAt < MAX_AGE)
    .slice(0, 100);

const newId = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}-0000000000`;

export default function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState([]);

  const inflight = useRef(new Set());
  const notifying = useRef(new Set());
  const tries = useRef({});

  const toast = useCallback((text, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);

    setToasts((t) => [...t, { id, text, kind }]);

    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      8000
    );
  }, []);

  const patch = useCallback(
    (rid, p) =>
      setOrders((list) =>
        list.map((o) => (o.rid === rid ? { ...o, ...p } : o))
      ),
    []
  );

  // Send a failed order to Telegram through our server API.
  const notifyFailedOrder = useCallback(async (rec, error) => {
    if (!rec?.rid || notifying.current.has(rec.rid)) return;

    let sentIds = [];

    try {
      sentIds = JSON.parse(
        localStorage.getItem(NOTIFIED_KEY) || '[]'
      );

      if (!Array.isArray(sentIds)) sentIds = [];
      if (sentIds.includes(rec.rid)) return;
    } catch {
      sentIds = [];
    }

    notifying.current.add(rec.rid);

    try {
      const response = await fetch('/api/telegram/order-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            ...rec,
            status: 'failed',
            error,
          },
        }),
      });

      if (!response.ok) {
        console.error('Telegram notification request failed.');
        return;
      }

      // Remember successful notifications on this device.
      const updated = [...new Set([...sentIds, rec.rid])].slice(-200);

      try {
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify(updated));
      } catch {}
    } catch (error) {
      console.error('Could not notify Telegram:', error);
    } finally {
      notifying.current.delete(rec.rid);
    }
  }, []);

  const send = useCallback(async (rec) => {
    if (inflight.current.has(rec.rid)) return;

    inflight.current.add(rec.rid);
    patch(rec.rid, { status: 'sending', error: '' });

    try {
      const c = rec.customer;

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: rec.rid,
          customerName: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          city: c.city,
          note: c.note,
          website: '',
          zone: c.zone,
          items: rec.items.map((i) => ({
            productId: i.productId,
            quantity: i.qty,
            color: i.color || '',
            size: i.size || '',
          })),
        }),
      });

      const j = await res.json().catch(() => null);

      if (!j) throw new Error('network');

      if (j.success) {
        patch(rec.rid, {
          status: 'placed',
          orderId: j.data.orderId,
          serverSubtotal: j.data.subtotal,
          serverDelivery: j.data.deliveryCharge,
          serverTotal: j.data.total,
          error: '',
        });

        toast(`Order confirmed! Your Order ID is ${j.data.orderId}`);
      } else {
        const error = j.error || 'We could not place this order.';

        patch(rec.rid, { status: 'failed', error });
        toast(error, 'error');

        // Telegram notification when the server rejects the order.
        void notifyFailedOrder(rec, error);
      }
    } catch {
      const n = (tries.current[rec.rid] =
        (tries.current[rec.rid] || 0) + 1);

      if (n <= 2) {
        inflight.current.delete(rec.rid);
        setTimeout(() => send(rec), 5000 * n);
        return;
      }

      const error =
        'Connection problem. Tap “Try again”. It is safe, you will not get a duplicate order.';

      patch(rec.rid, { status: 'failed', error });
      toast('Connection problem. Open My orders and tap Try again.', 'error');

      // Telegram notification after automatic retries fail.
      void notifyFailedOrder(rec, error);
    } finally {
      inflight.current.delete(rec.rid);
    }
  }, [patch, toast, notifyFailedOrder]);

  useEffect(() => {
    try {
      const list = prune(
        JSON.parse(localStorage.getItem(KEY) || '[]')
      );

      setOrders(list);

      list
        .filter((o) => o.status === 'sending')
        .forEach(send);
    } catch {}

    setReady(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(prune(orders)));
      } catch {}
    }
  }, [orders, ready]);

  const place = useCallback((customer, items, totals) => {
    const rec = {
      rid: newId(),
      status: 'sending',
      createdAt: Date.now(),
      orderId: '',
      error: '',
      customer,
      items: items.map((i) => ({
        productId: i.productId,
        slug: i.slug,
        name: i.name,
        image: i.image,
        price: i.price,
        qty: i.qty,
        color: i.color || '',
        size: i.size || '',
      })),
      subtotal: totals.subtotal,
      delivery: totals.delivery,
      total: totals.total,
    };

    try {
      localStorage.setItem(
        KEY,
        JSON.stringify([
          rec,
          ...prune(JSON.parse(localStorage.getItem(KEY) || '[]')),
        ])
      );
    } catch {}

    setOrders((list) => [rec, ...list]);
    send(rec);

    return rec.rid;
  }, [send]);

  const retry = useCallback((rid) => {
    const rec = orders.find((o) => o.rid === rid);

    if (rec) {
      tries.current[rid] = 0;
      send(rec);
    }
  }, [orders, send]);

  const removeOrder = useCallback(
    (rid) => setOrders((list) => list.filter((o) => o.rid !== rid)),
    []
  );

  const value = useMemo(
    () => ({ orders, ready, place, retry, removeOrder, toast }),
    [orders, ready, place, retry, removeOrder, toast]
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md rounded px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.kind === 'error' ? 'bg-madder' : 'bg-dark_Green'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
