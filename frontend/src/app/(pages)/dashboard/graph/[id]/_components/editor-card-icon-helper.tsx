'use client'
import React from 'react'
import {
  BookOpenText,
  Calendar,
  CircuitBoard,
  Container,
  Database,
  DatabaseZap,
  GitBranch,
  HardDrive,
  Mail,
  MousePointerClickIcon,
  Plus,
  Slack,
  Timer,
  Webhook,
  Zap,
} from 'lucide-react'
import { EditorCanvasTypes } from '@/lib/types'

type Props = { type: EditorCanvasTypes }

const EditorCanvasIconHelper = ({ type }: Props) => {
  switch (type) {
    case 'Email':
      return (
        <Mail
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'Wikipedia Search':
      return (
        <BookOpenText
          className="text-white flex-shrink-0"
          size={30}
        />
      )

    case 'Condition':
      return (
        <GitBranch
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'GPT-4':
    case 'GPT-3.5':
    case 'Custom LLM':
      return (
        <CircuitBoard
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'Pinecone':
    case 'Qdrant':
      return (
        <DatabaseZap className="text-white flex-shrink-0"
          size={30}/>
      )
    case "SQL DB":
      return <Database
      className="text-white flex-shrink-0"
      size={30}
    />
    case 'Email':
      return (
        <HardDrive
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'Notion':
      return (
        <Database
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'Google Calendar':
      return (
        <Calendar
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'Trigger':
      return (
        <MousePointerClickIcon
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'Action':
      return (
        <Zap
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'Wait':
      return (
        <Timer
          className="text-white flex-shrink-0"
          size={30}
        />
      )
    case 'Docker':
      return (
        <Container 
        className="text-white flex-shrink-0"
        size={30}
        />
      )
    case 'Webhook':
      return (
        <Webhook 
        className="text-white flex-shrink-0"
        size={30}
        />
      )
    default:
      return (
        <Zap
          className="text-white flex-shrink-0"
          size={30}
        />
      )
  }
}

export default EditorCanvasIconHelper