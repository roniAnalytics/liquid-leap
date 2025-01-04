import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TokenInputProps {
  label: string
  balance: string
  token: string
  tokenIcon: string
  amount: number
  setAmount: (amount: number) => void
}

export function TokenInput({ label, balance, token, tokenIcon, amount, setAmount }: TokenInputProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between mb-2">
        <div className="text-sm">{label}</div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Balance: {balance}</div>
      </div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Input type="number" placeholder="0.0" className="flex-grow" value={amount.toString()} onChange={(e) => setAmount(Number(e.target.value))} />
        <Button variant="outline" className="sm:min-w-[80px]">
          {tokenIcon} {token}
        </Button>
      </div>
    </div>
  )
}

