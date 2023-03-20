import {derived} from 'svelte/store'

import {gradient_type, gradient_space, gradient_interpolation, 
        gradient_stops
} from '../store/gradient.ts'
import {linear_angle, linear_named_angle} from '../store/linear.ts'

export const stateAsString = derived(
	[
		gradient_type, gradient_space, gradient_stops,
		linear_angle, 
	],
	([
		$gradient_type, $gradient_space, $gradient_stops,
		$linear_angle, 
	]) => {
		return serializeUrl({
			type: $gradient_type,
			space: $gradient_space,
			linear_angle: $linear_angle,
			stops: $gradient_stops,
		})
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

  // window.location.hash = hash
  window?.history?.replaceState({}, "", '#'+hash.toString())
  return hash.toString()
}

export function deserializeUrl(hash) {
	let state = new URLSearchParams(hash)

  for (const [key, value] of state.entries()) {
  	if (key == 'stops')
  		state[key] = state.getAll(key).map(JSON.parse)
  	else
	    state[key] = value
  }

  return state
}