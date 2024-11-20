import { useEditor } from '@/providers/agent-provider'
import React, { CSSProperties } from 'react'
import { Handle, HandleProps } from '@xyflow/react'

type Props = HandleProps & { style?: CSSProperties }

const selector = (s: any) => ({
  nodeInternals: s.nodeInternals,
  edges: s.edges,
})

const CustomHandle = (props: Props) => {
  const { state } = useEditor()

  const allowedDataSources = ['File Upload', 'URL Scraper', 'Wikipedia']
  const allowedTargets = ['Pinecone', 'Qdrant']

  const isValidConnection = (e: { source: string; target: string }) => {
    const sourceNode = state.editor.elements.find((node) => node.id === e.source)
    const targetNode = state.editor.elements.find((node) => node.id === e.target)

    if (sourceNode?.type && targetNode?.type && allowedDataSources.includes(sourceNode.type) && allowedTargets.includes(targetNode.type)) {
      // Check if the connection already exists
      const existingConnections = state.editor.edges.filter(
        (edge) => edge.source === e.source && edge.target === e.target
      )
      if (existingConnections.length === 0) return true
    }

    // Allow connections from Condition nodes
    if (sourceNode?.type === 'Condition') return true

    // Allow connections if the source node has no existing connections
    const sourcesFromHandleInState = state.editor.edges.filter(
      (edge) => edge.source === e.source
    ).length
    if (sourcesFromHandleInState < 1) return true

    return false
  }

  return (
    <Handle
      {...props}
      isValidConnection={isValidConnection}
      className="!-bottom-2 !h-4 !w-4 dark:bg-neutral-800"
    />
  )
}

export default CustomHandle