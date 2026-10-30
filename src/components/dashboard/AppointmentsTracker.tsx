import { useState } from 'react';
import { CheckSquare, Square, CalendarClock, Plus } from 'lucide-react';
import { appointments as initial, type Appointment } from '@/data/mockData';

const priorityColor = { high: '#f87171', medium: '#fbbf24', low: '#7ee8e8' };

export default function AppointmentsTracker() {
  const [items, setItems] = useState<Appointment[]>(initial);

  const toggle = (id: string) => setItems((its) => its.map((a) => a.id === id ? { ...a, done: !a.done } : a));
  const doneCount = items.filter((a) => a.done).length;

  return (
    <div className="glass glass-hover rounded-2xl p-5 lg:p-6 animate-slide-up delay-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-4 h-4 text-nexora-accent" />
            <h3 className="font-display font-semibold text-white text-base">Today's Schedule</h3>
          </div>
          <p className="text-xs text-white/40">{doneCount}/{items.length} completed</p>
        </div>
        <button className="p-1.5 rounded-lg bg-nexora-accent/10 text-nexora-accent hover:bg-nexora-accent/20 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-4">
        <div className="h-full rounded-full bg-gradient-to-r from-nexora-accent to-nexora-accent-2 transition-all duration-500" style={{ width: `${(doneCount / items.length) * 100}%` }} />
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {items.map((a) => (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left group border border-transparent hover:border-white/5"
          >
            {a.done ? (
              <CheckSquare className="w-5 h-5 text-nexora-accent shrink-0" />
            ) : (
              <Square className="w-5 h-5 text-white/30 group-hover:text-white/50 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm transition-all ${a.done ? 'text-white/40 line-through' : 'text-white/85'}`}>{a.title}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{a.time}</p>
            </div>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: priorityColor[a.priority], boxShadow: `0 0 6px ${priorityColor[a.priority]}66` }} />
          </button>
        ))}
      </div>
    </div>
  );
}
