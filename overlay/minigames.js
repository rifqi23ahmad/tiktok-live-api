/*
 * Mini-game engine for TikTok LIVE overlays.
 *
 * Client-side state machines driven by the SAME WebSocket events the overlay
 * already receives (gift / chat / like / member). No new backend, no extra
 * connection. Each game is a small deterministic state machine with an
 * explicit lifecycle: idle -> countdown -> running -> ended -> idle.
 *
 * Two games ship in fase 1:
 *   - Marble Race: every gift = a new marble (bola) for that viewer. Bigger
 *     gift = bigger & faster marble. Marbles race to the finish line.
 *   - Gift War / Duel: two camps (Merah vs Biru) compete on total gift
 *     diamonds over a fixed window. Viewers pick a side in chat.
 *
 * Usage (browser):
 *   const race = MiniGames.create('marble', { duration: 20000 });
 *   race.subscribe((e) => { if (e.type === 'state') console.log(e.state); });
 *   race.ingest({ type: 'gift', user: 'sultan_1', giftName: 'Rose', diamonds: 1 });
 *   function loop(ts) { race.tick(msSinceLastFrame); requestAnimationFrame(loop); }
 *
 * The engine owns the clock: call tick(dtMs) every animation frame and read
 * snapshot() to render. This keeps physics, countdown and duration on one
 * shared timeline in both demo and live mode.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MiniGames = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STATES = { IDLE: 'idle', COUNTDOWN: 'countdown', RUNNING: 'running', ENDED: 'ended' };

  // Legal state transitions — keeps the machine honest.
  var FLOW = {};
  FLOW[STATES.IDLE] = [STATES.COUNTDOWN];
  FLOW[STATES.COUNTDOWN] = [STATES.RUNNING, STATES.IDLE];
  FLOW[STATES.RUNNING] = [STATES.ENDED, STATES.IDLE];
  FLOW[STATES.ENDED] = [STATES.IDLE];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  var MARBLE_COLORS = [
    '#ff4d6d', '#4dd8ff', '#ffd166', '#7c6cff', '#4dff9d', '#ff9f1c',
    '#ff6df2', '#6dffef', '#ff6d3b', '#b3ff4d', '#e0b3ff', '#4da6ff'
  ];

  // --- base machine: event bus + guarded transitions + shared clock ---
  function createBase() {
    var listeners = [];
    var base = {
      state: STATES.IDLE,
      subscribe: function (fn) { listeners.push(fn); return function () {
        var i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1);
      }; },
      emit: function (evt) { for (var i = 0; i < listeners.length; i++) listeners[i](evt); },
      transition: function (next) {
        var allowed = FLOW[this.state] || [];
        if (allowed.indexOf(next) === -1) {
          // allow hard reset from anywhere
          if (next === STATES.IDLE && this.state !== STATES.IDLE) { /* fall through */ }
          else return false;
        }
        this.state = next;
        this.emit({ type: 'state', state: next });
        return true;
      },
      reset: function () { this.state = STATES.IDLE; this.emit({ type: 'state', state: STATES.IDLE }); }
    };
    return base;
  }

  function tierOf(diamonds) {
    if (diamonds >= 1000) return 4;
    if (diamonds >= 100) return 3;
    if (diamonds >= 10) return 2;
    return 1;
  }

  // ============================================================ MARBLE RACE
  function createMarbleRace(opts) {
    var o = opts || {};
    var cfg = {
      lanes: o.lanes || 6,
      mode: o.mode || 'timed',            // 'timed' | 'first'
      duration: o.duration || 20000,      // ms (timed mode)
      countdown: o.countdown || 3000,     // ms
      resultHold: o.resultHold || 6000,   // ms banner lingers before reset
      minPlayers: o.minPlayers || 1,
      autoStart: o.autoStart !== false,
      minSpeed: o.minSpeed || 0.005,      // track-fraction per second
      maxSpeed: o.maxSpeed || 0.05,
      speedFalloff: o.speedFalloff || 3000,
      jitter: o.jitter == null ? 0.0006 : o.jitter
    };

    var base = createBase();
    var marbles = [];        // { id, user, color, diamonds, pos, speed, finished, finishAt }
    var winner = null;
    var countdownMs = cfg.countdown;
    var elapsedMs = 0;
    var resultTimer = 0;
    var started = false;
    var idSeq = 0;

    function speedFor(diamonds) {
      var s = cfg.minSpeed + (cfg.maxSpeed - cfg.minSpeed) * (1 - Math.exp(-diamonds / cfg.speedFalloff));
      return clamp(s, cfg.minSpeed, cfg.maxSpeed);
    }

    function findMarble(user) {
      for (var i = 0; i < marbles.length; i++) if (marbles[i].user === user) return marbles[i];
      return null;
    }

    function standings() {
      var copy = marbles.slice().sort(function (a, b) {
        if (a.finished !== b.finished) return a.finished ? -1 : 1;
        if (a.finished && b.finished) return (a.finishAt || 0) - (b.finishAt || 0);
        return b.pos - a.pos;
      });
      return copy;
    }

    function resolveWinner() {
      var order = standings();
      if (order.length === 0) return null;
      if (order[0].finished || base.state === STATES.RUNNING) return order[0];
      // ended by timeout without a finisher -> leader by position
      return order[0];
    }

    function endRace() {
      winner = resolveWinner();
      base.transition(STATES.ENDED);
      base.emit({ type: 'end', winner: winner ? { user: winner.user, diamonds: winner.diamonds } : null });
      resultTimer = cfg.resultHold;
    }

    function onGift(user, giftName, diamonds) {
      var m = findMarble(user);
      if (m) {
        // viewer already has a bola -> gift boosts it
        m.diamonds += diamonds;
        m.speed = speedFor(m.diamonds);
        base.emit({ type: 'boost', user: user, diamonds: m.diamonds, giftName: giftName });
      } else if (marbles.length < cfg.lanes) {
        // gift = bola baru (next free lane)
        m = {
          id: ++idSeq,
          lane: marbles.length,
          user: user,
          color: MARBLE_COLORS[marbles.length % MARBLE_COLORS.length],
          diamonds: diamonds,
          pos: 0,
          speed: speedFor(diamonds),
          finished: false,
          finishAt: 0
        };
        marbles.push(m);
        base.emit({ type: 'spawn', user: user, diamonds: diamonds, color: m.color });
      }

      if (base.state === STATES.IDLE && cfg.autoStart && marbles.length >= cfg.minPlayers) {
        begin();
      }
    }

    function begin() {
      if (base.state !== STATES.IDLE) return;
      countdownMs = cfg.countdown;
      started = false;
      base.transition(STATES.COUNTDOWN);
      base.emit({ type: 'countdown', remainingMs: countdownMs });
    }

    function tick(dtMs) {
      dtMs = clamp(dtMs || 0, 0, 200); // clamp big dt (tab hidden)
      var dt = dtMs / 1000;

      if (base.state === STATES.COUNTDOWN) {
        countdownMs -= dtMs;
        if (countdownMs <= 0) {
          countdownMs = 0;
          started = true;
          elapsedMs = 0;
          base.transition(STATES.RUNNING);
          base.emit({ type: 'start' });
        }
        return;
      }

      if (base.state === STATES.RUNNING) {
        elapsedMs += dtMs;
        for (var i = 0; i < marbles.length; i++) {
          var m = marbles[i];
          if (m.finished) continue;
          m.pos += (m.speed + rand(-cfg.jitter, cfg.jitter)) * dt;
          if (m.pos >= 1) {
            m.pos = 1;
            m.finished = true;
            m.finishAt = elapsedMs;
            base.emit({ type: 'finish', user: m.user });
            if (cfg.mode === 'first') { endRace(); return; }
          }
        }
        if (cfg.mode === 'timed' && elapsedMs >= cfg.duration) endRace();
        return;
      }

      if (base.state === STATES.ENDED) {
        resultTimer -= dtMs;
        if (resultTimer <= 0) {
          marbles = [];
          winner = null;
          base.reset();
          base.emit({ type: 'reset' });
        }
      }
    }

    function snapshot() {
      return {
        state: base.state,
        game: 'marble',
        countdownMs: Math.max(0, countdownMs),
        elapsedMs: elapsedMs,
        remainingMs: base.state === STATES.RUNNING ? Math.max(0, cfg.duration - elapsedMs) : 0,
        durationMs: cfg.duration,
        marbles: marbles.slice(),
        standings: standings(),
        winner: winner ? { user: winner.user, diamonds: winner.diamonds, color: winner.color } : null
      };
    }

    return {
      kind: 'marble',
      getState: function () { return base.state; },
      ingest: function (e) { if (e.type === 'gift') onGift(e.user, e.giftName, e.diamonds); },
      start: begin,
      tick: tick,
      snapshot: snapshot,
      subscribe: base.subscribe,
      reset: function () { marbles = []; winner = null; base.reset(); }
    };
  }

  // ============================================================== GIFT WAR
  function createGiftWar(opts) {
    var o = opts || {};
    var cfg = {
      duration: o.duration || 60000,      // ms duel window
      countdown: o.countdown || 3000,
      resultHold: o.resultHold || 7000,
      autoStart: o.autoStart !== false,
      teams: o.teams || [
        { id: 'merah', name: 'Merah', color: '#ff4d6d', emoji: '🔴' },
        { id: 'biru',  name: 'Biru',  color: '#4dd8ff', emoji: '🔵' }
      ]
    };

    var base = createBase();
    var scores = {};      // teamId -> diamonds
    var roster = {};      // userId -> teamId
    var mvps = {};        // teamId -> { user, diamonds }
    var countdownMs = cfg.countdown;
    var elapsedMs = 0;
    var resultTimer = 0;
    var winner = null;

    cfg.teams.forEach(function (t) {
      scores[t.id] = 0;
      mvps[t.id] = null;
    });

    function teamById(id) {
      for (var i = 0; i < cfg.teams.length; i++) if (cfg.teams[i].id === id) return cfg.teams[i];
      return null;
    }

    function assignTeam(user) {
      // auto-balance: newcomer joins the currently losing side (or random if tied)
      var a = cfg.teams[0], b = cfg.teams[1];
      var pick;
      if (scores[a.id] === scores[b.id]) pick = Math.random() < 0.5 ? a : b;
      else pick = scores[a.id] < scores[b.id] ? a : b;
      roster[user] = pick.id;
      base.emit({ type: 'join', user: user, teamId: pick.id });
      return pick.id;
    }

    function onChat(user, comment) {
      var c = (comment || '').toLowerCase().trim();
      var m;
      if ((m = c.match(/!(merah|biru|kiri|kanan|red|blue)\b/))) {
        var id = ({ merah: 'merah', kiri: 'merah', red: 'merah', biru: 'biru', kanan: 'biru', blue: 'biru' })[m[1]];
        var team = teamById(id);
        if (team) {
          roster[user] = id;
          base.emit({ type: 'join', user: user, teamId: id });
        }
      }
    }

    function onGift(user, giftName, diamonds) {
      var teamId = roster[user] || assignTeam(user);
      scores[teamId] += diamonds;
      var mvp = mvps[teamId];
      if (!mvp || diamonds > mvp.diamonds) mvps[teamId] = { user: user, diamonds: diamonds };
      base.emit({ type: 'score', teamId: teamId, diamonds: diamonds, total: scores[teamId] });

      if (base.state === STATES.IDLE && cfg.autoStart) begin();
    }

    function begin() {
      if (base.state !== STATES.IDLE) return;
      countdownMs = cfg.countdown;
      base.transition(STATES.COUNTDOWN);
      base.emit({ type: 'countdown', remainingMs: countdownMs });
    }

    function resolveWinner() {
      var a = cfg.teams[0], b = cfg.teams[1];
      if (scores[a.id] === scores[b.id]) return null; // seri
      return scores[a.id] > scores[b.id] ? a : b;
    }

    function tick(dtMs) {
      dtMs = clamp(dtMs || 0, 0, 200);
      if (base.state === STATES.COUNTDOWN) {
        countdownMs -= dtMs;
        if (countdownMs <= 0) {
          countdownMs = 0;
          elapsedMs = 0;
          base.transition(STATES.RUNNING);
          base.emit({ type: 'start' });
        }
        return;
      }
      if (base.state === STATES.RUNNING) {
        elapsedMs += dtMs;
        if (elapsedMs >= cfg.duration) {
          winner = resolveWinner();
          base.transition(STATES.ENDED);
          base.emit({ type: 'end', winner: winner ? { id: winner.id, name: winner.name } : null });
          resultTimer = cfg.resultHold;
        }
        return;
      }
      if (base.state === STATES.ENDED) {
        resultTimer -= dtMs;
        if (resultTimer <= 0) {
          scores = {}; roster = {}; mvps = {}; winner = null;
          cfg.teams.forEach(function (t) { scores[t.id] = 0; mvps[t.id] = null; });
          base.reset();
          base.emit({ type: 'reset' });
        }
      }
    }

    function snapshot() {
      var teamSnaps = cfg.teams.map(function (t) {
        return { id: t.id, name: t.name, color: t.color, emoji: t.emoji, score: scores[t.id], mvp: mvps[t.id] };
      });
      return {
        state: base.state,
        game: 'war',
        countdownMs: Math.max(0, countdownMs),
        elapsedMs: elapsedMs,
        remainingMs: base.state === STATES.RUNNING ? Math.max(0, cfg.duration - elapsedMs) : 0,
        durationMs: cfg.duration,
        teams: teamSnaps,
        winner: winner ? { id: winner.id, name: winner.name } : null
      };
    }

    return {
      kind: 'war',
      getState: function () { return base.state; },
      ingest: function (e) {
        if (e.type === 'gift') onGift(e.user, e.giftName, e.diamonds);
        else if (e.type === 'chat') onChat(e.user, e.comment);
      },
      start: begin,
      tick: tick,
      snapshot: snapshot,
      subscribe: base.subscribe,
      reset: function () {
        scores = {}; roster = {}; mvps = {}; winner = null;
        cfg.teams.forEach(function (t) { scores[t.id] = 0; mvps[t.id] = null; });
        base.reset();
      }
    };
  }

  // ------------------------------------------------------------- dispatch
  function create(kind, opts) {
    if (kind === 'marble' || kind === 'marble-race') return createMarbleRace(opts);
    if (kind === 'war' || kind === 'gift-war' || kind === 'duel') return createGiftWar(opts);
    throw new Error('MiniGames: unknown game "' + kind + '"');
  }

  // Normalize a raw WebSocket message ({ event, data }) into an engine event.
  function normalizeRaw(msg) {
    if (!msg || !msg.event) return null;
    var d = msg.data || {};
    var user = (d.user && d.user.uniqueId) || d.uniqueId || '';
    switch (msg.event) {
      case 'gift': {
        // skip streakable gifts mid-streak (mirrors overlay.html)
        if (d.giftType === 1 && !d.repeatEnd) return null;
        var diamonds = (d.diamondCount || 0) * (d.repeatCount || 1);
        if (diamonds <= 0) return null;
        return { type: 'gift', user: user, giftName: d.giftName || 'Gift', diamonds: diamonds };
      }
      case 'chat': return { type: 'chat', user: user, comment: d.comment || '' };
      case 'like': return { type: 'like', user: user, likeCount: d.likeCount || 1, totalLikes: d.totalLikes };
      case 'member': return { type: 'member', user: user };
      default: return null;
    }
  }

  return {
    STATES: STATES,
    create: create,
    createMarbleRace: createMarbleRace,
    createGiftWar: createGiftWar,
    normalizeRaw: normalizeRaw,
    tierOf: tierOf,
    MARBLE_COLORS: MARBLE_COLORS
  };
});
