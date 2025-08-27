<script>
  import { tooltip } from 'svooltip'

  import {gradient_type} from '../store/gradient.ts'
  import { layers, active_layer_index, addLayer, selectLayer, moveLayer, toggleLayerVisibility, deleteLayer } from '../store/layers.ts'

  import GradientType from './GradientType.svelte'
  import LinearAngle from './LinearAngle.svelte'
  import RadialSize from './RadialSize.svelte'
  import RadialShape from './RadialShape.svelte'
  import RadialPosition from './RadialPosition.svelte'
  import ConicAngle from './ConicAngle.svelte'
  import ConicPosition from './ConicPosition.svelte'
  import Hint from './Hint.svelte'

  let draggingIndex = $state(null)

  function onAddLayer() {
    addLayer({ seed: 'duplicate', position: 'top' })
  }

  function onToggle(e, i) {
    // select the layer when expanded
    if (e.currentTarget.open) selectLayer(i)
  }

  function onFocusIn(i) {
    // select the layer when any input inside gains focus
    selectLayer(i)
  }

  function onDragStart(e, i) {
    draggingIndex = i
    try { e.dataTransfer.setData('text/plain', String(i)) } catch {}
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, i) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e, i) {
    e.preventDefault()
    let from = draggingIndex
    try {
      const t = e.dataTransfer.getData('text/plain')
      if (t) from = parseInt(t)
    } catch {}
    if (from == null || isNaN(from)) return
    if (from !== i) moveLayer(from, i)
    draggingIndex = null
  }

  function onDragEnd() {
    draggingIndex = null
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
<details class="layer" open={i === $active_layer_index} ontoggle={(e)=>onToggle(e,i)} onfocusin={()=>onFocusIn(i)}>
      <summary class="layer-toggle" draggable="true" ondragstart={(e)=>onDragStart(e,i)} ondragover={(e)=>onDragOver(e,i)} ondrop={(e)=>onDrop(e,i)} ondragend={onDragEnd}>
        <div class="row">
          <button class="icon drag" use:tooltip={{content: 'Drag to reorder'}} aria-label="Drag to reorder" draggable="true" ondragstart={(e)=>onDragStart(e,i)} ondragend={onDragEnd}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 20q-.825 0-1.413-.588T8 18q0-.825.588-1.413T10 16q.825 0 1.413.588T12 18q0 .825-.588 1.413T10 20Zm0-6q-.825 0-1.413-.588T8 12q0-.825.588-1.413T10 10q.825 0 1.413.588T12 12q0 .825-.588 1.413T10 14Zm0-6q-.825 0-1.413-.588T8 6q0-.825.588-1.413T10 4q.825 0 1.413.588T12 6q0 .825-.588 1.413T10 8Zm6 12q-.825 0-1.413-.588T14 18q0-.825.588-1.413T16 16q.825 0 1.413.588T18 18q0 .825-.588 1.413T16 20Zm0-6q-.825 0-1.413-.588T14 12q0-.825.588-1.413T16 10q.825 0 1.413.588T18 12q0 .825-.588 1.413T16 14Zm0-6q-.825 0-1.413-.588T14 6q0-.825.588-1.413T16 4q.825 0 1.413.588T18 6q0 .825-.588 1.413T16 8Z"/></svg>
          </button>
          <span class="layer-name">{layer.name || 'Layer'} {i + 1}</span>
<button class="icon" aria-pressed={(layer.visible ?? true) ? 'true' : 'false'} onclick={(e) => { e.stopPropagation(); onToggleVisibility(i) }} use:tooltip={{content: (layer.visible ?? true) ? 'Visible' : 'Hidden'}}>
            {#if layer.visible ?? true}
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 16q1.875 0 3.188-1.313T16.5 11.5q0-1.875-1.313-3.188T12 7q-1.875 0-3.188 1.313T7.5 11.5q0 1.875 1.313 3.188T12 16Zm0-1.8q-1.125 0-1.913-.788T9.3 11.5q0-1.125.788-1.913T12 8.8q1.125 0 1.913.788T14.7 11.5q0 1.125-.787 1.913T12 14.2Zm0 4.8q-3.65 0-6.65-2.038T1 11.5q1.35-3.425 4.35-5.463T12 4q3.65 0 6.65 2.038T23 11.5q-1.35 3.425-4.35 5.463T12 19Z"/></svg>
            {:else}
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="m19.8 22.6l-4.2-4.15q-.875.275-1.762.413T12 19q-3.775 0-6.725-2.087T1 11.5q.525-1.325 1.325-2.463T4.15 7L1.4 4.2l1.4-1.4l18.4 18.4l-1.4 1.4ZM12 16q.275 0 .513-.025t.512-.1l-5.4-5.4q-.075.275-.1.513T7.5 11.5q0 1.875 1.313 3.188T12 16Zm7.3.45l-3.175-3.15q.175-.425.275-.863t.1-.937q0-1.875-1.313-3.188T12 7q-.5 0-.938.1t-.862.3L7.65 4.85q1.025-.425 2.1-.637T12 4q3.775 0 6.725 2.087T23 11.5q-.575 1.475-1.513 2.738T19.3 16.45Zm-4.625-4.6l-3-3q.7-.125 1.288.113t1.012.687q.425.45.613 1.038t.087 1.162Z"/></svg>
            {/if}
          </button>
<button class="icon danger" onclick={(e) => { e.stopPropagation(); onDelete(i) }} use:tooltip={{content: 'Delete layer'}} disabled={$layers.length <= 1} aria-disabled={$layers.length <= 1}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19q-.825 0-1.412-.587T4 17V7H3V5h5V4h8v1h5v2h-1v10q0 .825-.587 1.413T18 19H6Zm12-12H6v10h12V7ZM8 17h2V9H8v8Zm6 0h2V9h-2v8ZM6 7v10V7Z"/></svg>
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

        <!-- Type chooser lives here for active layer only -->
        <div class="control-set">
          <GradientType />
        </div>
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
    gap: var(--size-2);
    padding-block: 1px;
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
    padding-inline-start: var(--size-2);
    border-radius: 0;
    --icon-arrow-down: url(https://api.iconify.design/ci:caret-down.svg?color=%23adb5bd);
    --icon-arrow-down-hover-light: url(https://api.iconify.design/ci:caret-down.svg?color=%23111111);
    --icon-arrow-down-hover-dark: url(https://api.iconify.design/ci:caret-down.svg?color=%23ffffff);
    --icon-arrow-right: url(https://api.iconify.design/ci:caret-right.svg?color=%23adb5bd);
    --icon-arrow-right-hover-light: url(https://api.iconify.design/ci:caret-right.svg?color=%23111111);
    --icon-arrow-right-hover-dark: url(https://api.iconify.design/ci:caret-right.svg?color=%23ffffff);
    background-image: var(--icon-arrow-right);
    background-position: -1px center;
    background-size: 3ex;
    background-repeat: no-repeat; 
  }

  .row {
    display: flex;
    align-items: center;
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

  .icon.drag {
    cursor: grab;
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
