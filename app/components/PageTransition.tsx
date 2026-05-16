'use client'
import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap');

  #__ptc {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 24px;
    background: #080604;
    pointer-events: all;
    opacity: 0;
    transition: opacity .45s cubic-bezier(.4,0,.2,1);
  }
  #__ptc.in  { opacity: 1; }
  #__ptc.out { opacity: 0; pointer-events: none; }

  #__ptc-shimmer-t,
  #__ptc-shimmer-b {
    height: 1px;
    background: linear-gradient(90deg, transparent, #C9A96E, transparent);
    transition: width .7s cubic-bezier(.4,0,.2,1);
  }
  #__ptc-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.5rem, 5vw, 2.2rem);
    font-weight: 300;
    color: #F0D99A;
    letter-spacing: .04em;
    transition: letter-spacing .9s cubic-bezier(.4,0,.2,1), opacity .7s ease;
    opacity: 0;
  }
  #__ptc-bar-track {
    width: 180px; height: 1px;
    background: rgba(201,169,110,.12);
    overflow: hidden;
    position: relative;
  }
  #__ptc-bar-fill {
    position: absolute; left: 0; top: 0; height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #8A6E3C, #C9A96E, #F0D99A);
    box-shadow: 0 0 8px #C9A96E;
    transition: width .12s linear;
  }
  #__ptc-pct {
    font-family: 'Cormorant Garamond', serif;
    font-size: .68rem;
    letter-spacing: .3em;
    color: rgba(201,169,110,.5);
    transition: color .5s ease;
    margin-top: -8px;
  }
  #__ptc-label {
    font-size: .48rem;
    letter-spacing: .5em;
    text-transform: uppercase;
    color: rgba(201,169,110,.35);
  }

  /* sweep shimmer */
  @keyframes sweep {
    from { transform: translateX(-100%); }
    to   { transform: translateX(200%); }
  }
  #__ptc-sweep {
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 35%, rgba(201,169,110,.05) 50%, transparent 65%);
    animation: sweep 2s .3s linear infinite;
    pointer-events: none;
  }
`

function injectStyles() {
  if (document.getElementById('__ptc-style')) return
  const s = document.createElement('style')
  s.id = '__ptc-style'
  s.textContent = STYLES
  document.head.appendChild(s)
}

function createCurtain() {
  let el = document.getElementById('__ptc') as HTMLDivElement | null
  if (!el) {
    el = document.createElement('div')
    el.id = '__ptc'
    el.innerHTML = `
      <div id="__ptc-sweep"></div>
      <div id="__ptc-shimmer-t" style="width:0px"></div>
      <p id="__ptc-name">Ais &amp; Tangkas</p>
      <div id="__ptc-bar-track">
        <div id="__ptc-bar-fill"></div>
      </div>
      <p id="__ptc-pct">0%</p>
      <p id="__ptc-label">Memuat halaman...</p>
      <div id="__ptc-shimmer-b" style="width:0px"></div>
    `
    document.body.appendChild(el)
  }
  return el
}

export function usePageTransition() {
  const router  = useRouter()
  const pctRef  = useRef(0)
  const rafRef  = useRef<number>(0)
  const intRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const navigate = useCallback((href: string) => {
    injectStyles()
    const curtain = createCurtain()
    pctRef.current = 0

    // Reset elements
    const fill  = document.getElementById('__ptc-bar-fill') as HTMLDivElement
    const pctEl = document.getElementById('__ptc-pct') as HTMLParagraphElement
    const name  = document.getElementById('__ptc-name') as HTMLParagraphElement
    const shT   = document.getElementById('__ptc-shimmer-t') as HTMLDivElement
    const shB   = document.getElementById('__ptc-shimmer-b') as HTMLDivElement

    if (fill)  fill.style.width   = '0%'
    if (pctEl) pctEl.textContent  = '0%'
    if (name)  { name.style.opacity = '0'; name.style.letterSpacing = '.04em' }
    if (shT)   shT.style.width    = '0px'
    if (shB)   shB.style.width    = '0px'

    // Fade in curtain
    curtain.classList.remove('out')
    requestAnimationFrame(() => {
      curtain.classList.add('in')
    })

    // Animate shimmer lines + name after brief delay
    setTimeout(() => {
      if (shT) shT.style.width = '80px'
      if (shB) shB.style.width = '80px'
      if (name) { name.style.opacity = '1'; name.style.letterSpacing = '.18em' }
    }, 150)

    // Fake progress: crawl to 80% during navigation
    const updatePct = (val: number) => {
      pctRef.current = val
      if (fill)  fill.style.width  = `${val}%`
      if (pctEl) pctEl.textContent = `${Math.round(val)}%`
      if (val >= 80 && pctEl) pctEl.style.color = 'rgba(201,169,110,.75)'
    }

    // Crawl progress fast to ~75%, then stall waiting for page
    if (intRef.current) clearInterval(intRef.current)
    let p = 0
    intRef.current = setInterval(() => {
      if (p >= 75) { clearInterval(intRef.current!); return }
      p = Math.min(75, p + Math.random() * 4)
      updatePct(p)
    }, 60)

    // Navigate — router.push resolves but page paint takes longer
    // We use a trick: navigate, then wait for the new page's first paint
    router.push(href)

    // After push, poll for URL change + page ready
    // Use requestAnimationFrame loop to detect when new page has rendered
    const navStart = Date.now()
    const checkReady = () => {
      const elapsed = Date.now() - navStart
      // Minimum display time 600ms, then check if URL changed
      if (elapsed > 600 && window.location.pathname === href) {
        // URL changed = new page has started rendering
        // Jump to 100%
        if (intRef.current) { clearInterval(intRef.current); intRef.current = null }
        let cur = pctRef.current
        const finish = setInterval(() => {
          cur = Math.min(100, cur + 6)
          updatePct(cur)
          if (cur >= 100) {
            clearInterval(finish)
            // Brief pause at 100% then fade out
            setTimeout(() => {
              curtain.classList.remove('in')
              curtain.classList.add('out')
            }, 200)
          }
        }, 20)
        return
      }
      // Also handle timeout — force finish after 3s
      if (elapsed > 3000) {
        if (intRef.current) { clearInterval(intRef.current); intRef.current = null }
        curtain.classList.remove('in')
        curtain.classList.add('out')
        return
      }
      rafRef.current = requestAnimationFrame(checkReady)
    }
    rafRef.current = requestAnimationFrame(checkReady)

  }, [router])

  return navigate
}
