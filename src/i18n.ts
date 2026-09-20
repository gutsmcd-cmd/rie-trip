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
  sectionOfflineMaps: 'Offline maps setup',
  tapCopyAddress: 'Tap to copy address',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  local: '(local)',
  callHotel: 'Call hotel',
  openMaps: 'Google Maps',
  geoMaps: 'Phone maps (geo)',
  prepareOfflineMap: 'Prepare offline map',
  copyPhone: 'Copy phone',
  confirmLabel: 'Confirmation # · on this phone only',
  confirmPlaceholder: 'Add confirmation #',
  persistHint:
    'Saved on this phone. Survives app close and reboot. Cleared only if you delete this site’s data.',
  emergency: 'Emergency',
  emergencyAlt: 'Emergency {n}',
  safetyNote:
    'Maps need signal. Hotel text, tips, phones & this checklist work fully offline.',
  flashlight: 'Flashlight',
  lightOn: 'Light ON',
  notesLabel: 'Personal notes (saved on device)',
  notesPlaceholder: 'Gate numbers, meeting spots, reminders…',
  footer: 'Free · no ads · no login · confirmation #s stay on this device',
  toastAddressCopied: 'Address copied',
  toastPhoneCopied: 'Phone copied',
  toastSaved: 'Saved on this phone',
  toastCopyFailed: 'Copy failed',
  toastLightOff: 'Light off',
  toastFlashlightOn: 'Flashlight on',
  toastBrightScreen: 'Bright screen on',
  toastShortcutAdded: 'Shortcut saved',
  toastShortcutDeleted: 'Shortcut deleted',
  toastShortcutInvalid: 'Enter a name and a valid https URL',
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
  langToggle: 'App language',
  destLangTip: 'Useful local languages:',
  destLangAria: 'Languages spoken at this destination',
  destLangTourist: 'tourist-common',
  offlineMapsIntro:
    'This app cannot embed offline map tiles. Download the hotel area in Google Maps while you have Wi‑Fi.',
  offlineMapsStep1: '1. Open Google Maps (button below or the app on your phone).',
  offlineMapsStep2: '2. Search the hotel, open the place, then tap the profile picture → Offline maps.',
  offlineMapsStep3: '3. Download the area around your hotel while online.',
  offlineMapsStepAlt:
    'Or: Google Maps → your profile → Offline maps → Select your own map → download.',
  quickLinksLabel: 'Useful links (need internet)',
  linkTranslate: 'Google Translate',
  linkCurrency: 'Currency (XE)',
  linkWhatsApp: 'WhatsApp',
  linkUber: 'Uber',
  linkCareem: 'Careem',
  rideAppsNote: 'Ride apps: Uber / Careem (Dubai) — install before you travel.',
  customShortcutsTitle: 'Custom shortcuts',
  customShortcutName: 'Name',
  customShortcutUrl: 'https://…',
  customShortcutAdd: 'Add shortcut',
  customShortcutOpen: 'Open',
  customShortcutDelete: 'Delete',
  customShortcutEmpty: 'No custom shortcuts yet.',
  offlineLinkHint: 'Opens when online',
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
  sectionOfflineMaps: 'オフライン地図の準備',
  tapCopyAddress: 'タップして住所をコピー',
  checkIn: 'チェックイン',
  checkOut: 'チェックアウト',
  local: '（現地時間）',
  callHotel: 'ホテルに電話',
  openMaps: 'Google Maps',
  geoMaps: '地図アプリ',
  prepareOfflineMap: 'Offline mapを準備',
  copyPhone: '番号をコピー',
  confirmLabel: '予約確認番号 · この端末のみ保存',
  confirmPlaceholder: '確認番号を入力',
  persistHint:
    'この端末に保存されます。アプリを閉じたり再起動しても残ります。サイトのデータを削除した場合のみ消えます。',
  emergency: '緊急',
  emergencyAlt: '緊急 {n}',
  safetyNote:
    '地図は電波が必要です。ホテル情報・ヒント・電話・チェックリストはオフラインでも使えます。',
  flashlight: 'ライト',
  lightOn: 'ライト ON',
  notesLabel: 'メモ（この端末に保存）',
  notesPlaceholder: 'ゲート番号、待ち合わせ場所、リマインダー…',
  footer: '無料 · 広告なし · ログイン不要 · 確認番号はこの端末のみ',
  toastAddressCopied: '住所をコピーしました',
  toastPhoneCopied: '電話番号をコピーしました',
  toastSaved: 'この端末に保存しました',
  toastCopyFailed: 'コピーに失敗しました',
  toastLightOff: 'ライトを消しました',
  toastFlashlightOn: 'ライトをつけました',
  toastBrightScreen: '明るい画面を表示中',
  toastShortcutAdded: 'ショートカットを保存しました',
  toastShortcutDeleted: 'ショートカットを削除しました',
  toastShortcutInvalid: '名前と https のURLを入力してください',
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
  langToggle: 'アプリの言語',
  destLangTip: '現地で役立つ言語：',
  destLangAria: 'この滞在先で話されている言語',
  destLangTourist: '観光で通じやすい',
  offlineMapsIntro:
    'このアプリにオフライン地図タイルは埋め込めません。Wi‑Fiがあるうちに Google Maps でホテル周辺をダウンロードしてください。',
  offlineMapsStep1: '1. Google Maps を開く（下のボタン、またはスマホのアプリ）。',
  offlineMapsStep2: '2. ホテルを検索して場所を開き、プロフィール写真 → オフラインマップ。',
  offlineMapsStep3: '3. オンラインのあいだにホテル周辺エリアをダウンロード。',
  offlineMapsStepAlt:
    'または：Google Maps → プロフィール → オフラインマップ → 自分で地図を選択 → ダウンロード。',
  quickLinksLabel: '便利リンク（ネットが必要）',
  linkTranslate: 'Google 翻訳',
  linkCurrency: '為替（XE）',
  linkWhatsApp: 'WhatsApp',
  linkUber: 'Uber',
  linkCareem: 'Careem',
  rideAppsNote: '配車アプリ：Uber / Careem（ドバイ）— 出発前に入れておくと安心。',
  customShortcutsTitle: 'カスタムショートカット',
  customShortcutName: '名前',
  customShortcutUrl: 'https://…',
  customShortcutAdd: '追加',
  customShortcutOpen: '開く',
  customShortcutDelete: '削除',
  customShortcutEmpty: 'まだショートカットはありません。',
  offlineLinkHint: 'オンライン時に開きます',
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
