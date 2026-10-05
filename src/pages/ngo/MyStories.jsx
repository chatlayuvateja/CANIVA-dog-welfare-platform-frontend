import { useCallback, useEffect, useRef, useState } from 'react'
import { listOwnAnimals } from '../../api/animalApi.js'
import {
  createStory,
  deleteStory,
  fetchOwnStoryImageObjectUrl,
  listOwnStories,
  removeStoryImage,
  setStoryStatus,
  updateStory,
  uploadStoryImage,
} from '../../api/storyApi.js'
import { fieldErrorsToObject } from '../../utils/validators.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'
import FormField from '../../components/forms/FormField.jsx'

const CONFIRM_COPY = {
  publish: {
    title: 'Publish this story?',
    body: 'It becomes publicly readable on the Stories page immediately.',
    cta: 'Publish',
  },
  unpublish: {
    title: 'Unpublish this story?',
    body: 'It disappears from public reading until you publish it again.',
    cta: 'Unpublish',
  },
  delete: {
    title: 'Delete this story?',
    body: 'The story and its photographs are removed permanently.',
    cta: 'Delete',
  },
}

function emptyForm() {
  return {
    title: '',
    summary: '',
    body: '',
    beforeCaption: 'Day 1',
    afterCaption: 'Today',
    animalId: '',
  }
}

function formFromStory(story) {
  return {
    title: story.title ?? '',
    summary: story.summary ?? '',
    body: story.body ?? '',
    beforeCaption: story.beforeCaption ?? '',
    afterCaption: story.afterCaption ?? '',
    animalId: story.animalId ? String(story.animalId) : '',
  }
}

/* ------------------------------------------------------------------ */
/* Editor: create / edit a story + before/after photo slots.           */
/* Text is saved FIRST (create never repeats on image failure), then   */
/* photo uploads/removals run; failures surface as a warning banner.   */
/* ------------------------------------------------------------------ */

function PhotoSlot({ slot, label, file, preview, busy, onPick, onClearFile, onRemoveStored }) {
  const inputId = `story-photo-${slot}`
  return (
    <div className="photo-slot">
      <span className="slot-label">{label}</span>
      <div className="slot-preview">
        {preview ? (
          <img src={preview} alt={`${label} preview`} />
        ) : (
          <span className="muted">No photo yet</span>
        )}
      </div>
      <div className="slot-actions">
        <label className="btn btn-secondary btn-sm" htmlFor={inputId}>
          {file ? 'Choose another' : 'Choose photo'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="visually-hidden"
          disabled={busy}
          onChange={(event) => {
            const chosen = event.target.files?.[0] ?? null
            onPick(chosen)
            event.target.value = ''
          }}
        />
        {file && (
          <button type="button" className="btn-link" onClick={onClearFile} disabled={busy}>
            Clear selected
          </button>
        )}
        {!file && preview && (
          <button type="button" className="btn-link" onClick={onRemoveStored} disabled={busy}>
            Remove
          </button>
        )}
      </div>
      <p className="file-hint">JPEG, PNG, GIF or WebP - up to 5 MB. We check the file itself.</p>
    </div>
  )
}

function StoryEditor({ story, animals, onClose, onSaved }) {
  const isEdit = Boolean(story)
  const [form, setForm] = useState(() => (story ? formFromStory(story) : emptyForm()))
  const [current, setCurrent] = useState(story)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [files, setFiles] = useState({ BEFORE: null, AFTER: null })
  const [stored, setStored] = useState({ BEFORE: null, AFTER: null })
  const [filePreviews, setFilePreviews] = useState({ BEFORE: null, AFTER: null })
  const [remove, setRemove] = useState({ BEFORE: false, AFTER: false })
  const urlsRef = useRef({ BEFORE: null, AFTER: null, fileBEFORE: null, fileAFTER: null })

  function rememberUrl(key, url) {
    if (urlsRef.current[key]) URL.revokeObjectURL(urlsRef.current[key])
    urlsRef.current[key] = url
  }

  // Release every object URL when the dialog goes away.
  useEffect(
    () => () => {
      Object.values(urlsRef.current).forEach((url) => url && URL.revokeObjectURL(url))
    },
    [],
  )

  // Load stored photos for preview (own endpoint, any status).
  useEffect(() => {
    let cancelled = false
    async function load(slot) {
      if (!current?.id) return
      const has = slot === 'BEFORE' ? current.hasBeforeImage : current.hasAfterImage
      if (!has || remove[slot]) return
      try {
        const url = await fetchOwnStoryImageObjectUrl(current.id, slot)
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        rememberUrl(slot, url)
        setStored((prev) => ({ ...prev, [slot]: url }))
      } catch {
        /* preview only - the list still shows the flags */
      }
    }
    load('BEFORE')
    load('AFTER')
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.imageVersion])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function pickFile(slot, file) {
    setFiles((prev) => ({ ...prev, [slot]: file }))
    const key = `file${slot}`
    if (file) {
      const url = URL.createObjectURL(file)
      rememberUrl(key, url)
      setFilePreviews((prev) => ({ ...prev, [slot]: url }))
      setRemove((prev) => ({ ...prev, [slot]: false }))
    } else {
      rememberUrl(key, null)
      setFilePreviews((prev) => ({ ...prev, [slot]: null }))
    }
  }

  function clearFile(slot) {
    rememberUrl(`file${slot}`, null)
    setFilePreviews((prev) => ({ ...prev, [slot]: null }))
    setFiles((prev) => ({ ...prev, [slot]: null }))
  }

  function removeStored(slot) {
    rememberUrl(slot, null)
    setStored((prev) => ({ ...prev, [slot]: null }))
    setRemove((prev) => ({ ...prev, [slot]: true }))
  }

  /** Preview priority: freshly chosen file > stored photo > none. */
  function previewFor(slot) {
    if (filePreviews[slot]) return filePreviews[slot]
    if (!remove[slot]) return stored[slot]
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setSaveError(null)
    setWarning(null)
    setErrors({})

    const payload = {
      title: form.title,
      summary: form.summary || null,
      body: form.body,
      beforeCaption: form.beforeCaption || null,
      afterCaption: form.afterCaption || null,
      animalId: form.animalId ? Number(form.animalId) : null,
    }

    let saved
    try {
      saved = current?.id
        ? await updateStory(current.id, payload)
        : await createStory(payload)
      setCurrent(saved)
    } catch (err) {
      setErrors(fieldErrorsToObject(err))
      setSaveError(err.message)
      setSaving(false)
      return
    }

    // Text saved. Now photos - failures warn but NEVER re-create.
    const photoProblems = []
    for (const slot of ['BEFORE', 'AFTER']) {
      const had = slot === 'BEFORE' ? saved.hasBeforeImage : saved.hasAfterImage
      try {
        if (remove[slot] && had) await removeStoryImage(saved.id, slot)
        if (files[slot]) await uploadStoryImage(saved.id, slot, files[slot])
      } catch (err) {
        photoProblems.push(`${slot === 'BEFORE' ? 'Before' : 'After'} photo: ${err.message}`)
      }
    }

    if (photoProblems.length > 0) {
      setWarning(
        `Your story was saved, but a photo did not go through. ${photoProblems.join(' · ')}`,
      )
      setFiles({ BEFORE: null, AFTER: null })
      setRemove({ BEFORE: false, AFTER: false })
      setSaving(false)
      onSaved(false)
      return
    }

    setSaving(false)
    onSaved(true)
  }

  const animalOptions = (animals || []).map((animal) => ({
    value: String(animal.id),
    label: `${animal.name} (${animal.species}${animal.status ? ` · ${animal.status}` : ''})`,
  }))

  return (
    <form className="story-editor" onSubmit={handleSubmit} noValidate>
      {saveError && !warning && <div className="form-error">{saveError}</div>}
      {warning && <div className="notice-box"><strong>Heads up</strong><p>{warning}</p></div>}

      <FormField
        label="Title"
        name="title"
        required
        value={form.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="From a roadside to a warm bed"
      />
      <FormField
        label="Standfirst (short line under the title)"
        name="summary"
        value={form.summary}
        onChange={handleChange}
        error={errors.summary}
        placeholder="Found shivering under a truck - home in eleven days."
      />
      <FormField
        label="The story"
        name="body"
        type="textarea"
        required
        value={form.body}
        onChange={handleChange}
        error={errors.body}
        placeholder={'Short paragraphs work best.\n\nLeave a blank line between them.'}
      />
      <FormField
        label="Link to one of your animals (optional)"
        name="animalId"
        type="select"
        value={form.animalId}
        onChange={handleChange}
        error={errors.animalId}
        options={animalOptions}
      />

      <div className="photo-slots">
        <PhotoSlot
          slot="BEFORE"
          label="Before photo"
          file={files.BEFORE}
          preview={previewFor('BEFORE')}
          busy={saving}
          onPick={(file) => pickFile('BEFORE', file)}
          onClearFile={() => clearFile('BEFORE')}
          onRemoveStored={() => removeStored('BEFORE')}
        />
        <PhotoSlot
          slot="AFTER"
          label="After photo"
          file={files.AFTER}
          preview={previewFor('AFTER')}
          busy={saving}
          onPick={(file) => pickFile('AFTER', file)}
          onClearFile={() => clearFile('AFTER')}
          onRemoveStored={() => removeStored('AFTER')}
        />
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save story'}
        </button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */

/**
 * My Stories (NGO workspace) - own rescue stories from
 * GET /api/ngo/stories (ALL statuses). Create/edit lives in a modal
 * (text first, then before/after photos), publish/unpublish/delete are
 * behind confirmation dialogs. Foreign stories are 404 server-side.
 */
export default function MyStories() {
  const [stories, setStories] = useState(null)
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [filter, setFilter] = useState('ALL')
  const [editor, setEditor] = useState(null) // { story } | { story: null }
  const [confirm, setConfirm] = useState(null) // { action, story }
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    Promise.all([listOwnStories(), listOwnAnimals()])
      .then(([ownStories, ownAnimals]) => {
        if (!stale) {
          setStories(Array.isArray(ownStories) ? ownStories : [])
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
    const { action, story } = confirm
    setBusy(true)
    setConfirm(null)
    setBanner(null)
    try {
      if (action === 'delete') {
        await deleteStory(story.id)
        setBanner({ type: 'success', text: `“${story.title}” was deleted.` })
      } else {
        const updated = await setStoryStatus(
          story.id,
          action === 'publish' ? 'PUBLISHED' : 'DRAFT',
        )
        setBanner({
          type: 'success',
          text: `“${story.title}” is now ${updated.status.toLowerCase()}.`,
        })
      }
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
        <Spinner label="Loading your stories…" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <h1>Rescue stories</h1>
        <ErrorMessage message={error.message} onRetry={reload} />
      </section>
    )
  }

  const visible =
    filter === 'ALL' ? stories : stories.filter((story) => story.status === filter)
  const copy = confirm ? CONFIRM_COPY[confirm.action] : null

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Rescue stories</h1>
          <p className="lead">
            Your rescue diary - publish when you are ready, with before and
            after photographs.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditor({ story: null })}>
          Write a story
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

      {stories.length === 0 ? (
        <EmptyState
          title="No stories yet"
          message="Start with the rescue you will never forget - what happened, how you found them, where they are now."
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEditor({ story: null })}
          >
            Write your first story
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="toolbar" role="group" aria-label="Filter by status">
            {['ALL', 'DRAFT', 'PUBLISHED'].map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'chip active' : 'chip'}
                onClick={() => setFilter(value)}
              >
                {value === 'ALL' ? 'All' : value}
                {` (${
                  value === 'ALL'
                    ? stories.length
                    : stories.filter((story) => story.status === value).length
                })`}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="muted-block">No {filter.toLowerCase()} stories.</p>
          ) : (
            <div className="story-grid">
              {visible.map((story) => (
                <article className="story-card" key={story.id}>
                  <div className="story-body">
                    <span className="story-meta">
                      <StatusBadge status={story.status} />
                      {story.animalName ? ` · About ${story.animalName}` : ''}
                    </span>
                    <h2 className="story-title">{story.title}</h2>
                    {story.summary && <p className="story-sum">{story.summary}</p>}
                    <p className="photo-count">
                      {story.hasBeforeImage && story.hasAfterImage
                        ? 'Before & after photos attached'
                        : story.hasBeforeImage || story.hasAfterImage
                          ? 'One photo attached'
                          : 'No photos yet'}
                    </p>
                    <div className="row-actions story-actions">
                      {story.status === 'DRAFT' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setConfirm({ action: 'publish', story })}
                        >
                          Publish
                        </button>
                      )}
                      {story.status === 'PUBLISHED' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setConfirm({ action: 'unpublish', story })}
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditor({ story })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirm({ action: 'delete', story })}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(editor)}
        title={editor?.story ? 'Edit story' : 'Write a story'}
        onClose={() => (busy ? undefined : setEditor(null))}
      >
        {editor && (
          <StoryEditor
            story={editor.story}
            animals={animals}
            onClose={() => setEditor(null)}
            onSaved={(clean) => {
              setBanner({
                type: 'success',
                text: editor.story ? 'Story updated.' : 'Story saved as a draft.',
              })
              if (clean) setEditor(null)
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
              className={confirm?.action === 'delete' ? 'btn btn-danger' : 'btn btn-primary'}
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
            <strong>{confirm.story.title}</strong>
          </p>
        )}
      </Modal>
    </section>
  )
}
