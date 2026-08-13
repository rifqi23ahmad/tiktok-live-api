/**
 * TikTokCaptions - Real-time AI speech-to-text for TikTok LIVE streams.
 *
 * Transcribe and translate any TikTok LIVE stream in real-time.
 * This feature is unique to TikTool Live - no other service offers it.
 *
 * @example
 * ```typescript
 * import { TikTokCaptions } from 'tiktok-live-api';
 *
 * const captions = new TikTokCaptions('streamer', {
 *   apiKey: 'YOUR_KEY',
 *   translate: 'en',
 *   diarization: true,
 * });
 *
 * captions.on('caption', (event) => {
 *   console.log(`[${event.speaker}] ${event.text}`);
 * });
 *
 * captions.connect();
 * ```
 *
 * @packageDocumentation
 */

import WebSocket from 'ws';
import type { TikTokCaptionsEventMap } from './types';

const CAPTIONS_BASE = 'wss://api.tik.tools/captions';
const VERSION = '1.0.0';

// Terminal server close codes: creator not live / stream ended. Wait on a long
// fixed backoff so the client picks the stream up once it starts.
const CODE_NOT_LIVE = 4404;
const CODE_STREAM_END = 4005;
const TERMINAL_BACKOFF_MS = 60_000;

/** Options for {@link TikTokCaptions} constructor. */
export interface TikTokCaptionsOptions {
  /** Your TikTool API key. Get one at https://tik.tools */
  apiKey?: string;
  /** Target language code for real-time translation (e.g. "en", "es"). */
  translate?: string;
  /** Enable speaker identification (default: true). */
  diarization?: boolean;
  /** Auto-disconnect after N minutes (default: 60, max: 300). */
  maxDurationMinutes?: number;
  /** Auto-reconnect on disconnect (default: true). */
  autoReconnect?: boolean;
  /** Max reconnection attempts (default: 5). */
  maxReconnectAttempts?: number;
}

type EventHandler<T> = (data: T) => void | Promise<void>;

/**
 * Real-time AI speech-to-text for TikTok LIVE streams.
 *
 * @example
 * ```typescript
 * const captions = new TikTokCaptions('streamer', {
 *   apiKey: 'KEY',
 *   translate: 'en',
 * });
 * captions.on('caption', (e) => console.log(e.text));
 * captions.on('translation', (e) => console.log(`→ ${e.text}`));
 * captions.connect();
 * ```
 */
export class TikTokCaptions {
  /** TikTok username (without @). */
  readonly uniqueId: string;
  /** Your TikTool API key. */
  readonly apiKey: string;
  /** Target translation language. */
  readonly translate?: string;
  /** Whether speaker diarization is enabled. */
  readonly diarization: boolean;
  /** Max session duration in minutes. */
  readonly maxDurationMinutes?: number;
  /** Whether to auto-reconnect on disconnect. */
  readonly autoReconnect: boolean;
  /** Maximum reconnection attempts. */
  readonly maxReconnectAttempts: number;

  private _handlers = new Map<string, Set<EventHandler<any>>>();
  private _ws: WebSocket | null = null;
  private _connected = false;
  private _intentionalClose = false;
  private _reconnectAttempts = 0;

  /**
   * Create a new TikTokCaptions client.
   *
   * @param uniqueId - TikTok username (without @)
   * @param options - Configuration options
   */
  constructor(uniqueId: string, options: TikTokCaptionsOptions = {}) {
    this.uniqueId = uniqueId.replace(/^@/, '');
    this.apiKey = options.apiKey || process.env.TIKTOOL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('apiKey is required. Get a free key at https://tik.tools');
    }
    this.translate = options.translate;
    this.diarization = options.diarization ?? true;
    this.maxDurationMinutes = options.maxDurationMinutes;
    this.autoReconnect = options.autoReconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
  }

  /** Whether currently connected and receiving captions. */
  get connected(): boolean {
    return this._connected;
  }

  /**
   * Register an event handler.
   *
   * @param event - Event name (caption, translation, credits, status, error)
   * @param handler - Callback function
   *
   * @example
   * ```typescript
   * captions.on('caption', (event) => {
   *   const prefix = event.speaker ? `[${event.speaker}] ` : '';
   *   console.log(`${prefix}${event.text}${event.isFinal ? ' ✓' : '...'}`);
   * });
   * ```
   */
  on<K extends keyof TikTokCaptionsEventMap>(
    event: K,
    handler: EventHandler<TikTokCaptionsEventMap[K]>,
  ): this;
  on(event: string, handler: EventHandler<any>): this;
  on(event: string, handler: EventHandler<any>): this {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event)!.add(handler);
    return this;
  }

  /** Remove an event handler. */
  off(event: string, handler: EventHandler<any>): this {
    this._handlers.get(event)?.delete(handler);
    return this;
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

  /**
   * Start receiving captions from the stream.
   *
   * @returns Promise that resolves when connected.
   */
  async connect(): Promise<void> {
    if (this._connected) return;
    this._intentionalClose = false;
    let params = `uniqueId=${this.uniqueId}&apiKey=${this.apiKey}`;
    if (this.translate) params += `&translate=${this.translate}`;
    if (this.diarization) params += '&diarization=true';
    if (this.maxDurationMinutes)
      params += `&max_duration_minutes=${this.maxDurationMinutes}`;

    const uri = `${CAPTIONS_BASE}?${params}`;

    return new Promise<void>((resolve, reject) => {
      this._ws = new WebSocket(uri, {
        headers: { 'User-Agent': `tiktok-live-api/${VERSION}` },
      });

      this._ws.on('open', () => {
        this._connected = true;
        this._reconnectAttempts = 0;
        this._emit('connected', { uniqueId: this.uniqueId });
        resolve();
      });

      this._ws.on('message', (raw: Buffer) => {
        try {
          const event = JSON.parse(raw.toString());
          const msgType: string = event.type || 'unknown';
          this._emit(msgType, event);
        } catch {
          // skip malformed
        }
      });

      this._ws.on('close', (code: number) => {
        this._connected = false;
        this._emit('disconnected', { uniqueId: this.uniqueId, code });
        this._maybeReconnect(code);
      });

      this._ws.on('error', (err: Error) => {
        this._emit('error', { error: err.message });
        if (!this._connected) reject(err);
      });
    });
  }

  /** Stop receiving captions. */
  disconnect(): void {
    this._intentionalClose = true;
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
  }

  private async _maybeReconnect(closeCode?: number): Promise<void> {
    if (
      this._intentionalClose ||
      !this.autoReconnect ||
      this._reconnectAttempts >= this.maxReconnectAttempts
    ) {
      return;
    }
    this._reconnectAttempts++;
    const terminal =
      closeCode === CODE_NOT_LIVE || closeCode === CODE_STREAM_END;
    const delay = terminal
      ? TERMINAL_BACKOFF_MS
      : Math.min(2 ** (this._reconnectAttempts - 1) * 1000, 30_000);
    this._emit('reconnect', {
      uniqueId: this.uniqueId,
      attempt: this._reconnectAttempts,
      delayMs: delay,
    });
    await new Promise((r) => setTimeout(r, delay));
    if (this._intentionalClose) return;
    try {
      await this.connect();
    } catch {
      // reconnect will retry
    }
  }
}
