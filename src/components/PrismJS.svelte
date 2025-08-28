<script>
  import { onMount, afterUpdate } from 'svelte'
  import { copyToClipboard } from '../utils/clipboard.ts'

  export let modern_gradient = 'none'
  export let classic_gradient = 'none'
  let loaded = false

  afterUpdate(() => {
    Prism.highlightAll()
  })

  onMount(() => {
    loaded = true
    Prism.highlightAll()
  })

  function copy() {
    copyToClipboard(snippet)
  }

  function makeSnippet() {
    return `
:root {
  --hdr-gradient: ${modern_gradient};
  --sdr-gradient: ${classic_gradient};

  background: var(--hdr-gradient);
}`.trim()
  }

  $: snippet = makeSnippet(modern_gradient, classic_gradient)
</script>

<div class="copyable-block">
<pre class="code-block" has-loaded={loaded}><code class="language-css" contenteditable="false" bind:textContent={snippet}></code></pre>
<button class="copy-code" on:click={copy}>Copy</button>
</div>

<style>
  .copyable-block {
    display: grid;
    place-items: end;
  }

  .copyable-block > * {
    grid-area: 1 / 1;
  }

  .copy-code {
    font-size: var(--font-size-0);
    z-index: var(--layer-1);
    padding-inline: var(--size-2);
    padding-block: var(--size-1);
  }

  .code-block {
    opacity: 0;
    max-inline-size: 90cqi;
    max-block-size: 65cqb;
    background-color: var(--gray-10);
    border-radius: var(--radius-3);
    cursor: auto;
  }

  .code-block[has-loaded="true"] {
    animation: var(--animation-fade-in) forwards;
  }

  :global(code[class*="language-"]) {
    font-family: var(--font-mono);
    font-size: var(--font-size-2);
  }

  @media (pointer: coarse) {
    input[type="checkbox"] {
      inline-size: 2rem;
      block-size: 2rem;
    }
  }
</style>
