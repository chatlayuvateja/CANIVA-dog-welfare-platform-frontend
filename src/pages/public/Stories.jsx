import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublishedStories, storyImageUrl } from '../../api/storyApi.js'
import AnimalPortrait from '../../components/common/AnimalPortrait.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * Rescue stories - the editorial side of CANIVA.
 * GET /api/stories (PUBLISHED only, real NGO-authored content; the
 * homepage hides this section when there is nothing yet, this page
 * shows the waiting state instead).
 */
export default function Stories() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPublishedStories()
      setStories(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, retryKey])

  return (
    <section className="page">
      <p className="kicker">Rescue stories</p>
      <h1>Every rescue has a story.</h1>
      <p className="lead">
        Short dispatches from the people who found them, fed them, and stayed
        up with them — before, during and after.
      </p>

      {loading ? (
        <div className="story-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton sk-media" style={{ aspectRatio: '16 / 10' }} />
              <div className="sk-body">
                <div className="skeleton sk-line short" />
                <div className="skeleton sk-line wide" />
                <div className="skeleton sk-line quote" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={() => setRetryKey((key) => key + 1)} />
      ) : stories.length === 0 ? (
        <EmptyState
          title="No stories published yet"
          message="When rescue partners share their first rescue, it will appear here — with photographs of how it started and where they are today."
        >
          <Link className="btn btn-primary" to="/adoption">
            Meet the animals instead
          </Link>
        </EmptyState>
      ) : (
        <div className="story-grid">
          {stories.map((story) => {
            const cover = storyImageUrl(story, 'AFTER') || storyImageUrl(story, 'BEFORE')
            return (
              <article className="story-card" key={story.id}>
                <div className="story-figure">
                  {cover ? (
                    <img src={cover} alt="" loading="lazy" />
                  ) : (
                    <AnimalPortrait species={null} alt="" />
                  )}
                </div>
                <div className="story-body">
                  <span className="story-meta">
                    {story.animalName ? `About ${story.animalName}` : 'Rescue diary'}
                  </span>
                  <h2 className="story-title">
                    <Link to={`/stories/${story.id}`}>{story.title}</Link>
                  </h2>
                  {story.summary && <p className="story-sum">{story.summary}</p>}
                  <Link className="story-link" to={`/stories/${story.id}`}>
                    Read the story →
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
