<script>
  import { onMount } from 'svelte'
  import { replaceState } from '$app/navigation'

  import Color from 'colorjs.io'
  import { tooltip } from 'svooltip'
  import 'svooltip/styles.css'

  import {gradient_type, gradient_space, gradient_interpolation,
          gradient_stops, gradient_positions
  } from '../store/gradient.ts'
  import {linear_named_angle, linear_angle
  } from '../store/linear.ts'
  import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'
  import {conic_angle, conic_position, conic_named_position
  } from '../store/conic.ts'
  import {layers, active_layer_index, selectLayer} from '../store/layers.ts'
  import {stateAsString, deserializeUrl, restoreStateFromUrl} from '../store/url.ts'
  import { buildGradientStrings } from '../utils/gradientString'

  import {linearAngleToString} from '../utils/linear.ts'
  import {isCylindricalSpace} from '../utils/colorspace.ts'
  import {updateStops} from '../utils/stops.ts'
  import {randomNumber} from '../utils/numbers.ts'

  import GradientStops from './GradientStops.svelte'
  import GradientColorSpace from './GradientColorSpace.svelte'
  import HueInterpolation from './HueInterpolation.svelte'

  import LinearOverlay from './LinearOverlay.svelte'
  import RadialOverlay from './RadialOverlay.svelte'
  import ConicOverlay from './ConicOverlay.svelte'
  import ColorPicker from './ColorPicker.svelte'
  import LayersPanel from './LayersPanel.svelte'
  import Presets from './Presets.svelte'
import Prism from './PrismJS.svelte'
import GradientImportDialog from './GradientImportDialog.svelte'

  import Hint from './Hint.svelte'

  let preview_resizer = $state()
  let preview_hd = $state(true)
  let box_width = $state()
  let box_height = $state()
  let metatag
  let svgicon
  let restoring = $state(true)
  let importRef

  onMount(async () => {
    // preview_hd = window.matchMedia('(dynamic-range: high)').matches

    const {stateAsString, restoreStateFromUrl} = await import('../store/url.ts')
    const restore = restoreStateFromUrl()

    // Track last known explicit positions to persist across type changes
    let lastRadialPos = { x: null, y: null }
    let lastConicPos = { x: null, y: null }

    // Cache explicit positions when available
    radial_position.subscribe(pos => {
      if (pos && (pos.x ?? null) !== null && (pos.y ?? null) !== null) {
        lastRadialPos = { x: pos.x, y: pos.y }
      }
    })
    conic_position.subscribe(pos => {
      if (pos && (pos.x ?? null) !== null && (pos.y ?? null) !== null) {
        lastConicPos = { x: pos.x, y: pos.y }
      }
    })

    metatag = document.querySelector('#browsertheme')
    svgicon = document.querySelector('#svgicon')

    if (restore) {
      // Multi-layer restore path
      if (restore.layers && Array.isArray(restore.layers)) {
        try {
          const restored = restore.layers.map((l) => {
            const layer = {
              id: crypto?.randomUUID?.() ?? `layer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: l.name ?? 'Layer',
              visible: l.visible ?? true,
              type: l.type ?? 'linear',
              space: l.space ?? 'oklab',
              interpolation: l.interpolation ?? 'shorter',
              stops: Array.isArray(l.stops) ? l.stops : [],
              linear: l.linear ?? { named_angle: 'to right', angle: null },
              radial: l.radial ?? { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: null, y: null } },
              conic: l.conic ?? { angle: '0', named_position: 'center', position: { x: null, y: null } },
            }
            layer.cachedCss = buildGradientStrings(layer)
            return layer
          })
          layers.set(restored)
          const idx = Number.isFinite(restore.active) ? restore.active : 0
          const boundIdx = Math.max(0, Math.min(restored.length - 1, idx))
          active_layer_index.set(boundIdx)
          // Apply selected layer to single-stores to keep UI in sync
          selectLayer(boundIdx)
          restoring = false
        } catch (e) {
          // Fallback to single-layer path if parsing fails
          // eslint-disable-next-line no-console
          console.warn('Failed to restore layers from URL, falling back to single-layer restore:', e)
        }
      }

      if (restoring) {
        // Single-layer legacy restore path
        if (restore.type)               $gradient_type = restore.type
        if (restore.space)              $gradient_space = restore.space
        if (restore.interpolation)      $gradient_interpolation = restore.interpolation

        if (restore.linear_named_angle) $linear_named_angle = restore.linear_named_angle
        if (restore.linear_angle)       $linear_angle = parseInt(restore.linear_angle)

        if (restore.radial_shape)       $radial_shape = restore.radial_shape
        // Prefer explicit coordinates over named position to avoid overwrite from subscriptions
        if (restore.radial_position) {
          $radial_named_position = '--'
          $radial_position = restore.radial_position
        }
        else if (restore.radial_named_position) {
          $radial_named_position = restore.radial_named_position
        }
        if (restore.radial_size)        $radial_size = restore.radial_size

        if (restore.conic_angle)        $conic_angle = restore.conic_angle
        // Prefer explicit coordinates over named position to avoid overwrite from subscriptions
        if (restore.conic_position) {
          $conic_named_position = '--'
          $conic_position = restore.conic_position
        }
        else if (restore.conic_named_position) {
          $conic_named_position = restore.conic_named_position
        }

        // last, to kickoff render
        if (restore.stops)              $gradient_stops = updateStops(restore.stops)
        restoring = false
      }
    }
    else {
      restoring = false
    }

    // Debounced URL syncing that pauses during active user interaction
    let isInteracting = false
    let pendingUrlState = null

    function scheduleUrlWrite(state, delay = 350) {
      clearTimeout(window.syncStateTimer)
      window.syncStateTimer = setTimeout(() => {
        state && replaceState('#' + state, {})
      }, delay)
    }

    const startInteract = () => {
      isInteracting = true
      clearTimeout(window.syncStateTimer)
    }
    const endInteract = () => {
      isInteracting = false
      if (pendingUrlState != null) {
        // Write as soon as the interaction ends
        scheduleUrlWrite(pendingUrlState, 0)
        pendingUrlState = null
      }
    }

    // Global listeners to detect interaction windows
    window.addEventListener('pointerdown', startInteract, { passive: true })
    window.addEventListener('pointerup', endInteract, { passive: true })
    window.addEventListener('pointercancel', endInteract, { passive: true })
    window.addEventListener('keydown', startInteract)
    window.addEventListener('keyup', endInteract)

    stateAsString.subscribe(state => {
      if (isInteracting) {
        // Defer writing until after the interaction ends
        pendingUrlState = state
        return
      }
      scheduleUrlWrite(state, 350)
    })

    gradient_stops.subscribe(state => {
      if (!metatag || !svgicon) return
      try {
        clearTimeout(window.syncColorTimer)
        window.syncColorTimer = setTimeout(() => {
          const [first] = state
          const newmeta = new Color(first.color)

          metatag.content = newmeta.to('srgb').toString({ format: 'hex' })
          svgicon.href = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><mask id='stripes'><rect height='40%' width='100%' fill='white' /><rect height='7%' y='41%' width='100%' fill='white' /><rect height='6%' y='50%' width='100%' fill='white' /><rect height='5%' y='59%' width='100%' fill='white' /><rect height='4%' y='68%' width='100%' fill='white' /><rect height='3%' y='78%' width='100%' fill='white' /><rect height='2%' y='90%' width='100%' fill='white' /><rect height='1%' y='99%' width='100%' fill='white' /></mask><circle mask='url(%23stripes)' fill='${newmeta.to('srgb').toString()}' cx='50' cy='50' r='50'/></svg>`
          // Use the leading stop color to tint global proximity glows.
          document.documentElement.style.setProperty('--gs-glow-color', newmeta.to('srgb').toString())
        }, 500)
      }
      catch (err) {}
    })

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries.at(0)
      box_width = entry.contentBoxSize[0].inlineSize
      box_height = entry.contentBoxSize[0].blockSize
    })

    resizeObserver.observe(preview_resizer)

    // When switching gradient types, carry over the last known x/y between radial and conic
    gradient_type.subscribe(type => {
      if (type === 'radial') {
        // Prefer explicit cached conic position if radial is missing
        if (($radial_position?.x ?? null) === null || ($radial_position?.y ?? null) === null) {
          if ((lastConicPos.x ?? null) !== null && (lastConicPos.y ?? null) !== null) {
            $radial_named_position = '--'
            $radial_position = { x: lastConicPos.x, y: lastConicPos.y }
          }
        }
      }
      else if (type === 'conic') {
        if (($conic_position?.x ?? null) === null || ($conic_position?.y ?? null) === null) {
          if ((lastRadialPos.x ?? null) !== null && (lastRadialPos.y ?? null) !== null) {
            $conic_named_position = '--'
            $conic_position = { x: lastRadialPos.x, y: lastRadialPos.y }
          }
        }
      }
    })
  })

  function openImport() {
    importRef?.show()
  }

  const gensyntax = {
    'linear': () =>
      `linear-gradient(
    ${linearAngleToString($linear_angle, $linear_named_angle)} ${spaceToString()},
    ${stopsToStrings({new_lines: false})}
  )`,
    'radial': () =>
      `radial-gradient(
    ${$radial_size} ${$radial_shape} at ${radialPositionToString()} ${spaceToString()},
    ${stopsToStrings({new_lines: false})}
  )`,
    'conic': () =>
      `conic-gradient(
    from ${$conic_angle}deg at ${conicPositionToString()} ${spaceToString()},
    ${stopsToStrings({new_lines: false})}
  )`
  }

  const genClassicSyntax = {
    'linear': () =>
      `linear-gradient(${linearAngleToString($linear_angle, $linear_named_angle)}, ${stopsToStrings({convert_colors: true, new_lines: false})})`,
    'radial': () =>
      `radial-gradient(
    ${$radial_size} ${$radial_shape} at ${radialPositionToString()},
    ${stopsToStrings({convert_colors: true, new_lines: false})}
  )`,
    'conic': () =>
      `conic-gradient(
    from ${$conic_angle}deg at ${conicPositionToString()},
    ${stopsToStrings({convert_colors: true, new_lines: false})}
  )`
  }

  function spaceToString() {
    return isCylindricalSpace($gradient_space) && $gradient_interpolation !== 'shorter'
      ? `in ${$gradient_space} ${$gradient_interpolation} hue`
      : `in ${$gradient_space}`
  }

  function maybeConvertColor(color, convert_colors) {
    if (convert_colors) {
      try {
        return new Color(color).toGamut({space: 'srgb', method: 'clip'}).to('srgb').toString({ format: 'hex' })
      }
      catch {}
    }
    else {
      return color
    }
  }

  function stopsToStrings({convert_colors, new_lines} = {convert_colors: false, new_lines: true}) {
    // Identify first/last stop indices in the full list (including hints)
    const stopIndices = $gradient_stops
      .map((s, i) => (s?.kind === 'stop' ? i : null))
      .filter(i => i !== null)
    const firstStopIdx = stopIndices.at(0)
    const lastStopIdx = stopIndices.at(-1)

    function fmtPos(p) {
      if (p == null) return null
      const str = String(p)
      // If already has a unit (includes any letter) or %, keep as-is
      if (/[a-z%]/i.test(str)) return str
      // Otherwise default to percentage unit
      return str + '%'
    }

    function isPctZero(p) {
      if (p == null) return false
      const m = String(p).match(/^(-?\d+(?:\.\d+)?)%$/)
      return !!(m && Number(m[1]) === 0)
    }

    function isPctHundred(p) {
      if (p == null) return false
      const m = String(p).match(/^(-?\d+(?:\.\d+)?)%$/)
      return !!(m && Number(m[1]) === 100)
    }

    return $gradient_stops
      .map((s, i) => {
        if (s.kind === 'stop') {
          let p1 = s.position1
          let p2 = s.position2

          // Omit values equal to tool defaults only if explicitly stored in stop.auto
          if (p1 != null && s.auto != null && p1 == s.auto) p1 = null

          // Omit browser default edges only when explicitly percentages
          if (i === firstStopIdx && isPctZero(p1)) p1 = null
          if (i === lastStopIdx && isPctHundred(p2)) p2 = null

          // If both positions exist
          if (p1 != null && p2 != null) {
            const a = fmtPos(p1)
            const b = fmtPos(p2)
            if (a !== b) return maybeConvertColor(s.color, convert_colors) + ' ' + a + ' ' + b
            // equal -> single position once
            return maybeConvertColor(s.color, convert_colors) + ' ' + a
          }

          // Only second position exists (do not synthesize 0%)
          if (p1 == null && p2 != null) {
            const b = fmtPos(p2)
            return maybeConvertColor(s.color, convert_colors) + ' ' + b
          }

          // Only first position exists
          if (p1 != null && p2 == null) {
            const a = fmtPos(p1)
            return maybeConvertColor(s.color, convert_colors) + ' ' + a
          }

          // No positions provided
          return maybeConvertColor(s.color, convert_colors)
        }
        else if (s.kind === 'hint') {
          if (s.percentage == null) return null
          // s.percentage is unitless; add % here
          return s.percentage + '%'
        }
        return null
      })
      .filter(Boolean)
      .join(new_lines == true ? ',\n      ' : ', ')
  }

  function radialPositionToString() {
    if ($radial_position.x != null) {
      const y = $radial_position.y ?? '50'
      return $radial_position.x + '% ' + y + '%'
    }
    else {
      return $radial_named_position
    }
  }

  function conicPositionToString() {
    if ($conic_position.x != null) {
      const y = $conic_position.y ?? '50'
      return $conic_position.x + '% ' + y + '%'
    }
    else {
      return $conic_named_position
    }
  }

  function addStop() {
    const newList = [
      ...$gradient_stops,
      {kind: 'hint', percentage: null},
      {kind: 'stop', color: `oklch(80% 0.3 ${randomNumber(0,360)})`, position1: null, position2: null},
    ]
    $gradient_stops = updateStops(newList)
  }

  function showCodePane() {
    document.querySelector('.code-preview-panel .panel-actions button').focus()
  }

  function showEditorPane() {
    document.querySelector('.preview-panel .panel-actions button').focus()
  }

  import { copyToClipboard } from '../utils/clipboard.ts'
  import { layers as layersStore, active_layer_index as activeLayerIndex, defaultLayer, selectLayer as selectLayerFn } from '../store/layers.ts'

  function globalAction(event) {
    switch (event.target.value) {
      case 'Start new':
        // Reset to a single default linear layer and sync stores
        layersStore.set([defaultLayer()])
        activeLayerIndex.set(0)
        selectLayerFn(0)
        break
      case 'Copy modern CSS':
        copyToClipboard(user_layers_joined || user_gradient)
        break
      case 'Copy classic CSS':
        copyToClipboard(classic_layers_joined || classic_gradient)
        break
      case 'Import gradient':
        openImport()
        break
      case 'Tips & tricks':
        let delay = 0
        let stagger = 100
        document.querySelectorAll('.hint').forEach((hint, i) => {
          setTimeout(()=> {
            hint.classList.remove('hiding')
            hint.setAttribute('tabindex', "0")
          }, delay + (i * stagger))
        })
        break
      case 'Help & feedback':
        window.open('https://discord.gg/Kt7ksqRM4V', '_blank')
        break
      case 'GitHub':
        window.open('https://github.com/argyleink/gradient-style', '_blank')
        break
    }

    // reset
    event.target.selectedIndex = 0
  }

let user_gradient = $derived(gensyntax[$gradient_type](
    $gradient_space,
    $gradient_interpolation,
    $gradient_stops,
    $linear_named_angle,
    $linear_angle,
    $radial_shape,
    $radial_size,
    $radial_position,
    $radial_named_position,
    $conic_angle,
    $conic_position,
    $conic_named_position
  ))

  let classic_gradient = $derived(genClassicSyntax[$gradient_type](
    $gradient_space,
    $gradient_interpolation,
    $gradient_stops,
    $linear_named_angle,
    $linear_angle,
    $radial_shape,
    $radial_size,
    $radial_position,
    $radial_named_position,
    $conic_angle,
    $conic_position,
    $conic_named_position
  ))

  // Multi-layer joined strings for preview and output
  let user_layers_joined = $derived(($layers || []).filter(l => l?.visible !== false).map(l => l?.cachedCss?.modern || '').filter(Boolean).join(', '))
  let classic_layers_joined = $derived(($layers || []).filter(l => l?.visible !== false).map(l => l?.cachedCss?.classic || '').filter(Boolean).join(', '))
</script>

<div class="color-wrap" style={`--user-classic: ${classic_layers_joined || classic_gradient}; --user-modern: ${user_layers_joined || user_gradient}; background: var(--user-classic); background: ${preview_hd ? 'var(--user-modern)':'var(--user-classic)'};`}>
<main class="gradient-builder">

  <contain-er style="container: layers-panel / inline-size; z-index: var(--layer-1)">
    <div class="primary-sidebar">
      <header class="brand">
<div class="gradient-logo" style="background:{preview_hd ? (user_layers_joined || user_gradient) : (classic_layers_joined || classic_gradient)}"></div>
        <h1 class="brand-name">
          HDR G<b>rad</b>ients
        </h1>
      </header>
      <ColorPicker />
      <LayersPanel />
      <Presets />
    </div>
  </contain-er>

  <contain-er style="container: preview-panel / inline-size;">
    <div class="inline-snap-panels">
      <section class="preview-panel">
        <div class="panel-actions">
          <button onclick={e => showCodePane()} use:tooltip={{content: "Get the CSS"}}>
            <span class="sr-only">Get the CSS code</span>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M16.7 17.3q-.275.275-.688.275t-.712-.3q-.3-.3-.3-.712t.3-.713l3.875-3.875l-3.9-3.9Q15 7.8 15.012 7.388T15.3 6.7q.275-.275.7-.275t.7.275l4.6 4.6q.3.3.3.7t-.3.7l-4.6 4.6Zm-9.4 0l-4.6-4.6q-.3-.3-.3-.7t.3-.7l4.6-4.6q.275-.275.7-.287t.725.287q.3.3.3.713t-.3.712l-3.9 3.9l3.9 3.9q.275.275.263.688T8.7 17.3q-.275.275-.7.275t-.7-.275Z"/>
            </svg>
          </button>
        </div>
        <div class="preview">
          {#if $gradient_interpolation !== 'longer'}
          <label class="hd-switch">
            <Hint title="HDR" copy="This switch toggles between the SDR and HDR CSS gradients.<br><br>When off it shows the gradient with hex colors, which has always been in the sRGB colorspace.<br><br>When on, the gradient shown is using a newer color space and also using newer wide gamut colors.<br><br>This button helps you preview the classic gradient vs the HDR gradient you're building in this tool." />
            <span class="sr-only">HD on or off?</span>
            {#if preview_hd == true}
              <svg aria-hidden="true" width="32" height="32" viewBox="0 0 20 20"><path fill="currentColor" d="M4.75 4A2.75 2.75 0 0 0 2 6.75v6.5A2.75 2.75 0 0 0 4.75 16h10.5A2.75 2.75 0 0 0 18 13.25v-6.5A2.75 2.75 0 0 0 15.25 4H4.75ZM4.5 7.5A.5.5 0 0 1 5 8v1.5h2V8a.5.5 0 0 1 1 0v4a.5.5 0 0 1-1 0v-1.5H5V12a.5.5 0 0 1-1 0V8a.5.5 0 0 1 .5-.5ZM9 8a.5.5 0 0 1 .5-.5h.25A2.25 2.25 0 0 1 12 9.75v.5a2.25 2.25 0 0 1-2.25 2.25H9.5A.5.5 0 0 1 9 12V8Zm1 3.475c.57-.116 1-.62 1-1.225v-.5c0-.605-.43-1.11-1-1.225v2.95ZM13 8a.5.5 0 0 1 .5-.5h1a1.5 1.5 0 0 1 .868 2.724l.6 1.6a.5.5 0 0 1-.936.352l-.629-1.676H14V12a.5.5 0 0 1-1 0V8Zm1 1.5h.5a.5.5 0 0 0 0-1H14v1Z"/></svg>
            {/if}
            {#if preview_hd == false}
              <svg aria-hidden="true" width="32" height="32" viewBox="0 0 20 20"><path fill="currentColor" d="M2.854 2.146a.5.5 0 1 0-.708.708l1.416 1.415A2.75 2.75 0 0 0 2 6.75v6.5A2.75 2.75 0 0 0 4.75 16h10.543l1.853 1.854a.5.5 0 0 0 .708-.708l-15-15Zm8.38 9.795a2.241 2.241 0 0 1-1.484.559H9.5A.5.5 0 0 1 9 12V9.707l1 1v.768c.195-.04.374-.125.524-.244l.71.71ZM8 8.707V12a.5.5 0 0 1-1 0v-1.5H5V12a.5.5 0 0 1-1 0V8a.5.5 0 0 1 1 0v1.5h2V8c0-.085.021-.165.058-.235L8 8.707Zm4 1.043v.129l1 1V8a.5.5 0 0 1 .5-.5h1a1.5 1.5 0 0 1 .868 2.724l.6 1.6a.5.5 0 0 1-.936.352l-.629-1.676H14v1.379l3.254 3.254A2.74 2.74 0 0 0 18 13.25v-6.5A2.75 2.75 0 0 0 15.25 4H6.121l3.5 3.5h.129A2.25 2.25 0 0 1 12 9.75Zm2-.25h.5a.5.5 0 0 0 0-1H14v1Z"/></svg>
            {/if}
            <input bind:checked={preview_hd} type="checkbox" name="hd-gradient" use:tooltip={{html: true, content: '<span class="rich-tooltip">Toggle between high and standard gradient previews.<br><br>(HDR) high dynamic range.</span>'}}/>
          </label>
          {/if}
          <div
            bind:this={preview_resizer}
            class="resizer"
            style={`background: ${classic_layers_joined || classic_gradient};  ${preview_hd == true ? `background: ${user_layers_joined || user_gradient};` : ''} ${box_width ? `width: ${box_width}px; height: ${box_height}px;`:'width: 75cqi;'}`}>
          </div>
          {#if !restoring}
            {#if $gradient_type === 'linear'}
              <LinearOverlay w={box_width} h={box_height} />
            {/if}
            {#if $gradient_type === 'radial'}
              <RadialOverlay w={box_width} h={box_height} />
            {/if}
            {#if $gradient_type === 'conic'}
              <ConicOverlay w={box_width} h={box_height} />
            {/if}
          {/if}
        </div>
      </section>
      <section class="code-preview-panel">
        <div class="panel-actions">
          <button onclick={e => showEditorPane()} use:tooltip={{content: "Back to the editor"}}>
            <span class="sr-only">Back to editor</span>
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="m10.875 19.3l-6.6-6.6q-.15-.15-.213-.325T4 12q0-.2.063-.375t.212-.325l6.6-6.6q.275-.275.688-.287t.712.287q.3.275.313.688T12.3 6.1L7.4 11h11.175q.425 0 .713.288t.287.712q0 .425-.287.713t-.713.287H7.4l4.9 4.9q.275.275.288.7t-.288.7q-.275.3-.7.3t-.725-.3Z"/>
            </svg>
          </button>
        </div>
        <h4>Gradient CSS</h4>
<Prism modern_gradient={user_layers_joined || user_gradient} classic_gradient={classic_layers_joined || classic_gradient} />
      </section>
    </div>
  </contain-er>

  <contain-er style="container: control-panel / inline-size; z-index: var(--layer-1)">
    <section class="controls">
      <div class="menu-bar">
        <button class="global-actions">
          <select tabindex="-1" onchange={globalAction}>
            <option disabled selected>Global Actions</option>
            <option>Start new</option>
            <option>Import gradient</option>
            <option>Copy modern CSS</option>
            <option>Copy classic CSS</option>
            <!-- <option disabled>Reset all stops to auto</option> -->
            <!-- <option disabled>Toggle light & dark</option> -->
            <option>Tips & tricks</option>
            <option>Help & feedback</option>
            <option>GitHub</option>
          </select>
        </button>
      </div>

      <GradientColorSpace />

      {#if isCylindricalSpace($gradient_space)}
        <HueInterpolation />
      {/if}

      {#if !restoring}
        <GradientStops />
      {/if}

      <footer class="end-of-stops">
        <button class="add-color" onclick={() => addStop()}>
          Add a random color
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="m17 3l5.25 4.5L17 12l5.25 4.5L17 21v-3h-2.74l-2.82-2.82l2.12-2.12L15.5 15H17V9h-1.5l-9 9H2v-3h3.26l9-9H17V3M2 6h4.5l2.82 2.82l-2.12 2.12L5.26 9H2V6Z"/>
          </svg>
        </button>
      </footer>

    </section>
  </contain-er>
  <GradientImportDialog bind:this={importRef} />
</main>
</div>

<style>
  :global(html) {
    scrollbar-color: var(--surface-4) #0000;
  }

  .import-btn { align-self: start; }
  .color-wrap {
    background: Canvas;
    padding: var(--size-3);
  }

  @media (prefers-color-scheme: light) {
    .color-wrap {
      background: #ddd;
    }
  }

	.gradient-builder {
    --link: var(--surface-4);
		display: grid;
    border-radius: var(--radius-3);
    box-shadow: var(--shadow-3);
    overflow: clip;
	}

	@media (prefers-color-scheme: light) {
    .gradient-builder {
      --link: var(--gray-6);
    }
  }

  @media (min-width: 1024px) {
    .gradient-builder {
      grid-template-columns: var(--size-14) 1fr var(--size-14);
      grid-template-rows: calc(100vh - (var(--size-3) * 2));
      grid-template-rows: calc(100dvh - (var(--size-3) * 2));
    }
  }

  .preview {
    display: grid;
    margin-inline: auto;
    animation: var(--animation-fade-out) reverse;
    background: var(--gradient-checkerboard);
    box-shadow: var(--shadow-6);
  }

  .preview > * {
    grid-area: 1/1;
  }

  .resizer {
    resize: both;
    overflow: hidden;
    min-block-size: 80px;
    max-inline-size: 95cqi;
    max-block-size: 95cqb;
    aspect-ratio: var(--ratio-widescreen);
  }

  @media (min-width: 1024px) {
    .resizer {
      block-size: 75vh;
    }
  }

  .menu-bar {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: var(--size-3);
    padding-inline: var(--size-3);
    position: sticky;
    z-index: 1;
    inset-block-start: 0;
    block-size: var(--size-8);
  }

  .menu-bar > select {
    box-shadow: none;
  }

  .menu-bar-icon {
    padding: var(--size-1);
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);

    --_bg: transparent;
    --_icon-size: var(--size-4);
    --_border: none;
  }

  .controls {
    display: grid;
    gap: var(--size-1);
    grid-template-rows: auto auto auto 1fr;
    background: var(--surface-2);
    padding-block: 0;
    scrollbar-width: thin;
    accent-color: var(--surface-3);
  }

  @media (min-width: 1024px) {
    .controls {
      block-size: 100%;
      max-block-size: 100vh;
      max-block-size: 100dvh;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
  }

  .controls {
    counter-reset: count 0;
  }

  .brand {
    min-block-size: var(--size-content-1);
    display: grid;
    place-content: center;
    background: var(--surface-3);
    gap: var(--size-2);
  }

  @media (prefers-color-scheme: light) {
    .controls {
      background: var(--surface-1);
    }

    .brand {
      background: white;
    }
  }

  .brand :global(> h1) {
    font-size: var(--font-size-3);
  }

  .preview-panel {
    display: grid;
    place-content: center;
    inline-size: 100cqi;
    overflow: clip;
    position: relative;
  }

  @media (max-width: 1024px) {
    .preview-panel {
      padding-block: var(--size-8);
    }
  }

  .code-preview-panel {
    display: grid;
    gap: var(--size-2);
    padding-block: var(--size-6);
    align-content: center;
    justify-items: flex-start;
    justify-content: center;
    position: relative;
  }

  @media (max-width: 1024px) {
    .code-preview-panel, .panel-actions {
      display: none;
    }
  }

  .code-preview-panel .panel-actions {
    inset-inline: var(--size-3) auto;
  }

  .inline-snap-panels {
    background-color: var(--surface-1);
    display: grid;
    grid-template-columns: 100cqi 100cqi;
    min-block-size: 100%;
    overflow: auto;
    overscroll-behavior: contain;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    overflow: hidden;
  }

  @media (min-width: 1024px) {
    .inline-snap-panels {
      max-block-size: 100vh;
      max-block-size: 100dvh;
      overflow: auto;
    }
  }

  @media (prefers-color-scheme: light) {
    .inline-snap-panels {
      background: var(--surface-4);
    }
  }

  .inline-snap-panels > section {
    scroll-snap-align: center;
  }

  .panel-actions {
    position: absolute;
    inset-block-start: var(--size-3);
    inset-inline-end: var(--size-3);
  }

  .panel-actions > button {
    padding: var(--size-2);
    border-radius: var(--radius-round);
    --_bg: var(--surface-1);
  }

  :global(.control-set) {
    border: none;
    border-radius: 0;
    border-color: var(--surface-3);
    display: grid;
    gap: var(--size-2);
    padding-inline: var(--size-5);
    padding-block: var(--size-3);
  }

  :global(.control-set:focus-within) {
    border-color: var(--link);
  }

  :global(.control-set:focus-within legend) {
    color: var(--link);
  }

  :global(.control-set > select) {
    place-self: start;
  }

  :global(.control-set) {
    position: relative;
  }

  :global(.label-select-combo) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  :global(.radio-pair) {
    display: flex;
    align-items: center;
    gap: var(--size-2);
  }

  :global(.input-suffix) {
    display: flex;
    align-items: center;
  }

  :global(.input-suffix > sup) {
    color: var(--text-2);
    font-size: var(--font-size-0);
    user-select: none;
  }

  .gradient-builder :global(input[type="range"]) {
    inline-size: 100%;
  }

  :global(.slider-set) {
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
  }

  :global(.slider-set > label) {
    color: var(--text-2);
    font-size: var(--font-size-0);
  }

  @media (prefers-color-scheme: light) {
    :global(select) {
      border: 1px solid var(--surface-2);
    }
  }

  :global(input[type="color"].round::-webkit-color-swatch-wrapper) {
    padding: 0;
    clip-path: circle(50%);
  }

  :global(input[type="color"].round::-webkit-color-swatch) {
    border: none;
  }

  .add-color {
    align-self: end;
  }

  :global(.remove) {
    padding-block: var(--size-1);
    padding-inline: var(--size-2);
    font-size: var(--font-size-0);
    justify-self: end;
  }


  :global(.stack) {
    display: grid;
    gap: var(--size-2);
  }

  :global(.percentage-value) {
    min-inline-size: 4ch;
    text-align: end;
  }

  :global(.slider-percentage) {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: end;
    max-inline-size: 2em;
    padding-block: 0;
    padding-inline-end: .25ch;
    padding-inline-start: 0;
    -moz-appearance:textfield;
    background: none;
  }

  /* @media (prefers-color-scheme: dark) {
    :global(.slider-percentage) {
      background: var(--surface-1);
    }
  } */

  :global(.slider-percentage::-webkit-outer-spin-button),
  :global(.slider-percentage::-webkit-inner-spin-button) {
      -webkit-appearance: none;
      margin: 0;
  }

.end-of-stops {
    place-content: end;
    padding: var(--size-3);
    margin-block-end: var(--size-fluid-2);
    text-align: center;
  }

  .gradient-logo {
    --retro-stripes: linear-gradient(to top, #000 1%, 0%, #0000 8%, 0%, #000 10%, 0%, #0000 16%, 0%, #000 19%, 0%, #0000 24%, 0%, #000 28%, 0%, #0000 32%, 0%, #000 37%, 0%, #0000 40%, 0%, #000 46%, 0%, #0000 48%, 0%, #000 55%, 0%, #0000 56%, 0%, #000 57%);
    mask: var(--retro-stripes);
    -webkit-mask: var(--retro-stripes);
    inline-size: var(--size-10);
    inline-size: 35cqi;
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    justify-self: center;
  }

  :global(select) {
    --icon-arrow-down: url(https://api.iconify.design/ic:keyboard-arrow-down.svg?color=%23adb5bd);
    --icon-arrow-up: url(https://api.iconify.design/ic:keyboard-arrow-up.svg?color=%23adb5bd);
    --_bg-light: #fff;
    --_bg-dark: var(--surface-3);
    --_bg: var(--_bg-light);
    background-color: var(--_bg);

    appearance: none;
    background-image: var(--icon-arrow-down);
    background-position: calc(100% - 1ch) center;
    background-size: 3ex;
    background-repeat: no-repeat;
    padding-block: 0.75ch;
    padding-inline: 1.75ch 3ch;
    line-height: 1.5;

    @supports (field-sizing: content) {
      padding-inline: 1.75ch 4ch;
    }
  }

  :global(select):is(:global(:hover,:focus)) {
    background-color: var(--_bg);
  }

  :global(select:not([disabled])) {
    box-shadow: var(--shadow-3);
  }

  :global(select:not([disabled])):is(:global(:hover, :focus)) {
    background-image: var(--icon-arrow-up);
  }

  :global(select[disabled]) {
    cursor: not-allowed;
  }

  /* -----------------------------------------------
   * Customizable Select (base-select) Styles
   * ----------------------------------------------- */
  @supports (appearance: base-select) {
    :global(select) {
      appearance: base-select;
    }

    /* Style the button that activates the picker */
    :global(select > button) {
      all: unset;
      display: flex;
      align-items: center;
      gap: 0.5ch;
      cursor: pointer;
      white-space: nowrap;
    }

    /* Style the selected content display */
    :global(select selectedcontent) {
      display: inline;
      white-space: nowrap;
    }

    /* Hide the picker icon */
    :global(select::picker-icon) {
      display: none;
    }

    /* Action button selects: fit to parent and hide content so parent icon shows */
    :global(.global-actions > select),
    :global(.layer-actions > select),
    :global(.stop-actions > select) {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      opacity: 0;
    }

    :global(select::picker(select)) {
      appearance: base-select;
      --_picker-bg-light: #fff;
      --_picker-bg-dark: var(--surface-3);
      --_picker-bg: var(--_picker-bg-light);

      background: var(--_picker-bg);
      border: 1px solid var(--surface-4);
      border-radius: var(--radius-2);
      box-shadow: var(--shadow-6);
      padding: var(--size-1);
      margin-block-start: var(--size-1);
      
      /* Transitions */
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
      transition: 
        opacity 150ms var(--ease-3),
        transform 150ms var(--ease-3),
        overlay 150ms var(--ease-3) allow-discrete,
        display 150ms var(--ease-3) allow-discrete;
    }

    :global(select:open::picker(select)) {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    @starting-style {
      :global(select:open::picker(select)) {
        opacity: 0;
        transform: translateY(-8px) scale(0.96);
      }
    }

    /* Hide disabled options in base-select mode */
    :global(select option[disabled]) {
      display: none;
    }

    :global(select option) {
      display: flex;
      align-items: center;
      padding: var(--size-2) var(--size-3);
      border-radius: var(--radius-2);
      cursor: pointer;
      transition: 
        background-color 100ms var(--ease-2),
        color 100ms var(--ease-2);
    }

    :global(select option:not(:last-child)) {
      margin-block-end: 1px;
    }

    :global(select option:hover) {
      background-color: var(--surface-2);
    }

    :global(select option:checked),
    :global(select option:focus) {
      background-color: var(--link);
      color: white;
    }

    /* Position checkmark on inline-end */
    :global(select option::checkmark) {
      order: 2;
      margin-inline-start: auto;
      padding-inline-start: var(--size-2);
    }

    :global(select optgroup) {
      padding-block: var(--size-1);
    }

    :global(select optgroup:last-of-type) {
      padding-block-end: 0;
    }

    :global(select optgroup:not(:first-of-type)) {
      border-block-start: 1px solid var(--surface-3);
      margin-block-start: var(--size-1);
      padding-block-start: var(--size-2);
    }

    @media (prefers-color-scheme: dark) {
      :global(select::picker(select)) {
        --_picker-bg: var(--_picker-bg-dark);
        border-color: var(--surface-4);
      }

      :global(select option:hover) {
        background-color: var(--surface-4);
      }

      :global(select optgroup:not(:first-of-type)) {
        border-block-start-color: var(--surface-4);
      }
    }
  }

  :global(.sr-only) {
    inline-size: 0;
    block-size: 0;
    overflow: hidden;
    visibility: hidden;
    white-space: nowrap;
    position: absolute;
  }

  @media (prefers-color-scheme: dark) {
    :global(select) {
      --_bg: var(--_bg-dark);
    }
  }

  .primary-sidebar {
    display: grid;
    background: var(--surface-2);
    block-size: 100%;
    align-content: start;
    grid-template-rows: auto [layers] 1fr auto [footer-links] auto;
  }

  @media (prefers-color-scheme: light) {
    .primary-sidebar {
      background: var(--surface-1);
    }
  }

  .brand {
    position: relative;
    text-align: center;
    padding-block: var(--size-3);
    box-shadow: var(--shadow-3);
  }

  .brand-name:hover > b {
    color: cyan;
    color: color(display-p3 0 1 1);
  }

  .hd-switch {
    cursor: pointer;
    position: absolute;
    inset-block-start: calc(var(--size-5) * -1.5);
    inset-inline-start: calc(var(--size-1) * -1);
  }

  .hd-switch > svg {
    color: var(--text-1);
  }

  .hd-switch > input {
    position: absolute;
    inset: 0;
    background: none;
    appearance: none;
    width: 32px;
    height: auto;
    aspect-ratio: 1;
  }

  .global-actions {
    position: relative;
    inline-size: var(--size-7);
    overflow: clip;
    border-radius: var(--radius-round);
    padding-inline: 0;
    aspect-ratio: 1;
    border: none;
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
    background-image: url(https://api.iconify.design/material-symbols:settings-rounded.svg?color=%23adb5bd);
    background-position: center;
    background-repeat: no-repeat;
    background-size: 75%;
  }

  .global-actions:not(:focus-within) {
    --_bg: transparent;
  }

  .global-actions > select {
    position: absolute;
    inset: 0;
  }
</style>
