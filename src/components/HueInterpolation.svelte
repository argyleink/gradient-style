<script>
  import {gradient_interpolation} from '../store/gradient.ts'
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label class="icon-label">
      <svg viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" d="m15 10 5 5-5 5"></path>
        <path fill="none" stroke="currentColor" d="M4 4v7a4 4 0 0 0 4 4h12"></path>
      </svg>
      Hue Path
    </label>
    <select name="colorspace" id="in-colorspace" bind:value={$gradient_interpolation}> 
      <optgroup label="Default interpolation">
        <option selected>shorter</option>
      </optgroup>
      <optgroup label="Other">
        <option>longer</option>
        <option>decreasing</option>
        <option>increasing</option>
      </optgroup>
    </select>
  </div>
</fieldset>

<style>
  .control-set {
    margin-block-start: calc(var(--size-4) * -1);
    padding-inline: var(--size-4);
  }

  .icon-label {
    display: flex;
    align-items: center;
    gap: var(--size-2);
  }

  .icon-label > svg {
    inline-size: var(--size-7);
    position: relative;
    top: -3px;
  }
</style>