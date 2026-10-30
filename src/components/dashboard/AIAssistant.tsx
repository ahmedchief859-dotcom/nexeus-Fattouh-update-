import { useState, FormEvent } from 'react';
import { Sparkles, X, Send, Lightbulb } from 'lucide-react';

interface Msg { role: 'user' | 'ai'; text: string; }

export default function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: "Hi Ahmed! I'm your NEXORA AI assistant. I can analyze sales, check inventory, or generate reports. How can I help?" },
  ]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'ai', text: getReply(userMsg) }]);
    }, 800);
  };

  const suggestions = ["Summarize today's sales", 'Low stock items?', 'Top customer this week'];

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-screen w-full max-w-md z-50 glass-strong border-l border-white/10 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nexora-accent to-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-nexora-deep" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-sm">NEXORA AI</h3>
              <p className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-nexora-accent text-nexora-deep rounded-br-sm'
                  : 'glass text-white/85 rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setInput(s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white/60 hover:text-white hover:border-nexora-accent/30 transition-all">
                <Lightbulb className="w-3 h-3 text-nexora-accent" />
                {s}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={send} className="px-5 pb-5 pt-2 border-t border-white/5 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask NEXORA AI..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-nexora-accent/40"
          />
          <button type="submit" className="p-3 rounded-xl bg-nexora-accent text-nexora-deep hover:bg-nexora-accent-2 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}

function getReply(q: string): string {
  const l = q.toLowerCase();
  if (l.includes('sales')) return "Today's sales total $96,000 — up 14.2% from yesterday. Saturday was your best day at $104k. Drinks and Food Items drove most revenue.";
  if (l.includes('stock') || l.includes('inventory')) return '3 items are below threshold: Organic Milk (low), Matcha Latte Mix (28 units), Aloe Vera Serum (76 units). Want me to draft restock orders?';
  if (l.includes('customer')) return 'Your top customer this week is Yasmin Adel with $2,190 in orders. New registrations are up 15.8% month-over-month.';
  return "I can help with sales analysis, inventory checks, customer insights, and report generation. Try asking about today's performance.";
}
