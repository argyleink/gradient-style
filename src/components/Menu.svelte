<script>
	/*popupButtons.on('keyup', e => {
	  if (e.code === 'Escape')
	    e.target.blur()
	})

	popupButtons.on('focusin', e => {
	  e.currentTarget.setAttribute('aria-expanded', true)
	})

	popupButtons.on('focusout', e => {
	  e.currentTarget.setAttribute('aria-expanded', false)
	})*/
</script>

<!-- <button class="menu-button-toggle" aria-haspopup="true" aria-expanded="false" title="Open for more actions">
  <svg aria-hidden="true" viewBox="0 0 20 20">
    <path fill="currentColor" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
  </svg> -->
<ul class="menu">
  <li><button class="menu-button">
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path stroke="currentColor" fill="none" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    Checkout
  </button></li>
  <li><button class="menu-button">
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path stroke="currentColor" fill="none" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
    Quick Pay
  </button></li>
  <li><button class="menu-button">
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path stroke="currentColor" fill="none" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
    Save for later
  </button></li>
</ul>
<!-- </button> -->

<style>
	.menu-button-toggle {
		position: relative;
		z-index: var(--layer-1);
	}

	.menu {
    opacity: 0;
    pointer-events: none;
    list-style-type: none;
    position: absolute;
    overflow: hidden;
    inline-size: max-content;
    inset-block-start: -200%;
    inset-inline-end: 0;

    background: var(--surface-3);
    color: var(--text-2);
    padding-inline: 0;
    padding-block: var(--size-2);
    border-radius: var(--radius-2);
    display: flex;
    flex-direction: column;
    transition: opacity .2s var(--ease-3);
    box-shadow: var(--shadow-6)
	}

	.menu > li {
		display: flex;
		padding: 0;
	}

	.menu-button-toggle:active {
    background: var(--surface-2)
	}

	.menu-button-toggle:focus-within > svg {
    transition-duration: .3s;
    transform: rotateZ( .5turn)
	}

	:global(button:has(.menu):focus-within) > .menu {
    transition-duration: .3s;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto
	}

	.menu-button {
		box-shadow: none;
		inline-size: 100%;
		display: grid;
		grid-template-columns: auto 1fr;
    justify-items: start;
    font-size: var(--font-size-0);
	}

	.menu-button:is(:hover, :focus-visible) {
		background: var(--surface-2);
	}

	@media (prefers-reduced-motion: no-preference) {
    .menu-button-toggle > svg {
      transition: transform .2s var(--ease-3)
    }

    .menu-button-toggle > .menu {
      transform: translateY(5px);
      transition: 
      	opacity .2s var(--ease-3),
      	transform .2s var(--ease-3);
    }
	}
</style>