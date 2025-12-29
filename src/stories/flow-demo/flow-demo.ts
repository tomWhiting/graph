import { Graph } from '@cosmos.gl/graph'

/**
 * Flow Demo - PWM-based directional flow animation with dual layers
 *
 * Layer 1: Primary flow effect (slow waves, gradient pulses, etc.)
 * Layer 2: Secondary effect that stacks on top (fast sparks, highlights, etc.)
 *
 * Each layer has independent control over:
 * - Pulse Width: Narrow = particles, Wide = gradient-like waves
 * - Pulse Count: Number of pulses per edge
 * - Speed: How fast the pulses travel
 * - Wave Shape: Square/Triangle/Sine for transition smoothness
 * - Brightness: How much brighter the pulses are
 * - Fade: How much to dim non-pulse areas
 * - Color: Tint color for the pulses
 */
export const flowDemo = (): HTMLDivElement => {
  const container = document.createElement('div')
  container.style.height = '100vh'
  container.style.width = '100%'
  container.style.position = 'relative'

  // Create graph container
  const graphDiv = document.createElement('div')
  graphDiv.style.height = '100%'
  graphDiv.style.width = '100%'
  container.appendChild(graphDiv)

  // Generate a directed graph - radial layout with outward edges
  const nodeCount = 150
  const edgeCount = 300
  const spaceSize = 4096

  const pointPositions = new Float32Array(nodeCount * 2)
  const links = new Float32Array(edgeCount * 2)
  const linkColors = new Float32Array(edgeCount * 4)

  // Create nodes in clusters
  const clusterCount = 5
  const clusterCenters: [number, number][] = []

  for (let i = 0; i < clusterCount; i++) {
    const angle = (i / clusterCount) * Math.PI * 2
    const radius = spaceSize * 0.25
    clusterCenters.push([
      spaceSize / 2 + Math.cos(angle) * radius,
      spaceSize / 2 + Math.sin(angle) * radius
    ])
  }

  // Position nodes around cluster centers
  for (let i = 0; i < nodeCount; i++) {
    const cluster = i % clusterCount
    const [cx, cy] = clusterCenters[cluster]
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * spaceSize * 0.15

    pointPositions[i * 2] = cx + Math.cos(angle) * radius
    pointPositions[i * 2 + 1] = cy + Math.sin(angle) * radius
  }

  // Create edges - mix of within-cluster and between-cluster
  for (let i = 0; i < edgeCount; i++) {
    let source: number, target: number

    if (Math.random() < 0.7) {
      // Within-cluster edge
      const cluster = Math.floor(Math.random() * clusterCount)
      const clusterNodes = []
      for (let j = cluster; j < nodeCount; j += clusterCount) {
        clusterNodes.push(j)
      }
      source = clusterNodes[Math.floor(Math.random() * clusterNodes.length)]
      target = clusterNodes[Math.floor(Math.random() * clusterNodes.length)]
    } else {
      // Between-cluster edge
      source = Math.floor(Math.random() * nodeCount)
      target = Math.floor(Math.random() * nodeCount)
    }

    // Ensure directed (source < target)
    if (source > target) [source, target] = [target, source]
    if (source === target) target = (source + 1) % nodeCount

    links[i * 2] = source
    links[i * 2 + 1] = target

    // Color based on cluster - use a nice teal/cyan base
    const hue = 0.5 + (source % clusterCount) / clusterCount * 0.2
    const [r, g, b] = hslToRgb(hue, 0.6, 0.4)
    linkColors[i * 4] = r
    linkColors[i * 4 + 1] = g
    linkColors[i * 4 + 2] = b
    linkColors[i * 4 + 3] = 0.9
  }

  // Initialize graph with flow enabled
  const graph = new Graph(graphDiv, {
    backgroundColor: '#0d1117',
    pointDefaultSize: 5,
    pointDefaultColor: '#58a6ff',
    linkDefaultWidth: 2,
    curvedLinks: true,
    curvedLinkSegments: 15,
    renderLinks: true,
    // Layer 1: Slow sine wave pulses
    linkFlow: true,
    linkFlowSpeed: 0.15,
    linkFlowPulseWidth: 0.2,
    linkFlowPulseCount: 2,
    linkFlowWaveShape: 1.0,
    linkFlowBrightness: 1.8,
    linkFlowFade: 0.3,
    linkFlowColor: [1, 1, 1, 0] as [number, number, number, number],
    // Layer 2: Fast yellow sparks (disabled by default)
    linkFlow2: false,
    linkFlow2Speed: 0.8,
    linkFlow2PulseWidth: 0.02,
    linkFlow2PulseCount: 4,
    linkFlow2WaveShape: 0.5,
    linkFlow2Brightness: 3.0,
    linkFlow2Fade: 0.0,
    linkFlow2Color: [1, 0.9, 0.2, 0.9] as [number, number, number, number],
    fitViewOnInit: true,
    enableSimulation: false,
    scaleLinksOnZoom: false,
    attribution: 'Flow Animation Demo - <a href="https://cosmograph.app/" style="color: var(--cosmosgl-attribution-color);" target="_blank">Cosmograph</a>',
  })

  graph.setPointPositions(pointPositions)
  graph.setLinks(links)
  graph.setLinkColors(linkColors)
  graph.render()

  // Create controls panel
  const controls = document.createElement('div')
  controls.style.cssText = `
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(13, 17, 23, 0.95);
    padding: 16px;
    border-radius: 8px;
    color: #c9d1d9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    z-index: 1000;
    min-width: 280px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid #30363d;
  `

  // State for Layer 1
  let l1Enabled = true
  let l1Width = 0.2
  let l1Count = 2
  let l1Speed = 0.15
  let l1Shape = 1.0
  let l1Brightness = 1.8
  let l1Fade = 0.3
  let l1ColorR = 1, l1ColorG = 1, l1ColorB = 1, l1ColorA = 0

  // State for Layer 2
  let l2Enabled = false
  let l2Width = 0.02
  let l2Count = 4
  let l2Speed = 0.8
  let l2Shape = 0.5
  let l2Brightness = 3.0
  let l2Fade = 0.0
  let l2ColorR = 1, l2ColorG = 0.9, l2ColorB = 0.2, l2ColorA = 0.9

  const getShapeName = (v: number) => {
    if (v < 0.33) return 'Square'
    if (v < 0.66) return 'Triangle'
    return 'Sine'
  }

  controls.innerHTML = `
    <style>
      .flow-section { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #30363d; }
      .flow-section:last-child { border-bottom: none; margin-bottom: 0; }
      .flow-header { font-weight: 600; font-size: 13px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
      .flow-row { margin-bottom: 8px; }
      .flow-label { display: block; margin-bottom: 3px; color: #8b949e; font-size: 11px; }
      .flow-value { color: #58a6ff; font-weight: 500; }
      .flow-slider { width: 100%; height: 4px; -webkit-appearance: none; background: #21262d; border-radius: 2px; outline: none; }
      .flow-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: #58a6ff; border-radius: 50%; cursor: pointer; }
      .flow-checkbox { width: 14px; height: 14px; accent-color: #58a6ff; }
      .flow-color { display: flex; gap: 4px; align-items: center; }
      .flow-color input { width: 50px; }
      .preset-btn { padding: 5px 10px; border: 1px solid #30363d; background: #21262d; color: #c9d1d9; border-radius: 4px; cursor: pointer; font-size: 10px; }
      .preset-btn:hover { background: #30363d; border-color: #58a6ff; }
    </style>

    <div class="flow-section">
      <div class="flow-header">
        <input type="checkbox" id="l1-enabled" class="flow-checkbox" checked>
        <span>Layer 1 - Primary Flow</span>
      </div>
      <div class="flow-row">
        <label class="flow-label">Width: <span id="l1-width-val" class="flow-value">0.20</span></label>
        <input type="range" id="l1-width" class="flow-slider" min="0.005" max="0.8" step="0.005" value="0.2">
      </div>
      <div class="flow-row">
        <label class="flow-label">Count: <span id="l1-count-val" class="flow-value">2</span></label>
        <input type="range" id="l1-count" class="flow-slider" min="1" max="8" step="1" value="2">
      </div>
      <div class="flow-row">
        <label class="flow-label">Speed: <span id="l1-speed-val" class="flow-value">0.15</span></label>
        <input type="range" id="l1-speed" class="flow-slider" min="0.01" max="2" step="0.01" value="0.15">
      </div>
      <div class="flow-row">
        <label class="flow-label">Shape: <span id="l1-shape-val" class="flow-value">Sine</span></label>
        <input type="range" id="l1-shape" class="flow-slider" min="0" max="1" step="0.01" value="1">
      </div>
      <div class="flow-row">
        <label class="flow-label">Brightness: <span id="l1-bright-val" class="flow-value">1.8</span></label>
        <input type="range" id="l1-bright" class="flow-slider" min="1" max="5" step="0.1" value="1.8">
      </div>
      <div class="flow-row">
        <label class="flow-label">Fade: <span id="l1-fade-val" class="flow-value">0.3</span></label>
        <input type="range" id="l1-fade" class="flow-slider" min="0" max="1" step="0.05" value="0.3">
      </div>
      <div class="flow-row">
        <label class="flow-label">Color (RGBA): <span id="l1-color-val" class="flow-value">off</span></label>
        <div class="flow-color">
          <input type="range" id="l1-color-r" class="flow-slider" min="0" max="1" step="0.05" value="1" style="width:50px">
          <input type="range" id="l1-color-g" class="flow-slider" min="0" max="1" step="0.05" value="1" style="width:50px">
          <input type="range" id="l1-color-b" class="flow-slider" min="0" max="1" step="0.05" value="1" style="width:50px">
          <input type="range" id="l1-color-a" class="flow-slider" min="0" max="1" step="0.05" value="0" style="width:50px">
        </div>
      </div>
    </div>

    <div class="flow-section">
      <div class="flow-header">
        <input type="checkbox" id="l2-enabled" class="flow-checkbox">
        <span>Layer 2 - Sparks/Highlights</span>
      </div>
      <div class="flow-row">
        <label class="flow-label">Width: <span id="l2-width-val" class="flow-value">0.02</span></label>
        <input type="range" id="l2-width" class="flow-slider" min="0.005" max="0.8" step="0.005" value="0.02">
      </div>
      <div class="flow-row">
        <label class="flow-label">Count: <span id="l2-count-val" class="flow-value">4</span></label>
        <input type="range" id="l2-count" class="flow-slider" min="1" max="8" step="1" value="4">
      </div>
      <div class="flow-row">
        <label class="flow-label">Speed: <span id="l2-speed-val" class="flow-value">0.8</span></label>
        <input type="range" id="l2-speed" class="flow-slider" min="0.01" max="2" step="0.01" value="0.8">
      </div>
      <div class="flow-row">
        <label class="flow-label">Shape: <span id="l2-shape-val" class="flow-value">Triangle</span></label>
        <input type="range" id="l2-shape" class="flow-slider" min="0" max="1" step="0.01" value="0.5">
      </div>
      <div class="flow-row">
        <label class="flow-label">Brightness: <span id="l2-bright-val" class="flow-value">3.0</span></label>
        <input type="range" id="l2-bright" class="flow-slider" min="1" max="5" step="0.1" value="3">
      </div>
      <div class="flow-row">
        <label class="flow-label">Fade: <span id="l2-fade-val" class="flow-value">0.0</span></label>
        <input type="range" id="l2-fade" class="flow-slider" min="0" max="1" step="0.05" value="0">
      </div>
      <div class="flow-row">
        <label class="flow-label">Color (RGBA): <span id="l2-color-val" class="flow-value">yellow</span></label>
        <div class="flow-color">
          <input type="range" id="l2-color-r" class="flow-slider" min="0" max="1" step="0.05" value="1" style="width:50px">
          <input type="range" id="l2-color-g" class="flow-slider" min="0" max="1" step="0.05" value="0.9" style="width:50px">
          <input type="range" id="l2-color-b" class="flow-slider" min="0" max="1" step="0.05" value="0.2" style="width:50px">
          <input type="range" id="l2-color-a" class="flow-slider" min="0" max="1" step="0.05" value="0.9" style="width:50px">
        </div>
      </div>
    </div>

    <div class="flow-section">
      <div class="flow-header">Presets</div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        <button id="preset-particles" class="preset-btn">Particles</button>
        <button id="preset-waves" class="preset-btn">Waves</button>
        <button id="preset-data-stream" class="preset-btn">Data Stream</button>
        <button id="preset-sparks" class="preset-btn">Sparks</button>
        <button id="preset-warning" class="preset-btn">Warning</button>
        <button id="preset-dual" class="preset-btn">Dual Layer</button>
      </div>
    </div>
  `

  container.appendChild(controls)

  // Wire up Layer 1 controls
  const l1EnabledEl = controls.querySelector('#l1-enabled') as HTMLInputElement
  const l1WidthEl = controls.querySelector('#l1-width') as HTMLInputElement
  const l1CountEl = controls.querySelector('#l1-count') as HTMLInputElement
  const l1SpeedEl = controls.querySelector('#l1-speed') as HTMLInputElement
  const l1ShapeEl = controls.querySelector('#l1-shape') as HTMLInputElement
  const l1BrightEl = controls.querySelector('#l1-bright') as HTMLInputElement
  const l1FadeEl = controls.querySelector('#l1-fade') as HTMLInputElement
  const l1ColorREl = controls.querySelector('#l1-color-r') as HTMLInputElement
  const l1ColorGEl = controls.querySelector('#l1-color-g') as HTMLInputElement
  const l1ColorBEl = controls.querySelector('#l1-color-b') as HTMLInputElement
  const l1ColorAEl = controls.querySelector('#l1-color-a') as HTMLInputElement

  // Wire up Layer 2 controls
  const l2EnabledEl = controls.querySelector('#l2-enabled') as HTMLInputElement
  const l2WidthEl = controls.querySelector('#l2-width') as HTMLInputElement
  const l2CountEl = controls.querySelector('#l2-count') as HTMLInputElement
  const l2SpeedEl = controls.querySelector('#l2-speed') as HTMLInputElement
  const l2ShapeEl = controls.querySelector('#l2-shape') as HTMLInputElement
  const l2BrightEl = controls.querySelector('#l2-bright') as HTMLInputElement
  const l2FadeEl = controls.querySelector('#l2-fade') as HTMLInputElement
  const l2ColorREl = controls.querySelector('#l2-color-r') as HTMLInputElement
  const l2ColorGEl = controls.querySelector('#l2-color-g') as HTMLInputElement
  const l2ColorBEl = controls.querySelector('#l2-color-b') as HTMLInputElement
  const l2ColorAEl = controls.querySelector('#l2-color-a') as HTMLInputElement

  const getColorName = (r: number, g: number, b: number, a: number) => {
    if (a < 0.1) return 'off'
    if (r > 0.9 && g > 0.9 && b > 0.9) return 'white'
    if (r > 0.9 && g > 0.7 && b < 0.4) return 'yellow'
    if (r > 0.9 && g < 0.3 && b < 0.3) return 'red'
    if (r < 0.3 && g > 0.9 && b < 0.3) return 'green'
    if (r < 0.3 && g < 0.3 && b > 0.9) return 'blue'
    if (r > 0.9 && g < 0.5 && b > 0.9) return 'magenta'
    if (r < 0.3 && g > 0.9 && b > 0.9) return 'cyan'
    return `rgb`
  }

  const updateLayer1Display = () => {
    (controls.querySelector('#l1-width-val') as HTMLSpanElement).textContent = l1Width.toFixed(3)
    ;(controls.querySelector('#l1-count-val') as HTMLSpanElement).textContent = String(l1Count)
    ;(controls.querySelector('#l1-speed-val') as HTMLSpanElement).textContent = l1Speed.toFixed(2)
    ;(controls.querySelector('#l1-shape-val') as HTMLSpanElement).textContent = getShapeName(l1Shape)
    ;(controls.querySelector('#l1-bright-val') as HTMLSpanElement).textContent = l1Brightness.toFixed(1)
    ;(controls.querySelector('#l1-fade-val') as HTMLSpanElement).textContent = l1Fade.toFixed(2)
    ;(controls.querySelector('#l1-color-val') as HTMLSpanElement).textContent = getColorName(l1ColorR, l1ColorG, l1ColorB, l1ColorA)
  }

  const updateLayer2Display = () => {
    (controls.querySelector('#l2-width-val') as HTMLSpanElement).textContent = l2Width.toFixed(3)
    ;(controls.querySelector('#l2-count-val') as HTMLSpanElement).textContent = String(l2Count)
    ;(controls.querySelector('#l2-speed-val') as HTMLSpanElement).textContent = l2Speed.toFixed(2)
    ;(controls.querySelector('#l2-shape-val') as HTMLSpanElement).textContent = getShapeName(l2Shape)
    ;(controls.querySelector('#l2-bright-val') as HTMLSpanElement).textContent = l2Brightness.toFixed(1)
    ;(controls.querySelector('#l2-fade-val') as HTMLSpanElement).textContent = l2Fade.toFixed(2)
    ;(controls.querySelector('#l2-color-val') as HTMLSpanElement).textContent = getColorName(l2ColorR, l2ColorG, l2ColorB, l2ColorA)
  }

  const updateLayer1Controls = () => {
    l1EnabledEl.checked = l1Enabled
    l1WidthEl.value = String(l1Width)
    l1CountEl.value = String(l1Count)
    l1SpeedEl.value = String(l1Speed)
    l1ShapeEl.value = String(l1Shape)
    l1BrightEl.value = String(l1Brightness)
    l1FadeEl.value = String(l1Fade)
    l1ColorREl.value = String(l1ColorR)
    l1ColorGEl.value = String(l1ColorG)
    l1ColorBEl.value = String(l1ColorB)
    l1ColorAEl.value = String(l1ColorA)
    updateLayer1Display()
  }

  const updateLayer2Controls = () => {
    l2EnabledEl.checked = l2Enabled
    l2WidthEl.value = String(l2Width)
    l2CountEl.value = String(l2Count)
    l2SpeedEl.value = String(l2Speed)
    l2ShapeEl.value = String(l2Shape)
    l2BrightEl.value = String(l2Brightness)
    l2FadeEl.value = String(l2Fade)
    l2ColorREl.value = String(l2ColorR)
    l2ColorGEl.value = String(l2ColorG)
    l2ColorBEl.value = String(l2ColorB)
    l2ColorAEl.value = String(l2ColorA)
    updateLayer2Display()
  }

  const applyLayer1 = () => {
    graph.setConfig({
      linkFlow: l1Enabled,
      linkFlowPulseWidth: l1Width,
      linkFlowPulseCount: l1Count,
      linkFlowSpeed: l1Speed,
      linkFlowWaveShape: l1Shape,
      linkFlowBrightness: l1Brightness,
      linkFlowFade: l1Fade,
      linkFlowColor: [l1ColorR, l1ColorG, l1ColorB, l1ColorA]
    })
  }

  const applyLayer2 = () => {
    graph.setConfig({
      linkFlow2: l2Enabled,
      linkFlow2PulseWidth: l2Width,
      linkFlow2PulseCount: l2Count,
      linkFlow2Speed: l2Speed,
      linkFlow2WaveShape: l2Shape,
      linkFlow2Brightness: l2Brightness,
      linkFlow2Fade: l2Fade,
      linkFlow2Color: [l2ColorR, l2ColorG, l2ColorB, l2ColorA]
    })
  }

  // Layer 1 event listeners
  l1EnabledEl.addEventListener('change', () => { l1Enabled = l1EnabledEl.checked; applyLayer1() })
  l1WidthEl.addEventListener('input', () => { l1Width = parseFloat(l1WidthEl.value); updateLayer1Display(); applyLayer1() })
  l1CountEl.addEventListener('input', () => { l1Count = parseInt(l1CountEl.value); updateLayer1Display(); applyLayer1() })
  l1SpeedEl.addEventListener('input', () => { l1Speed = parseFloat(l1SpeedEl.value); updateLayer1Display(); applyLayer1() })
  l1ShapeEl.addEventListener('input', () => { l1Shape = parseFloat(l1ShapeEl.value); updateLayer1Display(); applyLayer1() })
  l1BrightEl.addEventListener('input', () => { l1Brightness = parseFloat(l1BrightEl.value); updateLayer1Display(); applyLayer1() })
  l1FadeEl.addEventListener('input', () => { l1Fade = parseFloat(l1FadeEl.value); updateLayer1Display(); applyLayer1() })
  l1ColorREl.addEventListener('input', () => { l1ColorR = parseFloat(l1ColorREl.value); updateLayer1Display(); applyLayer1() })
  l1ColorGEl.addEventListener('input', () => { l1ColorG = parseFloat(l1ColorGEl.value); updateLayer1Display(); applyLayer1() })
  l1ColorBEl.addEventListener('input', () => { l1ColorB = parseFloat(l1ColorBEl.value); updateLayer1Display(); applyLayer1() })
  l1ColorAEl.addEventListener('input', () => { l1ColorA = parseFloat(l1ColorAEl.value); updateLayer1Display(); applyLayer1() })

  // Layer 2 event listeners
  l2EnabledEl.addEventListener('change', () => { l2Enabled = l2EnabledEl.checked; applyLayer2() })
  l2WidthEl.addEventListener('input', () => { l2Width = parseFloat(l2WidthEl.value); updateLayer2Display(); applyLayer2() })
  l2CountEl.addEventListener('input', () => { l2Count = parseInt(l2CountEl.value); updateLayer2Display(); applyLayer2() })
  l2SpeedEl.addEventListener('input', () => { l2Speed = parseFloat(l2SpeedEl.value); updateLayer2Display(); applyLayer2() })
  l2ShapeEl.addEventListener('input', () => { l2Shape = parseFloat(l2ShapeEl.value); updateLayer2Display(); applyLayer2() })
  l2BrightEl.addEventListener('input', () => { l2Brightness = parseFloat(l2BrightEl.value); updateLayer2Display(); applyLayer2() })
  l2FadeEl.addEventListener('input', () => { l2Fade = parseFloat(l2FadeEl.value); updateLayer2Display(); applyLayer2() })
  l2ColorREl.addEventListener('input', () => { l2ColorR = parseFloat(l2ColorREl.value); updateLayer2Display(); applyLayer2() })
  l2ColorGEl.addEventListener('input', () => { l2ColorG = parseFloat(l2ColorGEl.value); updateLayer2Display(); applyLayer2() })
  l2ColorBEl.addEventListener('input', () => { l2ColorB = parseFloat(l2ColorBEl.value); updateLayer2Display(); applyLayer2() })
  l2ColorAEl.addEventListener('input', () => { l2ColorA = parseFloat(l2ColorAEl.value); updateLayer2Display(); applyLayer2() })

  // Presets
  controls.querySelector('#preset-particles')?.addEventListener('click', () => {
    l1Enabled = true; l1Width = 0.015; l1Count = 5; l1Speed = 0.2; l1Shape = 1.0
    l1Brightness = 2.5; l1Fade = 0.6; l1ColorR = 1; l1ColorG = 1; l1ColorB = 1; l1ColorA = 0
    l2Enabled = false
    updateLayer1Controls(); updateLayer2Controls(); applyLayer1(); applyLayer2()
  })

  controls.querySelector('#preset-waves')?.addEventListener('click', () => {
    l1Enabled = true; l1Width = 0.5; l1Count = 1; l1Speed = 0.08; l1Shape = 1.0
    l1Brightness = 1.5; l1Fade = 0.2; l1ColorR = 1; l1ColorG = 1; l1ColorB = 1; l1ColorA = 0
    l2Enabled = false
    updateLayer1Controls(); updateLayer2Controls(); applyLayer1(); applyLayer2()
  })

  controls.querySelector('#preset-data-stream')?.addEventListener('click', () => {
    l1Enabled = true; l1Width = 0.1; l1Count = 3; l1Speed = 0.3; l1Shape = 0.5
    l1Brightness = 2.0; l1Fade = 0.4; l1ColorR = 0; l1ColorG = 1; l1ColorB = 0.8; l1ColorA = 0.7
    l2Enabled = false
    updateLayer1Controls(); updateLayer2Controls(); applyLayer1(); applyLayer2()
  })

  controls.querySelector('#preset-sparks')?.addEventListener('click', () => {
    l1Enabled = false
    l2Enabled = true; l2Width = 0.02; l2Count = 6; l2Speed = 1.2; l2Shape = 0.0
    l2Brightness = 4.0; l2Fade = 0.0; l2ColorR = 1; l2ColorG = 0.8; l2ColorB = 0; l2ColorA = 1.0
    updateLayer1Controls(); updateLayer2Controls(); applyLayer1(); applyLayer2()
  })

  controls.querySelector('#preset-warning')?.addEventListener('click', () => {
    l1Enabled = true; l1Width = 0.15; l1Count = 2; l1Speed = 0.5; l1Shape = 0.0
    l1Brightness = 3.0; l1Fade = 0.5; l1ColorR = 1; l1ColorG = 0.2; l1ColorB = 0.1; l1ColorA = 0.9
    l2Enabled = false
    updateLayer1Controls(); updateLayer2Controls(); applyLayer1(); applyLayer2()
  })

  controls.querySelector('#preset-dual')?.addEventListener('click', () => {
    // Layer 1: Slow red background pulse
    l1Enabled = true; l1Width = 0.4; l1Count = 1; l1Speed = 0.1; l1Shape = 1.0
    l1Brightness = 1.3; l1Fade = 0.2; l1ColorR = 1; l1ColorG = 0.3; l1ColorB = 0.3; l1ColorA = 0.5
    // Layer 2: Fast yellow sparks on top
    l2Enabled = true; l2Width = 0.02; l2Count = 4; l2Speed = 0.8; l2Shape = 0.5
    l2Brightness = 3.5; l2Fade = 0.0; l2ColorR = 1; l2ColorG = 1; l2ColorB = 0.3; l2ColorA = 0.95
    updateLayer1Controls(); updateLayer2Controls(); applyLayer1(); applyLayer2()
  })

  return container
}

// Helper: HSL to RGB conversion
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return [r, g, b]
}
