import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Menubar from '../../components/Layouts/Menubar';
import Web3Context from '../../store/web3-context';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { getTransactionRequests } from '../../utils/helper';

const mdTheme = createTheme();

const Requests = () => {
  const web3Ctx = React.useContext(Web3Context);
  const [requests, setRequests] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      if(web3Ctx.contracts) {
        await fetchRequests();
        
        web3Ctx.contracts.community.events.TransferRequested()
          .on('data', (event) => { fetchRequests(); });
        web3Ctx.contracts.community.events.TransferApproved()
          .on('data', (event) => { fetchRequests(); });
        web3Ctx.contracts.community.events.TransferCompleted()
          .on('data', (event) => { fetchRequests(); });
      }
    })()
  }, [web3Ctx]);

  const fetchRequests = async () => {
    const allRequests = await getTransactionRequests(web3Ctx.contracts.community);
    setRequests(allRequests);
  }


  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Menubar 
          CurrentPage = 'All Requests'
        />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Chart */}
              {web3Ctx.contracts && <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 240,
                  }}
                >
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                      <TableHead>
                        <TableRow>
                          <TableCell align='center'>From</TableCell>
                          <TableCell align="center">To</TableCell>
                          <TableCell align="center">Amount</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {requests.map((request, i) => (
                          <TableRow
                            key={i}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell align='center'>{request.from}</TableCell>
                            <TableCell align='center'>{request.to}</TableCell>
                            <TableCell align='center'>{Number(request.amount) / (Math.pow(10, 18))}</TableCell>
                            <TableCell align='center'>{request.completed ? 'Completed' : (request.approved ? 'Approved' : 'Pending')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                </Paper>
              </Grid>}
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default Requests;