<script>
import {gradient_type} from '../store/gradient.ts'

const gradient_types = ['linear','radial','conic']  
</script>

<fieldset class="inline-switches">
  {#each gradient_types as t}
    <div class="radio-pair">
      <input type="radio" name="gradient-type" id="{t}-gradient" value={t} bind:group={$gradient_type}>
      <label for="{t}-gradient">{t}</label>
    </div>
  {/each}
</fieldset>

<style>
  .inline-switches {
    display: flex;
    border: none;
    padding: 0;
    gap: var(--size-2);
  }
</style>