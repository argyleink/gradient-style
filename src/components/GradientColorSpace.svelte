<script>
  import {gradient_space} from '../store/gradient.ts'
</script>

<fieldset>
  <legend>Color Space</legend>
  <select name="colorspace" id="in-colorspace" bind:value={$gradient_space}> 
    <optgroup label="Default colorspace">
      <option selected>oklab</option>
    </optgroup>
    <optgroup label="Cylinderical">
      <option>lch</option> 
      <option>oklch</option>
      <option>hsl</option>
      <option>hwb</option>
    </optgroup>
    <optgroup label="Rectangular">
      <option>lab</option>
      <option>srgb</option>
      <option>srgb-linear</option>
      <option>xyz</option>
    </optgroup>
  </select>
</fieldset>