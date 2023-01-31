<script>
  import {
    colorspace, 
    labL, labA, labB, labAlpha,
    hslH, hslS, hslL, hslAlpha
  } from '../store/colorpicker.ts'

  const gencolor = {
    'oklab': () => 
      `oklab(${$labL}% ${$labA} ${$labB} / ${$labAlpha}%)`,
    'hsl': () => 
      `hsl(${$hslH} ${$hslS}% ${$hslL}% / ${$hslAlpha}%)`,
  }

  $: user_color = gencolor[$colorspace](
    $labL, $labA, $labB, $labAlpha,
    $hslH, $hslS, $hslL, $hslAlpha
  )
</script>

<div class="hd-color-picker" style={`accent-color:${user_color}`}>

  <select class="colorspace" bind:value={$colorspace}> 
    <optgroup label="Default colorspace">
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

  <output><code>{user_color}</code></output>

  <div class="preview" style={`--user-color:${user_color}`}></div>

  {#if $colorspace === 'oklab'}
    <div class="control">
      <span class="control-channel">L</span>
      <input class="control-input" type="range" min="0" max="100" bind:value={$labL} style="background-image: linear-gradient(in oklab to right, black, white)">
      <span class="control-value">{$labL}%</span>
    </div>

    <div class="control">
      <span class="control-channel">A</span>
      <input class="control-input" type="range" min="-1" max="1" step=".01" bind:value={$labA} style="background-image: linear-gradient(to right in oklab, oklab(85% -.25 .25), oklab(65% .25 .15))">
      <span class="control-value">{$labA}</span>
    </div>

    <div class="control">
      <span class="control-channel">B</span>
      <input class="control-input" type="range" min="-1" max="1" step=".01" bind:value={$labB} style="background-image: linear-gradient(to right in oklab, oklab(47% -.03 -.32), oklab(96% 0 .25))">
      <span class="control-value">{$labB}</span>
    </div>

    <div class="control">
      <span class="control-channel">A</span>
      <input class="control-input alpha" type="range" min="0" max="100" bind:value={$labAlpha}>
      <span class="control-value">{$labAlpha}%</span>
    </div>
  {/if}

  {#if $colorspace === 'hsl'}
    <div class="control">
      <span class="control-channel">H</span>
      <input class="control-input" type="range" min="0" max="360" bind:value={$hslH} style="background-image: linear-gradient(to right in hsl longer hue, red, red)">
      <span class="control-value">{$hslH}</span>
    </div>

    <div class="control">
      <span class="control-channel">S</span>
      <input class="control-input" type="range" bind:value={$hslS} style={`background-image: linear-gradient(to right in oklab, hsl(${$hslH} 0% ${$hslL}%), hsl(${$hslH} 100% ${$hslL}%)`}>
      <span class="control-value">{$hslS}</span>
    </div>

    <div class="control">
      <span class="control-channel">L</span>
      <input class="control-input" type="range" bind:value={$hslL} style={`background-image: linear-gradient(to right in oklab, hsl(${$hslH} ${$hslS}% 0%), hsl(${$hslH} ${$hslS}% 100%)`}>
      <span class="control-value">{$hslL}</span>
    </div>

    <div class="control">
      <span class="control-channel">A</span>
      <input class="control-input alpha" type="range" min="0" max="100" bind:value={$hslAlpha}>
      <span class="control-value">{$hslAlpha}%</span>
    </div>
  {/if}

</div>

<style>
  :global(html) {
    --gradient-checkerboard: repeating-conic-gradient(
      var(--surface-4) 0% 25%, 
      transparent 0% 50%) 
      50% / 1rem 1rem;
  }

  .hd-color-picker {
    display: grid;
    gap: var(--size-2);
    background: var(--surface-2);
    border-radius: var(--radius-3);
    padding: var(--size-3);
    box-shadow: var(--shadow-6);
  }

  .colorspace {
    justify-self: start;
  }

  .preview {
    block-size: var(--size-content-1);
    aspect-ratio: var(--ratio-widescreen);
    background: 
      linear-gradient(var(--user-color),var(--user-color)),
      var(--gradient-checkerboard);
  }

  .control {
    display: flex;
    place-items: center;
    gap: var(--size-2);
  }

  .control-channel {
    min-inline-size: 2ch;
  }

  .control-input {
    flex: 2;
    appearance: none;
    background-color: var(--surface-1);
    border-radius: var(--radius-round);
    block-size: 1rem;
  }

  .alpha {
    background:
      linear-gradient(to right, #0000, #000),
      var(--gradient-checkerboard)
    ;
  }

  .control-value {
    min-inline-size: 4ch;
    text-align: end;
  }

  .control-input::-webkit-slider-thumb {
    --_border-size: 4px;
    
    cursor: grab;
    appearance: none;
    border: 4px solid white;
    height: calc(1rem + (var(--_border-size) * 2));
    aspect-ratio: 1;
    border-radius: var(--radius-round);
    box-shadow: var(--shadow-2), var(--inner-shadow-2);
  }
  
  .control-input:active::-webkit-slider-thumb {
    cursor: grabbing;
  }
</style>