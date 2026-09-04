/* ------------------------------------------------------------------ *
 *  The film manifest.
 *
 *  Every chapter names its clip here and nowhere else. Sections read
 *  `films.hero`, never a string path — so re-cutting a chapter is a
 *  one-line change and a missing file is a typo at the import rather
 *  than a silent 404 halfway down the page.
 *
 *  Files live in public/assets and are served from the site root, so the
 *  URLs are root-absolute. Each clip ships as:
 *
 *    <name>.mp4      1280x720  H.264 all-intra  — the desktop source
 *    <name>-sm.mp4    854x480  H.264 all-intra  — served under 860px
 *    <name>.webm     1280x720  VP9   all-intra  — codec fallback
 *    <name>.jpg                                 — poster / still
 *
 *  See build/encode-films.sh for why every frame is a keyframe and why
 *  there are two codecs.
 * ------------------------------------------------------------------ */

const VIDEO_DIR = '/assets/videos'
const POSTER_DIR = '/assets/posters'

const film = (file) => ({
  src: `${VIDEO_DIR}/${file}.mp4`,
  srcSm: `${VIDEO_DIR}/${file}-sm.mp4`,
  srcWebm: `${VIDEO_DIR}/${file}.webm`,
  poster: `${POSTER_DIR}/${file}.jpg`,
})

export const films = {
  hero: film('Floating_marble_lounge_chair'),
  living: film('Travertine_coffee_table_reveal'),
  light: film('Pendant_light_descends'),
  kitchen: film('Marble_kitchen_island'),
  bedroom: film('King_size_bed_assembly'),
  materials: film('Cube_rotating_material_transitions'),
  blueprint: film('Architectural_blueprint_to_3D_model'),
  finale: film('Floating_furniture_assembling_villa'),
}

/* ------------------------------------------------------------------ *
 *  Which file this engine can actually decode.
 *
 *  A <source> list would be the declarative answer, but the scrub hook
 *  needs to know the resolved URL up front and `video.currentTime` has to
 *  be driven on a single element whose source never changes underneath
 *  it. So the choice is made once, here, and the winning URL is set as a
 *  plain src.
 *
 *  H.264 first: it is the only codec Safari can be relied on for. The
 *  WebM exists for Chromium built without proprietary codecs — the Linux
 *  distribution builds and Playwright's bundled browser — where
 *  canPlayType comes back empty for avc1 and an mp4 fails the load
 *  outright with DEMUXER_ERROR_NO_SUPPORTED_STREAMS.
 *
 *  Computed lazily and cached: it needs a document, and it cannot change
 *  within a session.
 * ------------------------------------------------------------------ */
let codec = null

export function preferredCodec() {
  if (codec) return codec
  if (typeof document === 'undefined') return 'h264'
  const probe = document.createElement('video')
  // 'maybe' is good enough — engines answer 'probably' only when handed a
  // full codec string they are certain of.
  const h264 = probe.canPlayType('video/mp4; codecs="avc1.640028"')
  codec = h264 ? 'h264' : probe.canPlayType('video/webm; codecs="vp9"') ? 'vp9' : 'h264'
  return codec
}

/** Resolve a film to the one URL this engine should load. */
export function filmSource(film, compact) {
  // The WebM rendition is 720p only; a narrow window on a codec-limited
  // build gets the full-size WebM rather than nothing.
  if (preferredCodec() === 'vp9') return film.srcWebm
  return compact ? film.srcSm : film.src
}

/** The other codec, for one retry when the chosen source errors.
    canPlayType is a claim, not a guarantee: a browser can advertise
    H.264 and still fail on a particular file, driver or build. */
export function alternateSource(film, compact) {
  if (preferredCodec() === 'vp9') return compact ? film.srcSm : film.src
  return film.srcWebm
}

/* ------------------------------------------------------------------ *
 *  Isolated product stills, shot against a neutral ground.
 *
 *  Two of the twelve the brief asks for. Higgsfield's account limit turned
 *  out to be five generations a day, and the three missing films took
 *  priority over the stills — a chapter with no film has nothing to show,
 *  where the stills have no section waiting on them yet.
 *
 *  The remaining ten are listed here as the manifest they will slot into.
 *  Uncomment each as its file lands; the gallery that uses them is worth
 *  building once the set is complete, not around a third of it.
 * ------------------------------------------------------------------ */
const still = (file) => `/assets/img/${file}.webp`

export const stills = {
  chair: still('lounge-chair'),
  pendant: still('pendant-light'),
  // coffeeTable:  travertine-coffee-table
  // island:       marble-kitchen-island
  // bed:          king-size-bed
  // faucet:       brass-faucet
  // olive:        olive-tree
  // floorLamp:    floor-lamp
  // sculptures:   sculpture-set
  // cube:         material-cube
  // blueprint:    architectural-blueprint
  // villaModel:   villa-scale-model
}
