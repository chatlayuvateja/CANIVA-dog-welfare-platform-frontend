import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { animalImageUrl, listAvailableAnimals } from '../../api/animalApi.js'
import { listPublishedStories, storyImageUrl } from '../../api/storyApi.js'
import { listUrgentCases } from '../../api/urgentApi.js'
import { listPublishedEvents } from '../../api/eventApi.js'
import AnimalPortrait from '../../components/common/AnimalPortrait.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import {
  AnimalGridSkeleton,
  EventGridSkeleton,
} from '../../components/common/Skeleton.jsx'
import EventCard from './EventCard.jsx'

const inr = new Intl.NumberFormat('en-IN')

/** Small independent loader: one section failing never breaks the page. */
function useSectionData(fetcher, { enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let stale = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((value) => {
        if (!stale) {
          setData(value)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey, enabled])

  const retry = useCallback(() => setRetryKey((key) => key + 1), [])
  return { data, loading, error, retry }
}

function animalCardMeta(animal) {
  return [animal.breed, animal.age].filter(Boolean).join(' · ') || animal.species
}

function firstQuote(text, limit = 120) {
  if (!text) return null
  const flat = String(text).split('\n').find((line) => line.trim()) || ''
  const clean = flat.trim()
  if (!clean) return null
  return clean.length > limit ? `${clean.slice(0, limit).trimEnd()}…` : clean
}

/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="hero-home bleed" aria-labelledby="hero-title">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="hero-eyebrow">A digital shelter for rescued animals</p>
          <h1 className="hero-title" id="hero-title">
            They were left behind.
            <span className="thin">They don’t have to stay forgotten.</span>
          </h1>
          <p className="hero-sub">
            CANIVA connects rescued animals with the people, care and second
            chances they deserve.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" to="/adoption">
              Find an animal
            </Link>
            <a className="btn btn-secondary btn-lg" href="#give">
              Help them
            </a>
          </div>
          <div className="hero-trust">
            <span>Every listing comes from a real rescue partner</span>
            <span>Adoption, vaccination and registration events</span>
            <span>Stories from the people who showed up</span>
          </div>
        </div>

        <figure className="hero-figure">
          <div className="hero-portrait">
            <AnimalPortrait
              src="/photos/hero.jpg"
              alt="A rescued dog waiting at a shelter entrance"
              species="DOG"
              eager
            />
          </div>
          <figcaption>
            Every animal here is waiting for someone to notice.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function MeetThem({ animals, loading, error, retry }) {
  const featured = (animals || []).slice(0, 6)

  return (
    <section className="band" id="meet" aria-labelledby="meet-title">
      <div className="section-head">
        <p className="kicker">Waiting right now</p>
        <h2 className="section-title" id="meet-title">
          Meet the ones waiting for a home.
        </h2>
        <p className="section-lede">
          Not records. Names, habits, small personalities — animals who would
          recognise you by the sound of your footsteps.
        </p>
      </div>

      {loading ? (
        <AnimalGridSkeleton count={6} />
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={retry} />
      ) : featured.length === 0 ? (
        <EmptyState
          title="No matches yet"
          message="Maybe your companion is waiting in another place — new animals appear as soon as rescue partners publish them."
        >
          <Link className="btn btn-primary" to="/adoption">
            See all animals
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="animal-grid">
            {featured.map((animal) => (
              <article className="animal-card" key={animal.id}>
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
                    <Link to={`/adoption/animals/${animal.id}`}>
                      {animal.name}
                    </Link>
                  </h3>
                  <p className="animal-meta">
                    {[animal.species, animal.age]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {firstQuote(animal.description) && (
                    <p className="muted">“{firstQuote(animal.description)}”</p>
                  )}
                  <Link className="animal-cta" to={`/adoption/animals/${animal.id}`}>
                    Meet {animal.name} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="section-foot">
            <Link to="/adoption">See all animals →</Link>
          </p>
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */

function StoriesSection() {
  const { data, loading, error, retry } = useSectionData(() =>
    listPublishedStories(),
  )
  const stories = Array.isArray(data) ? data : []
  const featured = stories.slice(0, 3)

  // No published stories yet -> no empty shell on the homepage;
  // the /stories page carries the waiting state instead.
  if (!loading && !error && featured.length === 0) return null

  return (
    <section className="band band-warm bleed" id="stories" aria-labelledby="stories-title">
      <div className="section-head">
        <p className="kicker">Rescue stories</p>
        <h2 className="section-title" id="stories-title">
          Every rescue has a story.
        </h2>
        <p className="section-lede">
          Written by the people who were there — from a roadside to a warm bed.
        </p>
      </div>

      {loading ? (
        <div className="story-grid" aria-hidden="true">
          {[0, 1, 2].map((i) => (
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
        <ErrorMessage message={error.message} onRetry={retry} />
      ) : (
        <>
          <div className="story-grid">
            {featured.map((story) => {
              const cover =
                storyImageUrl(story, 'AFTER') || storyImageUrl(story, 'BEFORE')
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
                    <h3 className="story-title">
                      <Link to={`/stories/${story.id}`}>{story.title}</Link>
                    </h3>
                    {story.summary && <p className="story-sum">{story.summary}</p>}
                    <Link className="story-link" to={`/stories/${story.id}`}>
                      Read the story →
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
          <p className="section-foot">
            <Link to="/stories">Every rescue has a story →</Link>
          </p>
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */

function UrgentSection() {
  const { data, loading, error, retry } = useSectionData(() =>
    listUrgentCases(),
  )
  const cases = Array.isArray(data) ? data : []

  if (!loading && !error && cases.length === 0) return null

  return (
    <section className="band" id="urgent" aria-labelledby="urgent-title">
      <div className="section-head">
        <p className="kicker">Urgent</p>
        <h2 className="section-title" id="urgent-title">
          Someone needs help right now.
        </h2>
        <p className="section-lede">
          Real cases from rescue partners — treatment in progress, every bit of
          progress visible below.
        </p>
      </div>

      {loading ? (
        <div className="skeleton-rows" aria-hidden="true">
          <div className="skeleton sk-line" />
          <div className="skeleton sk-line" />
          <div className="skeleton sk-line" />
        </div>
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={retry} />
      ) : (
        <div className="urgent-grid">
          {cases.map((item) => {
            const pct = Math.max(0, Math.min(100, item.progressPercent ?? 0))
            return (
              <article className="urgent-card" key={item.id}>
                <div className="urgent-head">
                  <span className="badge badge-urgent">Urgent</span>
                  {item.ngoName && <span className="muted">{item.ngoName}</span>}
                </div>
                <h3 className="urgent-title">
                  {item.animalName} {item.treatmentRequired}.
                </h3>
                {item.story && <p className="urgent-story">{item.story}</p>}
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Funding progress for ${item.animalName}`}
                >
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="urgent-amounts">
                  <span>
                    <strong>₹{inr.format(Number(item.amountRaised) || 0)}</strong>{' '}
                    raised
                  </span>
                  <span>
                    of{' '}
                    <strong>₹{inr.format(Number(item.amountNeeded) || 0)}</strong>{' '}
                    goal
                  </span>
                </div>
                <Link
                  className="btn btn-accent"
                  to={`/adoption/animals/${item.animalId}`}
                >
                  Help {item.animalName}
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */

function GiveSection({ urgentCount }) {
  return (
    <section className="band band-ink bleed" id="give" aria-labelledby="give-title">
      <div className="section-head">
        <p className="kicker">Giving</p>
        <h2 className="section-title" id="give-title">
          Give them a second chance.
        </h2>
        <p className="section-lede">
          Care costs money long before anyone adopts. This is what a
          contribution can cover — chosen by the people nursing these animals
          back to health.
        </p>
      </div>

      <div className="give-grid">
        <div className="give-card">
          <p className="give-amount">₹500</p>
          <p className="give-copy">
            A week of proper food for a dog recovering on the streets.
          </p>
        </div>
        <div className="give-card">
          <p className="give-amount">₹1,000</p>
          <p className="give-copy">
            Vaccination and basic treatment for a rescued animal.
          </p>
        </div>
        <div className="give-card">
          <p className="give-amount">₹2,500</p>
          <p className="give-copy">
            A full course of recovery care, from medicine to follow-up.
          </p>
        </div>
      </div>

      <p className="section-lede give-note">
        Giving happens directly through the rescue partners — CANIVA never
        takes a cut. Today, the fastest way to help is to open a case, meet an
        animal or come to an event.
      </p>

      <div className="hero-actions give-actions">
        <Link
          className="btn btn-accent btn-lg"
          to={urgentCount > 0 ? '/#urgent' : '/adoption'}
        >
          Help an animal today
        </Link>
        <Link className="btn btn-lg btn-ghost" to="/events">
          Come to an event
        </Link>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function NgoSection({ animals }) {
  // Derive the real rescue partners from live listings (no invented data).
  const partners = []
  const seen = new Set()
  for (const animal of animals) {
    const name = animal.ngoName
    if (!name || seen.has(name)) continue
    seen.add(name)
    const own = animals.filter((a) => a.ngoName === name)
    partners.push({
      name,
      count: own.length,
      kinds: [...new Set(own.map((a) => a.species).filter(Boolean))],
    })
  }

  return (
    <section className="band band-warm bleed" id="rescue" aria-labelledby="rescue-title">
      <div className="section-head">
        <p className="kicker">The people</p>
        <h2 className="section-title" id="rescue-title">
          Behind every rescue is someone who showed up.
        </h2>
        <p className="section-lede">
          NGOs, volunteers, veterinarians and foster families — the humans who
          make the difference visible on every profile.
        </p>
      </div>

      {partners.length > 0 && (
        <div className="ngo-grid">
          {partners.slice(0, 6).map((partner) => (
            <div className="ngo-card" key={partner.name}>
              <h3>{partner.name}</h3>
              <p>
                {partner.count} {partner.count === 1 ? 'animal' : 'animals'}{' '}
                waiting
                {partner.kinds.length > 0 ? ` · ${partner.kinds.join(' & ')}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="people-line">
        <span>Volunteers</span>
        <span>Veterinarians</span>
        <span>Foster families</span>
        <span>Street rescuers</span>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function EventsTeaser() {
  const { data, loading, error, retry } = useSectionData(() =>
    listPublishedEvents({ page: 0, size: 3 }),
  )
  const events = data?.content ?? []

  if (!loading && !error && events.length === 0) return null

  return (
    <section className="band home-events" aria-labelledby="events-title">
      <div className="section-head">
        <p className="kicker">Gather</p>
        <h2 className="section-title" id="events-title">
          Camps, drives and registration days.
        </h2>
        <p className="section-lede">
          Dog registration, vaccination drives and adoption events, organised
          by local NGOs.
        </p>
      </div>

      {loading ? (
        <EventGridSkeleton count={3} />
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={retry} />
      ) : (
        <>
          <div className="event-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <p className="section-foot">
            <Link to="/events">See all events →</Link>
          </p>
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Home - the emotional front door of CANIVA.
 * Pain -> Connection -> Hope -> Action: hero, meet them, rescue stories,
 * urgent cases, giving, the people behind it, then a way to act.
 * Every section loads REAL data independently (zero mock content) and
 * sections without data simply do not render.
 */
export default function Home() {
  const animalsSection = useSectionData(() => listAvailableAnimals())
  const animals = Array.isArray(animalsSection.data) ? animalsSection.data : []
  const { data: urgent } = useSectionData(() => listUrgentCases())
  const urgentCount = Array.isArray(urgent) ? urgent.length : 0

  return (
    <>
      <Hero />
      <div className="page">
        <MeetThem
          animals={animals}
          loading={animalsSection.loading}
          error={animalsSection.error}
          retry={animalsSection.retry}
        />
        <StoriesSection />
        <UrgentSection />
        <GiveSection urgentCount={urgentCount} />
        <NgoSection animals={animals} />
        <EventsTeaser />
      </div>
    </>
  )
}
