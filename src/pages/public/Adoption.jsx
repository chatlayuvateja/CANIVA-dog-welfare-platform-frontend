import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { animalImageUrl, listAvailableAnimals } from '../../api/animalApi.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * Adoption listing (Session 15) - GET /api/animals.
 *
 * The endpoint only ever returns AVAILABLE animals (hidden/adopted are not
 * public), so this page needs no status filtering. Loading / error+retry /
 * empty states; zero mock data. The application form arrives with the
 * public workflows session.
 */
export default function Adoption() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAvailableAnimals()
      setAnimals(Array.isArray(data) ? data : [])
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
      <h1>Animals looking for a home</h1>
      <p className="lead">
        Every listing below is currently available for adoption.
      </p>

      {loading ? (
        <Spinner label="Loading animals…" />
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={() => setRetryKey((key) => key + 1)} />
      ) : animals.length === 0 ? (
        <EmptyState
          title="No animals available right now"
          message="New listings appear as soon as NGOs publish them - check back soon."
        />
      ) : (
        <div className="animal-grid">
          {animals.map((animal) => {
            const imageSrc = animalImageUrl(animal)
            return (
              <article className="animal-card" key={animal.id}>
                <div className="animal-media">
                  {imageSrc ? (
                    <img src={imageSrc} alt={animal.name} loading="lazy" />
                  ) : (
                    <span className="placeholder-media" aria-hidden="true">
                      {(animal.species || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="animal-body">
                  <h3>
                    <Link to={`/adoption/animals/${animal.id}`}>{animal.name}</Link>
                  </h3>
                  <p className="animal-meta">
                    {[animal.breed, animal.age].filter(Boolean).join(' · ') ||
                      animal.species}
                  </p>
                  {animal.ngoName && (
                    <p className="muted">Cared for by {animal.ngoName}</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
