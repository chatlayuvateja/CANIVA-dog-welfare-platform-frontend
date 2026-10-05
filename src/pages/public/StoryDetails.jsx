import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublishedStory, storyImageUrl } from '../../api/storyApi.js'
import AnimalPortrait from '../../components/common/AnimalPortrait.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

/**
 * Rescue story detail - editorial reading page.
 * GET /api/stories/{id} (draft/unknown -> identical friendly 404) plus
 * the public before/after image endpoints. "Someone cared." is shown
 * only when the story actually carries both photographs.
 */
export default function StoryDetails() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)

    getPublishedStory(id)
      .then((data) => {
        if (!stale) {
          setStory(data)
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
  }, [id, retryKey])

  if (loading) {
    return (
      <section className="page">
        <Spinner label="Opening the story…" />
      </section>
    )
  }

  if (error && error.status === 404) {
    return (
      <section className="page not-found-state">
        <h1>This story isn’t here</h1>
        <p>
          It may still be a draft, or the link has moved. Every rescue still
          deserves to be seen — there are animals waiting right now.
        </p>
        <p>
          <Link className="btn btn-primary" to="/stories">
            Back to stories
          </Link>
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <ErrorMessage
          message={error.message}
          onRetry={() => setRetryKey((key) => key + 1)}
        />
      </section>
    )
  }

  if (!story) return null

  const before = storyImageUrl(story, 'BEFORE')
  const after = storyImageUrl(story, 'AFTER')
  const lead = storyImageUrl(story, 'AFTER') || storyImageUrl(story, 'BEFORE')
  const paragraphs = String(story.body || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <article className="page">
      <p>
        <Link to="/stories">← All rescue stories</Link>
      </p>

      <p className="kicker">Rescue story</p>
      <h1>{story.title}</h1>
      {story.summary && <p className="animal-quote">{story.summary}</p>}

      <p className="muted">
        {story.ngoName && <>Told by {story.ngoName}</>}
        {story.ngoName && story.animalName && <> · </>}
        {story.animalName && <>About {story.animalName}</>}
      </p>

      {lead && (
        <div className="story-figure story-figure-hero">
          <img src={lead} alt="" />
        </div>
      )}

      <div className="story-prose">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {(before || after) && (
        <section aria-labelledby="transform-title">
          <div className="section-head">
            <p className="kicker">Before and after</p>
            <h2 className="section-title" id="transform-title">
              {before && after ? 'Someone cared.' : 'Where they are now.'}
            </h2>
          </div>

          <div className="ba-grid">
            {before ? (
              <figure className="ba-side">
                <div className="ba-frame">
                  <img src={before} alt={`Before: ${story.title}`} />
                </div>
                <figcaption className="ba-caption">
                  {story.beforeCaption || 'Day 1'}
                </figcaption>
              </figure>
            ) : (
              <div />
            )}

            {before && after && <p className="ba-mid">Someone cared.</p>}

            {after ? (
              <figure className="ba-side">
                <div className="ba-frame">
                  <img src={after} alt={`Today: ${story.title}`} />
                </div>
                <figcaption className="ba-caption">
                  {story.afterCaption || 'Today'}
                </figcaption>
              </figure>
            ) : (
              <div />
            )}
          </div>
        </section>
      )}

      <div className="adopt-bar">
        {story.animalId && story.animalName && (
          <Link
            className="btn btn-primary btn-lg"
            to={`/adoption/animals/${story.animalId}`}
          >
            Meet {story.animalName}
          </Link>
        )}
        <Link className="btn btn-secondary btn-lg" to="/adoption">
          See all animals
        </Link>
      </div>
    </article>
  )
}
