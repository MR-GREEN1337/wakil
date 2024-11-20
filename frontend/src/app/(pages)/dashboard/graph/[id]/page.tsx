import EditorProvider from '@/providers/agent-provider'
import React from 'react'
import EditorCanvas from './_components/editor-canvas'
import { ReactFlowProvider } from '@xyflow/react'

type Props = {}

const Graph = (props: Props) => {
  return (
    <EditorProvider>
      <ReactFlowProvider>
    <EditorCanvas />
    </ReactFlowProvider>
    </EditorProvider>
  )
}

export default Graph