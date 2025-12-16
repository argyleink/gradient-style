<script>
	import { onMount } from 'svelte';
	import "prismjs"
	import "../utils/prism-css.js"
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	onMount(() => {
		/**
		 * Pointer-based proximity glow for buttons, selects and .stop components.
		 * Extends detection beyond the element bounds so near-edge hover still shines.
		 */
		const SELECTOR = 'button, select, .stop';
		const SEARCH_RADIUS = 96; // px beyond the element bounds
		let activeEl = /** @type {HTMLElement | null} */ (null);
		const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

		function updateProximity(event) {
			const { clientX, clientY } = event;
			const nodes = document.querySelectorAll(SELECTOR);

			let closest = null;
			let closestDist = Infinity;
			let closestRect = null;
			let clampedX = 0;
			let clampedY = 0;

			nodes.forEach((el) => {
				const rect = el.getBoundingClientRect();
				const cx = Math.min(Math.max(clientX, rect.left), rect.right);
				const cy = Math.min(Math.max(clientY, rect.top), rect.bottom);
				const dx = clientX - cx;
				const dy = clientY - cy;
				const dist = Math.hypot(dx, dy);

				if (dist < closestDist && dist <= SEARCH_RADIUS) {
					closest = el;
					closestDist = dist;
					closestRect = rect;
					clampedX = cx;
					clampedY = cy;
				}
			});

			// Nothing nearby: fade out any previous active element.
			if (!closest || !closestRect) {
				if (activeEl) {
					activeEl.style.setProperty('--gs-pointer-opacity', '0');
					activeEl = null;
				}
				return;
			}

			// If switching targets, fade the previous one.
			if (activeEl && activeEl !== closest) {
				activeEl.style.setProperty('--gs-pointer-opacity', '0');
			}
			activeEl = closest;

			const localX = clampedX - closestRect.left;
			const localY = clampedY - closestRect.top;

			const falloff = 1 - Math.min(closestDist / SEARCH_RADIUS, 1);
			const baseOpacity = 0.12 + 0.60 * falloff;
			const opacity = baseOpacity * (darkQuery.matches ? 0.5 : 1);

			closest.style.setProperty('--gs-pointer-x', `${localX}px`);
			closest.style.setProperty('--gs-pointer-y', `${localY}px`);
			closest.style.setProperty('--gs-pointer-opacity', opacity.toFixed(3));
		}

		function resetProximity() {
			if (activeEl) {
				activeEl.style.setProperty('--gs-pointer-opacity', '0');
				activeEl = null;
			}
		}

		window.addEventListener('pointermove', updateProximity, { passive: true });
		window.addEventListener('pointerleave', resetProximity, { passive: true });

		return () => {
			window.removeEventListener('pointermove', updateProximity);
			window.removeEventListener('pointerleave', resetProximity);
		};
	});
</script>

<div class="app">
	{@render children?.()}
</div>

<style>
	@import 'open-props/style';
	@import 'open-props/normalize';
	@import 'open-props/buttons';
	@import 'prism-themes/themes/prism-night-owl.css';

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

	:global(.rich-tooltip > b:first-of-type) {
		display: inline-block;
		margin-block-end: var(--size-1);
	}

	:global(.rich-tooltip p) {
		color: var(--text-2);
	}

	/* ---------------------------------------------
	 * Proximity-aware gradient border shine
	 * ------------------------------------------ */

	:global(button),
	:global(select),
	:global(.stop) {
		position: relative;
		isolation: isolate;
		/* Default glow color pulls from the active gradient accent when available */
		--gs-glow-color: var(--gs-glow-color, var(--link));
		--gs-pointer-x: 50%;
		--gs-pointer-y: 0%;
		--gs-pointer-opacity: 0;
	}

	:global(button)::before,
	:global(select)::before,
	:global(.stop)::before {
		content: "";
		position: absolute;
		inset: -1px;
		border-radius: inherit;
		pointer-events: none;
		z-index: -1;
		background:
			radial-gradient(
				160px circle at var(--gs-pointer-x) var(--gs-pointer-y),
				color-mix(in oklch, var(--gs-glow-color) 92%, transparent) 0%,
				color-mix(in oklch, var(--gs-glow-color) 70%, transparent) 35%,
				transparent 70%
			);
		opacity: var(--gs-pointer-opacity);
		filter: blur(10px);
		mix-blend-mode: screen;
		transition:
			opacity 160ms var(--ease-3),
			transform 160ms var(--ease-3);
	}
</style>