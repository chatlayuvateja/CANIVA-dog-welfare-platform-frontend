import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as adoptionApi from '../../api/adoptionApi.js'
import { formatDate } from '../../utils/date.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'
import FormField from '../../components/forms/FormField.jsx'

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All' },
]

/**
 * Adoption Applications (Session 17) - the NGO inbox:
 *
 *   GET  /api/ngo/applications?status=PENDING|APPROVED|REJECTED (tab = exact
 *        enum name; "All" sends no param) - own animals only
 *   PATCH /api/ngo/applications/{id}/approve  -> ONE atomic transaction:
 *        application APPROVED + animal ADOPTED + other pending applications
 *        auto-REJECTED (the confirmation dialog explains this)
 *   PATCH /api/ngo/applications/{id}/reject   -> REJECTED with an optional
 *        reason (we always send an object; {} = no reason)
 *
 * Decisions only exist for PENDING rows (anything else -> backend 409,
 * surfaced in the banner). Foreign/unknown ids -> 404 server-side.
 */
export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = TABS.some((tab) => tab.key === searchParams.get('status'))
    ? searchParams.get('status')
    : 'PENDING'

  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    adoptionApi
      .listForNgo(status === 'ALL' ? undefined : status)
      .then((data) => {
        if (!stale) {
          setRows(Array.isArray(data) ? data : [])
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
  }, [status, retryKey])

  const reload = useCallback(() => setRetryKey((k) => k + 1), [])

  function switchTab(key) {
    const next = new URLSearchParams()
    next.set('status', key)
    setSearchParams(next, { replace: true })
  }

  async function runApprove() {
    const application = approveTarget
    setBusy(true)
    setApproveTarget(null)
    setBanner(null)
    try {
      const updated = await adoptionApi.approve(application.id)
      setBanner({
        type: 'success',
        text: `Application approved - ${updated.animalName} is now ADOPTED and any other pending applications were rejected automatically.`,
      })
      reload()
    } catch (err) {
      setBanner({ type: 'error', text: err.message })
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function runReject() {
    const application = rejectTarget
    const trimmed = reason.trim()
    setBusy(true)
    setRejectTarget(null)
    setBanner(null)
    try {
      const updated = await adoptionApi.reject(
        application.id,
        trimmed ? { reason: trimmed } : {},
      )
      setBanner({
        type: 'success',
        text: `Application for ${updated.animalName} rejected${
          updated.decisionReason ? `: “${updated.decisionReason}”` : ''
        }. The applicant may apply again later.`,
      })
      setReason('')
      reload()
    } catch (err) {
      setBanner({ type: 'error', text: err.message })
      reload()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <Spinner label="Loading applications…" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <ErrorMessage message={error.message} onRetry={reload} />
      </section>
    )
  }

  return (
    <section className="page">
      <h1>Adoption applications</h1>

      <div className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={status === tab.key}
            className={status === tab.key ? 'tab-btn active' : 'tab-btn'}
            onClick={() => switchTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
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

      {rows.length === 0 ? (
        <EmptyState
          title={`No ${status === 'ALL' ? '' : status.toLowerCase() + ' '}applications`}
          message="Applications arrive when adopters submit the form on an animal's page."
        >
          <Link className="btn btn-secondary" to="/ngo/animals">
            Manage animals
          </Link>
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Applicant</th>
                <th>Status</th>
                <th>Decision</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((application) => (
                <tr key={application.id}>
                  <td data-label="Animal">
                    <Link to={`/adoption/animals/${application.animalId}`}>
                      {application.animalName}
                    </Link>
                  </td>
                  <td data-label="Applicant">
                    {application.applicantName}
                    <br />
                    <span className="muted-cell">
                      {application.applicantPhone} · {application.applicantEmail}
                    </span>
                    {application.message ? (
                      <>
                        <br />
                        <span className="muted-cell clamp-2">“{application.message}”</span>
                      </>
                    ) : null}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={application.status} />
                  </td>
                  <td data-label="Decision">
                    {application.status === 'PENDING' ? (
                      <span className="muted-cell">Awaiting decision</span>
                    ) : (
                      <>
                        {application.decisionReason ?? <span className="muted-cell">—</span>}
                        {application.decidedAt ? (
                          <>
                            <br />
                            <span className="muted-cell">
                              {formatDate(application.decidedAt)}
                            </span>
                          </>
                        ) : null}
                      </>
                    )}
                  </td>
                  <td data-label="Applied">{formatDate(application.createdAt)}</td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      {application.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setApproveTarget(application)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setReason('')
                              setRejectTarget(application)
                            }}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="muted-cell">Decided</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- approve confirmation (atomic action) ---- */}
      <Modal
        open={Boolean(approveTarget)}
        title="Approve this application?"
        onClose={() => (busy ? undefined : setApproveTarget(null))}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setApproveTarget(null)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={runApprove}
              disabled={busy}
            >
              {busy ? 'Working…' : 'Approve'}
            </button>
          </>
        }
      >
        <p>
          One atomic action: the animal becomes <strong>ADOPTED</strong> (terminal), this
          application becomes <strong>APPROVED</strong>, and every other pending
          application for the same animal is automatically{' '}
          <strong>REJECTED</strong> with the reason “Animal already adopted”.
        </p>
        {approveTarget && (
          <p>
            <strong>
              {approveTarget.animalName} ← {approveTarget.applicantName}
            </strong>
          </p>
        )}
      </Modal>

      {/* ---- reject with optional reason ---- */}
      <Modal
        open={Boolean(rejectTarget)}
        title="Reject this application?"
        onClose={() => (busy ? undefined : setRejectTarget(null))}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRejectTarget(null)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={runReject}
              disabled={busy}
            >
              {busy ? 'Working…' : 'Reject application'}
            </button>
          </>
        }
      >
        <p>
          The application becomes <strong>REJECTED</strong> (terminal). The animal stays
          available, and the applicant can apply again later. An optional reason is
          shown to the applicant in My Activities.
        </p>
        <FormField
          label="Reason (optional)"
          name="rejectReason"
          type="textarea"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {rejectTarget && (
          <p>
            <strong>
              {rejectTarget.animalName} ← {rejectTarget.applicantName}
            </strong>
          </p>
        )}
      </Modal>
    </section>
  )
}
