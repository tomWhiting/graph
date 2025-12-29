import type { Meta } from '@storybook/html'
import { CosmosStoryProps } from '@/graph/stories/create-cosmos'
import { createStory, Story } from '@/graph/stories/create-story'
import { contoursDemo } from './contours/contours-demo'

import createCosmosRaw from './create-cosmos?raw'
import generateMeshDataRaw from './generate-mesh-data?raw'
import contoursDemoStoryRaw from './contours/contours-demo?raw'
import contoursDemoStyleRaw from './contours/contours-demo/style.css?raw'

const meta: Meta<CosmosStoryProps> = {
  title: 'Examples/Contours',
  parameters: {
    controls: {
      disable: true,
    },
  },
}

const sourceCodeAddonParams = [
  { name: 'create-cosmos', code: createCosmosRaw },
  { name: 'generate-mesh-data', code: generateMeshDataRaw },
]

export const ContoursDemo: Story = {
  ...createStory(contoursDemo),
  parameters: {
    sourceCode: [
      { name: 'Story', code: contoursDemoStoryRaw },
      ...sourceCodeAddonParams,
      { name: 'style.css', code: contoursDemoStyleRaw },
    ],
  },
}

// eslint-disable-next-line import/no-default-export
export default meta
