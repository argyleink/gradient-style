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
			name: 'Wild Flower',
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
			name: 'Tri Dye',
			gradient: 'radial-gradient(farthest-corner circle at 50% 115% in oklch, oklch(80% .3 34), oklch(90% .3 200))',
			type: 'radial',
			named_size: 'farthest-corner',
			shape: 'circle',
			position1: 50,
			position2: 115,
			space: 'oklch',
			stops: [
				{color: 'oklch(80% .3 34)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(90% .3 200)'},
			],
		},
		{
			name: 'Peaches',
			gradient: 'linear-gradient(to bottom left in oklab, oklch(55% .45 350), oklch(95% .4 95))',
			type: 'linear',
			angle_name: 'bottom left',
			space: 'oklab',
			stops: [
				{color: 'oklch(55% .45 350)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(95% .4 95)'},
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
			name: 'Chlorophyll',
			gradient: 'conic-gradient(from 0deg at top left in oklch, oklch(75% 0.5 156), oklch(70% 0.5 261))',
			type: 'conic',
			space: 'oklch',
			angle: 0,
			named_position: 'top left',
			stops: [
				{color: 'oklch(75% 0.5 156)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(70% 0.5 261)'},
			],
		},
		{
			name: 'Honeycomb',
			gradient: 'linear-gradient(to bottom right in oklab, oklch(95% .5 110), oklch(72% .5 90))',
			type: 'linear',
			angle_name: 'bottom right',
			space: 'oklab',
			stops: [
				{color: 'oklch(95% .5 110)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(72% .5 90)'},
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
		{
			name: 'Mmm Pie',
			gradient: 'conic-gradient(from 0deg at center in oklch, oklch(77% 0.50 200), 26%, oklch(77% 0.50 230) 0%, 46%, oklch(77% 0.50 260) 0%, 59%, oklch(77% 0.50 280) 0%, 82%, oklch(77% 0.50 300) 0%)',
			type: 'conic',
			space: 'oklch',
			angle: 0,
			named_position: 'center',
			stops: [
				{color: 'oklch(77% 0.50 200)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '26'},
				{color: 'oklch(77% 0.50 230)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '46'},
				{color: 'oklch(77% 0.50 260)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '60'},
				{color: 'oklch(77% 0.50 280)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '82'},
				{color: 'oklch(77% 0.50 300)', position1: '0', position2: '0'},
			],
		},
		{
			name: 'Huey',
			gradient: 'conic-gradient(in oklch longer hue, oklch(70% .3 0), oklch(70% .3 0))',
			type: 'conic',
			space: 'oklch',
			interpolation: 'longer',
			angle: 0,
			named_position: 'center',
			stops: [
				{color: 'oklch(70% .3 0)', position1: null, position2: null},
				{kind: 'hint', auto: null, percentage: '50'},
				{color: 'oklch(70% .3 0)', position1: null, position2: null},
			],
		},
		{
			name: 'Solid Yo.',
			gradient: 'linear-gradient(in oklab, oklch(70% .3 0) 0 0)',
			type: 'linear',
			angle_name: 'right',
			space: 'oklab',
			stops: [
				{color: 'oklch(70% .3 0)'}
			],
		},
		{
			name: 'Soundwave',
			gradient: "radial-gradient(farthest-corner circle at top left in oklch, oklch(95% .25 160), 26%, oklch(75% 0.50 180) 0%, 46%, oklch(75% 0.50 210) 0%, 60%, oklch(75% 0.50 230) 0%, 82%, oklch(75% 0.50 260) 0%)",
			type: 'radial',
			named_size: 'farthest-corner',
			shape: 'circle',
			named_position: 'top left',
			space: 'oklch',
			stops: [
				{color: 'oklch(95% .25 160)', position1: null, position2: null},
				{kind: 'hint', auto: null, percentage: '26'},
				{color: 'oklch(75% .5 180)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '46'},
				{color: 'oklch(75% .5 210)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '60'},
				{color: 'oklch(75% .5 230)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '82'},
				{color: 'oklch(75% .5 260)', position1: '0', position2: '0'},
			],
		},
		{
			name: 'Palette',
			gradient: 'linear-gradient(to bottom in oklch, oklch(95% .2 5), 10%, oklch(95% .25 5) 0%, 26%, oklch(95% .3 5) 0%, 46%, oklch(95% .35 5) 0%, 72%, oklch(95% .4 5) 0%)',
			type: 'linear',
			angle_name: 'bottom',
			space: 'oklch',
			stops: [
				{color: 'oklch(95% .2 5)', position1: null, position2: null},
				{kind: 'hint', auto: null, percentage: '10'},
				{color: 'oklch(95% .25 5)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '26'},
				{color: 'oklch(95% .3 5)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '46'},
				{color: 'oklch(95% .35 5)', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '72'},
				{color: 'oklch(95% .4 5)', position1: '0', position2: '0'},
			],
		},
		{
			name: 'Sunburst',
			gradient: 'conic-gradient(from 0deg at bottom left in oklab, #fff, 2%, #f00 0%, 8%, #fff 0%, 13%, #f00 0%, 18%, #fff 0%, 21%, #f00 0%, 24%, #fff 0%)',
			type: 'conic',
			space: 'oklab',
			interpolation: 'longer',
			angle: 0,
			named_position: 'bottom left',
			stops: [
				{color: '#fff'},
				{kind: 'hint', auto: null, percentage: '2'},
				{color: '#f00', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '8'},
				{color: '#fff', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '13'},
				{color: '#f00', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '18'},
				{color: '#fff', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '21'},
				{color: '#f00', position1: '0', position2: '0'},
				{kind: 'hint', auto: null, percentage: '24'},
				{color: '#fff', position1: '0', position2: '0'},
			],
		},
		{
			name: 'LearnUI',
			gradient: 'linear-gradient(to right in lch, color(display-p3 25% 25% 100%), color(display-p3 100% 85% 30%))',
			type: 'linear',
			angle_name: 'right',
			space: 'lch',
			stops: [
				{color: 'color(display-p3 25% 25% 100%)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'color(display-p3 100% 85% 30%)'},
			],
		},
		{
			name: 'Neon Stripe',
			gradient: 'linear-gradient(to right in oklab, #0ff, #0ff 0% 12%, #111 0% 24%, #ff0 0% 36%, #111 0% 48%, #f0f 0% 60%, #111 0% 72%, #0ff 0% 84%, #111 0% 100%)',
			type: 'linear',
			angle_name: 'right',
			space: 'oklab',
			stops: [
				{color: '#0ff', position1: '0', position2: '12'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#111', position1: '0', position2: '24'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#ff0', position1: '0', position2: '36'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#111', position1: '0', position2: '48'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#f0f', position1: '0', position2: '60'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#111', position1: '0', position2: '72'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#0ff', position1: '0', position2: '84'},
				{kind: 'hint', auto: null, percentage: null},
				{color: '#111', position1: '0', position2: '100'},
			],
		},
		{
			name: 'Sunset Spotlight',
			gradient: 'radial-gradient(farthest-corner circle at 50% 85% in oklch, oklch(95% .15 75), oklch(70% .25 35))',
			type: 'radial',
			named_size: 'farthest-corner',
			shape: 'circle',
			position1: 50,
			position2: 85,
			space: 'oklch',
			stops: [
				{color: 'oklch(95% .15 75)'},
				{kind: 'hint', auto: null, percentage: null},
				{color: 'oklch(70% .25 35)'},
			],
		},
	]

	function presetClicked(preset) {
		$gradient_type = preset.type
		$gradient_space = preset.space

		if (preset.interpolation)
			$gradient_interpolation = preset.interpolation
		else
			$gradient_interpolation = 'shorter'

		const convertedStops = preset.stops.map(stop => {
			if (stop.kind !== 'hint') {
				return {
						kind: 'stop',
						color: stop.color,
						auto: null,
						position1: (stop.position1 ?? null),
						position2: (stop.position2 ?? null),
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
					$radial_named_position = '--'
					$radial_position.x = preset.position1
					$radial_position.y = preset.position2
				}

				if (preset.named_size) {
					$radial_size = preset.named_size
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
	<p>HD Examples</p>
	<div class="scroller">
		{#each presets as preset}
			<button class="preset" style="background: {preset.gradient};" use:tooltip={{content: preset.name}} onclick={()=>presetClicked(preset)}></button>
		{/each}
	</div>
</section>

<style>
	.presets {
		display: grid;
		gap: var(--size-2);
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding-block: var(--size-3);
		padding-inline: var(--size-5);
		scroll-padding-inline: var(--size-5);
		scrollbar-width: thin;
		border-block-start: 1px solid var(--surface-1);
	}

	@media (prefers-color-scheme: light) {
		.presets {
			border-block-start-color: var(--surface-4);
		}
	}

	.presets > p {
		font-size: var(--font-size-0);
		text-transform: uppercase;
		position: sticky;
		inline-size: max-content;
		inset-inline-start: 0;
	}

	.presets .preset {
		scroll-snap-align: start;
	}

	.scroller {
		display: flex;
		gap: var(--size-3);
	}

	.preset, .spacer {
		flex: 0 0 auto;
		--_item-size: var(--size-7);
		inline-size: var(--_item-size);
		block-size: var(--_item-size);
		padding: 0;
		border: none;
		border-radius: var(--radius-round);
	}
</style>
