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
let currentAssistantDiv: HTMLDivElement | null = null;
let currentAssistantText = '';
let currentUserDiv: HTMLDivElement | null = null;
let currentUserText = '';
let currentUserInterimText = '';
let speechRec: any | null = null;
let speechRecActive = false;

function setStatus(text: string) { statusEl.textContent = text; }

function createMsgDiv(role: 'user' | 'assistant' | 'system', content: string, ts = nowIso()): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'msg';
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `[${new Date(ts).toLocaleTimeString()}] ${role}`;
  const body = document.createElement('div');
  body.textContent = content;
  div.appendChild(meta);
  div.appendChild(body);
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  return div;
}

function appendAndPersist(msg: ChatMessage) {
  store.push(msg);
  createMsgDiv(msg.role, msg.content, msg.timestamp);
}

function renderLogs() {
  logEl.innerHTML = '';
  store.all().forEach(appendAndPersist);
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
    // UI: ユーザの一時メッセージ枠
    currentUserText = '';
    currentUserDiv = createMsgDiv('user', '（話しています…）');
    // Web Speech API（あれば）でクライアント側STT
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      try {
        speechRec = new SR();
        speechRec.lang = (currentPersona?.language || 'ja').startsWith('ja') ? 'ja-JP' : currentPersona?.language || 'en-US';
        speechRec.continuous = true;
        speechRec.interimResults = true;
        speechRec.onresult = (ev: any) => {
          let finalText = '';
          let interimText = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const res = ev.results[i];
            if (res.isFinal) finalText += res[0].transcript;
            else interimText += res[0].transcript;
          }
          if (finalText) currentUserText += finalText;
          currentUserInterimText = interimText;
          const body = currentUserDiv?.children[1] as HTMLDivElement | undefined;
          if (body) body.textContent = (currentUserText + (currentUserInterimText ? ` ${currentUserInterimText}` : '')).trim() || '（話しています…）';
        };
        speechRec.onerror = () => { /* 無視してフォールバック */ };
        speechRec.onend = () => { speechRecActive = false; };
        speechRec.start();
        speechRecActive = true;
      } catch { /* ignore */ }
    }
  };
  const pttUp = () => {
    if (!conn?.micTrack) return;
    conn.micTrack.enabled = false;
    setStatus('待機中');
    // 入力音声の確定と応答生成を要求
    conn.sendEvent({ type: 'input_audio_buffer.commit' });
    conn.sendEvent({ type: 'response.create', response: { modalities: ['text','audio'] } });

    // 音声認識を止めてユーザメッセージを確定
    try { if (speechRec && speechRecActive) speechRec.stop(); } catch {}
    const text = (currentUserText || currentUserInterimText || '（音声）').trim();
    if (currentUserDiv) {
      const body = currentUserDiv.children[1] as HTMLDivElement;
      body.textContent = text;
    }
    // 永続化
    const msg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: nowIso() };
    store.push(msg);
    currentUserDiv = null;
    currentUserText = '';
    currentUserInterimText = '';
  };
  pttBtn.addEventListener('mousedown', pttDown);
  pttBtn.addEventListener('touchstart', pttDown);
  window.addEventListener('mouseup', pttUp);
  window.addEventListener('touchend', pttUp);

  clearBtn.onclick = () => { store.clear(); renderLogs(); };
}

function handleRealtimeEvent(evt: any) {
  // 代表的なイベントだけ処理（必要に応じて拡張）
  if (!evt) return;
  const t: string = String(evt.type || '');
  switch (t) {
    case 'response.created': {
      // 新しい応答の先頭（表示用に枠だけつくる）
      if (!currentAssistantDiv) {
        currentAssistantText = '';
        currentAssistantDiv = createMsgDiv('assistant', '');
      }
      break;
    }
    case 'response.output_text.delta':
    case 'response.audio_transcript.delta':
    case 'response.output_audio.transcript.delta': {
      const delta: string = evt.delta || evt.text || '';
      if (!currentAssistantDiv) currentAssistantDiv = createMsgDiv('assistant', '');
      currentAssistantText += delta;
      const body = currentAssistantDiv.children[1] as HTMLDivElement;
      body.textContent = currentAssistantText;
      break;
    }
    case 'response.output_text.done':
    case 'response.audio_transcript.done':
    case 'response.output_audio.transcript.done':
    case 'response.completed': {
      // 応答確定 → 永続化
      if (currentAssistantDiv) {
        const text = currentAssistantText.trim();
        const content = text || '（音声応答）';
        const msg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content, timestamp: nowIso() };
        store.push(msg);
      }
      setStatus('応答完了');
      currentAssistantDiv = null;
      currentAssistantText = '';
      break;
    }
    default: {
      // フォールバック: 任意の *.delta に文字列 delta があれば拾う
      if (t.endsWith('.delta') && typeof evt.delta === 'string') {
        if (!currentAssistantDiv) currentAssistantDiv = createMsgDiv('assistant', '');
        currentAssistantText += evt.delta as string;
        (currentAssistantDiv.children[1] as HTMLDivElement).textContent = currentAssistantText;
      }
      if (t.endsWith('.done')) {
        if (currentAssistantDiv) {
          const text = currentAssistantText.trim();
          const msg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: text || '（音声応答）', timestamp: nowIso() };
          store.push(msg);
          currentAssistantDiv = null;
          currentAssistantText = '';
        }
      }
      break;
    }
    // 将来: サーバ側STT（ユーザ音声）の取り扱い
    case 'input_audio_buffer.transcript.delta': {
      const delta: string = evt.delta || '';
      if (!currentUserDiv) currentUserDiv = createMsgDiv('user', '');
      currentUserText += delta;
      (currentUserDiv.children[1] as HTMLDivElement).textContent = currentUserText;
      break;
    }
    case 'input_audio_buffer.transcript.done': {
      // 確定
      if (currentUserDiv) {
        const text = (currentUserText || '（音声）').trim();
        (currentUserDiv.children[1] as HTMLDivElement).textContent = text;
        const msg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: nowIso() };
        store.push(msg);
      }
      currentUserDiv = null;
      currentUserText = '';
      break;
    }
  }
}

async function main() {
  renderLogs();
  await loadPersonas();
  bindUI();
  setStatus('未接続');
}

main();
