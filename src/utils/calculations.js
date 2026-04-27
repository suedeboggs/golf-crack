export function getHoleMultiplier(hole) {
  switch (hole.crack.status) {
    case 'cracked':    return 2
    case 'recracked':  return 3
    case 'recracked2': return 4
    default:           return 1
  }
}

/** Returns array of { teamId, category } for all points awarded on a hole. */
export function getHolePointAwards(hole, players) {
  if (!hole.par) return []

  const awards = []
  const teamOf = (playerId) => players.find(p => p.id === playerId)?.teamId

  if (hole.par === 3) {
    if (hole.closestToPin) awards.push({ teamId: teamOf(hole.closestToPin), category: 'Closest to Pin' })
  } else {
    if (hole.longestDrive) awards.push({ teamId: teamOf(hole.longestDrive), category: 'Longest Drive' })
    if (hole.gir)          awards.push({ teamId: teamOf(hole.gir),          category: 'GIR' })
  }

  if (hole.individualLow) awards.push({ teamId: teamOf(hole.individualLow), category: 'Individual Low' })
  if (hole.lowTeam)        awards.push({ teamId: hole.lowTeam,               category: 'Low Team' })

  return awards.filter(a => a.teamId)
}

/**
 * Cumulative points per team for holes 0..(holeIndex-1) (0-based index).
 * Points are multiplied by the crack multiplier so cracked holes award more
 * points, which correctly gates who can crack subsequent holes.
 */
export function getTeamPointsBefore(holes, holeIndex, players) {
  const totals = {}
  for (let i = 0; i < holeIndex; i++) {
    const mult = getHoleMultiplier(holes[i])
    getHolePointAwards(holes[i], players).forEach(({ teamId }) => {
      totals[teamId] = (totals[teamId] || 0) + mult
    })
  }
  return totals
}

/** Dollar totals per team from Crack point system across all holes. */
export function computeTeamDollarsFromPoints(round) {
  const { holes, teams, players, config } = round
  const teamDollars = {}
  teams.forEach(t => (teamDollars[t.id] = 0))

  holes.forEach(hole => {
    if (!hole.par) return
    const pointValue = config.crackPointValue * getHoleMultiplier(hole)
    const numTeams   = teams.length

    getHolePointAwards(hole, players).forEach(({ teamId: winner }) => {
      teamDollars[winner] = (teamDollars[winner] || 0) + pointValue * (numTeams - 1)
      teams.forEach(t => {
        if (t.id !== winner) teamDollars[t.id] -= pointValue
      })
    })
  })
  return teamDollars
}

/** Dollar totals per player from Greenie bets across all par-3 holes. */
export function computePlayerGreenies(round) {
  const { holes, players, config } = round
  const dollars = {}
  players.forEach(p => (dollars[p.id] = 0))

  holes.forEach(hole => {
    if (hole.par !== 3 || !hole.closestToPin || hole.greenieResult === null) return
    const closest = hole.closestToPin
    const others  = players.filter(p => p.id !== closest)

    if (hole.greenieResult === 'par_or_better') {
      dollars[closest] += config.greenieParReward * others.length
      others.forEach(p => { dollars[p.id] -= config.greenieParReward })
    } else {
      dollars[closest] -= config.greenieBogeyPenalty * others.length
      others.forEach(p => { dollars[p.id] += config.greenieBogeyPenalty })
    }
  })
  return dollars
}

/**
 * Returns the current chip holder going INTO holeNumber (1-based).
 * Searches backwards within the same 9.
 */
export function getChipHolderBefore(holes, holeNumber) {
  const isFront = holeNumber <= 9
  const rangeStart = isFront ? 0 : 9  // 0-based
  const rangeEnd   = holeNumber - 1    // exclusive, 0-based

  let holder = null
  for (let i = rangeStart; i < rangeEnd; i++) {
    if (holes[i]?.chipEarnedBy) holder = holes[i].chipEarnedBy
  }
  return holder
}

/** Total multiplied points per team across all holes (for display). */
export function computeTeamPoints(holes, players) {
  const totals = {}
  holes.forEach(hole => {
    const mult = getHoleMultiplier(hole)
    getHolePointAwards(hole, players).forEach(({ teamId }) => {
      totals[teamId] = (totals[teamId] || 0) + mult
    })
  })
  return totals
}

/** Final chip holders for front 9 (after hole 9) and back 9 (after hole 18). */
export function computeChipHolders(holes) {
  let front = null, back = null
  for (let i = 0; i < 9;  i++) { if (holes[i]?.chipEarnedBy)  front = holes[i].chipEarnedBy }
  for (let i = 9; i < 18; i++) { if (holes[i]?.chipEarnedBy)  back  = holes[i].chipEarnedBy }
  return { front, back }
}

/** Dollar totals per player from poker chips. */
export function computePlayerChips(round) {
  const { holes, players, config } = round
  const dollars = {}
  players.forEach(p => (dollars[p.id] = 0))

  const { front, back } = computeChipHolders(holes)
  ;[front, back].forEach(holderId => {
    if (!holderId) return
    const others = players.filter(p => p.id !== holderId)
    dollars[holderId] += config.pokerChipPayout * others.length
    others.forEach(p => { dollars[p.id] -= config.pokerChipPayout })
  })
  return dollars
}

/** Net dollar total per player from all three games. */
export function computePlayerNetTotals(round) {
  const { teams, players } = round
  const teamDollars   = computeTeamDollarsFromPoints(round)
  const greenieDollars = computePlayerGreenies(round)
  const chipDollars    = computePlayerChips(round)

  const net = {}
  players.forEach(p => (net[p.id] = 0))

  // Split team dollars evenly among team members
  teams.forEach(team => {
    const members = players.filter(p => p.teamId === team.id)
    if (!members.length) return
    const perPlayer = (teamDollars[team.id] || 0) / members.length
    members.forEach(p => { net[p.id] += perPlayer })
  })

  players.forEach(p => {
    net[p.id] += greenieDollars[p.id] || 0
    net[p.id] += chipDollars[p.id]    || 0
  })

  return net
}

/** Per-player breakdown by category for the settlement screen. */
export function computePlayerBreakdown(round) {
  const { teams, players } = round
  const teamDollars    = computeTeamDollarsFromPoints(round)
  const greenieDollars = computePlayerGreenies(round)
  const chipDollars    = computePlayerChips(round)

  return players.map(p => {
    const team = teams.find(t => t.id === p.teamId)
    const members = players.filter(x => x.teamId === p.teamId)
    const crackShare = (teamDollars[p.teamId] || 0) / (members.length || 1)
    return {
      playerId:  p.id,
      name:      p.name,
      teamName:  team?.name || p.name,
      crack:     r2(crackShare),
      greenie:   r2(greenieDollars[p.id] || 0),
      chip:      r2(chipDollars[p.id]    || 0),
      net:       r2(crackShare + (greenieDollars[p.id] || 0) + (chipDollars[p.id] || 0)),
    }
  })
}

export const r2 = (n) => Math.round(n * 100) / 100
