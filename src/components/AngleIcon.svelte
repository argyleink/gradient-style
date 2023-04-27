<script>
  import { tooltip } from 'svooltip'

  export let angle = 0;
</script>

<div class="angle-icon" style="--angle:{angle}deg" use:tooltip={{content: angle+'deg'}}></div>

<style>
  .angle-icon {
    background-color: var(--surface-1);
    background-image: conic-gradient(var(--text-2), var(--angle), transparent 0%);
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    inline-size: 5ch;
  }

  @media (prefers-color-scheme: light) {
    .angle-icon {
      background-color: var(--surface-2);
    }
  }
</style>