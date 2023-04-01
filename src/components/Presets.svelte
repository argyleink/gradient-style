<script>
	const presets = [
		'linear-gradient(46deg in oklab, oklch(60% 0.5 353), oklch(80% 0.50 325))',
		'linear-gradient(to bottom right in oklch, oklch(70% 0.5 340), oklch(90% 0.3 200))',
		'radial-gradient(farthest-corner circle at 50% 113% in oklch, oklch(80% 0.3 34), oklch(90% 0.3 200))',
		'radial-gradient(farthest-corner circle at top right in oklab, oklch(80% 0.4 222), oklch(35% 0.5 313))',
		'linear-gradient(to top right in oklab, #fff, #000 0% 20%, #fff 0% 40%, #000 0% 60%, #fff 0% 80%, #000 0% 100%)',
		'linear-gradient(46deg in oklab, oklch(60% 0.5 353), oklch(80% 0.50 325))',
		'linear-gradient(46deg in oklab, oklch(60% 0.5 353), oklch(80% 0.50 325))',
	]
</script>

<section class="presets">
	<p class="sr-only">presets</p>
	<div class="scroller">
		{#each presets as preset}
			<button class="preset" style="background: {preset};"></button>
		{/each}
	</div>
</section>

<style>
	.presets {
		overflow-x: auto;
		padding-block: var(--size-3);
		padding-inline: var(--size-5);
	}

	.scroller {
		display: flex;
		gap: var(--size-3);
	}

	.preset {
		flex: 1 0 auto;
		--_item-size: var(--size-7);
		inline-size: var(--_item-size);
		block-size: var(--_item-size);
		padding: 0;
		border: none;
		border-radius: var(--radius-round);
	}
</style>