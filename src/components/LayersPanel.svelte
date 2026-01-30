<script>
  import { tooltip } from 'svooltip'
  import { tick } from 'svelte'
  import { get } from 'svelte/store'
  import { flip } from 'svelte/animate'
  import { scale, slide } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'

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
  function onAddLayer() {
    addLayer({ seed: 'new', position: 'top' })
  }

  function onFocusIn(i) {
    // Avoid redundant store applications: only select if becoming active
    if (get(active_layer_index) !== i) selectLayer(i)
  }

  function onTypeChange(i, t) {
    // Only select when needed
    if (get(active_layer_index) !== i) selectLayer(i)
    // Defer and only set if changed
    tick().then(() => {
      if (get(gradient_type) !== t) gradient_type.set(t)
    })
  }

  function onToggleVisibility(i) {
    toggleLayerVisibility(i)
  }

  function onDelete(i) {
    deleteLayer(i)
  }
</script>

<section class="sidebar-body-wrapper">
  <div class="layers {$gradient_type}">
    {#each $layers as layer, i (layer.id)}
    <div class="layer" class:active={i === $active_layer_index} onfocusin={()=>onFocusIn(i)} tabindex="-1" animate:flip={{duration: 180, easing: quintOut}} in:scale={{start: 0.8, duration: 150, easing: quintOut}}>
      <div class="layer-header">
        <div class="layer-thumb" style={`background-image: ${layer?.cachedCss?.modern ? `${layer.cachedCss.modern}, var(--conic-checkerboard)` : (layer?.cachedCss?.classic ? `${layer.cachedCss.classic}, var(--gradient-checkerboard)` : 'var(--gradient-checkerboard)')}`}></div>
        <GradientType
          idBase={`layer-${layer.id}`}
          value={layer.type}
          on:change={(e) => onTypeChange(i, e.detail)}
        />
        <button class="layer-actions" aria-label="Layer actions" use:tooltip={{content: "Layer Actions"}}>
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
      {#if i === $active_layer_index}
        <div class="layer-body" transition:slide={{duration: 140, easing: quintOut}}>
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
        </div>
      {/if}
    </div>
    {/each}
  </div>

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
  .sidebar-body-wrapper {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--size-1);
    padding-block: var(--size-1);
  }

  .layers {
    display: flex;
    flex-direction: column;
    gap: var(--size-1);
    accent-color: var(--text-2);
  }

  @media (min-width: 1024px) {
    .sidebar-body-wrapper {
      max-block-size: calc(100cqb - var(--size-content-1));
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      scrollbar-width: thin;
    }
  }

   :global(.layers .control-set) {
    gap: var(--size-4);
  }

  .layer {
    padding: 0;
  }

  .layer-header {
    background: light-dark(white, var(--surface-3));
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content 1fr max-content;
    align-items: center;
    gap: var(--size-3);
    box-shadow: var(--shadow-2);
    margin: 0;
    padding-inline: var(--size-3);
    padding-block: var(--size-2);
    border-radius: 0;

    position: sticky;
    top: 0;
    z-index: 1;
  }

  .layer-thumb {
    inline-size: var(--size-7);
    block-size: var(--size-7);
    background-size: cover, 12px 12px;
    background-repeat: no-repeat, repeat;
    box-shadow: var(--shadow-2) inset;
  }

  .layer-body {
    transition: opacity .1s ease;
  }

  /* Active layer animated border */
  .layer:not(:hover):not(.active) .layer-body {
    opacity: .25;
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
    overflow: clip;
    border-radius: var(--radius-round);
    padding-inline: 0;
    aspect-ratio: 1;
    border: none;
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
    background-image: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    background-position: center;
    background-repeat: no-repeat;
    background-size: 75%;
  }

  .layer-actions > select {
    --icon-arrow-down: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    --icon-arrow-up: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    position: absolute;
    inset: 0;
  }

  .end-of-layers {
    place-self: end;
    place-content: end;
    position: sticky;
    z-index: 1;
    inset-block-end: 0;
  }

  .add-layer {
    padding: var(--size-2);
    margin: var(--size-3);
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    border: 1px solid oklch(from var(--surface-4) l c h / 25%);

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
