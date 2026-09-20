import './style.css';
import {
  STAYS,
  EMERGENCY,
  type Stay,
  type StayId,
  pickActiveStayId,
  getStay,
  formatStayDateTime,
  nightsBetween,
  parseStayDate,
  mapsUrl,
  geoUrl,
  telHref,
  wikiUrl,
  tipsFor,
} from './data';
import {
  getConfirmation,
  setConfirmation,
  getNotes,
  setNotes,
  getManualStayOverride,
  setManualStayOverride,
  getCustomShortcuts,
  addCustomShortcut,
  removeCustomShortcut,
} from './storage';
import {
  type Lang,
  ALL_LANGS,
  getLang,
  setLang,
  localeFor,
  t,
  SAFETY_CHECKLIST_I18N,
  EMERGENCY_LABELS,
  langLabel,
} from './i18n';

const app = document.querySelector<HTMLDivElement>('#app')!;

let selectedId: StayId = getManualStayOverride() ?? pickActiveStayId();
let lang: Lang = getLang();
let torchStream: MediaStream | null = null;
let torchOn = false;

const QUICK_LINKS = {
  translate: 'https://translate.google.com/',
  currency: 'https://www.xe.com/currencyconverter/',
  uber: 'https://m.uber.com/',
  careem: 'https://www.careem.com/',
} as const;

function applyDocumentLang(): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

function toast(msg: string): void {
  let el = document.querySelector<HTMLDivElement>('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  window.clearTimeout((el as HTMLDivElement & { _t?: number })._t);
  (el as HTMLDivElement & { _t?: number })._t = window.setTimeout(() => {
    el!.classList.remove('show');
  }, 1800);
}

async function copyText(text: string, okMsg: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast(okMsg);
    } catch {
      toast(t(lang, 'toastCopyFailed'));
    }
    ta.remove();
  }
}

function stayPhase(stay: Stay, now = new Date()): string {
  const tm = now.getTime();
  const inT = parseStayDate(stay.checkIn).getTime();
  const outT = parseStayDate(stay.checkOut).getTime();
  if (tm < inT) return 'upcoming';
  if (tm >= outT) return 'past';
  return 'now';
}

function fmtDate(s: string): string {
  return formatStayDateTime(s, localeFor(lang));
}

function countdownBits(stay: Stay, now = new Date()): { primary: string; secondary: string } {
  const phase = stayPhase(stay, now);
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const out = parseStayDate(stay.checkOut);
  const inn = parseStayDate(stay.checkIn);

  if (phase === 'upcoming') {
    const days = Math.ceil((inn.getTime() - now.getTime()) / 86_400_000);
    const nightsKey = nights === 1 ? 'nightsLabel' : 'nightsLabelPlural';
    return {
      primary:
        days <= 0
          ? t(lang, 'checkInToday')
          : t(lang, days === 1 ? 'checkInInDays' : 'checkInInDaysPlural', { n: days }),
      secondary: `${t(lang, nightsKey, { n: nights })} · ${fmtDate(stay.checkIn)}`,
    };
  }
  if (phase === 'now') {
    const msLeft = out.getTime() - now.getTime();
    const hoursLeft = Math.max(0, Math.ceil(msLeft / 3_600_000));
    const nightsLeft = Math.max(
      0,
      Math.ceil(
        (new Date(out.getFullYear(), out.getMonth(), out.getDate()).getTime() -
          new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
          86_400_000,
      ),
    );
    if (hoursLeft <= 24) {
      return {
        primary:
          hoursLeft <= 1
            ? t(lang, 'checkOutSoon')
            : t(lang, 'hoursUntilCheckout', { n: hoursLeft }),
        secondary: t(lang, 'checkoutAt', { date: fmtDate(stay.checkOut) }),
      };
    }
    return {
      primary:
        nightsLeft <= 1
          ? t(lang, 'lastNight')
          : t(lang, 'nightsLeft', { n: nightsLeft }),
      secondary: t(lang, 'checkoutAt', { date: fmtDate(stay.checkOut) }),
    };
  }
  return {
    primary: t(lang, 'stayComplete'),
    secondary: t(lang, 'checkedOut', { date: fmtDate(stay.checkOut) }),
  };
}

function shortCity(city: string): string {
  return city.split(',')[0]!;
}

function heroCityLabel(stay: Stay): string {
  return lang === 'ja' ? stay.cityJa : shortCity(stay.city);
}

function heroSubLabel(stay: Stay): string {
  return lang === 'ja' ? stay.city : stay.cityJa;
}

function emergencyPrimaryLabel(country: Stay['country']): string {
  return country === 'ES' ? EMERGENCY_LABELS[lang].ES : EMERGENCY_LABELS[lang].AE;
}

function emergencyAltLabel(): string {
  return EMERGENCY_LABELS[lang].AE_alt;
}

function normalizeHttpsUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

function switchLang(next: Lang): void {
  if (next === lang) return;
  lang = next;
  setLang(lang);
  render();
}

function headerLangToggleHtml(): string {
  return `
    <div class="lang-toggle" role="group" aria-label="${escapeAttr(t(lang, 'langToggle'))}">
      ${ALL_LANGS.map(
        (code) => `
        <button type="button" class="lang-btn ${lang === code ? 'active' : ''}" data-lang="${code}">
          ${escapeHtml(langLabel(code))}
        </button>`,
      ).join('')}
    </div>`;
}

function destLangChipsHtml(stay: Stay): string {
  const chips = stay.localLangs
    .map((l) => {
      const active = lang === l.code;
      const tourist = l.touristCommon
        ? ` <span class="dest-lang-note">(${escapeHtml(t(lang, 'destLangTourist'))})</span>`
        : '';
      return `<button type="button" class="dest-lang-chip${l.touristCommon ? ' tourist' : ''}${active ? ' active' : ''}" data-lang="${l.code}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(l.name)}${tourist}</button>`;
    })
    .join('');
  return `
    <div class="dest-langs" aria-label="${escapeAttr(t(lang, 'destLangAria'))}">
      <p class="dest-lang-tip">${escapeHtml(t(lang, 'destLangTip'))}</p>
      <div class="dest-lang-chips" role="group">${chips}</div>
    </div>`;
}

function customShortcutsHtml(): string {
  const list = getCustomShortcuts();
  const items =
    list.length === 0
      ? `<p class="note">${escapeHtml(t(lang, 'customShortcutEmpty'))}</p>`
      : `<ul class="shortcut-list">
          ${list
            .map(
              (s) => `
            <li class="shortcut-item">
              <a class="btn shortcut-open" href="${escapeAttr(s.url)}" target="_blank" rel="noopener">
                <span class="label">${escapeHtml(s.name)}</span>
                <span class="sub">${escapeHtml(t(lang, 'offlineLinkHint'))}</span>
              </a>
              <button type="button" class="btn danger shortcut-del" data-shortcut-id="${escapeAttr(s.id)}">
                <span class="label">${escapeHtml(t(lang, 'customShortcutDelete'))}</span>
              </button>
            </li>`,
            )
            .join('')}
        </ul>`;

  return `
    <div class="shortcuts-block">
      <h3 class="subhead">${escapeHtml(t(lang, 'customShortcutsTitle'))}</h3>
      ${items}
      <div class="shortcut-form">
        <div class="field">
          <label for="shortcut-name">${escapeHtml(t(lang, 'customShortcutName'))}</label>
          <input id="shortcut-name" type="text" maxlength="40" autocomplete="off" placeholder="${escapeAttr(t(lang, 'customShortcutName'))}" />
        </div>
        <div class="field">
          <label for="shortcut-url">${escapeHtml(t(lang, 'customShortcutUrl'))}</label>
          <input id="shortcut-url" type="url" inputmode="url" autocomplete="off" placeholder="${escapeAttr(t(lang, 'customShortcutUrl'))}" />
        </div>
        <button type="button" class="btn primary wide" id="shortcut-add">
          <span class="label">${escapeHtml(t(lang, 'customShortcutAdd'))}</span>
        </button>
      </div>
    </div>`;
}

function render(): void {
  applyDocumentLang();
  const stay = getStay(selectedId);
  const autoId = pickActiveStayId();
  const emergency = EMERGENCY[stay.country];
  const bits = countdownBits(stay);
  const online = navigator.onLine;
  const stayMode = selectedId === autoId ? t(lang, 'todaysStay') : t(lang, 'manual');
  const tips = tipsFor(stay, lang);
  const checklist = SAFETY_CHECKLIST_I18N[lang];
  const hotelMaps = mapsUrl(stay.mapsQuery);
  const isDubai = stay.id === 'dxb';
  const wiki = wikiUrl(stay, lang);

  app.innerHTML = `
    <header class="header">
      <div class="brand">
        <strong>${escapeHtml(t(lang, 'appTitle'))}</strong>
        <span>${escapeHtml(t(lang, 'appSubtitle'))}</span>
      </div>
      <div class="header-right">
        ${headerLangToggleHtml()}
        <div class="offline-pill ${online ? 'live' : ''}" id="net-pill">
          ${online ? escapeHtml(t(lang, 'online')) : escapeHtml(t(lang, 'offlineReady'))}
        </div>
      </div>
    </header>

    ${destLangChipsHtml(stay)}

    <nav class="switcher" aria-label="${escapeAttr(t(lang, 'staySwitcher'))}">
      ${STAYS.map(
        (s) => `
        <button type="button" class="chip ${s.id === selectedId ? 'active' : ''}" data-stay="${s.id}">
          <span class="flag">${s.flag}</span>
          <span class="label">${escapeHtml(lang === 'ja' ? s.cityJa : shortCity(s.city))}</span>
        </button>`,
      ).join('')}
    </nav>

    <section class="hero">
      <div class="flag-city">
        <span class="emoji">${stay.flag}</span>
        <h1>${escapeHtml(heroCityLabel(stay))}</h1>
      </div>
      <p class="city-ja">${escapeHtml(heroSubLabel(stay))} · ${escapeHtml(stayMode)}</p>
      <p class="hotel">${escapeHtml(stay.hotel)}</p>
      <div class="countdown">
        <span class="badge">${escapeHtml(bits.primary)}</span>
        <span class="badge muted">${escapeHtml(bits.secondary)}</span>
      </div>
    </section>

    <section class="card">
      <h2>${escapeHtml(t(lang, 'sectionStay'))}</h2>
      <div class="address" id="copy-address" role="button" tabindex="0" title="${escapeAttr(t(lang, 'tapCopyAddress'))}">
        <div class="v">${escapeHtml(stay.address)}</div>
        <div class="hint">${escapeHtml(t(lang, 'tapCopyAddress'))}</div>
      </div>
      <div class="meta-row">
        <div class="meta-item">
          <span class="k">${escapeHtml(t(lang, 'checkIn'))}</span>
          <span class="v">${escapeHtml(fmtDate(stay.checkIn))} <small style="color:var(--muted)">${escapeHtml(t(lang, 'local'))}</small></span>
        </div>
        <div class="meta-item">
          <span class="k">${escapeHtml(t(lang, 'checkOut'))}</span>
          <span class="v">${escapeHtml(fmtDate(stay.checkOut))} <small style="color:var(--muted)">${escapeHtml(t(lang, 'local'))}</small></span>
        </div>
      </div>
      <div class="actions">
        <a class="btn primary" href="${telHref(stay.phone)}">
          <span class="label">${escapeHtml(t(lang, 'callHotel'))}</span>
        </a>
        <button type="button" class="btn" id="copy-phone">
          <span class="label">${escapeHtml(t(lang, 'copyPhone'))}</span>
        </button>
        <a class="btn" href="${hotelMaps}" target="_blank" rel="noopener" id="maps-link">
          <span class="label">${escapeHtml(t(lang, 'openMaps'))}</span>
        </a>
        <a class="btn" href="${geoUrl(stay.mapsQuery)}">
          <span class="label">${escapeHtml(t(lang, 'geoMaps'))}</span>
        </a>
      </div>
      <div class="field" style="margin-top:14px">
        <label for="confirm-input">${escapeHtml(t(lang, 'confirmLabel'))}</label>
        <input
          id="confirm-input"
          type="text"
          inputmode="text"
          autocomplete="off"
          spellcheck="false"
          placeholder="${escapeAttr(t(lang, 'confirmPlaceholder'))}"
          value="${escapeAttr(getConfirmation(stay.id))}"
        />
        <p class="persist-hint">${escapeHtml(t(lang, 'persistHint'))}</p>
      </div>
    </section>

    <section class="card offline-maps-card">
      <h2>${escapeHtml(t(lang, 'sectionOfflineMaps'))}</h2>
      <p class="note offline-maps-intro">${escapeHtml(t(lang, 'offlineMapsIntro'))}</p>
      <ol class="offline-steps">
        <li>${escapeHtml(t(lang, 'offlineMapsStep1'))}</li>
        <li>${escapeHtml(t(lang, 'offlineMapsStep2'))}</li>
        <li>${escapeHtml(t(lang, 'offlineMapsStep3'))}</li>
      </ol>
      <p class="note">${escapeHtml(t(lang, 'offlineMapsStepAlt'))}</p>
      <div class="actions" style="margin-top:12px">
        <a class="btn primary wide" href="${hotelMaps}" target="_blank" rel="noopener">
          <span class="label">${escapeHtml(t(lang, 'prepareOfflineMap'))}</span>
        </a>
      </div>
    </section>

    <section class="card">
      <h2>${escapeHtml(t(lang, 'sectionTips'))}</h2>
      <ul class="tips">
        ${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('')}
      </ul>
    </section>

    <section class="card">
      <h2>${escapeHtml(t(lang, 'sectionSafety'))}</h2>
      <ul class="checklist">
        ${checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
      </ul>
      <div class="actions">
        <a class="btn danger ${emergency.alt ? '' : 'wide'}" href="${telHref(emergency.police)}">
          <span class="label">${escapeHtml(emergencyPrimaryLabel(stay.country))}</span>
        </a>
        ${
          emergency.alt
            ? `<a class="btn danger" href="${telHref(emergency.alt)}">
                <span class="label">${escapeHtml(emergencyAltLabel())}</span>
              </a>`
            : ''
        }
      </div>
      <p class="note">${escapeHtml(t(lang, 'safetyNote'))}</p>
    </section>

    <section class="card">
      <h2>${escapeHtml(t(lang, 'sectionTools'))}</h2>
      <div class="actions">
        <button type="button" class="btn ${torchOn ? 'on' : ''}" id="torch-btn">
          <span class="label">${escapeHtml(t(lang, torchOn ? 'lightOn' : 'flashlight'))}</span>
        </button>
        <button type="button" class="btn" id="calc-btn">
          <span class="label">${escapeHtml(t(lang, 'calculator'))}</span>
        </button>
        <button type="button" class="btn wide" id="calendar-btn">
          <span class="label">${escapeHtml(t(lang, 'calendar'))}</span>
        </button>
      </div>

      <h3 class="subhead">${escapeHtml(t(lang, 'quickLinksLabel'))}</h3>
      <div class="actions">
        <a class="btn" href="${QUICK_LINKS.translate}" target="_blank" rel="noopener">
          <span class="label">${escapeHtml(t(lang, 'linkTranslate'))}</span>
          <span class="sub">${escapeHtml(t(lang, 'offlineLinkHint'))}</span>
        </a>
        <a class="btn" href="${QUICK_LINKS.currency}" target="_blank" rel="noopener">
          <span class="label">${escapeHtml(t(lang, 'linkCurrency'))}</span>
          <span class="sub">${escapeHtml(t(lang, 'offlineLinkHint'))}</span>
        </a>
        <a class="btn wide" href="${escapeAttr(wiki)}" target="_blank" rel="noopener">
          <span class="label">${escapeHtml(t(lang, 'linkWikipedia'))}</span>
          <span class="sub">${escapeHtml(t(lang, 'offlineLinkHint'))}</span>
        </a>
        ${
          isDubai
            ? `<a class="btn" href="${QUICK_LINKS.uber}" target="_blank" rel="noopener">
                <span class="label">${escapeHtml(t(lang, 'linkUber'))}</span>
                <span class="sub">${escapeHtml(t(lang, 'offlineLinkHint'))}</span>
              </a>
              <a class="btn" href="${QUICK_LINKS.careem}" target="_blank" rel="noopener">
                <span class="label">${escapeHtml(t(lang, 'linkCareem'))}</span>
                <span class="sub">${escapeHtml(t(lang, 'offlineLinkHint'))}</span>
              </a>`
            : ''
        }
      </div>
      ${isDubai ? `<p class="note" style="margin-top:8px">${escapeHtml(t(lang, 'rideAppsNote'))}</p>` : ''}

      ${customShortcutsHtml()}

      <div class="field" style="margin-top:14px">
        <label for="notes">${escapeHtml(t(lang, 'notesLabel'))}</label>
        <textarea id="notes" placeholder="${escapeAttr(t(lang, 'notesPlaceholder'))}">${escapeHtml(getNotes())}</textarea>
        <p class="persist-hint">${escapeHtml(t(lang, 'persistHint'))}</p>
      </div>
    </section>

    <p class="footer">${escapeHtml(t(lang, 'footer'))}</p>
  `;

  bind(stay);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function isLang(v: string | undefined): v is Lang {
  return v === 'ja' || v === 'en' || v === 'es' || v === 'ca' || v === 'ar';
}

function bind(stay: Stay): void {
  app.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.lang;
      if (!isLang(next)) return;
      switchLang(next);
    });
  });

  app.querySelectorAll<HTMLButtonElement>('.chip[data-stay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.stay as StayId;
      selectedId = id;
      setManualStayOverride(id);
      render();
    });
  });

  const addr = app.querySelector('#copy-address');
  addr?.addEventListener('click', () => void copyText(stay.address, t(lang, 'toastAddressCopied')));
  addr?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
      e.preventDefault();
      void copyText(stay.address, t(lang, 'toastAddressCopied'));
    }
  });

  app.querySelector('#copy-phone')?.addEventListener('click', () => {
    void copyText(stay.phone, t(lang, 'toastPhoneCopied'));
  });

  const confirm = app.querySelector<HTMLInputElement>('#confirm-input');
  confirm?.addEventListener('change', () => {
    setConfirmation(stay.id, confirm.value);
    toast(t(lang, 'toastSaved'));
  });
  confirm?.addEventListener('blur', () => {
    setConfirmation(stay.id, confirm.value);
  });

  const notes = app.querySelector<HTMLTextAreaElement>('#notes');
  let notesTimer = 0;
  notes?.addEventListener('input', () => {
    window.clearTimeout(notesTimer);
    notesTimer = window.setTimeout(() => setNotes(notes.value), 250);
  });

  app.querySelector('#torch-btn')?.addEventListener('click', () => {
    void toggleTorch();
  });

  app.querySelector('#calc-btn')?.addEventListener('click', () => {
    openCalculatorModal();
  });

  app.querySelector('#calendar-btn')?.addEventListener('click', () => {
    openCalendarModal();
  });

  app.querySelector('#shortcut-add')?.addEventListener('click', () => {
    const nameEl = app.querySelector<HTMLInputElement>('#shortcut-name');
    const urlEl = app.querySelector<HTMLInputElement>('#shortcut-url');
    const name = nameEl?.value.trim() ?? '';
    const url = normalizeHttpsUrl(urlEl?.value ?? '');
    if (!name || !url) {
      toast(t(lang, 'toastShortcutInvalid'));
      return;
    }
    addCustomShortcut(name, url);
    toast(t(lang, 'toastShortcutAdded'));
    render();
  });

  app.querySelectorAll<HTMLButtonElement>('.shortcut-del[data-shortcut-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.shortcutId;
      if (!id) return;
      removeCustomShortcut(id);
      toast(t(lang, 'toastShortcutDeleted'));
      render();
    });
  });
}

function closeModal(root: HTMLElement): void {
  root.remove();
}

function openCalendarModal(): void {
  document.querySelector('#rie-modal-calendar')?.remove();
  const modal = document.createElement('div');
  modal.id = 'rie-modal-calendar';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', t(lang, 'calendarTitle'));

  const items = STAYS.map((s) => {
    const nights = nightsBetween(s.checkIn, s.checkOut);
    const nightsKey = nights === 1 ? 'nightsLabel' : 'nightsLabelPlural';
    const city = lang === 'ja' ? s.cityJa : shortCity(s.city);
    return `
      <li class="agenda-item">
        <div class="agenda-flag">${s.flag}</div>
        <div class="agenda-body">
          <div class="agenda-city">${escapeHtml(city)}</div>
          <div class="agenda-hotel">${escapeHtml(s.hotel)}</div>
          <div class="agenda-dates">
            <span>${escapeHtml(t(lang, 'checkIn'))}: ${escapeHtml(fmtDate(s.checkIn))}</span>
            <span>${escapeHtml(t(lang, 'checkOut'))}: ${escapeHtml(fmtDate(s.checkOut))}</span>
            <span class="agenda-nights">${escapeHtml(t(lang, nightsKey, { n: nights }))}</span>
          </div>
        </div>
      </li>`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-head">
        <h2>${escapeHtml(t(lang, 'calendarTitle'))}</h2>
        <button type="button" class="modal-close" data-close>${escapeHtml(t(lang, 'calendarClose'))}</button>
      </div>
      <ol class="agenda-list">${items}</ol>
    </div>`;

  modal.addEventListener('click', (e) => {
    if (e.target === modal || (e.target as HTMLElement).closest('[data-close]')) {
      closeModal(modal);
    }
  });
  document.body.appendChild(modal);
}

function openCalculatorModal(): void {
  document.querySelector('#rie-modal-calc')?.remove();
  const modal = document.createElement('div');
  modal.id = 'rie-modal-calc';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', t(lang, 'calculator'));

  modal.innerHTML = `
    <div class="modal-sheet calc-sheet">
      <div class="modal-head">
        <h2>${escapeHtml(t(lang, 'calculator'))}</h2>
        <button type="button" class="modal-close" data-close>${escapeHtml(t(lang, 'calcClose'))}</button>
      </div>
      <div class="calc">
        <div class="calc-display" id="calc-display" aria-live="polite">0</div>
        <div class="calc-pad">
          <button type="button" class="calc-key" data-k="C">${escapeHtml(t(lang, 'calcClear'))}</button>
          <button type="button" class="calc-key" data-k="±">±</button>
          <button type="button" class="calc-key" data-k="%">%</button>
          <button type="button" class="calc-key op" data-k="/">÷</button>
          <button type="button" class="calc-key" data-k="7">7</button>
          <button type="button" class="calc-key" data-k="8">8</button>
          <button type="button" class="calc-key" data-k="9">9</button>
          <button type="button" class="calc-key op" data-k="*">×</button>
          <button type="button" class="calc-key" data-k="4">4</button>
          <button type="button" class="calc-key" data-k="5">5</button>
          <button type="button" class="calc-key" data-k="6">6</button>
          <button type="button" class="calc-key op" data-k="-">−</button>
          <button type="button" class="calc-key" data-k="1">1</button>
          <button type="button" class="calc-key" data-k="2">2</button>
          <button type="button" class="calc-key" data-k="3">3</button>
          <button type="button" class="calc-key op" data-k="+">+</button>
          <button type="button" class="calc-key zero" data-k="0">0</button>
          <button type="button" class="calc-key" data-k=".">.</button>
          <button type="button" class="calc-key eq" data-k="=">=</button>
        </div>
      </div>
    </div>`;

  let display = '0';
  let prev: number | null = null;
  let op: string | null = null;
  let fresh = true;

  const displayEl = () => modal.querySelector<HTMLDivElement>('#calc-display')!;

  const sync = () => {
    displayEl().textContent = display;
  };

  const applyOp = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const formatNum = (n: number): string => {
    if (!Number.isFinite(n)) return 'Error';
    const s = String(Number(n.toPrecision(12)));
    return s.length > 14 ? n.toExponential(6) : s;
  };

  modal.querySelectorAll<HTMLButtonElement>('.calc-key[data-k]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.k!;
      if (k === 'C') {
        display = '0';
        prev = null;
        op = null;
        fresh = true;
        sync();
        return;
      }
      if (k === '±') {
        if (display === '0' || display === 'Error') return;
        display = display.startsWith('-') ? display.slice(1) : `-${display}`;
        sync();
        return;
      }
      if (k === '%') {
        const n = parseFloat(display);
        if (!Number.isFinite(n)) return;
        display = formatNum(n / 100);
        fresh = true;
        sync();
        return;
      }
      if (k === '=' || k === '+' || k === '-' || k === '*' || k === '/') {
        const cur = parseFloat(display);
        if (op && prev !== null && !fresh) {
          const result = applyOp(prev, cur, op);
          display = formatNum(result);
          prev = Number.isFinite(result) ? result : null;
        } else if (Number.isFinite(cur)) {
          prev = cur;
        }
        op = k === '=' ? null : k;
        fresh = true;
        sync();
        return;
      }
      if (k === '.') {
        if (fresh) {
          display = '0.';
          fresh = false;
        } else if (!display.includes('.')) {
          display += '.';
        }
        sync();
        return;
      }
      // digit
      if (fresh || display === '0' || display === 'Error') {
        display = k;
        fresh = false;
      } else if (display.replace('-', '').length < 14) {
        display += k;
      }
      sync();
    });
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || (e.target as HTMLElement).closest('[data-close]')) {
      closeModal(modal);
    }
  });
  document.body.appendChild(modal);
}

async function toggleTorch(): Promise<void> {
  try {
    if (torchOn && torchStream) {
      await stopTorch();
      toast(t(lang, 'toastLightOff'));
      render();
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error('no track');

    const caps = track.getCapabilities?.() as
      | (MediaTrackCapabilities & { torch?: boolean })
      | undefined;

    if (caps && 'torch' in caps && caps.torch) {
      await track.applyConstraints({
        advanced: [{ torch: true } as MediaTrackConstraintSet],
      });
      torchStream = stream;
      torchOn = true;
      toast(t(lang, 'toastFlashlightOn'));
      render();
      return;
    }

    track.stop();
    stream.getTracks().forEach((tr) => tr.stop());
    openWhiteFallback();
  } catch {
    openWhiteFallback();
  }
}

async function stopTorch(): Promise<void> {
  if (torchStream) {
    for (const tr of torchStream.getTracks()) {
      try {
        await tr.applyConstraints({
          advanced: [{ torch: false } as MediaTrackConstraintSet],
        });
      } catch {
        /* ignore */
      }
      tr.stop();
    }
    torchStream = null;
  }
  torchOn = false;
  closeWhiteFallback();
}

function ensureFallbackEl(): HTMLDivElement {
  let el = document.querySelector<HTMLDivElement>('#torch-fallback');
  if (!el) {
    el = document.createElement('div');
    el.id = 'torch-fallback';
    el.addEventListener('click', () => {
      void stopTorch();
      render();
    });
    document.body.appendChild(el);
  }
  el.innerHTML = `<div>${escapeHtml(t(lang, 'torchTap'))}</div><div class="sub">${escapeHtml(t(lang, 'torchClose'))}</div>`;
  return el;
}

function openWhiteFallback(): void {
  const el = ensureFallbackEl();
  el.classList.add('open');
  torchOn = true;
  const req =
    el.requestFullscreen?.bind(el) ??
    (el as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(
      el,
    );
  try {
    void req?.();
  } catch {
    /* ignore */
  }
  toast(t(lang, 'toastBrightScreen'));
  render();
}

function closeWhiteFallback(): void {
  const el = document.querySelector<HTMLDivElement>('#torch-fallback');
  el?.classList.remove('open');
  if (document.fullscreenElement) {
    void document.exitFullscreen?.();
  }
}

window.addEventListener('online', () => render());
window.addEventListener('offline', () => render());

window.setInterval(() => {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
  if (document.querySelector('.modal-overlay')) return;
  render();
}, 60_000);

applyDocumentLang();
render();

if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
