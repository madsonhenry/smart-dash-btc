"use client"

interface DashboardData {
  currentBtcValue: number // Changed from currentSolValue
  currentUsdcValue: number
  totalValue: number
  currentBtcPercentage: number // Changed from currentSolPercentage
  targetBtcPercentage: number // Changed from targetSolPercentage
  targetBtcValue: number // Changed from targetSolValue
  targetUsdcValue: number
  action: "BUY" | "SELL" | "HOLD"
  amountToTradeUsd: number
  amountToTradeBtc: number // Changed from amountToTradeSol
}

interface DashboardProps {
  data: DashboardData | null
  btcPrice: number | null // Changed from solPrice to btcPrice
  isLoading: boolean
  allocationRules: Array<{ minPrice: number; maxPrice: number; btcTarget: number }> // Changed from solTarget to btcTarget
}

// Helper para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

// Helper para formatar porcentagem
const formatPercent = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
  }).format(value)
}

export default function Dashboard({ data, btcPrice, isLoading, allocationRules }: DashboardProps) {
  // Changed from solPrice to btcPrice
  if (isLoading) {
    return <div className="text-center text-blue-600">Buscando preço do BTC...</div> // Changed from SOL to BTC
  }

  if (!btcPrice || !data || data.totalValue === 0) {
    // Changed from solPrice to btcPrice
    return (
      <div className="text-center bg-white p-6 rounded-lg shadow-sm border">
        <p className="text-gray-500">Insira as quantidades do seu portfólio para começar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card: Alocação Atual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Portfolio Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="bg-blue-100 px-4 py-2 border-b">
            <h3 className="font-bold text-gray-800">PORTFOLIO INTELIGENTE</h3>
          </div>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600"></th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">USD</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">BTC</td> {/* Changed from SOL to BTC */}
                  <td className="py-2 text-right font-mono">{Math.round(data.currentBtcValue)}</td>{" "}
                  {/* Changed from currentSolValue to currentBtcValue */}
                  <td className="py-2 text-right">{(data.currentBtcPercentage * 100).toFixed(2)}%</td>{" "}
                  {/* Changed from currentSolPercentage to currentBtcPercentage */}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">USDC</td>
                  <td className="py-2 text-right font-mono">{Math.round(data.currentUsdcValue)}</td>
                  <td className="py-2 text-right">{((1 - data.currentBtcPercentage) * 100).toFixed(2)}%</td>{" "}
                  {/* Changed from currentSolPercentage to currentBtcPercentage */}
                </tr>
                <tr className="font-bold">
                  <td className="py-2">TOTAL</td>
                  <td className="py-2 text-right font-mono">{Math.round(data.totalValue)}</td>
                  <td className="py-2 text-right">100.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* New Allocation Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="bg-yellow-200 px-4 py-2 border-b">
            <h3 className="font-bold text-gray-800">NOVA ALOCAÇÃO</h3>
          </div>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600"></th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">USD</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">BTC</td> {/* Changed from SOL to BTC */}
                  <td className="py-2 text-right font-mono">{Math.round(data.targetBtcValue)}</td>{" "}
                  {/* Changed from targetSolValue to targetBtcValue */}
                  <td className="py-2 text-right">{(data.targetBtcPercentage * 100).toFixed(2)}%</td>{" "}
                  {/* Changed from targetSolPercentage to targetBtcPercentage */}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">USDC</td>
                  <td className="py-2 text-right font-mono">{Math.round(data.targetUsdcValue)}</td>
                  <td className="py-2 text-right">{((1 - data.targetBtcPercentage) * 100).toFixed(2)}%</td>{" "}
                  {/* Changed from targetSolPercentage to targetBtcPercentage */}
                </tr>
                <tr className="font-bold">
                  <td className="py-2">TOTAL</td>
                  <td className="py-2 text-right font-mono">{Math.round(data.totalValue)}</td>
                  <td className="py-2 text-right">100.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Price Range Allocation Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="bg-gray-100 px-4 py-2 border-b">
          <h3 className="font-bold text-gray-800">ESCOLHA %BTC DE ACORDO COM O PREÇO DELE</h3>{" "}
          {/* Changed from %SOL to %BTC */}
        </div>
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-600">PREÇO BTC</th>{" "}
                {/* Changed from RANGE to PREÇO BTC */}
                <th className="text-right py-2 text-sm font-medium text-gray-600">%BTC</th>{" "}
                {/* Changed from %SOL to %BTC */}
              </tr>
            </thead>
            <tbody>
              {allocationRules.map((rule, index) => (
                <tr
                  key={index}
                  className={`border-b ${
                    btcPrice && btcPrice >= rule.minPrice && btcPrice <= rule.maxPrice // Changed from solPrice to btcPrice
                      ? "bg-blue-50 border-blue-200"
                      : ""
                  }`}
                >
                  <td className="py-2 font-mono">
                    {rule.maxPrice === Number.POSITIVE_INFINITY
                      ? `≥ $${rule.minPrice.toLocaleString()}`
                      : `$${rule.minPrice.toLocaleString()} - $${rule.maxPrice.toLocaleString()}`}
                  </td>
                  <td className="py-2 text-right font-bold">{(rule.btcTarget * 100).toFixed(0)}%</td>{" "}
                  {/* Changed from solTarget to btcTarget */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card: Ação Necessária */}
      <div
        className={`p-4 rounded-lg border-2 ${
          data.action === "BUY"
            ? "bg-yellow-50 border-yellow-400"
            : data.action === "SELL"
              ? "bg-green-50 border-green-400"
              : "bg-gray-50 border-gray-300"
        }`}
      >
        <div className="text-center">
          <h3
            className={`font-bold text-xl mb-2 ${
              data.action === "BUY" ? "text-yellow-700" : data.action === "SELL" ? "text-green-700" : "text-gray-700"
            }`}
          >
            {data.action === "BUY" && `COMPRA`}
            {data.action === "SELL" && `VENDA`}
            {data.action === "HOLD" && `MANTER POSIÇÃO`}
          </h3>
          {data.action !== "HOLD" && (
            <p className="text-lg font-mono">
              ${Math.round(data.amountToTradeUsd)}
              <span className="text-sm text-gray-600 ml-2">({data.amountToTradeBtc.toFixed(6)} BTC)</span>{" "}
              {/* Changed from amountToTradeSol to amountToTradeBtc and SOL to BTC */}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
