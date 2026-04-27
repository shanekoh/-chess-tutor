import { useEffect, useRef, useCallback } from 'react'
import type { PositionEval } from '../types'

type Pending = {
  resolve: (r: PositionEval) => void
  reject: (e: Error) => void
}

export function useStockfish(depth = 18) {
  const workerRef = useRef<Worker | null>(null)
  const readyRef = useRef(false)
  const pendingRef = useRef<Pending | null>(null)
  const skipNextBestMove = useRef(false)
  const currentRef = useRef<{ cp?: number; mate?: number; moves?: string[] }>({})

  useEffect(() => {
    const worker = new Worker('/stockfish/stockfish-nnue-16-single.js')
    workerRef.current = worker

    worker.onmessage = ({ data }) => {
      const msg: string = typeof data === 'string' ? data : ''

      if (msg === 'uciok') {
        worker.postMessage('setoption name Hash value 64')
        worker.postMessage('isready')
      } else if (msg === 'readyok') {
        readyRef.current = true
      } else if (msg.startsWith('info')) {
        const cpMatch = msg.match(/score cp (-?\d+)/)
        const mateMatch = msg.match(/score mate (-?\d+)/)
        const pvMatch = msg.match(/ pv (.+)$/)
        if (cpMatch) { currentRef.current.cp = parseInt(cpMatch[1]); currentRef.current.mate = undefined }
        if (mateMatch) { currentRef.current.mate = parseInt(mateMatch[1]); currentRef.current.cp = undefined }
        if (pvMatch) currentRef.current.moves = pvMatch[1].trim().split(' ').slice(0, 6)
      } else if (msg.startsWith('bestmove')) {
        if (skipNextBestMove.current) {
          skipNextBestMove.current = false
          return
        }
        const bestMove = msg.split(' ')[1] ?? ''
        const pending = pendingRef.current
        pendingRef.current = null
        if (pending) {
          const { cp, mate, moves } = currentRef.current
          currentRef.current = {}
          pending.resolve({
            cp: cp ?? (mate !== undefined ? (mate > 0 ? 9999 : -9999) : 0),
            mate,
            bestMove,
            line: moves ?? [],
          })
        }
        currentRef.current = {}
      }
    }

    worker.onerror = () => {
      const pending = pendingRef.current
      pendingRef.current = null
      pending?.reject(new Error('Stockfish worker error'))
    }

    worker.postMessage('uci')
    return () => worker.terminate()
  }, [])

  const analyze = useCallback((fen: string): Promise<PositionEval> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current
      if (!worker) { reject(new Error('Worker not ready')); return }

      // Cancel any in-flight analysis
      if (pendingRef.current) {
        pendingRef.current.reject(new Error('Superseded'))
        pendingRef.current = null
        skipNextBestMove.current = true
        worker.postMessage('stop')
      }

      currentRef.current = {}
      pendingRef.current = { resolve, reject }

      const send = () => {
        worker.postMessage('stop')
        worker.postMessage(`position fen ${fen}`)
        worker.postMessage(`go depth ${depth}`)
      }

      if (readyRef.current) {
        send()
      } else {
        // Poll until ready (usually < 500ms)
        const poll = setInterval(() => {
          if (readyRef.current) { clearInterval(poll); send() }
        }, 50)
      }
    })
  }, [depth])

  const stop = useCallback(() => {
    if (pendingRef.current) {
      pendingRef.current.reject(new Error('Stopped'))
      pendingRef.current = null
      skipNextBestMove.current = true
      workerRef.current?.postMessage('stop')
    }
  }, [])

  return { analyze, stop }
}
