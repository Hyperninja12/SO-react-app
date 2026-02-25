import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.tsx'

export default function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
