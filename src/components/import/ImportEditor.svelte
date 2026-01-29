<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  export let value = ''
  export let valid = false
  export let error = ''
  export let inputId = 'import-gradient-input'
  export let describedBy = 'import-error'
  const dispatch = createEventDispatcher()
  let textareaEl: HTMLTextAreaElement | undefined
  export function focus() { textareaEl?.focus() }
  function handleInput(e: Event) { dispatch('input', { value: (e.currentTarget as HTMLTextAreaElement).value }) }
</script>

<div class="editor {valid ? 'ok' : (error ? 'bad' : '')}">
  <textarea
    bind:this={textareaEl}
    id={inputId}
    placeholder="Paste any valid CSS gradient..."
    value={value}
    on:input={handleInput}
    spellcheck={false}
    aria-invalid={!valid}
    aria-describedby={describedBy}
  ></textarea>
</div>
{#if error}
  <p id="import-error" aria-live="polite" role="alert" class="error">{error}</p>
{/if}

<style>
  .editor { position: relative; }
  textarea {
    width: 100%;
    height: 40vh;
    resize: none;
    background: var(--surface-1, var(--gray-9));
    color: var(--text-1, black);
    border: 1px solid var(--surface-3);
    border-radius: var(--radius-3);
    padding: var(--size-3);
    font: 400 14px/1.6 var(--font-mono);
    white-space: pre-wrap;
    outline: none;
  }
  textarea:focus-visible { outline: 2px solid var(--indigo-6); outline-offset: 2px; }
  .ok textarea { border-color: var(--green-6); }
  .bad textarea { border-color: var(--red-6); }
</style>
