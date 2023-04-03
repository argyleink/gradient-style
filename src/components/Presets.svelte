<script>
	import { tooltip } from 'svooltip'

	const presets = [
		{
			name: 'Wild Sunset',
			gradient: 'linear-gradient(to top right in oklab, oklch(60% .5 353), oklch(80% .5 325))',
			type: 'linear',
			angle_name: 'top right',
			space: 'oklab',
			stops: [
				{color: 'oklch(60% .5 353)'},
				{color: 'oklch(80% .5 325)'},
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
				{color: 'oklch(90% .3 200)'},
			],
		},
		{
			name: 'TieDye',
			gradient: 'radial-gradient(farthest-corner circle at 50% 113% in oklch, oklch(80% .3 34), oklch(90% .3 200))',
			type: 'radial',
			named_size: 'farthest-corner',
			shape: 'circle',
			position1: '50%',
			position2: '113%',
			space: 'oklch',
			stops: [
				{color: 'oklch(80% .3 34)'},
				{color: 'oklch(90% .3 200)'},
			],
		},
		{
			name: 'Midnight',
			gradient: 'radial-gradient(farthest-corner circle at top right in oklab, oklch(80% .4 222), oklch(35% .5 313))',
			type: 'radial',
			named_size: 'farthest-corner',
			shape: 'circle',
			position1: 'top',
			position2: 'right',
			space: 'oklab',
			stops: [
				{color: 'oklch(80% .4 222)'},
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
				{color: '#000', position1: '0%', position2: '20%'},
				{color: '#fff', position1: '0%', position2: '40%'},
				{color: '#000', position1: '0%', position2: '60%'},
				{color: '#fff', position1: '0%', position2: '80%'},
				{color: '#000', position1: '0%', position2: '100%'},
			],
		},
		{
			name: 'Honeycomb',
			gradient: 'linear-gradient(to bottom right in oklab, oklch(100% .5 109), oklch(72% .5 100))',
			type: 'linear',
			angle_name: 'top right',
			space: 'oklab',
			stops: [
				{color: 'oklch(60% .5 353)'},
				{color: 'oklch(80% .5 325)'},
			],
		},
		{
			name: 'Peaches',
			gradient: 'linear-gradient(to bottom left in oklab, oklch(55% .45 350), oklch(100% .4 95))',
			type: 'linear',
			angle_name: 'top right',
			space: 'oklab',
			stops: [
				{color: 'oklch(60% .5 353)'},
				{color: 'oklch(80% .5 325)'},
			],
		},
	]

	function presetClicked(preset) {
		console.log(preset)
	}
</script>

<section class="presets">
	<p class="sr-only">presets</p>
	<div class="scroller">
		<!-- <span class="spacer"></span> -->
		{#each presets as preset}
			<button class="preset" style="background: {preset.gradient};" use:tooltip={{content: preset.name}} on:click={()=>presetClicked(preset)}></button>
		{/each}
		<span class="spacer"></span>
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