import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress
} from '@mui/material'
import { NetworkCheck, Timeline, Speed } from '@mui/icons-material'

function App() {
  const [fromDate, setFromDate] = useState('2025-08-24T00:00:00')
  const [toDate, setToDate] = useState('2025-08-24T23:59:59')
  const [lagData, setLagData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLagData = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/lag?from=${fromDate}&to=${toDate}`)
      if (!response.ok) {
        throw new Error('Failed to fetch lag data')
      }
      const data = await response.text()
      setLagData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Network Lag Analysis Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Monitor and analyze network lag data collected via MTR (My Traceroute) measurements.
            </Typography>
          </Paper>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'stretch' }}>
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Timeline sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Query Lag Data
                    </Typography>
                  </Box>
                  
                  <Box component="form" sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="From Date/Time"
                      type="datetime-local"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="To Date/Time"
                      type="datetime-local"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    onClick={fetchLagData}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Speed />}
                    fullWidth
                  >
                    {loading ? 'Fetching...' : 'Get Lag Data'}
                  </Button>
                </CardActions>
              </Card>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Results
                  </Typography>
                  
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                  
                  {lagData && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        {lagData}
                      </Typography>
                    </Alert>
                  )}
                  
                  {!lagData && !error && (
                    <Typography variant="body2" color="text.secondary">
                      Select a date range and click "Get Lag Data" to view network lag analysis.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  )
}

export default App
