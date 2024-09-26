'use client' // Make this a client component

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function SelectOWASP() {
  const [selectedValue, setSelectedValue] = useState('')

  // Load the saved value from localStorage when the component mounts
  useEffect(() => {
    const savedValue = localStorage.getItem('selectedOWASP')
    if (savedValue) {
      setSelectedValue(savedValue)
    }
  }, [])

  // Save the selected value to localStorage whenever it changes
  const handleValueChange = (value: string) => {
    setSelectedValue(value)
    localStorage.setItem('selectedOWASP', value)
  }

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="OWASP Top 10" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="llm01">LLM01: Prompt Injection</SelectItem>
          <SelectItem value="llm02">LLM02: Insecure Output Handling</SelectItem>
          <SelectItem value="llm03">LLM03: Training Data Poisoning</SelectItem>
          <SelectItem value="llm04">LLM04: Model Denial of Service</SelectItem>
          <SelectItem value="llm05">
            LLM05: Supply Chain Vulnerabilities
          </SelectItem>
          <SelectItem value="llm06">
            LLM06: Sensitive Information Disclosure
          </SelectItem>
          <SelectItem value="llm07">LLM07: Insecure Plugin Design</SelectItem>
          <SelectItem value="llm08">LLM08: Excessive Agency</SelectItem>
          <SelectItem value="llm09">LLM09: Overreliance</SelectItem>
          <SelectItem value="llm10">LLM10: Model Theft</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
