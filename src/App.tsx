import { ControlPanel } from './components/ControlPanel'
import { PresenterView } from './components/PresenterView'
import { APP_CONFIG } from './config/wheelConfig'

function isPresenterView(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get(APP_CONFIG.presenterViewParam) === APP_CONFIG.presenterViewValue
}

function App() {
  return isPresenterView() ? <PresenterView /> : <ControlPanel />
}

export default App
