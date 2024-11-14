<script>
  import { tooltip } from 'svooltip'
  import { fade } from 'svelte/transition'

  export let title = 'Hint title'
  export let copy = 'this is some copy'

	let seen = false

  function hideMe(e) {
    setTimeout(() => {
      seen = true
      e.target.removeAttribute('tabindex')
    }, 10)
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
{#if !seen}
  <div
    class="hint hiding"
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
    --color: lime;
    position: absolute;
    inline-size: 15px;
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    background-color: var(--color);
  }

  @media (dynamic-range: high) {
    .hint, .ping {
      --color: oklch(90% .5 140);
    }
  }

  .hint {
    place-self: start;
    z-index: var(--layer-1);
    transition: opacity .5s ease;
    animation: var(--animation-pulse);
    background-color: color-mix(in oklch, var(--color) 90%, transparent);
  }

  .ping {
    animation: var(--animation-ping);
  }

  .hiding {
    opacity: 0;
    pointer-events: none;
    animation: none;

    & > .ping {
      animation: none;
    }
  }
</style>
