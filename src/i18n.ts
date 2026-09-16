export type Lang = 'ja' | 'en';

const LANG_KEY = 'rie-trip-lang';

export function getLang(): Lang {
  const v = localStorage.getItem(LANG_KEY);
  if (v === 'en' || v === 'ja') return v;
  return 'ja';
}

export function setLang(lang: Lang): void {
  localStorage.setItem(LANG_KEY, lang);
}

export function localeFor(lang: Lang): string {
  return lang === 'ja' ? 'ja-JP' : 'en-GB';
}

type Dict = Record<string, string>;

const en: Dict = {
  appTitle: 'Rie Trip',
  appSubtitle: 'Barcelona · Madrid · Dubai',
  online: 'Online',
  offlineReady: 'Offline ready',
  staySwitcher: 'Stay switcher',
  todaysStay: "Today's stay",
  manual: 'Manual',
  sectionStay: 'Stay',
  sectionTips: 'Tips',
  sectionSafety: 'Safety',
  sectionTools: 'Quick tools',
  tapCopyAddress: 'Tap to copy address',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  local: '(local)',
  callHotel: 'Call hotel',
  openMaps: 'Open Maps',
  geoMaps: 'Geo maps',
  copyPhone: 'Copy phone',
  confirmLabel: 'Confirmation # · on this phone only',
  confirmPlaceholder: 'Add confirmation #',
  emergency: 'Emergency',
  emergencyAlt: 'Emergency {n}',
  safetyNote:
    'Maps need signal. Hotel text, tips, phones & this checklist work fully offline.',
  flashlight: 'Flashlight',
  lightOn: 'Light ON',
  copyMatMsg: "I'm OK message",
  notesLabel: 'Personal notes (saved on device)',
  notesPlaceholder: 'Gate numbers, meeting spots, reminders…',
  footer: 'Free · no ads · no login · confirmation #s stay on this device',
  toastAddressCopied: 'Address copied',
  toastPhoneCopied: 'Phone copied',
  toastSaved: 'Saved on this phone',
  toastMessageCopied: 'Message copied',
  toastCopyFailed: 'Copy failed',
  toastLightOff: 'Light off',
  toastFlashlightOn: 'Flashlight on',
  toastBrightScreen: 'Bright screen on',
  torchTap: 'Tap for light',
  torchClose: 'Tap again to close',
  checkInToday: 'Check-in today',
  checkInInDays: 'Check-in in {n} day',
  checkInInDaysPlural: 'Check-in in {n} days',
  nightsLabel: '{n} night',
  nightsLabelPlural: '{n} nights',
  checkOutSoon: 'Check-out soon',
  hoursUntilCheckout: '{n}h until check-out',
  lastNight: 'Last night · check-out tomorrow',
  nightsLeft: '{n} nights left',
  stayComplete: 'Stay complete',
  checkedOut: 'Checked out {date}',
  checkoutAt: 'Check-out {date}',
  langJa: '日本語',
  langEn: 'English',
  langToggle: 'Language',
};

const ja: Dict = {
  appTitle: 'Rie Trip',
  appSubtitle: 'バルセロナ · マドリード · ドバイ',
  online: 'オンライン',
  offlineReady: 'オフライン対応',
  staySwitcher: '滞在の切り替え',
  todaysStay: '今日の滞在',
  manual: '手動選択',
  sectionStay: '泊まる',
  sectionTips: 'ヒント',
  sectionSafety: '緊急・安全',
  sectionTools: 'ツール',
  tapCopyAddress: 'タップして住所をコピー',
  checkIn: 'チェックイン',
  checkOut: 'チェックアウト',
  local: '（現地時間）',
  callHotel: 'ホテルに電話',
  openMaps: '地図を開く',
  geoMaps: '地図（geo）',
  copyPhone: '番号をコピー',
  confirmLabel: '予約確認番号 · この端末のみ保存',
  confirmPlaceholder: '確認番号を入力',
  emergency: '緊急',
  emergencyAlt: '緊急 {n}',
  safetyNote:
    '地図は電波が必要です。ホテル情報・ヒント・電話・チェックリストはオフラインでも使えます。',
  flashlight: 'ライト',
  lightOn: 'ライト ON',
  copyMatMsg: '大丈夫メッセージ',
  notesLabel: 'メモ（この端末に保存）',
  notesPlaceholder: 'ゲート番号、待ち合わせ場所、リマインダー…',
  footer: '無料 · 広告なし · ログイン不要 · 確認番号はこの端末のみ',
  toastAddressCopied: '住所をコピーしました',
  toastPhoneCopied: '電話番号をコピーしました',
  toastSaved: 'この端末に保存しました',
  toastMessageCopied: 'メッセージをコピーしました',
  toastCopyFailed: 'コピーに失敗しました',
  toastLightOff: 'ライトを消しました',
  toastFlashlightOn: 'ライトをつけました',
  toastBrightScreen: '明るい画面を表示中',
  torchTap: 'タップでライト',
  torchClose: 'もう一度タップで閉じる',
  checkInToday: '本日チェックイン',
  checkInInDays: 'チェックインまであと {n} 日',
  checkInInDaysPlural: 'チェックインまであと {n} 日',
  nightsLabel: '{n} 泊',
  nightsLabelPlural: '{n} 泊',
  checkOutSoon: 'まもなくチェックアウト',
  hoursUntilCheckout: 'チェックアウトまで約 {n} 時間',
  lastNight: '最終夜 · 明日チェックアウト',
  nightsLeft: '残り {n} 泊',
  stayComplete: '滞在終了',
  checkedOut: 'チェックアウト済み {date}',
  checkoutAt: 'チェックアウト {date}',
  langJa: '日本語',
  langEn: 'English',
  langToggle: '言語',
};

const dictionaries: Record<Lang, Dict> = { en, ja };

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const raw = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    raw,
  );
}

export const SAFETY_CHECKLIST_I18N: Record<Lang, string[]> = {
  en: [
    'Bag zipped, worn in front',
    'Phone / wallet not in back pocket',
    'Know hotel name & address',
    'Screenshot maps when you have signal',
    'Emergency number saved / one-tap below',
    'Hotel confirmation # in Settings (this phone only)',
  ],
  ja: [
    'バッグはファスナーを閉め、前に抱える',
    'スマホ・財布は後ろポケットに入れない',
    'ホテル名と住所を覚えておく',
    '電波があるうちに地図をスクショ',
    '緊急番号を保存／下のボタンでワンタップ',
    '予約確認番号はこの端末の入力欄に（端末のみ）',
  ],
};

export const MAT_MESSAGE_I18N: Record<Lang, string> = {
  en: `Hi Mat — I'm OK.
Hotel: {{hotel}}
City: {{city}}
Location/plans: `,
  ja: `Matへ — 大丈夫です。
ホテル: {{hotel}}
都市: {{city}}
場所・予定: `,
};

export const EMERGENCY_LABELS: Record<
  Lang,
  { ES: string; AE: string; AE_alt: string }
> = {
  en: {
    ES: 'Emergency (Spain) 112',
    AE: 'Police UAE 999',
    AE_alt: 'Emergency 112',
  },
  ja: {
    ES: '緊急（スペイン）112',
    AE: '警察 UAE 999',
    AE_alt: '緊急 112',
  },
};
