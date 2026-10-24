import '@fontsource/heebo/hebrew-400.css';
import '@fontsource/heebo/hebrew-700.css';
import '@fontsource/heebo/latin-700.css';
import './style.css';
import { Game, WAVES, type Receipt } from './game';
import { Rational } from './math';
import { createScene, type RenderState } from './scene';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <canvas id="arena" tabindex="0" aria-label="זירת Percent Pulse. זוזו עם החצים או לחצו על הרצפה. הירי אוטומטי. רווח מפעיל פעימה."></canvas>
  <header class="game-header">
    <div class="brand" dir="ltr">Percent <span>Pulse</span></div>
    <div id="wave-label"></div>
    <nav><button id="settings" class="icon-button" aria-label="הגדרות">⚙</button><button id="pause" class="icon-button" aria-label="השהיה">Ⅱ</button></nav>
  </header>
  <section id="hud" hidden>
    <div id="health"><div id="shields" aria-label="מגן"></div><small>ירי אוטומטי · <bdi>18</bdi></small></div>
    <div id="wave-progress"></div>
    <button id="pulse" class="pulse-control" hidden><span class="pulse-symbol"><i></i></span><span class="pulse-copy"><strong>פעימה <bdi>25%</bdi></strong><span id="pulse-state"></span><span class="charge-row"><i></i><i></i></span></span><kbd id="pulse-key">רווח</kbd></button>
    <div id="coach"></div><div id="receipt" aria-live="polite"></div><div id="message" aria-live="polite"></div>
  </section>
  <section id="overlay"></section>
  <div id="touch-controls"><div id="stick" aria-label="תנועה"><i></i></div><span>תנועה</span></div>
  <dialog id="options">
    <button id="close-options" class="icon-button close" aria-label="סגירה">✕</button>
    <h2>איך נוח לשחק?</h2>
    <label>עוצמת קול<input id="volume" type="range" min="0" max="1" step=".05"></label>
    <label><span>אפקטים מופחתים</span><input id="reduced" type="checkbox"></label>
    <label><span>פקדי מגע</span><input id="touch-mode" type="checkbox"></label>
    <div class="rules"><strong>רק זזים ונותנים פעימה.</strong><p>הרובה מכוון ויורה לבד. פעימה מורידה רבע מהחיים הנוכחיים של כל אויב בטווח, ומרחיקה אותו.</p><p>שתי פעימות בכל גל, החל מהגל השני. הירי הרגיל לא נגמר.</p></div>
    <details><summary>מיפוי מקשים</summary><div id="bindings"></div><button id="reset-bindings">איפוס מקשים</button></details>
    <button id="skip-guide" class="quiet-button">להמשיך בלי ההדרכה הקצרה</button>
    <p class="muted">מסך מלא: <bdi>F</bdi> · השהיה: <bdi>Esc</bdi></p>
  </dialog>
`;

const $ = (id: string) => document.getElementById(id)!;
const canvas = $('arena') as HTMLCanvasElement;
const options = $('options') as HTMLDialogElement;
const game = new Game();
game.setup(); game.mode = 'title';
let scene: ReturnType<typeof createScene>;
try { scene = createScene(canvas); }
catch (error) {
  app.innerHTML = '<div class="fatal"><h1>צריך להפעיל WebGL כדי לשחק</h1><p>הפעילו האצת חומרה בדפדפן וטענו שוב.</p><button onclick="location.reload()">טעינה מחדש</button></div>';
  throw error;
}
const defaults = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', pulse: 'Space' };
type Binding = keyof typeof defaults;
let bindings = { ...defaults }, volume = .18;
try {
  const data = JSON.parse(localStorage.getItem('percent-pulse-v2-settings') || '{}');
  if (typeof data.volume === 'number' && Number.isFinite(data.volume)) volume = Math.max(0, Math.min(1, data.volume));
  game.effectsReduced = data.reduced === true || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (data.bindings && Object.keys(defaults).every(k => typeof data.bindings[k] === 'string' && /^(Key[A-Z]|Space)$/.test(data.bindings[k]) && data.bindings[k] !== 'KeyF') && new Set(Object.values(data.bindings)).size === 5) {
    bindings = { ...defaults, ...data.bindings };
  }
} catch { /* corrupt settings fall back to working controls */ }

let manual = false, uiMode = '', lastUI = 0, lastReceipt: Receipt | undefined;
let lastSoundReceipt = 0, lastHurt = 0, lastWaveMode = '';
let pointerHeld = false, touchMoving = false, stickPointer = -1;
const keys = new Set<string>();
let audio: AudioContext | undefined;
function saveSettings() {
  try { localStorage.setItem('percent-pulse-v2-settings', JSON.stringify({ volume, reduced: game.effectsReduced, bindings })); } catch { /* storage is optional */ }
}
function unlockAudio() {
  if (!audio) audio = new AudioContext();
  void audio.resume();
}
function tone(frequency: number, duration: number, strength = 1, end?: number) {
  if (!audio || !volume) return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(frequency, audio.currentTime);
  if (end) o.frequency.exponentialRampToValueAtTime(end, audio.currentTime + duration);
  g.gain.setValueAtTime(volume * .17 * strength, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + duration);
}
function keyName(code: string) { return code === 'Space' ? 'רווח' : code.replace('Key', ''); }
function clearInput() {
  keys.clear(); pointerHeld = false; touchMoving = false; stickPointer = -1; game.stop();
  ($('stick').querySelector('i') as HTMLElement).style.transform = '';
}
function begin(guided = true) {
  unlockAudio(); clearInput(); game.start(guided); lastSoundReceipt = 0; lastReceipt = undefined;
  canvas.focus(); updateUI(true);
}
function resume() { clearInput(); game.pause(); canvas.focus(); updateUI(true); }
function retry() { clearInput(); game.retry(); canvas.focus(); updateUI(true); }
function next() { clearInput(); game.next(); canvas.focus(); updateUI(true); }
function pulseAction() {
  unlockAudio();
  const didHit = game.pulse();
  if (didHit) tone(230, .22, 1.4, 65);
  updateUI(true);
}
function fmt(value: string | number) {
  if (typeof value === 'number') return value.toLocaleString('en-US', { maximumFractionDigits: 3 });
  const parts = value.split('/');
  return new Rational(parts[0], parts[1] || 1).toNumber().toLocaleString('en-US', { maximumFractionDigits: 3 });
}
function onPause() {
  clearInput(); game.pause(); updateUI(true);
}
function updateUI(force = false) {
  if (!force && performance.now() - lastUI < 70 && uiMode === game.mode) return;
  lastUI = performance.now();
  $('hud').hidden = game.mode === 'title';
  $('pause').hidden = game.mode === 'title' || game.mode === 'won' || game.mode === 'clear' || game.mode === 'failed';
  $('wave-label').innerHTML = game.mode === 'title' ? '' : '<span>גל</span> <bdi>' + (game.wave + 1) + ' / ' + WAVES.length + '</bdi>';
  $('shields').innerHTML = Array.from({ length: 5 }, (_, i) => '<i class="shield ' + (game.player.hp > i * 20 ? 'full' : '') + '"></i>').join('');
  $('shields').setAttribute('aria-label', 'מגן ' + Math.ceil(game.player.hp / 20) + ' מתוך 5');
  $('wave-progress').innerHTML = game.mode === 'playing' && game.phase !== 'move' ? '<bdi>' + game.waveKills + ' / ' + WAVES[game.wave].spawns.length + '</bdi><span>אויבים</span>' : '';
  const pulseTargets = game.pulseTargets();
  const available = game.mode === 'playing' && game.wave > 0;
  $('pulse').hidden = !available;
  ($('pulse') as HTMLButtonElement).disabled = !game.charges || game.pulseCooldown > 0 || !pulseTargets.length;
  $('pulse').classList.toggle('intro-pulse', game.phase === 'pulse-intro');
  $('pulse-key').textContent = keyName(bindings.pulse);
  $('pulse-state').textContent = !game.charges ? 'מתמלאת בגל הבא' : !pulseTargets.length ? 'התקרבו לאויבים' : game.pulseCooldown > 0 ? 'רגע…' : pulseTargets.length > 1 ? pulseTargets.length + ' אויבים בטווח' : 'מוכנה · גם מרחיקה';
  $('pulse').querySelectorAll('.charge-row i').forEach((dot, i) => dot.classList.toggle('full', i < game.charges));
  $('touch-controls').classList.toggle('active', game.mode === 'playing');
  let coach = '';
  if (game.mode === 'playing' && game.phase === 'move') coach = '<div class="key-cluster"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></div><div><strong>זוזו. הירי אוטומטי.</strong><span>חצים או לחיצה על הרצפה</span></div>';
  else if (game.mode === 'playing' && game.phase === 'pulse-intro') coach = '<kbd>' + keyName(bindings.pulse) + '</kbd><div><strong>לחצו כדי לשחרר פעימה</strong><span>רבע מהחיים, ודחיפה שנותנת מרווח</span></div>';
  else if (game.mode === 'playing' && game.wave === 0 && game.waveTime < 4) coach = '<div><strong>ככה זה עובד. רק ממשיכים לזוז.</strong></div>';
  $('coach').innerHTML = coach;
  $('coach').hidden = !coach;
  $('message').textContent = game.mode === 'playing' && game.messageTime > 0 ? game.lastMessage : '';
  const recent = game.receipts.slice(game.receiptStart).filter(r => r.kind === 'pulse' && game.time - r.time < 2.7);
  const newestPulse = recent.at(-1)?.time;
  const r = recent.filter(hit => hit.time === newestPulse).sort((a, b) => Number(fmt(b.before).replaceAll(',', '')) - Number(fmt(a.before).replaceAll(',', '')))[0];
  if (r !== lastReceipt) {
    lastReceipt = r;
    $('receipt').innerHTML = r ? '<bdi>25% × ' + fmt(r.before) + ' = <strong>' + fmt(r.raw) + '</strong></bdi><span><bdi>' + fmt(r.before) + ' → ' + fmt(r.after) + '</bdi></span>' : '';
  }
  $('receipt').hidden = !r || game.mode !== 'playing';
  if (r) {
    const e = game.enemies.find(e => e.id === r.target);
    if (e) { const p = scene.worldToScreen(e.x, e.z); $('receipt').style.left = Math.max(16, Math.min(innerWidth - 230, p.x + 45)) + 'px'; $('receipt').style.top = Math.max(95, Math.min(innerHeight - 170, p.y - 70)) + 'px'; }
  }
  document.body.classList.toggle('reduced', game.effectsReduced);
  if (uiMode !== game.mode) {
    uiMode = game.mode;
    const overlay = $('overlay'); overlay.className = game.mode === 'playing' ? 'hidden' : 'screen ' + game.mode;
    if (game.mode === 'title') {
      overlay.innerHTML = '<div class="start-sheet"><p class="eyebrow">פשוט נכנסים ומשחקים.</p><h1>זוזו. הרובה יעשה את השאר.</h1><p>התחמקו מהאויבים ושחררו פעימה כשצריך מרווח.</p><button id="start-btn" class="primary">מתחילים <span>←</span></button><div class="start-controls"><span><bdi>WASD</bdi> / חצים / לחיצה — תנועה</span><span><bdi>' + keyName(bindings.pulse) + '</bdi> — פעימה</span></div><button id="quick-start" class="text-button">כבר הבנתי — כניסה בלי הדרכה</button></div>';
      $('start-btn').onclick = () => begin(true); $('quick-start').onclick = () => begin(false);
    } else if (game.mode === 'paused') {
      overlay.innerHTML = '<div class="pause-sheet"><p class="eyebrow">עוצרים לרגע</p><h2>ממשיכים כשנוח.</h2><button id="resume" class="primary">חזרה למשחק</button><button id="retry" class="quiet-button">להתחיל את הגל הזה מחדש</button><p>הרובה יורה לבד. זזים עם החצים או לחיצה על הרצפה.<br>פעימה: <bdi>' + keyName(bindings.pulse) + '</bdi> או הכפתור הגדול.</p></div>';
      $('resume').onclick = resume; $('retry').onclick = retry;
    } else if (game.mode === 'clear') {
      overlay.innerHTML = '<div class="clear-sheet"><div class="crown">♛</div><h2>גל ' + (game.wave + 1) + ' הושלם</h2><p>כל האויבים חוסלו <span class="heal">' + (game.player.hp===100?'המגן מלא':'+ מגן') + '</span></p><button id="next" class="primary">ממשיכים <kbd>' + keyName(bindings.pulse) + '</kbd></button><small>הבא: ' + WAVES[game.wave + 1].name + '</small></div>';
      $('next').onclick = next; tone(523, .22, .8, 784);
    } else if (game.mode === 'failed') {
      overlay.innerHTML = '<div class="pause-sheet"><h2>עוד ניסיון קטן?</h2><p>חוזרים רק לתחילת גל ' + (game.wave + 1) + '.<br>כל המגן והפעימות יתמלאו.</p><button id="retry" class="primary">מנסים שוב <kbd>' + keyName(bindings.pulse) + '</kbd></button></div>';
      $('retry').onclick = retry;
    } else if (game.mode === 'won') {
      overlay.innerHTML = '<div class="clear-sheet victory"><div class="crown">♛</div><h2>כל שמונת הגלים שלכם.</h2><p><bdi>' + game.kills + '</bdi> אויבים חוסלו · <bdi>' + game.pulses + '</bdi> פעימות</p><button id="again" class="primary">עוד סיבוב?</button><button id="download-log" class="text-button">שמירת סיכום פעולות מקומי</button></div>';
      $('again').onclick = () => begin(false);
      $('download-log').onclick = () => { const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 2, events: game.events }, null, 2)], { type: 'application/json' })); a.href = url; a.download = 'percent-pulse-run.json'; a.click(); URL.revokeObjectURL(url); };
      tone(659, .35, .9, 988);
    }
  }
}
function render(dt: number) {
  const state: RenderState = {
    player: game.player, enemies: game.enemies.filter(e => e.hp.n > 0n).map(e => ({ ...e, hp: e.hp.toNumber() })),
    shots: game.shots, hazards: game.hazards, aim: game.aim, time: game.time, wave: game.wave, effectsReduced: game.effectsReduced,
    targetId: game.targetId, destination: game.destination, pulseRadius: game.pulseRadius, pulseWaves: game.pulseWaves,
    bursts: game.bursts, portals: game.pending.filter(s => s.at - game.waveTime <= 1.6 && game.phase === 'combat').map((s, i) => ({ id: i, x: s.x, z: s.z, remaining: Math.max(0, s.at - game.waveTime), family: s.family })),
    phase: game.phase, mode: game.mode,
  };
  scene.render(state, dt); updateUI();
}
function step(dt: number) {
  if (options.open) return;
  if (game.mode === 'playing' && !touchMoving) {
    game.move(Number(keys.has(bindings.right) || keys.has('ArrowRight')) - Number(keys.has(bindings.left) || keys.has('ArrowLeft')), Number(keys.has(bindings.down) || keys.has('ArrowDown')) - Number(keys.has(bindings.up) || keys.has('ArrowUp')));
  }
  game.tick(dt);
  if (game.receipts.length !== lastSoundReceipt) {
    const hit = game.receipts.at(-1); if (hit?.kind === 'bolt') tone(hit.after === '0' ? 790 : 460, .07, .45, hit.after === '0' ? 1100 : 370);
    lastSoundReceipt = game.receipts.length;
  }
  if (game.hurtCount !== lastHurt) { tone(110, .16, 1.1, 65); lastHurt = game.hurtCount; }
  if (lastWaveMode !== game.mode) { lastWaveMode = game.mode; updateUI(true); }
}
let previous = performance.now(), accumulator = 0;
function frame(now: number) {
  if (!manual) {
    accumulator += Math.min(.1, (now - previous) / 1000);
    while (accumulator >= 1 / 60) { step(1 / 60); accumulator -= 1 / 60; }
  }
  previous = now; render(1 / 60); requestAnimationFrame(frame);
}
function pointerDestination(e: PointerEvent) {
  const p = scene.pointerToWorld(e.clientX, e.clientY); game.setDestination(p.x, p.z);
}
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0 || game.mode !== 'playing') return;
  unlockAudio(); canvas.focus(); pointerHeld = true; pointerDestination(e);
});
canvas.addEventListener('pointermove', e => { if (pointerHeld) pointerDestination(e); });
window.addEventListener('pointerup', () => { pointerHeld = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
$('pulse').onpointerdown = e => { e.preventDefault(); pulseAction(); };
$('pause').onclick = onPause;
window.addEventListener('keydown', e => {
  if (options.open) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === bindings.pulse || e.code === 'Space') {
    if (game.mode === 'clear') next();
    else if (game.mode === 'failed') retry();
    else if (game.mode === 'won') begin(false);
    else if (game.mode === 'playing' && e.code === bindings.pulse) pulseAction();
  }
  if (e.code === 'Enter' && game.mode === 'title') begin(true);
  if (e.code === 'Escape') onPause();
  if (e.code === 'KeyF') {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  }
});
window.addEventListener('keyup', e => keys.delete(e.code));
function focusLost() { clearInput(); if (game.mode === 'playing') { game.pause(); updateUI(true); } }
window.addEventListener('blur', focusLost);
document.addEventListener('visibilitychange', () => { if (document.hidden) focusLost(); });
window.addEventListener('resize', () => scene.resize());
document.addEventListener('fullscreenchange', () => scene.resize());

function bindingList() {
  const names: Record<Binding, string> = { up: 'קדימה', down: 'אחורה', left: 'שמאלה', right: 'ימינה', pulse: 'פעימה' };
  $('bindings').innerHTML = Object.entries(bindings).map(([key, value]) => '<button data-binding="' + key + '"><span>' + names[key as Binding] + '</span><kbd>' + keyName(value) + '</kbd></button>').join('');
  $('bindings').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    button.textContent = 'לחצו על מקש…';
    const handler = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopImmediatePropagation();
      if (/^(Key[A-Z]|Space)$/.test(e.code) && e.code !== 'KeyF') {
        const key = (button as HTMLElement).dataset.binding as Binding;
        const conflict = (Object.keys(bindings) as Binding[]).find(k => bindings[k] === e.code);
        if (conflict) bindings[conflict] = bindings[key];
        bindings[key] = e.code; saveSettings();
      }
      window.removeEventListener('keydown', handler, true); bindingList(); updateUI(true);
    };
    window.addEventListener('keydown', handler, true);
  }));
}
$('settings').onclick = () => {
  clearInput(); if (game.mode === 'playing') game.pause();
  ($('volume') as HTMLInputElement).value = String(volume);
  ($('reduced') as HTMLInputElement).checked = game.effectsReduced;
  bindingList(); options.showModal(); updateUI(true);
};
$('close-options').onclick = () => options.close();
$('volume').oninput = e => { volume = Number((e.target as HTMLInputElement).value); saveSettings(); };
$('reduced').onchange = e => { game.effectsReduced = (e.target as HTMLInputElement).checked; saveSettings(); };
$('touch-mode').onchange = e => document.body.classList.toggle('force-touch', (e.target as HTMLInputElement).checked);
$('reset-bindings').onclick = () => { bindings = { ...defaults }; bindingList(); saveSettings(); };
$('skip-guide').onclick = () => { game.help(); game.skipGuidance(); options.close(); updateUI(true); };

const stick = $('stick');
stick.onpointerdown = e => {
  if (game.mode !== 'playing') return;
  game.stop(); touchMoving = true; stickPointer = e.pointerId; stick.setPointerCapture(e.pointerId); stickMove(e);
};
function stickMove(e: PointerEvent) {
  if (e.pointerId !== stickPointer) return;
  const r = stick.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width * .32), z = (e.clientY - r.top - r.height / 2) / (r.height * .32), l = Math.max(1, Math.hypot(x, z));
  game.move(x / l, z / l);
  (stick.querySelector('i') as HTMLElement).style.transform = 'translate(' + x / l * 28 + 'px,' + z / l * 28 + 'px)';
}
stick.onpointermove = stickMove;
function releaseStick() { touchMoving = false; stickPointer = -1; game.stop(); (stick.querySelector('i') as HTMLElement).style.transform = ''; }
stick.onpointerup = releaseStick; stick.onpointercancel = releaseStick;

Object.assign(window, {
  render_game_to_text: () => JSON.stringify({ ...game.text(), rendering: scene.stats(), assets: scene.assetsStatus(), screen: { player: scene.worldToScreen(game.player.x, game.player.z), enemies: game.enemies.filter(e => e.hp.n > 0n).map(e => ({ id: e.id, ...scene.worldToScreen(e.x, e.z) })) }, settings: { volume, reduced: game.effectsReduced, bindings }, localEvents: game.events.slice(-8) }),
  advanceTime: (ms: number) => { manual = true; const frames = Math.max(0, Math.round(Math.min(120000, ms) / (1000 / 60))); for (let i = 0; i < frames; i++) step(1 / 60); render(1 / 60); updateUI(true); },
});
scene.resize(); updateUI(true); requestAnimationFrame(frame);
