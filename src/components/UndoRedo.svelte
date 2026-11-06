<script>
  import { onMount } from 'svelte'
  import { tooltip } from 'svooltip'

  import { can_undo, can_redo, undo, redo } from '../store/history.ts'

  let isMac = $state(false)
  let announcement = $state('')

  onMount(() => {
    isMac = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? '')
  })

  let undoLabel = $derived(isMac ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)')
  let redoLabel = $derived(isMac ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Shift+Z)')

  // Text fields keep their own native undo
  function isTextEditing(el) {
    if (!el) return false
    if (el.isContentEditable) return true
    if (el.tagName === 'TEXTAREA') return true
    if (el.tagName !== 'INPUT') return false
    return !['range', 'checkbox', 'radio', 'button', 'submit', 'reset', 'color', 'file'].includes(el.type)
  }

  function announce(msg) {
    // re-set so repeated presses are re-announced
    announcement = ''
    queueMicrotask(() => announcement = msg)
  }

  function doUndo() {
    if (undo()) announce('Undid last change')
  }

  function doRedo() {
    if (redo()) announce('Redid change')
  }

  function onKeydown(e) {
    if (e.defaultPrevented || e.altKey) return
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return
    const key = e.key.toLowerCase()
    const isUndo = key === 'z' && !e.shiftKey
    const isRedo = (key === 'z' && e.shiftKey) || (key === 'y' && e.ctrlKey && !e.shiftKey)
    if (!isUndo && !isRedo) return
    if (isTextEditing(document.activeElement)) return

    e.preventDefault()
    isUndo ? doUndo() : doRedo()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="history-actions" role="group" aria-label="History">
  <button
    class="history-btn"
    onclick={doUndo}
    disabled={!$can_undo}
    aria-keyshortcuts={isMac ? 'Meta+Z' : 'Control+Z'}
    use:tooltip={{content: undoLabel}}
  >
    <span class="sr-only">{undoLabel}</span>
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M8 19q-.425 0-.712-.288T7 18q0-.425.288-.712T8 17h6.1q1.575 0 2.738-1T18 13.5q0-1.5-1.162-2.5T14.1 10H7.8l1.9 1.9q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275L4.7 9.7q-.15-.15-.213-.325T4.425 9q0-.2.063-.375T4.7 8.3l3.6-3.6q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7L7.8 8h6.3q2.425 0 4.163 1.575T20 13.5q0 2.35-1.737 3.925T14.1 19H8Z"/>
    </svg>
  </button>
  <button
    class="history-btn"
    onclick={doRedo}
    disabled={!$can_redo}
    aria-keyshortcuts={isMac ? 'Meta+Shift+Z' : 'Control+Shift+Z Control+Y'}
    use:tooltip={{content: redoLabel}}
  >
    <span class="sr-only">{redoLabel}</span>
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M16.2 10H9.9q-1.575 0-2.738 1T6 13.5q0 1.5 1.163 2.5T9.9 17H16q.425 0 .713.288T17 18q0 .425-.288.712T16 19H9.9q-2.425 0-4.163-1.575T4 13.5q0-2.35 1.738-3.925T9.9 8h6.3l-1.9-1.9q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l3.6 3.6q.15.15.213.325t.062.375q0 .2-.062.375t-.213.325l-3.6 3.6q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7L16.2 10Z"/>
    </svg>
  </button>
  <span class="sr-only" aria-live="polite">{announcement}</span>
</div>

<style>
  .history-actions {
    display: flex;
    gap: var(--size-1);
    margin-inline-end: auto;
  }

  .history-btn {
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

  .history-btn > svg {
    inline-size: var(--size-5);
    block-size: var(--size-5);
  }

  .history-btn:is(:hover, :focus-visible):not(:disabled) {
    color: var(--text-1);
  }

  .history-btn:disabled {
    opacity: .35;
    cursor: not-allowed;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .history-btn > svg {
      transition: transform .15s var(--ease-3);
    }

    .history-btn:not(:disabled):active > svg {
      transform: scale(.85);
    }
  }
</style>
