<script>
  import { onMount } from 'svelte'
  import { parseGradient, ParseError } from '../lib/parseGradient'
  import { applyParsedToStores } from '../lib/importGradient'
  import ImportEditor from './import/ImportEditor.svelte'
  import ImportActions from './import/ImportActions.svelte'

  let open = false
  let dialog
  let textareaEl // will hold ImportEditor component instance for focusing via editor.focus()
  const titleId = 'import-gradient-title'
  const inputId = 'import-gradient-input'

  // input state
  let gradientText = ''
  let error = ''
  let valid = false
  let timer

  export function show() {
    open = true
    queueMicrotask(() => {
      dialog?.showModal()
      // focus the editor's textarea via its exposed focus method
      setTimeout(() => textareaEl?.focus?.(), 0)
    })
  }

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
  $: canImport = valid && gradientText.trim().length > 0

  function scheduleValidate() {
    clearTimeout(timer)
    timer = setTimeout(validate, 200)
  }

  function validate() {
    try {
      parseGradient(gradientText)
      valid = true
      error = ''
    } catch (e) {
      valid = false
      error = e instanceof ParseError ? e.message : 'Invalid gradient'
    }
  }

  function onImportClick() {
    if (!valid || !gradientText.trim()) return
    try {
      const parsed = parseGradient(gradientText)
      applyParsedToStores(parsed)
      close()
    } catch (e) {
      // Should be rare because button is disabled when invalid; keep safe
      valid = false
      error = e instanceof ParseError ? e.message : 'Invalid gradient'
    }
  }

  onMount(() => {})
</script>

{#if open}
  <dialog
    bind:this={dialog}
    class="push-z"
    id="import-dialog"
    aria-labelledby={titleId}
    aria-describedby="import-error"
    on:close={close}
  >
    <section>
      <form on:submit|preventDefault={onImportClick} aria-labelledby={titleId}>
        <h2 class="title" id={titleId}>Import CSS Gradient</h2>
        <label class="sr-only" for={inputId}>CSS gradient string</label>
        <ImportEditor
          on:input={(e) => { gradientText = e.detail.value; scheduleValidate() }}
          {error}
          {valid}
          value={gradientText}
          inputId={inputId}
          bind:this={textareaEl}
        />
        <ImportActions {canImport} primaryType="submit" on:cancel={close} on:import={onImportClick} />
      </form>
    </section>
  </dialog>
{/if}

<style>
  @media (prefers-reduced-motion: no-preference) {
    :global(body) {
      transition:
        scale .8s var(--ease-in-out-5),
        border-radius .8s var(--ease-in-out-5);

      &:has(.push-z[open]) {
        scale: 95%;
        border-radius: var(--radius-3);
        overflow: hidden;
      }
    }
  }

  dialog.push-z {
    --_duration: .5s;
    background: none;
    box-shadow: none;
    padding: 0;
    overflow: clip;
    transition:
      display var(--_duration) allow-discrete,
      overlay var(--_duration) allow-discrete;

    &::backdrop {
      transition: opacity var(--_duration) var(--ease-4);
      opacity: 0;
      background-color: light-dark(#0003, #0008);
      cursor: zoom-out;
    }

    & > section {
      > form {
        display: grid; 
      gap: var(--size-4);
        }

      @media (prefers-reduced-motion: reduce) {
        transition: opacity .7s var(--ease-2);
        opacity: 0;
      }
      @media (prefers-reduced-motion: no-preference) {
        transition: translate .7s var(--ease-elastic-in-out-2) .0s;
        translate: 0 100%;
      }
    }

    &[open] {
      &, &::backdrop { opacity: 1; }

      & > section {
        opacity: 1;
        translate: 0;
        @media (prefers-reduced-motion: no-preference) {
          transition-delay: var(--_duration);
          transition-timing-function: var(--ease-spring-2);
        }
      }
    }

    @starting-style {
      &[open], &[open]::backdrop { opacity: 0; }
      &[open] > section { opacity: 0; translate: 0 100%; }
    }

    section {
      inline-size: min(var(--size-content-2), 80vw);
      aspect-ratio: var(--ratio-landscape);
      border-radius: var(--radius-3);
      background: light-dark(white, var(--surface-2));
      padding: var(--size-5);

      @media (orientation: portrait) { aspect-ratio: var(--ratio-portrait); }
    }
  }

  .title { margin: 0; font-size: var(--font-size-2); }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>

