export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO
  personaId?: string;
};

export type Persona = {
  id: string;
  displayName: string;
  language?: string;
  system?: string;
  style?: Record<string, unknown>;
};

