import { useSpinStore } from '../../store/useSpinStore'
import styles from './ControlPanel.module.css'

/**
 * The "nuclear" reset — wipes participants, rig queue, history, and settings
 * back to a blank first-run state, for starting an entirely new event on the
 * same machine without old data bleeding through. Deliberately separate from
 * "Đặt lại lượt quay" (SpinControls), which only clears winner flags between
 * rounds of the *same* event and leaves everything else untouched.
 */
export function FullResetButton() {
  const resetAllData = useSpinStore((s) => s.resetAllData)

  const handleClick = () => {
    const confirmed = confirm(
      'Xóa TOÀN BỘ dữ liệu?\n\n' +
        'Thao tác này sẽ xóa danh sách người tham dự, hàng đợi config, ' +
        'lịch sử quay, và đưa mọi cài đặt về mặc định. Không thể hoàn tác.',
    )
    if (confirmed) resetAllData()
  }

  return (
    <button type="button" className={styles.dangerButton} onClick={handleClick}>
      Reset toàn bộ
    </button>
  )
}
