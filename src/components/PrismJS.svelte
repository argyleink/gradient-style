<script>

  import { onMount } from 'svelte';
  
  export let language;
  export let code;
  let loaded = false
  
  onMount(() => {
    loaded = true
    Prism.highlightAll();
  });
</script>

<pre class="code-block" has-loaded={loaded}>
  <code class="language-{language}">{code}</code>
</pre>

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