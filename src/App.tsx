import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Navigate } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import DirectoryPage from "@/pages/Directory"
import MapPage from "@/pages/MapPage"
import DataPage from "@/pages/DataPage"
import CompanyPage from "@/pages/CompanyPage"
import { useCompaniesStore } from "@/stores/companiesStore"

export default function App() {
  const init = useCompaniesStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/annuaire" replace />} />
          <Route path="/annuaire" element={<DirectoryPage />} />
          <Route path="/carte" element={<MapPage />} />
          <Route path="/donnees" element={<DataPage />} />
          <Route path="/entreprise/:id" element={<CompanyPage />} />
          <Route path="*" element={<Navigate to="/annuaire" replace />} />
        </Routes>
      </AppShell>
    </Router>
  )
}
