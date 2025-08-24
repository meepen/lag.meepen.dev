import {
  AppBar,
  Toolbar,
  Typography,
  Container,
} from '@mui/material'
import { NetworkCheck } from '@mui/icons-material'
import { GraphController } from './components/GraphController'

function App() {
  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <NetworkCheck sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {import.meta.env.VITE_APP_NAME || 'Network Lag Monitor'}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <GraphController />
      </Container>
    </>
  )
}

export default App
