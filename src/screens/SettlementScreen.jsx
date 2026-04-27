import { useMemo } from 'react'
import { useRound } from '../context/RoundContext.jsx'
import { computePlayerBreakdown, computePlayerNetTotals, r2 } from '../utils/calculations.js'
import { simplifyDebts } from '../utils/settlement.js'

export default function SettlementScreen() {
  const { state, dispatch } = useRound()
  const { round } = state

  const breakdown  = useMemo(() => computePlayerBreakdown(round),    [round])
  const netTotals  = useMemo(() => computePlayerNetTotals(round),    [round])
  const txns       = useMemo(() => simplifyDebts(netTotals, round.players), [netTotals, round.players])

  const dollarColor = (v) =>
    v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-400'

  const handleReset = () => {
    if (confirm('Start a new round? Current round data will be cleared.')) {
      dispatch({ type: 'RESET' })
      if (navigator.vibrate) navigator.vibrate(20)
    }
  }

  const handleExport = () => {
    const lines = []
    const date  = round.date || new Date().toISOString().split('T')[0]
    lines.push(`⛳ CRACK CASH SETTLEMENT`)
    lines.push(`${round.name || round.course || 'Round'} — ${date}`)
    lines.push('')
    lines.push('PAYMENTS:')
    if (txns.length === 0) {
      lines.push('  All square — no payments needed!')
    } else {
      txns.forEach(t => {
        lines.push(`  ${t.from.name} → ${t.to.name}: $${t.amount.toFixed(2)}`)
      })
    }
    lines.push('')
    lines.push('PLAYER TOTALS:')
    breakdown.forEach(p => {
      const sign = p.net >= 0 ? '+' : ''
      lines.push(`  ${p.name}: ${sign}$${Math.abs(p.net).toFixed(2)} (Crack ${p.crack >= 0 ? '+' : ''}$${Math.abs(p.crack).toFixed(2)} | Greenie ${p.greenie >= 0 ? '+' : ''}$${Math.abs(p.greenie).toFixed(2)} | Chip ${p.chip >= 0 ? '+' : ''}$${Math.abs(p.chip).toFixed(2)})`)
    })

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      alert('Copied to clipboard!')
    }).catch(() => {
      alert(lines.join('\n'))
    })
  }

  const goOverview = () => dispatch({ type: 'NAVIGATE', payload: { screen: 'overview' } })

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 pt-safe">
        <div className="flex items-center px-4 py-3">
          <button onClick={goOverview} className="text-gray-400 text-sm active:opacity-60 mr-3">
            ‹ Back
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg leading-none">Settlement</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {round.name || round.course || 'Round complete'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe">

        {/* Who pays whom */}
        <section className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-white font-bold text-lg mb-3">Who Pays Whom</h2>
          {txns.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">🤝</p>
              <p className="text-green-400 font-bold">All square!</p>
              <p className="text-gray-500 text-sm">No payments needed.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {txns.map((t, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3.5">
                  <span className="text-red-400 font-bold text-sm flex-1">{t.from.name}</span>
                  <span className="text-gray-500 text-sm">pays</span>
                  <span className="text-yellow-400 font-black text-base">${t.amount.toFixed(2)}</span>
                  <span className="text-gray-500 text-sm">to</span>
                  <span className="text-green-400 font-bold text-sm flex-1 text-right">{t.to.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Per-player net */}
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-white font-bold text-lg">Player Totals</h2>
          </div>
          <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-800 text-gray-500 text-xs font-bold uppercase">
            <span>Player</span>
            <span className="text-right">Crack</span>
            <span className="text-right">Green+Chip</span>
            <span className="text-right">Net</span>
          </div>
          {breakdown.map(p => (
            <div key={p.playerId} className="grid grid-cols-4 px-4 py-3.5 border-b border-gray-800 last:border-0 items-center">
              <div>
                <p className="text-white text-sm font-bold leading-tight">{p.name}</p>
                <p className="text-gray-600 text-xs">{p.teamName}</p>
              </div>
              <span className={`text-right text-sm ${dollarColor(p.crack)}`}>
                {p.crack >= 0 ? '+' : ''}${Math.abs(p.crack).toFixed(2)}
              </span>
              <span className={`text-right text-sm ${dollarColor(r2(p.greenie + p.chip))}`}>
                {r2(p.greenie + p.chip) >= 0 ? '+' : ''}${Math.abs(r2(p.greenie + p.chip)).toFixed(2)}
              </span>
              <span className={`text-right text-sm font-black ${dollarColor(p.net)}`}>
                {p.net >= 0 ? '+' : ''}${Math.abs(p.net).toFixed(2)}
              </span>
            </div>
          ))}
        </section>

        {/* Breakdown detail */}
        <section className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-white font-bold text-lg mb-3">Breakdown</h2>
          <div className="space-y-3">
            {breakdown.map(p => (
              <div key={p.playerId} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white font-bold">{p.name}</span>
                  <span className={`font-black ${dollarColor(p.net)}`}>
                    {p.net >= 0 ? '+' : ''}${Math.abs(p.net).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'Crack points', value: p.crack },
                    { label: 'Greenie bets',  value: p.greenie },
                    { label: 'Poker chips',   value: p.chip },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className={dollarColor(value)}>
                        {value >= 0 ? '+' : ''}${Math.abs(value).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full py-4 rounded-2xl bg-gray-800 text-white font-bold text-base active:scale-95 transition-all"
          >
            📋 Copy Summary to Clipboard
          </button>
          <button
            onClick={handleReset}
            className="w-full py-4 rounded-2xl bg-red-950 border border-red-900/50 text-red-400 font-bold text-base active:scale-95 transition-all"
          >
            Start New Round
          </button>
        </div>

        <div className="h-4" />
      </main>
    </div>
  )
}
