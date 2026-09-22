import { Link } from 'react-router-dom'
import { formatDate, formatTime } from '../../utils/date.js'
import { eventTypeLabel } from '../../utils/constants.js'

/**
 * Event summary card (Session 15) - used by Home and Events listing.
 * Renders ONLY fields the API actually returns (EventDto):
 * { id, title, description, eventType, location, eventDate, startTime,
 *   endTime, capacity, slotsEnabled, status, ngoName, createdAt }.
 */
export default function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-card-top">
        <span className="badge badge-blue">{eventTypeLabel(event.eventType)}</span>
        {event.capacity != null && (
          <span className="event-capacity">{event.capacity} seats</span>
        )}
      </div>
      <h3>
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>
      {event.ngoName && <p className="event-ngo">by {event.ngoName}</p>}
      <ul className="meta-list">
        <li>
          <span className="meta-label">Date</span>
          <span>{formatDate(event.eventDate)}</span>
        </li>
        <li>
          <span className="meta-label">Time</span>
          <span>
            {formatTime(event.startTime)}
            {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
          </span>
        </li>
        <li>
          <span className="meta-label">Location</span>
          <span>{event.location}</span>
        </li>
      </ul>
      <Link className="event-details-link" to={`/events/${event.id}`}>
        View details →
      </Link>
    </article>
  )
}
