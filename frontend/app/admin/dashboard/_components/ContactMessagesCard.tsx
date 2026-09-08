'use client';

import { useEffect, useState } from 'react';
import { adminGetContactMessages } from '@/lib/api';
import { SectionCard, EmptyState } from './shared';

export default function ContactMessagesCard() {
  const [messages, setMessages] = useState<Array<{ id: string; name: string; email: string; message: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetContactMessages()
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SectionCard title="رسائل التواصل الواردة" description={`${messages.length} رسالة`}>
      {loading ? (
        <p className="text-sm text-ink/50">جارٍ التحميل…</p>
      ) : messages.length === 0 ? (
        <EmptyState message="لا توجد رسائل حتى الآن." />
      ) : (
        <ul className="divide-y divide-ink/5">
          {messages.map((m) => (
            <li key={m.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{m.name}</span>
                <span className="text-xs text-ink/45">{m.email}</span>
              </div>
              <p className="mt-1.5 text-sm text-ink/70">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
