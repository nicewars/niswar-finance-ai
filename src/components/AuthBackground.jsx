import { useState, useEffect } from 'react'
import { Wallet } from 'lucide-react'

// Ukuran tiap cell = 48px ikon + 57px gap
const CELL = 105
// Faktor perbesaran kompensasi rotasi -25deg supaya motif tidak ada celah
const SCALE = 1.8

function calcGrid() {
  const w = window.innerWidth
  const h = window.innerHeight
  const cols = Math.ceil((w * SCALE) / CELL) + 6
  const rows = Math.ceil((h * SCALE) / CELL) + 6
  return { cols, rows }
}

function WalletPattern() {
  const [grid, setGrid] = useState(() => calcGrid())

  useEffect(() => {
    function handleResize() {
      setGrid(calcGrid())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { cols, rows } = grid
  const total = cols * rows

  return (
    <div
      style={{
        position: 'absolute',
        inset: '-50%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-25deg)',
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
          gap: '57px 0',
        }}
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{ width: CELL, height: CELL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Wallet size={48} style={{ color: 'white', opacity: 0.12, strokeWidth: 1.5 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AuthBackground({ children }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center p-4 overflow-hidden" style={{ isolation: 'isolate' }}>
      <WalletPattern />
      {children}
    </div>
  )
}

export default AuthBackground
