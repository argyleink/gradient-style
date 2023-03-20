import {derived} from 'svelte/store'

import {gradient_type, gradient_space, gradient_interpolation, 
        gradient_stops
} from '../store/gradient.ts'
import {linear_angle, linear_named_angle} from '../store/linear.ts'
import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'

export const stateAsString = derived(
	[
		gradient_type, gradient_space, gradient_stops, gradient_interpolation,
		linear_angle, linear_named_angle,
	],
	([
		$gradient_type, $gradient_space, $gradient_stops, $gradient_interpolation,
		$linear_angle, $linear_named_angle,
	]) => {
		let urlGradient = {
			type: $gradient_type,
			space: $gradient_space,
			interpolation: $gradient_interpolation, // only if space is cyll
		}

		// tension between a pretty string and an easy to loop over state
		// closer they are, less to manage

		if ($gradient_type === 'linear') {
			if ($linear_named_angle) urlGradient.linear_named_angle = $linear_named_angle
			if ($linear_angle) urlGradient.linear_angle = $linear_angle
		}
		else if ($gradient_type === 'radial') {
			urlGradient.linear_angle = $linear_angle
		}
		else if ($gradient_type === 'conic') {
			urlGradient.linear_angle = $linear_angle
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
  		for (const stop of state[key])
  			hash.append(key, JSON.stringify(stop))
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
  		state[key] = state.getAll(key).map(JSON.parse)
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