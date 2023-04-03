<script>
	import { tooltip } from 'svooltip'

	import {gradient_type, gradient_space, gradient_interpolation, 
	        gradient_stops, gradient_positions
	} from '../store/gradient.ts'
	import {linear_named_angle, linear_angle
	} from '../store/linear.ts'
	import {radial_shape, radial_position, radial_named_position, radial_size
	} from '../store/radial.ts'
	import {conic_angle, conic_position, conic_named_position
	} from '../store/conic.ts'
	import {updateStops} from '../utils/stops.ts'

	const presets = [
		{
			name: 'Wild Sunset',
			gradient: 'linear-gradient(to top right in oklab, oklch(60% .5 353), oklch(80% .5 325))',
			type: 'linear',
			angle_name: 'top right',
			space: 'oklab',
			stops: [
				{color: 'oklch(60% .5 353)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(80% .5 325)'},
			],
		},
		{
			name: 'TieDye',
			gradient: 'radial-gradient(farthest-corner circle at 50% 113% in oklch, oklch(80% .3 34), oklch(90% .3 200))',
			type: 'radial',
			named_size: 'farthest-corner',
			shape: 'circle',
			position1: '50',
			position2: '113',
			space: 'oklch',
			stops: [
				{color: 'oklch(80% .3 34)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(90% .3 200)'},
			],
		},
		{
			name: 'Chlorophyll',
			gradient: 'conic-gradient(from 0deg at top left in oklch, oklch(75% 0.5 156), oklch(70% 0.5 261))',
			type: 'conic',
			space: 'oklch',
			angle: 0,
			named_position: 'top left',
			stops: [
				{color: 'oklch(75% 0.5 156)'},
				{kind: 'hint', auto: '50', percentage: '65'},
				{color: 'oklch(70% 0.5 261)'},
			],
		},
		{
			name: 'Midnight',
			gradient: 'radial-gradient(farthest-corner circle at top right in oklab, oklch(80% .4 222), oklch(35% .5 313))',
			type: 'radial',
			named_size: 'farthest-corner',
			shape: 'circle',
			named_position: 'top right',
			space: 'oklab',
			stops: [
				{color: 'oklch(80% .4 222)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(35% .5 313)'},
			],
		},
		{
			name: 'Stripes',
			gradient: 'linear-gradient(to top right in oklab, #fff, #000 0% 20%, #fff 0% 40%, #000 0% 60%, #fff 0% 80%, #000 0% 100%)',
			type: 'linear',
			angle_name: 'top right',
			space: 'oklab',
			stops: [
				{color: '#fff'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#000', position1: '0', position2: '20'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#fff', position1: '0', position2: '40'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#000', position1: '0', position2: '60'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#fff', position1: '0', position2: '80'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#000', position1: '0', position2: '100'},
			],
		},
		{
			name: 'Honeycomb',
			gradient: 'linear-gradient(to bottom right in oklab, oklch(100% .5 109), oklch(72% .5 100))',
			type: 'linear',
			angle_name: 'bottom right',
			space: 'oklab',
			stops: [
				{color: 'oklch(100% .5 109)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(72% .5 100)'},
			],
		},
		{
			name: 'Peaches',
			gradient: 'linear-gradient(to bottom left in oklab, oklch(55% .45 350), oklch(100% .4 95))',
			type: 'linear',
			angle_name: 'bottom left',
			space: 'oklab',
			stops: [
				{color: 'oklch(55% .45 350)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(100% .4 95)'},
			],
		},
		{
			name: 'Blue Razzberry',
			gradient: 'linear-gradient(to bottom right in oklch, oklch(70% .5 340), oklch(90% .3 200))',
			type: 'linear',
			angle_name: 'bottom right',
			space: 'oklch',
			stops: [
				{color: 'oklch(70% .5 340)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(90% .3 200)'},
			],
		},
	]

	function presetClicked(preset) {
		$gradient_type = preset.type
		$gradient_space = preset.space

		if (preset.interpolation) 
			$gradient_interpolation = preset.interpolation

		const convertedStops = preset.stops.map(stop => {
			if (stop.kind !== 'hint') {
				return {
						kind: 'stop', 
						color: stop.color, 
						auto: null, 
						position1: stop.position1 || null, 
						position2: stop.position2 || null,
				}
			}
			else return stop
		})
		$gradient_stops = updateStops(convertedStops)

		switch (preset.type) {
			case 'linear':
				if (preset.angle_name) {
					$linear_named_angle = 'to ' + preset.angle_name
				}
				else
					$linear_angle = 'to ' + preset.angle
				break
			case 'radial':
				if (preset.named_position) {
					$radial_named_position = preset.named_position
					$radial_position.x = null
					$radial_position.y = null
				}
				else {
					$radial_position.x = preset.position1
					$radial_position.y = preset.position2
				}
				break
			case 'conic':
				if (preset.named_position) {
					$conic_named_position = preset.named_position
					$conic_position.x = null
					$conic_position.y = null
				}
				else {
					$conic_position.x = preset.position1
					$conic_position.y = preset.position2
				}
				break
		}
	}
</script>

<section class="presets">
	<p class="sr-only">presets</p>
	<div class="scroller">
		{#each presets as preset}
			<button class="preset" style="background: {preset.gradient};" use:tooltip={{content: preset.name}} on:click={()=>presetClicked(preset)}></button>
		{/each}
	</div>
</section>

<style>
	.presets {
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding-block: var(--size-3);
		padding-inline: var(--size-5);
		scroll-padding-inline: var(--size-5);
	}

	.presets .preset {
		scroll-snap-align: start;
	}

	.scroller {
		display: flex;
		gap: var(--size-3);
	}

	.scroller::after {
		content: '';
		flex-shrink: 0;
		inline-size: var(--size-1);
	}

	.preset, .spacer {
		flex: 1 0 auto;
		--_item-size: var(--size-7);
		inline-size: var(--_item-size);
		block-size: var(--_item-size);
		padding: 0;
		border: none;
		border-radius: var(--radius-round);
	}
</style>