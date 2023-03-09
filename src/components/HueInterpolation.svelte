<script>
  import {gradient_interpolation} from '../store/gradient.ts'
</script>

<fieldset class="control-set">
  <legend>Hue Interpolation</legend>
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
</fieldset>