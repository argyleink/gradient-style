<script>
  import { tooltip } from 'svooltip'
  import { fade } from 'svelte/transition'

  export let title = 'Hint title'
  export let copy = 'this is some copy'

	let seen = true

  function hideMe() {
    seen = false
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
{#if seen}
  <div 
    style="opacity: 0"
    class="hint" 
    tabindex="0"
    use:tooltip={{html: true, content: `
      <span class="rich-tooltip">
        <b>${title}</b><br>
        ${copy}
      </span>
    `}} 
    on:mouseleave={hideMe}
    on:blur={hideMe}
    out:fade
  >
    <div class="ping"></div>
  </div>
{/if}

<style>
  .hint, .ping {
    --color: deeppink;
    position: absolute;
    inline-size: 15px;
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    background-color: var(--color);
  }

  @media (dynamic-range: high) {
    .hint, .ping {
      --color: oklch(90% .5 320);
    }
  }

  .hint {
    transition: opacity .5s ease;
    animation: var(--animation-pulse);
    background-color: color-mix(in oklch, var(--color) 90%, transparent);
  }

  .ping {
    animation: var(--animation-ping);
  }
</style>