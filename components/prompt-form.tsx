'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { useActions, useUIState } from 'ai/rsc'
import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { SendHorizontal } from 'lucide-react'

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

  const [selectedOwasp, setSelectedOwasp] = React.useState('default')
  const [selectedMode, setSelectedMode] = React.useState('false')
  const [openaiKey, setOpenaiKey] = React.useState('')

  React.useEffect(() => {
    const storedOwasp = localStorage.getItem('selectedOWASP') || 'default'
    const storedMode = localStorage.getItem('secureSystem') || 'false'
    const storedApiKey = sessionStorage.getItem('OPENAI_API_KEY') || 'none'

    setSelectedOwasp(storedOwasp)
    setSelectedMode(storedMode)
    setOpenaiKey(storedApiKey)
  }, [])

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()

        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }

        const value = input.trim()
        setInput('')
        if (!value) return

        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>
          }
        ])

        const data = {
          content: value,
          topic: selectedOwasp,
          mode: selectedMode,
          openaiKey: openaiKey
        }

        console.log(data)
        const responseMessage = await submitUserMessage(data)
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }}
    >
      <div className="relative flex max-h-60 w-full focus-within:border-blue-600 grow flex-col overflow-hidden bg-background px-2 sm:rounded-md sm:border">
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="KarlGPT Nachricht senden"
          className="min-h-[60px] w-full resize-none bg-transparent p-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={input === ''}
              >
                <SendHorizontal className="h-4 w-4  text-black dark:text-white" />
                <span className="sr-only">KarlGPT Nachricht senden</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>KarlGPT Nachricht senden</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
