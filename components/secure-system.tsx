'use client'

import { Switch } from '@/components/ui/switch'
import { useState, useEffect } from 'react'
import { toast } from 'sonner' // Import toast from sonner
import { CheckCircle, AlertCircle } from 'lucide-react' // Import icons
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip' // Import tooltip

export function SecureSystem() {
  // Initialize state as unsafe by default
  const [isSecure, setIsSecure] = useState(false)

  // Load the saved state from localStorage when the component mounts
  useEffect(() => {
    const savedState = localStorage.getItem('secureSystem')
    if (savedState === 'true') {
      setIsSecure(true)
    } else {
      setIsSecure(false) // Explicitly set to unsafe if not found in localStorage
      localStorage.setItem('secureSystem', 'false') // Save the initial state as 'false'
    }
  }, [])

  // Update localStorage and show toast whenever the state changes
  const handleSwitchChange = (checked: boolean) => {
    setIsSecure(checked)
    localStorage.setItem('secureSystem', checked.toString())

    toast(
      checked ? (
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span>Sicherer Modus aktiviert</span>
        </div>
      ) : (
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span>Unsicherer Modus aktiviert</span>
        </div>
      ),
      {
        duration: 1000
      }
    )
  }

  return (
    <div className="pl-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Switch checked={isSecure} onCheckedChange={handleSwitchChange} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isSecure ? 'Sicherer Modus' : 'Unsicherer Modus'}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
