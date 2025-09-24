"use client"

interface PortfolioInputProps {
  solAmount: string
  usdcAmount: string
  setSolAmount: (value: string) => void
  setUsdcAmount: (value: string) => void
}

export default function PortfolioInput({ solAmount, usdcAmount, setSolAmount, setUsdcAmount }: PortfolioInputProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <h2 className="font-bold text-gray-800">Inserir Portfólio</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sol" className="block text-sm font-medium text-gray-600 mb-1">
              Quantidade de SOL
            </label>
            <input
              type="number"
              id="sol"
              value={solAmount}
              onChange={(e) => setSolAmount(e.target.value)}
              placeholder="Ex: 10.5"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="usdc" className="block text-sm font-medium text-gray-600 mb-1">
              Quantidade de USDC
            </label>
            <input
              type="number"
              id="usdc"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              placeholder="Ex: 1500"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
