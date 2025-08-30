// WebRTC 接続制御（最小実装）

export type RealtimeSession = {
  client_secret: { value: string; expires_at: string };
  model: string;
  voice?: string;
};

export type RealtimeConnection = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  micTrack: MediaStreamTrack | null;
  close: () => void;
  sendEvent: (evt: unknown) => void;
};

async function fetchSession(payload: { model?: string; voice?: string; instructions?: string }): Promise<RealtimeSession> {
  const resp = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('session_failed');
  return await resp.json();
}

export async function connectRealtime(options: {
  instructions?: string;
  onData?: (json: any) => void;
  onTrack?: (stream: MediaStream) => void;
  onStatus?: (msg: string) => void;
  onError?: (err: any) => void;
  onDisconnect?: (reason: string) => void;
}): Promise<RealtimeConnection> {
  const { instructions, onData, onTrack, onStatus, onError, onDisconnect } = options;
  try {
    onStatus?.('セッション取得中...');
    const session = await fetchSession({ instructions });

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
    const dc = pc.createDataChannel('oai-events');

    dc.onopen = () => {
      onStatus?.('データチャネル接続済み');
      // PTT前提: サーバ側の自動VADを無効化し、テキスト出力も有効化
      try {
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            turn_detection: { type: 'none' },
            instructions,
            modalities: ['text', 'audio'],
          },
        }));
      } catch {}
    };
    dc.onmessage = (ev) => {
      try { onData?.(JSON.parse(ev.data)); } catch { /* noop */ }
    };
    dc.onclose = () => { onDisconnect?.('datachannel_closed'); };
    dc.onerror = () => { onDisconnect?.('datachannel_error'); };

    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (stream) onTrack?.(stream);
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === 'failed' || st === 'disconnected' || st === 'closed') onDisconnect?.(`pc_${st}`);
    };

    // マイクを取得してトラックとして追加
    onStatus?.('マイク取得中...');
    const media = await navigator.mediaDevices.getUserMedia({ audio: true });
    const [micTrack] = media.getAudioTracks();
    const ms = new MediaStream([micTrack]);
    pc.addTrack(micTrack, ms);
    // 初期は無効化（PTT時に有効化）
    micTrack.enabled = false;

    onStatus?.('SDP作成中...');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = 'https://api.openai.com/v1/realtime';
    const url = `${baseUrl}?model=${encodeURIComponent(session.model)}`;
    const answerResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.client_secret.value}`,
        'Content-Type': 'application/sdp',
        'Accept': 'application/sdp',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: offer.sdp,
    });
    if (!answerResp.ok) {
      throw new Error(`handshake_failed:${answerResp.status}`);
    }
    const answerSdp = await answerResp.text();
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    onStatus?.('接続完了');

    return {
      pc,
      dc,
      micTrack,
      close: () => { try { dc.close(); } catch {} try { pc.close(); } catch {} try { micTrack.stop(); } catch {} },
      sendEvent: (evt: unknown) => { if (dc.readyState === 'open') dc.send(JSON.stringify(evt)); },
    };
  } catch (e) {
    onError?.(e);
    throw e;
  }
}
