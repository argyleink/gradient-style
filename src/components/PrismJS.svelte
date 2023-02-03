<script>

  import { onMount, afterUpdate } from 'svelte'
  
  export let modern_gradient
  export let classic_gradient
  let loaded = false
  
  onMount(() => {
    loaded = true
    Prism.highlightAll()
  })

  afterUpdate(() => {
    Prism.highlightAll()
  })

  function textSelectNode() {
    const range = document.createRange()
    const selection = window.getSelection()
    range.selectNode(document.querySelector('.code-block'))
    selection.removeAllRanges()
    selection.addRange(range)
  }

  $: snippet = `
.modern-gradient {
  background-image: 
    ${modern_gradient}
  ;
}

.classic-gradient {
  background-image: 
    ${classic_gradient}
  ;
}`.trim()
</script>

<pre class="code-block" has-loaded={loaded} on:click={() => textSelectNode()} on:focus={() => textSelectNode()}><code class="language-css" contenteditable="false" bind:textContent={snippet}></code></pre>

<style>
  .code-block {
    opacity: 0;
    max-inline-size: var(--size-content-3);
    justify-self: center;
    background-color: var(--gray-10);
  }

  .code-block[has-loaded="true"] {
    animation: var(--animation-fade-in) forwards;
  }
</style>