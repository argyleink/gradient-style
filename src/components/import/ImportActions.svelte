<script>
  import { createEventDispatcher } from 'svelte'
  export let canImport = false
  export let primaryType = 'button'
  const dispatch = createEventDispatcher()
</script>

<div class="actions">
  <button type="reset" class="btn secondary" on:click={() => dispatch('cancel')}>Cancel</button>
  <button type={primaryType} class="btn primary" disabled={!canImport} aria-disabled={!canImport}>Import</button>
</div>

<style>
  .actions { display: flex; justify-content: flex-end; gap: var(--size-2); }
  .btn { min-height: 40px; padding-inline: var(--size-3); border-radius: var(--radius-2); border: 1px solid var(--surface-3); }
  .btn.primary { background: var(--indigo-6); color: white; border-color: var(--indigo-6); }
  .btn.primary:disabled { background: var(--surface-3); color: var(--text-2); border-color: var(--surface-3); }
</style>
