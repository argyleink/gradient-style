<script>
import {gradient_type} from '../store'

const gradient_types = ['linear','radial','conic']  
</script>

<fieldset>
  <legend>Type</legend>
  {#each gradient_types as t}
    <div class="radio-pair">
      <input type="radio" name="gradient-type" id="{t}-gradient" value={t} bind:group={$gradient_type}>
      <label for="{t}-gradient">{t}</label>
    </div>
  {/each}
</fieldset>