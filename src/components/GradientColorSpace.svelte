<script>
  import {gradient_space} from '../store/gradient.ts'
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label>Color Space</label>
    <select name="colorspace" id="in-colorspace" bind:value={$gradient_space}> 
      <optgroup label="Default">
        <option selected>oklab</option>
      </optgroup>
      <optgroup label="Cylinderical">
        <option>lch</option> 
        <option>oklch</option>
        <option>hsl</option>
        <option>hwb</option>
      </optgroup>
      <optgroup label="Polar">
        <option>lab</option>
        <option>srgb</option>
        <option>srgb-linear</option>
        <option>xyz</option>
      </optgroup>
    </select>
  </div>
</fieldset>