<script>
	import Header from '../components/Header.svelte';
	import './styles.css';
</script>

<div class="app">
	<Header />
	<slot />
	<!-- todo footer -->
</div>

<style>
	.app {
		display: grid;
		gap: var(--size-1);
		grid-template-rows: auto 1fr;
		block-size: 100vh;
		block-size: 100dvh;
	}
</style>