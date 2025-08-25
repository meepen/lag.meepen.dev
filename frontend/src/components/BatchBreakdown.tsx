import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip
} from '@mui/material';
import { LagResultDto } from '../types/lag-result.dto';

interface BatchBreakdownProps {
  batch: LagResultDto | null;
}

export const BatchBreakdown: React.FC<BatchBreakdownProps> = ({ batch }) => {
  if (!batch) {
    return null;
  }

  // Calculate statistics for the batch
  const finalHop = batch.results[batch.results.length - 1];
  const totalHops = batch.results.length;
  
  // Calculate overall statistics from hub results
  const avgLatency = finalHop ? finalHop.averageMs : 0;
  
  const totalPackets = batch.results.reduce((sum, hop) => sum + hop.sent, 0);
  const lostPackets = batch.results.reduce((sum, hop) => sum + hop.lost, 0);
  const packetLossRate = totalPackets > 0 ? (lostPackets / totalPackets) * 100 : 0;

  const getLatencyColor = (latency: number): 'success' | 'warning' | 'error' => {
    if (latency < 50) return 'success';
    if (latency < 100) return 'warning';
    return 'error';
  };

  const getPacketLossColor = (lossRate: number): 'success' | 'warning' | 'error' => {
    if (lossRate === 0) return 'success';
    if (lossRate < 5) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Batch Breakdown: {batch.batchId}
          </Typography>
          
          {/* Batch Overview */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ minWidth: 140, flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {avgLatency.toFixed(1)}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Final Hop Latency
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 140, flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="text.primary">
                  {totalHops}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Hops
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 140, flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="text.primary">
                  {batch.testCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tests per Hop
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 140, flex: 1 }}>
              <CardContent>
                <Typography variant="h6">
                  <Chip 
                    label={`${packetLossRate.toFixed(1)}%`}
                    color={getPacketLossColor(packetLossRate)}
                    size="small"
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Packet Loss
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Hop-by-Hop Breakdown */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Hop-by-Hop Analysis
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hop</TableCell>
                  <TableCell>Sent</TableCell>
                  <TableCell>Lost</TableCell>
                  <TableCell>Average (ms)</TableCell>
                  <TableCell>Best (ms)</TableCell>
                  <TableCell>Worst (ms)</TableCell>
                  <TableCell>Std Dev (ms)</TableCell>
                  <TableCell>Loss Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batch.results.map((hop, index) => {
                  const hopLossRate = hop.sent > 0 ? (hop.lost / hop.sent) * 100 : 0;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {hop.sent}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {hop.lost}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${hop.averageMs.toFixed(1)}`}
                          color={getLatencyColor(hop.averageMs)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {hop.bestMs.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {hop.worstMs.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {hop.standardDeviationMs.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${hopLossRate.toFixed(1)}%`}
                          color={getPacketLossColor(hopLossRate)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Batch Metadata */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Batch Metadata
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Batch ID
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {batch.batchId}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {new Date(batch.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Packet Size
                    </Typography>
                    <Typography variant="body1">
                      {batch.packetSize} bytes
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Packets
                    </Typography>
                    <Typography variant="body1">
                      {totalPackets}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
