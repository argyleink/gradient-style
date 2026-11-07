<script>
	import { onMount, tick } from 'svelte'
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
	import {custom_presets, initCustomPresets, saveCurrentAsPreset, deleteCustomPreset,
	        applyCustomPreset, presetCss, presetLabel
	} from '../store/customPresets.ts'

	let savedRow = $state()
	let saveBtn = $state()
	let flashId = $state(null)
	let flashKind = $state('')
	let announcement = $state('')
	let flashTimer

	onMount(() => initCustomPresets())

	function announce(msg) {
		announcement = ''
		queueMicrotask(() => announcement = msg)
	}

	function flash(id, kind) {
		clearTimeout(flashTimer)
		flashId = null
		// re-trigger the animation when the same swatch flashes twice in a row
		requestAnimationFrame(() => {
			flashId = id
			flashKind = kind
			flashTimer = setTimeout(() => flashId = null, 1200)
		})
	}

	async function saveCurrent() {
		const result = saveCurrentAsPreset()
		if (!result) return
		const { preset, duplicate } = result
		announce(duplicate ? 'This gradient is already saved' : 'Gradient saved')
		flash(preset.id, duplicate ? 'duplicate' : 'added')
		await tick()
		savedRow?.querySelector(`[data-preset-id="${preset.id}"]`)
			?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
	}

	async function removePreset(preset) {
		const list = $custom_presets
		const i = list.findIndex(p => p.id === preset.id)
		deleteCustomPreset(preset.id)
		announce('Saved gradient removed')
		await tick()
		// keep keyboard users in the row: next swatch, else previous, else the save button
		const swatches = savedRow?.querySelectorAll('.custom > .preset')
		const next = swatches?.[Math.min(i, swatches.length - 1)] ?? saveBtn
		next?.focus()
	}

	function onSwatchKeydown(e, preset) {
		if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault()
			removePreset(preset)
		}
	}

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
				else {
					$linear_named_angle = '--'
					$linear_angle = String(preset.angle ?? 180)
				}
				break
			case 'radial':
				if (preset.shape) {
					$radial_shape = preset.shape
				}
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
				$conic_angle = String(preset.angle ?? 0)
				if (preset.named_position) {
					$conic_named_position = preset.named_position
					$conic_position.x = null
					$conic_position.y = null
				}
				else {
					$conic_named_position = '--'
					$conic_position.x = preset.position1
					$conic_position.y = preset.position2
				}
				break
		}
	}
</script>

<section class="presets">
	<div class="row" bind:this={savedRow}>
		<p id="saved-presets-label">Saved</p>
		<div class="scroller" role="group" aria-labelledby="saved-presets-label">
			<button bind:this={saveBtn} class="preset save" aria-label="Save this gradient" onclick={saveCurrent} use:tooltip={{content: 'Save this gradient'}}>
				<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M12 5v14M5 12h14"/></svg>
			</button>
			{#each $custom_presets as preset, i (preset.id)}
				{@const css = presetCss(preset)}
				{@const label = `Saved gradient ${i + 1}: ${presetLabel(preset)}`}
				<div class="custom" data-preset-id={preset.id} data-flash={flashId === preset.id ? flashKind : null}>
					<button
						class="preset"
						style="background: {css.classic}; background: {css.modern};"
						aria-label={label}
						aria-keyshortcuts="Delete"
						use:tooltip={{content: presetLabel(preset)}}
						onclick={() => applyCustomPreset(preset)}
						onkeydown={(e) => onSwatchKeydown(e, preset)}
					></button>
					<button class="remove" tabindex="-1" aria-label="Remove saved gradient {i + 1}" onclick={() => removePreset(preset)}>
						<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="3" d="M7 7l10 10M17 7 7 17"/></svg>
					</button>
				</div>
			{/each}
		</div>
		<span class="visually-hidden" aria-live="polite">{announcement}</span>
	</div>
	<div class="row">
		<p>HD Examples</p>
		<div class="scroller">
			{#each presets as preset}
				<button class="preset" style="background: {preset.gradient};" aria-label={preset.name} use:tooltip={{content: preset.name}} onclick={()=>presetClicked(preset)}></button>
			{/each}
		</div>
	</div>
</section>

<style>
	.presets {
		display: grid;
		border-block-start: 1px solid var(--surface-1);
	}

	@media (prefers-color-scheme: light) {
		.presets {
			border-block-start-color: var(--surface-4);
		}
	}

	.row {
		display: grid;
		gap: var(--size-2);
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding-block: var(--size-3);
		padding-inline: var(--size-5);
		scroll-padding-inline: var(--size-5);
		scrollbar-width: thin;
	}

	.row + .row {
		padding-block-start: 0;
	}

	.row > p {
		font-size: var(--font-size-0);
		text-transform: uppercase;
		position: sticky;
		inline-size: max-content;
		inset-inline-start: 0;
	}

	.row .preset {
		scroll-snap-align: start;
	}

	.scroller {
		display: flex;
		gap: var(--size-3);
		/* room for the remove badges that poke out of the swatches */
		padding-block-start: var(--size-1);
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

	.preset.save {
		display: grid;
		place-items: center;
		background: transparent;
		color: var(--text-2);
		border: 2px dashed var(--surface-4);
	}

	.preset.save:is(:hover, :focus-visible) {
		color: var(--text-1);
		border-color: var(--text-2);
	}

	.preset.save > svg {
		inline-size: var(--size-4);
		block-size: var(--size-4);
	}

	.custom {
		position: relative;
		flex: 0 0 auto;
		display: grid;
		scroll-snap-align: start;
	}

	.remove {
		position: absolute;
		inset-block-start: calc(var(--size-1) * -1);
		inset-inline-end: calc(var(--size-1) * -1);
		inline-size: var(--size-4);
		block-size: var(--size-4);
		padding: 0;
		border: none;
		border-radius: var(--radius-round);
		display: grid;
		place-items: center;
		color: var(--text-1);
		background: var(--surface-1);
		box-shadow: 0 0 0 1px var(--surface-4), var(--shadow-2);
	}

	.remove > svg {
		inline-size: 10px;
		block-size: 10px;
	}

	.remove:is(:hover, :focus-visible) {
		color: var(--surface-1);
		background: var(--text-1);
	}

	/* pointer devices reveal remove on hover/focus; touch always shows it */
	@media (hover: hover) {
		.custom:not(:hover, :focus-within) > .remove {
			opacity: 0;
			scale: .5;
			pointer-events: none;
		}
	}

	.custom[data-flash] > .preset {
		outline: 2px solid var(--text-1);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: no-preference) {
		.remove {
			transition: opacity .15s var(--ease-3), scale .15s var(--ease-3);
		}

		.custom[data-flash="added"] > .preset {
			animation: pop-in .4s var(--ease-spring-3, var(--ease-3));
		}

		.custom[data-flash="duplicate"] > .preset {
			animation: nudge .4s var(--ease-3);
		}
	}

	@keyframes pop-in {
		from { scale: .4; opacity: 0; }
	}

	@keyframes nudge {
		25% { translate: -3px 0; }
		75% { translate: 3px 0; }
	}

	.visually-hidden {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
