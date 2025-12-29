import type { Meta, StoryObj } from '@storybook/html'

import { flowDemo } from './flow-demo/flow-demo'

import flowDemoRaw from './flow-demo/flow-demo?raw'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta = {
  title: 'Examples/Flow Animation',
}

type Story = StoryObj

export const FlowDemo: Story = {
  render: () => flowDemo(),
  parameters: {
    sourceCode: [
      { name: 'Story', code: flowDemoRaw },
    ],
  },
}

// eslint-disable-next-line import/no-default-export
export default meta
