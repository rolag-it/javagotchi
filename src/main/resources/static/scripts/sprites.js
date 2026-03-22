/**
 * sprites.js
 *
 * Self-contained sprite rendering context.
 * Swap this file out when upgrading to PNG/SVG assets —
 * the rest of the application only calls the public API below.
 *
 * Public API:
 *   Sprites.init(canvasElement)
 *   Sprites.draw(key)              — draw a named frame
 *   Sprites.startWalk(mood)        — begin walk animation loop
 *   Sprites.stopWalk()             — halt animation timers
 *   Sprites.showStatic(key)        — stopWalk + draw
 *   Sprites.setPosition(x, dir)    — reposition canvas element
 *   Sprites.walkX                  — current X position (read/write)
 *   Sprites.walkDir                — current direction  (read/write)
 *   Sprites.SCREEN_W               — usable screen width constant
 *   Sprites.SPRITE_W               — sprite canvas width constant
 *   Sprites.WALK_STEP              — pixels moved per tick
 *   Sprites.WALK_MS                — ms between position ticks
 */

const Sprites = (() => {

  // ── Constants ────────────────────────────────────────────────────
  const PX = 6;    // 1 game-pixel = 6 CSS px  (8*6 = 48 inside 64px canvas)
  const CANVAS_SZ = 64;
  const OFFSET = 8;    // centre 48px art in 64px canvas

  const SCREEN_W = 640;
  const SCREEN_H = 480;
  const SPRITE_W = 64;
  const SPRITE_H = 64;
  const WALK_STEP = 2;
  const WALK_MS = 55;
  const FRAME_MS = 220;

  // ── Frame data ───────────────────────────────────────────────────
  // Each frame is 8 rows of 8 chars.
  // '#' = black   'g' = mid-gray   '.' = transparent
  const FRAME_DATA = {
    walkA: [
      '..###...',
      '.#####..',
      '.#o.o#..',
      '.#####..',
      '..###...',
      '.#####..',
      '.##.##..',
      '.#...#..'
    ],
    walkB: [
      '..###...',
      '.#####..',
      '.#o.o#..',
      '.#####..',
      '..###...',
      '.#####..',
      '..###...',
      '.#.#.#..'
    ],
    happy: [
      '.#.###.#',
      '..#####.',
      '..#^.^#.',
      '..#####.',
      '...###..',
      '..#####.',
      '..#.#.#.',
      '..#.#.#.'
    ],
    hungry: [
      '..###...',
      '.#####..',
      '.#O.O#..',
      '.##.##..',
      '..#.#...',
      '.#####..',
      '.##.##..',
      '.#...#..'
    ],
    sick: [
      '..###...',
      '.#####..',
      '.#X.X#..',
      '.#####..',
      '..###...',
      '.#####..',
      '.##.##..',
      '.#...#..'
    ],
    dead: [
      '........',
      '..###...',
      '.#####..',
      '.#X.X#..',
      '.##.##..',
      '..###...',
      '........',
      '........'
    ],
    empty: [
      '...#....',
      '..###...',
      '...#....',
      '..###...',
      '.#####..',
      '..###...',
      '...#....',
      '........'
    ]
  };

  // ── Internal state ───────────────────────────────────────────────
  let canvas = null;
  let ctx = null;
  let walkX = 100;
  let walkY = 96;
  let xDir = 1; // 1=right -1=left
  let yDir = 1; // 1=up -1=down
  let wFrame = 'walkA';
  let walkTmr = null;
  let frameTmr = null;

  // ── Rendering ────────────────────────────────────────────────────
  function draw(key) {
    const frame = FRAME_DATA[key] || FRAME_DATA.empty;
    ctx.clearRect(0, 0, CANVAS_SZ, CANVAS_SZ);
    for (let r = 0; r < 8; r++) {
      const row = frame[r] || '........';
      for (let c = 0; c < 8; c++) {
        const ch = row[c];
        if (ch === '#') ctx.fillStyle = '#0a0a0a';
        else if (ch === 'g') ctx.fillStyle = '#888888';
        else continue;
        ctx.fillRect(OFFSET + c * PX, OFFSET + r * PX, PX, PX);
      }
    }
  }

  function updatePosition() {
    if (walkX > SCREEN_W - SPRITE_W - 20) xDir = -1;
    if (walkX < 20) xDir = 1;

    if (walkY < 96) yDir = 1;
    if (walkY > SCREEN_H - SPRITE_H - 20) yDir = -1;
    canvas.style.left = walkX + 'px';
    canvas.style.bottom = walkY + 'px';
    canvas.style.transform = xDir < 0 ? 'scaleX(-1)' : 'scaleX(1)';
  }

  function burst() {
      walkX += WALK_STEP * 3 * xDir;
      updatePosition();
  }

  // ── Walk animation ───────────────────────────────────────────────
  function startWalk(mood) {
    stopWalk();
    wFrame = 'walkA';
    draw(mood === 'happy' ? 'happy' : 'walkA');

    frameTmr = setInterval(() => {
      wFrame = wFrame === 'walkA' ? 'walkB' : 'walkA';
      draw(mood === 'happy' ? 'happy' : wFrame);
    }, FRAME_MS);

    walkTmr = setInterval(() => {
      const speed = mood === 'happy' ? WALK_STEP * 1.5 : WALK_STEP;
      walkX += speed * xDir;
      walkY += speed * yDir;
      
      updatePosition();
    }, WALK_MS);
  }

  function stopWalk() {
    clearInterval(walkTmr);
    clearInterval(frameTmr);
    walkTmr = frameTmr = null;
  }

  function showStatic(key) {
    stopWalk();
    draw(key);
    updatePosition();
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
  }

  // ── Public API ───────────────────────────────────────────────────
  return {
    init,
    draw,
    updatePosition,
    startWalk,
    stopWalk,
    showStatic,
    burst,
    SCREEN_W,
    SPRITE_W,
    WALK_STEP,
    WALK_MS,
  };
})();
