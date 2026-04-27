import type { MoveResult } from '../types'
import { CLASSIFICATION_META, formatEval, uciToSan } from '../utils/chess'

interface Props {
  move: MoveResult | null
  moveIndex: number
}

export default function AnalysisPanel({ move, moveIndex }: Props) {
  if (!move || moveIndex === 0) {
    return (
      <div className="analysis-panel">
        <div className="analysis-placeholder">Navigate through moves to see analysis</div>
      </div>
    )
  }

  const { classification, evalBefore, evalAfter, san, fenBefore, cpLoss } = move
  const meta = classification ? CLASSIFICATION_META[classification] : null

  const bestMoveSan = evalBefore
    ? uciToSan(fenBefore, [evalBefore.bestMove]).join('')
    : null

  const line = evalBefore
    ? uciToSan(fenBefore, evalBefore.line).join(' ')
    : null

  const playedBest = evalBefore?.bestMove
    ? evalBefore.bestMove === `${move.from}${move.to}` || evalBefore.bestMove === `${move.from}${move.to}q`
    : false

  return (
    <div className="analysis-panel">
      {meta ? (
        <div className="classification-row">
          <span className="class-badge" style={{ backgroundColor: meta.color }}>
            {meta.symbol || meta.label}
          </span>
          <span className="class-label" style={{ color: meta.color }}>{meta.label}</span>
          {cpLoss > 0 && <span className="cp-loss">−{(cpLoss / 100).toFixed(1)} pawns</span>}
        </div>
      ) : (
        <div className="classification-row">
          <span className="analyzing-badge">Analyzing…</span>
        </div>
      )}

      <div className="move-played">
        <span className="label">Played:</span>
        <strong style={{ color: meta?.color ?? '#ccc' }}>{san}</strong>
        {!playedBest && bestMoveSan && bestMoveSan !== san && (
          <>
            <span className="label">Best:</span>
            <strong className="best-move">{bestMoveSan}</strong>
          </>
        )}
      </div>

      {evalBefore && evalAfter && (
        <div className="eval-change">
          <span className="eval-chip">{formatEval(evalBefore.cp, evalBefore.mate)}</span>
          <span className="eval-arrow">→</span>
          <span className="eval-chip">{formatEval(evalAfter.cp, evalAfter.mate)}</span>
        </div>
      )}

      {line && (
        <div className="engine-line">
          <span className="label">Engine:</span>
          <span className="line-text">{line}</span>
        </div>
      )}
    </div>
  )
}
