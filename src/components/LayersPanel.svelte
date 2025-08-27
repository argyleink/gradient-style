<script>
  import { tooltip } from 'svooltip'
  import { tick } from 'svelte'

  import {gradient_type} from '../store/gradient.ts'
  import { layers, active_layer_index, addLayer, selectLayer, moveLayerUp, moveLayerDown, moveLayerToTop, moveLayerToBottom, toggleLayerVisibility, deleteLayer } from '../store/layers.ts'

  import GradientType from './GradientType.svelte'
  import LinearAngle from './LinearAngle.svelte'
  import RadialSize from './RadialSize.svelte'
  import RadialShape from './RadialShape.svelte'
  import RadialPosition from './RadialPosition.svelte'
  import ConicAngle from './ConicAngle.svelte'
  import ConicPosition from './ConicPosition.svelte'
  import Hint from './Hint.svelte'

  // Track which layer detail panels are open, keyed by layer id
  let openById = {}

  // Ensure new layers default to open, preserve existing open states
  $: if ($layers) {
    const copy = { ...openById }
    for (const l of $layers) {
      if (!(l.id in copy)) copy[l.id] = true
    }
    // Remove entries for layers that no longer exist
    for (const id in copy) {
      if (!$layers.find(l => l.id === id)) delete copy[id]
    }
    openById = copy
  }

  function onAddLayer() {
    addLayer({ seed: 'duplicate', position: 'top' })
  }

  function onDetailsToggle(e, i, id) {
    // allow multiple open; just persist this panel's state
    openById = { ...openById, [id]: e.currentTarget.open }
    // select the layer when expanded
    if (e.currentTarget.open) selectLayer(i)
  }

  function onFocusIn(i) {
    // select the layer when any input inside gains focus
    selectLayer(i)
  }

  function onTypeChange(i, t) {
    // Fix regression: defer store update until after selectLayer finishes applying stores
    selectLayer(i)
    // wait for the microtask that clears the guard in applyLayerToStores
    tick().then(() => {
      gradient_type.set(t)
    })
  }

  function onToggleVisibility(i) {
    toggleLayerVisibility(i)
  }

  function onDelete(i) {
    deleteLayer(i)
  }
</script>

<section class="layers {$gradient_type}">
  {#each $layers as layer, i}
    <details class="layer" class:active={i === $active_layer_index} ontoggle={(e)=>onDetailsToggle(e,i,layer.id)} onfocusin={()=>onFocusIn(i)}>
      <summary class="layer-toggle">
        <div class="row">
          <!-- <span class="layer-name">{$layers.length - i}</span> -->
          <div class="inline-type">
            <GradientType
              idBase={`layer-${layer.id}`}
              value={layer.type}
              on:change={(e) => onTypeChange(i, e.detail)}
            />
          </div>
          <button class="layer-actions" aria-label="Layer actions">
            <select tabindex="-1" onchange={(e)=>{ const v=e.currentTarget.value; e.currentTarget.selectedIndex=0; if(v==='Move up') moveLayerUp(i); else if(v==='Move down') moveLayerDown(i); else if(v==='Move to top') moveLayerToTop(i); else if(v==='Move to bottom') moveLayerToBottom(i); else if(v==='Toggle visibility') onToggleVisibility(i); else if(v==='Remove') onDelete(i); }}>
              <option disabled selected>Layer Actions</option>
              <hr>
              <option>Move up</option>
              <option>Move down</option>
              <option>Move to top</option>
              <option>Move to bottom</option>
              <hr>
              <option>Toggle visibility</option>
              <option disabled={$layers.length<=1}>Remove</option>
            </select>
          </button>
        </div>
      </summary>

      {#if i === $active_layer_index}
        {#if $gradient_type === 'linear'}
          <LinearAngle />
        {/if}

        {#if $gradient_type === 'radial'}
          <RadialSize />
          <RadialShape />
          <RadialPosition />
        {/if}

        {#if $gradient_type === 'conic'}
          <ConicAngle />
          <ConicPosition />
        {/if}

      {/if}
    </details>
  {/each}

  <div class="end-of-layers">
    <button class="add-layer" use:tooltip={{content: "New layer"}} onclick={onAddLayer}>
      <Hint title="New layer" copy="Creates another CSS background image layer on top. You can edit it using the same controls." />
      <span class="sr-only">New layer</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M11 19v-6H5v-2h6V5h2v6h6v2h-6v6h-2Z"/>
      </svg>
    </button>
  </div>
</section>

<style>
  .layers {
    display: grid;
    grid-template-rows: auto 1fr;
    align-content: start;
    align-items: start;
    gap: var(--size-1);
    padding-block: var(--size-1);
    accent-color: var(--text-2);
  }

  @media (min-width: 1024px) {
    .layers {
      max-block-size: calc(100cqb - var(--size-content-1));
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
    }
  }

  .layers > :global(.control-set) {
    gap: var(--size-4);
    padding-block: var(--size-2);
  }

  .layer {
    display: grid;
    padding: 0;
  }

  .layer-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-2);
    box-shadow: var(--shadow-2);
    margin: 0;
    padding-inline-start: var(--size-8);
    border-radius: 0;
    border-inline-start: 5px solid transparent;
    --icon-arrow-down: url(https://api.iconify.design/ci:caret-down.svg?color=%23adb5bd);
    --icon-arrow-down-hover-light: url(https://api.iconify.design/ci:caret-down.svg?color=%23111111);
    --icon-arrow-down-hover-dark: url(https://api.iconify.design/ci:caret-down.svg?color=%23ffffff);
    --icon-arrow-right: url(https://api.iconify.design/ci:caret-right.svg?color=%23adb5bd);
    --icon-arrow-right-hover-light: url(https://api.iconify.design/ci:caret-right.svg?color=%23111111);
    --icon-arrow-right-hover-dark: url(https://api.iconify.design/ci:caret-right.svg?color=%23ffffff);
    background-image: var(--icon-arrow-right);
    background-position: var(--size-2) center;
    background-size: 3ex;
    background-repeat: no-repeat;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-2);
    inline-size: 100%;
  }

  .layer-toggle::-webkit-details-marker {
    display: none;
  }

  .layer-toggle {
    outline-offset: -2px;
  }

  .layer[open] > summary {background-image: var(--icon-arrow-down)}
  .layer.active > summary { border-inline-start-color: var(--link); }

  .layer-toggle:hover {--icon-arrow-right: var(--icon-arrow-right-hover-light)}
  .layer[open] > summary:hover {--icon-arrow-down: var(--icon-arrow-down-hover-light)}

  @media (prefers-color-scheme: dark) {
    .layer-toggle:hover {--icon-arrow-right: var(--icon-arrow-right-hover-dark)}
    .layer[open] > summary:hover {--icon-arrow-down: var(--icon-arrow-down-hover-dark)}
  }

  .layer-name {
    flex: 1;
    color: var(--text-1);
    font-weight: 700;
    user-select: none;
  }

  .icon {
    display: inline-grid;
    place-items: center;
    padding: var(--size-1);
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
  }

  .icon.danger {
    --_bg: var(--surface-4);
  }

.layer-actions {
    position: relative;
    inline-size: var(--size-5);
    overflow: hidden;
    border-radius: var(--radius-round);
    padding-inline: 0;
    aspect-ratio: 1;
    border: none;
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
  }

  .layer-actions > select {
    --icon-arrow-down: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    --icon-arrow-up: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    position: absolute;
    inset-inline-end: -1.1ch;
  }

  .end-of-layers {
    place-self: end;
    position: sticky;
    inset-block-end: 0;
  }

  .add-layer {
    padding: var(--size-2);
    margin: var(--size-3);
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);

    --_bg: var(--surface-3);
    --_icon-size: var(--size-6);
  }

  @media (prefers-color-scheme: light) {
    .layers, .layer {
      background-color: var(--surface-1);
    }

    .layer-toggle, .add-layer {
      background-color: white;
    }
  }
</style>
