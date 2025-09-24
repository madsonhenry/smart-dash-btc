"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import PortfolioInput from "./components/PortfolioInput"
import Dashboard from "./components/Dashboard"

const ALLOCATION_RULES = [
  { minPrice: 300, maxPrice: Number.POSITIVE_INFINITY, solTarget: 0.3 },
  { minPrice: 260, maxPrice: 299, solTarget: 0.4 },
  { minPrice: 220, maxPrice: 259, solTarget: 0.5 },
  { minPrice: 200, maxPrice: 219, solTarget: 0.6 },
  { minPrice: 170, maxPrice: 199, solTarget: 0.65 },
  { minPrice: 140, maxPrice: 169, solTarget: 0.75 },
  { minPrice: 110, maxPrice: 139, solTarget: 0.8 },
  { minPrice: 0, maxPrice: 109, solTarget: 0.85 },
]

interface CycleHistory {
  cycle: number
  total: number
  status: "DEPÓSITO" | "COMPRA" | "VENDA" | ""
  date: string
  price: string
  profit: string
  solAmount: number
  usdcAmount: number
}

interface PortfolioData {
  solAmount: string
  usdcAmount: string
  cycleHistory: CycleHistory[]
  currentCycle: number
}

export default function HomePage() {
  const [solAmount, setSolAmount] = useState("")
  const [usdcAmount, setUsdcAmount] = useState("")
  const [solPrice, setSolPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [cycleHistory, setCycleHistory] = useState<CycleHistory[]>([])
  const [currentCycle, setCurrentCycle] = useState(1)

  const STORAGE_KEY = "portfolio-inteligente-data"

  const saveToLocalStorage = (data: PortfolioData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
    }
  }

  const loadFromLocalStorage = (): PortfolioData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      return null
    }
  }

  useEffect(() => {
    const savedData = loadFromLocalStorage()
    if (savedData) {
      setSolAmount(savedData.solAmount)
      setUsdcAmount(savedData.usdcAmount)
      setCycleHistory(savedData.cycleHistory)
      setCurrentCycle(savedData.currentCycle)
    }
  }, [])

  useEffect(() => {
    const dataToSave: PortfolioData = {
      solAmount,
      usdcAmount,
      cycleHistory,
      currentCycle,
    }
    saveToLocalStorage(dataToSave)
  }, [solAmount, usdcAmount, cycleHistory, currentCycle])

  useEffect(() => {
    const fetchSolPrice = async () => {
      console.log("[v0] Attempting to fetch SOL price...")

      // Try multiple API endpoints for better reliability
      const apiEndpoints = [
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
        "https://api.coinbase.com/v2/exchange-rates?currency=SOL",
        "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
      ]

      for (let i = 0; i < apiEndpoints.length; i++) {
        try {
          console.log(`[v0] Trying API endpoint ${i + 1}:`, apiEndpoints[i])

          const response = await fetch(apiEndpoints[i], {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            mode: "cors",
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          console.log("[v0] API response:", data)

          let price: number

          // Parse different API response formats
          if (i === 0) {
            // CoinGecko
            price = data.solana?.usd
          } else if (i === 1) {
            // Coinbase
            price = Number.parseFloat(data.data?.rates?.USD || "0")
          } else {
            // Binance
            price = Number.parseFloat(data.price || "0")
          }

          if (price && price > 0) {
            console.log("[v0] Successfully fetched SOL price:", price)
            setSolPrice(price)
            setIsLoading(false)
            return // Success, exit the loop
          }
        } catch (error) {
          console.log(`[v0] API endpoint ${i + 1} failed:`, error)

          // If this is the last endpoint, set a fallback price
          if (i === apiEndpoints.length - 1) {
            console.log("[v0] All API endpoints failed, using fallback price")
            // Set a reasonable fallback price (you can update this manually)
            setSolPrice(200) // Fallback price
            setIsLoading(false)
          }
        }
      }
    }

    fetchSolPrice()
    // Increase interval to reduce API calls and potential rate limiting
    const interval = setInterval(fetchSolPrice, 60000) // 1 minute instead of 30 seconds

    return () => clearInterval(interval)
  }, [])

  // useMemo para calcular os dados do dashboard apenas quando necessário
  const dashboardData = useMemo(() => {
    const sol = Number.parseFloat(solAmount)
    const usdc = Number.parseFloat(usdcAmount)

    if (!solPrice || isNaN(sol) || isNaN(usdc) || sol < 0 || usdc < 0) {
      return null
    }

    // 1. Cálculos do Portfólio Atual
    const currentSolValue = sol * solPrice
    const currentUsdcValue = usdc
    const totalValue = currentSolValue + currentUsdcValue
    if (totalValue === 0) return null
    const currentSolPercentage = currentSolValue / totalValue

    let targetSolPercentage = ALLOCATION_RULES[ALLOCATION_RULES.length - 1].solTarget
    for (const rule of ALLOCATION_RULES) {
      if (solPrice >= rule.minPrice && solPrice <= rule.maxPrice) {
        targetSolPercentage = rule.solTarget
        break
      }
    }

    // 3. Cálculos da Alocação Recomendada
    const targetSolValue = totalValue * targetSolPercentage
    const targetUsdcValue = totalValue * (1 - targetSolPercentage)

    // 4. Determinar a Ação Necessária
    const differenceInUsd = currentSolValue - targetSolValue
    const threshold = 1 // Não sugerir trocas por menos de $1 de diferença

    let action: "BUY" | "SELL" | "HOLD" = "HOLD"
    let amountToTradeUsd = 0

    if (differenceInUsd > threshold) {
      action = "SELL"
      amountToTradeUsd = differenceInUsd
    } else if (differenceInUsd < -threshold) {
      action = "BUY"
      amountToTradeUsd = Math.abs(differenceInUsd)
    }

    const amountToTradeSol = amountToTradeUsd / solPrice

    return {
      currentSolValue,
      currentUsdcValue,
      totalValue,
      currentSolPercentage,
      targetSolPercentage,
      targetSolValue,
      targetUsdcValue,
      action,
      amountToTradeUsd,
      amountToTradeSol,
    }
  }, [solAmount, usdcAmount, solPrice])

  const registerInitialDeposit = () => {
    const sol = Number.parseFloat(solAmount)
    const usdc = Number.parseFloat(usdcAmount)

    if (!solPrice || isNaN(sol) || isNaN(usdc) || sol < 0 || usdc < 0) {
      alert("Por favor, insira valores válidos para SOL e USDC")
      return
    }

    const totalValue = sol * solPrice + usdc
    const newCycle: CycleHistory = {
      cycle: 1,
      total: Math.round(totalValue),
      status: "DEPÓSITO",
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      price: solPrice.toFixed(0),
      profit: "",
      solAmount: sol,
      usdcAmount: usdc,
    }

    setCycleHistory([newCycle])
    setCurrentCycle(2)
  }

  const registerMovement = (action: "COMPRA" | "VENDA") => {
    const sol = Number.parseFloat(solAmount)
    const usdc = Number.parseFloat(usdcAmount)

    if (!solPrice || isNaN(sol) || isNaN(usdc) || sol < 0 || usdc < 0) {
      alert("Por favor, insira valores válidos para SOL e USDC")
      return
    }

    const totalValue = sol * solPrice + usdc
    const previousCycle = cycleHistory[cycleHistory.length - 1]
    const profit = previousCycle ? totalValue - previousCycle.total : 0

    const newCycle: CycleHistory = {
      cycle: currentCycle,
      total: Math.round(totalValue),
      status: action,
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      price: solPrice.toFixed(0),
      profit: profit > 0 ? `+${Math.round(profit)}` : Math.round(profit).toString(),
      solAmount: sol,
      usdcAmount: usdc,
    }

    setCycleHistory([...cycleHistory, newCycle])
    setCurrentCycle(currentCycle + 1)
  }

  const resetHistory = () => {
    setCycleHistory([])
    setCurrentCycle(1)
    setSolAmount("")
    setUsdcAmount("")
    localStorage.removeItem(STORAGE_KEY)
  }

  const exportData = () => {
    const dataToExport: PortfolioData = {
      solAmount,
      usdcAmount,
      cycleHistory,
      currentCycle,
    }

    const dataStr = JSON.stringify(dataToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `portfolio-inteligente-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData: PortfolioData = JSON.parse(e.target?.result as string)

        // Validate imported data structure
        if (
          importedData.solAmount !== undefined &&
          importedData.usdcAmount !== undefined &&
          Array.isArray(importedData.cycleHistory) &&
          typeof importedData.currentCycle === "number"
        ) {
          setSolAmount(importedData.solAmount)
          setUsdcAmount(importedData.usdcAmount)
          setCycleHistory(importedData.cycleHistory)
          setCurrentCycle(importedData.currentCycle)

          alert("Dados importados com sucesso!")
        } else {
          alert("Arquivo inválido. Verifique o formato dos dados.")
        }
      } catch (error) {
        alert("Erro ao importar dados. Verifique se o arquivo está correto.")
      }
    }
    reader.readAsText(file)

    // Reset input value to allow importing the same file again
    event.target.value = ""
  }

  const syncToCloud = async () => {
    // TODO: Implement Supabase integration for automatic sync
    alert("Funcionalidade de sincronização na nuvem será implementada em breve!")
  }

  return (
    <main className="container mx-auto p-4 max-w-7xl bg-gray-50 min-h-screen">
      <header className="bg-white border-b-2 border-green-500 p-4 mb-6 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <h1 className="text-xl font-bold text-gray-800">PORTFOLIO INTELIGENTE PRO</h1>
          <div className="flex gap-1 ml-4">
            <span className="text-yellow-600">⭐</span>
            <span className="text-blue-600">📁</span>
            <span className="text-gray-600">🔗</span>
          </div>
        </div>
      </header>

      <div className="text-right mb-4">
        <span className="text-sm text-gray-600">
          Preço Atual da SOL:{" "}
          {isLoading ? (
            <span className="animate-pulse">...</span>
          ) : solPrice ? (
            <span className="font-bold text-green-600">${solPrice.toFixed(2)}</span>
          ) : (
            <span className="text-red-500">Erro ao buscar</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PortfolioInput
            solAmount={solAmount}
            usdcAmount={usdcAmount}
            setSolAmount={setSolAmount}
            setUsdcAmount={setUsdcAmount}
          />

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {cycleHistory.length === 0 ? (
                <button
                  onClick={registerInitialDeposit}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  disabled={!solAmount || !usdcAmount || !solPrice}
                >
                  Registrar Depósito Inicial (Ciclo 1)
                </button>
              ) : (
                <>
                  <button
                    onClick={() => registerMovement("COMPRA")}
                    className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                    disabled={!solAmount || !usdcAmount || !solPrice}
                  >
                    Registrar COMPRA (Ciclo {currentCycle})
                  </button>
                  <button
                    onClick={() => registerMovement("VENDA")}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                    disabled={!solAmount || !usdcAmount || !solPrice}
                  >
                    Registrar VENDA (Ciclo {currentCycle})
                  </button>
                </>
              )}
              <button
                onClick={resetHistory}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              >
                Resetar Histórico
              </button>
              <div className="flex gap-2 border-l pl-3 ml-3">
                <button
                  onClick={exportData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  title="Exportar dados para usar em outro dispositivo"
                >
                  📤 Exportar
                </button>

                <label className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm cursor-pointer">
                  📥 Importar
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>

                <button
                  onClick={syncToCloud}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                  title="Sincronizar com a nuvem (em breve)"
                >
                  ☁️ Sync
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Para usar em outros dispositivos:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>
                  • <strong>Exportar:</strong> Baixa um arquivo JSON com todos os seus dados
                </li>
                <li>
                  • <strong>Importar:</strong> Carrega os dados de um arquivo JSON exportado
                </li>
                <li>
                  • <strong>Sync:</strong> Sincronização automática na nuvem (em desenvolvimento)
                </li>
              </ul>
            </div>
          </div>

          <Dashboard
            data={dashboardData}
            solPrice={solPrice}
            isLoading={isLoading}
            allocationRules={ALLOCATION_RULES}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-700">
              <span>TOTAL</span>
              <span>STATUS</span>
              <span>DATA</span>
              <span>LUCRO</span>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {cycleHistory.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <p>Nenhum ciclo registrado ainda.</p>
                <p className="text-sm mt-1">Comece registrando seu depósito inicial.</p>
              </div>
            ) : (
              cycleHistory.map((cycle) => (
                <div key={cycle.cycle} className="px-4 py-2 border-b border-gray-100 hover:bg-gray-50">
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">CICLO {cycle.cycle}</span>
                      <span className="font-mono font-medium">{cycle.total}</span>
                    </div>
                    <div>
                      {cycle.status && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            cycle.status === "VENDA"
                              ? "bg-green-100 text-green-800"
                              : cycle.status === "COMPRA"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {cycle.status}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">{cycle.date}</div>
                    <div
                      className={`text-xs font-medium ${
                        cycle.profit && cycle.profit.startsWith("+")
                          ? "text-green-600"
                          : cycle.profit && cycle.profit !== ""
                            ? "text-red-600"
                            : "text-gray-400"
                      }`}
                    >
                      {cycle.profit || "-"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
