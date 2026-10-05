import { useCallback, useEffect, useState } from 'react'
import { listOwnAnimals } from '../../api/animalApi.js'
import {
  createUrgentCase,
  listOwnUrgentCases,
  setUrgentCaseStatus,
  updateUrgentCase,
} from '../../api/urgentApi.js'
import { fieldErrorsToObject } from '../../utils/validators.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'
import FormField from '../../components/forms/FormField.jsx'

const inr = new Intl.NumberFormat('en-IN')

const CONFIRM_COPY = {
  close: {
    title: 'Close this case?',
    body: 'It disappears from public discovery. You can reopen it later if treatment continues.',
    cta: 'Close case',
  },
  reopen: {
    title: 'Reopen this case?',
    body: 'It becomes publicly visible again on the homepage.',
    cta: 'Reopen',
  },
}

function emptyForm() {
  return { animalId: '', treatmentRequired: '', story: '', amountNeeded: '', amountRaised: '0' }
}

function formFromCase(item) {
  return {
    animalId: item.animalId ? String(item.animalId) : '',
    treatmentRequired: item.treatmentRequired ?? '',
    story: item.story ?? '',
    amountNeeded: item.amountNeeded != null ? String(item.amountNeeded) : '',
    amountRaised: item.amountRaised != null ? String(item.amountRaised) : '',
  }
}

/* ------------------------------------------------------------------ */

function UrgentEditor({ item, animals, onClose, onSaved }) {
  const [form, setForm] = useState(() => (item ? formFromCase(item) : emptyForm()))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setSaveError(null)
    setErrors({})

    const payload = {
      animalId: form.animalId ? Number(form.animalId) : null,
      treatmentRequired: form.treatmentRequired,
      story: form.story || null,
      amountNeeded: form.amountNeeded === '' ? null : Number(form.amountNeeded),
      amountRaised: form.amountRaised === '' ? 0 : Number(form.amountRaised),
    }

    try {
      if (item?.id) await updateUrgentCase(item.id, payload)
      else await createUrgentCase(payload)
      setSaving(false)
      onSaved()
    } catch (err) {
      setErrors(fieldErrorsToObject(err))
      setSaveError(err.message)
      setSaving(false)
    }
  }

  const animalOptions = (animals || []).map((animal) => ({
    value: String(animal.id),
    label: `${animal.name} (${animal.species}${animal.status ? ` · ${animal.status}` : ''})`,
  }))

  return (
    <form onSubmit={handleSubmit} noValidate>
      {saveError && <div className="form-error">{saveError}</div>}

      <FormField
        label="Animal"
        name="animalId"
        type="select"
        required
        value={form.animalId}
        onChange={handleChange}
        error={errors.animalId}
        options={animalOptions}
      />
      <FormField
        label="What is needed?"
        name="treatmentRequired"
        required
        value={form.treatmentRequired}
        onChange={handleChange}
        error={errors.treatmentRequired}
        placeholder="needs surgery"
      />
      <FormField
        label="Short story (optional)"
        name="story"
        type="textarea"
        value={form.story}
        onChange={handleChange}
        error={errors.story}
        placeholder="Bruno was hit by a scooter last week. The fracture needs fixing before it heals wrong."
      />
      <FormField
        label="Amount needed (₹)"
        name="amountNeeded"
        type="number"
        required
        min="0.01"
        step="0.01"
        value={form.amountNeeded}
        onChange={handleChange}
        error={errors.amountNeeded}
      />
      <FormField
        label="Amount raised so far (₹)"
        name="amountRaised"
        type="number"
        min="0"
        step="0.01"
        value={form.amountRaised}
        onChange={handleChange}
        error={errors.amountRaised}
      />
      <p className="form-hint">
        CANIVA does not process payments - record what the rescue partners
        actually received so supporters see honest progress.
      </p>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : item ? 'Save changes' : 'Open case'}
        </button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Urgent cases (NGO workspace) - own campaigns from GET /api/ngo/urgent
 * (ALL statuses). Create/put in a modal, close/reopen behind confirmation
 * dialogs; `status` is never sent on create/update. Foreign cases are
 * 404 server-side. Amounts are NGO-recorded facts, not payments.
 */
export default function UrgentCases() {
  const [cases, setCases] = useState(null)
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [filter, setFilter] = useState('ALL')
  const [editor, setEditor] = useState(null) // { item } | { item: null }
  const [confirm, setConfirm] = useState(null) // { action, item }
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    Promise.all([listOwnUrgentCases(), listOwnAnimals()])
      .then(([ownCases, ownAnimals]) => {
        if (!stale) {
          setCases(Array.isArray(ownCases) ? ownCases : [])
          setAnimals(Array.isArray(ownAnimals) ? ownAnimals : [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!stale) {
          setError(err)
          setLoading(false)
        }
      })
    return () => {
      stale = true
    }
  }, [retryKey])

  const reload = useCallback(() => setRetryKey((k) => k + 1), [])

  async function runConfirm() {
    if (!confirm) return
    const { action, item } = confirm
    setBusy(true)
    setConfirm(null)
    setBanner(null)
    try {
      const updated = await setUrgentCaseStatus(
        item.id,
        action === 'close' ? 'CLOSED' : 'ACTIVE',
      )
      setBanner({
        type: 'success',
        text: `Case for ${item.animalName} is now ${updated.status.toLowerCase()}.`,
      })
      reload()
    } catch (err) {
      setBanner({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <Spinner label="Loading your urgent cases…" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <h1>Urgent cases</h1>
        <ErrorMessage message={error.message} onRetry={reload} />
      </section>
    )
  }

  const visible =
    filter === 'ALL' ? cases : cases.filter((item) => item.status === filter)
  const copy = confirm ? CONFIRM_COPY[confirm.action] : null

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Urgent cases</h1>
          <p className="lead">
            Open a case when an animal needs treatment now - supporters see the
            goal and honest progress.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setEditor({ item: null })}
        >
          Open a case
        </button>
      </div>

      {banner && (
        <div className={banner.type === 'error' ? 'error-banner' : 'flash'}>
          {banner.text}
          <button
            type="button"
            className="banner-close"
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {cases.length === 0 ? (
        <EmptyState
          title="No urgent cases open"
          message="When one of your animals needs treatment beyond your regular budget, open a case - the homepage will show it to everyone."
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEditor({ item: null })}
          >
            Open a case
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="toolbar" role="group" aria-label="Filter by status">
            {['ALL', 'ACTIVE', 'CLOSED'].map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'chip active' : 'chip'}
                onClick={() => setFilter(value)}
              >
                {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
                {` (${
                  value === 'ALL'
                    ? cases.length
                    : cases.filter((item) => item.status === value).length
                })`}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="muted-block">No {filter.toLowerCase()} cases.</p>
          ) : (
            <div className="urgent-grid">
              {visible.map((item) => {
                const pct = Math.max(0, Math.min(100, item.progressPercent ?? 0))
                return (
                  <article className="urgent-card" key={item.id}>
                    <div className="urgent-head">
                      <StatusBadge status={item.status} />
                      <span className="muted">{item.animalName}</span>
                    </div>
                    <h2 className="urgent-title">
                      {item.animalName} {item.treatmentRequired}.
                    </h2>
                    {item.story && <p className="urgent-story">{item.story}</p>}
                    <div
                      className="progress"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="urgent-amounts">
                      <span>
                        <strong>₹{inr.format(Number(item.amountRaised) || 0)}</strong> raised
                      </span>
                      <span>
                        of <strong>₹{inr.format(Number(item.amountNeeded) || 0)}</strong>
                      </span>
                    </div>
                    <div className="row-actions story-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditor({ item })}
                      >
                        Edit
                      </button>
                      {item.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirm({ action: 'close', item })}
                        >
                          Close case
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setConfirm({ action: 'reopen', item })}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(editor)}
        title={editor?.item ? 'Edit case' : 'Open a case'}
        onClose={() => (busy ? undefined : setEditor(null))}
      >
        {editor && (
          <UrgentEditor
            item={editor.item}
            animals={animals}
            onClose={() => setEditor(null)}
            onSaved={() => {
              setBanner({
                type: 'success',
                text: editor.item ? 'Case updated.' : 'Case opened - it is live on the homepage.',
              })
              setEditor(null)
              reload()
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(confirm)}
        title={copy?.title ?? ''}
        onClose={() => (busy ? undefined : setConfirm(null))}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirm(null)}
              disabled={busy}
            >
              Keep as is
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={runConfirm}
              disabled={busy}
            >
              {busy ? 'Working…' : (copy?.cta ?? 'Confirm')}
            </button>
          </>
        }
      >
        <p>{copy?.body}</p>
        {confirm && (
          <p>
            <strong>
              {confirm.item.animalName} {confirm.item.treatmentRequired}
            </strong>
          </p>
        )}
      </Modal>
    </section>
  )
}
