import './style.css';
import {
  STAYS,
  EMERGENCY,
  SAFETY_CHECKLIST,
  MAT_MESSAGE_TEMPLATE,
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
} from './data';
import {
  getConfirmation,
  setConfirmation,
  getNotes,
  setNotes,
  getManualStayOverride,
  setManualStayOverride,
} from './storage';

const app = document.querySelector<HTMLDivElement>('#app')!;

let selectedId: StayId = getManualStayOverride() ?? pickActiveStayId();
let torchStream: MediaStream | null = null;
let torchOn = false;

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
    // Fallback for older WebViews
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
      toast('Copy failed');
    }
    ta.remove();
  }
}

function stayPhase(stay: Stay, now = new Date()): string {
  const t = now.getTime();
  const inT = parseStayDate(stay.checkIn).getTime();
  const outT = parseStayDate(stay.checkOut).getTime();
  if (t < inT) return 'upcoming';
  if (t >= outT) return 'past';
  return 'now';
}

function countdownBits(stay: Stay, now = new Date()): { primary: string; secondary: string } {
  const phase = stayPhase(stay, now);
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const out = parseStayDate(stay.checkOut);
  const inn = parseStayDate(stay.checkIn);

  if (phase === 'upcoming') {
    const days = Math.ceil((inn.getTime() - now.getTime()) / 86_400_000);
    return {
      primary: days <= 0 ? 'Check-in today' : `Check-in in ${days} day${days === 1 ? '' : 's'}`,
      secondary: `${nights} night${nights === 1 ? '' : 's'} · ${formatStayDateTime(stay.checkIn)}`,
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
        primary: hoursLeft <= 1 ? 'Check-out soon' : `${hoursLeft}h until check-out`,
        secondary: `Check-out ${formatStayDateTime(stay.checkOut)}`,
      };
    }
    return {
      primary:
        nightsLeft <= 1
          ? 'Last night · check-out tomorrow'
          : `${nightsLeft} nights left`,
      secondary: `Check-out ${formatStayDateTime(stay.checkOut)}`,
    };
  }
  return {
    primary: 'Stay complete',
    secondary: `Checked out ${formatStayDateTime(stay.checkOut)}`,
  };
}

function shortCity(city: string): string {
  return city.split(',')[0]!;
}

function render(): void {
  const stay = getStay(selectedId);
  const autoId = pickActiveStayId();
  const emergency = EMERGENCY[stay.country];
  const bits = countdownBits(stay);
  const online = navigator.onLine;

  app.innerHTML = `
    <header class="header">
      <div class="brand">
        <strong>Rie Trip</strong>
        <span>Barcelona · Madrid · Dubai</span>
      </div>
      <div class="offline-pill ${online ? 'live' : ''}" id="net-pill">
        ${online ? 'Online' : 'Offline ready'}
      </div>
    </header>

    <nav class="switcher" aria-label="Stay switcher">
      ${STAYS.map(
        (s) => `
        <button type="button" class="chip ${s.id === selectedId ? 'active' : ''}" data-stay="${s.id}">
          <span class="flag">${s.flag}</span>
          <span class="label">${shortCity(s.city)}</span>
        </button>`,
      ).join('')}
    </nav>

    <section class="hero">
      <div class="flag-city">
        <span class="emoji">${stay.flag}</span>
        <h1>${shortCity(stay.city)}</h1>
      </div>
      <p class="city-ja">${stay.cityJa}${selectedId === autoId ? " · Today's stay" : " · Manual"}</p>
      <p class="hotel">${stay.hotel}</p>
      <div class="countdown">
        <span class="badge">${bits.primary}</span>
        <span class="badge muted">${bits.secondary}</span>
      </div>
    </section>

    <section class="card">
      <h2>Stay · 泊まる</h2>
      <div class="address" id="copy-address" role="button" tabindex="0" title="Tap to copy">
        <div class="v">${escapeHtml(stay.address)}</div>
        <div class="hint">Tap to copy address · 住所をコピー</div>
      </div>
      <div class="meta-row">
        <div class="meta-item">
          <span class="k">Check-in · チェックイン</span>
          <span class="v">${formatStayDateTime(stay.checkIn)} <small style="color:var(--muted)">(local)</small></span>
        </div>
        <div class="meta-item">
          <span class="k">Check-out · チェックアウト</span>
          <span class="v">${formatStayDateTime(stay.checkOut)} <small style="color:var(--muted)">(local)</small></span>
        </div>
      </div>
      <div class="actions">
        <a class="btn primary" href="${telHref(stay.phone)}">
          <span class="en">Call hotel</span>
          <span class="ja">電話</span>
        </a>
        <a class="btn" href="${mapsUrl(stay.mapsQuery)}" target="_blank" rel="noopener" id="maps-link">
          <span class="en">Open Maps</span>
          <span class="ja">地図</span>
        </a>
        <a class="btn" href="${geoUrl(stay.mapsQuery)}">
          <span class="en">Geo maps</span>
          <span class="ja">地図 (geo)</span>
        </a>
        <button type="button" class="btn" id="copy-phone">
          <span class="en">Copy phone</span>
          <span class="ja">番号コピー</span>
        </button>
      </div>
      <div class="field" style="margin-top:14px">
        <label for="confirm-input">Confirmation # · on this phone only</label>
        <input
          id="confirm-input"
          type="text"
          inputmode="text"
          autocomplete="off"
          spellcheck="false"
          placeholder="Add confirmation #"
          value="${escapeAttr(getConfirmation(stay.id))}"
        />
      </div>
    </section>

    <section class="card">
      <h2>Tips · ヒント</h2>
      <ul class="tips">
        ${stay.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
      </ul>
    </section>

    <section class="card">
      <h2>Safety · 緊急</h2>
      <ul class="checklist">
        ${SAFETY_CHECKLIST.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
      </ul>
      <div class="actions">
        <a class="btn danger ${emergency.alt ? '' : 'wide'}" href="${telHref(emergency.police)}">
          <span class="en">${escapeHtml(emergency.label)}</span>
          <span class="ja">緊急</span>
        </a>
        ${
          emergency.alt
            ? `<a class="btn danger" href="${telHref(emergency.alt)}">
                <span class="en">Emergency ${escapeHtml(emergency.alt)}</span>
                <span class="ja">緊急</span>
              </a>`
            : ''
        }
      </div>
      <p class="note">Maps need signal. Hotel text, tips, phones &amp; this checklist work fully offline.</p>
    </section>

    <section class="card">
      <h2>Quick tools · ツール</h2>
      <div class="actions">
        <button type="button" class="btn ${torchOn ? 'on' : ''}" id="torch-btn">
          <span class="en">${torchOn ? 'Light ON' : 'Flashlight'}</span>
          <span class="ja">ライト</span>
        </button>
        <button type="button" class="btn" id="copy-msg">
          <span class="en">Copy Mat msg</span>
          <span class="ja">メッセージ</span>
        </button>
      </div>
      <div class="field" style="margin-top:14px">
        <label for="notes">Personal notes · メモ (saved on device)</label>
        <textarea id="notes" placeholder="Gate numbers, meeting spots, reminders…">${escapeHtml(getNotes())}</textarea>
      </div>
    </section>

    <p class="footer">Free · no ads · no login · confirmation #s stay on this device</p>
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

function bind(stay: Stay): void {
  app.querySelectorAll<HTMLButtonElement>('.chip[data-stay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.stay as StayId;
      selectedId = id;
      setManualStayOverride(id);
      render();
    });
  });

  const addr = app.querySelector('#copy-address');
  addr?.addEventListener('click', () => void copyText(stay.address, 'Address copied'));
  addr?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
      e.preventDefault();
      void copyText(stay.address, 'Address copied');
    }
  });

  app.querySelector('#copy-phone')?.addEventListener('click', () => {
    void copyText(stay.phone, 'Phone copied');
  });

  const confirm = app.querySelector<HTMLInputElement>('#confirm-input');
  confirm?.addEventListener('change', () => {
    setConfirmation(stay.id, confirm.value);
    toast('Saved on this phone');
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

  app.querySelector('#copy-msg')?.addEventListener('click', () => {
    const msg = MAT_MESSAGE_TEMPLATE.replace('{{hotel}}', stay.hotel).replace(
      '{{city}}',
      stay.city,
    );
    void copyText(msg, 'Message copied');
  });

  app.querySelector('#torch-btn')?.addEventListener('click', () => {
    void toggleTorch();
  });
}

async function toggleTorch(): Promise<void> {
  // Prefer real torch via ImageCapture / track.applyConstraints
  try {
    if (torchOn && torchStream) {
      await stopTorch();
      toast('Light off');
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
      toast('Flashlight on');
      render();
      return;
    }

    // No torch capability — release camera and use white screen
    track.stop();
    stream.getTracks().forEach((t) => t.stop());
    openWhiteFallback();
  } catch {
    openWhiteFallback();
  }
}

async function stopTorch(): Promise<void> {
  if (torchStream) {
    for (const t of torchStream.getTracks()) {
      try {
        await t.applyConstraints({
          advanced: [{ torch: false } as MediaTrackConstraintSet],
        });
      } catch {
        /* ignore */
      }
      t.stop();
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
    el.innerHTML = `<div>Tap for light · ライト</div><div class="sub">Tap again to close</div>`;
    el.addEventListener('click', () => {
      void stopTorch();
      render();
    });
    document.body.appendChild(el);
  }
  return el;
}

function openWhiteFallback(): void {
  const el = ensureFallbackEl();
  el.classList.add('open');
  torchOn = true;
  // Try fullscreen for better iOS “flashlight”
  const req = el.requestFullscreen?.bind(el) ?? (el as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(el);
  try {
    void req?.();
  } catch {
    /* ignore */
  }
  toast('Bright screen on');
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

// Refresh countdown occasionally
window.setInterval(() => {
  // Only re-render if still on same stay to avoid stealing focus from inputs
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
  render();
}, 60_000);

render();

if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
