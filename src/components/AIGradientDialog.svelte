<script>
  /**
   * AI Gradient Generator Dialog
   * Based on the original implementation by @jherr (Jack Herrington)
   * from PR #117: https://github.com/argyleink/gradient-style/pull/117
   * 
   * This version removes the zod dependency by using a static JSON Schema
   * instead of generating it from a zod schema.
   */
  import { onMount } from 'svelte';
  import { gradient_type, gradient_space, gradient_stops } from '../store/gradient';
  import { linear_angle, linear_named_angle } from '../store/linear';
  import { radial_shape, radial_position, radial_named_position } from '../store/radial';
  import { conic_angle, conic_position, conic_named_position } from '../store/conic';
  import { updateStops } from '../utils/stops.ts';
  
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
  
  // Static JSON Schema for gradient data (replaces zod schema + toJSONSchema conversion)
  const gradientSchema = {
    type: "object",
    properties: {
      gradient_type: {
        type: "string",
        enum: ["linear", "radial", "conic"]
      },
      gradient_space: {
        type: "string",
        enum: [
          "srgb", "srgb-linear", "lab", "oklab", "xyz", "xyz-d50", "xyz-d65",
          "hsl", "hwb", "lch", "oklch", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"
        ]
      },
      gradient_stops: {
        type: "array",
        minItems: 2,
        items: {
          oneOf: [
            {
              type: "object",
              properties: {
                kind: { type: "string", const: "stop" },
                color: { 
                  type: "string",
                  pattern: "^(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b|(?:oklch|oklab|lab|lch|hsl|hsla|hwb|rgb|rgba|color)\\s*\\()"
                },
                position: { type: "number", minimum: 0, maximum: 100 }
              },
              required: ["color", "position"]
            },
            {
              type: "object",
              properties: {
                kind: { type: "string", const: "hint" },
                percentage: { type: "number", minimum: 0, maximum: 100 }
              },
              required: ["kind", "percentage"]
            }
          ]
        }
      },
      linear_angle: { type: "number", minimum: 0, maximum: 360 },
      radial_shape: { type: "string", enum: ["circle", "ellipse"] },
      radial_position: {
        type: "object",
        properties: {
          x: { type: "number", minimum: 0, maximum: 100 },
          y: { type: "number", minimum: 0, maximum: 100 }
        }
      },
      conic_angle: { type: "number", minimum: 0, maximum: 360 },
      conic_position: {
        type: "object",
        properties: {
          x: { type: "number", minimum: 0, maximum: 100 },
          y: { type: "number", minimum: 0, maximum: 100 }
        }
      }
    },
    required: ["gradient_type", "gradient_space", "gradient_stops"]
  };
  
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
  
  // Export availability check for parent components to conditionally render UI
  export function isAvailable() {
    return modelAvailable;
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
      
      // Helpers
      const clamp01 = (n) => Math.max(0, Math.min(100, Number(n)));
      const clamp360 = (n) => {
        const v = Number(n);
        if (!Number.isFinite(v)) return 0;
        let x = v % 360;
        if (x < 0) x += 360;
        return x;
      };
      function sanitizeJsonLike(text) {
        if (typeof text !== 'string') return text;
        // Strip code fences and surrounding text, keep the outermost JSON object/array
        const start = text.indexOf('{');
        const startArr = text.indexOf('[');
        const s = start >= 0 && (startArr < 0 || start < startArr) ? start : startArr;
        if (s < 0) return text.trim();
        let end = text.lastIndexOf('}');
        let endArr = text.lastIndexOf(']');
        const e = end >= 0 && (endArr < 0 || end > endArr) ? end : endArr;
        if (e < 0) return text.slice(s).trim();
        return text.slice(s, e + 1).trim();
      }
      
      // Create a detailed prompt for the AI
      const systemPrompt = `You are a CSS gradient generator. Convert the user's description into gradient data.
      
      Guidelines:
      - For color descriptions like "sunset", "ocean", "forest" use appropriate colors
      - Default to linear gradients unless the user specifies radial or conic
      - Use modern color spaces like oklch for vibrant gradients when appropriate
      - Position stops evenly if not specified
      - Interleave transition hints between adjacent color stops (as {"kind":"hint","percentage":number})
      - For linear gradients, interpret directions like "left to right" as angle 90, "top to bottom" as 180
      - For radial gradients, default to ellipse shape centered
      - Return valid CSS color values (hex, rgb, hsl, oklch, etc.)
      - Allowed positions and percentages are 0–100 inclusive
      - Allowed angles are 0–360 inclusive
      
      User request: ${userPrompt}`;
      
      let result;
      try {
        // Try structured output first
        result = await session.prompt(systemPrompt, {
          responseConstraint: gradientSchema
        });
      } catch (err) {
        // Fallback: request plain JSON without constraint to avoid UnknownError
        console.warn('Structured Prompt failed, retrying without constraint:', err);
        const fallbackPrompt = systemPrompt + `\n\nOutput ONLY JSON with this exact shape (no markdown fences, no extra text):\n{\n  "gradient_type": "linear|radial|conic",\n  "gradient_space": "oklab|oklch|srgb|display-p3|...",\n  "gradient_stops": [\n    {"kind":"stop","color":"...","position":number},\n    {"kind":"hint","percentage":number},\n    ...\n  ],\n  "linear_angle": number (optional),\n  "radial_shape": "circle|ellipse" (optional),\n  "radial_position": {"x":number,"y":number} (optional),\n  "conic_angle": number (optional),\n  "conic_position": {"x":number,"y":number} (optional)\n}`;
        result = await session.prompt(fallbackPrompt);
      }
      
      // Parse the response (could be an object or a string)
      let gradientData = null;
      if (typeof result === 'string') {
        const cleaned = sanitizeJsonLike(result);
        try {
          gradientData = JSON.parse(cleaned);
        } catch (e) {
          throw new Error('AI returned non-JSON output. Please try again.');
        }
      } else if (result && typeof result === 'object') {
        gradientData = result;
      } else {
        throw new Error('Unexpected AI response format.');
      }
      
      // Update stores directly with the AI-generated gradient data
      
      // Update gradient type
      if (gradientData.gradient_type) {
        gradient_type.set(gradientData.gradient_type);
      }
      
      // Update gradient space  
      if (gradientData.gradient_space) {
        gradient_space.set(gradientData.gradient_space);
      }
      
      // Update gradient stops (supports both color stops and transition hints)
      if (gradientData.gradient_stops && Array.isArray(gradientData.gradient_stops)) {
        // Import Color for color conversion
        const Color = (await import('colorjs.io')).default;
        
        // First pass: normalize items, drop invalid colors, clamp positions
        const normalized = [];
        for (const raw of gradientData.gradient_stops) {
          if (!raw) continue;
          if (raw.kind === 'hint') {
            // Clamp to [0, 100]
            const pct = clamp01(raw.percentage);
            normalized.push({ kind: 'hint', percentage: pct });
          } else {
            // Treat as a color stop (with or without explicit kind)
            try {
              const color = new Color(raw.color);
              const oklchColor = color.to('oklch').toString();
              const pos = clamp01(raw.position);
              normalized.push({ kind: 'stop', color: oklchColor, position1: pos, position2: pos });
            } catch (err) {
              console.warn('Dropping invalid color from AI output:', raw.color, err);
            }
          }
        }
        
        // Ensure we start and end with a color stop and have at least two stops
        const stopsOnly = normalized.filter((i) => i.kind === 'stop');
        if (stopsOnly.length < 2) {
          // Fallback to a simple gradient if AI output was unusable
          gradient_stops.set([
            { kind: 'stop', color: 'oklch(80% 0.2 20)', position1: 0, position2: 0 },
            { kind: 'hint', percentage: 50 },
            { kind: 'stop', color: 'oklch(60% 0.2 200)', position1: 100, position2: 100 },
          ]);
          close();
          return;
        }
        
        // Second pass: interleave hints between each adjacent pair of stops if missing
        const interleaved = [];
        for (let i = 0; i < normalized.length; i++) {
          const cur = normalized[i];
          interleaved.push(cur);
          if (cur.kind === 'stop') {
            const next = normalized[i + 1];
            const hasNextStop = normalized.slice(i + 1).find((x) => x.kind === 'stop');
            const nextIsHint = next?.kind === 'hint';
            // Insert a hint if the next item is not a hint but there is another stop later
            if (!nextIsHint && hasNextStop) {
              interleaved.push({ kind: 'hint', percentage: null });
            }
          }
        }
        
        // Final normalization using existing utility to compute auto positions and default hint percentages
        const finalList = updateStops(interleaved);
        gradient_stops.set(finalList);
      }
    
      // Handle linear gradient properties
      if (gradientData.gradient_type === 'linear' && gradientData.linear_angle !== undefined) {
        linear_angle.set(String(clamp360(gradientData.linear_angle)));
        linear_named_angle.set('--'); // Set to custom angle indicator
      }
      
      // Handle radial gradient properties
      if (gradientData.gradient_type === 'radial') {
        if (gradientData.radial_shape) {
          radial_shape.set(gradientData.radial_shape);
        }
        if (gradientData.radial_position) {
          const rx = gradientData.radial_position.x;
          const ry = gradientData.radial_position.y;
          radial_position.set({ x: rx === null ? null : clamp01(rx), y: ry === null ? null : clamp01(ry) });
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
          conic_angle.set(String(clamp360(gradientData.conic_angle)));
        }
        if (gradientData.conic_position) {
          const cx = gradientData.conic_position.x;
          const cy = gradientData.conic_position.y;
          conic_position.set({ x: cx === null ? null : clamp01(cx), y: cy === null ? null : clamp01(cy) });
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
    
    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Preparing AI model...</p>
      </div>
    {:else}
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
        onkeydown={handleKeydown}
        disabled={loading || !modelAvailable}
      ></textarea>
      
      <div class="dialog-actions">
        <button onclick={() => close()} disabled={loading}>
          Cancel
        </button>
        <button 
          onclick={() => generateGradient()} 
          disabled={loading || !modelAvailable || !userPrompt.trim()}
          type="submit"
        >
          Generate Gradient
        </button>
      </div>
    {/if}
  </div>
</dialog>

<style>
  .ai-dialog {
    border: 1px solid var(--surface-2);
    border-radius: var(--radius-3);
    padding: 0;
    inline-size: 90vw;
    max-inline-size: var(--size-content-2);
    background: var(--surface-1);
    box-shadow: var(--shadow-6);
  }
  
  .ai-dialog::backdrop {
    background: radial-gradient(circle, #0001, #000e);
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
  }
  
  .examples {
    background: var(--surface-2);
    border: 1px solid var(--surface-3);
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .examples-label {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .examples ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.875rem;
  }
  
  .examples li {
    margin: 0.25rem 0;
  }
  
  textarea {
    width: 100%;
    padding: 0.75rem;
    border-radius: 6px;
    background: var(--surface-3);
    font-family: inherit;
    font-size: 0.95rem;
    resize: vertical;
    min-height: 3lh;
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

  button[type="submit"] {
    --link: light-dark(var(--indigo-6), var(--indigo-3));
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
