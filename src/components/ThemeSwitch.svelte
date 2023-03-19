<script>
	import { tooltip } from 'svooltip'

	function toggle(e) {
		theme.value = theme.value === 'light'
	    ? 'dark'
	    : 'light'

	  setPreference()
	}
</script>

<button id="theme-toggle" use:tooltip={{content: "Switch theme"}} class="theme-toggle icon-button" use:tooltip={{content: "Switch theme"}} aria-label="auto" aria-live="polite" on:click={toggle}>
  <svg class="sun-and-moon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
    <mask class="moon" id="moon-mask">
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <circle cx="24" cy="10" r="6" fill="black" />
    </mask>
    <circle class="sun" cx="12" cy="12" r="6" mask="url(#moon-mask)" fill="currentColor" />
    <g class="sun-beams" stroke="currentColor">
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
     </g>
  </svg>
</button>

<style>
	.icon-button {
		--icon-fill: var(--surface-4);
    --icon-fill-hover: var(--text-1);
    --_bg: none;
    --_border: none;

		border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    padding: var(--size-2);
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
	}

	.sun-and-moon>:is(.moon,.sun) {
	    fill: var(--icon-fill)
	}

	.theme-toggle:is(:hover,:focus-visible)>.sun-and-moon>:is(.moon,.sun) {
	    fill: var(--icon-fill-hover)
	}

	.sun-and-moon>.sun-beams {
	    stroke: var(--icon-fill);
	    stroke-width: 2px
	}

	.theme-toggle:is(:hover,:focus-visible) .sun-and-moon>.sun-beams {
    stroke: var(--icon-fill-hover)
	}

	.sun, .sun-beams {
		transform-origin: center;
	}

	:global([data-theme=dark]) .sun-and-moon>.sun {
    transform: scale(1.75)
	}

	:global([data-theme=dark]) .sun-and-moon>.sun-beams {
    opacity: 0
	}

	:global([data-theme=dark]) .sun-and-moon>.moon>circle {
    transform: translate(-7px)
	}

	@supports (cx: 1) {
	    :global([data-theme=dark]) .sun-and-moon>.moon>circle {
	        transform: translate(0);
	        cx: 17
	    }
	}

	@media (prefers-reduced-motion: no-preference) {
	    .sun-and-moon>.sun {
	        transition: transform .5s var(--ease-elastic-3)
	    }

	    .sun-and-moon>.sun-beams {
	        transition: transform .5s var(--ease-elastic-4),opacity .5s var(--ease-3)
	    }

	    .sun-and-moon .moon>circle {
	        transition: transform .25s var(--ease-out-5)
	    }

	    @supports (cx: 1) {
	        .sun-and-moon .moon>circle {
	            transition: cx .25s var(--ease-out-5)
	        }
	    }

	    :global([data-theme=dark]) .sun-and-moon>.sun {
	        transform: scale(1.75);
	        transition-timing-function: var(--ease-3);
	        transition-duration: .25s
	    }

	    :global([data-theme=dark]) .sun-and-moon>.sun-beams {
	        transform: rotate(-25deg);
	        transition-duration: .15s
	    }

	    :global([data-theme=dark]) .sun-and-moon>.moon>circle {
	        transition-delay: .25s;
	        transition-duration: .5s
	    }
	}
</style>