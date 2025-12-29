import { Graph, GRADIENT_CONTOUR_LEVELS } from '@cosmos.gl/graph'
import './style.css'

// Cluster color palette
const CLUSTER_COLORS = [
  { main: '#e41a1c', light: 'rgba(228, 26, 28, 0.4)' },   // Red
  { main: '#377eb8', light: 'rgba(55, 126, 184, 0.4)' },  // Blue
  { main: '#4daf4a', light: 'rgba(77, 175, 74, 0.4)' },   // Green
  { main: '#984ea3', light: 'rgba(152, 78, 163, 0.4)' },  // Purple
]

/**
 * Generate clustered data with clear separation
 */
function generateClusteredGraph(nClusters: number, nodesPerCluster: number) {
  const totalNodes = nClusters * nodesPerCluster
  const spaceSize = 4096

  const pointPositions = new Float32Array(totalNodes * 2)
  const pointColors = new Float32Array(totalNodes * 4)
  const links: number[] = []
  const clusterIndices: number[][] = Array.from({ length: nClusters }, () => [])

  // Place clusters in a circle around the center
  const clusterRadius = spaceSize * 0.3

  for (let c = 0; c < nClusters; c++) {
    const clusterAngle = (c / nClusters) * Math.PI * 2
    const clusterCenterX = spaceSize / 2 + Math.cos(clusterAngle) * clusterRadius
    const clusterCenterY = spaceSize / 2 + Math.sin(clusterAngle) * clusterRadius

    const color = CLUSTER_COLORS[c % CLUSTER_COLORS.length]!
    const r = parseInt(color.main.slice(1, 3), 16)
    const g = parseInt(color.main.slice(3, 5), 16)
    const b = parseInt(color.main.slice(5, 7), 16)

    for (let p = 0; p < nodesPerCluster; p++) {
      const idx = c * nodesPerCluster + p

      // Spread nodes within cluster
      const nodeAngle = Math.random() * Math.PI * 2
      const nodeDist = Math.random() * 200 * Math.sqrt(Math.random())

      pointPositions[idx * 2] = clusterCenterX + Math.cos(nodeAngle) * nodeDist
      pointPositions[idx * 2 + 1] = clusterCenterY + Math.sin(nodeAngle) * nodeDist

      pointColors[idx * 4] = r
      pointColors[idx * 4 + 1] = g
      pointColors[idx * 4 + 2] = b
      pointColors[idx * 4 + 3] = 255

      clusterIndices[c]!.push(idx)

      // Create links within cluster
      if (p > 0 && Math.random() > 0.3) {
        const targetP = Math.floor(Math.random() * p)
        links.push(idx, c * nodesPerCluster + targetP)
      }
    }
  }

  // Add some inter-cluster links
  for (let i = 0; i < nClusters * 3; i++) {
    const c1 = Math.floor(Math.random() * nClusters)
    const c2 = (c1 + 1) % nClusters
    const p1 = Math.floor(Math.random() * nodesPerCluster)
    const p2 = Math.floor(Math.random() * nodesPerCluster)
    links.push(c1 * nodesPerCluster + p1, c2 * nodesPerCluster + p2)
  }

  return {
    pointPositions,
    pointColors,
    links: new Float32Array(links),
    clusterIndices,
  }
}

export const contoursDemo = (): { graph: Graph; div: HTMLDivElement } => {
  const div = document.createElement('div')
  div.className = 'app'

  const graphDiv = document.createElement('div')
  graphDiv.className = 'graph'
  div.appendChild(graphDiv)

  const controlsDiv = document.createElement('div')
  controlsDiv.className = 'controls'
  div.appendChild(controlsDiv)

  const controlsHeader = document.createElement('div')
  controlsHeader.className = 'controls-header'
  controlsHeader.textContent = 'Contours Demo'
  controlsDiv.appendChild(controlsHeader)

  // Generate simple clustered data - 4 clusters, 25 nodes each = 100 nodes
  const nClusters = 4
  const nodesPerCluster = 25
  const data = generateClusteredGraph(nClusters, nodesPerCluster)

  const graph = new Graph(graphDiv, {
    spaceSize: 4096,
    backgroundColor: '#1a1a2e',
    pointDefaultSize: 8,
    linkDefaultWidth: 1,
    linkDefaultColor: 'rgba(255, 255, 255, 0.3)',
    scalePointsOnZoom: true,
    simulationRepulsion: 2,
    simulationGravity: 0.05,
    simulationLinkSpring: 0.5,
    enableDrag: true,
    fitViewOnInit: true,
  })

  graph.setPointPositions(data.pointPositions)
  graph.setPointColors(data.pointColors)
  graph.setLinks(data.links)

  // Set up contour groups
  let currentRadius = 300

  // All node indices for merged mode
  const allIndices = Array.from({ length: nClusters * nodesPerCluster }, (_, i) => i)

  function updateContours(mode: 'simple' | 'gradient' | 'metaballs' | 'merged' | 'nested') {
    // Clear all groups first
    graph.clearContourGroups()

    if (mode === 'merged') {
      // TRUE METABALL MERGE: All nodes in one group
      graph.setContourGroup('all-nodes', {
        pointIndices: allIndices,
        radius: currentRadius,
        levels: [
          { threshold: 0.8, color: 'rgba(255, 255, 255, 0.9)' },
          { threshold: 0.5, color: 'rgba(200, 150, 255, 0.6)' },
          { threshold: 0.3, color: 'rgba(100, 100, 255, 0.3)' },
          { threshold: 0.15, color: 'rgba(50, 50, 200, 0.15)' },
        ],
        border: { color: '#8866ff', thickness: 2 },
      })
      return
    }

    if (mode === 'nested') {
      // NESTED CONTAINERS: Parent group encompasses children
      // Draw parent first (behind) - encompasses ALL nodes
      graph.setContourGroup('parent-container', {
        pointIndices: allIndices,
        radius: currentRadius * 1.5,
        levels: [
          { threshold: 0.2, color: 'rgba(100, 100, 120, 0.15)' },
        ],
        border: { color: 'rgba(150, 150, 180, 0.5)', thickness: 2 },
      })

      // Then draw child groups on top with brighter colors
      for (let c = 0; c < nClusters; c++) {
        const color = CLUSTER_COLORS[c % CLUSTER_COLORS.length]!
        const indices = data.clusterIndices[c]!

        graph.setContourGroup(`child-${c}`, {
          pointIndices: indices,
          radius: currentRadius * 0.8,
          levels: [{ threshold: 0.4, color: color.light }],
          border: { color: color.main, thickness: 2 },
        })
      }
      return
    }

    // Per-cluster modes
    for (let c = 0; c < nClusters; c++) {
      const color = CLUSTER_COLORS[c % CLUSTER_COLORS.length]!
      const indices = data.clusterIndices[c]!

      const r = parseInt(color.main.slice(1, 3), 16)
      const g = parseInt(color.main.slice(3, 5), 16)
      const b = parseInt(color.main.slice(5, 7), 16)

      if (mode === 'simple') {
        graph.setContourGroup(`cluster-${c}`, {
          pointIndices: indices,
          radius: currentRadius,
          levels: [{ threshold: 0.5, color: color.light }],
          border: { color: color.main, thickness: 3 },
        })
      } else if (mode === 'gradient') {
        graph.setContourGroup(`cluster-${c}`, {
          pointIndices: indices,
          radius: currentRadius,
          levels: GRADIENT_CONTOUR_LEVELS.map((level, i) => ({
            ...level,
            color: `rgba(${r}, ${g}, ${b}, ${0.1 + i * 0.08})`,
          })),
        })
      } else {
        graph.setContourGroup(`cluster-${c}`, {
          pointIndices: indices,
          radius: currentRadius,
          levels: [{ threshold: 0.3, color: `rgba(${r}, ${g}, ${b}, 0.5)` }],
        })
      }
    }
  }

  updateContours('simple')
  graph.render()
  graph.start()

  // Controls
  let contoursEnabled = true
  let currentMode: 'simple' | 'gradient' | 'metaballs' | 'merged' | 'nested' = 'simple'

  const toggleContoursBtn = document.createElement('div')
  toggleContoursBtn.className = 'control-btn active'
  toggleContoursBtn.textContent = 'Contours: ON'
  toggleContoursBtn.addEventListener('click', () => {
    contoursEnabled = !contoursEnabled
    graph.setContoursConfig({ enabled: contoursEnabled })
    toggleContoursBtn.textContent = contoursEnabled ? 'Contours: ON' : 'Contours: OFF'
    toggleContoursBtn.className = contoursEnabled ? 'control-btn active' : 'control-btn'
  })
  controlsDiv.appendChild(toggleContoursBtn)

  const modeButtons: HTMLDivElement[] = []

  const mergedBtn = document.createElement('div')
  mergedBtn.className = 'control-btn'
  mergedBtn.textContent = '🫧 Merged Metaballs'
  mergedBtn.addEventListener('click', () => {
    currentMode = 'merged'
    modeButtons.forEach(b => b.className = 'control-btn')
    mergedBtn.className = 'control-btn active'
    updateContours('merged')
  })
  controlsDiv.appendChild(mergedBtn)
  modeButtons.push(mergedBtn)

  const nestedBtn = document.createElement('div')
  nestedBtn.className = 'control-btn'
  nestedBtn.textContent = '📦 Nested Containers'
  nestedBtn.addEventListener('click', () => {
    currentMode = 'nested'
    modeButtons.forEach(b => b.className = 'control-btn')
    nestedBtn.className = 'control-btn active'
    updateContours('nested')
  })
  controlsDiv.appendChild(nestedBtn)
  modeButtons.push(nestedBtn)

  const simpleBtn = document.createElement('div')
  simpleBtn.className = 'control-btn active'
  simpleBtn.textContent = 'Per-Cluster + Borders'
  simpleBtn.addEventListener('click', () => {
    currentMode = 'simple'
    modeButtons.forEach(b => b.className = 'control-btn')
    simpleBtn.className = 'control-btn active'
    updateContours('simple')
  })
  controlsDiv.appendChild(simpleBtn)
  modeButtons.push(simpleBtn)

  const gradientBtn = document.createElement('div')
  gradientBtn.className = 'control-btn'
  gradientBtn.textContent = 'Gradient Levels'
  gradientBtn.addEventListener('click', () => {
    currentMode = 'gradient'
    modeButtons.forEach(b => b.className = 'control-btn')
    gradientBtn.className = 'control-btn active'
    updateContours('gradient')
  })
  controlsDiv.appendChild(gradientBtn)
  modeButtons.push(gradientBtn)

  const metaballsBtn = document.createElement('div')
  metaballsBtn.className = 'control-btn'
  metaballsBtn.textContent = 'Per-Cluster Blobs'
  metaballsBtn.addEventListener('click', () => {
    currentMode = 'metaballs'
    modeButtons.forEach(b => b.className = 'control-btn')
    metaballsBtn.className = 'control-btn active'
    updateContours('metaballs')
  })
  controlsDiv.appendChild(metaballsBtn)
  modeButtons.push(metaballsBtn)

  const radiusLabel = document.createElement('div')
  radiusLabel.className = 'control-label'
  radiusLabel.textContent = 'Radius: 300'
  controlsDiv.appendChild(radiusLabel)

  const radiusSlider = document.createElement('input')
  radiusSlider.type = 'range'
  radiusSlider.min = '50'
  radiusSlider.max = '600'
  radiusSlider.value = '300'
  radiusSlider.className = 'control-slider'
  radiusSlider.addEventListener('input', () => {
    currentRadius = parseInt(radiusSlider.value, 10)
    radiusLabel.textContent = `Radius: ${currentRadius}`
    updateContours(currentMode)
  })
  controlsDiv.appendChild(radiusSlider)

  const pauseBtn = document.createElement('div')
  pauseBtn.className = 'control-btn'
  pauseBtn.textContent = 'Pause Simulation'
  let isPaused = false
  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused
    if (isPaused) {
      graph.pause()
      pauseBtn.textContent = 'Resume Simulation'
    } else {
      graph.start()
      pauseBtn.textContent = 'Pause Simulation'
    }
  })
  controlsDiv.appendChild(pauseBtn)

  // Debug info
  const debugDiv = document.createElement('div')
  debugDiv.className = 'control-label'
  debugDiv.style.marginTop = '20px'
  debugDiv.style.fontSize = '9pt'
  debugDiv.style.opacity = '0.7'
  debugDiv.innerHTML = `${nClusters} clusters × ${nodesPerCluster} nodes = ${nClusters * nodesPerCluster} total<br>Drag nodes to see contours update`
  controlsDiv.appendChild(debugDiv)

  return { div, graph }
}
