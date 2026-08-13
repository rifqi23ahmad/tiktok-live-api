/**
 * PK prediction engine — run polls where viewers guess the winner of a
 * TikTok LIVE "PK" battle, driven by the `battle` / `battleArmies` events.
 *
 * Wrap an existing {@link TikTokLive} client and the engine will:
 *
 *  1. open a prediction round when a PK starts (`battle` status STARTING/ACTIVE),
 *  2. collect viewer votes from chat commands (`!pilih 1` / `!tebak 2`, …),
 *  3. track live scores as `battleArmies` events stream in,
 *  4. resolve the round when the PK ends, award points to correct predictors,
 *     and keep a rolling predictor leaderboard across rounds.
 *
 * The same `handleBattle` / `handleBattleArmies` / `handleChat` methods are
 * exposed publicly, so a widget-builder server or overlay can drive the engine
 * from already-decoded events without owning the WebSocket itself.
 *
 * @example
 * ```typescript
 * import { TikTokLive, TikTokPKPredictions } from 'tiktok-live-api';
 *
 * const client = new TikTokLive('streamer', { apiKey: 'KEY' });
 * const pk = new TikTokPKPredictions(client);
 *
 * pk.on('pollOpen',  p => console.log('PK dimulai!', p.teams));
 * pk.on('pollClose', r => console.log('Pemenang:', r.winnerName, r.correctPredictors));
 * pk.on('leaderboard', b => console.log('Top prediktor:', b));
 *
 * await pk.connect();
 * ```
 *
 * @packageDocumentation
 */

import type { TikTokLive } from './client';
import type {
  BattleEvent,
  BattleArmiesEvent,
  ChatEvent,
  TikTokUser,
} from './types';

/** A single side (team) in an active PK battle. */
export interface PredictionTeam {
  /** 0 = left team, 1 = right team. */
  index: number;
  /** Display name (host nickname when known, else a fallback label). */
  name: string;
  /** TikTok user id of the host on this side. */
  hostUserId: string;
  /** Current team score (diamonds). */
  score: number;
}

/** Lifecycle phase of the current prediction round. */
export type PollPhase = 'open' | 'live' | 'closed';

/** Full snapshot of the current prediction round. */
export interface PollState {
  /** Identifier of the battle this poll is bound to. */
  roundId: string;
  phase: PollPhase;
  teams: PredictionTeam[];
  /** Votes cast for [left, right]. */
  votes: [number, number];
  /** Epoch ms when the poll opened. */
  startedAt: number;
  /** Epoch ms when the poll resolved (set on close). */
  endedAt?: number;
  /** Winning team index, or -1 for a draw (set on close). */
  winnerIndex?: number;
}

/** A single viewer vote cast during a round. */
export interface PredictionVote {
  userId: string;
  uniqueId: string;
  teamIndex: number;
}

/** Result emitted when a round resolves. */
export interface PollResult {
  roundId: string;
  teams: PredictionTeam[];
  votes: [number, number];
  /** -1 when the battle ended in a draw. */
  winnerIndex: number;
  winnerName: string | null;
  correctPredictors: { userId: string; uniqueId: string }[];
}

/** Rolling leaderboard entry — cumulative points across resolved rounds. */
export interface PredictionLeader {
  userId: string;
  uniqueId: string;
  points: number;
  correct: number;
  predictions: number;
}

/** Options for {@link TikTokPKPredictions}. */
export interface TikTokPKPredictionsOptions {
  /** Points awarded for a correct prediction (default 1). */
  pointsPerWin?: number;
  /** Chat command prefixes accepted as a vote (default `!pilih`, `!tebak`, `!vote`). */
  voteCommands?: string[];
  /** Auto-open a round when a PK starts (default true). */
  autoOpen?: boolean;
  /** Auto-close and resolve the round when the PK ends (default true). */
  autoClose?: boolean;
  /** Fallback team labels when a host nickname cannot be derived (default `['Tim Kiri', 'Tim Kanan']`). */
  teamLabels?: [string, string];
}

/** Map of event names to payload types for {@link TikTokPKPredictions}. */
export interface TikTokPKPredictionsEventMap {
  pollOpen: PollState;
  pollUpdate: PollState;
  pollClose: PollResult;
  vote: PredictionVote & { votes: [number, number] };
  leaderboard: PredictionLeader[];
  error: { error: string };
}

type EventHandler<T> = (data: T) => void | Promise<void>;

const DEFAULT_VOTE_COMMANDS = ['!pilih', '!tebak', '!vote', '!pk'];

// PK status codes shared with `battle` / `battleArmies` events.
const PK_STATUS = { ACTIVE: 1, STARTING: 2, ENDED: 3, PREPARING: 4 } as const;

/** Map a vote argument ("1"/"2", "kiri"/"kanan", "a"/"b") to a team index. */
function parseVoteArg(raw: string): number {
  const a = raw.trim().toLowerCase();
  if (a === '1') return 0;
  if (a === '2') return 1;
  if (['kiri', 'left', 'merah', 'a'].includes(a)) return 0;
  if (['kanan', 'right', 'biru', 'b'].includes(a)) return 1;
  return -1;
}

function pickString(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/** Try to find a human-readable name for one raw `battle` team payload. */
function deriveBattleTeamName(raw: Record<string, unknown>): string | null {
  const direct = pickString(raw, [
    'teamName',
    'name',
    'nickname',
    'hostName',
    'displayName',
  ]);
  if (direct) return direct;

  const host = raw.hostUser ?? raw.host ?? raw.anchor;
  const hostName = pickString(host, ['nickname', 'uniqueId', 'name']);
  if (hostName) return hostName;

  const users = raw.users ?? raw.contributors ?? raw.members;
  if (Array.isArray(users) && users.length > 0) {
    const first = users[0]?.user ?? users[0] ?? {};
    const userName = pickString(first, ['nickname', 'uniqueId', 'name']);
    if (userName) return userName;
  }
  return null;
}

/**
 * Collect viewer predictions for a TikTok LIVE PK battle and resolve a
 * winner when the battle ends.
 */
export class TikTokPKPredictions {
  /** The wrapped {@link TikTokLive} client. */
  readonly client: TikTokLive;
  private readonly _options: Required<TikTokPKPredictionsOptions>;
  private readonly _handlers = new Map<string, Set<EventHandler<any>>>();

  private _poll: PollState | null = null;
  private _voters = new Map<
    string,
    { userId: string; uniqueId: string; teamIndex: number }
  >();
  private _leaders = new Map<string, PredictionLeader>();

  /**
   * @param client - A {@link TikTokLive} client. Battle/chat events are wired
   *                 automatically; call {@link TikTokPKPredictions.connect} to
   *                 open the WebSocket, or drive the engine via the public
   *                 `handleBattle` / `handleBattleArmies` / `handleChat` methods.
   * @param options - Configuration options.
   */
  constructor(client: TikTokLive, options: TikTokPKPredictionsOptions = {}) {
    this.client = client;
    this._options = {
      pointsPerWin: options.pointsPerWin ?? 1,
      voteCommands: options.voteCommands ?? DEFAULT_VOTE_COMMANDS,
      autoOpen: options.autoOpen ?? true,
      autoClose: options.autoClose ?? true,
      teamLabels: options.teamLabels ?? ['Tim Kiri', 'Tim Kanan'],
    };

    client.on('battle', (e) => this.handleBattle(e));
    client.on('battleArmies', (e) => this.handleBattleArmies(e));
    client.on('chat', (e) => this.handleChat(e));
  }

  /** Open the underlying WebSocket connection. */
  async connect(): Promise<void> {
    await this.client.connect();
  }

  /** Snapshot of the current round, or `null` when no PK is active. */
  getPoll(): PollState | null {
    return this._poll ? { ...this._poll, teams: this._poll.teams.map((t) => ({ ...t })) } : null;
  }

  /** Cumulative predictor leaderboard, best first. */
  getLeaderboard(): PredictionLeader[] {
    return [...this._leaders.values()].sort(
      (a, b) => b.points - a.points || b.correct - a.correct,
    );
  }

  /** Register an event handler. */
  on<K extends keyof TikTokPKPredictionsEventMap>(
    event: K,
    handler: EventHandler<TikTokPKPredictionsEventMap[K]>,
  ): this;
  on(event: string, handler: EventHandler<any>): this;
  on(event: string, handler: EventHandler<any>): this {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event)!.add(handler);
    return this;
  }

  /** Remove an event handler. */
  off(event: string, handler: EventHandler<any>): this {
    this._handlers.get(event)?.delete(handler);
    return this;
  }

  /**
   * Handle a `battle` event (PK start / end).
   * Public so widget builders and overlays can drive the engine directly.
   */
  handleBattle(event: BattleEvent): void {
    const status = event.status;

    if (status === PK_STATUS.STARTING || status === PK_STATUS.ACTIVE) {
      if (!this._options.autoOpen) return;
      const battleId = event.battleId || 'pk';
      if (!this._poll) {
        this._openRound(battleId, this._teamsFromBattle(event));
        return;
      }
      if (this._poll.roundId === battleId) {
        // Live score update carried on the `battle` event itself.
        this._applyScores(event.scores ?? []);
        return;
      }
      // New battle while another is tracked — resolve the stale one defensively.
      this._resolveRound();
      this._openRound(battleId, this._teamsFromBattle(event));
      return;
    }

    if (status === PK_STATUS.ENDED) {
      if (!this._options.autoClose) return;
      if (this._poll && event.battleId && this._poll.roundId !== event.battleId) return;
      this._applyScores(event.scores ?? []);
      this._resolveRound();
    }
  }

  /**
   * Handle a `battleArmies` event (live per-host score updates).
   * Public so widget builders and overlays can drive the engine directly.
   */
  handleBattleArmies(event: BattleArmiesEvent): void {
    if (!this._poll) return;
    if (event.battleId && event.battleId !== this._poll.roundId) return;

    const hosts = event.hosts ?? [];
    if (hosts.length > 0) {
      for (const host of hosts) {
        if (host.teamIdx < 0 || host.teamIdx > 1) continue;
        const team = this._poll.teams[host.teamIdx];
        if (!team) continue;
        team.score = host.teamTotalScore ?? team.score;
        const mvp = host.contributors?.[0]?.nickname;
        if (mvp) team.name = mvp;
        if (host.hostUserId) team.hostUserId = host.hostUserId;
      }
    } else {
      // Fall back to the raw `teams` payload (score + host per side).
      const rawTeams = Array.isArray(event.teams) ? event.teams : [];
      rawTeams.forEach((raw, i) => {
        const team = this._poll?.teams[i];
        if (!team) return;
        const rec = raw as Record<string, unknown>;
        const score = rec?.score;
        if (typeof score === 'number') team.score = score;
        const name = deriveBattleTeamName(rec ?? {});
        if (name) team.name = name;
      });
    }

    this._emit('pollUpdate', this._snapshot());
  }

  /**
   * Handle a `chat` event and register a vote when the message matches a
   * configured vote command (e.g. `!pilih 1`).
   * Public so widget builders and overlays can drive the engine directly.
   */
  handleChat(event: ChatEvent): void {
    if (!this._poll || this._poll.phase === 'closed') return;
    const comment = (event.comment ?? '').trim();
    const lower = comment.toLowerCase();

    for (const cmd of this._options.voteCommands) {
      if (!lower.startsWith(cmd)) continue;
      const arg = comment.slice(cmd.length).trim();
      const teamIndex = parseVoteArg(arg);
      if (teamIndex >= 0) {
        this._registerVote(event.user, teamIndex);
      }
      return;
    }
  }

  // ── internals ──

  private _snapshot(): PollState {
    return {
      ...this._poll!,
      teams: this._poll!.teams.map((t) => ({ ...t })),
      votes: [...this._poll!.votes] as [number, number],
    };
  }

  private _teamsFromBattle(event: BattleEvent): PredictionTeam[] {
    const scores = Array.isArray(event.scores) ? event.scores : [];
    const rawTeams = Array.isArray(event.teams) ? event.teams : [];
    const teams: PredictionTeam[] = [];
    for (let i = 0; i < 2; i++) {
      const raw = (rawTeams[i] ?? {}) as Record<string, unknown>;
      teams.push({
        index: i,
        name: deriveBattleTeamName(raw) ?? this._options.teamLabels[i],
        hostUserId: String(raw.hostUserId ?? raw.hostId ?? ''),
        score: Number(scores[i] ?? raw.score ?? 0) || 0,
      });
    }
    return teams;
  }

  private _applyScores(scores: number[]): void {
    if (!this._poll || !Array.isArray(scores)) return;
    scores.forEach((score, i) => {
      if (this._poll && i < this._poll.teams.length && typeof score === 'number') {
        this._poll.teams[i].score = score;
      }
    });
    this._emit('pollUpdate', this._snapshot());
  }

  private _openRound(battleId: string, teams: PredictionTeam[]): void {
    this._voters.clear();
    this._poll = {
      roundId: battleId,
      phase: 'open',
      teams,
      votes: [0, 0],
      startedAt: Date.now(),
    };
    this._emit('pollOpen', this._snapshot());
  }

  private _registerVote(user: TikTokUser, teamIndex: number): void {
    if (!this._poll) return;
    const userId = user.userId || user.uniqueId || '';
    const uniqueId = user.uniqueId || userId;
    const key = userId || uniqueId;

    const prev = this._voters.get(key);
    if (prev) {
      if (prev.teamIndex === teamIndex) return; // duplicate vote — ignore
      this._poll.votes[prev.teamIndex] = Math.max(0, this._poll.votes[prev.teamIndex] - 1);
    }

    this._voters.set(key, { userId, uniqueId, teamIndex });
    this._poll.votes[teamIndex] += 1;
    if (this._poll.phase === 'open') this._poll.phase = 'live';

    this._emit('vote', {
      userId,
      uniqueId,
      teamIndex,
      votes: [...this._poll.votes] as [number, number],
    });
    this._emit('pollUpdate', this._snapshot());
  }

  private _resolveRound(): void {
    if (!this._poll) return;
    const poll = this._poll;
    poll.phase = 'closed';
    poll.endedAt = Date.now();

    const [left, right] = poll.teams;
    const winnerIndex =
      left.score > right.score ? 0 : right.score > left.score ? 1 : -1;
    poll.winnerIndex = winnerIndex;

    const correctPredictors: { userId: string; uniqueId: string }[] = [];
    for (const { userId, uniqueId, teamIndex } of this._voters.values()) {
      const leader = this._ensureLeader(userId, uniqueId);
      leader.predictions += 1;
      if (winnerIndex >= 0 && teamIndex === winnerIndex) {
        leader.correct += 1;
        leader.points += this._options.pointsPerWin;
        correctPredictors.push({ userId, uniqueId });
      }
    }

    const result: PollResult = {
      roundId: poll.roundId,
      teams: poll.teams.map((t) => ({ ...t })),
      votes: [...poll.votes] as [number, number],
      winnerIndex,
      winnerName: winnerIndex >= 0 ? poll.teams[winnerIndex].name : null,
      correctPredictors,
    };

    this._poll = null;
    this._voters.clear();

    this._emit('pollClose', result);
    this._emit('leaderboard', this.getLeaderboard());
  }

  private _ensureLeader(userId: string, uniqueId: string): PredictionLeader {
    const key = userId || uniqueId;
    const existing = this._leaders.get(key);
    if (existing) return existing;
    const leader: PredictionLeader = {
      userId,
      uniqueId,
      points: 0,
      correct: 0,
      predictions: 0,
    };
    this._leaders.set(key, leader);
    return leader;
  }

  private _emit(event: string, data: any): void {
    const handlers = this._handlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        const result = handler(data);
        if (result instanceof Promise) {
          result.catch((err) =>
            console.error(`Error in '${event}' handler:`, err),
          );
        }
      } catch (err) {
        console.error(`Error in '${event}' handler:`, err);
      }
    }
  }
}
