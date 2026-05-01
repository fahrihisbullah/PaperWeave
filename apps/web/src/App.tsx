import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { ProtectedRoute, PublicRoute } from './lib/protected-route'
import { Layout } from './components/layout'
import { HomePage } from './pages/home'
import { LoginPage } from './pages/login'
import { RegisterPage } from './pages/register'
import { LogoutPage } from './pages/logout'
import { ProjectListPage } from './pages/projects/list'
import { CreateProjectPage } from './pages/projects/create'
import { ProjectDetailPage } from './pages/projects/detail'
import { PaperDetailPage } from './pages/projects/paper-detail'
import { SynthesisPage } from './pages/projects/synthesis'
import { DraftEditorPage } from './pages/projects/draft-editor'

function ProtectedWithLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <PublicRoute redirectTo="/projects">
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute redirectTo="/projects">
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route path="/logout" element={<LogoutPage />} />

          <Route
            path="/projects"
            element={
              <ProtectedWithLayout>
                <ProjectListPage />
              </ProtectedWithLayout>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedWithLayout>
                <CreateProjectPage />
              </ProtectedWithLayout>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedWithLayout>
                <ProjectDetailPage />
              </ProtectedWithLayout>
            }
          />
          <Route
            path="/projects/:id/papers/:paperId"
            element={
              <ProtectedWithLayout>
                <PaperDetailPage />
              </ProtectedWithLayout>
            }
          />
          <Route
            path="/projects/:id/synthesis"
            element={
              <ProtectedWithLayout>
                <SynthesisPage />
              </ProtectedWithLayout>
            }
          />
          <Route
            path="/projects/:id/drafts/:draftId"
            element={
              <ProtectedWithLayout>
                <DraftEditorPage />
              </ProtectedWithLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
