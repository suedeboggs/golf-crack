import { useRound } from './context/RoundContext.jsx'
import SetupScreen from './screens/SetupScreen.jsx'
import HoleScreen from './screens/HoleScreen.jsx'
import OverviewScreen from './screens/OverviewScreen.jsx'
import SettlementScreen from './screens/SettlementScreen.jsx'

export default function App() {
  const { state } = useRound()

  switch (state.screen) {
    case 'hole':       return <HoleScreen />
    case 'overview':   return <OverviewScreen />
    case 'settlement': return <SettlementScreen />
    default:           return <SetupScreen />
  }
}
