import * as LZstring from 'lz-string'
import {derived} from 'svelte/store'

import {gradient_type, gradient_space, gradient_interpolation, 
        gradient_stops
} from '../store/gradient.ts'
import {linear_angle, linear_named_angle} from '../store/linear.ts'
import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'
import {conic_angle, conic_position, conic_named_position
  } from '../store/conic.ts'

import {isCylindricalSpace} from '../utils/colorspace.ts'

export const stateAsString = derived(
	[
		gradient_type, gradient_space, gradient_stops, gradient_interpolation,
		linear_angle, linear_named_angle,
		radial_shape, radial_position, radial_named_position, radial_size,
		conic_angle, conic_position, conic_named_position,
	],
	([
		$gradient_type, $gradient_space, $gradient_stops, $gradient_interpolation,
		$linear_angle, $linear_named_angle,
		$radial_shape, $radial_position, $radial_named_position, $radial_size,
		$conic_angle, $conic_position, $conic_named_position,
	]) => {
		// todo: rate limit this work
		let urlGradient = {
			type: $gradient_type,
			space: $gradient_space,
		}

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

export function serializeUrl(state) {
	const hash = new URLSearchParams("")

  for (const key in state) {
  	if (key == 'stops') {
  		for (const stop of state[key]) {
  			hash.append(key, LZstring.compressToUTF16(JSON.stringify(stop)))
  		}
  	}
  	else if (key == 'radial_position' || key == 'conic_position') {
  		hash.set(key, JSON.stringify(state[key]))
  	}
  	else
	    hash.set(key, state[key])
  }

  return hash.toString()
}

export function deserializeUrl(hash) {
	let state = new URLSearchParams(hash)

  for (const [key, value] of state.entries()) {
  	if (key == 'stops')
  		state[key] = state.getAll(key).map(LZstring.decompressFromUTF16).map(JSON.parse)
  	else if (key == 'radial_position' || key == 'conic_position')
  		state[key] = JSON.parse(value)
  	else if (key == '#type')
  		state.type = value
  	else
	    state[key] = value
  }

  return state
}

export function restoreStateFromUrl() {
	if (window.location.hash) {
		return deserializeUrl(window.location.hash)
	}
	else return null
}