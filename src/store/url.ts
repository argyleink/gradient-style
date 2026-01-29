import {derived} from 'svelte/store'

import {gradient_type, gradient_space, gradient_interpolation, 
        gradient_stops
} from '../store/gradient.ts'
import {linear_angle, linear_named_angle} from '../store/linear.ts'
import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'
import {conic_angle, conic_position, conic_named_position
  } from '../store/conic.ts'
import { layers, active_layer_index } from './layers'

import {isCylindricalSpace} from '../utils/colorspace.ts'

export const stateAsString = derived(
	[
		gradient_type, gradient_space, gradient_stops, gradient_interpolation,
		linear_angle, linear_named_angle,
		radial_shape, radial_position, radial_named_position, radial_size,
		conic_angle, conic_position, conic_named_position,
    layers, active_layer_index,
	],
	([
		$gradient_type, $gradient_space, $gradient_stops, $gradient_interpolation,
		$linear_angle, $linear_named_angle,
		$radial_shape, $radial_position, $radial_named_position, $radial_size,
		$conic_angle, $conic_position, $conic_named_position,
    $layers, $active_layer_index,
	]) => {
		// Prefer serializing full layers when multiple are present
    if (Array.isArray($layers) && $layers.length > 1) {
      try {
        // minimize payload: drop cachedCss and id
        const compact = $layers.map(l => ({
          name: l.name,
          visible: l.visible,
          type: l.type,
          space: l.space,
          interpolation: l.interpolation,
          stops: l.stops,
          linear: l.linear,
          radial: l.radial,
          conic: l.conic,
        }))
        return serializeUrl({ layers: JSON.stringify(compact), active: String($active_layer_index ?? 0) })
      } catch {}
    }

		let urlGradient = {
			type: $gradient_type,
			space: $gradient_space,
		} as any

		if (isCylindricalSpace($gradient_space))
			urlGradient.interpolation = $gradient_interpolation

		if ($gradient_type === 'linear') {
			if ($linear_named_angle) urlGradient.linear_named_angle = $linear_named_angle
			if ($linear_angle) urlGradient.linear_angle = $linear_angle
		}
		else if ($gradient_type === 'radial') {
			urlGradient.radial_shape = $radial_shape
			urlGradient.radial_position = $radial_position
			urlGradient.radial_named_position = $radial_named_position
			urlGradient.radial_size = $radial_size
		}
		else if ($gradient_type === 'conic') {
			urlGradient.conic_angle = $conic_angle
			urlGradient.conic_position = $conic_position
			urlGradient.conic_named_position = $conic_named_position
		}
		else
			return null

		urlGradient.stops = $gradient_stops
		return serializeUrl(urlGradient)
	}
)

export function serializeUrl(state: any): string {
	const hash = new URLSearchParams("")

  for (const key in state) {
  	if (key == 'stops') {
  		for (const stop of state[key])
  			hash.append(key, JSON.stringify(stop))
  	}
  	else if (key == 'radial_position' || key == 'conic_position') {
  		hash.set(key, JSON.stringify(state[key]))
  	}
    else if (key == 'layers') {
      hash.set(key, state[key])
    }
  	else
	    hash.set(key, state[key])
  }

  return hash.toString()
}

export function deserializeUrl(hash: any): any {
  const raw = typeof hash === 'string' ? hash.replace(/^#/, '') : ''
  const params = new URLSearchParams(raw)
  const out: any = {}

  for (const [k, value] of params.entries()) {
    const key = k.startsWith('#') ? k.slice(1) : k

    if (key === 'stops') {
      out[key] = params.getAll(k).map((s: string) => JSON.parse(s))
    }
    else if (key === 'radial_position' || key === 'conic_position') {
      try { out[key] = JSON.parse(value) } catch { out[key] = null }
    }
    else if (key === 'layers') {
      try { out[key] = JSON.parse(value) } catch { out[key] = null }
    }
    else if (key === 'active') {
      out[key] = Number(value)
    }
    else if (key === 'type') {
      out[key] = value
    }
    else {
      out[key] = value
    }
  }

  return out
}

export function restoreStateFromUrl() {
  if (window.location.hash) {
    return deserializeUrl(window.location.hash)
  }
  return null
}
