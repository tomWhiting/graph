# Cosmograph WASM-bindgen Bindings

This module provides wasm-bindgen compatible bindings for the `@cosmos.gl/graph` GPU-accelerated graph visualization library.

## Architecture

The wrapper follows a pattern suitable for WASM/JS interop:

1. **Graph instance lives in JS-land**: The `Graph` object is stored in module scope on the JavaScript side
2. **Rust calls exported functions**: Functions like `setPointPositions()` operate on the module-scoped instance
3. **Typed arrays cross the boundary efficiently**: `Float32Array` passes efficiently between WASM and JS

## Installation

The wrapper imports from `@cosmos.gl/graph`, so ensure the package is available:

```bash
npm install @cosmos.gl/graph
```

## Rust Usage

### Basic Setup

```rust
use wasm_bindgen::prelude::*;
use web_sys::HtmlDivElement;

#[wasm_bindgen(module = "/cosmograph-wrapper.js")]
extern "C" {
    // Lifecycle
    fn createGraph(container: &HtmlDivElement, config: JsValue) -> bool;
    fn destroy();
    fn isReady() -> bool;

    // Data setters
    fn setPointPositions(positions: &js_sys::Float32Array);
    fn setLinks(links: &js_sys::Float32Array);
    fn setPointColors(colors: &js_sys::Float32Array);
    fn setPointSizes(sizes: &js_sys::Float32Array);
    fn setLinkColors(colors: &js_sys::Float32Array);
    fn setLinkWidths(widths: &js_sys::Float32Array);

    // Control
    fn render(alpha: Option<f64>);
    fn fitView(duration: Option<f64>, padding: Option<f64>);
    fn start(alpha: Option<f64>);
    fn stop();
    fn pause();
    fn unpause();

    // Events (closures)
    fn onClick(callback: &Closure<dyn Fn(i32, f64, f64)>);
    fn onHover(callback: &Closure<dyn Fn(i32, f64, f64)>);
}
```

### Creating a Graph

```rust
use js_sys::Float32Array;
use serde::Serialize;
use wasm_bindgen::JsValue;
use web_sys::window;

#[derive(Serialize)]
struct GraphConfig {
    #[serde(rename = "backgroundColor")]
    background_color: String,
    #[serde(rename = "pointDefaultSize")]
    point_default_size: f64,
    #[serde(rename = "enableDrag")]
    enable_drag: bool,
}

pub fn init_graph(container: &HtmlDivElement) {
    let config = GraphConfig {
        background_color: "#1a1a2e".to_string(),
        point_default_size: 4.0,
        enable_drag: true,
    };

    let config_js = serde_wasm_bindgen::to_value(&config).unwrap();
    createGraph(container, config_js);
}
```

### Setting Graph Data

```rust
pub fn set_graph_data(positions: &[f32], links: &[f32]) {
    // Create Float32Array views into WASM memory
    let positions_array = Float32Array::new_with_length(positions.len() as u32);
    positions_array.copy_from(positions);

    let links_array = Float32Array::new_with_length(links.len() as u32);
    links_array.copy_from(links);

    // Pass to JS (wrapper copies data to avoid memory issues)
    setPointPositions(&positions_array);
    setLinks(&links_array);

    // Start rendering
    render(None);
}
```

### Handling Events

```rust
use std::rc::Rc;
use std::cell::RefCell;
use wasm_bindgen::closure::Closure;

pub struct GraphEventHandler {
    on_click: Closure<dyn Fn(i32, f64, f64)>,
    on_hover: Closure<dyn Fn(i32, f64, f64)>,
}

impl GraphEventHandler {
    pub fn new() -> Self {
        let on_click = Closure::new(|point_index: i32, x: f64, y: f64| {
            if point_index >= 0 {
                web_sys::console::log_1(
                    &format!("Clicked point {} at ({}, {})", point_index, x, y).into()
                );
            } else {
                web_sys::console::log_1(&"Clicked background".into());
            }
        });

        let on_hover = Closure::new(|point_index: i32, x: f64, y: f64| {
            if point_index >= 0 {
                // Mouse entered a point
                web_sys::console::log_1(
                    &format!("Hovering point {} at ({}, {})", point_index, x, y).into()
                );
            } else {
                // Mouse left all points
            }
        });

        // Register callbacks
        onClick(&on_click);
        onHover(&on_hover);

        Self { on_click, on_hover }
    }
}

// Keep the handler alive for the lifetime of your app
static mut HANDLER: Option<GraphEventHandler> = None;
```

### Complete Leptos Example

```rust
use leptos::*;
use wasm_bindgen::prelude::*;
use web_sys::HtmlDivElement;

#[wasm_bindgen(module = "/cosmograph-wrapper.js")]
extern "C" {
    fn createGraph(container: &HtmlDivElement, config: JsValue) -> bool;
    fn setPointPositions(positions: &js_sys::Float32Array);
    fn setLinks(links: &js_sys::Float32Array);
    fn render(alpha: Option<f64>);
    fn fitView(duration: Option<f64>, padding: Option<f64>);
    fn destroy();
}

#[component]
pub fn CosmographView() -> impl IntoView {
    let container_ref = create_node_ref::<html::Div>();

    create_effect(move |_| {
        if let Some(container) = container_ref.get() {
            // Initialize graph
            let config = js_sys::Object::new();
            js_sys::Reflect::set(&config, &"backgroundColor".into(), &"#1a1a2e".into()).unwrap();
            js_sys::Reflect::set(&config, &"pointDefaultSize".into(), &4.0.into()).unwrap();

            createGraph(&container.into(), config.into());

            // Set sample data
            let positions = js_sys::Float32Array::from(&[
                0.0f32, 0.0,
                100.0, 0.0,
                50.0, 86.6,
            ][..]);

            let links = js_sys::Float32Array::from(&[
                0.0f32, 1.0,
                1.0, 2.0,
                2.0, 0.0,
            ][..]);

            setPointPositions(&positions);
            setLinks(&links);
            render(Some(1.0));

            // Fit view after a short delay
            set_timeout(move || {
                fitView(Some(500.0), Some(0.1));
            }, std::time::Duration::from_millis(100));
        }
    });

    on_cleanup(|| {
        destroy();
    });

    view! {
        <div
            node_ref=container_ref
            style="width: 100%; height: 100vh; position: relative;"
        />
    }
}
```

## API Reference

### Lifecycle

| Function | Description |
|----------|-------------|
| `createGraph(container, config)` | Creates graph in container, returns success boolean |
| `destroy()` | Destroys graph and releases resources |
| `isReady()` | Returns true if graph exists |

### Data Setters

| Function | Format | Description |
|----------|--------|-------------|
| `setPointPositions(positions)` | `[x1, y1, x2, y2, ...]` | Set point coordinates |
| `setPointColors(colors)` | `[r, g, b, a, ...]` (0-255) | Set point RGBA colors |
| `setPointSizes(sizes)` | `[s1, s2, ...]` | Set point sizes |
| `setPointShapes(shapes)` | `[0-8, ...]` | Set point shapes |
| `setLinks(links)` | `[src1, tgt1, ...]` | Set edges (point indices) |
| `setLinkColors(colors)` | `[r, g, b, a, ...]` | Set link RGBA colors |
| `setLinkWidths(widths)` | `[w1, w2, ...]` | Set link widths |
| `setLinkArrows(arrows)` | `Uint8Array` of 0/1 | Set which links have arrows |

### Data Getters

| Function | Returns | Description |
|----------|---------|-------------|
| `getPointPositions()` | `Float32Array` | Current point positions |
| `getPointColors()` | `Float32Array` | Current point colors |
| `getSelectedIndices()` | `Uint32Array` | Selected point indices |
| `getAdjacentIndices(index)` | `Uint32Array` | Points connected to given point |

### Control

| Function | Description |
|----------|-------------|
| `render(alpha?)` | Start rendering (alpha controls simulation energy) |
| `start(alpha?)` | Start simulation |
| `stop()` | Stop simulation and reset |
| `pause()` | Pause simulation |
| `unpause()` | Resume simulation |
| `step()` | Run single simulation step |
| `fitView(duration?, padding?)` | Fit all points in view |
| `setZoomLevel(level, duration?)` | Set zoom level |

### Events

| Function | Callback Signature | Description |
|----------|-------------------|-------------|
| `onClick(cb)` | `(pointIndex, x, y)` | Click event (-1 = no point) |
| `onHover(cb)` | `(pointIndex, x, y)` | Hover event (-1 = left point) |
| `onPointClick(cb)` | `(pointIndex, x, y)` | Point click only |
| `onLinkClick(cb)` | `(linkIndex)` | Link click only |
| `onSimulation(cbs)` | Object with callbacks | Simulation events |

## Memory Considerations

The wrapper **copies** all typed arrays passed from WASM to avoid issues when WASM linear memory is resized. This is important because:

1. `Float32Array` from WASM is a view into WASM memory
2. If WASM memory grows, the view becomes invalid
3. Cosmograph may hold references to the data

For large graphs (100k+ nodes), consider:
- Batching updates
- Using `requestAnimationFrame` for smooth updates
- Monitoring memory usage

## Point Shapes

Available shapes (pass as integers in `setPointShapes`):

| Value | Shape |
|-------|-------|
| 0 | Circle |
| 1 | Square |
| 2 | Triangle |
| 3 | Diamond |
| 4 | Pentagon |
| 5 | Hexagon |
| 6 | Star |
| 7 | Cross |
| 8 | None |

## Configuration Options

Key configuration properties (pass to `createGraph` or `setConfig`):

```javascript
{
  // Rendering
  backgroundColor: '#222222',
  pixelRatio: 2,
  renderLinks: true,

  // Points
  pointDefaultColor: '#b3b3b3',
  pointDefaultSize: 4,
  pointOpacity: 1.0,

  // Links
  linkDefaultColor: '#666666',
  linkDefaultWidth: 1,
  linkDefaultArrows: false,

  // Simulation
  enableSimulation: true,
  simulationGravity: 0.25,
  simulationRepulsion: 1.0,
  simulationLinkSpring: 1,
  simulationFriction: 0.85,

  // Interaction
  enableZoom: true,
  enableDrag: false,
  spaceSize: 8192,

  // View
  fitViewOnInit: true,
  fitViewPadding: 0.1,
}
```

See `@cosmos.gl/graph` documentation for the complete configuration reference.
