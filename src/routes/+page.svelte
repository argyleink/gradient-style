<script>
	import Gradient from '../components/Gradient.svelte';
</script>

<svelte:head>
	<title>CSS HDR Gradients</title>
	<meta name="description" content="Wide gamut Color 4 compliant CSS gradient builder." />
	<meta id="browsertheme" name="theme-color" content="#ff00ff">
</svelte:head>

<Gradient />

<style>
	:global(body) {
		display: grid;
	}

	:global(html) {
		overscroll-behavior: none;
	}

	@media (min-width: 1024px) {
		:global(html) {
			overflow: hidden;
		}
	}
</style>
