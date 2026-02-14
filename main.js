/* ============================================================
   CONFIG — Adjust these percentage-based positions to align
   sprites with the anchor dots in your backgrounds.
   ============================================================ */
const CONFIG = {
  hatAnchor:        { xPct: 72, yPct: 28 },
  catBedPos:        { xPct: 18, yPct: 62 },
  thoughtPos:       { xPct: 30, yPct: 38 },
  catStandAnchor:   { xPct: 54, yPct: 66 },
  doorZone:         { xPct: 88, yPct: 55, wPct: 18, hPct: 35 },
  scene2CatFishing: { xPct: 50, yPct: 70 },
  lakeRippleZone:   { xPct: 50, yPct: 72, wPct: 80, hPct: 35 }
};

/* Sprite widths as % of stage width (tweak to taste) */
const SIZES = {
  hat:        6,
  catBed:     15,
  think1:     3,
  think2:     5,
  think3:     14,
  fish:       6,
  catStand:   10,
  catHat:     10,
  catFishing: 18
};

/* ---- Helpers ---- */
const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

function pos(el, xPct, yPct) {
  el.style.left = xPct + '%';
  el.style.top  = yPct + '%';
}

function sizeW(el, wPct) {
  el.style.width  = wPct + '%';
  el.style.height = 'auto';
}

function place(id, anchor, w) {
  const el = $(id);
  pos(el, anchor.xPct, anchor.yPct);
  sizeW(el, w);
}

/* ---- State machine ---- */
let state     = 'BLINK';
let blinkTimer = null;
let debugOn    = false;

/* ============================================================
   INIT
   ============================================================ */
function init() {
  // Pre-load blink frame
  new Image().src = 'assets/Cat-close-eye.png';

  // --- Position scene-1 sprites ---
  place('hat',      CONFIG.hatAnchor,      SIZES.hat);
  place('cat-bed',  CONFIG.catBedPos,      SIZES.catBed);
  place('cat-stand', CONFIG.catStandAnchor, SIZES.catStand);
  place('cat-hat',  CONFIG.catStandAnchor,  SIZES.catHat);

  // Thought-bubble trail: small → medium → large from cat to thoughtPos
  var cx = CONFIG.catBedPos.xPct,  cy = CONFIG.catBedPos.yPct;
  var tx = CONFIG.thoughtPos.xPct, ty = CONFIG.thoughtPos.yPct;

  place('think1', { xPct: cx + (tx - cx) * 0.25, yPct: cy + (ty - cy) * 0.35 }, SIZES.think1);
  place('think2', { xPct: cx + (tx - cx) * 0.55, yPct: cy + (ty - cy) * 0.65 }, SIZES.think2);
  place('think3', { xPct: tx, yPct: ty }, SIZES.think3);
  place('fish',   { xPct: tx, yPct: ty }, SIZES.fish);

  // --- Position scene-2 sprites ---
  place('cat-fishing', CONFIG.scene2CatFishing, SIZES.catFishing);

  // Ripple zone
  var rp = $('ripple');
  rp.style.left   = (CONFIG.lakeRippleZone.xPct - CONFIG.lakeRippleZone.wPct / 2) + '%';
  rp.style.top    = (CONFIG.lakeRippleZone.yPct - CONFIG.lakeRippleZone.hPct / 2) + '%';
  rp.style.width  = CONFIG.lakeRippleZone.wPct + '%';
  rp.style.height = CONFIG.lakeRippleZone.hPct + '%';

  // --- Position debug markers ---
  pos($('dbg-hat'), CONFIG.hatAnchor.xPct,      CONFIG.hatAnchor.yPct);
  pos($('dbg-cat'), CONFIG.catStandAnchor.xPct,  CONFIG.catStandAnchor.yPct);

  var dz = $('dbg-door');
  dz.style.left   = (CONFIG.doorZone.xPct - CONFIG.doorZone.wPct / 2) + '%';
  dz.style.top    = (CONFIG.doorZone.yPct - CONFIG.doorZone.hPct / 2) + '%';
  dz.style.width  = CONFIG.doorZone.wPct + '%';
  dz.style.height = CONFIG.doorZone.hPct + '%';

  // --- Start scene 1 ---
  startBlink();
  $('cat-bed').classList.add('clickable');
  $('cat-bed').addEventListener('click', onCatClick);

  // Debug toggle (D key)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'd' || e.key === 'D') {
      debugOn = !debugOn;
      ['dbg-hat', 'dbg-cat', 'dbg-door'].forEach(function (id) {
        debugOn ? show($(id)) : hide($(id));
      });
    }
  });
}

/* ============================================================
   BLINK LOOP
   ============================================================ */
function startBlink() {
  state = 'BLINK';
  var open = true;
  blinkTimer = setInterval(function () {
    open = !open;
    $('cat-bed').src = open
      ? 'assets/Cat-open-eye.png'
      : 'assets/Cat-close-eye.png';
  }, 750);
}

function stopBlink() {
  clearInterval(blinkTimer);
  blinkTimer = null;
  $('cat-bed').src = 'assets/Cat-open-eye.png';
}

/* ============================================================
   CLICK: Cat on bed → thought bubbles
   ============================================================ */
function onCatClick() {
  if (state !== 'BLINK') return;
  stopBlink();
  state = 'THINKING';
  $('cat-bed').classList.remove('clickable');
  $('cat-bed').removeEventListener('click', onCatClick);

  setTimeout(function () { show($('think1')); }, 0);
  setTimeout(function () { show($('think2')); }, 350);
  setTimeout(function () {
    show($('think3'));
    setTimeout(showFish, 300);
  }, 700);
}

/* ============================================================
   FISH appears (pulsing) → click it
   ============================================================ */
function showFish() {
  state = 'FISH';
  show($('fish'));
  $('fish').classList.add('fish-pulse', 'clickable');
  $('fish').addEventListener('click', onFishClick);
}

function onFishClick() {
  if (state !== 'FISH') return;
  state = 'STAND';
  $('fish').removeEventListener('click', onFishClick);

  // Hide bed scene
  hide($('cat-bed'));
  hide($('think1'));
  hide($('think2'));
  hide($('think3'));
  hide($('fish'));

  // Show standing cat
  show($('cat-stand'));

  // Pulse the hat to draw attention
  $('hat').classList.add('pulse', 'clickable');
  $('hat').addEventListener('click', onHatClick);
}

/* ============================================================
   CLICK: Hat → fade out hat, swap to cat-with-hat (no flicker)
   ============================================================ */
function onHatClick() {
  if (state !== 'STAND') return;
  state = 'HAT_FADE';
  $('hat').removeEventListener('click', onHatClick);
  $('hat').classList.remove('pulse', 'clickable');

  // Fade out hat
  $('hat').classList.add('fade-out');

  // After fade completes, swap cat sprite once
  setTimeout(function () {
    hide($('hat'));
    hide($('cat-stand'));
    show($('cat-hat'));
    state = 'DRAG';
    setupDrag($('cat-hat'));
  }, 850);
}

/* ============================================================
   DRAG: cat-with-hat → doorZone
   ============================================================ */
function setupDrag(el) {
  el.classList.add('draggable');
  var dragging = false;
  var ox = 0, oy = 0;

  el.addEventListener('pointerdown', function (e) {
    dragging = true;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';
    var r = el.getBoundingClientRect();
    ox = e.clientX - (r.left + r.width / 2);
    oy = e.clientY - (r.top  + r.height / 2);
    e.preventDefault();
  });

  el.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var stage = $('stage');
    var xPct = ((e.clientX - ox) / stage.clientWidth)  * 100;
    var yPct = ((e.clientY - oy) / stage.clientHeight) * 100;
    el.style.left = xPct + '%';
    el.style.top  = yPct + '%';
  });

  el.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = 'grab';

    // Check if dropped inside doorZone
    var stage = $('stage');
    var xPct = ((e.clientX - ox) / stage.clientWidth)  * 100;
    var yPct = ((e.clientY - oy) / stage.clientHeight) * 100;

    var d = CONFIG.doorZone;
    var inDoor =
      xPct > d.xPct - d.wPct / 2 && xPct < d.xPct + d.wPct / 2 &&
      yPct > d.yPct - d.hPct / 2 && yPct < d.yPct + d.hPct / 2;

    if (inDoor) goScene2();
  });
}

/* ============================================================
   SCENE 2 TRANSITION
   ============================================================ */
function goScene2() {
  state = 'SCENE2';
  hide($('cat-hat'));

  // Brief flash of Background-2 (door opening)
  show($('bg2'));

  setTimeout(function () {
    hide($('bg1'));
    hide($('bg2'));
    show($('outside'));
    show($('cat-fishing'));
    show($('ripple'));
  }, 600);
}

/* ---- Boot ---- */
window.addEventListener('DOMContentLoaded', init);
