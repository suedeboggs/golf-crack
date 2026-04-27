import { r2 } from './calculations.js'

/**
 * Greedy debt simplification.
 * playerBalances: { playerId: netDollars }
 * players: [{ id, name }]
 * Returns [{ from: { id, name }, to: { id, name }, amount }]
 */
export function simplifyDebts(playerBalances, players) {
  const getName = (id) => players.find(p => p.id === id)?.name ?? id

  const balances = Object.entries(playerBalances)
    .map(([id, balance]) => ({ id, balance: r2(balance) }))
    .filter(e => Math.abs(e.balance) > 0.005)

  const creditors = balances.filter(e => e.balance > 0).sort((a, b) => b.balance - a.balance)
  const debtors   = balances.filter(e => e.balance < 0).sort((a, b) => a.balance - b.balance)

  const txns = []
  let ci = 0, di = 0

  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci]
    const d = debtors[di]
    const amount = Math.min(c.balance, -d.balance)

    if (amount > 0.005) {
      txns.push({
        from:   { id: d.id, name: getName(d.id) },
        to:     { id: c.id, name: getName(c.id) },
        amount: r2(amount),
      })
    }

    c.balance = r2(c.balance - amount)
    d.balance = r2(d.balance + amount)

    if (Math.abs(c.balance) < 0.005) ci++
    if (Math.abs(d.balance) < 0.005) di++
  }

  return txns
}
