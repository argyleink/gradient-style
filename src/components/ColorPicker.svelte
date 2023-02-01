<script>
  import {
    colorspace, 
    oklabL, oklabA, oklabB, oklabAlpha,
    oklchL, oklchC, oklchH, oklchAlpha,
    labL, labA, labB, labAlpha,
    lchL, lchC, lchH, lchAlpha,
    hslH, hslS, hslL, hslAlpha,
    hwbH, hwbW, hwbB, hwbAlpha,
    rgbR, rgbG, rgbB, rgbAlpha,
    colorR, colorG, colorB, colorAlpha
  } from '../store/colorpicker.ts'

  const gencolor = {
    'oklab': () => 
      `oklab(${$oklabL}% ${$oklabA} ${$oklabB} / ${$oklabAlpha}%)`,
    'oklch': () => 
      `oklch(${$oklchL}% ${$oklchC} ${$oklchH} / ${$oklchAlpha}%)`,
    'lab': () => 
      `lab(${$labL}% ${$labA} ${$labB} / ${$labAlpha}%)`,
    'lch': () => 
      `lch(${$lchL}% ${$lchC} ${$lchH} / ${$lchAlpha}%)`,
    'hsl': () => 
      `hsl(${$hslH} ${$hslS}% ${$hslL}% / ${$hslAlpha}%)`,
    'hwb': () => 
      `hwb(${$hwbH} ${$hwbW}% ${$hwbB}% / ${$hwbAlpha}%)`,
    'srgb': () => 
      `rgb(${$rgbR} ${$rgbG} ${$rgbB} / ${$rgbAlpha}%)`,
    'srgb-linear': rgbColor,
    'display-p3': rgbColor,
    'rec2020': rgbColor,
    'a98-rgb': rgbColor,
    'prophoto-rgb': rgbColor,
    'xyz': rgbColor,
    'xyz-d50': rgbColor,
    'xyz-d65': rgbColor,
  }

  function rgbColor() {
    return `color(${$colorspace} ${$colorR}% ${$colorG}% ${$colorB}% / ${$colorAlpha}%)`
  }

  function isRGBcolor(space) {
    return [
      'srgb-linear',
      'display-p3',
      'rec2020',
      'a98-rgb',
      'prophoto-rgb',
      'xyz',
      'xyz-d50',
      'xyz-d65',
    ].includes(space)
  }

  $: user_color = gencolor[$colorspace](
    $oklabL, $oklabA, $oklabB, $oklabAlpha,
    $oklchL, $oklchC, $oklchH, $oklchAlpha,
    $labL, $labA, $labB, $labAlpha,
    $lchL, $lchC, $lchH, $lchAlpha,
    $hslH, $hslS, $hslL, $hslAlpha,
    $hwbH, $hwbW, $hwbB, $hwbAlpha,
    $rgbR, $rgbG, $rgbB, $rgbAlpha,
    $colorR, $colorG, $colorB, $colorAlpha
  )
</script>

<div class="hd-color-picker" style={`accent-color:${user_color}`}>

  <div class="preview" style={`--user-color:${user_color}`}></div>

  <div class="controls">
    <select class="colorspace" bind:value={$colorspace}> 
      <option>hsl</option>
      <option>hwb</option>
      <option>srgb</option>
      <option>srgb-linear</option>
      <option>lch</option> 
      <option>lab</option>
      <option selected>oklch</option>
      <option>oklab</option>
      <option>display-p3</option>
      <option>rec2020</option>
      <option>a98-rgb</option>
      <option>prophoto-rgb</option>
      <option>xyz</option>
      <option>xyz-d50</option>
      <option>xyz-d65</option>
    </select>
    <!-- todo: merge these, dropdown in snippet -->
    <output><code>{user_color}</code></output>

    {#if $colorspace === 'oklab'}
      <div class="control">
        <span class="control-channel">L</span>
        <input class="control-input" type="range" min="0" max="100" bind:value={$oklabL} style="background-image: linear-gradient(in oklab to right, black, white)">
        <span class="control-value">{$oklabL}%</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input" type="range" min="-.5" max=".5" step=".01" bind:value={$oklabA} style="background-image: linear-gradient(to right in oklab, oklab(65% -.5 .5), oklab(65% .5 .5))">
        <span class="control-value">{$oklabA}</span>
      </div>

      <div class="control">
        <span class="control-channel">B</span>
        <input class="control-input" type="range" min="-.5" max=".5" step=".01" bind:value={$oklabB} style="background-image: linear-gradient(to right in oklab, oklab(47% -.03 -.32), oklab(96% 0 .25))">
        <span class="control-value">{$oklabB}</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input alpha" type="range" min="0" max="100" bind:value={$oklabAlpha}>
        <span class="control-value">{$oklabAlpha}%</span>
      </div>
    {/if}

    {#if $colorspace === 'oklch'}
      <div class="control">
        <span class="control-channel">L</span>
        <input class="control-input" type="range" min="0" max="100" bind:value={$oklchL} style="background-image: linear-gradient(in oklab to right, black, white)">
        <span class="control-value">{$oklchL}%</span>
      </div>

      <div class="control">
        <span class="control-channel">C</span>
        <input class="control-input" type="range" min="0" max=".5" step=".01" bind:value={$oklchC} style={`background-image: linear-gradient(to right in oklab, oklch(${$oklchL}% 0 ${$oklchH}), oklch(${$oklchL}% .5 ${$oklchH}))`}>
        <span class="control-value">{$oklchC}</span>
      </div>

      <div class="control">
        <span class="control-channel">H</span>
        <input class="control-input" type="range" min="0" max="360" bind:value={$oklchH} style="background-image: linear-gradient(to right in hsl longer hue, red, red)">
        <span class="control-value">{$oklchH}</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input alpha" type="range" min="0" max="100" bind:value={$oklchAlpha}>
        <span class="control-value">{$oklchAlpha}%</span>
      </div>
    {/if}

    {#if $colorspace === 'lab'}
      <div class="control">
        <span class="control-channel">L</span>
        <input class="control-input" type="range" min="0" max="100" bind:value={$labL} style="background-image: linear-gradient(in lab to right, black, white)">
        <span class="control-value">{$labL}%</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input" type="range" min="-160" max="160" bind:value={$labA} style="background-image: linear-gradient(to right in oklab, lab(85% -100 100), lab(55% 100 100))">
        <span class="control-value">{$labA}</span>
      </div>

      <div class="control">
        <span class="control-channel">B</span>
        <input class="control-input" type="range" min="-160" max="160" bind:value={$labB} style="background-image: linear-gradient(to right in oklab, lab(31% 70 -120), lab(96% 0 120))">
        <span class="control-value">{$labB}</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input alpha" type="range" min="0" max="100" bind:value={$labAlpha}>
        <span class="control-value">{$labAlpha}%</span>
      </div>
    {/if}

    {#if $colorspace === 'lch'}
      <div class="control">
        <span class="control-channel">L</span>
        <input class="control-input" type="range" min="0" max="100" bind:value={$lchL} style="background-image: linear-gradient(in lab to right, black, white)">
        <span class="control-value">{$lchL}%</span>
      </div>

      <div class="control">
        <span class="control-channel">C</span>
        <input class="control-input" type="range" min="0" max="230" bind:value={$lchC} style={`background-image: linear-gradient(to right in oklab, lch(${$lchL}% 0 ${$lchH}), lch(${$lchL}% 230 ${$lchH}))`}>
        <span class="control-value">{$lchC}</span>
      </div>

      <div class="control">
        <span class="control-channel">H</span>
        <input class="control-input" type="range" min="0" max="360" bind:value={$lchH} style="background-image: linear-gradient(to right in hsl longer hue, red, red)">
        <span class="control-value">{$lchH}</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input alpha" type="range" min="0" max="100" bind:value={$lchAlpha}>
        <span class="control-value">{$lchAlpha}%</span>
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

    {#if $colorspace === 'hwb'}
      <div class="control">
        <span class="control-channel">H</span>
        <input class="control-input" type="range" min="0" max="360" bind:value={$hwbH} style="background-image: linear-gradient(to right in hsl longer hue, red, red)">
        <span class="control-value">{$hwbH}</span>
      </div>

      <div class="control">
        <span class="control-channel">W</span>
        <input class="control-input" type="range" bind:value={$hwbW} style={`background-image: linear-gradient(to right in oklab, #fff0, #fff); background-color: black`}>
        <span class="control-value">{$hwbW}</span>
      </div>

      <div class="control">
        <span class="control-channel">B</span>
        <input class="control-input" type="range" bind:value={$hwbB} style={`background-image: linear-gradient(to right in oklab, #0000, #000); background-color: white`}>
        <span class="control-value">{$hwbB}</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input alpha" type="range" min="0" max="100" bind:value={$hwbAlpha}>
        <span class="control-value">{$hwbAlpha}%</span>
      </div>
    {/if}

    {#if $colorspace === 'srgb'}
      <div class="control">
        <span class="control-channel">R</span>
        <input class="control-input" type="range" min="0" max="255" bind:value={$rgbR} style="background-image: linear-gradient(to right in oklab, #f000, #f00); background-color: black;">
        <span class="control-value">{$rgbR}</span>
      </div>

      <div class="control">
        <span class="control-channel">G</span>
        <input class="control-input" type="range" min="0" max="255" bind:value={$rgbG} style={`background-image: linear-gradient(to right in oklab, #0f00, #0f0); background-color: black;`}>
        <span class="control-value">{$rgbG}</span>
      </div>

      <div class="control">
        <span class="control-channel">B</span>
        <input class="control-input" type="range" min="0" max="255" bind:value={$rgbB} style={`background-image: linear-gradient(to right in oklab, #00f0, #00f); background-color: black;`}>
        <span class="control-value">{$rgbB}</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input alpha" type="range" min="0" max="100" bind:value={$rgbAlpha}>
        <span class="control-value">{$rgbAlpha}%</span>
      </div>
    {/if}

    {#if isRGBcolor($colorspace)}
      <div class="control">
        <span class="control-channel">R</span>
        <input class="control-input" type="range" bind:value={$colorR} style="background-image: linear-gradient(to right in oklab, #f000, #f00); background-color: black;">
        <span class="control-value">{$colorR}</span>
      </div>

      <div class="control">
        <span class="control-channel">G</span>
        <input class="control-input" type="range" bind:value={$colorG} style={`background-image: linear-gradient(to right in oklab, #0f00, #0f0); background-color: black;`}>
        <span class="control-value">{$colorG}</span>
      </div>

      <div class="control">
        <span class="control-channel">B</span>
        <input class="control-input" type="range" bind:value={$colorB} style={`background-image: linear-gradient(to right in oklab, #00f0, #00f); background-color: black;`}>
        <span class="control-value">{$colorB}</span>
      </div>

      <div class="control">
        <span class="control-channel">A</span>
        <input class="control-input alpha" type="range" min="0" max="100" bind:value={$colorAlpha}>
        <span class="control-value">{$colorAlpha}%</span>
      </div>
    {/if}
  </div>

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
    /* padding: var(--size-3);
    box-shadow: var(--shadow-6); */
  }

  .colorspace {
    justify-self: start;
  }

  .preview {
    block-size: var(--size-content-1);
    /* aspect-ratio: var(--ratio-widescreen); */
    background: 
      linear-gradient(var(--user-color) 0 0),
      var(--gradient-checkerboard);
  }

  .controls {
    padding-inline: var(--size-3);
  }

  .controls > :global(output > code) {
    padding-inline-start: 0;
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