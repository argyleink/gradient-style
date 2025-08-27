<script>
  import { tooltip } from 'svooltip'
  import Hint from './Hint.svelte'
  import { createEventDispatcher } from 'svelte'

  // The currently selected type for this instance (e.g. layer)
  export let value = 'linear'
  // Unique base to scope input ids and radio group name per instance
  export let idBase = 'gradient'

  const gradient_types = ['linear','radial','conic']
  const name = `${idBase}-gradient-type`
  const dispatch = createEventDispatcher()

  // Local selection to reflect immediate UI before parent/store updates
  let selected = value
  $: selected = value

  function onChange(t) {
    selected = t
    dispatch('change', t)
  }
</script>

<fieldset class="switch-group">
  <Hint title="Gradient types" copy="Here you can change between linear, radial and conic types." />
  {#each gradient_types as t}
    <div class="switch" title={t} use:tooltip={{content: "You're looking beautiful today!"}}>
      <input
        type="radio"
        name={`${idBase}-${t}-${name}`}
        id={`${idBase}-${t}-gradient`}
        value={t}
        checked={selected === t}
        on:change={() => onChange(t)}
      >
      <label for={`${idBase}-${t}-gradient`}>{t}</label>
      {#if t === 'linear'}
        <svg viewBox="0 0 24 24">
          <path d="M9 13v-2h2v2m0 2v-2h2v2m-2-4V9h2v2M9 9V7h2v2m-2 8v-2h2v2M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2m15 10v2h-2v-2m2-4v2h-2v-2m2-4v2h-2V7m-5-2v2h2V5h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v-2h-2v2H5V5Z"/>
        </svg>
      {/if}
      {#if t === 'radial'}
        <svg viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"/>
            <path d="M12 22c-3.314 0-6-4.477-6-10S8.686 2 12 2"/>
          </g>
        </svg>
      {/if}
      {#if t === 'conic'}
        <svg viewBox="0 0 24 24">
          <path d="M12 22c-5.52-.006-9.994-4.48-10-10v-.2C2.11 6.305 6.635 1.928 12.13 2c5.497.074 9.904 4.569 9.868 10.065C21.962 17.562 17.497 22 12 22Zm-8-9.828A8 8 0 1 0 20 12h-8V4a8.01 8.01 0 0 0-8 8v.172Z"/>
        </svg>
      {/if}
    </div>
  {/each}
</fieldset>

<style>
  .switch-group {
    display: flex;
    border: none;
    padding: 0;
    gap: var(--size-1);
  }

  .switch {
    display: grid;
    grid: [pile] 1fr / [pile] 1fr;
    border-radius: var(--radius-round);
    border: 1px solid transparent;
    padding: var(--size-2);
    place-content: center;
    color: var(--text-2);
  }

  .switch:hover {
    background: var(--surface-1);
  }

.switch:has(input:focus-visible) {
    outline: 1px solid var(--link);
  }

  .switch:has(input:checked) {
    color: var(--text-1);
    background: var(--surface-2);
    border-color: var(--surface-4);
  }

  @media (prefers-color-scheme: light) {
    .switch:hover {
      background: var(--surface-2);
    }

    .switch:has(input:checked) {
      background: var(--surface-2);
    }
  }

  .switch > * {
    grid-area: pile;
  }

.switch > :is(input, label) {
    opacity: 0;
    inline-size: 0;
    block-size: 0;
  }

  .switch > svg {
    max-inline-size: var(--size-4);
    fill: currentColor;
  }

  .switch:last-child {
    margin-inline-end: calc(var(--size-2) * -1);
  }
</style>
