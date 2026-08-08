import { Routes, Route, Navigate } from 'react-router-dom'
import { TortilleriaProvider } from './context/TortilleriaContext'
import RequireAuth from './components/RequireAuth'
import RootLayout from './layouts/RootLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Tortillerias from './pages/Tortillerias'

export default function App() {
  return (
    <TortilleriaProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<RootLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="register" element={<Register />} />
            <Route path="tortillerias" element={<Tortillerias />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TortilleriaProvider>
  )
}
