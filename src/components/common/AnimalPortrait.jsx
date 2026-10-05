import { useEffect, useState } from 'react'

/**
 * AnimalPortrait - photography-first image with an editorial fallback.
 *
 * - src present  -> real photo (uploaded animal photo, story photo, ...)
 * - photo fails / missing -> warm illustrated panel (line-art dog or cat),
 *   so the layout always looks designed even before real photographs
 *   are dropped into the site (see docs/PHOTOGRAPHY.md).
 *
 *   <AnimalPortrait src={url} alt="Milo" species="DOG" name="Milo" />
 */

const PANEL = '#efeae1'
const PANEL_DEEP = '#e7dfd1'
const LINE = '#8c7b64'
const INK = '#4a4238'

function PanelBase({ children }) {
  return (
    <svg
      className="portrait-ph"
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="500" fill={PANEL} />
      <circle cx="200" cy="242" r="152" fill={PANEL_DEEP} />
      {children}
    </svg>
  )
}

function DogArt() {
  return (
    <PanelBase>
      <g
        fill="none"
        stroke={LINE}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* long floppy ears hanging beside the head */}
        <path d="M136 198 C96 186 68 222 72 272 C75 312 98 330 120 320 C140 311 142 282 138 250" />
        <path d="M264 198 C304 186 332 222 328 272 C325 312 302 330 280 320 C260 311 258 282 262 250" />
        {/* head */}
        <path d="M200 175 C252 175 288 213 288 268 C288 330 250 372 200 372 C150 372 112 330 112 268 C112 213 148 175 200 175 Z" />
        {/* muzzle */}
        <path d="M172 300 C172 285 186 278 200 278 C214 278 228 285 228 300 C228 318 214 330 200 330 C186 330 172 318 172 300 Z" />
        {/* nose + smile */}
        <path d="M200 307 L200 315 M200 315 C194 324 184 325 179 319 M200 315 C206 324 216 325 221 319" />
      </g>
      <path
        d="M191 291 C196 286 204 286 209 291 C209 300 204 306 200 306 C196 306 191 300 191 291 Z"
        fill={INK}
      />
      <circle cx="172" cy="261" r="6.5" fill={INK} />
      <circle cx="228" cy="261" r="6.5" fill={INK} />
    </PanelBase>
  )
}

function CatArt() {
  return (
    <PanelBase>
      <g
        fill="none"
        stroke={LINE}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* ears */}
        <path d="M136 224 L126 152 L186 192 Z" />
        <path d="M264 224 L274 152 L214 192 Z" />
        {/* head */}
        <path d="M200 190 C248 190 282 226 282 274 C282 332 246 370 200 370 C154 370 118 332 118 274 C118 226 152 190 200 190 Z" />
        {/* content closed eyes */}
        <path d="M158 268 C165 258 177 258 184 268" />
        <path d="M216 268 C223 258 235 258 242 268" />
        {/* mouth */}
        <path d="M200 298 C200 306 193 310 187 307 M200 298 C200 306 207 310 213 307" />
        {/* whiskers */}
        <path d="M166 300 L114 292 M166 312 L116 317" />
        <path d="M234 300 L286 292 M234 312 L284 317" />
      </g>
      <path d="M193 285 L207 285 L200 295 Z" fill={INK} />
    </PanelBase>
  )
}

function PawArt() {
  return (
    <PanelBase>
      <g fill={LINE} opacity="0.75">
        <ellipse cx="200" cy="268" rx="52" ry="44" />
        <ellipse cx="138" cy="204" rx="21" ry="27" transform="rotate(-18 138 204)" />
        <ellipse cx="179" cy="178" rx="22" ry="29" />
        <ellipse cx="224" cy="178" rx="22" ry="29" />
        <ellipse cx="265" cy="204" rx="21" ry="27" transform="rotate(18 265 204)" />
      </g>
    </PanelBase>
  )
}

function Placeholder({ species }) {
  const key = String(species || '').toUpperCase()
  if (key.startsWith('DOG')) return <DogArt />
  if (key.startsWith('CAT')) return <CatArt />
  return <PawArt />
}

export default function AnimalPortrait({
  src,
  alt = '',
  species,
  name,
  eager = false,
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt || name || 'Animal portrait'}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span className="portrait-ph-wrap" role="img" aria-label={alt || name || 'Animal illustration'}>
      <Placeholder species={species} />
    </span>
  )
}
