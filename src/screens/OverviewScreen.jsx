import { useMemo } from 'react'
import { useRound } from '../context/RoundContext.jsx'
import {
  getHolePointAwards,
  computeTeamDollarsFromPoints,
  computePlayerGreenies,
  computePlayerChips,
  computeChipHolders,
  r2,
} from '../utils/calculations.js'
import { simplifyDebts } from '../utils/settlement.js'

export default function OverviewScreen() {
  const { state, dispatch } = useRound()
  const { round } = state

  const teamDollars    = useMemo(() => computeTeamDollarsFromPoints(round), [round])
  const greenieDollars = useMemo(() => computePlayerGreenies(round),        [round])
  const chipDollars    = useMemo(() => computePlayerChips(round),           [round])
  const chipHolders    = useMemo(() => computeChipHolders(round.holes),     [round.holes])

  const playerNet = useMemo(() => {
    const net = {}
    round.players.forEach(p => (net[p.id] = 0))
    round.teams.forEach(team => {
      const members = round.players.filter(p => p.teamId === team.id)
      if (!members.length) return
      const pp = (teamDollars[team.id] || 0) / members.length
      members.forEach(p => { net[p.id] += pp })
    })
    round.players.forEach(p => {
      net[p.id] += greenieDollars[p.id] || 0
      net[p.id] += chipDollars[p.id]    || 0
    })
    return net
  }, [round, teamDollars, greenieDollars, chipDollars])

  const txns = useMemo(() => simplifyDebts(playerNet, round.players), [playerNet, round.players])

  const holesEntered = round.holes.filter(h => h.par !== null).length
  const nextHole   = round.holes.findIndex(h => h.par === null)
  const resumeHole = nextHole === -1 ? 18 : nextHole + 1

  const getPlayerName = (id) => round.players.find(p => p.id === id)?.name ?? '—'
  const getTeamName   = (id) => round.teams.find(t => t.id === id)?.name   ?? '—'

  const goHole   = (n) => dispatch({ type: 'NAVIGATE', payload: { screen: 'hole', holeNumber: n } })
  const goSettle = ()  => dispatch({ type: 'NAVIGATE', payload: { screen: 'settlement' } })
  const goSetup  = ()  => dispatch({ type: 'NAVIGATE', payload: { screen: 'setup' } })

  const dc = (v) => v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-400'
  const fmt = (v) => `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`

  const allDone = round.holes.every(h => h.par !== null)

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 pt-safe">
        <div className="flex items-center px-4 py-3 gap-3">
          <button onClick={goSetup} className="text-gray-400 text-sm active:opacity-60">⛳</button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg leading-none">Overview</h1>
            {(round.name || round.course) && (
              <p className="text-gray-500 text-xs mt-0.5">{round.name || round.course}</p>
            )}
          </div>
          {allDone ? (
            <button onClick={goSettle} className="bg-yellow-500 text-gray-950 font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition-all">
              Settle Up
            </button>
          ) : (
            <button onClick={() => goHole(resumeHole)} className="bg-green-600 text-white font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition-all">
              Resume →
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-safe">

        {/* Chip status */}
        <div className="px-4 pt-4 pb-2 flex gap-3">
          {[
            { label: 'Front 9 Chip', holder: chipHolders.front },
            { label: 'Back 9 Chip',  holder: chipHolders.back  },
          ].map(({ label, holder }) => (
            <div key={label} className="flex-1 bg-gray-900 rounded-xl px-3 py-2.5">
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="text-yellow-400 font-bold text-sm mt-0.5">
                {holder ? getPlayerName(holder) : 'Unclaimed'}
              </p>
            </div>
          ))}
        </div>

        {/* Team totals */}
        <div className="px-4 pb-2 flex gap-3 overflow-x-auto">
          {round.teams.map(team => {
            const d = r2(teamDollars[team.id] || 0)
            const pts = round.holes.reduce((acc, h) => {
              getHolePointAwards(h, round.players).filter(a => a.teamId === team.id).forEach(() => acc++)
              return acc
            }, 0)
            return (
              <div key={team.id} className="flex-shrink-0 bg-gray-900 rounded-xl px-4 py-3 min-w-[120px]">
                <p className="text-gray-400 text-xs">{team.name}</p>
                <p className="text-white font-black text-lg leading-tight">{pts} pts</p>
                <p className={`font-bold text-sm ${dc(d)}`}>{fmt(d)}</p>
              </div>
            )
          })}
        </div>

        {/* Player totals — 5-col: Player | Crack | Greenie | Chip | Net */}
        <div className="px-4 pb-3">
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div
              className="px-3 py-2 border-b border-gray-800 text-gray-500 text-xs font-bold uppercase"
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}
            >
              <span>Player</span>
              <span className="text-right">Crack</span>
              <span className="text-right">Green</span>
              <span className="text-right">🪙</span>
              <span className="text-right">Net</span>
            </div>
            {round.players.map(player => {
              const team       = round.teams.find(t => t.id === player.teamId)
              const members    = round.players.filter(p => p.teamId === player.teamId)
              const crackShare = r2((teamDollars[player.teamId] || 0) / (members.length || 1))
              const greenieAmt = r2(greenieDollars[player.id] || 0)
              const chipAmt    = r2(chipDollars[player.id]    || 0)
              const net        = r2(crackShare + greenieAmt + chipAmt)
              return (
                <div
                  key={player.id}
                  className="px-3 py-3 border-b border-gray-800 last:border-0 items-center"
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium leading-tight truncate">{player.name}</p>
                    <p className="text-gray-600 text-xs truncate">{team?.name}</p>
                  </div>
                  <span className={`text-right text-xs ${dc(crackShare)}`}>{fmt(crackShare)}</span>
                  <span className={`text-right text-xs ${dc(greenieAmt)}`}>{fmt(greenieAmt)}</span>
                  <span className={`text-right text-xs ${dc(chipAmt)}`}>{fmt(chipAmt)}</span>
                  <span className={`text-right text-sm font-black ${dc(net)}`}>{fmt(net)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Who Owes Who */}
        {holesEntered > 0 && (
          <div className="px-4 pb-3">
            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 px-1">
              Who Owes Who
            </h2>
            <div className="bg-gray-900 rounded-2xl overflow-hidden">
              {txns.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-green-400 font-bold text-sm">🤝 All square — no payments needed</p>
                </div>
              ) : (
                txns.map((t, i) => (
                  <div key={i} className="flex items-center px-4 py-3.5 border-b border-gray-800 last:border-0 gap-2">
                    <span className="text-red-400 font-bold text-sm flex-1 truncate">{t.from.name}</span>
                    <span className="text-gray-600 text-xs shrink-0">owes</span>
                    <span className="text-yellow-400 font-black text-base shrink-0">${t.amount.toFixed(2)}</span>
                    <span className="text-gray-600 text-xs shrink-0">to</span>
                    <span className="text-green-400 font-bold text-sm flex-1 text-right truncate">{t.to.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Hole-by-hole list */}
        <div className="px-4 pb-4">
          <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 px-1">Hole by Hole</h2>
          <div className="space-y-2">
            {round.holes.map(hole => {
              const awards     = getHolePointAwards(hole, round.players)
              const mult       = hole.crack.multiplier
              const chipEarner = hole.chipEarnedBy ? getPlayerName(hole.chipEarnedBy) : null

              return (
                <button
                  key={hole.number}
                  onClick={() => goHole(hole.number)}
                  className={`w-full text-left bg-gray-900 rounded-xl px-4 py-3 active:opacity-80 transition-all ${
                    !hole.par ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black shrink-0 ${
                        hole.par ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-600'
                      }`}>
                        {hole.number}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-medium">
                            {hole.par ? `Par ${hole.par}` : 'Not entered'}
                          </span>
                          {mult > 1 && (
                            <span className="text-orange-400 text-xs font-bold bg-orange-900/30 px-1.5 py-0.5 rounded">
                              ×{mult}
                            </span>
                          )}
                          {chipEarner && (
                            <span className="text-yellow-400 text-xs">🪙 {chipEarner}</span>
                          )}
                        </div>
                        {awards.length > 0 && (
                          <div className="flex flex-wrap gap-x-2 mt-0.5">
                            {awards.map((a, i) => (
                              <span key={i} className="text-gray-500 text-xs">
                                {a.category}: <span className="text-gray-300">{getTeamName(a.teamId)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {hole.closestToPin && hole.greenieResult && (
                          <span className={`text-xs mt-0.5 block ${hole.greenieResult === 'par_or_better' ? 'text-green-500' : 'text-red-500'}`}>
                            Greenie: {getPlayerName(hole.closestToPin)} {hole.greenieResult === 'par_or_better' ? '✓ par' : '✗ bogey+'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-600 text-lg shrink-0">›</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
