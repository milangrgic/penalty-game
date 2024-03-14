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
import { Button } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { displayErrorMessage, getTransactionRequests, isAdmin } from '../../utils/helper';
import { useSnackbar } from 'notistack';
import CLoadingButton from '../../components/CLoadingButton';

const mdTheme = createTheme();

const ApproveRequests = () => {
  const web3Ctx = React.useContext(Web3Context);
  const [requests, setRequests] = React.useState([]);
  const { enqueueSnackbar } = useSnackbar();

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
    let myRequests;
    if(isAdmin(web3Ctx)) {
      myRequests = allRequests.filter((request) => ((request.to === web3Ctx.account || web3Ctx.contracts.pool._address === request.to) && request.approved === false));
    }
    else {
      myRequests = allRequests.filter((request) => (request.to === web3Ctx.account && request.approved === false));
    }
    setRequests(myRequests);
  }

  const ApproveRequestHandler = async (request) => {
    try {
      if(request.to !== web3Ctx.contracts.pool._address) {
        console.log(request.amount, request.id);
        await web3Ctx.contracts.token.methods.depositForRequest(web3Ctx.contracts.community._address, request.amount, request.id).send({from: web3Ctx.account});
      }
      await web3Ctx.contracts.community.methods.approveTransfer(request.id).send({from: web3Ctx.account});
      enqueueSnackbar('Approved successfully', { variant: 'success' });
    } catch (error) {
      console.log(error);
      displayErrorMessage(enqueueSnackbar, error);
    }
  }

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Menubar 
          CurrentPage = 'Approve Requests'
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
                          <TableCell align="center">Action</TableCell>
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
                            <TableCell align='center'>
                              <CLoadingButton color='success' onClickHandler={() => ApproveRequestHandler(request)} title='Approve' />
                            </TableCell>
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

export default ApproveRequests;