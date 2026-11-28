<script>
  import { tooltip } from 'svooltip'
  import { compare, pinA, show, toggleAB, unpin } from '../store/compare.ts'

  // "\" flips A/B when no field has focus
  function onKey(e) {
    if (e.key !== '\\' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
    const t = e.target
    if (t instanceof HTMLElement && (t.isContentEditable || t.closest('input, textarea, select, [contenteditable]'))) return
    if (!$compare.other) return
    if (toggleAB()) e.preventDefault()
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="ab-compare" role="group" aria-label="A/B compare">
  {#if $compare.other}
    <button
      class="ab"
      aria-pressed={$compare.showing === 'a'}
      onclick={() => show('a')}
      use:tooltip={{content: 'Version A (press \\ to flip)'}}
    >A</button>
    <button
      class="ab"
      aria-pressed={$compare.showing === 'b'}
      onclick={() => show('b')}
      use:tooltip={{content: 'Version B (press \\ to flip)'}}
    >B</button>
    <button class="unpin" onclick={unpin} use:tooltip={{content: 'Stop comparing, keep the one showing'}}>
      <span class="sr-only">Stop comparing and keep version {$compare.showing.toUpperCase()}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"/></svg>
    </button>
  {:else}
    <button class="ab pin" onclick={pinA} use:tooltip={{html: true, content: '<span class="rich-tooltip">Pin this gradient as A, keep editing as B, then flip between them to compare.</span>'}}>
      A/B<span class="sr-only">: pin this gradient as A to compare it with your next edits</span>
    </button>
  {/if}
</div>

<style>
  .ab-compare {
    grid-area: 1/1;
    place-self: start start;
    margin-block-start: calc(var(--size-5) * -1.5);
    margin-inline-start: calc(32px + var(--size-2));
    block-size: 32px;
    display: flex;
    align-items: center;
    gap: 2px;
    z-index: 1;
  }

  button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    block-size: 24px;
    min-inline-size: 24px;
    padding-inline: var(--size-1);
    display: inline grid;
    place-items: center;
    border-radius: var(--radius-2);
    font: 700 var(--font-size-0) / 1 var(--font-sans, system-ui);
    letter-spacing: .02em;
    color: var(--text-1);
    box-shadow: inset 0 0 0 2px var(--text-1);
    -webkit-tap-highlight-color: transparent;
  }

  .ab[aria-pressed="true"] {
    background: var(--text-1);
    color: var(--surface-1);
  }

  .pin {
    padding-inline: var(--size-2);
  }

  .unpin {
    box-shadow: none;
    color: var(--text-2);
  }

  button:focus-visible {
    outline: 2px solid var(--link);
    outline-offset: 2px;
  }

  @media (hover: hover) {
    .ab:not([aria-pressed="true"]):hover,
    .unpin:hover {
      background: color-mix(in oklab, var(--text-1) 15%, transparent);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    button {
      transition: background-color .2s var(--ease-3), color .2s var(--ease-3);
    }
  }
</style>
