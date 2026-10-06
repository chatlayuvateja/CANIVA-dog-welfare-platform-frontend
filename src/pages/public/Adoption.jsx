import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { animalImageUrl, listAvailableAnimals } from '../../api/animalApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalPortrait from '../../components/common/AnimalPortrait.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { AnimalGridSkeleton } from '../../components/common/Skeleton.jsx'

/**
 * Adoption - "Find your companion".
 *
 * A calm, four-question guided intro (brief section 12) that ends in a
 * relationship, not a filter form. The answers that CAN actually be
 * matched against real profile data (species, age) order the results;
 * the remaining answers shape the summary copy only - we never pretend
 * to know more about an animal than its profile says. Everything below
 * is GET /api/animals (AVAILABLE only), zero mock data.
 *
 * Role note (owner request): the four-question survey is adopter-facing.
 * In an NGO session it never renders - partners land on a plain catalogue
 * view of the same listings instead.
 */

const QUESTIONS = [
  {
    key: 'species',
    q: 'What kind of companion are you looking for?',
    hint: 'Rescued dogs and cats are waiting - either is a good answer.',
    options: [
      { value: 'DOG', label: 'A dog' },
      { value: 'CAT', label: 'A cat' },
      { value: 'ANY', label: 'No preference' },
    ],
  },
  {
    key: 'age',
    q: 'Any age in mind?',
    hint: 'Puppies and kittens are playful; grown animals are calmer.',
    options: [
      { value: 'YOUNG', label: 'Young (under 3)' },
      { value: 'GROWN', label: 'Grown-up (3+)' },
      { value: 'ANY', label: 'Any age' },
    ],
  },
  {
    key: 'home',
    q: 'Do you live in an apartment or a house?',
    hint: 'This shapes the advice we give you, not which animals qualify.',
    options: [
      { value: 'APARTMENT', label: 'An apartment' },
      { value: 'HOUSE', label: 'A house' },
      { value: 'OTHER', label: 'Something else' },
    ],
  },
  {
    key: 'time',
    q: 'How much time can you spend with them?',
    hint: 'Every rescue animal needs patience - honesty helps here.',
    options: [
      { value: 'SOME', label: 'A little, most days' },
      { value: 'LOTS', label: 'A lot - they would be my shadow' },
      { value: 'VARIES', label: 'It varies' },
    ],
  },
]

const SUMMARY_WORDS = {
  species: { DOG: 'a dog', CAT: 'a cat', ANY: 'any kind of companion' },
  age: { YOUNG: 'young', GROWN: 'grown-up', ANY: 'any age' },
  home: { APARTMENT: 'in an apartment', HOUSE: 'in a house', OTHER: 'at home with you' },
  time: { SOME: 'with a little time most days', LOTS: 'with a lot of time to give', VARIES: 'with time that varies' },
}

function ageInYears(age) {
  if (!age) return null
  const match = String(age).toLowerCase().match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const value = Number(match[1])
  if (String(age).toLowerCase().includes('month')) return value / 12
  return value
}

function matchesPrefs(animal, prefs) {
  if (prefs.species && prefs.species !== 'ANY') {
    if (String(animal.species || '').toUpperCase() !== prefs.species) return false
  }
  if (prefs.age && prefs.age !== 'ANY') {
    const years = ageInYears(animal.age)
    if (years === null) return false
    if (prefs.age === 'YOUNG' && years >= 3) return false
    if (prefs.age === 'GROWN' && years < 3) return false
  }
  return true
}

function summarySentence(prefs) {
  const words = SUMMARY_WORDS
  return `You are looking for ${words.species[prefs.species] || 'a companion'}, ${
    words.age[prefs.age] || 'of any age'
  }, ${words.home[prefs.home] || 'at home with you'}, ${
    words.time[prefs.time] || 'with whatever time you have'
  }.`
}

function AnimalCard({ animal }) {
  const quote = String(animal.description || '')
    .split('\n')
    .find((line) => line.trim())
  const cleanQuote = quote ? quote.trim() : null

  return (
    <article className="animal-card">
      <div className="animal-media">
        <AnimalPortrait
          src={animalImageUrl(animal)}
          alt={animal.name}
          species={animal.species}
          name={animal.name}
        />
        <StatusBadge status={animal.status} />
      </div>
      <div className="animal-body">
        <h3>
          <Link to={`/adoption/animals/${animal.id}`}>{animal.name}</Link>
        </h3>
        <p className="animal-meta">
          {[animal.species, animal.breed, animal.age].filter(Boolean).join(' · ')}
        </p>
        {cleanQuote && <p className="muted">“{cleanQuote}”</p>}
        <Link className="animal-cta" to={`/adoption/animals/${animal.id}`}>
          Meet {animal.name} →
        </Link>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */

function CompanionWizard({ onDone, onSkip }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const question = QUESTIONS[step]
  const selected = answers[question.key]
  const isLast = step === QUESTIONS.length - 1

  function choose(value) {
    setAnswers((prev) => ({ ...prev, [question.key]: value }))
  }

  function next() {
    if (!selected) return
    if (isLast) onDone(answers)
    else setStep((s) => s + 1)
  }

  function back() {
    if (step === 0) onSkip()
    else setStep((s) => s - 1)
  }

  return (
    <div className="wizard" aria-live="polite">
      <div className="wizard-progress" aria-hidden="true">
        {QUESTIONS.map((item, index) => (
          <span key={item.key} className={index <= step ? 'done' : ''} />
        ))}
      </div>

      <p className="kicker">
        Question {step + 1} of {QUESTIONS.length}
      </p>
      <h2 className="wizard-q">{question.q}</h2>
      <p className="wizard-hint">{question.hint}</p>

      <div className="wizard-options" role="group" aria-label={question.q}>
        {question.options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={`wizard-option${selected === option.value ? ' selected' : ''}`}
            aria-pressed={selected === option.value}
            onClick={() => choose(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="wizard-nav">
        <button type="button" className="btn-link" onClick={back}>
          {step === 0 ? 'Just show me everyone' : '← Back'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selected}
          onClick={next}
        >
          {isLast ? 'Show me who is waiting' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Adoption listing page.
 */
export default function Adoption() {
  const { isNgo } = useAuth()
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [prefs, setPrefs] = useState(null) // null = wizard, {} = show all

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

  const showAll = prefs === null ? false : Object.keys(prefs).length === 0
  const { matches, others } = useMemo(() => {
    if (!prefs || showAll) return { matches: animals, others: [] }
    return {
      matches: animals.filter((a) => matchesPrefs(a, prefs)),
      others: animals.filter((a) => !matchesPrefs(a, prefs)),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animals, prefs, showAll])

  return (
    <section className="page">
      {isNgo ? (
        <>
          <p className="kicker">Adoption catalogue</p>
          <h1>The adoption catalogue.</h1>
          <p className="lead">
            Every animal rescue partners have published - the same
            catalogue adopters browse.
          </p>
        </>
      ) : (
        <>
          <p className="kicker">Adoption</p>
          <h1>Find your companion.</h1>
          <p className="lead">
            Not a search form. Four gentle questions, then the animals whose
            profiles fit what you told us - and everyone else who is still waiting.
          </p>
        </>
      )}

      {/* The companion survey is for adopters - never shown in an NGO session. */}
      {!isNgo && prefs === null && (
        <CompanionWizard onDone={setPrefs} onSkip={() => setPrefs({})} />
      )}

      {!isNgo && prefs !== null && (
        <div className="wizard-summary">
          {showAll ? (
            <>Showing every animal waiting for a home.</>
          ) : (
            <>
              {summarySentence(prefs)}{' '}
              <button
                type="button"
                className="btn-link"
                onClick={() => setPrefs(null)}
              >
                Change answers
              </button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <AnimalGridSkeleton count={6} />
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={() => setRetryKey((key) => key + 1)} />
      ) : animals.length === 0 ? (
        <EmptyState
          title="No matches yet"
          message="Maybe your companion is waiting in another place - new animals appear as soon as rescue partners publish them."
        >
          <Link className="btn btn-primary" to="/events">
            See upcoming events
          </Link>
        </EmptyState>
      ) : prefs !== null && !showAll ? (
        <>
          <div className="match-head">
            <h2>Waiting for you</h2>
            <p>Matched on species and age - the rest you will discover when you meet them.</p>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              title="No matches yet"
              message="Maybe your companion is waiting in another place. Everyone else is below."
            />
          ) : (
            <div className="animal-grid">
              {matches.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <>
              <div className="match-head">
                <h2>Others still waiting</h2>
                <p>Different from your answers - still worth meeting.</p>
              </div>
              <div className="animal-grid">
                {others.map((animal) => (
                  <AnimalCard key={animal.id} animal={animal} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="match-head">
            <h2>Animals waiting for a home</h2>
            <p>Every listing below is currently available for adoption.</p>
          </div>
          <div className="animal-grid">
            {animals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
