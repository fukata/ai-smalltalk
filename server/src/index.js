/*
  ローカル専用トークンサーバ
  - /health
  - /session : gpt-realtime エフェメラルセッション作成
  - /personas, /personas/:id : ペルソナ配布
*/
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const express = require('express');
const cors = require('cors');

// dotenv 読み込み（存在しなくても可）
try { require('dotenv').config(); } catch (_) {}

const PORT = Number(process.env.PORT || 8787);
const REALTIME_MODEL = process.env.REALTIME_MODEL || 'gpt-realtime';
const VOICE_NAME = process.env.VOICE_NAME || 'alloy';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const app = express();
app.use(express.json());
// 開発用途のため全許可（Vite Dev Server のプロキシ経由想定）
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// ペルソナディレクトリ（デフォルトはリポジトリ直下の personas/）
const PERSONAS_DIR = process.env.PERSONAS_DIR || path.resolve(__dirname, '../../personas');

const DEFAULT_PERSONA = {
  id: 'friendly_ja',
  displayName: 'フレンドリー日本語',
  language: 'ja',
  system: 'あなたはフレンドリーで丁寧な会話相手です。短めの文で、相槌を入れながらリラックスした雑談を続けます。専門用語は避け、わかりやすい例を用いて説明してください。',
  style: { voice: 'alloy', speakingRate: 1.0, pitch: 0 },
  guidelines: { topics: ['日常','雑談','趣味'], avoid: ['過度な個人情報の質問','医療・法律の断定'] },
  fallbackLanguage: 'ja',
};

async function listPersonas() {
  const list = [];
  try {
    if (fs.existsSync(PERSONAS_DIR)) {
      const files = await fsp.readdir(PERSONAS_DIR);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const p = path.join(PERSONAS_DIR, file);
        try {
          const j = JSON.parse(await fsp.readFile(p, 'utf-8'));
          list.push({ id: j.id || path.basename(file, '.json'), displayName: j.displayName || j.id || file });
        } catch (_) {}
      }
    }
  } catch (_) {}
  // 何もなければデフォルトを返す
  if (list.length === 0) {
    list.push({ id: DEFAULT_PERSONA.id, displayName: DEFAULT_PERSONA.displayName });
  }
  return list;
}

async function readPersona(id) {
  // ファイル優先
  const file = path.join(PERSONAS_DIR, `${id}.json`);
  if (fs.existsSync(file)) {
    try { return JSON.parse(await fsp.readFile(file, 'utf-8')); } catch (_) {}
  }
  // フォールバック
  if (id === DEFAULT_PERSONA.id) return DEFAULT_PERSONA;
  throw Object.assign(new Error('persona_not_found'), { code: 'persona_not_found' });
}

// ペルソナ一覧
app.get('/personas', async (_req, res) => {
  try {
    const personas = await listPersonas();
    res.json({ personas });
  } catch (err) {
    // 失敗してもデフォルトを返す（ローカル最小動作を優先）
    res.json({ personas: [{ id: DEFAULT_PERSONA.id, displayName: DEFAULT_PERSONA.displayName }] });
  }
});

// ペルソナ詳細
app.get('/personas/:id', async (req, res) => {
  try {
    const persona = await readPersona(req.params.id);
    res.json(persona);
  } catch (err) {
    // どの失敗でもデフォルトを返す（ローカル最小動作を優先）
    res.json(DEFAULT_PERSONA);
  }
});

// エフェメラルセッションを作成
app.post('/session', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(400).json({ error: 'missing_OPENAI_API_KEY' });
    const { model, voice, instructions } = req.body || {};
    const body = {
      model: model || REALTIME_MODEL,
      voice: voice || VOICE_NAME,
    };
    if (instructions) body.instructions = instructions;

    // OpenAI Realtime セッション作成 (エフェメラル)
    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'openai_error', details: data });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'failed_to_create_session', details: String(err) });
  }
});

const server = app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] PERSONAS_DIR = ${PERSONAS_DIR}`);
});

process.on('SIGINT', () => {
  console.log('\n[server] shutting down...');
  server.close(() => process.exit(0));
});
