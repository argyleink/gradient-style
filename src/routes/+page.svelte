<script>
	import Gradient from '../components/Gradient.svelte';
</script>

<svelte:head>
	<title>CSS HD Gradients</title>
	<meta name="description" content="Color 4 complaint CSS gradient builder." />
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
