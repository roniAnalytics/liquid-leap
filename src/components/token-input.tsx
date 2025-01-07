import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCallback, useState, useRef } from "react"

interface TokenInputProps {
  label: string
  balance: string
  token: string
  tokenIcon: string
  amount: number
  setAmount: (amount: number) => void
}

export function TokenInput({ label, balance, token, tokenIcon, amount, setAmount }: TokenInputProps) {
  const [localValue, setLocalValue] = useState(amount.toString())
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalValue(value)
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setAmount(Number(value) || 0)
    }, 600)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between mb-2">
        <div className="text-sm">{label}</div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Balance: {balance} {token}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Input 
          type="number" 
          placeholder="0.0" 
          className="flex-grow" 
          value={localValue}
          onChange={handleChange}
        />
        <Button variant="outline" className="sm:min-w-[80px]">
          {tokenIcon} {token}
        </Button>
      </div>
    </div>
  )
}

