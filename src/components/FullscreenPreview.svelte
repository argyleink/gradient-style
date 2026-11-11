<script>
  import { tooltip } from 'svooltip'

  /** @type {{ modern: string, classic: string, hd?: boolean, canToggleHd?: boolean }} */
  let { modern, classic, hd = $bindable(true), canToggleHd = true } = $props()

  /** @type {HTMLDialogElement | undefined} */
  let dialog = $state()
  /** @type {HTMLButtonElement | undefined} */
  let exitBtn = $state()
  let open = $state(false)
  let idle = $state(false)
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let idleTimer

  // Classic first so browsers that can't parse the modern syntax still paint something, same as the main preview
  let background = $derived(`background: ${classic};` + (hd ? ` background: ${modern};` : ''))

  // Text fields keep the F key for typing
  /** @param {Element | null} el */
  function isTextEditing(el) {
    if (!el) return false
    if (el instanceof HTMLElement && el.isContentEditable) return true
    if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true
    if (el.tagName !== 'INPUT') return false
    return !(el instanceof HTMLInputElement) || !['range', 'checkbox', 'radio', 'button', 'submit', 'reset', 'color', 'file'].includes(el.type)
  }

  function wake() {
    idle = false
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => idle = true, 2500)
  }

  // A touch tap's click is hit-tested after the controls reappear, so remember they were hidden
  let revealTap = false

  function onPointerDown() {
    revealTap = idle
    wake()
  }

  /** @param {MouseEvent} e */
  function onClickCapture(e) {
    if (!revealTap) return
    revealTap = false
    e.stopPropagation()
    e.preventDefault()
  }

  function show() {
    if (!dialog || dialog.open) return
    dialog.showModal()
    open = true
    // Land on Exit, not the HDR toggle the dialog would pick by default
    exitBtn?.focus()
    wake()
    // Real fullscreen where the platform allows it; the modal dialog already covers the viewport otherwise
    dialog.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {})
  }

  function hide() {
    if (!dialog?.open) return
    dialog.close()
  }

  function onClose() {
    open = false
    idle = false
    clearTimeout(idleTimer)
    if (document.fullscreenElement === dialog) document.exitFullscreen?.().catch(() => {})
  }

  // Esc first leaves browser fullscreen without a cancel event; follow it out of the preview too
  function onFullscreenChange() {
    if (open && !document.fullscreenElement) hide()
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.defaultPrevented || e.repeat || e.isComposing) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    // e.key respects the user's layout; fall back to the physical key only for non-Latin layouts
    const key = /^[a-z]$/i.test(e.key) ? e.key.toLowerCase() : (e.code === 'KeyF' ? 'f' : '')
    if (key !== 'f') return
    if (!open && isTextEditing(document.activeElement)) return
    // Another modal (import, color picker) owns the keyboard
    if (!open && document.querySelector('dialog[open]')) return
    e.preventDefault()
    open ? hide() : show()
  }
</script>

<svelte:window onkeydown={onKeydown} />
<svelte:document onfullscreenchange={onFullscreenChange} />

<button
  class="fullscreen-btn"
  onclick={show}
  aria-keyshortcuts="F"
  use:tooltip={{content: 'Fullscreen preview (F)'}}
>
  <span class="sr-only">Fullscreen preview (F)</span>
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path fill="currentColor" d="M4 20q-.425 0-.712-.288T3 19v-4q0-.425.288-.712T4 14q.425 0 .713.288T5 15v3h3q.425 0 .713.288T9 19q0 .425-.288.713T8 20H4Zm0-10q-.425 0-.712-.288T3 9V5q0-.425.288-.712T4 4h4q.425 0 .713.288T9 5q0 .425-.288.713T8 6H5v3q0 .425-.288.713T4 10Zm11 10q-.425 0-.712-.288T14 19q0-.425.288-.712T15 18h3v-3q0-.425.288-.712T19 14q.425 0 .713.288T20 15v4q0 .425-.288.713T19 20h-4Zm4-10q-.425 0-.712-.288T18 9V6h-3q-.425 0-.712-.288T14 5q0-.425.288-.712T15 4h4q.425 0 .713.288T20 5v4q0 .425-.288.713T19 10Z"/>
  </svg>
</button>

<dialog
  bind:this={dialog}
  class="fullscreen-preview"
  aria-label="Fullscreen gradient preview"
  data-idle={idle}
  style={background}
  onclose={onClose}
  onpointermove={wake}
  onpointerdown={onPointerDown}
  onclickcapture={onClickCapture}
  onkeydown={() => { revealTap = false; wake() }}
>
  <div class="fullscreen-actions">
    {#if canToggleHd}
      <button class="pill" aria-label="HDR gradient" aria-pressed={hd} onclick={() => hd = !hd}>
        <span aria-hidden="true">{hd ? 'HDR' : 'SDR'}</span>
      </button>
    {/if}
    <button class="pill" onclick={hide} bind:this={exitBtn}>
      Exit <kbd>Esc</kbd>
    </button>
  </div>
</dialog>

<style>
  .fullscreen-btn {
    inline-size: var(--size-7);
    aspect-ratio: 1;
    padding: 0;
    border: none;
    border-radius: var(--radius-round);
    display: grid;
    place-items: center;
    color: var(--text-2);
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);

    --_bg: transparent;
  }

  .fullscreen-btn > svg {
    inline-size: var(--size-5);
    block-size: var(--size-5);
  }

  .fullscreen-btn:is(:hover, :focus-visible) {
    color: var(--text-1);
  }

  .fullscreen-preview {
    position: fixed;
    inset: 0;
    inline-size: 100vw;
    block-size: 100vh;
    block-size: 100dvh;
    max-inline-size: none;
    max-block-size: none;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    cursor: default;
  }

  .fullscreen-preview[data-idle="true"] {
    cursor: none;
  }

  .fullscreen-preview::backdrop {
    background: Canvas;
  }

  .fullscreen-actions {
    position: absolute;
    inset-block-start: max(var(--size-3), env(safe-area-inset-top));
    inset-inline-end: max(var(--size-3), env(safe-area-inset-right));
    display: flex;
    gap: var(--size-2);
  }

  /* Get out of the way once input rests; any pointer move or key press brings them back */
  .fullscreen-preview[data-idle="true"] .fullscreen-actions {
    opacity: 0;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    padding-block: var(--size-1);
    padding-inline: var(--size-3);
    border: none;
    border-radius: var(--radius-round);
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-6);
    color: var(--text-1);
    background: color-mix(in oklab, var(--surface-1) 80%, transparent);
    backdrop-filter: blur(8px);
  }

  .pill[aria-pressed="false"] {
    color: var(--text-2);
  }

  .pill > kbd {
    font-size: .85em;
    padding-inline: var(--size-1);
    border-radius: var(--radius-1);
    background: var(--surface-3);
  }

  @media (prefers-reduced-motion: no-preference) {
    .fullscreen-preview[open] {
      transition: opacity .3s var(--ease-3);
      @starting-style {
        opacity: 0;
      }
    }

    .fullscreen-actions {
      transition: opacity .4s var(--ease-3);
    }

    .fullscreen-btn > svg {
      transition: transform .15s var(--ease-3);
    }

    .fullscreen-btn:active > svg {
      transform: scale(.85);
    }
  }
</style>
