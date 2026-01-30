<script>
  import {linear_angle, linear_named_angle} from '../store/linear.ts'

  import AngleIcon from './AngleIcon.svelte'
  import RangeSlider from './RangeSlider.svelte'
  import NamedDirections from './NamedDirections.svelte'
  import Hint from './Hint.svelte'

  const linear_directions = [
    'to right',
    'to left',
    'to bottom right',
    'to bottom',
    'to bottom left',
    'to top right',
    'to top',
    'to top left',
  ]

  function blurNamedAngle() {
    if ($linear_named_angle !== '--')
      $linear_named_angle = '--'
  }
</script>

<fieldset class="stack control-set linear-angle">
  <div class="label-select-combo">
    <label for="linear-angle">
      <!-- <Hint title="Linear gradient angle" copy="CSS offers adaptive keywords for angles and also allows specific angles.<br><br>Currently only degrees are supported." /> -->
      Angle
    </label>
    <NamedDirections id="linear-angle" bind:selected={$linear_named_angle} mode="angle" />
    <div class="select-wrap">
      <select name="named-directions" bind:value={$linear_named_angle}>
        <button>
          <selectedcontent></selectedcontent>
        </button>
        <option disabled>--</option>
        {#each linear_directions as dir}
          <option value={dir}>{dir}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="slider-set">
    <AngleIcon angle={$linear_angle} />
    <RangeSlider bind:value={$linear_angle} on:change={blurNamedAngle} min="0" max="360" step="1" style="--accent-color: {$linear_angle === null ? 'var(--gray-5)' : 'var(--link)'}" />
    <div class="input-suffix">
      <input type="number" bind:value={$linear_angle} oninput={blurNamedAngle} min="0" max="360" step="1"  class="slider-percentage">
      <sup>°</sup>
    </div>
  </div>
</fieldset>

<style>
  .linear-angle {
    gap: var(--size-5);
  }

  .label-select-combo {
    display: flex;
    gap: var(--size-3);
  }

  .select-wrap {
    display: flex;
    flex: 1;
    place-content: end;
  }
</style>
