import { useMemo } from 'react'
import { useRound } from '../context/RoundContext.jsx'
import {
  getHolePointAwards,
  getTeamPointsBefore,
  getChipHolderBefore,
  computeTeamDollarsFromPoints,
  r2,
} from '../utils/calculations.js'

// ─── Shared sub-components ───────────────────────────────────────────────────

function SectionLabel({ children }) {
  return <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{children}</p>
}

function ChoiceBtn({ selected, onClick, children, color = 'yellow' }) {
  const active = {
    yellow: 'bg-yellow-500 text-gray-950 border-2 border-yellow-400 shadow-lg shadow-yellow-900/30',
    green:  'bg-green-600  text-white    border-2 border-green-400  shadow-lg shadow-green-900/30',
    red:    'bg-red-600    text-white    border-2 border-red-400    shadow-lg shadow-red-900/30',
    orange: 'bg-orange-600 text-white    border-2 border-orange-400 shadow-lg shadow-orange-900/30',
  }
  return (
    <button
      onClick={() => { onClick(); if (navigator.vibrate) navigator.vibrate(15) }}
      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
        selected
          ? active[color]
          : 'bg-gray-800 text-white border-2 border-gray-600 hover:border-gray-500 hover:bg-gray-750'
      }`}
    >
      {children}
    </button>
  )
}

function PlayerGrid({ value, onChange, players, label, noneLabel = 'None / Tie' }) {
  return (
    <div className="mb-5">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        <ChoiceBtn selected={value === null} onClick={() => onChange(null)}>
          {noneLabel}
        </ChoiceBtn>
        {players.map(p => (
          <ChoiceBtn key={p.id} selected={value === p.id} onClick={() => onChange(p.id)}>
            {p.name}
          </ChoiceBtn>
        ))}
      </div>
    </div>
  )
}

function TeamGrid({ value, onChange, teams, label }) {
  return (
    <div className="mb-5">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        <ChoiceBtn selected={value === null} onClick={() => onChange(null)}>Tie / None</ChoiceBtn>
        {teams.map(t => (
          <ChoiceBtn key={t.id} selected={value === t.id} onClick={() => onChange(t.id)}>
            {t.name}
          </ChoiceBtn>
        ))}
      </div>
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HoleScreen() {
  const { state, dispatch } = useRound()
  const { round, holeNumber } = state
  const hole    = round.holes[holeNumber - 1]
  const holeIdx = holeNumber - 1

  const update = (updates) =>
    dispatch({ type: 'UPDATE_HOLE', payload: { holeNumber, updates } })

  // Team point totals before this hole (for crack gating)
  const pointsBefore = useMemo(
    () => getTeamPointsBefore(round.holes, holeIdx, round.players),
    [round.holes, holeIdx, round.players]
  )

  // Crack gating — only for exactly 2 teams
  const crackEligibleTeamId = useMemo(() => {
    if (round.teams.length !== 2) return null
    const [t1, t2] = round.teams
    const p1 = pointsBefore[t1.id] || 0
    const p2 = pointsBefore[t2.id] || 0
    if (p1 < p2) return t1.id
    if (p2 < p1) return t2.id
    return null // tied — neither can crack
  }, [pointsBefore, round.teams])

  const getTeamName = (id) => round.teams.find(t => t.id === id)?.name ?? id
  const getNonCrackingTeamId = () =>
    round.teams.find(t => t.id !== hole.crack.crackingTeamId)?.id

  const handleCrack = (action, teamId) => {
    if (navigator.vibrate) navigator.vibrate([30, 20, 60])
    if (action === 'crack') {
      update({ crack: { status: 'cracked', crackingTeamId: teamId, multiplier: 2 } })
    } else if (action === 'recrack') {
      update({ crack: { ...hole.crack, status: 'recracked', multiplier: 3 } })
    } else if (action === 'recrack2') {
      update({ crack: { ...hole.crack, status: 'recracked2', multiplier: 4 } })
    } else if (action === 'undo') {
      update({ crack: { status: 'none', crackingTeamId: null, multiplier: 1 } })
    }
  }

  // Chip display
  const chipHolderBefore = getChipHolderBefore(round.holes, holeNumber)
  const chipHolderName   = chipHolderBefore
    ? round.players.find(p => p.id === chipHolderBefore)?.name
    : null
  const isFrontNine  = holeNumber <= 9
  const isChipPayoff = holeNumber === 9 || holeNumber === 18

  // Running team dollar totals for footer
  const teamDollars = useMemo(
    () => computeTeamDollarsFromPoints(round),
    [round]
  )

  // Hole completion indicator: par selected + all major fields touched
  const isComplete = hole.par !== null

  // Nav helpers
  const goHole = (n) =>
    dispatch({ type: 'NAVIGATE', payload: { screen: 'hole', holeNumber: n } })
  const goOverview = () =>
    dispatch({ type: 'NAVIGATE', payload: { screen: 'overview' } })
  const goSettle = () =>
    dispatch({ type: 'NAVIGATE', payload: { screen: 'settlement' } })

  // ── Multiplier display
  const multLabel = ['', '×1 Base', '×2 Cracked!', '×3 Re-cracked!', '×4 MAX!'][hole.crack.multiplier]
  const multColor = ['', 'text-gray-400', 'text-orange-400', 'text-red-400', 'text-red-500'][hole.crack.multiplier]

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 pt-safe">
        <div className="flex items-center px-3 py-3 gap-2">
          {/* Prev */}
          <button
            onClick={() => goHole(holeNumber - 1)}
            disabled={holeNumber === 1}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-800 text-white disabled:opacity-25 active:scale-95 transition-all text-xl"
          >
            ‹
          </button>

          {/* Center */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-white font-black text-xl">Hole {holeNumber}</span>
              {hole.par && (
                <span className="bg-green-900 text-green-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  Par {hole.par}
                </span>
              )}
              {hole.crack.multiplier > 1 && (
                <span className="bg-orange-900 text-orange-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  ×{hole.crack.multiplier}
                </span>
              )}
            </div>
          </div>

          {/* Overview */}
          <button
            onClick={goOverview}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-800 text-white active:scale-95 transition-all text-lg"
            title="Overview"
          >
            ☰
          </button>

          {/* Next / Finish */}
          {holeNumber === 18 ? (
            <button
              onClick={goSettle}
              className="px-3 h-11 flex items-center justify-center rounded-xl bg-yellow-500 text-gray-950 font-bold text-sm active:scale-95 transition-all"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={() => goHole(holeNumber + 1)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-800 text-white active:scale-95 transition-all text-xl"
            >
              ›
            </button>
          )}
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe">

        {/* 1. Par toggle */}
        <section className="bg-gray-900 rounded-2xl p-4">
          <SectionLabel>Par</SectionLabel>
          <div className="flex gap-3">
            <ChoiceBtn selected={hole.par === 3} onClick={() => update({ par: 3, closestToPin: null, greenieResult: null, longestDrive: null, gir: null })}>
              Par 3
            </ChoiceBtn>
            <ChoiceBtn selected={hole.par !== null && hole.par !== 3} onClick={() => update({ par: 4, closestToPin: null, greenieResult: null })}>
              Par 4 / 5
            </ChoiceBtn>
          </div>
        </section>

        {hole.par === null && (
          <p className="text-center text-gray-600 text-sm py-4">Select par to continue ↑</p>
        )}

        {hole.par !== null && (
          <>
            {/* 2. Crack section (2-team only) */}
            {round.teams.length === 2 && (
              <section className="bg-gray-900 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Crack</SectionLabel>
                  <span className={`text-sm font-bold ${multColor}`}>{multLabel}</span>
                </div>

                {hole.crack.status === 'none' && (
                  crackEligibleTeamId ? (
                    <button
                      onClick={() => handleCrack('crack', crackEligibleTeamId)}
                      className="w-full py-3.5 rounded-xl bg-orange-700 text-white font-black text-lg active:scale-95 transition-all"
                    >
                      🔥 {getTeamName(crackEligibleTeamId)}: CRACK!
                    </button>
                  ) : (
                    <p className="text-gray-600 text-sm text-center py-1">Teams are tied — no crack available</p>
                  )
                )}

                {hole.crack.status === 'cracked' && (
                  <div className="space-y-2">
                    <p className="text-orange-400 text-sm font-medium">
                      {getTeamName(hole.crack.crackingTeamId)} cracked! Point values doubled (×2)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCrack('recrack')}
                        className="flex-1 py-3 rounded-xl bg-red-700 text-white font-black text-base active:scale-95 transition-all"
                      >
                        🔥🔥 {getTeamName(getNonCrackingTeamId())}: RE-CRACK!
                      </button>
                      <button
                        onClick={() => handleCrack('undo')}
                        className="px-4 py-3 rounded-xl bg-gray-700 text-gray-300 text-sm active:scale-95 transition-all"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                )}

                {hole.crack.status === 'recracked' && (
                  <div className="space-y-2">
                    <p className="text-red-400 text-sm font-medium">
                      Re-cracked! ×3 — {getTeamName(hole.crack.crackingTeamId)} can re-crack again
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCrack('recrack2')}
                        className="flex-1 py-3 rounded-xl bg-red-800 text-white font-black text-base active:scale-95 transition-all"
                      >
                        🔥🔥🔥 {getTeamName(hole.crack.crackingTeamId)}: RE-CRACK 2!
                      </button>
                      <button
                        onClick={() => handleCrack('undo')}
                        className="px-4 py-3 rounded-xl bg-gray-700 text-gray-300 text-sm active:scale-95 transition-all"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                )}

                {hole.crack.status === 'recracked2' && (
                  <div className="space-y-2">
                    <p className="text-red-500 font-black text-center text-lg">🔥 ×4 MAXIMUM! 🔥</p>
                    <button
                      onClick={() => handleCrack('undo')}
                      className="w-full py-2 rounded-xl bg-gray-700 text-gray-300 text-sm active:scale-95 transition-all"
                    >
                      Undo
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* 3. Points */}
            <section className="bg-gray-900 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Points</h3>
                <span className="text-gray-500 text-xs">
                  {hole.par === 3 ? '3 pts available' : '4 pts available'} × ${r2(round.config.crackPointValue * hole.crack.multiplier).toFixed(2)}/pt
                </span>
              </div>

              {hole.par === 3 ? (
                <>
                  <PlayerGrid
                    label="Closest to Pin (must be on green)"
                    value={hole.closestToPin}
                    onChange={v => update({ closestToPin: v, greenieResult: v === null ? null : hole.greenieResult })}
                    players={round.players}
                    noneLabel="No one on green"
                  />

                  {hole.closestToPin && (
                    <div className="mb-5 bg-gray-850 border border-gray-700 rounded-xl p-3">
                      <SectionLabel>
                        Greenie — {round.players.find(p => p.id === hole.closestToPin)?.name}: par or better?
                      </SectionLabel>
                      <div className="flex gap-2">
                        <ChoiceBtn
                          selected={hole.greenieResult === 'par_or_better'}
                          onClick={() => update({ greenieResult: 'par_or_better' })}
                          color="green"
                        >
                          ✓ Yes — Par or Better (+${round.config.greenieParReward})
                        </ChoiceBtn>
                        <ChoiceBtn
                          selected={hole.greenieResult === 'bogey_worse'}
                          onClick={() => update({ greenieResult: 'bogey_worse' })}
                          color="red"
                        >
                          ✗ No — Bogey+ (−${round.config.greenieBogeyPenalty})
                        </ChoiceBtn>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <PlayerGrid
                    label="Longest Drive (in fairway)"
                    value={hole.longestDrive}
                    onChange={v => update({ longestDrive: v })}
                    players={round.players}
                    noneLabel="No award"
                  />
                  <PlayerGrid
                    label="Green in Regulation"
                    value={hole.gir}
                    onChange={v => update({ gir: v })}
                    players={round.players}
                    noneLabel="No award"
                  />
                </>
              )}

              <PlayerGrid
                label="Individual Low Score"
                value={hole.individualLow}
                onChange={v => update({ individualLow: v })}
                players={round.players}
              />

              <TeamGrid
                label="Lowest Combined Team Score"
                value={hole.lowTeam}
                onChange={v => update({ lowTeam: v })}
                teams={round.teams}
              />
            </section>

            {/* 4. Poker chip */}
            <section className="bg-gray-900 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold">
                  Poker Chip — {isFrontNine ? 'Front 9' : 'Back 9'}
                </h3>
                {isChipPayoff && (
                  <span className="text-yellow-400 text-xs font-bold bg-yellow-900/30 px-2 py-1 rounded-full">
                    💰 Pays out!
                  </span>
                )}
              </div>

              <p className="text-gray-500 text-xs mb-3">
                Current holder: <span className="text-gray-300 font-medium">{chipHolderName ?? 'None yet'}</span>
                {isChipPayoff && chipHolderName && ` — collects $${round.config.pokerChipPayout} from each player`}
              </p>

              <SectionLabel>Did anyone earn the chip this hole? (putt longer than flagstick)</SectionLabel>
              <div className="flex flex-wrap gap-2">
                <ChoiceBtn selected={hole.chipEarnedBy === null} onClick={() => update({ chipEarnedBy: null })}>
                  No
                </ChoiceBtn>
                {round.players.map(p => (
                  <ChoiceBtn key={p.id} selected={hole.chipEarnedBy === p.id} onClick={() => update({ chipEarnedBy: p.id })}>
                    {p.name}
                  </ChoiceBtn>
                ))}
              </div>
            </section>

          </>
        )}

        <div className="h-2" />
      </main>

      {/* ── Sticky footer — running totals ── */}
      <footer className="sticky bottom-0 bg-gray-900 border-t border-gray-800 pb-safe">
        <div className="px-4 py-2.5 flex gap-3 overflow-x-auto">
          {round.teams.map(team => {
            const dollars = r2(teamDollars[team.id] || 0)
            return (
              <div key={team.id} className="flex-shrink-0 text-center">
                <p className="text-gray-500 text-xs leading-none">{team.name}</p>
                <p className={`font-black text-sm leading-tight ${
                  dollars > 0 ? 'text-green-400' : dollars < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {dollars >= 0 ? '+' : ''}${Math.abs(dollars).toFixed(2)}
                </p>
              </div>
            )
          })}
          <div className="flex-1" />
          <button onClick={goOverview} className="text-gray-500 text-xs self-center underline">
            Overview
          </button>
        </div>
      </footer>
    </div>
  )
}
