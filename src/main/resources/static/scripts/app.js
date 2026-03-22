/**
 * app.js
 *
 * Javagotchi — main application module.
 * Depends on: sprites.js (must be loaded first via <script> in index.html)
 *
 * Responsibilities:
 *   - API communication  (GET / POST / PUT /javagotchi)
 *   - Game state machine (empty → alive → dead)
 *   - DOM updates        (HP bar, overlays, hints, footer, age timer)
 *   - Button wiring      (contextual per-state)
 *   - Polling loop       (30 s auto-refresh)
 */

(() => {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────
  const API_PATH = '/javagotchi';
  const HP_MAX   = 320;
  const POLL_MS  = 30_000;

  // ── DOM refs ───────────────────────────────────────────────────────
  const elHpFill   = document.getElementById('hpFill');
  const elHpVal    = document.getElementById('hpVal');
  const elStatName = document.getElementById('statName');
  const elStatAge  = document.getElementById('statAge');
  const elHint     = document.getElementById('actionHint');
  const elFooterL  = document.getElementById('footerLeft');
  const elFooterR  = document.getElementById('footerRight');
  const elIntro    = document.getElementById('introOverlay');
  const elDead     = document.getElementById('deadOverlay');
  const elDeadName = document.getElementById('deadName');
  const btnLeft    = document.getElementById('btnLeft');
  const btnCenter  = document.getElementById('btnCenter');
  const btnRight   = document.getElementById('btnRight');

  // ── Application state ──────────────────────────────────────────────
  let creature = null;   // last successful API response
  let localAge = 0;
  let ageTimer = null;
  let pollTimer = null;
  let hintTimer = null;

  // ── Age formatting ─────────────────────────────────────────────────
  function fmtAge(seconds) {
    if (seconds < 60)   return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm' + (seconds % 60) + 's';
    return Math.floor(seconds / 3600) + 'h' + Math.floor((seconds % 3600) / 60) + 'm';
  }

  function startAgeTimer(initialSeconds) {
    clearInterval(ageTimer);
    localAge = initialSeconds;
    elStatAge.textContent = 'AGE ' + fmtAge(localAge);
    ageTimer = setInterval(() => {
      localAge++;
      elStatAge.textContent = 'AGE ' + fmtAge(localAge);
    }, 1000);
  }

  // ── HP bar ─────────────────────────────────────────────────────────
  function renderHp(hp) {
    const pct = Math.min(100, Math.max(0, Math.round((hp / HP_MAX) * 100)));
    elHpFill.style.width  = pct + '%';
    elHpVal.textContent   = String(hp).padStart(3, ' ');
  }

  // ── Footer ─────────────────────────────────────────────────────────
  function setFooter(left, right) {
    elFooterL.textContent = left  ?? '';
    elFooterR.textContent = right ?? '';
  }

  // ── Action hint (on-screen message) ────────────────────────────────
  function showHint(msg, persist = false) {
    clearTimeout(hintTimer);
    elHint.textContent = msg;
    elHint.classList.remove('blink', 'show');
    void elHint.offsetWidth;                   // force reflow to restart animation
    elHint.classList.add('show', 'blink');
    if (!persist) {
      hintTimer = setTimeout(() => elHint.classList.remove('show'), 2500);
    }
  }

  function hideHint() {
    clearTimeout(hintTimer);
    elHint.classList.remove('show');
  }

  // ── Overlays ────────────────────────────────────────────────────────
  function showIntro() {
    elIntro.classList.add('show');
    elDead.classList.remove('show');
  }

  function showDeadScreen(name) {
    elIntro.classList.remove('show');
    elDead.classList.add('show');
    elDeadName.textContent = (name || 'CREATURE').toUpperCase() + ' IS GONE';
  }

  function hideOverlays() {
    elIntro.classList.remove('show');
    elDead.classList.remove('show');
  }

  // ── Mood → sprite key ───────────────────────────────────────────────
  function moodKey(data) {
    if (!data?.alive)      return 'dead';
    if (data.health <= 64) return 'sick';
    if (data.hungry)       return 'hungry';
    if (data.health >= 80) return 'happy';
    return 'walkA';
  }

  // ── State machine: button wiring ────────────────────────────────────
  // mode: 'empty' | 'alive' | 'dead'
  function setMode(mode) {
    if (mode === 'alive') {
      btnLeft.disabled   = false;
      btnCenter.disabled = false;
      btnRight.disabled  = false;
      btnLeft.onclick    = onPlay;
      btnCenter.onclick  = onFeed;
      btnRight.onclick   = onPlay;
    } else {
      btnLeft.disabled   = false;
      btnCenter.disabled = true;
      btnRight.disabled  = true;
      btnLeft.onclick    = onStart;
      btnCenter.onclick  = null;
      btnRight.onclick   = null;
    }
  }

  // ── Apply API response to UI ─────────────────────────────────────────
  function applyData(data) {
    creature = data;

    if (!data.alive) {
      clearInterval(ageTimer);
      clearInterval(pollTimer);
      Sprites.stopWalk();
      Sprites.showStatic('dead');
      renderHp(0);
      showDeadScreen(data.name);
      setMode('dead');
      setFooter('DECEASED');
      hideHint();
      return;
    }

    hideOverlays();
    renderHp(data.health);
    elStatName.textContent = (data.name || '--------').substring(0, 8).toUpperCase();
    startAgeTimer(data.age);
    setMode('alive');

    const mood = moodKey(data);

    if (mood === 'hungry' || mood === 'sick') {
      // keep walking but override the face with the warning sprite
      Sprites.startWalk('walkA');
      Sprites.draw(mood);
      showHint(mood === 'hungry' ? '>> HUNGRY! <<' : '>> SICK... <<', true);
      setFooter(mood === 'hungry' ? 'HUNGRY' : 'SICK');
    } else {
      Sprites.startWalk(mood);
      hideHint();
      setFooter(mood === 'happy' ? 'HAPPY' : 'OK');
    }
  }

  // ── API helper ──────────────────────────────────────────────────────
  async function api(method) {
    const resp = await fetch(API_PATH, {
      method,
      headers: { Accept: 'application/json' }
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw { status: resp.status, message: body.message || resp.statusText };
    }
    return resp.json();
  }

  // ── Visit (poll) ────────────────────────────────────────────────────
  async function doVisit() {
    try {
      applyData(await api('GET'));
    } catch (e) {
      if (e.status === 404) {
        showIntro();
        Sprites.showStatic('empty');
        setMode('empty');
        clearInterval(pollTimer);
        setFooter('NO CREATURE');
      } else if (e.status === 410) {
        showDeadScreen(creature?.name ?? '');
        Sprites.showStatic('dead');
        setMode('dead');
        clearInterval(pollTimer);
        Sprites.stopWalk();
        setFooter('DECEASED');
      } else {
        setFooter('ERR ' + e.status);
      }
    }
  }

  // ── Polling ─────────────────────────────────────────────────────────
  function startPoll() {
    clearInterval(pollTimer);
    pollTimer = setInterval(doVisit, POLL_MS);
  }

  // ── Button handlers ──────────────────────────────────────────────────

  // LEFT / RIGHT when alive → play burst
  function onPlay() {
    if (!creature?.alive) return;

    if (creature.hungry) {
      showHint('>> HUNGRY! <<');
      setFooter('HUNGRY');
      return;
    }
    if (creature.health <= 64) {
      showHint('>> TOO WEAK... <<');
      setFooter('WEAK');
      return;
    }

    showHint('>> YAY! <<');
    Sprites.stopWalk();

    let t = 0;
    const burst = setInterval(() => {
      t++;
      Sprites.burst();
      Sprites.draw(t % 2 === 0 ? 'happy' : 'walkB');
      if (t >= 22) {
        clearInterval(burst);
        Sprites.startWalk(moodKey(creature));
      }
    }, Sprites.WALK_MS);
  }

  // LEFT when empty / dead → create
  async function onStart() {
    setFooter('CREATING...');
    hideOverlays();
    Sprites.showStatic('empty');
    try {
      applyData(await api('POST'));
      showHint('>> WELCOME ' + (creature?.name ?? '').toUpperCase() + '! <<');
      startPoll();
    } catch (e) {
      if (e.status === 400) {
        // creature already exists — just visit
        await doVisit();
        startPoll();
      } else {
        showIntro();
        setMode('empty');
        setFooter('ERROR: ' + (e.message ?? ''));
      }
    }
  }

  // CENTER when alive → feed
  async function onFeed() {
    setFooter('FEEDING...');
    showHint('>> NOM NOM... <<');
    try {
      applyData(await api('PUT'));
      showHint('>> YUM YUM! <<');
    } catch (e) {
      if (e.status === 404) {
        showIntro();
        setMode('empty');
        Sprites.stopWalk();
        setFooter('NO CREATURE');
      } else if (e.status === 410) {
        showDeadScreen(creature?.name ?? '');
        setMode('dead');
        Sprites.stopWalk();
        setFooter('DECEASED');
      } else {
        showHint('>> NOPE! <<');
        setFooter('SATED');
      }
    }
  }

  // ── Boot ───────────────────────────────────────────────────────────
  async function boot() {
    Sprites.init(document.getElementById('spriteCanvas'));
    Sprites.showStatic('empty');
    Sprites.updatePosition();

    showIntro();
    setMode('empty');
    setFooter('CONNECTING...');

    try {
      applyData(await api('GET'));
      startPoll();
    } catch (e) {
      if (e.status === 410) {
        showDeadScreen('');
        Sprites.showStatic('dead');
        setMode('dead');
      } else {
        showIntro();
        Sprites.showStatic('empty');
        setMode('empty');
      }
      setFooter('READY');
    }
  }

  // Kick off once the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
