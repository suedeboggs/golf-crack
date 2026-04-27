import { useState } from 'react'
import { useRound } from '../context/RoundContext.jsx'

const TEAM_SLOTS = [
  { slot: 'A', label: 'Team A', color: 'bg-blue-600 text-white',   ring: 'ring-blue-400' },
  { slot: 'B', label: 'Team B', color: 'bg-red-600 text-white',    ring: 'ring-red-400' },
  { slot: 'C', label: 'Team C', color: 'bg-purple-600 text-white', ring: 'ring-purple-400' },
  { slot: 'solo', label: 'Solo', color: 'bg-gray-600 text-white',  ring: 'ring-gray-400' },
]

const SLOT_COLORS = {
  A: 'bg-blue-600',
  B: 'bg-red-600',
  C: 'bg-purple-600',
  solo: 'bg-gray-500',
}

let _idCounter = 0
const uid = () => `p-${Date.now()}-${_idCounter++}`

export default function SetupScreen() {
  const { state, dispatch } = useRound()
  const hasRound = !!state.round

  const [nameInput, setNameInput] = useState('')
  const [players, setPlayers] = useState(
    hasRound ? state.round.players.map(p => {
      const team = state.round.teams.find(t => t.id === p.teamId)
      const slot = team?.slot ?? 'A'
      return { id: p.id, name: p.name, slot }
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
      crackPointValue: 0.50,
      greenieParReward: 5,
      greenieBogeyPenalty: 10,
      pokerChipPayout: 5,
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

  const removePlayer = (id) => setPlayers(prev => prev.filter(p => p.id !== id))
  const assignSlot   = (id, slot) => setPlayers(prev => prev.map(p => p.id === id ? { ...p, slot } : p))

  const slotsUsed = [...new Set(players.map(p => p.slot))]

  const canStart = players.length >= 2 && players.every(p => p.slot)

  const handleStart = () => {
    if (hasRound && !confirm('Start a new round? The current round will be cleared.')) return
    // Build teams from slots
    const teams = []
    const finalPlayers = []

    slotsUsed.forEach(slot => {
      const slotPlayers = players.filter(p => p.slot === slot)
      if (slot === 'solo') {
        slotPlayers.forEach(p => {
          const teamId = `team-solo-${p.id}`
          teams.push({ id: teamId, name: p.name, slot: 'solo' })
          finalPlayers.push({ id: p.id, name: p.name, teamId })
        })
      } else {
        const teamId = `team-${slot}`
        teams.push({ id: teamId, name: teamNames[slot] || `Team ${slot}`, slot })
        slotPlayers.forEach(p => {
          finalPlayers.push({ id: p.id, name: p.name, teamId })
        })
      }
    })

    dispatch({
      type: 'START_ROUND',
      payload: { players: finalPlayers, teams, config, ...meta },
    })
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const handleResume = () => dispatch({ type: 'NAVIGATE', payload: { screen: 'hole', holeNumber: state.holeNumber } })

  const cfgField = (key, label, prefix = '$', step = '0.01') => (
    <div className="flex items-center justify-between py-3 border-b border-gray-800">
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-sm">{prefix}</span>
        <input
          type="number"
          min="0"
          step={step}
          value={config[key]}
          onChange={e => setConfig(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
          className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-right text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-green-950 pt-safe px-4 pb-4 pt-4 text-center border-b border-green-900">
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl">⛳</span>
          <h1 className="text-3xl font-black text-yellow-400 tracking-tight">Crack Cash</h1>
        </div>
        <p className="text-green-400 text-sm mt-1">Golf money tracker</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe">

        {/* Resume banner */}
        {hasRound && (
          <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-bold text-sm">Round in progress</p>
              <p className="text-gray-400 text-xs mt-0.5">
                {state.round.name || state.round.course || 'Untitled Round'} — Hole {state.holeNumber}
              </p>
            </div>
            <button
              onClick={handleResume}
              className="bg-yellow-500 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm active:scale-95 transition-transform"
            >
              Resume
            </button>
          </div>
        )}

        {/* Players */}
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-white font-bold text-lg">Players</h2>
          </div>

          {/* Add player */}
          <div className="px-4 pb-3 flex gap-2">
            <input
              type="text"
              placeholder="Player name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              onClick={addPlayer}
              className="bg-yellow-500 text-gray-950 font-bold px-4 py-3 rounded-xl text-sm active:scale-95 transition-transform"
            >
              + Add
            </button>
          </div>

          {/* Player list */}
          {players.length === 0 && (
            <p className="px-4 pb-4 text-gray-600 text-sm">Add at least 2 players to start.</p>
          )}
          {players.map(player => (
            <div key={player.id} className="px-4 py-3 border-t border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{player.name}</span>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-gray-600 hover:text-red-400 text-lg leading-none px-1"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {TEAM_SLOTS.map(({ slot, label, color, ring }) => (
                  <button
                    key={slot}
                    onClick={() => assignSlot(player.id, slot)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      player.slot === slot
                        ? `${color} ring-2 ${ring} scale-105`
                        : 'bg-gray-800 text-gray-400'
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
          <section className="bg-gray-900 rounded-2xl p-4">
            <h2 className="text-white font-bold text-lg mb-3">Team Names</h2>
            {['A', 'B', 'C']
              .filter(slot => slotsUsed.includes(slot))
              .map(slot => (
                <div key={slot} className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${SLOT_COLORS[slot]}`} />
                  <input
                    type="text"
                    value={teamNames[slot]}
                    onChange={e => setTeamNames(prev => ({ ...prev, [slot]: e.target.value }))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              ))
            }
          </section>
        )}

        {/* Bet settings */}
        <section className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-white font-bold text-lg mb-1">Bet Settings</h2>
          {cfgField('crackPointValue',    'Crack — per point',          '$', '0.25')}
          {cfgField('greenieParReward',   'Greenie — par or better',    '$', '1')}
          {cfgField('greenieBogeyPenalty','Greenie — bogey or worse',   '$', '1')}
          {cfgField('pokerChipPayout',    'Poker chip — per player',    '$', '1')}
        </section>

        {/* Round details (optional) */}
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowMeta(v => !v)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-gray-400 text-sm"
          >
            <span>Round details (optional)</span>
            <span className="text-lg">{showMeta ? '▲' : '▼'}</span>
          </button>
          {showMeta && (
            <div className="px-4 pb-4 space-y-2 border-t border-gray-800">
              {[
                { key: 'name',   placeholder: 'Round name' },
                { key: 'course', placeholder: 'Course name' },
              ].map(({ key, placeholder }) => (
                <input
                  key={key}
                  type="text"
                  placeholder={placeholder}
                  value={meta[key]}
                  onChange={e => setMeta(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mt-2"
                />
              ))}
              <input
                type="date"
                value={meta.date}
                onChange={e => setMeta(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 mt-2"
              />
            </div>
          )}
        </section>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-2xl font-black text-xl tracking-wide transition-all ${
            canStart
              ? 'bg-yellow-500 text-gray-950 active:scale-95 shadow-lg shadow-yellow-900/30'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {hasRound ? 'NEW ROUND' : 'START ROUND'}
        </button>

        <div className="h-4" />
      </div>
    </div>
  )
}
