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
import { Button, TextField } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { displayErrorMessage, getMembers, isAdmin } from '../../utils/helper';
import RequestModal from '../../components/RequestModal';
import { useSnackbar } from 'notistack';
import CLoadingButton from '../../components/CLoadingButton';

const mdTheme = createTheme();

const Members = () => {
  const [address, setAddress] = React.useState('');
  const web3Ctx = React.useContext(Web3Context);
  const [members, setMembers] = React.useState([]);
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [isTransfer, setIsTransfer] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  React.useEffect(() => {
    (async () => {
      if(web3Ctx.contracts) {
        await fetchMembers();

        web3Ctx.contracts.community.events.MemberAdded()
          .on('data', (event) => { fetchMembers(); });
        web3Ctx.contracts.community.events.MemberRemoved()
          .on('data', (event) => { fetchMembers(); });
        web3Ctx.contracts.token.events.Transfer()
          .on('data', (event) => { fetchMembers(); });
      }
    })()
  }, [web3Ctx]);



  const fetchMembers = async () => {
    const allMembers = await getMembers(web3Ctx.contracts.community, web3Ctx.contracts.token);
    setMembers(allMembers);
  }

  const addMemberHandler = async () => {
    try {
      await web3Ctx.contracts.community.methods.addMember(address).send({from: web3Ctx.account});
      enqueueSnackbar('Member added successfully', { variant: 'success' });
    } catch (error) {
      console.log(error);
      displayErrorMessage(enqueueSnackbar, error);
    }
  }

  const removeMemberHandler = async (address) => {
    try {
      await web3Ctx.contracts.community.methods.removeMember(address).send({from: web3Ctx.account});
      enqueueSnackbar('Member removed successfully', { variant: 'success' });
    } catch (error) {
      console.log(error);
      displayErrorMessage(enqueueSnackbar, error);
    }
  }

  const isMember = (account) => {
    return members.some(member => (member.address === account));
  }

  const handleRequest = (member, istransfer) => {
    setSelectedMember(member);
    setIsTransfer(istransfer);
    handleOpen();
  }

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Menubar 
          CurrentPage = 'Members'
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
              {web3Ctx.contracts && isMember(web3Ctx.account) && <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 240,
                  }}
                >
                  {isAdmin(web3Ctx) && <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mb: 2}}>
                    <TextField label='address' placeholder='0x00...' variant="outlined" value={address} onChange={(e) => {setAddress(e.target.value)}} sx={{ minWidth: 400 }} />
                    &nbsp;&nbsp;&nbsp;
                    <CLoadingButton variant='contained' onClickHandler={addMemberHandler} title='Add Member' />
                  </Box>}
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                      <TableHead>
                        <TableRow>
                          <TableCell align='center'>Address</TableCell>
                          <TableCell align="center">Role</TableCell>
                          <TableCell align="center">Balance</TableCell>
                          <TableCell align="center"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {members.map((member, i) => (
                          <TableRow
                            key={i}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell align='center'>
                              {member.address}
                            </TableCell>
                            <TableCell align="center">{i === 0 ? 'Admin' : (i === 1 ? 'Pool' : 'Member')}</TableCell>
                            <TableCell align='center'>
                              {member.balance}
                            </TableCell>
                            {isAdmin(web3Ctx) 
                              ? <TableCell align="center">
                                {i > 1 && <CLoadingButton color='error' onClickHandler={() => removeMemberHandler(member.address)} title='Remove' />}
                                {i === 1 && <CLoadingButton color='success' onClickHandler={() => handleRequest(member.address, true)} title='Transfer'/>}
                              </TableCell>
                              : <TableCell align="center">
                                {member.address !== web3Ctx.account && i > 0 && <CLoadingButton color='success' onClickHandler={() => handleRequest(member.address)} title='Request' />}
                              </TableCell>
                            }
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
                <RequestModal open = {open} handleClose={handleClose} to = {selectedMember} isTransfer = {isTransfer}/>
              </Grid>}
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default Members;