'use client';

import { useEffect, useState } from 'react';
import { adminGetEvents, adminGetEventBookings } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import type { Booking, EventItem } from '@/lib/types';
import { DownloadIcon } from '@/components/icons';
import { SectionCard, EmptyState } from './shared';

export default function BookingsCard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminGetEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (!selected) { setBookings([]); return; }
    setLoading(true);
    adminGetEventBookings(selected)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [selected]);

  const selectedEvent = events.find((ev) => ev.id === selected);

  function handleExport() {
    if (!selectedEvent || bookings.length === 0) return;
    downloadCsv(
      `حجوزات-${selectedEvent.title}`,
      ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'المحافظة', 'كود التأكيد', 'ملاحظات', 'تاريخ الحجز'],
      bookings.map((b) => [
        b.full_name,
        b.phone,
        b.email,
        b.governorate || '',
        b.confirmation_code,
        b.notes || '',
        new Date(b.created_at).toLocaleString('ar-EG'),
      ])
    );
  }

  return (
    <SectionCard
      title="حجوزات الفعاليات"
      description="اختر فعالية لعرض قائمة الحاجزين"
      action={
        bookings.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-full border border-violet-200 px-4 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
          >
            <DownloadIcon className="h-3.5 w-3.5" /> تنزيل كملف إكسيل
          </button>
        )
      }
    >
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-5 w-full max-w-sm rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      >
        <option value="">اختر فعالية…</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.title} ({ev.seats_taken}/{ev.seats_total})</option>
        ))}
      </select>

      {loading && <p className="text-sm text-ink/50">جارٍ التحميل…</p>}
      {!loading && selected && bookings.length === 0 && <EmptyState message="لا توجد حجوزات على هذه الفعالية بعد." />}
      {bookings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-right text-xs font-bold text-ink/45">
                <th className="py-2.5 pl-4">الاسم</th>
                <th className="py-2.5 pl-4">الهاتف</th>
                <th className="py-2.5 pl-4">البريد</th>
                <th className="py-2.5 pl-4">المحافظة</th>
                <th className="py-2.5">كود التأكيد</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3 pl-4 font-bold">{b.full_name}</td>
                  <td className="py-3 pl-4 text-ink/60">{b.phone}</td>
                  <td className="py-3 pl-4 text-ink/60">{b.email}</td>
                  <td className="py-3 pl-4 text-ink/60">{b.governorate || '—'}</td>
                  <td className="py-3 font-utility text-ink/60">{b.confirmation_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
