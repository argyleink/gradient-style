<script>
  import {gradient_stops, gradient_space} from '../store/gradient.ts'
  import {linear_angle, linear_named_angle} from '../store/linear.ts'
  import {picker_value} from '../store/colorpicker.ts'

  function pickColor(stop, e) {
    const picker = document.getElementById('color-picker')

    picker.setAnchor(e.target)
    picker.setColor(stop.color)
    picker.showModal()

    const unsub = picker_value.subscribe(value => {
      stop.color = value
      $gradient_stops = [...$gradient_stops]
    })

    picker.addEventListener('closing', () => {
      unsub()
    })
  }  
</script>

<div class="linear-overlay" style="rotate: {$linear_angle}deg">
  <div class="line">
    <div class="stop"></div>
    <!-- <button class="stop" style="background-color: magenta" on:click={e => pickColor({color:"rgb(100% 0% 100%)"},e)}></button> -->
    <div class="hint">
      <svg viewBox="0 0 24 15">
        <path d="M.99 9.415 9.649.955c.309-.303.676-.543 1.08-.707a3.396 3.396 0 0 1 2.552 0c.404.164.771.404 1.08.707l8.657 8.46C25.123 11.473 23.62 15 20.644 15H3.331C.356 15-1.115 11.473.99 9.415Z"/>
      </svg>
    </div>
    <div class="stop"></div>
    <div class="hint">
      <svg viewBox="0 0 24 15">
        <path d="M.99 9.415 9.649.955c.309-.303.676-.543 1.08-.707a3.396 3.396 0 0 1 2.552 0c.404.164.771.404 1.08.707l8.657 8.46C25.123 11.473 23.62 15 20.644 15H3.331C.356 15-1.115 11.473.99 9.415Z"/>
      </svg>
    </div>
    <div class="stop"></div>
  </div>
</div>

<style>
  .linear-overlay {
    display: grid;
    position: relative;
    grid-area: 1/1;
    align-content: center;
    inline-size: calc(100% + var(--size-5));
    justify-self: center;
    pointer-events: none;
  }

  .line {
    display: grid;
    grid-auto-flow: column;
    place-items: center;
    place-content: center space-between;
    block-size: 2px;
    inline-size: 100%;
    background: hsl(0 0% 100% / 50%);
  }

  .line::after {
    content: "";
    block-size: 2px;
    position: absolute;
    background: hsl(0 0% 100% / 10%);
    inline-size: 150cqmax;
    z-index: -1;
  }

  .stop {
    background: white;
    aspect-ratio: 1;
    inline-size: var(--size-5);
    border-radius: var(--radius-round);
    box-shadow: var(--shadow-2);
    border: .5px solid hsl(0 0% 0% / 15%);
  }

  .stop:is(:hover,:focus-visible) {
    background: white;
  }

  .hint {
    inline-size: var(--size-5);
    align-self: end;
    translate: 0 5px;
    filter: drop-shadow(0px 2px 2px hsl(0 0% 0% / 10%));
  }

  .hint > svg {
    fill: white;
    stroke-width: 0.5px;
    stroke: hsl(0 0% 0% / 15%);
  }

  :is(.hint, .stop) {
    pointer-events: auto;
    cursor: grab;
  }

  :is(.hint, .stop):active {
    cursor: grabbing;
  }
</style>