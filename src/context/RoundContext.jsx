import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)
const STORAGE_KEY = 'crack-cash-v1'

export function makeEmptyHole(number) {
  return {
    number,
    par: null,
    crack: { status: 'none', crackingTeamId: null, multiplier: 1 },
    closestToPin: null,
    greenieResult: null,
    longestDrive: null,
    gir: null,
    individualLow: null,
    lowTeam: null,
    chipEarnedBy: null,
  }
}

const initialState = {
  screen: 'setup',
  holeNumber: 1,
  round: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_ROUND': {
      const { players, teams, config, name, course, date } = action.payload
      return {
        screen: 'hole',
        holeNumber: 1,
        round: {
          id: crypto.randomUUID(),
          name,
          course,
          date,
          config,
          players,
          teams,
          holes: Array.from({ length: 18 }, (_, i) => makeEmptyHole(i + 1)),
          createdAt: new Date().toISOString(),
        },
      }
    }

    case 'UPDATE_HOLE': {
      const { holeNumber, updates } = action.payload
      const holes = state.round.holes.map(h =>
        h.number === holeNumber ? { ...h, ...updates } : h
      )
      return { ...state, round: { ...state.round, holes } }
    }

    case 'UPDATE_CONFIG': {
      return {
        ...state,
        round: {
          ...state.round,
          config: { ...state.round.config, ...action.payload },
        },
      }
    }

    case 'NAVIGATE': {
      const { screen, holeNumber } = action.payload
      return {
        ...state,
        screen,
        ...(holeNumber !== undefined ? { holeNumber } : {}),
      }
    }

    case 'RESET': {
      localStorage.removeItem(STORAGE_KEY)
      return initialState
    }

    default:
      return state
  }
}

export function RoundProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useRound() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useRound must be used within RoundProvider')
  return ctx
}
