import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import HRModule from './pages/HRModule'
import PayrollModule from './pages/PayrollModule'
import AccountingModule from './pages/AccountingModule'
import FinanceModule from './pages/FinanceModule'
import BillingModule from './pages/BillingModule'
import ProcurementModule from './pages/ProcurementModule'
import SupplyChainModule from './pages/SupplyChainModule'
import InventoryModule from './pages/InventoryModule'
import Architecture from './pages/Architecture'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/hr" element={<HRModule />} />
        <Route path="/payroll" element={<PayrollModule />} />
        <Route path="/accounting" element={<AccountingModule />} />
        <Route path="/finance" element={<FinanceModule />} />
        <Route path="/billing" element={<BillingModule />} />
        <Route path="/procurement" element={<ProcurementModule />} />
        <Route path="/supply-chain" element={<SupplyChainModule />} />
        <Route path="/inventory" element={<InventoryModule />} />
      </Routes>
    </Layout>
  )
}

export default App
