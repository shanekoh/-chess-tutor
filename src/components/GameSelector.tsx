import type { ArchiveEntry, ChessGame } from '../types'
import { formatTimeControl } from '../utils/chess'

interface Props {
  archives: ArchiveEntry[]
  selectedArchive: string
  games: ChessGame[]
  selectedGame: ChessGame | null
  loadingGames: boolean
  username: string
  archiveError: string
  onSelectArchive: (url: string) => void
  onSelectGame: (game: ChessGame) => void
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function gameResult(game: ChessGame, username: string): { text: string; cls: string } {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase()
  const myResult = isWhite ? game.white.result : game.black.result
  if (myResult === 'win') return { text: 'W', cls: 'result-win' }
  if (['checkmated','resigned','timeout','abandoned','lose'].includes(myResult)) return { text: 'L', cls: 'result-loss' }
  return { text: 'D', cls: 'result-draw' }
}

function opponent(game: ChessGame, username: string): { name: string; rating: number } {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase()
  return isWhite
    ? { name: game.black.username, rating: game.black.rating }
    : { name: game.white.username, rating: game.white.rating }
}

export default function GameSelector({ archives, selectedArchive, games, selectedGame, loadingGames, username, archiveError, onSelectArchive, onSelectGame }: Props) {
  return (
    <div className="sidebar sidebar-left">
      <div className="sidebar-header">
        <span className="sidebar-title">Games</span>
        <span className="username-badge">{username}</span>
      </div>

      {archiveError && <div className="archive-error">{archiveError}</div>}
      <div className="archive-scroll">
        {archives.map(a => (
          <button
            key={a.url}
            className={`archive-btn ${selectedArchive === a.url ? 'active' : ''}`}
            onClick={() => onSelectArchive(a.url)}
          >
            {MONTH_NAMES[a.month - 1]} {a.year}
          </button>
        ))}
      </div>

      <div className="game-list">
        {loadingGames && <div className="loading-msg">Loading games…</div>}
        {!loadingGames && games.length === 0 && selectedArchive && (
          <div className="loading-msg">No games found</div>
        )}
        {games.map(game => {
          const opp = opponent(game, username)
          const res = gameResult(game, username)
          const date = new Date(game.end_time * 1000)
          const isSelected = selectedGame?.url === game.url
          return (
            <button
              key={game.url}
              className={`game-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectGame(game)}
            >
              <span className={`result-badge ${res.cls}`}>{res.text}</span>
              <div className="game-info">
                <span className="opp-name">{opp.name}</span>
                <span className="opp-rating">({opp.rating})</span>
              </div>
              <div className="game-meta">
                <span>{formatTimeControl(game.time_control)}</span>
                <span>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
