# Gradient Style Application - Technical Context

## Overview
This is a **SvelteKit 5** application that provides an advanced CSS gradient builder with support for High Dynamic Range (HDR) gradients using modern CSS Color 4 specifications. The application allows users to create, customize, and export CSS gradients with multiple color stops, hints, and layers.

## Technology Stack
- **Framework**: SvelteKit (v2.37.0) with Svelte 5 (v5.38.6)
- **Build Tools**: Vite (v7.1.4)
- **Type System**: TypeScript/JavaScript (mixed - using JSConfig)
- **Testing**: Vitest (v3.2.4) with Testing Library
- **Package Manager**: pnpm (v10.15.1)
- **Key Libraries**:
  - colorjs.io - Advanced color manipulation and color space conversions
  - open-props - CSS custom properties design tokens
  - prismjs - Syntax highlighting for code display
  - svooltip - Tooltip component library

## Architecture & Data Flow

### State Management Pattern
The application uses **Svelte stores** with a layered architecture for state management:

1. **Single-Value Stores** (`src/store/`):
   - Individual writable stores for each gradient property
   - Automatic synchronization between related values
   - Bidirectional binding with UI components

2. **Layer System** (`src/store/layers.ts`):
   - Multi-layer gradient support
   - Maintains an active layer index
   - Synchronizes between single stores and layer snapshots
   - Prevents feedback loops with guard flags

3. **URL State Persistence** (`src/store/url.ts`):
   - Serializes state to URL hash for sharing
   - Supports both single-layer (legacy) and multi-layer formats
   - Debounced updates during user interactions

### Data Store Organization

#### Core Gradient Stores (`src/store/gradient.ts`)
- `gradient_type`: 'linear' | 'radial' | 'conic'
- `gradient_space`: Color space (oklab, oklch, srgb, etc.)
- `gradient_interpolation`: Hue interpolation method
- `gradient_stops`: Array of color stops and hints
- `active_stop_index`: Currently selected stop for editing

#### Gradient Type-Specific Stores
- **Linear** (`src/store/linear.ts`):
  - `linear_named_angle`: Directional keywords (to right, to top, etc.)
  - `linear_angle`: Numeric angle in degrees
  - Auto-sync between named and numeric angles

- **Radial** (`src/store/radial.ts`):
  - `radial_shape`: circle | ellipse
  - `radial_size`: Size keywords (farthest-corner, etc.)
  - `radial_position`: {x, y} coordinates
  - `radial_named_position`: Named positions (center, top left, etc.)

- **Conic** (`src/store/conic.ts`):
  - `conic_angle`: Starting angle
  - `conic_position`: {x, y} coordinates
  - `conic_named_position`: Named positions

#### Color Picker Store (`src/store/colorpicker.ts`)
- Individual channel stores for each color space (OKLCH, OKLAB, LAB, LCH, HSL, HWB, RGB)
- `picker_value`: Current color value
- `colorspace`: Active color space for picker

#### Layer Management (`src/store/layers.ts`)
- `layers`: Array of gradient layer objects
- `active_layer_index`: Currently selected layer
- Each layer contains a snapshot of all gradient properties
- Cached CSS strings for performance

### Component Structure

#### Main Components
- **Gradient.svelte**: Root component, orchestrates the entire UI
- **GradientStops.svelte**: Manages color stops and hints with drag-reorder
- **LayersPanel.svelte**: Multi-layer management interface
- **ColorPicker.svelte**: Advanced color selection with multiple color spaces

#### Overlay Components
- **LinearOverlay.svelte**: Visual angle control for linear gradients
- **RadialOverlay.svelte**: Position/shape control for radial gradients
- **ConicOverlay.svelte**: Angle and position control for conic gradients

#### Control Components
- **GradientColorSpace.svelte**: Color space and gradient type selection
- **HueInterpolation.svelte**: Hue interpolation method for cylindrical spaces
- **Presets.svelte**: Pre-defined gradient templates
- **GradientImportDialog.svelte**: CSS gradient import functionality

### Utility Functions

#### Gradient String Generation (`src/utils/gradientString.ts`)
- Builds modern CSS (Color 4) and classic CSS gradient strings
- Handles position optimization (removes defaults)
- Manages color space syntax
- Caches generated strings for performance

#### Gradient Parsing (`src/lib/parseGradient.ts`)
- Parses CSS gradient strings into structured data
- Supports all three gradient types
- Extracts color stops, hints, and configuration
- Handles modern color space syntax

#### Color Space Utilities (`src/utils/colorspace.ts`)
- Identifies cylindrical color spaces
- Determines color gamut (sRGB, P3, Rec2020, XYZ)
- Maps between ColorJS.io and CSS color space identifiers

#### Stop Management (`src/utils/stops.ts`)
- Auto-calculates positions for stops
- Validates and normalizes stop arrays
- Manages hint percentages

### Data Flow Patterns

1. **User Interaction → Store Update**:
   - User changes UI control
   - Component updates relevant store
   - Store subscription triggers layer update
   - Layer cached CSS regenerated
   - UI reflects changes immediately

2. **Layer Selection**:
   - User selects different layer
   - Layer snapshot applied to all single stores
   - UI components react to store changes
   - Active layer marked in layers panel

3. **URL Synchronization**:
   - Store changes trigger derived store update
   - Debounced URL hash update (350ms)
   - Paused during active interactions (dragging, typing)
   - Immediate write on interaction end

4. **Import/Export Flow**:
   - CSS string parsed into structured data
   - Data mapped to store values
   - Stores trigger UI updates
   - New layer created with imported gradient

### Key Features

#### HDR Gradient Support
- Wide gamut color spaces (Display-P3, Rec2020)
- OKLCH/OKLAB perceptually uniform spaces
- Color space interpolation control
- Hue interpolation methods for cylindrical spaces

#### Multi-Layer System
- Stack multiple gradients
- Toggle layer visibility
- Duplicate, reorder, and delete layers
- Each layer maintains independent configuration

#### Advanced Stop Control
- Drag-to-reorder stops
- Dual position sliders (start/end positions)
- Color transition hints between stops
- Auto-position calculation

#### Import/Export
- Parse existing CSS gradients
- Export modern (Color 4) CSS
- Export fallback (sRGB) CSS
- URL-based sharing

#### Visual Overlays
- Interactive angle selection for linear gradients
- Position/size control for radial gradients
- Rotation and position for conic gradients
- Real-time preview updates

### Performance Optimizations

1. **Cached CSS Generation**: Layer CSS strings cached to avoid recalculation
2. **Debounced URL Updates**: Prevents excessive history updates
3. **Guard Flags**: Prevents store update feedback loops
4. **Selective Subscriptions**: Components only subscribe to relevant stores
5. **Lazy Component Loading**: Color picker loads on demand

### File Organization

```
src/
├── components/        # Svelte components
├── lib/              # Library functions (parsing, import)
├── routes/           # SvelteKit routes
├── store/            # Svelte stores (state management)
├── utils/            # Utility functions
└── test/             # Test setup

Key Files:
- src/routes/+page.svelte: Main page entry
- src/components/Gradient.svelte: Root component
- src/store/layers.ts: Multi-layer orchestration
- src/utils/gradientString.ts: CSS generation
- src/lib/parseGradient.ts: CSS parsing
```

### Testing
- Unit tests for gradient parsing
- Stop rendering tests
- Uses Vitest with JSDOM for browser environment simulation

### Development Notes

#### State Synchronization Complexity
The application maintains complex bidirectional synchronization between:
- Individual property stores
- Layer snapshots
- URL state
- UI components

This is managed through guard flags and careful subscription management to prevent infinite loops.

#### Color Space Handling
The app bridges between:
- CSS color syntax (display-p3, a98-rgb)
- ColorJS.io internal names (p3, a98rgb)
- UI-friendly names

#### Gradient String Optimization
The generated CSS removes default values:
- 0% for first stop
- 100% for last stop
- 50% for centered hints
- "to bottom" or 180deg for linear gradients
- "center" for radial/conic position

#### Browser Compatibility
- Modern CSS (Color 4) for capable browsers
- Automatic fallback to sRGB hex colors
- Feature detection for HDR displays

## Common Tasks

### Adding a New Gradient Type
1. Create type-specific store in `src/store/`
2. Add type to gradient_type options
3. Create overlay component for visual control
4. Update gradientString.ts for CSS generation
5. Update parseGradient.ts for import support

### Adding a New Color Space
1. Update color space lists in components
2. Add to isCylindricalSpace if applicable
3. Update ColorJS.io space ID mapping
4. Test gradient string generation

### Modifying Layer Behavior
1. Update layer type in `src/store/layers.ts`
2. Modify snapshot/apply functions
3. Update buildGradientStrings if needed
4. Test layer switching and persistence

### Debugging State Issues
1. Check for feedback loops in store subscriptions
2. Verify guard flags (isApplyingLayerToStores, syncing)
3. Inspect URL serialization/deserialization
4. Use browser DevTools to monitor store values

## External Dependencies
- ColorJS.io for color manipulation
- Open Props for design tokens
- PrismJS for syntax highlighting
- Svooltip for tooltips

## Build & Deploy
- `pnpm dev`: Development server
- `pnpm build`: Production build
- `pnpm preview`: Preview production build
- `pnpm test`: Run tests
- Uses SvelteKit adapter-auto for deployment
