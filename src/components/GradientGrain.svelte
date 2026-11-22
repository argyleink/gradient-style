<script>
  import {gradient_grain} from '../store/gradient.ts'
  import {GRAIN_MAX, normalizeGrain} from '../utils/grain.ts'
  import RangeSlider from './RangeSlider.svelte'
  import Hint from './Hint.svelte'

  let amount = $state(0)

  // two-way with the store, clamped, without echo loops
  $effect(() => { amount = $gradient_grain })
  $effect(() => {
    // a cleared number field is mid-edit, not 0: wait for a value
    if (amount == null || amount === '') return
    const next = normalizeGrain(amount)
    if (next !== $gradient_grain) $gradient_grain = next
  })
</script>

<fieldset class="control-set grain">
  <div class="label-select-combo">
    <label for="gradient-grain">
      Grain
    </label>
    <Hint title="Grain" copy="Adds film grain over all your layers, a common fix for banding in smooth gradients.<br><br>It's an SVG noise tile painted as the top background image, so the CSS stays one <code>background</code> value." />
  </div>
  <div class="slider-set">
    <svg class="grain-icon" aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="1.5" fill="currentColor"/><circle cx="13" cy="5" r="1" fill="currentColor"/><circle cx="18" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="9" cy="11" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1.5" fill="currentColor"/><circle cx="5" cy="15" r="1.5" fill="currentColor"/>
      <circle cx="11" cy="18" r="1.5" fill="currentColor"/><circle cx="19" cy="18" r="1" fill="currentColor"/>
    </svg>
    <RangeSlider bind:value={amount} min="0" max={GRAIN_MAX} step="1" style="--accent-color: {amount ? 'var(--link)' : 'var(--gray-5)'}" />
    <div class="input-suffix">
      <input id="gradient-grain" type="number" bind:value={amount} min="0" max={GRAIN_MAX} step="1" class="slider-percentage">
      <sup>%</sup>
    </div>
  </div>
</fieldset>

<style>
  .grain {
    padding-inline: var(--size-3);
    padding-block: var(--size-2);
  }

  .grain-icon {
    inline-size: var(--size-5);
    flex-shrink: 0;
    color: var(--text-2);
  }
</style>
