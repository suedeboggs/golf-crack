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
  return <p className="text-open-muted text-xs font-bold uppercase tracking-[0.2em] mb-2">{children}</p>
}

function ChoiceBtn({ selected, onClick, children, color = 'amber' }) {
  const active = {
    amber:  'bg-open-amber  text-open-950  border-2 border-open-amber   shadow-lg shadow-open-amber/20',
    green:  'bg-green-600   text-white      border-2 border-green-400    shadow-lg shadow-green-900/30',
    red:    'bg-red-600     text-white      border-2 border-red-400      shadow-lg shadow-red-900/30',
    orange: 'bg-orange-600  text-white      border-2 border-orange-400   shadow-lg shadow-orange-900/30',
  }
  return (
    <button
      onClick={() => { onClick(); if (navigator.vibrate) navigator.vibrate(15) }}
      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
        selected
          ? active[color]
          : 'bg-open-800 text-open-cream border-2 border-open-700 hover:border-open-600'
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

  // Nav helpers
  const goHole = (n) =>
    dispatch({ type: 'NAVIGATE', payload: { screen: 'hole', holeNumber: n } })
  const goOverview = () =>
    dispatch({ type: 'NAVIGATE', payload: { screen: 'overview' } })
  const goSettle = () =>
    dispatch({ type: 'NAVIGATE', payload: { screen: 'settlement' } })

  // ── Multiplier display
  const multLabel = ['', '', '×2 Cracked!', '×3 Re-cracked!', '×4 MAX!'][hole.crack.multiplier]
  const multColor = ['', '', 'text-orange-400', 'text-red-400', 'text-red-500'][hole.crack.multiplier]

  return (
    <div className="min-h-dvh bg-open-950 flex flex-col">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-open-900 border-b border-open-700 pt-safe">
        <div className="flex items-center px-3 py-3 gap-2">
          {/* Prev */}
          <button
            onClick={() => goHole(holeNumber - 1)}
            disabled={holeNumber === 1}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-open-800 text-open-cream disabled:opacity-25 active:scale-95 transition-all text-xl border border-open-700"
          >
            ‹
          </button>

          {/* Center */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="font-serif font-black text-xl text-open-cream">Hole {holeNumber}</span>
              {hole.par && (
                <span className="bg-open-700 text-open-muted text-xs font-bold px-2 py-0.5 rounded-full">
                  Par {hole.par}
                </span>
              )}
              {hole.crack.multiplier > 1 && (
                <span className="bg-orange-900/50 text-orange-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  ×{hole.crack.multiplier}
                </span>
              )}
            </div>
          </div>

          {/* Overview */}
          <button
            onClick={goOverview}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-open-800 text-open-cream active:scale-95 transition-all text-lg border border-open-700"
            title="Overview"
          >
            ☰
          </button>

          {/* Next / Finish */}
          {holeNumber === 18 ? (
            <button
              onClick={goSettle}
              className="px-3 h-11 flex items-center justify-center rounded-xl bg-open-amber text-open-950 font-black text-sm active:scale-95 transition-all"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={() => goHole(holeNumber + 1)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-open-800 text-open-cream active:scale-95 transition-all text-xl border border-open-700"
            >
              ›
            </button>
          )}
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-safe">

        {/* 1. Par toggle */}
        <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
          <div className="bg-open-amber px-4 py-2.5">
            <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">Par</h2>
          </div>
          <div className="p-4 flex gap-3">
            <ChoiceBtn selected={hole.par === 3} onClick={() => update({ par: 3, closestToPin: null, greenieResult: null, longestDrive: null, gir: null })}>
              Par 3
            </ChoiceBtn>
            <ChoiceBtn selected={hole.par !== null && hole.par !== 3} onClick={() => update({ par: 4, closestToPin: null, greenieResult: null })}>
              Par 4 / 5
            </ChoiceBtn>
          </div>
        </section>

        {hole.par === null && (
          <p className="text-center text-open-muted/60 text-sm py-4">Select par to continue ↑</p>
        )}

        {hole.par !== null && (
          <>
            {/* 2. Crack section (2-team only) */}
            {round.teams.length === 2 && (
              <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
                <div className="bg-open-amber px-4 py-2.5 flex items-center justify-between">
                  <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">Crack</h2>
                  {hole.crack.multiplier > 1 && (
                    <span className={`text-xs font-black ${multColor}`}>{multLabel}</span>
                  )}
                </div>
                <div className="p-4">
                  {hole.crack.status === 'none' && (
                    crackEligibleTeamId ? (
                      <button
                        onClick={() => handleCrack('crack', crackEligibleTeamId)}
                        className="w-full py-3.5 rounded-xl bg-orange-700 text-white font-black text-lg active:scale-95 transition-all border border-orange-600"
                      >
                        🔥 {getTeamName(crackEligibleTeamId)}: CRACK!
                      </button>
                    ) : (
                      <p className="text-open-muted/60 text-sm text-center py-1">Teams are tied — no crack available</p>
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
                          className="flex-1 py-3 rounded-xl bg-red-700 text-white font-black text-base active:scale-95 transition-all border border-red-600"
                        >
                          🔥🔥 {getTeamName(getNonCrackingTeamId())}: RE-CRACK!
                        </button>
                        <button
                          onClick={() => handleCrack('undo')}
                          className="px-4 py-3 rounded-xl bg-open-800 text-open-muted text-sm active:scale-95 transition-all border border-open-700"
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
                          className="flex-1 py-3 rounded-xl bg-red-800 text-white font-black text-base active:scale-95 transition-all border border-red-700"
                        >
                          🔥🔥🔥 {getTeamName(hole.crack.crackingTeamId)}: RE-CRACK 2!
                        </button>
                        <button
                          onClick={() => handleCrack('undo')}
                          className="px-4 py-3 rounded-xl bg-open-800 text-open-muted text-sm active:scale-95 transition-all border border-open-700"
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
                        className="w-full py-2 rounded-xl bg-open-800 text-open-muted text-sm active:scale-95 transition-all border border-open-700"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 3. Points */}
            <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
              <div className="bg-open-amber px-4 py-2.5 flex items-center justify-between">
                <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">Points</h2>
                <span className="text-open-950/70 text-xs font-bold">
                  {hole.par === 3 ? '3 pts' : '4 pts'} × ${r2(round.config.crackPointValue * hole.crack.multiplier).toFixed(2)}/pt
                </span>
              </div>
              <div className="p-4">
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
                      <div className="mb-5 bg-open-800 border border-open-700 rounded-xl p-3">
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
              </div>
            </section>

            {/* 4. Poker chip */}
            <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
              <div className="bg-open-amber px-4 py-2.5 flex items-center justify-between">
                <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">
                  Poker Chip — {isFrontNine ? 'Front 9' : 'Back 9'}
                </h2>
                {isChipPayoff && (
                  <span className="text-open-950 text-xs font-black bg-open-950/20 px-2 py-0.5 rounded-full">
                    💰 Pays out!
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-open-muted text-xs mb-3">
                  Current holder: <span className="text-open-cream font-medium">{chipHolderName ?? 'None yet'}</span>
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
              </div>
            </section>

          </>
        )}

        <div className="h-2" />
      </main>

      {/* ── Sticky footer — running totals ── */}
      <footer className="sticky bottom-0 bg-open-900 border-t border-open-700 pb-safe">
        <div className="px-4 py-2.5 flex gap-4 overflow-x-auto items-center">
          {round.teams.map(team => {
            const dollars = r2(teamDollars[team.id] || 0)
            return (
              <div key={team.id} className="flex-shrink-0 text-center">
                <p className="text-open-muted text-xs leading-none">{team.name}</p>
                <p className={`font-black text-sm leading-tight ${
                  dollars > 0 ? 'text-green-400' : dollars < 0 ? 'text-red-400' : 'text-open-muted'
                }`}>
                  {dollars >= 0 ? '+' : ''}${Math.abs(dollars).toFixed(2)}
                </p>
              </div>
            )
          })}
          <div className="flex-1" />
          <button onClick={goOverview} className="text-open-amber text-xs self-center font-medium">
            Overview
          </button>
          <span className="text-open-700 text-xs self-center">|</span>
          <button
            onClick={() => dispatch({ type: 'NAVIGATE', payload: { screen: 'setup' } })}
            className="text-open-muted text-xs self-center"
          >
            Setup
          </button>
        </div>
      </footer>
    </div>
  )
}
