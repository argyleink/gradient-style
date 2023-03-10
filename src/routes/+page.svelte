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
		overflow: hidden;
		overscroll-behavior: none;
	}
</style>
