export type StayId = 'bcn' | 'mad' | 'dxb';
export type CountryCode = 'ES' | 'AE';

export interface Stay {
  id: StayId;
  city: string;
  cityJa: string;
  country: CountryCode;
  flag: string;
  hotel: string;
  address: string;
  phone: string;
  /** Local wall time at the city — ISO-like without timezone offset */
  checkIn: string; // 'YYYY-MM-DD HH:mm'
  checkOut: string;
  mapsQuery: string;
  tips: string[];
}

export interface EmergencyInfo {
  police: string;
  alt?: string;
  label: string;
}

export const STAYS: Stay[] = [
  {
    id: 'bcn',
    city: 'Barcelona, Spain',
    cityJa: 'バルセロナ',
    country: 'ES',
    flag: '🇪🇸',
    hotel: 'Hampton by Hilton Barcelona Fira Gran Via',
    address:
      "Plaza de Europa 33, 08908 L'Hospitalet de Llobregat, Barcelona, Spain",
    phone: '+34 935 95 51 00',
    checkIn: '2026-10-26 15:00',
    checkOut: '2026-10-29 12:00',
    mapsQuery: 'Hampton by Hilton Barcelona Fira Gran Via Plaza de Europa 33',
    tips: [
      'Watch tourist scams: fake petitions, friendship bracelets, “bird poop” distraction.',
      'Keep your bag zipped and in front of you.',
      'Be cautious on metro at night — stay aware of surroundings.',
      'Hotel is near Fira Gran Via / Plaza Europa — not old-town center.',
    ],
  },
  {
    id: 'mad',
    city: 'Madrid, Spain',
    cityJa: 'マドリード',
    country: 'ES',
    flag: '🇪🇸',
    hotel: 'Canopy by Hilton Madrid Castellana',
    address: 'Plaza Carlos Trías Bertrán 4, 28020 Madrid, Spain',
    phone: '+34 911 781 800',
    checkIn: '2026-10-29 15:00',
    checkOut: '2026-10-31 12:00',
    mapsQuery: 'Canopy by Hilton Madrid Castellana',
    tips: [
      'Area: Nuevos Ministerios / Castellana.',
      'Pickpockets on the metro — keep valuables front-facing.',
      'Keep bags closed and phones secure in crowds.',
    ],
  },
  {
    id: 'dxb',
    city: 'Dubai, UAE',
    cityJa: 'ドバイ',
    country: 'AE',
    flag: '🇦🇪',
    hotel: 'DoubleTree by Hilton Dubai Port Saeed',
    address: '2 27th Street, Port Saeed, Deira, Dubai, UAE',
    phone: '+971 4 294 2777',
    checkIn: '2026-11-01 15:00',
    checkOut: '2026-11-02 12:00',
    mapsQuery: 'DoubleTree by Hilton Dubai Port Saeed',
    tips: [
      'Near Deira City Centre.',
      'Modest dress in some areas (shoulders/knees covered when appropriate).',
      'Taxis and metro are normal and easy.',
      'Keep your hotel card on you.',
    ],
  },
];

export const EMERGENCY: Record<CountryCode, EmergencyInfo> = {
  ES: { police: '112', label: 'Emergency (Spain) 112' },
  AE: { police: '999', alt: '112', label: 'Police UAE 999' },
};

/** Parse stay local datetime as a calendar date (date-only compare uses local device date). */
export function parseStayDate(s: string): Date {
  // Treat as local device calendar for "which stay am I in" decisions.
  const [datePart, timePart] = s.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = (timePart ?? '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function formatStayDateTime(s: string): string {
  const d = parseStayDate(s);
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${weekday} ${day} · ${time}`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseStayDate(checkIn);
  const b = parseStayDate(checkOut);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

/**
 * Auto-pick active stay from device local date:
 * - before first check-in → first stay
 * - during a stay → that stay
 * - between stays → next upcoming
 * - after last → last stay
 */
export function pickActiveStayId(now = new Date()): StayId {
  const t = now.getTime();
  for (const stay of STAYS) {
    const inT = parseStayDate(stay.checkIn).getTime();
    const outT = parseStayDate(stay.checkOut).getTime();
    if (t >= inT && t < outT) return stay.id;
  }
  // Before first
  if (t < parseStayDate(STAYS[0].checkIn).getTime()) return STAYS[0].id;
  // Between or after: find next upcoming check-in
  for (const stay of STAYS) {
    if (t < parseStayDate(stay.checkIn).getTime()) return stay.id;
  }
  return STAYS[STAYS.length - 1].id;
}

export function getStay(id: StayId): Stay {
  return STAYS.find((s) => s.id === id)!;
}

export function mapsUrl(query: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

export function geoUrl(query: string): string {
  return `geo:0,0?q=${encodeURIComponent(query)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[\s()-]/g, '')}`;
}

export const SAFETY_CHECKLIST = [
  'Bag zipped, worn in front',
  'Phone / wallet not in back pocket',
  'Know hotel name & address',
  'Screenshot maps when you have signal',
  'Emergency number saved / one-tap below',
  'Hotel confirmation # in Settings (this phone only)',
];

export const MAT_MESSAGE_TEMPLATE = `Hi Mat — I'm OK.
Hotel: {{hotel}}
City: {{city}}
Location/plans: `;
