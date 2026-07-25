import { useMemo } from 'react'
import { ReelWheel } from '../Wheel/ReelWheel'
import { useParticipantsStore } from '../../store/useParticipantsStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useSpinStore } from '../../store/useSpinStore'
import { getEligibleParticipants } from '../../core/participantPool'
import { useControlSync } from '../../hooks/useControlSync'
import { ParticipantImport } from './ParticipantImport'
import { ParticipantList } from './ParticipantList'
import { RigPanel } from './RigPanel'
import { SpinControls } from './SpinControls'
import { HistoryPanel } from './HistoryPanel'
import { OpenPresenterButton } from './OpenPresenterButton'
import styles from './ControlPanel.module.css'

export function ControlPanel() {
  useControlSync()

  const participants = useParticipantsStore((s) => s.participants)
  const removeAfterWin = useSettingsStore((s) => s.removeAfterWin)
  const sequence = useSpinStore((s) => s.sequence)
  const completeSpin = useSpinStore((s) => s.completeSpin)

  const idleItems = useMemo(() => {
    const eligible = getEligibleParticipants(participants, removeAfterWin)
    return eligible.map((p) => ({ key: p.id, participantId: p.id, name: p.name }))
  }, [participants, removeAfterWin])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Name Picker</h1>
        <OpenPresenterButton />
      </header>

      <main className={styles.main}>
        <section className={styles.wheelColumn}>
          <ReelWheel idleItems={idleItems} sequence={sequence} onLanded={completeSpin} />
          <SpinControls />
        </section>

        <section className={styles.panelColumn}>
          <div className={styles.panel}>
            <ParticipantImport />
            <ParticipantList />
          </div>
          <div className={styles.panel}>
            <RigPanel />
          </div>
          <div className={styles.panel}>
            <HistoryPanel />
          </div>
        </section>
      </main>
    </div>
  )
}
