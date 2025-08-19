<script>
  import { onMount } from 'svelte'
  import { parseGradient, ParseError } from '../lib/parseGradient'
  import { applyParsedToStores } from '../lib/importGradient'

  let open = false
  export function show() {
    open = true
    // open dialog on next tick
    queueMicrotask(() => {
      dialog?.showModal()
      // focus textarea for good UX
      setTimeout(() => textareaEl?.focus(), 0)
    })
  }

  let dialog
  let textareaEl
  let gradientText = ''
  let error = ''
  let valid = false
  let timer

  function close() {
    dialog?.close()
    open = false
    gradientText = ''
    error = ''
    valid = false
  }

  function onInput(e) {
    gradientText = e.currentTarget.value
    scheduleValidate()
  }

  function scheduleValidate() {
    clearTimeout(timer)
    timer = setTimeout(validate, 150)
  }

  function validate() {
    try {
      const parsed = parseGradient(gradientText)
      valid = true
      error = ''
      // auto-import and close upon success
      applyParsedToStores(parsed)
      close()
    } catch (e) {
      valid = false
      error = e instanceof ParseError ? e.message : 'Invalid gradient'
    }
  }

  onMount(() => {})
</script>

{#if open}
  <dialog bind:this={dialog} class="import-dialog" on:close={close}>
    <div class="panel">
      <h2 class="title">Import CSS Gradient</h2>
      <div class="editor {valid ? 'ok' : (error ? 'bad' : '')}">
        <textarea
          bind:this={textareaEl}
          placeholder="Paste any valid CSS gradient..."
          value={gradientText}
          on:input={onInput}
          spellcheck={false}
          aria-invalid={!valid}
          aria-describedby="import-error"
          autofocus
        />
      </div>
      {#if error}
        <p id="import-error" role="alert" class="error">{error}</p>
      {/if}
      <div class="actions">
        <button type="button" on:click={close}>Cancel</button>
      </div>
    </div>
  </dialog>
{/if}

<style>
  .import-dialog::backdrop {
    background: color-mix(in oklab, black 60%, transparent);
  }
  .import-dialog {
    border: none;
    outline: none;
    padding: 0;
    max-width: none;
    width: calc(100vw - (var(--size-5) * 2));
    margin-inline: var(--size-5);
    height: 100vh;
    background: transparent;
  }
  .panel {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: var(--size-4);
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: var(--size-7);
    background: var(--surface-2, white);
    color: var(--text-1, black);
    border-radius: var(--radius-4);
    box-shadow: var(--shadow-4);
  }
  .editor {
    position: relative;
  }
  .title {
    font-size: var(--font-size-2);
    text-align: center;
    margin: 0;
  }
  .editor textarea {
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
  }
  .editor.ok textarea { border-color: var(--green-6); }
  .editor.bad textarea { border-color: var(--red-6); }
  .actions { display: flex; justify-content: flex-end; gap: var(--size-2); }
</style>

