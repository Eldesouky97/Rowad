const KEY = 'rowwad-my-bookings';

export function getMyBookedEventIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string>;
    return Object.keys(map);
  } catch {
    return [];
  }
}
