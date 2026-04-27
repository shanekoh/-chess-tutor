import { Chess } from 'chess.js'
import type { MoveClassification, MoveResult, PositionEval } from '../types'

export function parsePgn(pgn: string): { fens: string[]; moves: MoveResult[] } | null {
  try {
    const chess = new Chess()
    chess.loadPgn(pgn)

    const history = chess.history({ verbose: true })
    const fens: string[] = [history[0].before, ...history.map(m => m.after)]
    const moves: MoveResult[] = history.map(m => ({
      san: m.san,
      from: m.from,
      to: m.to,
      color: m.color,
      fenBefore: m.before,
      fenAfter: m.after,
      evalBefore: null,
      evalAfter: null,
      classification: null,
      cpLoss: 0,
    }))

    return { fens, moves }
  } catch {
    return null
  }
}

export function classifyMove(cpLoss: number): MoveClassification {
  if (cpLoss < 10) return 'best'
  if (cpLoss < 50) return 'excellent'
  if (cpLoss < 100) return 'good'
  if (cpLoss < 200) return 'inaccuracy'
  if (cpLoss < 300) return 'mistake'
  return 'blunder'
}

export function computeCpLoss(evalBefore: PositionEval, evalAfter: PositionEval, isWhite: boolean): number {
  // cap evals to avoid mate scores distorting the loss calculation
  const cap = (cp: number) => Math.max(-2000, Math.min(2000, cp))
  const before = cap(evalBefore.cp)
  const after = cap(evalAfter.cp)
  const loss = isWhite ? before - after : after - before
  return Math.max(0, loss)
}

// cp → 0–100 percentage for eval bar (white at bottom)
export function evalToPercent(cp: number): number {
  return 50 + 50 * Math.tanh(cp / 400)
}

export function formatEval(cp: number, mate?: number): string {
  if (mate !== undefined) return `M${Math.abs(mate)}`
  const pawns = (Math.abs(cp) / 100).toFixed(1)
  return `${cp >= 0 ? '+' : '-'}${pawns}`
}

export function formatTimeControl(tc: string): string {
  if (!tc || tc === '-') return '?'
  const parts = tc.split('+')
  const base = parseInt(parts[0])
  const inc = parts[1] ? parseInt(parts[1]) : 0
  const mins = Math.floor(base / 60)
  const secs = base % 60
  const baseStr = secs > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${mins}`
  return inc > 0 ? `${baseStr}+${inc}` : baseStr
}

export function uciToSan(fen: string, uciMoves: string[]): string[] {
  const chess = new Chess(fen)
  const result: string[] = []
  for (const uci of uciMoves) {
    if (uci.length < 4) break
    try {
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4] as 'q' | 'r' | 'b' | 'n' | undefined,
      })
      if (!move) break
      result.push(move.san)
    } catch {
      break
    }
  }
  return result
}

export const CLASSIFICATION_META: Record<NonNullable<MoveClassification>, { label: string; symbol: string; color: string }> = {
  brilliant: { label: 'Brilliant', symbol: '!!', color: '#1baacc' },
  best:      { label: 'Best',      symbol: '!',  color: '#5dc45d' },
  excellent: { label: 'Excellent', symbol: '!',  color: '#5dc45d' },
  good:      { label: 'Good',      symbol: '',   color: '#8bc48b' },
  inaccuracy:{ label: 'Inaccuracy',symbol: '?!', color: '#f0d045' },
  mistake:   { label: 'Mistake',   symbol: '?',  color: '#f0a045' },
  blunder:   { label: 'Blunder',   symbol: '??', color: '#f0454a' },
}
