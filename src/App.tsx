import { useState, useEffect, useRef, useCallback } from 'react'
import GameSelector from './components/GameSelector'
import GameBoard from './components/GameBoard'
import MoveList from './components/MoveList'
import AnalysisPanel from './components/AnalysisPanel'
import { useStockfish } from './hooks/useStockfish'
import { parsePgn, classifyMove, computeCpLoss } from './utils/chess'
import type { ArchiveEntry, ChessGame, MoveResult, PositionEval } from './types'

const API_BASE = 'https://api.chess.com/pub/player'

export default function App() {
  // Username
  const [username, setUsername] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [loadingArchives, setLoadingArchives] = useState(false)
  const [archiveError, setArchiveError] = useState('')

  // Archive / game selection
  const [archives, setArchives] = useState<ArchiveEntry[]>([])
  const [selectedArchive, setSelectedArchive] = useState('')
  const [games, setGames] = useState<ChessGame[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [selectedGame, setSelectedGame] = useState<ChessGame | null>(null)

  // Game state
  const [fens, setFens] = useState<string[]>([])
  const [moves, setMoves] = useState<MoveResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')

  // Analysis state — one entry per position (fens.length)
  const [evals, setEvals] = useState<(PositionEval | null)[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const cancelRef = useRef(false)

  const { analyze, stop } = useStockfish(18)

  // Load archives when username is submitted
  useEffect(() => {
    if (!username) return
    setLoadingArchives(true)
    setArchiveError('')
    setArchives([])
    setSelectedArchive('')
    setGames([])
    setSelectedGame(null)

    fetch(`${API_BASE}/${username}/games/archives`)
      .then(r => {
        if (!r.ok) throw new Error(`Player "${username}" not found`)
        return r.json()
      })
      .then(data => {
        const urls: string[] = data.archives ?? []
        if (urls.length === 0) throw new Error('No games found for this player')
        const parsed: ArchiveEntry[] = urls.reverse().map(url => {
          const parts = url.split('/')
          const month = parseInt(parts[parts.length - 1])
          const year = parseInt(parts[parts.length - 2])
          return {
            url,
            year,
            month,
            label: new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          }
        })
        setArchives(parsed)
        setSelectedArchive(parsed[0].url)
      })
      .catch(e => setArchiveError((e as Error).message))
      .finally(() => setLoadingArchives(false))
  }, [username])

  // Load games when archive changes
  useEffect(() => {
    if (!selectedArchive) return
    setLoadingGames(true)
    setGames([])
    setSelectedGame(null)
    fetch(selectedArchive)
      .then(r => r.json())
      .then(data => {
        const g: ChessGame[] = (data.games ?? []).reverse()
        setGames(g)
      })
      .catch(console.error)
      .finally(() => setLoadingGames(false))
  }, [selectedArchive])

  // Run full game analysis sequentially in background
  const runAnalysis = useCallback(async (fenList: string[], moveList: MoveResult[]) => {
    cancelRef.current = false
    setIsAnalyzing(true)
    const results: (PositionEval | null)[] = new Array(fenList.length).fill(null)
    setEvals([...results])

    for (let i = 0; i < fenList.length; i++) {
      if (cancelRef.current) break
      try {
        const result = await analyze(fenList[i])
        if (cancelRef.current) break
        results[i] = result
        setEvals([...results])

        // Update move classification as evals come in
        if (i > 0) {
          const prevEval = results[i - 1]
          const curEval = results[i]
          if (prevEval && curEval) {
            const move = moveList[i - 1]
            const isWhite = move.color === 'w'
            const cpLoss = computeCpLoss(prevEval, curEval, isWhite)
            const classification = classifyMove(cpLoss)
            setMoves(prev => {
              const next = [...prev]
              next[i - 1] = { ...next[i - 1], evalBefore: prevEval, evalAfter: curEval, cpLoss, classification }
              return next
            })
          }
        }
      } catch (e) {
        if ((e as Error).message === 'Superseded') break
      }
    }

    setIsAnalyzing(false)
  }, [analyze])

  const handleSelectGame = useCallback((game: ChessGame) => {
    cancelRef.current = true
    stop()

    setSelectedGame(game)
    setCurrentIndex(0)

    const parsed = parsePgn(game.pgn)
    if (!parsed) return

    const isWhite = game.white.username.toLowerCase() === username.toLowerCase()
    setPlayerColor(isWhite ? 'white' : 'black')
    setFens(parsed.fens)
    setMoves(parsed.moves)
    setEvals(new Array(parsed.fens.length).fill(null))

    setTimeout(() => runAnalysis(parsed.fens, parsed.moves), 100)
  }, [stop, runAnalysis, username])

  const handleLoadUser = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || trimmed === username) return
    cancelRef.current = true
    stop()
    setFens([])
    setMoves([])
    setEvals([])
    setCurrentIndex(0)
    setUsername(trimmed)
  }

  // Navigation
  const goFirst = () => setCurrentIndex(0)
  const goPrev  = () => setCurrentIndex(i => Math.max(0, i - 1))
  const goNext  = () => setCurrentIndex(i => Math.min(fens.length - 1, i + 1))
  const goLast  = () => setCurrentIndex(fens.length - 1)

  const currentFen = fens[currentIndex] ?? 'start'
  const currentMove = currentIndex > 0 ? moves[currentIndex - 1] : null
  const currentEval = evals[currentIndex] ?? null

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">♟ Chess Tutor</div>
        <div className="header-search">
          <input
            className="username-input"
            type="text"
            placeholder="chess.com username"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLoadUser()}
            spellCheck={false}
          />
          <button
            className="load-btn"
            onClick={handleLoadUser}
            disabled={!inputValue.trim() || loadingArchives}
          >
            {loadingArchives ? '…' : 'Load'}
          </button>
        </div>
      </header>

      <main className="app-body">
        <GameSelector
          archives={archives}
          selectedArchive={selectedArchive}
          games={games}
          selectedGame={selectedGame}
          loadingGames={loadingGames}
          username={username}
          archiveError={archiveError}
          onSelectArchive={setSelectedArchive}
          onSelectGame={handleSelectGame}
        />

        <div className="center-column">
          {!username ? (
            <div className="empty-state">
              <div className="empty-icon">♟</div>
              <div className="empty-title">Enter your chess.com username to get started</div>
              <div className="empty-sub">Your game archive will load automatically</div>
            </div>
          ) : selectedGame ? (
            <>
              <GameBoard
                fen={currentFen}
                currentMove={currentMove}
                currentEval={currentEval}
                playerColor={playerColor}
                currentIndex={currentIndex}
                totalMoves={moves.length}
                isAnalyzing={isAnalyzing}
                onFirst={goFirst}
                onPrev={goPrev}
                onNext={goNext}
                onLast={goLast}
              />
              <AnalysisPanel move={currentMove} moveIndex={currentIndex} />
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">♟</div>
              <div>{archiveError || 'Select a game from the left to begin analysis'}</div>
            </div>
          )}
        </div>

        <MoveList
          moves={moves}
          currentIndex={currentIndex}
          onSelectMove={setCurrentIndex}
        />
      </main>
    </div>
  )
}
