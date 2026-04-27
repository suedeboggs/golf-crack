import { useState } from 'react'
import { useRound } from '../context/RoundContext.jsx'

const TEAM_SLOTS = [
  { slot: 'A',    label: 'Team A', active: 'bg-blue-700 text-white border-blue-500' },
  { slot: 'B',    label: 'Team B', active: 'bg-red-700 text-white border-red-500' },
  { slot: 'C',    label: 'Team C', active: 'bg-purple-700 text-white border-purple-500' },
  { slot: 'solo', label: 'Solo',   active: 'bg-open-600 text-open-cream border-open-600' },
]

const SLOT_DOT = { A: 'bg-blue-600', B: 'bg-red-600', C: 'bg-purple-600', solo: 'bg-open-600' }

let _idCounter = 0
const uid = () => `p-${Date.now()}-${_idCounter++}`

export default function SetupScreen() {
  const { state, dispatch } = useRound()
  const hasRound = !!state.round

  const [nameInput, setNameInput] = useState('')
  const [players, setPlayers] = useState(
    hasRound ? state.round.players.map(p => {
      const team = state.round.teams.find(t => t.id === p.teamId)
      return { id: p.id, name: p.name, slot: team?.slot ?? 'A' }
    }) : []
  )
  const [teamNames, setTeamNames] = useState(
    hasRound
      ? { A: state.round.teams.find(t => t.slot === 'A')?.name ?? 'Team A',
          B: state.round.teams.find(t => t.slot === 'B')?.name ?? 'Team B',
          C: state.round.teams.find(t => t.slot === 'C')?.name ?? 'Team C' }
      : { A: 'Team A', B: 'Team B', C: 'Team C' }
  )
  const [config, setConfig] = useState(
    hasRound ? state.round.config : {
      crackPointValue: 0.50, greenieParReward: 5, greenieBogeyPenalty: 10, pokerChipPayout: 5,
    }
  )
  const [meta, setMeta] = useState(
    hasRound
      ? { name: state.round.name, course: state.round.course, date: state.round.date }
      : { name: '', course: '', date: new Date().toISOString().split('T')[0] }
  )
  const [showMeta, setShowMeta] = useState(false)

  const addPlayer = () => {
    const name = nameInput.trim()
    if (!name) return
    const slot = players.length % 2 === 0 ? 'A' : 'B'
    setPlayers(prev => [...prev, { id: uid(), name, slot }])
    setNameInput('')
  }

  const slotsUsed  = [...new Set(players.map(p => p.slot))]
  const canStart   = players.length >= 2 && players.every(p => p.slot)

  const buildPayload = () => {
    const teams = [], finalPlayers = []
    slotsUsed.forEach(slot => {
      const sp = players.filter(p => p.slot === slot)
      if (slot === 'solo') {
        sp.forEach(p => {
          const tid = `team-solo-${p.id}`
          teams.push({ id: tid, name: p.name, slot: 'solo' })
          finalPlayers.push({ id: p.id, name: p.name, teamId: tid })
        })
      } else {
        const tid = `team-${slot}`
        teams.push({ id: tid, name: teamNames[slot] || `Team ${slot}`, slot })
        sp.forEach(p => finalPlayers.push({ id: p.id, name: p.name, teamId: tid }))
      }
    })
    return { teams, players: finalPlayers }
  }

  const handleSave = () => {
    const { teams, players: fp } = buildPayload()
    dispatch({ type: 'UPDATE_ROUND_SETUP', payload: { players: fp, teams, config, ...meta } })
    dispatch({ type: 'NAVIGATE', payload: { screen: 'hole', holeNumber: state.holeNumber } })
    if (navigator.vibrate) navigator.vibrate(20)
  }

  const handleNewRound = () => {
    if (!confirm('Start a new round? All hole data will be cleared.')) return
    const { teams, players: fp } = buildPayload()
    dispatch({ type: 'START_ROUND', payload: { players: fp, teams, config, ...meta } })
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const handleBack = () =>
    dispatch({ type: 'NAVIGATE', payload: { screen: 'hole', holeNumber: state.holeNumber } })

  const cfgField = (key, label, step = '0.25') => (
    <div className="flex items-center justify-between py-3 border-b border-open-700">
      <span className="text-open-muted text-sm">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-open-muted text-sm">$</span>
        <input
          type="number" min="0" step={step} value={config[key]}
          onChange={e => setConfig(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
          className="w-20 bg-open-800 border border-open-700 rounded-lg px-3 py-2 text-right text-open-cream text-sm focus:outline-none focus:ring-2 focus:ring-open-amber"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-open-950 flex flex-col">

      {/* ── Header ── */}
      <div className="bg-open-900 pt-safe border-b border-open-700">
        <div className="px-4 pt-4 pb-5">
          {hasRound && (
            <button onClick={handleBack} className="text-open-amber text-sm font-medium active:opacity-60 mb-3 flex items-center gap-1">
              ‹ Back to Round
            </button>
          )}
          {/* Logo — Open Championship editorial style */}
          <div className="text-center">
            <p className="text-open-amber text-[10px] tracking-[0.45em] uppercase font-bold mb-1">The</p>
            <h1 className="font-serif text-4xl font-black text-open-cream tracking-tight leading-none">
              CRACK CASH
            </h1>
            <div className="h-px bg-open-amber/50 mt-3 mx-auto w-20" />
            <p className="text-open-muted text-[10px] tracking-[0.35em] uppercase mt-2">
              {hasRound ? 'Edit Round Setup' : 'Golf Money Tracker'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-safe">

        {/* Players */}
        <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
          {/* Section header — leaderboard style */}
          <div className="bg-open-amber px-4 py-2.5">
            <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">Players</h2>
          </div>

          <div className="px-4 py-3 flex gap-2 border-b border-open-700">
            <input
              type="text" placeholder="Player name" value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
              className="flex-1 bg-open-800 border border-open-700 rounded-xl px-4 py-3 text-open-cream placeholder-open-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-open-amber"
            />
            <button
              onClick={addPlayer}
              className="bg-open-amber text-open-950 font-black px-4 py-3 rounded-xl text-sm active:scale-95 transition-transform"
            >
              + Add
            </button>
          </div>

          {players.length === 0 && (
            <p className="px-4 py-4 text-open-muted text-sm">Add at least 2 players to start.</p>
          )}

          {players.map(player => (
            <div key={player.id} className="px-4 py-3 border-b border-open-700/50 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text" value={player.name}
                  onChange={e => setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, name: e.target.value } : p))}
                  className="bg-transparent text-open-cream font-semibold text-sm focus:outline-none border-b border-transparent focus:border-open-amber flex-1 mr-2 py-0.5"
                />
                <button
                  onClick={() => setPlayers(prev => prev.filter(p => p.id !== player.id))}
                  className="text-open-muted/60 hover:text-red-400 text-xl leading-none px-1 shrink-0"
                >×</button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {TEAM_SLOTS.map(({ slot, label, active }) => (
                  <button
                    key={slot}
                    onClick={() => setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, slot } : p))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      player.slot === slot
                        ? active
                        : 'bg-open-800 text-open-muted border-open-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Team names */}
        {slotsUsed.filter(s => s !== 'solo').length > 0 && (
          <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
            <div className="bg-open-amber px-4 py-2.5">
              <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">Team Names</h2>
            </div>
            <div className="px-4 py-3 space-y-2">
              {['A', 'B', 'C'].filter(slot => slotsUsed.includes(slot)).map(slot => (
                <div key={slot} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${SLOT_DOT[slot]}`} />
                  <input
                    type="text" value={teamNames[slot]}
                    onChange={e => setTeamNames(prev => ({ ...prev, [slot]: e.target.value }))}
                    className="flex-1 bg-open-800 border border-open-700 rounded-xl px-3 py-2.5 text-open-cream text-sm focus:outline-none focus:ring-2 focus:ring-open-amber"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bet settings */}
        <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
          <div className="bg-open-amber px-4 py-2.5">
            <h2 className="text-open-950 font-black text-xs uppercase tracking-[0.25em]">Bet Settings</h2>
          </div>
          <div className="px-4">
            {cfgField('crackPointValue',    'Crack — per point',        '0.25')}
            {cfgField('greenieParReward',   'Greenie — par or better',  '1')}
            {cfgField('greenieBogeyPenalty','Greenie — bogey or worse', '1')}
            {cfgField('pokerChipPayout',    'Poker chip — per player',  '1')}
          </div>
        </section>

        {/* Round details */}
        <section className="bg-open-900 rounded-2xl overflow-hidden border border-open-700">
          <button
            onClick={() => setShowMeta(v => !v)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-open-muted text-sm"
          >
            <span>Round details (optional)</span>
            <span>{showMeta ? '▲' : '▼'}</span>
          </button>
          {showMeta && (
            <div className="px-4 pb-4 space-y-2 border-t border-open-700">
              {[{ key: 'name', placeholder: 'Round name' }, { key: 'course', placeholder: 'Course name' }].map(({ key, placeholder }) => (
                <input key={key} type="text" placeholder={placeholder} value={meta[key]}
                  onChange={e => setMeta(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full bg-open-800 border border-open-700 rounded-xl px-3 py-2.5 text-open-cream text-sm placeholder-open-muted/60 focus:outline-none focus:ring-2 focus:ring-open-amber mt-2"
                />
              ))}
              <input type="date" value={meta.date}
                onChange={e => setMeta(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-open-800 border border-open-700 rounded-xl px-3 py-2.5 text-open-cream text-sm focus:outline-none focus:ring-2 focus:ring-open-amber mt-2"
              />
            </div>
          )}
        </section>

        {/* Action buttons */}
        {hasRound ? (
          <div className="space-y-3">
            <button
              onClick={handleSave} disabled={!canStart}
              className={`w-full py-4 rounded-2xl font-black text-xl tracking-wide transition-all ${
                canStart ? 'bg-open-amber text-open-950 active:scale-95 shadow-lg shadow-open-amber/20' : 'bg-open-800 text-open-muted cursor-not-allowed'
              }`}
            >
              SAVE &amp; RESUME
            </button>
            <button
              onClick={handleNewRound} disabled={!canStart}
              className="w-full py-3.5 rounded-2xl font-bold text-base border border-open-700 text-open-muted active:scale-95 transition-all"
            >
              Start New Round
            </button>
          </div>
        ) : (
          <button
            disabled={!canStart}
            onClick={() => {
              if (!canStart) return
              const { teams, players: fp } = buildPayload()
              dispatch({ type: 'START_ROUND', payload: { players: fp, teams, config, ...meta } })
              if (navigator.vibrate) navigator.vibrate(30)
            }}
            className={`w-full py-4 rounded-2xl font-black text-xl tracking-wide transition-all ${
              canStart ? 'bg-open-amber text-open-950 active:scale-95 shadow-lg shadow-open-amber/20' : 'bg-open-800 text-open-muted cursor-not-allowed'
            }`}
          >
            START ROUND
          </button>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
