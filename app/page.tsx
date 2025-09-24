"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import PortfolioInput from "./components/PortfolioInput"
import Dashboard from "./components/Dashboard"

const ALLOCATION_RULES = [
  { minPrice: 140000, maxPrice: Number.POSITIVE_INFINITY, btcTarget: 0.2 },
  { minPrice: 130000, maxPrice: 139999, btcTarget: 0.25 },
  { minPrice: 120000, maxPrice: 129999, btcTarget: 0.3 },
  { minPrice: 109000, maxPrice: 119999, btcTarget: 0.35 },
  { minPrice: 99000, maxPrice: 108999, btcTarget: 0.45 },
  { minPrice: 89000, maxPrice: 98999, btcTarget: 0.55 },
  { minPrice: 79000, maxPrice: 88999, btcTarget: 0.65 },
  { minPrice: 69000, maxPrice: 78999, btcTarget: 0.75 },
  { minPrice: 59000, maxPrice: 68999, btcTarget: 0.8 }, // Updated range to include 59k-68k with 80%
]

interface CycleHistory {
  cycle: number
  total: number
  status: "DEPÓSITO" | "COMPRA" | "VENDA" | ""
  date: string
  price: string
  profit: string
  btcAmount: number
  usdcAmount: number
}

interface PortfolioData {
  btcAmount: string
  usdcAmount: string
  cycleHistory: CycleHistory[]
  currentCycle: number
}

export default function HomePage() {
  const [btcAmount, setBtcAmount] = useState("")
  const [usdcAmount, setUsdcAmount] = useState("")
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
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
      setBtcAmount(savedData.btcAmount || "")
      setUsdcAmount(savedData.usdcAmount || "")
      setCycleHistory(savedData.cycleHistory || [])
      setCurrentCycle(savedData.currentCycle || 1)
    }
  }, [])

  useEffect(() => {
    const dataToSave: PortfolioData = {
      btcAmount: btcAmount || "",
      usdcAmount: usdcAmount || "",
      cycleHistory,
      currentCycle,
    }
    saveToLocalStorage(dataToSave)
  }, [btcAmount, usdcAmount, cycleHistory, currentCycle])

  const dashboardData = useMemo(() => {
    const btc = Number.parseFloat(btcAmount)
    const usdc = Number.parseFloat(usdcAmount)

    if (!btcPrice || isNaN(btc) || isNaN(usdc) || btc < 0 || usdc < 0) {
      return null
    }

    const currentBtcValue = btc * btcPrice
    const currentUsdcValue = usdc
    const totalValue = currentBtcValue + currentUsdcValue
    if (totalValue === 0) return null
    const currentBtcPercentage = currentBtcValue / totalValue

    let targetBtcPercentage = ALLOCATION_RULES[ALLOCATION_RULES.length - 1].btcTarget
    for (const rule of ALLOCATION_RULES) {
      if (btcPrice >= rule.minPrice && btcPrice <= rule.maxPrice) {
        targetBtcPercentage = rule.btcTarget
        break
      }
    }

    const targetBtcValue = totalValue * targetBtcPercentage
    const targetUsdcValue = totalValue * (1 - targetBtcPercentage)

    const differenceInUsd = currentBtcValue - targetBtcValue
    const threshold = 1

    let action: "BUY" | "SELL" | "HOLD" = "HOLD"
    let amountToTradeUsd = 0

    if (differenceInUsd > threshold) {
      action = "SELL"
      amountToTradeUsd = differenceInUsd
    } else if (differenceInUsd < -threshold) {
      action = "BUY"
      amountToTradeUsd = Math.abs(differenceInUsd)
    }

    const amountToTradeBtc = amountToTradeUsd / btcPrice

    return {
      currentBtcValue,
      currentUsdcValue,
      totalValue,
      currentBtcPercentage,
      targetBtcPercentage,
      targetBtcValue,
      targetUsdcValue,
      action,
      amountToTradeUsd,
      amountToTradeBtc,
    }
  }, [btcAmount, usdcAmount, btcPrice])

  const registerInitialDeposit = () => {
    const btc = Number.parseFloat(btcAmount)
    const usdc = Number.parseFloat(usdcAmount)

    if (!btcPrice || isNaN(btc) || isNaN(usdc) || btc < 0 || usdc < 0) {
      alert("Por favor, insira valores válidos para BTC e USDC")
      return
    }

    const totalValue = btc * btcPrice + usdc
    const newCycle: CycleHistory = {
      cycle: 1,
      total: Math.round(totalValue),
      status: "DEPÓSITO",
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      price: btcPrice.toFixed(0),
      profit: "",
      btcAmount: btc,
      usdcAmount: usdc,
    }

    setCycleHistory([newCycle])
    setCurrentCycle(2)
  }

  const registerMovement = (action: "COMPRA" | "VENDA") => {
    const btc = Number.parseFloat(btcAmount)
    const usdc = Number.parseFloat(usdcAmount)

    if (!btcPrice || isNaN(btc) || isNaN(usdc) || btc < 0 || usdc < 0) {
      alert("Por favor, insira valores válidos para BTC e USDC")
      return
    }

    const totalValue = btc * btcPrice + usdc
    const previousCycle = cycleHistory[cycleHistory.length - 1]
    const profit = previousCycle ? totalValue - previousCycle.total : 0

    const newCycle: CycleHistory = {
      cycle: currentCycle,
      total: Math.round(totalValue),
      status: action,
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      price: btcPrice.toFixed(0),
      profit: profit > 0 ? `+${Math.round(profit)}` : Math.round(profit).toString(),
      btcAmount: btc,
      usdcAmount: usdc,
    }

    setCycleHistory([...cycleHistory, newCycle])
    setCurrentCycle(currentCycle + 1)
  }

  const resetHistory = () => {
    setCycleHistory([])
    setCurrentCycle(1)
    setBtcAmount("")
    setUsdcAmount("")
    localStorage.removeItem(STORAGE_KEY)
  }

  const exportData = () => {
    const dataToExport: PortfolioData = {
      btcAmount,
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

        if (
          importedData.btcAmount !== undefined &&
          importedData.usdcAmount !== undefined &&
          Array.isArray(importedData.cycleHistory) &&
          typeof importedData.currentCycle === "number"
        ) {
          setBtcAmount(importedData.btcAmount || "")
          setUsdcAmount(importedData.usdcAmount || "")
          setCycleHistory(importedData.cycleHistory || [])
          setCurrentCycle(importedData.currentCycle || 1)

          alert("Dados importados com sucesso!")
        } else {
          alert("Arquivo inválido. Verifique o formato dos dados.")
        }
      } catch (error) {
        alert("Erro ao importar dados. Verifique se o arquivo está correto.")
      }
    }
    reader.readAsText(file)

    event.target.value = ""
  }

  const syncToCloud = async () => {
    alert("Funcionalidade de sincronização na nuvem será implementada em breve!")
  }

  const fetchBtcPrice = async () => {
    try {
      console.log("[v0] Iniciando busca do preço do BTC...")
      setIsLoading(true)

      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Dados recebidos da API:", data)

      if (data.bitcoin && data.bitcoin.usd) {
        const price = data.bitcoin.usd
        console.log("[v0] Preço do BTC obtido:", price)
        setBtcPrice(price)
      } else {
        throw new Error("Formato de dados inválido")
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar preço do BTC:", error)
      setBtcPrice(null)
    } finally {
      setIsLoading(false)
      console.log("[v0] Busca do preço finalizada")
    }
  }

  useEffect(() => {
    fetchBtcPrice()

    // Update price every 30 seconds
    const interval = setInterval(fetchBtcPrice, 30000)

    return () => clearInterval(interval)
  }, [])

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
          Preço Atual do BTC:{" "}
          {isLoading ? (
            <span className="animate-pulse">Carregando...</span>
          ) : btcPrice ? (
            <span className="font-bold text-green-600">${btcPrice.toLocaleString()}</span>
          ) : (
            <span className="text-red-500">Erro ao buscar</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <PortfolioInput
            btcAmount={btcAmount}
            usdcAmount={usdcAmount}
            setBtcAmount={setBtcAmount}
            setUsdcAmount={setUsdcAmount}
          />

          <Dashboard
            data={dashboardData}
            btcPrice={btcPrice}
            isLoading={isLoading}
            allocationRules={ALLOCATION_RULES}
          />

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {cycleHistory.length === 0 ? (
                <button
                  onClick={registerInitialDeposit}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  disabled={!btcAmount || !usdcAmount || !btcPrice}
                >
                  Registrar Depósito Inicial (Ciclo 1)
                </button>
              ) : (
                <>
                  <button
                    onClick={() => registerMovement("COMPRA")}
                    className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                    disabled={!btcAmount || !usdcAmount || !btcPrice}
                  >
                    Registrar COMPRA (Ciclo {currentCycle})
                  </button>
                  <button
                    onClick={() => registerMovement("VENDA")}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                    disabled={!btcAmount || !usdcAmount || !btcPrice}
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
