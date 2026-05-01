import { signOut } from '../lib/auth-client'
import { useNavigate } from 'react-router-dom'

export function LogoutPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-xl font-semibold mb-4">Sign Out</h1>
        <p className="text-gray-600 mb-6">Are you sure you want to sign out?</p>
        <button
          onClick={handleLogout}
          className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}