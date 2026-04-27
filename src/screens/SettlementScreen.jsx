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

  const dc = (v) => v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-open-muted'

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
    <div className="min-h-dvh bg-open-950 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-open-900 border-b border-open-700 pt-safe">
        <div className="px-4 pt-4 pb-5">
          <button onClick={goOverview} className="text-open-amber text-sm font-medium active:opacity-60 mb-3 flex items-center gap-1">
            ‹ Back to Overview
          </button>
          <div className="text-center">
            <p className="text-open-amber text-[10px] tracking-[0.45em] uppercase font-bold mb-1">The</p>
            <h1 className="font-serif text-3xl font-black text-open-cream tracking-tight leading-none">
              SETTLEMENT
            </h1>
            <div className="h-px bg-open-amber/50 mt-3 mx-auto w-20" />
            <p className="text-open-muted text-[10px] tracking-[0.35em] uppercase mt-2">
              {round.name || round.course || 'Round Complete'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-safe">

        {/* Who pays whom */}
        <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
          <div className="bg-open-amber px-4 py-2.5">
            <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">Who Pays Whom</h2>
          </div>
          {txns.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🤝</p>
              <p className="text-green-400 font-black text-base">All square!</p>
              <p className="text-open-muted text-sm mt-1">No payments needed.</p>
            </div>
          ) : (
            <div className="divide-y divide-open-700/50">
              {txns.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-red-400 font-bold text-sm flex-1">{t.from.name}</span>
                  <span className="text-open-muted text-sm">pays</span>
                  <span className="text-open-amber font-black text-lg">${t.amount.toFixed(2)}</span>
                  <span className="text-open-muted text-sm">to</span>
                  <span className="text-green-400 font-bold text-sm flex-1 text-right">{t.to.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Per-player net — leaderboard style */}
        <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
          <div
            className="bg-open-amber px-3 py-2.5 text-open-950 text-xs font-black uppercase tracking-[0.2em]"
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}
          >
            <span>Player</span>
            <span className="text-right">Crack</span>
            <span className="text-right">Green+🪙</span>
            <span className="text-right">Net</span>
          </div>
          {breakdown.map((p, idx) => (
            <div
              key={p.playerId}
              className={`px-3 py-3.5 border-b border-open-700/50 last:border-0 items-center ${
                idx % 2 === 0 ? 'bg-open-900' : 'bg-open-800/30'
              }`}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}
            >
              <div>
                <p className="text-open-cream text-sm font-bold leading-tight">{p.name}</p>
                <p className="text-open-muted/60 text-xs">{p.teamName}</p>
              </div>
              <span className={`text-right text-sm ${dc(p.crack)}`}>
                {p.crack >= 0 ? '+' : ''}${Math.abs(p.crack).toFixed(2)}
              </span>
              <span className={`text-right text-sm ${dc(r2(p.greenie + p.chip))}`}>
                {r2(p.greenie + p.chip) >= 0 ? '+' : ''}${Math.abs(r2(p.greenie + p.chip)).toFixed(2)}
              </span>
              <span className={`text-right text-sm font-black ${dc(p.net)}`}>
                {p.net >= 0 ? '+' : ''}${Math.abs(p.net).toFixed(2)}
              </span>
            </div>
          ))}
        </section>

        {/* Breakdown detail */}
        <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
          <div className="bg-open-amber px-4 py-2.5">
            <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">Breakdown</h2>
          </div>
          <div className="px-4 py-3 space-y-4">
            {breakdown.map(p => (
              <div key={p.playerId} className="border-b border-open-700/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-open-cream font-bold">{p.name}</span>
                  <span className={`font-black ${dc(p.net)}`}>
                    {p.net >= 0 ? '+' : ''}${Math.abs(p.net).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Crack points', value: p.crack },
                    { label: 'Greenie bets',  value: p.greenie },
                    { label: 'Poker chips',   value: p.chip },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-open-muted">{label}</span>
                      <span className={dc(value)}>
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
            className="w-full py-4 rounded-2xl bg-open-800 text-open-cream font-bold text-base active:scale-95 transition-all border border-open-700"
          >
            📋 Copy Summary to Clipboard
          </button>
          <button
            onClick={handleReset}
            className="w-full py-4 rounded-2xl bg-open-950 border border-red-900/40 text-red-400 font-bold text-base active:scale-95 transition-all"
          >
            Start New Round
          </button>
        </div>

        <div className="h-4" />
      </main>
    </div>
  )
}
