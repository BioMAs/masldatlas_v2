import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
