<script>
  import { onMount, afterUpdate } from 'svelte'
  
  export let modern_gradient = 'none'
  export let classic_gradient = 'none'
  let loaded = false
  
  onMount(() => {
    loaded = true
    Prism.highlightAll()
  })

  afterUpdate(() => {
    Prism.highlightAll()
  })

  function textSelectNode(node) {
    const range = document.createRange()
    const selection = window.getSelection()
    range.selectNode(node)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  function makeSnippet() {
    if (modern_gradient != 'none' && classic_gradient != 'none') {
      return `
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
    }
    else if (modern_gradient != 'none') {
      return `
.modern-gradient {
  background-image: 
    ${modern_gradient}
  ;
}`.trim()
    }
    else if (classic_gradient != 'none') {
      return `
.classic-gradient {
  background-image: 
    ${classic_gradient}
  ;
}`.trim()
    }
  }

  $: snippet = makeSnippet(modern_gradient, classic_gradient)
</script>

<pre class="code-block" has-loaded={loaded} on:click={e => textSelectNode(e.target)} on:focus={() => textSelectNode()}><code class="language-css" contenteditable="false" bind:textContent={snippet}></code></pre>

<style>
  .code-block {
    opacity: 0;
    max-inline-size: 90cqi;
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