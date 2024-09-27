'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner' // Import toast from sonner
import { Cog } from 'lucide-react' // Import the cog icon

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button' // Import button component

export function OpenAIPromptSettings() {
  // State to manage the input value
  const [apiKey, setApiKey] = useState<string>('')

  // Load the saved API key from sessionStorage when the component mounts
  useEffect(() => {
    const savedApiKey = sessionStorage.getItem('openaiKey')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  // Save the API key to sessionStorage
  const saveApiKey = () => {
    if (apiKey) {
      sessionStorage.setItem('OPENAI_API_KEY', apiKey)
      toast.success('OpenAI key saved successfully!', { duration: 1000 })
    }
  }

  return (
    <div className="pl-4 flex items-center space-x-4">
      {/* Ghost Button with Cog Icon */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2">
            <Cog className="h-4 w-4" strokeWidth={1} />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OpenAI API Key</DialogTitle>
            <DialogDescription>
              Bitte geben Sie Ihren OpenAI API-Schlüssel ein:
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            className="w-full mt-2 p-2 border rounded-md"
            placeholder="Ihr OpenAI API-Schlüssel"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <Button className="mt-4" onClick={saveApiKey}>
            Speichern
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
