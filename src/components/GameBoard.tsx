import { Chessboard } from 'react-chessboard'
import { evalToPercent, formatEval } from '../utils/chess'
import type { MoveResult, PositionEval } from '../types'

interface Props {
  fen: string
  currentMove: MoveResult | null
  currentEval: PositionEval | null
  playerColor: 'white' | 'black'
  currentIndex: number
  totalMoves: number
  isAnalyzing: boolean
  onFirst: () => void
  onPrev: () => void
  onNext: () => void
  onLast: () => void
}

export default function GameBoard({ fen, currentMove, currentEval, playerColor, currentIndex, totalMoves, isAnalyzing, onFirst, onPrev, onNext, onLast }: Props) {
  const evalCp = currentEval?.cp ?? 0
  const whitePercent = evalToPercent(evalCp)
  const evalText = currentEval ? formatEval(currentEval.cp, currentEval.mate) : '0.0'

  const squareStyles: Record<string, React.CSSProperties> = {}
  if (currentMove) {
    squareStyles[currentMove.from] = { backgroundColor: 'rgba(255,255,100,0.35)' }
    squareStyles[currentMove.to] = { backgroundColor: 'rgba(255,255,100,0.55)' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arrows: any[] = []
  if (currentEval?.bestMove && currentEval.bestMove.length >= 4) {
    const bm = currentEval.bestMove
    if (bm !== '0000') {
      arrows.push([bm.slice(0, 2), bm.slice(2, 4), '#4CAF50'])
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onPrev()
    else if (e.key === 'ArrowRight') onNext()
    else if (e.key === 'ArrowUp') onFirst()
    else if (e.key === 'ArrowDown') onLast()
  }

  return (
    <div className="board-area" onKeyDown={handleKey} tabIndex={0}>
      <div className="board-with-eval">
        <div className="eval-bar-wrap">
          <div className="eval-bar">
            <div className="eval-fill-black" style={{ height: `${100 - whitePercent}%` }} />
            <div className="eval-fill-white" style={{ height: `${whitePercent}%` }} />
          </div>
          <div className={`eval-label ${evalCp >= 0 ? 'eval-white' : 'eval-black'}`}>
            {isAnalyzing ? '…' : evalText}
          </div>
        </div>

        <div className="board-wrapper">
          <Chessboard
            id="main-board"
            position={fen}
            boardWidth={480}
            boardOrientation={playerColor}
            arePiecesDraggable={false}
            customArrows={arrows}
            customSquareStyles={squareStyles}
            customBoardStyle={{ borderRadius: '4px', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
          />
        </div>
      </div>

      <div className="nav-controls">
        <button className="nav-btn" onClick={onFirst} disabled={currentIndex === 0} title="Start">⏮</button>
        <button className="nav-btn" onClick={onPrev}  disabled={currentIndex === 0} title="Previous (←)">◀</button>
        <span className="move-counter">{currentIndex} / {totalMoves}</span>
        <button className="nav-btn" onClick={onNext}  disabled={currentIndex >= totalMoves} title="Next (→)">▶</button>
        <button className="nav-btn" onClick={onLast}  disabled={currentIndex >= totalMoves} title="End">⏭</button>
        {isAnalyzing && <span className="analyzing-badge">Analyzing…</span>}
      </div>
    </div>
  )
}
