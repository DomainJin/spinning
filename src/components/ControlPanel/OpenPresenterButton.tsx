import { APP_CONFIG } from '../../config/wheelConfig'
import styles from './ControlPanel.module.css'

export function OpenPresenterButton() {
  const openPresenter = () => {
    const url = new URL(window.location.href)
    url.search = `${APP_CONFIG.presenterViewParam}=${APP_CONFIG.presenterViewValue}`
    window.open(url.toString(), 'name-picker-presenter', 'noopener')
  }

  return (
    <button type="button" className={styles.secondaryButton} onClick={openPresenter}>
      Mở màn hình trình chiếu
    </button>
  )
}
