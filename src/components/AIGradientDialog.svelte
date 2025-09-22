<script>
  import { onMount } from 'svelte';
  import * as z from 'zod';
  import { gradient_type, gradient_space, gradient_stops } from '../store/gradient';
  import { linear_angle, linear_named_angle } from '../store/linear';
  import { radial_shape, radial_position, radial_named_position } from '../store/radial';
  import { conic_angle, conic_position, conic_named_position } from '../store/conic';
  
  /** @type {HTMLDialogElement | null} */
  let dialog = null;
  let userPrompt = '';
  let loading = false;
  let error = '';
  /** @type {any} */
  let session = null;
  let modelAvailable = false;
  /** @type {'unknown' | 'unavailable' | 'downloadable' | 'downloading' | 'available'} */
  let availability = 'unknown';
  
  // Zod Schema for gradient data
  const gradientZodSchema = z.object({
    gradient_type: z.enum(["linear", "radial", "conic"]),
    gradient_space: z.enum([
      "srgb", "srgb-linear", "lab", "oklab", "xyz", "xyz-d50", "xyz-d65", 
      "hsl", "hwb", "lch", "oklch", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"
    ]),
    gradient_stops: z.array(z.object({
      color: z.string(),
      position: z.number().min(0).max(100)
    })).min(2),
    // Linear gradient specific
    linear_angle: z.number().optional(),
    // Radial gradient specific
    radial_shape: z.enum(["circle", "ellipse"]).optional(),
    radial_position: z.object({
      x: z.number().min(0).max(100).optional(),
      y: z.number().min(0).max(100).optional()
    }).optional(),
    // Conic gradient specific
    conic_angle: z.number().optional(),
    conic_position: z.object({
      x: z.number().min(0).max(100).optional(),
      y: z.number().min(0).max(100).optional()
    }).optional()
  });

  // Convert Zod schema to JSON Schema for AI model
  const gradientSchema = z.toJSONSchema(gradientZodSchema);
  
  onMount(async () => {
    // Check if the Prompt API is available
    // @ts-ignore - LanguageModel is a new Chrome API
    if ('LanguageModel' in window) {
      try {
        // @ts-ignore - LanguageModel is a new Chrome API
        const avail = await window.LanguageModel.availability();
        console.log('AI Model availability:', avail);
        availability = /** @type {any} */ (avail);
        modelAvailable = avail !== 'unavailable';
      } catch (err) {
        console.error('Error checking AI availability:', err);
        error = 'Failed to check AI availability. Make sure you are using Chrome 138+ with the Prompt API enabled.';
      }
    } else {
      error = 'The Prompt API is not available in your browser. Please use Chrome 138+ and enable the API.';
    }
  });
  
  export function open() {
    if (dialog) {
      dialog.showModal();
      userPrompt = '';
      error = '';
    }
  }
  
  function close() {
    if (dialog) {
      dialog.close();
    }
  }
  
  async function ensureSession() {
    if (session) return;
    // @ts-ignore - LanguageModel is a new Chrome API
    if (!('LanguageModel' in window)) {
      throw new Error('The Prompt API is not available in your browser. Please use Chrome 138+ and enable the API.');
    }
    try {
      // @ts-ignore - LanguageModel is a new Chrome API
      const avail = availability === 'unknown' ? await window.LanguageModel.availability() : availability;
      availability = /** @type {any} */ (avail);
      if (avail === 'unavailable') {
        throw new Error('AI model is not available. Please check Chrome settings and hardware requirements.');
      }
      if (avail === 'downloadable' || avail === 'downloading') {
        loading = true;
        error = 'Preparing AI model...';
        // @ts-ignore - LanguageModel is a new Chrome API
        session = await window.LanguageModel.create({
          monitor(m) {
            m.addEventListener('downloadprogress', (/** @type {any} */ e) => {
              const progress = Math.round(e.loaded * 100);
              error = `Downloading AI model: ${progress}%`;
            });
          }
        });
        error = '';
        loading = false;
      } else {
        // available
        loading = true;
        // @ts-ignore - LanguageModel is a new Chrome API
        session = await window.LanguageModel.create();
        loading = false;
      }
    } catch (err) {
      console.error('Error preparing AI model:', err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
  
  async function generateGradient() {
    if (!userPrompt.trim()) return;
    
    loading = true;
    error = '';
    
    try {
      // Lazily create session on first use (user gesture), including downloads
      await ensureSession();
      
      // Create a detailed prompt for the AI
      const systemPrompt = `You are a CSS gradient generator. Convert the user's description into gradient data.
      
      Guidelines:
      - For color descriptions like \"sunset\", \"ocean\", \"forest\" use appropriate colors
      - Default to linear gradients unless the user specifies radial or conic
      - Use modern color spaces like oklch for vibrant gradients when appropriate
      - Position stops evenly if not specified
      - For linear gradients, interpret directions like \"left to right\" as angle 90, \"top to bottom\" as 180
      - For radial gradients, default to ellipse shape centered
      - Return valid CSS color values (hex, rgb, hsl, oklch, etc.)
      
      User request: ${userPrompt}`;
      
      // Use the Prompt API with structured output
      const result = await session.prompt(systemPrompt, {
        responseConstraint: gradientSchema
      });
      
      // Parse the JSON response
      const gradientData = JSON.parse(result);
      // console.log('Generated gradient data:', gradientData);
      
      // Update stores directly with the AI-generated gradient data
      
      // Update gradient type
      if (gradientData.gradient_type) {
        gradient_type.set(gradientData.gradient_type);
      }
      
      // Update gradient space  
      if (gradientData.gradient_space) {
        gradient_space.set(gradientData.gradient_space);
      }
      
      // Update gradient stops
      if (gradientData.gradient_stops && Array.isArray(gradientData.gradient_stops)) {
        // Import Color for color conversion
        const Color = (await import('colorjs.io')).default;
        
        // Ensure stops have proper structure and convert colors to OKLCH
        const formattedStops = gradientData.gradient_stops.map((/** @type {any} */ stop) => {
          let oklchColor;
          try {
            // Convert any color format to OKLCH
            const color = new Color(stop.color);
            oklchColor = color.to('oklch').toString();
          } catch (err) {
            console.warn('Failed to convert color to OKLCH:', stop.color, err);
            // Fallback to a default OKLCH color if conversion fails
            oklchColor = 'oklch(70% 0.15 180)'; // Default blue-ish color
          }
          
          return {
            color: oklchColor,
            position1: stop.position,
            position2: stop.position,
            kind: 'stop'
          };
        });
        gradient_stops.set(formattedStops);
      }
    
      // Handle linear gradient properties
      if (gradientData.gradient_type === 'linear' && gradientData.linear_angle !== undefined) {
        linear_angle.set(String(gradientData.linear_angle));
        linear_named_angle.set('--'); // Set to custom angle indicator
      }
      
      // Handle radial gradient properties
      if (gradientData.gradient_type === 'radial') {
        if (gradientData.radial_shape) {
          radial_shape.set(gradientData.radial_shape);
        }
        if (gradientData.radial_position) {
          radial_position.set(gradientData.radial_position);
          radial_named_position.set('--'); // Set to custom position indicator
        } else {
          // Default to center if no position specified
          radial_named_position.set('center');
          radial_position.set({x: null, y: null});
        }
      }
      
      // Handle conic gradient properties
      if (gradientData.gradient_type === 'conic') {
        if (gradientData.conic_angle !== undefined) {
          conic_angle.set(String(gradientData.conic_angle));
        }
        if (gradientData.conic_position) {
          conic_position.set(gradientData.conic_position);
          conic_named_position.set('--'); // Set to custom position indicator
        } else {
          // Default to center if no position specified
          conic_named_position.set('center');
          conic_position.set({x: null, y: null});
        }
      }
      
      close();
    } catch (err) {
      console.error('Error generating gradient:', err);
      error = `Failed to generate gradient: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      loading = false;
    }
  }
  
  function handleKeydown(/** @type {KeyboardEvent} */ e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateGradient();
    }
  }
</script>

<dialog bind:this={dialog} class="ai-dialog">
  <div class="dialog-content">
    <h2>✨ AI Gradient Generator</h2>
    
    {#if error}
      <div class="error-message">{error}</div>
    {/if}
    
    {#if modelAvailable && !loading}
      <p class="description">
        Describe the gradient you want to create in natural language.
      </p>
      
      <div class="examples">
        <p class="examples-label">Try examples like:</p>
        <ul>
          <li>"A warm sunset gradient from orange to purple"</li>
          <li>"Ocean blue gradient with teal highlights"</li>
          <li>"Radial gradient like a sun burst"</li>
          <li>"Dark purple to pink gradient at 45 degrees"</li>
        </ul>
      </div>
      
      <textarea
        bind:value={userPrompt}
        placeholder="Describe your gradient..."
        rows="4"
        on:keydown={handleKeydown}
        disabled={loading}
      ></textarea>
      
      <div class="dialog-actions">
        <button on:click={close} disabled={loading}>
          Cancel
        </button>
        <button 
          on:click={generateGradient} 
          disabled={loading || !userPrompt.trim()}
          type="submit"
        >
          {#if loading}
            Generating...
          {:else}
            Generate Gradient
          {/if}
        </button>
      </div>
    {:else if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Preparing AI model...</p>
      </div>
    {:else}
      <div class="dialog-actions">
        <button on:click={close}>Close</button>
      </div>
    {/if}
  </div>
</dialog>

<style>
  .ai-dialog {
    border: 1px solid var(--gray-4);
    border-radius: 8px;
    padding: 0;
    width: 90vw;
    max-width: 500px;
    background: var(--gray-1);
    color: var(--gray-12);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  
  .ai-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
  
  .dialog-content {
    padding: 1.5rem;
  }
  
  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .description {
    margin: 0 0 1rem 0;
    color: var(--gray-11);
  }
  
  .examples {
    background: var(--gray-2);
    border: 1px solid var(--gray-4);
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .examples-label {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--gray-11);
  }
  
  .examples ul {
    margin: 0;
    padding-left: 1.25rem;
    color: var(--gray-10);
    font-size: 0.875rem;
  }
  
  .examples li {
    margin: 0.25rem 0;
  }
  
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--gray-6);
    border-radius: 6px;
    background: var(--gray-0);
    color: var(--gray-12);
    font-family: inherit;
    font-size: 0.95rem;
    resize: vertical;
    min-height: 100px;
  }
  
  textarea:focus {
    outline: none;
    border-color: var(--blue-7);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .error-message {
    background: var(--red-2);
    color: var(--red-11);
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--gray-6);
    border-radius: 6px;
    background: var(--gray-0);
    color: var(--gray-12);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  button:hover:not(:disabled) {
    background: var(--gray-2);
    border-color: var(--gray-7);
  }
  
  button.primary {
    background: var(--blue-9);
    color: white;
    border-color: var(--blue-9);
  }
  
  button.primary:hover:not(:disabled) {
    background: var(--blue-10);
    border-color: var(--blue-10);
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 1rem;
  }
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--gray-4);
    border-top-color: var(--blue-9);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
