/**
 * Skeleton loading states - gentle shimmer instead of spinners
 * wherever a list of editorial cards loads (brief: "elegant skeleton
 * loading, avoid generic spinning loaders").
 *
 *   <AnimalCardSkeleton />      - portrait card placeholder
 *   <SkeletonRows lines={3} />  - text lines for detail/panel loads
 */
export function AnimalCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton sk-media" />
      <div className="sk-body">
        <div className="skeleton sk-line wide" />
        <div className="skeleton sk-line short" />
        <div className="skeleton sk-line quote" />
      </div>
    </div>
  )
}

export function AnimalGridSkeleton({ count = 6 }) {
  return (
    <div className="animal-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <AnimalCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function SkeletonRows({ lines = 3 }) {
  return (
    <div className="skeleton-rows" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div className="skeleton sk-line" key={i} />
      ))}
    </div>
  )
}

/** Text-only card placeholder (events, panels - no photographs). */
export function EventCardSkeleton() {
  return (
    <div className="skeleton-card text-card" aria-hidden="true">
      <div className="sk-body">
        <div className="skeleton sk-line short" />
        <div className="skeleton sk-line wide" />
        <div className="skeleton sk-line quote" />
      </div>
    </div>
  )
}

export function EventGridSkeleton({ count = 6 }) {
  return (
    <div className="event-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}
