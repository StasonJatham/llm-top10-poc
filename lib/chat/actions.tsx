import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage
} from '@/components/stocks'

import { z } from 'zod'
import { sleep, nanoid } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { createOpenAI } from '@ai-sdk/openai'

interface SubmitUserMessageParams {
  content: string // The user's message content
  topic: string // The selected OWASP topic
  mode: string // The secure or insecure mode
  apiKey?: string // The optional OpenAI API key
}

async function submitUserMessage(data: SubmitUserMessageParams) {
  'use server'

  const { content, topic, mode, apiKey } = data

  const openaiKey = apiKey || process.env.OPENAI_API_KEY

  if (!openaiKey) {
    throw new Error('API key is missing. Please provide an OpenAI API key.')
  }

  const openai = createOpenAI({
    compatibility: 'strict',
    apiKey
  })
  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content: content.trim()
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const systemPrompts: Record<string, string> = {
    llm01_secure: ``,
    llm02_secure: ``,
    llm03_secure: ``,
    llm04_secure: ``,
    llm05_secure: ``,
    llm06_secure: ``,
    llm07_secure: ``,
    llm08_secure: ``,
    llm09_secure: ``,
    llm10_secure: ``,
    llm01_insecure: ``,
    llm02_insecure: ``,
    llm03_insecure: ``,
    llm04_insecure: ``,
    llm05_insecure: ``,
    llm06_insecure: ``,
    llm07_insecure: ``,
    llm08_insecure: ``,
    llm09_insecure: ``,
    llm10_insecure: ``,
    default: `Help me figure out stuff.`
  }

  const selectedSystemPrompt =
    systemPrompts[`${topic}${mode === 'true' ? '_secure' : '_insecure'}`] ||
    systemPrompts['default']

  const result = await streamUI({
    model: openai('gpt-4o-mini'),
    initial: <SpinnerMessage />,
    system: selectedSystemPrompt,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state, done }) => {
    'use server'

    if (!done) return

    const session = await auth()

    if (!session || !session.user) return

    const { chatId, messages } = state
    const createdAt = new Date()
    const userId = session.user.id as string
    const path = `/chat/${chatId}`

    const firstMessageContent = messages[0].content as string
    const title = firstMessageContent.substring(0, 100)

    const chat: Chat = {
      id: chatId,
      title,
      userId,
      createdAt,
      messages,
      path
    }

    await saveChat(chat)
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  const messages =
    typeof aiState.messages === 'string'
      ? JSON.parse(aiState.messages)
      : aiState.messages

  return messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
