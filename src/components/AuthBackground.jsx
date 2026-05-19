import { Wallet } from 'lucide-react'

function WalletPattern() {
  const CELL = 105  // 48px ikon + 57px jarak
  const COLS = 20
  const ROWS = 16   // 320 ikon total

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: COLS * CELL,
          height: ROWS * CELL,
          transform: 'translate(-50%, -50%) rotate(-25deg)',
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center p-4 overflow-hidden">
      <WalletPattern />
      {children}
    </div>
  )
}

export default AuthBackground
