<script>
  import {gradient_repeating, gradient_stops} from '../store/gradient.ts'
  import {tileStops} from '../utils/stops.ts'
  import Hint from './Hint.svelte'

  // the stops from before auto-tiling, and the tiled result, so turning Repeat back off
  // can put them back (unless they were edited in between)
  let untiled = null

  function onToggle(e) {
    const on = e.currentTarget.checked
    if (on) {
      // a full 0–100% stop list repeats invisibly; tile it so the switch shows a change
      const tiled = tileStops($gradient_stops)
      untiled = tiled === $gradient_stops ? null : { before: $gradient_stops, after: JSON.stringify(tiled) }
      $gradient_stops = tiled
    }
    else if (untiled && JSON.stringify($gradient_stops) === untiled.after) {
      $gradient_stops = untiled.before
      untiled = null
    }
    $gradient_repeating = on
  }
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label for="gradient-repeating">Repeat</label>
    <div class="repeat-toggle">
      <Hint title="Repeating gradients" copy="Uses repeating-linear-gradient(), repeating-radial-gradient() or repeating-conic-gradient(): the color stops tile from the last stop onward.<br><br>If your stops span the full 0–100%, turning this on fits them into the first 25% so you can see the pattern repeat." />
      <input type="checkbox" id="gradient-repeating" checked={$gradient_repeating} onchange={onToggle}>
    </div>
  </div>
</fieldset>

<style>
  .repeat-toggle {
    display: flex;
    gap: var(--size-2);
    align-items: center;
  }
</style>
