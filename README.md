# SachinCoderX — Premium 3D Batch Hub

Ek hi jagah saare 2027 batches (Neev · Udaan · Uday · Parishram · Arjuna · Lakshay · Yakeen · NDA · Skills · Finance) — search, category filter, favorites aur one-time access-code unlock ke saath.

> **Pehle kya tha:** repo me sirf ek `index.html` tha jo ek bahar ke iframe (`…arena.site/?embed=true`) ko embed karta tha. Design ka asli code repo me tha hi nahi, aur Cloudflare beacon + cross-origin iframe ki wajah se load slow tha.
>
> **Ab:** poori site **native, self-contained** hai — koi iframe nahi, koi framework nahi, koi build step nahi. 4 files, ~90 KB total (uncompressed), sab kuch browser cache-friendly.

---

## File structure

```
index.html            # poora markup + inline icon sprite + FOUC-rokne wala theme script
assets/css/styles.css # design system (tokens) + layout + animations
assets/js/data.js     # batches / categories / FAQ / features — content yahan edit karo
assets/js/app.js      # UI logic: filter, favorites, unlock modal, command palette, tilt
```

## Local me chalana

Koi build nahi chahiye. Static server se kholo (module/`fetch` restrictions se bachne ke liye `file://` ke bajaye server use karo):

```bash
python3 -m http.server 5173 --bind 0.0.0.0
# → http://localhost:5173
```

## Owner settings (access code + links)

Sab kuch `assets/js/data.js` me hai:

```js
var CONFIG = {
  owner: 'SachinCoderX',
  ownerHandle: '@SachinCoderX',
  accessCode: 'SACHIN2027',      // ← apna one-time code yahan daaliye
  unlockedLabel: 'Access Ready',
  lockedLabel: 'Unlock to Access'
};
```

Har batch me `accessUrl` khali chhoda gaya hai. Jab aapke paas apna link ho:

```js
{ id: 'uday-2027', title: 'Uday 2027', cat: 'class1112', … , accessUrl: 'https://…' }
```

Link set hote hi unlock ke baad card ka button seedha wahi link naye tab me khol dega. Jab tak link khali hai, unlock hone par button "Access Ready" dikhata hai aur click par info toast aata hai — koi toota link nahi.

**Naya batch add karna** = `BATCHES` array me ek object daalna. Category chip, count, marquee, command palette aur stats sab apne aap update ho jate hain.

## Kya-kya naya hai (design)

- **Aurora-glass design system** — CSS tokens se dark + light theme, dono me same spacing/shadow scale. Theme paint se *pehle* lagta hai (inline script), isliye flash-of-wrong-theme nahi hota.
- **Hero** — line-mask headline reveal, gradient orb, 3 parallax 3D float-cards (pointer ke saath move karte hain), animated stat counters.
- **Sticky toolbar** — live search (debounced), category chips + counts, sort, favorites-only toggle, grid/list view toggle (localStorage me yaad).
- **Batch cards** — HD cover + skeleton shimmer + gradient fallback (image fail ho to design nahi tootta), category/new badges, subject chips, 3D tilt + pointer spotlight, ❤️ favorite (top par aa jata hai).
- **Command palette** — `Ctrl/⌘ + K` se batches, categories aur actions tak pahunch; `↑ ↓ ↵ Esc` keyboard support.
- **Unlock modal** — focus-trap, Esc/backdrop close, galat code par shake, success state, `localStorage` me unlock yaad.
- **Baaki** — scroll progress bar, active nav link, reveal-on-scroll, marquee, FAQ accordion (pure CSS `grid-template-rows`), toasts, back-to-top progress ring, owner chip.

## "100x smooth" — actually kya kiya

Performance claims nahi, engineering decisions:

| Cheez | Kaise |
|---|---|
| Sirf GPU-friendly animation | Har transition/keyframe `transform`, `opacity`, `filter` par. `box-shadow`/`width`/`height` animate nahi hote. |
| Scroll par jank zero | Ek hi `scroll` listener, `passive: true`, `requestAnimationFrame` throttle, aur sirf `scaleX` / class toggle update hota hai. |
| Filter = no re-render | Grid ek baar banta hai. Filter sirf `is-hidden` class + CSS `order` badalta hai → DOM nodes dobara nahi bante, GC churn zero. |
| Tilt/spotlight | Delegated `pointermove` + rAF gate; `@media (hover: hover)` ke andar hi, touch par pura band. |
| Layout shift (CLS) zero | Images me `width`/`height` + `aspect-ratio` pehle se reserved; skeleton usi jagah. |
| Images | `loading="lazy"` (pehle 4 eager), `decoding="async"`, `referrerpolicy="no-referrer"`, error par gradient fallback. |
| Reveal / count-up | `IntersectionObserver` (scroll math nahi), ek baar chalne ke baad `unobserve`. |
| Payload | 0 dependency, 0 framework, 0 iframe, 0 third-party analytics beacon. |
| Accessibility | Skip link, `aria-pressed`/`aria-expanded`, focus trap, visible `:focus-visible`, `prefers-reduced-motion` par saari motion off. |
| Memory/paint | Cards par `contain: layout paint style`; background layers `contain: strict` me. |

## Verify kaise kiya

- **jsdom integration test** (`/home/user/.qa/test.mjs`, repo ke bahar): asli `index.html` + `data.js` + `app.js` load karke real code paths chalaye — boot, 23 cards render, search/filter/sort, favorites + `localStorage`, unlock (galat + sahi code), theme, view toggle, command palette, FAQ, scroll handler, reveal + count-up, escaping. Result: **53 passed / 0 failed, koi runtime error nahi**.
- **CSS**: `css-tree` se parse — **0 parse errors**, 337 rules.
- **HTML/JS wiring**: JS me referenced saare 43 ids aur saare icon symbols HTML me maujood (0 missing).

Sandbox me headless Chromium download possible nahi tha (browser CDN blocked), isliye visual/pixel-level check browser me nahi ho paya — visual review aapko live preview me khud karna hoga.
