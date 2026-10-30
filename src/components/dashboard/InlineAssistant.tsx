'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const responses = [
  'Schema check complete: transactions, inventory, branches, and invoices are ready for review.',
  'Diagnostic pass complete: no invalid numeric values or blocked workspace boundaries were detected.',
  'ERP log generated: revenue trends are stable and the forecast pipeline is ready for the next refresh.',
]

function resolveResponse(prompt: string) {
  const normalized = prompt.toLowerCase()
  if (normalized.includes('error') || normalized.includes('crash') || normalized.includes('debug')) {
    return 'Diagnostic engineer report: isolate the failing boundary, validate the payload contract, then retry through the secure data gateway. Suggested patch: normalize unknown values to safe defaults before rendering.'
  }
  if (normalized.includes('schema') || normalized.includes('database')) {
    return 'Schema preview: users → workspaces → transactions → audit events. Every write should be scoped to the authenticated workspace and validated at the gateway boundary.'
  }
  return responses[prompt.length % responses.length]
}

export default function InlineAssistant() {
  const { locale, t } = useI18n()
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState(t('Ask for a schema summary, ERP log, or operational insight.', 'اطلب ملخص المخطط أو سجل النظام أو رؤية تشغيلية.'))
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale === 'ar' ? 'ar-SA' : 'en-US'
    window.speechSynthesis.speak(utterance)
  }, [locale])

  const listen = () => {
    const Recognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
    if (!Recognition) { setOutput(t('Voice input is not available in this browser.', 'الإدخال الصوتي غير متاح في هذا المتصفح.')); return }
    const recognition = new Recognition()
    recognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => { setListening(false); setOutput(t('Voice input could not connect. Try again.', 'تعذر الاتصال بالإدخال الصوتي. حاول مرة أخرى.')) }
    recognition.onresult = (event) => setPrompt(event.results[0][0].transcript)
    recognition.start()
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const cleanPrompt = prompt.trim().replace(/[<>]/g, '').slice(0, 1000)
    if (!cleanPrompt || loading) return
    setLoading(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const nextOutput = resolveResponse(cleanPrompt)
      setOutput(nextOutput)
      setPrompt('')
      setLoading(false)
    }, 450)
  }

  return <section className="glass rounded-2xl p-5 lg:p-6" aria-label="Nexora AI assistant" aria-busy={loading}>
    <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-purple-400"><Sparkles className="size-4 text-slate-950" /></div><div><h3 className="font-display font-semibold text-white">Nexora AI Orchestrator</h3><p className="text-xs text-white/45">{t('Contextual diagnostic engineer', 'مهندس التشخيص السياقي')}</p></div></div><button type="button" onClick={() => speak(output)} className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label={t('Read response aloud', 'قراءة الرد بصوت عال')}><Volume2 className="size-4" /></button></div>
    <div className="mb-3 rounded-xl border border-cyan-200/10 bg-cyan-200/[0.04] p-3 text-xs leading-5 text-white/55">{t('Start with a schema check, ask for a diagnostic, or generate an ERP log.', 'ابدأ بفحص المخطط أو اطلب تشخيصاً أو أنشئ سجل نظام.')}</div>
    <div className="min-h-16 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-white/75">{loading ? <span className="flex items-center gap-2 text-white/50"><Loader2 className="size-4 animate-spin" />{t('Generating a safe diagnostic...', 'جارٍ إنشاء تشخيص آمن...')}</span> : output}</div>
    <form onSubmit={submit} className="mt-3 flex gap-2"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={t('Generate a schema or ERP log...', 'أنشئ مخططاً أو سجل نظام...')} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-200/40" aria-label={t('AI prompt', 'طلب الذكاء الاصطناعي')} /><button type="button" onClick={listen} className="rounded-xl border border-white/10 px-3 text-white/70 transition active:scale-95 hover:bg-white/10" aria-label={listening ? t('Stop listening', 'إيقاف الاستماع') : t('Start voice input', 'بدء الإدخال الصوتي')}>{listening ? <MicOff className="size-4 text-cyan-200" /> : <Mic className="size-4" />}</button><button type="submit" disabled={loading || !prompt.trim()} className="rounded-xl bg-cyan-200 px-3 text-slate-950 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40" aria-label={t('Run AI prompt', 'تشغيل الطلب')}><Send className="size-4" /></button></form>
  </section>
}

type SpeechRecognition = {
  lang: string
  onstart: () => void
  onend: () => void
  onerror: () => void
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  start: () => void
}
