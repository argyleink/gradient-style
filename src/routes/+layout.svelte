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
	@import 'prism-themes/themes/prism-nord.css';

	.app {
		display: grid;
		gap: var(--size-1);
	}

	:global(:root) {
		--svooltip-bg: var(--gray-10);
		--svooltip-text: var(--text-1);
		--svooltip-text-size: var(--font-size-0);
		--svooltip-shadow: var(--shadow-2);
		--svooltip-arrow-size: 6px;
	}

	@media (prefers-color-scheme: light) {
		:global(:root) {
			--svooltip-bg: white;
			--svooltip-shadow: var(--shadow-5);
		}
	}

	:global(.rich-tooltip) {
		display: inline-block;
		max-inline-size: var(--size-content-1);
	}

	:global(.rich-tooltip.wide) {
		max-inline-size: var(--size-content-2);
	}

	:global(.rich-tooltip p) {
		color: var(--text-2);
	}
</style>