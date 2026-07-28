import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import InstallBanner from './InstallBanner'
import UpdateToast from './UpdateToast'
import OfflineIndicator from './OfflineIndicator'

export default function AppLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <OfflineIndicator />
      <TopBar />
      <InstallBanner />
      <main className="flex-1 max-w-lg w-full mx-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
      <UpdateToast />
    </div>
  )
}
