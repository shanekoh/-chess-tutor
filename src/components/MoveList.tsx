import { useEffect, useRef } from 'react'
import type { MoveResult } from '../types'
import { CLASSIFICATION_META } from '../utils/chess'

interface Props {
  moves: MoveResult[]
  currentIndex: number  // 0 = before any move
  onSelectMove: (index: number) => void
}

export default function MoveList({ moves, currentIndex, onSelectMove }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentIndex])

  const pairs: [MoveResult, MoveResult | null][] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1] ?? null])
  }

  return (
    <div className="sidebar sidebar-right">
      <div className="sidebar-header">
        <span className="sidebar-title">Moves</span>
      </div>

      <div className="move-list-scroll">
        {pairs.map(([white, black], pairIdx) => {
          const whiteIdx = pairIdx * 2 + 1  // 1-based move index
          const blackIdx = pairIdx * 2 + 2

          return (
            <div key={pairIdx} className="move-pair">
              <span className="move-number">{pairIdx + 1}.</span>

              <MoveCell
                move={white}
                moveIndex={whiteIdx}
                isActive={currentIndex === whiteIdx}
                ref={currentIndex === whiteIdx ? activeRef : null}
                onClick={() => onSelectMove(whiteIdx)}
              />

              {black && (
                <MoveCell
                  move={black}
                  moveIndex={blackIdx}
                  isActive={currentIndex === blackIdx}
                  ref={currentIndex === blackIdx ? activeRef : null}
                  onClick={() => onSelectMove(blackIdx)}
                />
              )}
            </div>
          )
        })}

        {moves.length === 0 && (
          <div className="loading-msg">Select a game to begin</div>
        )}
      </div>
    </div>
  )
}

import React from 'react'

interface MoveCellProps {
  move: MoveResult
  moveIndex: number
  isActive: boolean
  onClick: () => void
}

const MoveCell = React.forwardRef<HTMLButtonElement, MoveCellProps>(
  ({ move, isActive, onClick }, ref) => {
    const meta = move.classification ? CLASSIFICATION_META[move.classification] : null
    const showBadge = move.classification && !['best', 'excellent', 'good'].includes(move.classification)

    return (
      <button
        ref={ref}
        className={`move-btn ${isActive ? 'active' : ''}`}
        onClick={onClick}
        style={meta && showBadge ? { color: meta.color } : undefined}
      >
        {move.san}
        {meta && showBadge && (
          <span className="move-symbol" style={{ color: meta.color }}>{meta.symbol}</span>
        )}
      </button>
    )
  }
)
MoveCell.displayName = 'MoveCell'
