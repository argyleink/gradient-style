<script>
	import { tooltip } from 'svooltip'

	const presets = [
		{
			name: 'Wild Sunset',
			gradient: 'linear-gradient(46deg in oklab, oklch(60% 0.5 353), oklch(80% 0.50 325))',
		},
		{
			name: 'Blue Razzberry',
			gradient: 'linear-gradient(to bottom right in oklch, oklch(70% 0.5 340), oklch(90% 0.3 200))',
		},
		{
			name: 'TieDye',
			gradient: 'radial-gradient(farthest-corner circle at 50% 113% in oklch, oklch(80% 0.3 34), oklch(90% 0.3 200))',
		},
		{
			name: 'Midnight',
			gradient: 'radial-gradient(farthest-corner circle at top right in oklab, oklch(80% 0.4 222), oklch(35% 0.5 313))',
		},
		{
			name: 'Stripes',
			gradient: 'linear-gradient(to top right in oklab, #fff, #000 0% 20%, #fff 0% 40%, #000 0% 60%, #fff 0% 80%, #000 0% 100%)',
		},
		{
			name: 'Honeycomb',
			gradient: 'linear-gradient(to bottom right in oklab, oklch(100% 0.50 109), oklch(72% 0.50 100))',
		},
		{
			name: 'Peaches',
			gradient: 'linear-gradient(to bottom left in oklab, oklch(55% 0.44 350), oklch(100% 0.41 95))',
		},
	]
</script>

<section class="presets">
	<p class="sr-only">presets</p>
	<div class="scroller">
		<span class="spacer"></span>
		{#each presets as preset}
			<button class="preset" style="background: {preset.gradient};" use:tooltip={{content: preset.name}}></button>
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