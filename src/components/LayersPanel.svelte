<script>
  import { tooltip } from 'svooltip'

  import {gradient_type, gradient_space} from '../store/gradient.ts'

  import GradientType from './GradientType.svelte'
  import LinearAngle from './LinearAngle.svelte'
  import RadialSize from './RadialSize.svelte'
  import RadialShape from './RadialShape.svelte'
  import RadialPosition from './RadialPosition.svelte'
  import ConicAngle from './ConicAngle.svelte'
  import ConicPosition from './ConicPosition.svelte'

  function toggleVisibility(e) {
    e.preventDefault()
    e.stopPropagation()
    visibility = !visibility
  }
  
  $: visibility = false
</script>

<section class="layers {$gradient_type}">
  <!-- {#each layers as layer}
    <div class="layer selected">
      <span contenteditable>{layer}</span> 
      <GradientType />
    </div>
  {/each} -->
  <details class="layer selected" open>
    <summary class="layer-toggle">
      <!-- <button class="layer-visibility" on:click={toggleVisibility} use:tooltip={{content: "Show or hide (not ready)"}}>
        {#if visibility}
          <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16q1.875 0 3.188-1.313T16.5 11.5q0-1.875-1.313-3.188T12 7q-1.875 0-3.188 1.313T7.5 11.5q0 1.875 1.313 3.188T12 16Zm0-1.8q-1.125 0-1.913-.788T9.3 11.5q0-1.125.788-1.913T12 8.8q1.125 0 1.913.788T14.7 11.5q0 1.125-.787 1.913T12 14.2Zm0 4.8q-3.65 0-6.65-2.038T1 11.5q1.35-3.425 4.35-5.463T12 4q3.65 0 6.65 2.038T23 11.5q-1.35 3.425-4.35 5.463T12 19Z"/></svg>
        {:else}
          <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="m19.8 22.6l-4.2-4.15q-.875.275-1.762.413T12 19q-3.775 0-6.725-2.087T1 11.5q.525-1.325 1.325-2.463T4.15 7L1.4 4.2l1.4-1.4l18.4 18.4l-1.4 1.4ZM12 16q.275 0 .513-.025t.512-.1l-5.4-5.4q-.075.275-.1.513T7.5 11.5q0 1.875 1.313 3.188T12 16Zm7.3.45l-3.175-3.15q.175-.425.275-.863t.1-.937q0-1.875-1.313-3.188T12 7q-.5 0-.938.1t-.862.3L7.65 4.85q1.025-.425 2.1-.637T12 4q3.775 0 6.725 2.087T23 11.5q-.575 1.475-1.513 2.738T19.3 16.45Zm-4.625-4.6l-3-3q.7-.125 1.288.113t1.012.687q.425.45.613 1.038t.087 1.162Z"/></svg>
        {/if}
      </button> -->
      <span class="layer-name">Layer 1</span> 
      <GradientType />
    </summary>

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
  </details>

  <div class="end-of-layers">
    <button disabled class="add-layer" use:tooltip={{content: "New layer"}}>
      <!-- title="Add a layer! CSS backgrounds can have multiple gradients layered on top of each other. You can manage them all here." -->
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
    padding-inline-start: var(--size-5);
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

  .end-of-layers {
    place-self: end;
    position: sticky;
    inset-block-end: 0;
  }

  .layer-visibility {
    max-inline-size: var(--size-5);    
    padding: 0;
    border-radius: var(--radius-round);
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
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