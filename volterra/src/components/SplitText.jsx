import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ *
 *  Line and character splitting, done here rather than with a plugin.
 *
 *  GSAP's SplitText is a Club plugin, so this is the open equivalent:
 *  wrap every word in a span, read back where each one landed, group the
 *  words that share a baseline into lines, then wrap each line in an
 *  overflow-hidden mask. The inner span is what animates, so the line
 *  rises out of a hard edge instead of fading in place.
 *
 *  It has to re-measure on resize, because a narrower column rewraps and
 *  yesterday's line groupings would cut mid-sentence. The original text is
 *  kept so every re-split starts from clean markup rather than from the
 *  previous pass's spans.
 *
 *  Accessibility: the split fills the element with per-word spans, which a
 *  screen reader would read as disconnected fragments. The visible markup
 *  is aria-hidden and the original string is restored in a visually hidden
 *  sibling, so assistive tech gets the sentence and the eye gets the film.
 * ------------------------------------------------------------------ */

function splitIntoLines(host, text) {
  host.textContent = ''

  const probes = []
  const frag = document.createDocumentFragment()
  text.split(/\s+/).forEach((word, i, all) => {
    const span = document.createElement('span')
    span.style.display = 'inline-block'
    span.textContent = word
    frag.appendChild(span)
    probes.push(span)
    if (i < all.length - 1) frag.appendChild(document.createTextNode(' '))
  })
  host.appendChild(frag)

  // One forced layout, then all the reads — measuring inside the loop
  // would thrash.
  const tops = probes.map((s) => s.offsetTop)

  const lines = []
  let current = []
  let lineTop = tops[0]
  probes.forEach((span, i) => {
    // Half a line-height of tolerance: superscripts and mixed fonts shift
    // offsetTop by a pixel or two without starting a new line.
    if (Math.abs(tops[i] - lineTop) > span.offsetHeight * 0.5 && current.length) {
      lines.push(current)
      current = []
      lineTop = tops[i]
    }
    current.push(span.textContent)
  })
  if (current.length) lines.push(current)

  host.textContent = ''
  const out = []
  lines.forEach((words) => {
    const mask = document.createElement('span')
    mask.className = 'line-mask'
    const inner = document.createElement('span')
    inner.style.display = 'block'
    inner.style.willChange = 'transform, opacity'
    inner.textContent = words.join(' ')
    mask.appendChild(inner)
    host.appendChild(mask)
    out.push(inner)
  })
  return out
}

function splitIntoChars(host, text) {
  host.textContent = ''
  const out = []

  // Split on whitespace and keep each word in an inline-block wrapper.
  //
  // Two things went wrong in the first version and they compounded. Every
  // character was its own inline-block, which lets a line break between
  // any two letters; and the separator between words was a non-breaking
  // space, which forbade breaking at the one place a break belongs. The
  // result was a headline reading "We Design E / xperiences."
  //
  // A normal space restores the legal break, and the wrapper makes each
  // word an unbreakable unit so no other break can happen.
  text.split(/(\s+)/).forEach((chunk) => {
    if (!chunk) return
    if (/^\s+$/.test(chunk)) {
      host.appendChild(document.createTextNode(' '))
      return
    }
    const word = document.createElement('span')
    word.style.display = 'inline-block'
    word.style.whiteSpace = 'nowrap'
    Array.from(chunk).forEach((ch) => {
      const span = document.createElement('span')
      span.style.display = 'inline-block'
      span.style.willChange = 'transform, opacity, filter'
      span.textContent = ch
      word.appendChild(span)
      out.push(span)
    })
    host.appendChild(word)
  })
  return out
}

export default function SplitText({
  children,
  as: Tag = 'span',
  mode = 'lines',
  className = '',
  /** Animation shape. `mask` rises out of a clipped edge (lines);
      `punch` scales and unblurs per character (the wordmark). */
  variant = 'mask',
  delay = 0,
  stagger,
  start = 'top 84%',
  trigger,
  enabled = true,
  play = true,
  onSplit,
}) {
  const ref = useRef(null)
  const srRef = useRef(null)
  const text = typeof children === 'string' ? children : String(children ?? '')

  useEffect(() => {
    const host = ref.current
    if (!host) return

    if (!enabled) {
      host.textContent = text
      host.removeAttribute('aria-hidden')
      if (srRef.current) srRef.current.textContent = ''
      return
    }

    let ctx
    let raf

    const run = () => {
      ctx?.revert()
      const parts = mode === 'chars' ? splitIntoChars(host, text) : splitIntoLines(host, text)
      host.setAttribute('aria-hidden', 'true')
      if (srRef.current) srRef.current.textContent = text
      onSplit?.(parts)

      if (!play) return

      ctx = gsap.context(() => {
        const target = trigger?.current ?? host
        if (variant === 'punch') {
          gsap.set(parts, { yPercent: 62, opacity: 0, scale: 1.14, filter: 'blur(9px)' })
          gsap.to(parts, {
            yPercent: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.7,
            ease: 'expo.out',
            stagger: stagger ?? 0.045,
            delay,
            scrollTrigger: { trigger: target, start, once: true },
          })
        } else {
          gsap.set(parts, { yPercent: 112, opacity: 0 })
          gsap.to(parts, {
            yPercent: 0,
            opacity: 1,
            duration: 1.5,
            ease: 'expo.out',
            stagger: stagger ?? 0.1,
            delay,
            scrollTrigger: { trigger: target, start, once: true },
          })
        }
      }, host)
    }

    run()

    // Re-split on width change only. Mobile browsers fire resize when the
    // URL bar collapses, and re-splitting on that would replay the reveal
    // mid-scroll.
    let lastWidth = window.innerWidth
    const onResize = () => {
      if (window.innerWidth === lastWidth) return
      lastWidth = window.innerWidth
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        run()
        ScrollTrigger.refresh()
      })
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
      ctx?.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, mode, variant, enabled, play, delay, stagger, start])

  return (
    <Tag className={className}>
      <span ref={ref} style={{ display: 'block' }}>
        {text}
      </span>
      <span
        ref={srRef}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
        }}
      />
    </Tag>
  )
}
