import { ChatStore, nowIso } from './store';
import type { ChatMessage, Persona } from './types';
import { connectRealtime, type RealtimeConnection } from './webrtc';

const statusEl = document.getElementById('status')!;
const personaSel = document.getElementById('persona') as HTMLSelectElement;
const connectBtn = document.getElementById('connect') as HTMLButtonElement;
const disconnectBtn = document.getElementById('disconnect') as HTMLButtonElement;
const pttBtn = document.getElementById('ptt') as HTMLButtonElement;
const clearBtn = document.getElementById('clear') as HTMLButtonElement;
const logEl = document.getElementById('log')!;
const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;

const store = new ChatStore();
let conn: RealtimeConnection | null = null;
let currentPersona: Persona | null = null;

function setStatus(text: string) { statusEl.textContent = text; }

function append(msg: ChatMessage) {
  store.push(msg);
  const div = document.createElement('div');
  div.className = 'msg';
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.role}`;
  const body = document.createElement('div');
  body.textContent = msg.content;
  div.appendChild(meta);
  div.appendChild(body);
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

function renderLogs() {
  logEl.innerHTML = '';
  store.all().forEach(append);
}

async function loadPersonas() {
  try {
    const resp = await fetch('/api/personas');
    const data = await resp.json();
    const personas = (data.personas as Persona[]) || [];
    personaSel.innerHTML = '';
    if (personas.length > 0) {
      for (const p of personas) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.displayName || p.id;
        personaSel.appendChild(opt);
      }
      const first = personas[0];
      if (first) {
        const pr = await fetch(`/api/personas/${first.id}`).then(r => r.json());
        currentPersona = pr;
      }
    } else {
      // フォールバック（サーバ側もfallbackするが念のため）
      const pr = await fetch(`/api/personas/friendly_ja`).then(r => r.json());
      currentPersona = pr;
      const opt = document.createElement('option');
      opt.value = pr.id;
      opt.textContent = pr.displayName || pr.id;
      personaSel.appendChild(opt);
    }
  } catch (e) {
    console.error(e);
  }
}

function bindUI() {
  connectBtn.onclick = async () => {
    if (conn) return;
    try {
      const instructions = currentPersona?.system;
      conn = await connectRealtime({
        instructions,
        onStatus: setStatus,
        onTrack: (stream) => { remoteAudio.srcObject = stream; },
        onData: (evt) => handleRealtimeEvent(evt),
      });
      setStatus('接続済み');
    } catch (e) {
      console.error(e);
      setStatus('接続失敗');
    }
  };

  disconnectBtn.onclick = () => {
    if (!conn) return;
    conn.close();
    conn = null;
    setStatus('未接続');
  };

  personaSel.onchange = async () => {
    try {
      const id = personaSel.value;
      const pr = await fetch(`/api/personas/${id}`).then(r => r.json());
      currentPersona = pr;
      if (conn) {
        conn.sendEvent({ type: 'session.update', session: { instructions: currentPersona?.system } });
      }
    } catch (e) {
      console.error(e);
      setStatus('ペルソナ取得失敗');
    }
  };

  const pttDown = () => {
    if (!conn?.micTrack) return;
    conn.micTrack.enabled = true;
    setStatus('録音中...');
  };
  const pttUp = () => {
    if (!conn?.micTrack) return;
    conn.micTrack.enabled = false;
    setStatus('待機中');
    // 入力音声の確定と応答生成を要求
    conn.sendEvent({ type: 'input_audio_buffer.commit' });
    conn.sendEvent({ type: 'response.create' });
  };
  pttBtn.addEventListener('mousedown', pttDown);
  pttBtn.addEventListener('touchstart', pttDown);
  window.addEventListener('mouseup', pttUp);
  window.addEventListener('touchend', pttUp);

  clearBtn.onclick = () => { store.clear(); renderLogs(); };
}

function handleRealtimeEvent(evt: any) {
  // 代表的なイベントだけ処理（必要に応じて拡張）
  if (evt?.type === 'response.output_text.delta') {
    // 累積テキストの更新: 簡易に最後のassistant行へ追加
    const last = store.all().slice(-1)[0];
    if (last && last.role === 'assistant') {
      last.content += evt.delta;
      // 再描画簡略化のため、一旦末尾に同文を追加表示
      append({ ...last, id: crypto.randomUUID(), timestamp: nowIso() });
    } else {
      append({ id: crypto.randomUUID(), role: 'assistant', content: evt.delta, timestamp: nowIso() });
    }
  }
  if (evt?.type === 'response.completed') {
    // 完了イベント（ステータス用）
    setStatus('応答完了');
  }
}

async function main() {
  renderLogs();
  await loadPersonas();
  bindUI();
  setStatus('未接続');
}

main();
