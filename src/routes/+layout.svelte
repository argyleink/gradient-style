<script>
	import "prismjs"
	import "../utils/prism-css.js"
</script>

<div class="app">
	<slot />
</div>

<style>
	@import 'open-props/style';
	@import 'open-props/normalize';
	@import 'open-props/buttons';
	@import 'prism-themes/themes/prism-dracula.css';

	.app {
		display: grid;
		gap: var(--size-1);
		block-size: 100vh;
		block-size: 100dvh;
	}
</style>