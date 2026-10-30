'use client'

import { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { Loader2, Mic, MicOff, Radio, Send, Sparkles, Volume2, VolumeX, X } from 'lucide-react'
import { firebaseAuth, firestore } from '@/lib/firebase'
import { parseCommand, type ParsedCommand, voiceEngine } from '@/lib/voiceEngine'

export interface VoiceContext {
  navigate: (target: string) => void
  toast: (msg: string, ok?: boolean) => void
}

type Message = { id: string; role: 'user' | 'ai'; text: string; pending?: boolean }
let messageSequence = 0

function cleanMessage(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/<[^>]*>/g, '').trim().slice(0, 2000)
}

async function loadChat(userId: string): Promise<Message[]> {
  if (!firestore) return []
  const result = await getDocs(query(collection(firestore, 'users', userId, 'chats', 'default', 'messages'), orderBy('created_at', 'asc'), limit(100)))
  return result.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Message, 'id'>) }))
}

async function saveMessage(userId: string, message: Omit<Message, 'id'>) {
  if (!firestore) return
  await addDoc(collection(firestore, 'users', userId, 'chats', 'default', 'messages'), { ...message, created_at: new Date().toISOString() })
}

function MarkdownMessage({ text }: { text: string }) {
  return <ReactMarkdown components={{
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
    code: ({ className, children }) => <code className={`${className ?? ''} rounded bg-black/25 px-1.5 py-0.5 text-[0.85em]`}>{children}</code>,
  }}>{text}</ReactMarkdown>
}

function VoiceCopilotContent({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: VoiceContext }) {
  const [messages, setMessages] = useState<Message[]>([{ id: `welcome-${++messageSequence}`, role: 'ai', text: 'Hi Ahmed. I can navigate your workspace, inspect live sales, check stock, and update inventory. Try **Open store management** or **Add 50 units of bottled water to Downtown Flagship**.' }])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [ttsOn, setTtsOn] = useState(true)
  const [offlineQueue, setOfflineQueue] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const user = firebaseAuth?.currentUser
    if (!user) return
    loadChat(user.uid).then((history) => { if (history.length) setMessages(history) }).catch(() => undefined)
  }, [])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, thinking])

  useEffect(() => {
    const flush = () => {
      if (!navigator.onLine || !offlineQueue.length) return
      const next = [...offlineQueue]
      setOfflineQueue([])
      next.forEach((message) => void handleInput(message))
    }
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [offlineQueue])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const resize = () => { const dpr = window.devicePixelRatio || 1; canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr }
    const draw = () => {
      const width = canvas.width; const height = canvas.height; const time = Date.now() / 1000
      context.clearRect(0, 0, width, height)
      const bars = 42; const gap = 4 * (window.devicePixelRatio || 1); const barWidth = Math.max(1, (width - gap * (bars - 1)) / bars)
      for (let index = 0; index < bars; index += 1) {
        const amplitude = ((listening ? 0.35 : speaking ? 0.24 : 0.08) + Math.sin(time * 2 + index * 0.5) * 0.04) * height
        context.fillStyle = listening ? '#7ee8e8' : '#a78bfa'
        context.fillRect(index * (barWidth + gap), (height - amplitude) / 2, barWidth, amplitude)
      }
      animationRef.current = requestAnimationFrame(draw)
    }
    resize(); draw(); window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animationRef.current); window.removeEventListener('resize', resize) }
  }, [listening, speaking])

  const speak = useCallback((text: string) => { if (!ttsOn || !voiceEngine.ttsSupported) return; setSpeaking(true); voiceEngine.speak(text, () => setSpeaking(false)) }, [ttsOn])

  const executeCommand = useCallback(async (command: ParsedCommand) => {
    switch (command.intent) {
      case 'navigate': ctx.navigate(command.args.target); return `Opening ${command.args.target === 'store' ? 'Store Management' : command.args.target} now.`
      case 'top_products': { const { fetchTopProducts } = await import('@/lib/erpApi'); const rows = await fetchTopProducts(5); const top = rows[0]; return top ? `Your highest selling item is **${top.product_name}** with ${Number(top.qty) || 0} units sold, generating $${(Number(top.revenue) || 0).toFixed(2)}.` : 'No completed transactions are available yet.' }
      case 'revenue': { const { fetchDailyRevenue } = await import('@/lib/erpApi'); const rows = await fetchDailyRevenue(7); const total = rows.reduce((sum, row) => sum + (Number.isFinite(Number(row.total)) ? Number(row.total) : 0), 0); return `Total revenue over the last 7 days is **$${total.toFixed(2)}**.` }
      case 'low_stock': { const { listCollection } = await import('@/lib/firestoreData'); const rows = await listCollection<any>('store_inventory'); const low = rows.filter((row) => Number(row.stock) <= Number(row.reorder_level)); return low.length ? `I found ${low.length} low-stock items: ${low.slice(0, 5).map((row) => row.product_name).join(', ')}.` : 'No low-stock items detected.' }
      case 'add_stock': { const { listCollection, createRecord, updateRecord } = await import('@/lib/firestoreData'); const branches = await listCollection<any>('branches'); const branch = branches.find((row) => row.name?.toLowerCase().includes(command.args.branch.toLowerCase()) || command.args.branch.toLowerCase().includes(row.name?.split(' ')[0].toLowerCase())); const quantity = Number.parseInt(command.args.quantity, 10); if (!branch || !Number.isInteger(quantity) || quantity <= 0) return 'I could not validate the branch or quantity. Please use a positive whole number and a known branch.'; const inventory = await listCollection<any>('store_inventory'); const existing = inventory.find((row) => row.branch_id === branch.id && row.product_name?.toLowerCase().includes(command.args.product.toLowerCase())); if (existing) { const stock = (Number(existing.stock) || 0) + quantity; await updateRecord('store_inventory', existing.id, { stock }); ctx.toast(`Added ${quantity} units to ${branch.name}`, true); return `Done. ${branch.name} now has ${stock} units of ${command.args.product}.` } await createRecord('store_inventory', { branch_id: branch.id, product_name: command.args.product, sku: `SN-${Date.now()}`, category: 'General', stock: quantity, reorder_level: 10, unit_price: 0 }); return `Created ${command.args.product} in ${branch.name} with ${quantity} units.` }
      default: return 'I can navigate modules, inspect sales, check inventory, and add stock. Try **Open store management**.'
    }
  }, [ctx])

  const handleInput = useCallback(async (raw: string) => {
    const text = cleanMessage(raw)
    if (!text) return
    if (!navigator.onLine) { setOfflineQueue((queue) => [...queue, text]); setMessages((items) => [...items, { id: `pending-${++messageSequence}`, role: 'user', text, pending: true }]); setInput(''); return }
    const userId = firebaseAuth?.currentUser?.uid
    const userMessage: Message = { id: `user-${++messageSequence}`, role: 'user', text }
    setMessages((items) => [...items, userMessage]); setInput(''); setThinking(true)
    if (userId) void saveMessage(userId, userMessage).catch(() => undefined)
    try { const reply = await executeCommand(parseCommand(text)); const aiMessage: Message = { id: `ai-${++messageSequence}`, role: 'ai', text: reply }; setMessages((items) => [...items, aiMessage]); if (userId) void saveMessage(userId, aiMessage).catch(() => undefined); speak(reply) } catch { setMessages((items) => [...items, { id: `error-${++messageSequence}`, role: 'ai', text: 'Live workspace data is temporarily unavailable. Your request was not applied.' }]) } finally { setThinking(false) }
  }, [executeCommand, speak])

  const toggleListen = () => { if (listening) { voiceEngine.stop(); setListening(false); return }; setListening(true); voiceEngine.start((transcript, final) => { setInput(transcript); if (final) { setListening(false); void handleInput(transcript) } }, () => setListening(false)) }
  const suggestions = ['Open store management', "What's our highest selling item?", 'Add 20 units of Cold Brew to Downtown', 'Show low stock']

  return <>
    {open && <button aria-label="Close copilot overlay" className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm" onClick={onClose} />}
    <aside aria-label="Nexora Cognitive Co-Pilot" className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5"><div className="flex items-center gap-3"><div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-purple-400"><Sparkles className="size-5 text-slate-950" /></div><div><h2 className="text-sm font-semibold text-white">NEXORA Cognitive Co-Pilot</h2><p className="flex items-center gap-1.5 text-[10px] text-white/45"><span className="size-1.5 rounded-full bg-emerald-400" />Persistent workspace assistant</p></div></div><div className="flex items-center gap-1"><button aria-label="Toggle voice output" onClick={() => { setTtsOn((value) => !value); voiceEngine.stopSpeaking(); setSpeaking(false) }} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white">{ttsOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}</button><button aria-label="Close copilot" onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"><X className="size-5" /></button></div></header>
      <div className="px-5 py-4"><div className="relative h-16 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"><canvas ref={canvasRef} className="size-full" />{listening && <span className="absolute left-3 top-2 flex items-center gap-1 text-[10px] text-cyan-200"><Radio className="size-3" />LIVE</span>}</div></div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-2"><div className="flex flex-col gap-4 pb-4">{messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-sm bg-cyan-200 text-slate-950' : 'rounded-bl-sm border border-white/10 bg-white/[0.05] text-white/85'}`}><MarkdownMessage text={message.text} />{message.pending && <span className="mt-2 block text-[10px] text-slate-600">Waiting for connection</span>}</div></div>)}{thinking && <div className="flex items-center gap-2 text-sm text-white/50"><Loader2 className="size-4 animate-spin" />Nexora AI is thinking...</div>}</div></div>
      <div className="flex flex-wrap gap-2 px-5 pb-3">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => void handleInput(suggestion)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-xs text-white/60 hover:border-cyan-200/40 hover:text-white">{suggestion}</button>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); void handleInput(input) }} className="flex items-end gap-2 border-t border-white/10 px-5 py-4"><button type="button" aria-label={listening ? 'Stop listening' : 'Start listening'} onClick={toggleListen} className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-cyan-100">{listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}</button><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void handleInput(input) } }} rows={1} placeholder="Ask Nexora anything..." className="max-h-28 min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-200/40" /><button type="submit" aria-label="Send message" className="rounded-xl bg-cyan-200 p-3 text-slate-950 hover:bg-cyan-100"><Send className="size-4" /></button></form>
    </aside>
  </>
}

class VoiceCopilotBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.setState({ hasError: true }) }
  render() {
    if (this.state.hasError) return <aside className="fixed right-0 top-0 z-50 grid h-dvh w-full max-w-md place-items-center bg-slate-950 p-6 text-center text-sm text-white/70"><div><p className="mb-3 text-white">Co-Pilot is temporarily unavailable.</p><button className="rounded-lg border border-white/15 px-4 py-2" onClick={() => this.setState({ hasError: false })}>Retry</button></div></aside>
    return this.props.children
  }
}

export default function VoiceCopilot(props: { open: boolean; onClose: () => void; ctx: VoiceContext }) {
  return <VoiceCopilotBoundary><VoiceCopilotContent {...props} /></VoiceCopilotBoundary>
}
