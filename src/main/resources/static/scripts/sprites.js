/**
 * sprites.js
 *
 * Self-contained sprite rendering context.
 * Renders from a sprite sheet at images/creature.png.
 *
 * Sheet layout:  1024 × 1024 px,  6 columns × 5 rows
 *   Row 0 — happy    (6 frames)
 *   Row 1 — sick     (6 frames)   also used for: hungry
 *   Row 2 — idle     (6 frames)   also used for: walk cycle (frames 0–1)
 *   Row 3 — rejoice  (6 frames)   used for: play burst
 *   Row 4 — dead     (6 frames)
 *
 * Public API  (unchanged from the ASCII version — app.js needs no edits):
 *   Sprites.init(canvasElement) → Promise
 *   Sprites.draw(key)
 *   Sprites.startWalk(mood)
 *   Sprites.stopWalk()
 *   Sprites.showStatic(key)
 *   Sprites.updatePosition()
 *   Sprites.walkX          (read / write)
 *   Sprites.walkY          (read / write) 
 *   Sprites.xDir           (read / write)
 *   Sprites.yDir           (read / write)
 *   Sprites.SCREEN_W
 *   Sprites.SCREEN_H
 *   Sprites.SPRITE_W
 *   Sprites.SPRITE_H
 *   Sprites.WALK_STEP
 *   Sprites.WALK_MS
 */

const Sprites = (() => {
  'use strict';

  // ── Sheet geometry ────────────────────────────────────────────────
  const SHEET_COLS  = 6;
  const SHEET_ROWS  = 5;
  const SHEET_W     = 1024;
  const SHEET_H     = 1024;
  const FRAME_W     = SHEET_W / SHEET_COLS;   // 170.6̄  px
  const FRAME_H     = SHEET_H / SHEET_ROWS;   // 204.8   px

  // Row indices
  const ROW = {
    happy:   0,
    sick:    1,
    idle:    2,
    rejoice: 3,
    dead:    4,
  };

  // ── Animation definitions ─────────────────────────────────────────
  // Each entry describes which row to use, which frames to cycle
  // through, and how many ms to spend on each frame.
  const ANIMATIONS = {
    // walking: idle row, frames 0–1 alternating
    walk:    { row: ROW.idle,    frames: [0, 1],             frameMs: 220  },
    // moods played during the walk loop (full-screen override)
    happy:   { row: ROW.happy,   frames: [0,1,2,3,4,5],      frameMs: 120  },
    sick:    { row: ROW.sick,    frames: [0,1,2,3,4,5],      frameMs: 160  },
    hungry:  { row: ROW.sick,    frames: [0,1,2,3,4,5],      frameMs: 160  },
    // static / triggered
    idle:    { row: ROW.idle,    frames: [0,1,2,3,4,5],      frameMs: 180  },
    rejoice: { row: ROW.rejoice, frames: [0,1,2,3,4,5],      frameMs: 100  },
    dead:    { row: ROW.dead,    frames: [0,1,2,3,4,5],      frameMs: 200  },
    empty:   { row: ROW.idle,    frames: [0],                 frameMs: 9999 },
  };

  // ── Walk / screen constants (consumed by app.js) ──────────────────
  const SCREEN_W  = 640;
  const SCREEN_H = 480;
  const SPRITE_W  = 96;
  const SPRITE_H = 96;
    // canvas display size (CSS px)
  const WALK_STEP = 2;
  const WALK_MS   = 55;

  // ── Internal state ────────────────────────────────────────────────
  let canvas      = null;
  let ctx         = null;
  let sheet       = null;   // HTMLImageElement

  let walkX = 100;
  let walkY = 96;
  let xDir = 1; // 1=right -1=left
  let yDir = 1; // 1=up -1=down

  // active animation
  let animKey     = 'empty';
  let animFrame   = 0;
  let frameTmr    = null;
  let walkTmr     = null;

  // ── Core renderer ─────────────────────────────────────────────────
  function renderFrame(animationKey, frameIndex) {
    const anim  = ANIMATIONS[animationKey] || ANIMATIONS.empty;
    const col   = anim.frames[frameIndex % anim.frames.length];
    const srcX  = col    * FRAME_W;
    const srcY  = anim.row * FRAME_H;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      sheet,
      srcX, srcY, FRAME_W, FRAME_H,   // source rect on sheet
      0, 0, canvas.width, canvas.height // destination (full canvas)
    );
  }

  // ── Single-frame draw (public) ────────────────────────────────────
  // key is a mood key (happy, sick, dead, empty, walkA …)
  function draw(key) {
    const anim = ANIMATIONS[key] || ANIMATIONS.empty;
    renderFrame(anim, 0);
  }

  // ── Canvas position ───────────────────────────────────────────────
  function updatePosition() {
    if (walkX > SCREEN_W - SPRITE_W - 20) xDir = -1;
    if (walkX < 20) xDir = 1;

    if (walkY < 96) yDir = 1;
    if (walkY > SCREEN_H - SPRITE_H - 20) yDir = -1;
    canvas.style.left = walkX + 'px';
    canvas.style.bottom = walkY + 'px';
    canvas.style.transform = xDir < 0 ? 'scaleX(-1)' : 'scaleX(1)';
  }

  // ── Stop all animation timers ─────────────────────────────────────
  function stopWalk() {
    clearInterval(walkTmr);
    clearInterval(frameTmr);
    walkTmr = frameTmr = null;
  }

  // ── Start walk + mood animation loop ─────────────────────────────
  // mood: any key understood by MOOD_TO_ANIM
  function startWalk(animKey) {
    stopWalk();

    animFrame = 0;
    const anim = ANIMATIONS[animKey];

    // frame cycling timer
    frameTmr = setInterval(() => {
      animFrame = (animFrame + 1) % anim.frames.length;
      renderFrame(animKey, animFrame);
    }, anim.frameMs);

    // position ticker
    walkTmr = setInterval(() => {
      const speed = (animKey === 'happy' || animKey === 'rejoice')
        ? WALK_STEP * 1.5
        : WALK_STEP;
      walkX += speed * xDir;
      walkY += speed * yDir;
      
      updatePosition();
    }, WALK_MS);

    // draw first frame immediately
    renderFrame(animKey, animFrame);
    updatePosition();
  }

  // ── showStatic: stop walk, draw first frame of mood ──────────────
  function showStatic(key) {
    stopWalk();
    animKey   = ANIMATIONS[key] || ANIMATIONS.empty;
    animFrame = 0;
    renderFrame(animKey, animFrame);
    updatePosition();
  }

  // ── init: load sheet, return Promise ─────────────────────────────
  function init(canvasElement) {
    canvas = canvasElement;
    ctx    = canvas.getContext('2d');

    return new Promise((resolve, reject) => {
      sheet        = new Image();
      sheet.onload  = resolve;
      sheet.onerror = () => reject(new Error('Failed to load images/creature.png'));
      sheet.src     = 'images/creature.png';
    });
  }

  // ── Public API ────────────────────────────────────────────────────
  return {
    init,
    draw,
    updatePosition,
    startWalk,
    stopWalk,
    showStatic,
    get walkX()    { return walkX;   },
    set walkX(v)   { walkX = v;      },
    get walkY()    { return walkY;   },
    set walkY(v)   { walkY = v;      },
    get xDir()      { return xDir;    },
    set xDir(v)     { xDir = v;       },
    get yDir()      { return yDir;    },
    set yDir(v)     { yDir = v;       },
    SCREEN_W,
    SPRITE_W,
    WALK_STEP,
    WALK_MS,
  };

})();
