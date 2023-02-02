<script>
  export let angle = 0
</script>

<div class="angle-icon" style="--angle:{angle}deg"></div>

<style>
  .angle-icon {
    background-color: var(--surface-1);
    background-image: conic-gradient(var(--link), var(--angle), transparent 0%);
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    inline-size: var(--size-5);
  }
</style>