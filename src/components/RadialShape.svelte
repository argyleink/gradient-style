<script>
  import {radial_shape} from '../store/radial.ts'
  const radial_shapes = ['circle', 'ellipse']
</script>

<fieldset>
  <legend>Shape</legend>
  {#each radial_shapes as shape}
    <div class="radio-pair">
      <input type="radio" name="radial-shape" id="radial-{shape}" value={shape} bind:group={$radial_shape}>
      <label for="radial-{shape}">{shape}</label>
    </div>
  {/each}
</fieldset>