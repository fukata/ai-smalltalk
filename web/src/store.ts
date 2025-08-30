import type { ChatMessage } from './types';

const KEY = 'ai-smalltalk:logs';

export class ChatStore {
  private logs: ChatMessage[] = [];

  constructor() {
    this.logs = this.load();
  }

  all() { return this.logs; }

  push(msg: ChatMessage) {
    this.logs.push(msg);
    this.persist();
  }

  clear() {
    this.logs = [];
    this.persist();
  }

  private load(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private persist() {
    try { localStorage.setItem(KEY, JSON.stringify(this.logs)); } catch {}
  }
}

export function nowIso() { return new Date().toISOString(); }

