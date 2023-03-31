<script>
  import {gradient_space} from '../store/gradient.ts'
  import { tooltip } from 'svooltip'
</script>

<fieldset class="control-set gradient-colorspace">
  <div class="label-select-combo">
    <label>
      <a class="mini-link" href="https://developer.chrome.com/articles/high-definition-css-color-guide/" use:tooltip={{content: "Learn more about CSS wide gamut color and color spaces"}}>
        <button class="info-icon" >
          <span class="sr-only">Learn more about color spaces</span>
          <svg width="32" height="32" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.713T12 11q-.425 0-.713.288T11 12v4q0 .425.288.713T12 17Zm0-8q.425 0 .713-.288T13 8q0-.425-.288-.713T12 7q-.425 0-.713.288T11 8q0 .425.288.713T12 9Zm0 13q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Zm0-2q3.35 0 5.675-2.325T20 12q0-3.35-2.325-5.675T12 4Q8.65 4 6.325 6.325T4 12q0 3.35 2.325 5.675T12 20Zm0-8Z"/>
          </svg>
        </button>
      </a>
      Color Space
    </label>
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

<style>
  .gradient-colorspace {
    padding-block-start: 0;
  }

  .label-select-combo > label {
    display: flex;
    align-items: center;
    gap: var(--size-1);
  }

  .info-icon {
    padding: 0;
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);

    --_bg: transparent;
    --_icon-size: var(--size-4);
    --_border: none;
  }

  .mini-link {
    color: inherit;
    padding: 0;
    margin: 0;
    line-height: 0;
  }
</style>