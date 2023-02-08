<script>
  import { onMount } from 'svelte'
  import Color from 'colorjs.io'

  import {
    picker_value, colorspace, 
    oklabL, oklabA, oklabB, oklabAlpha,
    oklchL, oklchC, oklchH, oklchAlpha,
    labL, labA, labB, labAlpha,
    lchL, lchC, lchH, lchAlpha,
    hslH, hslS, hslL, hslAlpha,
    hwbH, hwbW, hwbB, hwbAlpha,
    rgbR, rgbG, rgbB, rgbAlpha,
    colorR, colorG, colorB, colorAlpha
  } from '../store/colorpicker.ts'

  let dialog
  let dialogWidth

  const dialogClosingEvent = new Event('closing')
  const dialogClosedEvent  = new Event('closed')

  onMount(() => {
    dialog = document.querySelector('#color-picker')

    dialog.addEventListener('close', dialogClose)
    dialog.addEventListener('click', lightDismiss)

    dialog.setColor = setColor
    dialog.setAnchor = setAnchor

    dialog.show()
    dialogWidth = dialog.clientWidth
    dialog.close()
    console.log(dialogWidth)
  })

  function setColor(color) {
    const parsedColor = new Color(color)
    $colorspace = parsedColor.space.id
    
    if ($colorspace === 'oklab') {
      const [l,a,b] = parsedColor.coords
      $oklabL = l * 100
      $oklabA = a.toString()
      $oklabB = b.toString()
      $oklabAlpha = parsedColor.alpha * 100
    }
    else if ($colorspace === 'oklch') {
      const [l,c,h] = parsedColor.coords
      $oklchL = l * 100
      $oklchC = c.toString()
      $oklchH = h.toString()
      $oklchAlpha = parsedColor.alpha * 100
    }
    else if ($colorspace === 'lab') {
      const [l,a,b] = parsedColor.coords
      $labL = l
      $labA = a.toString()
      $labB = b.toString()
      $labAlpha = parsedColor.alpha * 100
    }
    else if ($colorspace === 'lch') {
      const [l,c,h] = parsedColor.coords
      $lchL = l
      $lchC = c.toString()
      $lchH = h.toString()
      $lchAlpha = parsedColor.alpha * 100
    }
    else if ($colorspace === 'hsl') {
      const [h,s,l] = parsedColor.coords
      $hslL = l
      $hslS = s.toString()
      $hslH = h.toString()
      $hslAlpha = parsedColor.alpha * 100
    }
    else if ($colorspace === 'hwb') {
      const [h,w,b] = parsedColor.coords
      $hwbH = h.toString()
      $hwbW = w
      $hwbB = b
      $hwbAlpha = parsedColor.alpha * 100
    }
    else if ($colorspace === 'srgb' || colorspace === 'rgb') {
      const [r,g,b] = parsedColor.coords
      $rgbR = r * 100
      $rgbG = g * 100
      $rgbB = b * 100
      $rgbAlpha = parsedColor.alpha * 100
    }
    else if (isRGBcolor($colorspace)) {
      const [r,g,b] = parsedColor.coords
      $colorR = r * 100
      $colorG = g * 100
      $colorB = b * 100
      $colorAlpha = parsedColor.alpha * 100
    }
  }

  function setAnchor(target, panel) {
    const rect = target.getBoundingClientRect()
    dialog.style.setProperty('--y', rect.y + 'px')
    if (panel === 'right-panel')
      dialog.style.setProperty('--x', `calc(100% - ${dialogWidth}px - 1rem)`)
    else
      dialog.style.setProperty('--x', rect.x + 12 - (dialogWidth / 2) + 'px')
    dialog.style.setProperty('--anchor', rect.y > window.innerHeight / 2
      ? '-105%'
      : '10%')
  }

  const dialogClose = async ({target:dialog}) => {
    dialog.dispatchEvent(dialogClosingEvent)

    await animationsComplete(dialog)

    dialog.dispatchEvent(dialogClosedEvent)
  }

  const animationsComplete = element =>
    Promise.allSettled(
      element.getAnimations().map(animation => 
        animation.finished))

  const lightDismiss = ({target:dialog}) => {
    if (dialog.nodeName === 'DIALOG')
      dialog.close('dismiss')
  }

  function gencolor(colorspace) {
    let color

    if (colorspace === 'oklab')
      color = `oklab(${$oklabL}% ${$oklabA} ${$oklabB}${alphaToString($oklabAlpha)})`
    else if (colorspace === 'oklch')
      color = `oklch(${$oklchL}% ${$oklchC} ${$oklchH}${alphaToString($oklchAlpha)})`
    else if (colorspace === 'lab')
      color = `lab(${$labL}% ${$labA} ${$labB}${alphaToString($labAlpha)})`
    else if (colorspace === 'lch')
      color = `lch(${$lchL}% ${$lchC} ${$lchH}${alphaToString($lchAlpha)})`
    else if (colorspace === 'hsl')
      color = `hsl(${$hslH} ${$hslS}% ${$hslL}%${alphaToString($hslAlpha)})`
    else if (colorspace === 'hwb')
      color = `hwb(${$hwbH} ${$hwbW}% ${$hwbB}%${alphaToString($hwbAlpha)})`
    else if (colorspace === 'srgb')
      color = `rgb(${$rgbR}% ${$rgbG}% ${$rgbB}%${alphaToString($rgbAlpha)})`
    else if (isRGBcolor(colorspace))
      color = rgbColor()

    $picker_value = color
    return color
  }

  function alphaToString(alpha) {
    return alpha === 100
      ? ''
      : ` / ${alpha}%`
  }

  function rgbColor() {
    return `color(${$colorspace} ${$colorR}% ${$colorG}% ${$colorB}%${alphaToString($colorAlpha)})`
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

  $: user_color = gencolor($colorspace,
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

<dialog id="color-picker">
  <div class="hd-color-picker" style={`accent-color:${user_color}`}>
    <div class="preview" style={`--user-color:${user_color}`}>
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
      <output><code>{user_color}</code></output>
    </div>

    <div class="controls">
      {#if $colorspace === 'oklab'}
        <div class="control">
          <span class="control-channel">L</span>
          <input class="control-input" type="range" min="0" max="100" bind:value={$oklabL} style="background-image: linear-gradient(in oklab to right, black, white)">
          <input type="number" bind:value={$oklabL} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input" type="range" min="-.5" max=".5" step=".01" bind:value={$oklabA} style="background-image: linear-gradient(to right in oklab, oklab(65% -.5 .5), oklab(65% .5 .5))">
          <input type="number" min="-.5" max=".5" step=".01" bind:value={$oklabA} class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">B</span>
          <input class="control-input" type="range" min="-.5" max=".5" step=".01" bind:value={$oklabB} style="background-image: linear-gradient(to right in oklab, oklab(47% -.03 -.32), oklab(96% 0 .25))">
          <input type="number" min="-.5" max=".5" step=".01" bind:value={$oklabB} class="slider-percentage">
        </div>

        <div class="control percentage">
          <span class="control-channel">A</span>
          <input class="control-input alpha" type="range" min="0" max="100" bind:value={$oklabAlpha}>
          <input type="number" min="0" max="100" bind:value={$oklabAlpha} class="slider-percentage">
        </div>
      {/if}

      {#if $colorspace === 'oklch'}
        <div class="control">
          <span class="control-channel">L</span>
          <input class="control-input" type="range" bind:value={$oklchL} style="background-image: linear-gradient(in oklab to right, black, white)">
          <input type="number" bind:value={$oklchL} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">C</span>
          <input class="control-input" type="range" min="0" max=".5" step=".01" bind:value={$oklchC} style={`background-image: linear-gradient(to right in oklab, oklch(${$oklchL}% 0 ${$oklchH}), oklch(${$oklchL}% .5 ${$oklchH}))`}>
          <input type="number" bind:value={$oklchC} min="0" max=".5" step=".01" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">H</span>
          <input class="control-input" type="range" min="0" max="360" bind:value={$oklchH} style="background-image: linear-gradient(to right in hsl longer hue, red, red)">
          <input type="number" bind:value={$oklchH} min="0" max="360" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input alpha" type="range" bind:value={$oklchAlpha}>
          <input type="number" bind:value={$oklchAlpha} min="0" max="100" class="slider-percentage">
        </div>
      {/if}

      {#if $colorspace === 'lab'}
        <div class="control">
          <span class="control-channel">L</span>
          <input class="control-input" type="range" bind:value={$labL} style="background-image: linear-gradient(in lab to right, black, white)">
          <input type="number" bind:value={$labL} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input" type="range" min="-160" max="160" bind:value={$labA} style="background-image: linear-gradient(to right in oklab, lab(85% -100 100), lab(55% 100 100))">
          <input type="number" bind:value={$labA} min="-160" max="160" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">B</span>
          <input class="control-input" type="range" min="-160" max="160" bind:value={$labB} style="background-image: linear-gradient(to right in oklab, lab(31% 70 -120), lab(96% 0 120))">
          <input type="number" bind:value={$labB} min="-160" max="160" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input alpha" type="range" bind:value={$labAlpha}>
          <input type="number" bind:value={$labAlpha} min="0" max="100" class="slider-percentage">
        </div>
      {/if}

      {#if $colorspace === 'lch'}
        <div class="control">
          <span class="control-channel">L</span>
          <input class="control-input" type="range" bind:value={$lchL} style="background-image: linear-gradient(in lab to right, black, white)">
          <input type="number" bind:value={$lchL} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">C</span>
          <input class="control-input" type="range" min="0" max="230" bind:value={$lchC} style={`background-image: linear-gradient(to right in oklab, lch(${$lchL}% 0 ${$lchH}), lch(${$lchL}% 230 ${$lchH}))`}>
          <input type="number" bind:value={$lchC} min="0" max="230" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">H</span>
          <input class="control-input" type="range" min="0" max="360" bind:value={$lchH} style="background-image: linear-gradient(to right in hsl longer hue, red, red)">
          <input type="number" bind:value={$lchH} min="0" max="360" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input alpha" type="range" bind:value={$lchAlpha}>
          <input type="number" bind:value={$lchAlpha} min="0" max="100" class="slider-percentage">
        </div>
      {/if}

      {#if $colorspace === 'hsl'}
        <div class="control">
          <span class="control-channel">H</span>
          <input class="control-input" type="range" min="0" max="360" bind:value={$hslH} style="background-image: linear-gradient(to right in hsl longer hue, red, red)">
          <input type="number" bind:value={$hslH} min="0" max="360" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">S</span>
          <input class="control-input" type="range" bind:value={$hslS} style={`background-image: linear-gradient(to right in oklab, hsl(${$hslH} 0% ${$hslL}%), hsl(${$hslH} 100% ${$hslL}%)`}>
          <input type="number" bind:value={$hslS} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">L</span>
          <input class="control-input" type="range" bind:value={$hslL} style={`background-image: linear-gradient(to right in oklab, hsl(${$hslH} ${$hslS}% 0%), hsl(${$hslH} ${$hslS}% 100%)`}>
          <input type="number" bind:value={$hslL} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input alpha" type="range" min="0" max="100" bind:value={$hslAlpha}>
          <input type="number" bind:value={$hslAlpha} min="0" max="100" class="slider-percentage">
        </div>
      {/if}

      {#if $colorspace === 'hwb'}
        <div class="control">
          <span class="control-channel">H</span>
          <input class="control-input" type="range" min="0" max="360" bind:value={$hwbH} style="background-image: linear-gradient(to right in hsl longer hue, red, red)">
          <input type="number" bind:value={$hwbH} min="0" max="360" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">W</span>
          <input class="control-input" type="range" bind:value={$hwbW} style={`background-image: linear-gradient(to right in oklab, #fff0, #fff); background-color: black`}>
          <input type="number" bind:value={$hwbW} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">B</span>
          <input class="control-input" type="range" bind:value={$hwbB} style={`background-image: linear-gradient(to right in oklab, #0000, #000); background-color: white`}>
          <input type="number" bind:value={$hwbB} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input alpha" type="range" bind:value={$hwbAlpha}>
          <input type="number" bind:value={$hwbAlpha} min="0" max="100" class="slider-percentage">
        </div>
      {/if}

      {#if $colorspace === 'srgb'}
        <div class="control">
          <span class="control-channel">R</span>
          <input class="control-input" type="range" min="0" max="100" bind:value={$rgbR} style="background-image: linear-gradient(to right in oklab, #f000, #f00); background-color: black;">
          <input type="number" bind:value={$rgbR} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">G</span>
          <input class="control-input" type="range" min="0" max="100" bind:value={$rgbG} style={`background-image: linear-gradient(to right in oklab, #0f00, #0f0); background-color: black;`}>
          <input type="number" bind:value={$rgbG} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">B</span>
          <input class="control-input" type="range" min="0" max="100" bind:value={$rgbB} style={`background-image: linear-gradient(to right in oklab, #00f0, #00f); background-color: black;`}>
          <input type="number" bind:value={$rgbB} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input alpha" type="range" min="0" max="100" bind:value={$rgbAlpha}>
          <input type="number" bind:value={$rgbAlpha} min="0" max="100" class="slider-percentage">
        </div>
      {/if}

      {#if isRGBcolor($colorspace)}
        <div class="control">
          <span class="control-channel">R</span>
          <input class="control-input" type="range" bind:value={$colorR} style="background-image: linear-gradient(to right in oklab, #f000, #f00); background-color: black;">
          <input type="number" bind:value={$colorR} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">G</span>
          <input class="control-input" type="range" bind:value={$colorG} style={`background-image: linear-gradient(to right in oklab, #0f00, #0f0); background-color: black;`}>
          <input type="number" bind:value={$colorG} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">B</span>
          <input class="control-input" type="range" bind:value={$colorB} style={`background-image: linear-gradient(to right in oklab, #00f0, #00f); background-color: black;`}>
          <input type="number" bind:value={$colorB} min="0" max="100" class="slider-percentage">
        </div>

        <div class="control">
          <span class="control-channel">A</span>
          <input class="control-input alpha" type="range" min="0" max="100" bind:value={$colorAlpha}>
          <input type="number" bind:value={$colorAlpha} min="0" max="100" class="slider-percentage">
        </div>
      {/if}
    </div>

  </div>
</dialog>

<style>
  dialog {
    padding: 0;
    margin-inline: auto var(--size-3);
    margin-block-start: var(--y, auto);
    margin-inline-start: var(--x, auto);
    transform: translateY(var(--anchor));
  }

  @media (max-width: 1024px) {
    dialog {
      margin-inline: var(--size-3) auto;
    }
  }

  dialog::backdrop {
    background: #0000;
    backdrop-filter: none;
  }

  :global(html) {
    --gradient-checkerboard: repeating-conic-gradient(
      var(--surface-3) 0% 25%, 
      transparent 0% 50%) 
      50% / 1rem 1rem;
  }

  .hd-color-picker {
    display: grid;
    gap: 0;
    border-radius: var(--radius-3);
  }

  .colorspace {
    justify-self: end;
    background-color: hsl(none none none / .4);
    background-repeat: no-repeat;
    color: white;
    color: color-contrast(var(--user-color) vs black, white);
    border: none;
  }

  .preview {
    aspect-ratio: var(--ratio-widescreen);
    display: grid;
    align-content: space-between;
    justify-items: center;
    block-size: var(--size-content-1);
    padding: var(--size-3);
    background: 
      linear-gradient(var(--user-color) 0 0),
      var(--gradient-checkerboard);
  }

  .preview > :global(output > code) {
    color: white;
    color: color-contrast(var(--user-color) vs black, white);
    background: hsl(none none none / .4);
    text-shadow: 0 1px 1px hsl(none none 0% / 25%);
  }

  @supports (background: hsl(from red h s l)) {
    .colorspace ,
    .preview > :global(output > code) {
      background: oklch(from color-contrast(color-contrast(var(--user-color) vs black, white) vs black,white) l c h / .4);
    }
  }

  .controls {
    display: grid;
    gap: var(--size-2);
    padding: var(--size-3);
    background-color: var(--surface-2);
  }

  @media (prefers-color-scheme: light) {
    .controls {
      background-color: white;
    }
  }

  .control {
    display: flex;
    place-items: center;
    gap: var(--size-2);
  }

  .control-channel {
    font-family: var(--font-mono);
    cursor: default;
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