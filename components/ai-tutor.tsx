'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Brain, Lightbulb, CheckCircle, XCircle } from 'lucide-react'
import type { SubjectId } from '@/lib/subjects'
import { cn } from '@/lib/utils'
import { unlockAchievement } from '@/lib/achievements'

function getText(parts: { type: string; text?: string }[] | undefined) {
  if (!parts) return ''
  return parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')
}

import { InlineMath, BlockMath } from 'react-katex'

/** Renders text with LaTeX math segments styled. */
function RichText({ text }: { text: string }) {
  // Split by $$...$$ for block math, and \(...\) for inline math
  const segments = text.split(/(\$\$[\s\S]+?\$\$|\\\([\s\S]+?\\\))/g)
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.startsWith('$$') && seg.endsWith('$$')) {
          return (
            <div key={i} className="my-3 overflow-x-auto rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 shadow-sm text-lg">
              <BlockMath math={seg.slice(2, -2).trim()} />
            </div>
          )
        }
        if (seg.startsWith('\\(') && seg.endsWith('\\)')) {
          return <InlineMath key={i} math={seg.slice(2, -2).trim()} />
        }
        return <span key={i}>{seg}</span>
      })}
    </>
  )
}

interface QuizQuestion {
  q: string
  options: string[]
  correct: number
  explanation: string
}

function QuizPanel({
  questions,
  onDone,
}: {
  questions: QuizQuestion[]
  onDone: (score: number) => void
}) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  function pick(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === questions[current].correct
    if (correct) setScore((s) => s + 1)
    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1)
        setSelected(null)
      } else {
        setFinished(true)
        const finalScore = score + (correct ? 1 : 0)
        if (finalScore === questions.length) unlockAchievement('quiz_ace')
        setTimeout(() => onDone(finalScore), 1800)
      }
    }, 1200)
  }

  if (finished) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-3 p-4 text-center"
      >
        <span className="text-3xl">{score === questions.length ? '🏆' : score >= 2 ? '⭐' : '📚'}</span>
        <p className="font-semibold text-foreground">
          {score}/{questions.length} correct!
        </p>
        <p className="text-xs text-muted-foreground">
          {score === questions.length ? 'Perfect! Quiz Ace badge unlocked!' : 'Keep experimenting and try again!'}
        </p>
      </motion.div>
    )
  }

  const q = questions[current]
  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Question {current + 1}/{questions.length}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">Score: {score}</span>
      </div>
      <p className="text-sm font-medium leading-snug text-foreground">{q.q}</p>
      <div className="flex flex-col gap-1.5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct
          const isSelected = i === selected
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => pick(i)}
              disabled={selected !== null}
              className={cn(
                'rounded-xl border px-3 py-2 text-left text-xs leading-snug transition-all',
                selected === null
                  ? 'border-border hover:border-primary/50 hover:bg-primary/5'
                  : isCorrect
                  ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                  : isSelected
                  ? 'border-red-400/60 bg-red-400/15 text-red-300'
                  : 'border-border opacity-40',
              )}
            >
              <span className="flex items-center gap-2">
                {selected !== null && isCorrect && <CheckCircle className="size-3 shrink-0 text-emerald-400" />}
                {selected !== null && isSelected && !isCorrect && <XCircle className="size-3 shrink-0 text-red-400" />}
                {opt}
              </span>
              {selected !== null && isSelected && !isCorrect && (
                <p className="mt-1 text-[10px] text-muted-foreground">{q.explanation}</p>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

interface AiTutorProps {
  subject: SubjectId
  greeting: string
  getState: () => string
  enabled?: boolean
  onAchievementUnlock?: () => void
  highContrast?: boolean
}

export function AiTutor({
  subject,
  greeting,
  getState,
  enabled = true,
  highContrast = false,
}: AiTutorProps) {
  const stateRef = useRef(getState)
  stateRef.current = getState
  const scrollRef = useRef<HTMLDivElement>(null)
  const nudgeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef<number>(Date.now())

  const [input, setInput] = useState('')
  const [quizMode, setQuizMode] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [lastQuizScore, setLastQuizScore] = useState<number | null>(null)
  const [nudgeText, setNudgeText] = useState<string | null>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/tutor',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          subject,
          state: stateRef.current(),
        },
      }),
    }),
  })

  const busy = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy, nudgeText])

  // Proactive nudge: fires once after 45s of active experiment
  useEffect(() => {
    if (!enabled) return
    nudgeTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [],
            subject,
            state: stateRef.current(),
            mode: 'nudge',
          }),
        })
        const text = await res.text()
        if (text) setNudgeText(text.replace(/^"|"$/g, '').replace(/\\n/g, '\n'))
      } catch { /* ignore */ }
      // Fire once then clear
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current)
    }, 45000)

    // Deep dive achievement
    const deepDiveTimer = setTimeout(() => {
      unlockAchievement('deep_dive')
    }, 5 * 60 * 1000)

    return () => {
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current)
      clearTimeout(deepDiveTimer)
    }
  }, [enabled, subject])

  const dismissNudge = useCallback(() => setNudgeText(null), [])

  function injectNudge() {
    if (!nudgeText) return
    sendMessage({ text: nudgeText })
    setNudgeText(null)
  }

  async function generateQuiz() {
    setQuizLoading(true)
    setQuizMode(false)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          subject,
          state: stateRef.current(),
          mode: 'quiz',
        }),
      })
      const text = await res.text()
      console.log('Quiz response raw text:', text)
      // Strip streaming prefix tokens, get the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        // Fix bad escaped characters in JSON (e.g. \p from \pi that the LLM forgot to double-escape)
        const cleanedJson = jsonMatch[0].replace(/\\./g, (m) => {
          if (['\\\\', '\\"', '\\/', '\\b', '\\f', '\\n', '\\r', '\\t', '\\u'].includes(m)) {
            return m
          }
          return '\\\\' + m[1]
        })
        
        try {
          const parsed = JSON.parse(cleanedJson)
          setQuizQuestions(parsed.questions ?? [])
          setQuizMode(true)
        } catch (parseErr) {
          console.error('Failed to parse cleaned JSON:', parseErr, cleanedJson)
        }
      } else {
        console.error('No JSON matched in response.')
      }
    } catch (err) {
      console.error('Quiz generation failed:', err)
    }
    setQuizLoading(false)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy || !enabled) return
    sendMessage({ text })
    setInput('')
    setNudgeText(null)
  }

  return (
    <div className={cn(
      'flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur',
      highContrast && 'bg-background border-2 border-foreground/40',
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </span>
        <div className="leading-tight">
          <p className={cn('font-mono text-xs tracking-wide text-foreground', highContrast && 'text-base font-bold')}>
            TUTORBOT
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            AI Lab Assistant
          </p>
        </div>
        <span
          className={cn(
            'ml-auto size-2 rounded-full',
            enabled ? 'bg-biology animate-pulse' : 'bg-muted-foreground/40',
          )}
        />
      </div>

      {/* Action bar */}
      {enabled && (
        <div className="flex items-center gap-1.5 border-b border-border/50 px-3 py-2">
          <button
            onClick={generateQuiz}
            disabled={quizLoading || busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary transition hover:bg-primary/20 disabled:opacity-40"
          >
            <Brain className="size-3" />
            {quizLoading ? 'Generating...' : 'Test Me'}
          </button>
          {lastQuizScore !== null && (
            <span className="font-mono text-[10px] text-muted-foreground">
              Last: {lastQuizScore}/3
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto scrollbar-hide-idle px-4 py-4 text-sm"
        aria-live="polite"
        aria-label="Conversation with AI tutor"
      >
        <Bubble role="assistant" highContrast={highContrast}>
          <RichText text={greeting} />
        </Bubble>

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role === 'user' ? 'user' : 'assistant'} highContrast={highContrast}>
            <RichText text={getText(m.parts)} />
          </Bubble>
        ))}

        {status === 'submitted' && (
          <Bubble role="assistant" highContrast={highContrast}>
            <span className="inline-flex gap-1">
              <Dot /> <Dot /> <Dot />
            </span>
          </Bubble>
        )}

        {/* Quiz panel */}
        <AnimatePresence>
          {quizMode && quizQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-primary/25 bg-primary/5 p-1"
            >
              <QuizPanel
                questions={quizQuestions}
                onDone={(score) => {
                  setQuizMode(false)
                  setLastQuizScore(score)
                  sendMessage({
                    text: `I just scored ${score}/3 on the quiz. Can you briefly explain any concepts I might have missed?`,
                  })
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proactive nudge */}
        <AnimatePresence>
          {nudgeText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-yellow-400" />
                <p className="flex-1 text-xs leading-relaxed text-yellow-200">{nudgeText}</p>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={injectNudge}
                  className="font-mono text-[10px] uppercase tracking-widest text-yellow-400 hover:underline"
                >
                  Ask about this →
                </button>
                <button
                  onClick={dismissNudge}
                  className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!enabled || busy}
          placeholder={
            enabled ? 'Ask TutorBot anything...' : 'Start the experiment first'
          }
          className={cn(
            'min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50',
            highContrast && 'border-2 border-foreground/40 text-base',
          )}
          aria-label="Message TutorBot"
        />
        <button
          type="submit"
          disabled={!enabled || busy || !input.trim()}
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  )
}

function Bubble({
  role,
  children,
  highContrast = false,
}: {
  role: 'user' | 'assistant'
  children: React.ReactNode
  highContrast?: boolean
}) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex gap-2', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px]',
          isUser
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary/15 text-primary',
        )}
      >
        {isUser ? 'You' : <Sparkles className="size-3" />}
      </span>
      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-3 py-2 leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-secondary text-secondary-foreground'
            : 'rounded-tl-sm bg-muted text-foreground',
          highContrast && 'text-base',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Dot() {
  return (
    <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:var(--d)]" />
  )
}
