<script>

  import { onMount } from 'svelte';
  
  export let language;
  export let code;
  
  onMount(() => {
    Prism.highlightAll();
  });
</script>

<pre class="code-block">
  <code class="language-{language}">{code}</code>
</pre>

<style>
  .code-block {
    background-color: var(--gray-10);
  }
</style>