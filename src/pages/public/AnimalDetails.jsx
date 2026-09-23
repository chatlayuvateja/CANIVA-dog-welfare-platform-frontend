import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAvailableAnimal } from '../../api/animalApi.js'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

/**
 * Animal details (Session 15) - GET /api/animals/{id}.
 *
 * Only AVAILABLE animals are public: unknown / hidden / adopted ids return
 * 404 from the API (no existence leak), shown here as a friendly state
 * with a way back. The adoption application form arrives with the public
 * workflows session.
 */
export default function AnimalDetails() {
  const { id } = useParams()
  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)

    getAvailableAnimal(id)
      .then((data) => {
        if (!stale) {
          setAnimal(data)
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
        <Spinner label="Loading animal…" />
      </section>
    )
  }

  if (error && error.status === 404) {
    return (
      <section className="page not-found-state">
        <h1>Not available</h1>
        <p>
          This animal does not exist or is no longer listed for adoption
          (it may already have found a home).
        </p>
        <p>
          <Link className="btn btn-primary" to="/adoption">
            Back to available animals
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

  if (!animal) return null

  return (
    <section className="page">
      <p>
        <Link to="/adoption">← Back to available animals</Link>
      </p>

      <div className="animal-detail">
        <div className="animal-media animal-media-detail">
          {animal.imageUrl ? (
            <img src={animal.imageUrl} alt={animal.name} />
          ) : (
            <span className="placeholder-media" aria-hidden="true">
              {(animal.species || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="animal-info">
          <div className="event-card-top">
            <h1>{animal.name}</h1>
            <StatusBadge status={animal.status} />
          </div>

          <ul className="meta-list meta-list-wide">
            <li>
              <span className="meta-label">Species</span>
              <span>{animal.species}</span>
            </li>
            {animal.breed && (
              <li>
                <span className="meta-label">Breed</span>
                <span>{animal.breed}</span>
              </li>
            )}
            {animal.age && (
              <li>
                <span className="meta-label">Age</span>
                <span>{animal.age}</span>
              </li>
            )}
            {animal.gender && (
              <li>
                <span className="meta-label">Gender</span>
                <span>{animal.gender}</span>
              </li>
            )}
            {animal.ngoName && (
              <li>
                <span className="meta-label">Cared for by</span>
                <span>{animal.ngoName}</span>
              </li>
            )}
          </ul>

          <div className="action-row">
            <Link
              className="btn btn-primary"
              to={`/adoption/animals/${animal.id}/apply`}
            >
              Apply for adoption
            </Link>
          </div>

          {animal.description && (
            <div className="animal-description">
              <h2>About {animal.name}</h2>
              {String(animal.description)
                .split('\n')
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
