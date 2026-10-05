import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { animalImageUrl, getAvailableAnimal } from '../../api/animalApi.js'
import AnimalPortrait from '../../components/common/AnimalPortrait.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

/**
 * Animal detail - an immersive profile, not a record card.
 * GET /api/animals/{id} (unknown/hidden/adopted -> identical friendly
 * 404). The story IS the animal's own description (real data); the
 * "what he needs" list is honest editorial copy for any rescue animal.
 */
function ownerWord(gender) {
  const value = String(gender || '').toUpperCase()
  if (value === 'MALE') return 'His'
  if (value === 'FEMALE') return 'Her'
  return 'Their'
}

function splitParagraphs(text) {
  return String(text || '')
    .split(/\n{2,}|\n/)
    .map((block) => block.trim())
    .filter(Boolean)
}

/** Pull-quote: first sentence of the description, capped (editorial device). */
function pullQuote(paragraphs) {
  if (!paragraphs[0]) return null
  const sentence = paragraphs[0].match(/^.+?[.!?](\s|$)/)
  const base = (sentence ? sentence[0] : paragraphs[0]).trim()
  return base.length > 160 ? `${base.slice(0, 157).trimEnd()}…` : base
}

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
        <Spinner label="Opening this profile…" />
      </section>
    )
  }

  if (error && error.status === 404) {
    return (
      <section className="page not-found-state">
        <h1>Not here right now</h1>
        <p>
          This animal does not exist or is no longer listed - it may already
          have found a home. Someone else is still waiting.
        </p>
        <p>
          <Link className="btn btn-primary" to="/adoption">
            Meet the others
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

  const imageSrc = animalImageUrl(animal)
  const paragraphs = splitParagraphs(animal.description)
  const quote = pullQuote(paragraphs)
  const word = ownerWord(animal.gender)
  const speciesLabel = String(animal.species || 'animal').toLowerCase()

  return (
    <section className="page">
      <p>
        <Link to="/adoption">← Everyone waiting</Link>
      </p>

      <div className="animal-detail">
        <div className="animal-media animal-media-detail">
          <AnimalPortrait
            src={imageSrc}
            alt={animal.name}
            species={animal.species}
            name={animal.name}
            eager
          />
        </div>

        <div className="animal-info">
          <p className="animal-kicker">
            Rescued {speciesLabel} · waiting for a home
          </p>

          <div className="event-card-top">
            <h1>{animal.name}</h1>
            <StatusBadge status={animal.status} />
          </div>

          <p className="animal-quote">
            {quote
              ? `“${quote}”`
              : 'Looking for a quiet home and someone who will not give up.'}
          </p>

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

          {paragraphs.length > 0 && (
            <div className="animal-description">
              <h2>
                {word} story
              </h2>
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          <div className="animal-description">
            <h2>
              {word} needs
            </h2>
            <ul className="needs-list">
              <li>A safe home</li>
              <li>Regular meals</li>
              <li>Someone patient</li>
              <li>Lots of affection</li>
            </ul>
          </div>

          <div className="adopt-bar">
            <Link
              className="btn btn-primary btn-lg"
              to={`/adoption/animals/${animal.id}/apply`}
            >
              Start your adoption journey
            </Link>
            <Link className="btn btn-secondary btn-lg" to="/#give">
              I want to help {animal.name}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
