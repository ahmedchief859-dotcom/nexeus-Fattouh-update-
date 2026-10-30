// Web Speech API voice engine — Speech-to-Text + Text-to-Speech + command parsing

type Listener = (transcript: string, isFinal: boolean) => void;

export class VoiceEngine {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private listening = false;
  private onResult: Listener | null = null;
  private onEnd: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        this.recognition = new SR();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.onresult = (e: any) => {
          let interim = '';
          let final = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) final += t; else interim += t;
          }
          this.onResult?.(final || interim, !!final);
        };
        this.recognition.onend = () => {
          this.listening = false;
          this.onEnd?.();
        };
        this.recognition.onerror = () => { this.listening = false; this.onEnd?.(); };
      }
      if ('speechSynthesis' in window) this.synth = window.speechSynthesis;
    }
  }

  get isSupported() { return !!this.recognition; }
  get ttsSupported() { return !!this.synth; }
  get isListening() { return this.listening; }

  start(onResult: Listener, onEnd: () => void) {
    if (!this.recognition || this.listening) return;
    this.onResult = onResult;
    this.onEnd = onEnd;
    this.listening = true;
    try { this.recognition.start(); } catch { this.listening = false; onEnd(); }
  }

  stop() {
    if (this.recognition && this.listening) {
      try { this.recognition.stop(); } catch { /* noop */ }
    }
    this.listening = false;
  }

  speak(text: string, onEnd?: () => void) {
    if (!this.synth) { onEnd?.(); return; }
    this.synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05; u.pitch = 1.0; u.volume = 0.9;
    u.onend = () => onEnd?.();
    this.synth.speak(u);
  }

  stopSpeaking() {
    this.synth?.cancel();
  }
}

export const voiceEngine = new VoiceEngine();

// ---------- Command parsing ----------
export interface ParsedCommand {
  intent: string;
  args: Record<string, string>;
  raw: string;
}

const navAliases: Record<string, string> = {
  'home': 'home', 'store management': 'store', 'store': 'store', 'inventory': 'store',
  'sales': 'sales', 'customers': 'customers', 'accounting': 'accounting',
  'reports': 'reports', 'suppliers': 'suppliers', 'employees': 'employees',
  'branches': 'branches', 'settings': 'settings', 'subscription': 'subscription', 'billing': 'invoices',
  'invoices': 'invoices', 'invoice': 'invoices',
};

export function parseCommand(text: string): ParsedCommand {
  const raw = text.trim();
  const l = raw.toLowerCase();

  // Navigation: "open branch inventory", "go to sales", "show settings"
  if (/\b(open|go to|show|navigate to|take me to|view)\b/.test(l)) {
    for (const [phrase, id] of Object.entries(navAliases)) {
      if (l.includes(phrase)) return { intent: 'navigate', args: { target: id }, raw };
    }
  }

  // Add stock: "add 50 units of bottled water to downtown flagship"
  const addMatch = l.match(/add\s+(\d+)\s+(?:units?\s+of\s+)?(.+?)\s+to\s+(.+)/);
  if (addMatch) {
    return { intent: 'add_stock', args: { quantity: addMatch[1], product: addMatch[2].trim(), branch: addMatch[3].trim() }, raw };
  }

  // Highest selling
  if (/highest selling|top selling|best selling|most sold/.test(l)) {
    return { intent: 'top_products', args: {}, raw };
  }

  // Revenue / sales total
  if (/total (revenue|sales)|how much.*sales|revenue today/.test(l)) {
    return { intent: 'revenue', args: {}, raw };
  }

  // Low stock
  if (/low stock|out of stock|reorder|stock alert/.test(l)) {
    return { intent: 'low_stock', args: {}, raw };
  }

  // Create invoice
  if (/create.*invoice|new invoice|generate.*invoice|make.*invoice/.test(l)) {
    return { intent: 'create_invoice', args: {}, raw };
  }

  // Business health
  if (/business health|health|how.*doing|performance/.test(l)) {
    return { intent: 'health', args: {}, raw };
  }

  // Branch list
  if (/list branch|branches|how many branches/.test(l)) {
    return { intent: 'list_branches', args: {}, raw };
  }

  return { intent: 'unknown', args: {}, raw };
}
