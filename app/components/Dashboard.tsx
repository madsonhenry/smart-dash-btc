"use client"

// Tipagem para os dados calculados
interface DashboardData {
  currentSolValue: number
  currentUsdcValue: number
  totalValue: number
  currentSolPercentage: number
  targetSolPercentage: number
  targetSolValue: number
  targetUsdcValue: number
  action: "BUY" | "SELL" | "HOLD"
  amountToTradeUsd: number
  amountToTradeSol: number
}

interface DashboardProps {
  data: DashboardData | null
  solPrice: number | null
  isLoading: boolean
  allocationRules: Array<{ minPrice: number; maxPrice: number; solTarget: number }>
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

export default function Dashboard({ data, solPrice, isLoading, allocationRules }: DashboardProps) {
  if (isLoading) {
    return <div className="text-center text-blue-600">Buscando preço da SOL...</div>
  }

  if (!solPrice || !data || data.totalValue === 0) {
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
                  <td className="py-2 font-medium">SOL</td>
                  <td className="py-2 text-right font-mono">{Math.round(data.currentSolValue)}</td>
                  <td className="py-2 text-right">{(data.currentSolPercentage * 100).toFixed(2)}%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">USDC</td>
                  <td className="py-2 text-right font-mono">{Math.round(data.currentUsdcValue)}</td>
                  <td className="py-2 text-right">{((1 - data.currentSolPercentage) * 100).toFixed(2)}%</td>
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
                  <td className="py-2 font-medium">SOL</td>
                  <td className="py-2 text-right font-mono">{Math.round(data.targetSolValue)}</td>
                  <td className="py-2 text-right">{(data.targetSolPercentage * 100).toFixed(2)}%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">USDC</td>
                  <td className="py-2 text-right font-mono">{Math.round(data.targetUsdcValue)}</td>
                  <td className="py-2 text-right">{((1 - data.targetSolPercentage) * 100).toFixed(2)}%</td>
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
          <h3 className="font-bold text-gray-800">ESCOLHA %SOL DE ACORDO COM O PREÇO DELA</h3>
        </div>
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-600">RANGE</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">%SOL</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">PREÇO SOL</th>
              </tr>
            </thead>
            <tbody>
              {allocationRules.map((rule, index) => (
                <tr
                  key={index}
                  className={`border-b ${
                    solPrice && solPrice >= rule.minPrice && solPrice <= rule.maxPrice
                      ? "bg-blue-50 border-blue-200"
                      : ""
                  }`}
                >
                  <td className="py-2 font-mono">
                    {rule.maxPrice === Number.POSITIVE_INFINITY ? `${rule.minPrice} INFINITO` : `${rule.minPrice}`}
                  </td>
                  <td className="py-2 text-right font-bold">{(rule.solTarget * 100).toFixed(2)}%</td>
                  <td className="py-2">{rule.maxPrice === Number.POSITIVE_INFINITY ? rule.minPrice : rule.maxPrice}</td>
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
              <span className="text-sm text-gray-600 ml-2">({data.amountToTradeSol.toFixed(4)} SOL)</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
