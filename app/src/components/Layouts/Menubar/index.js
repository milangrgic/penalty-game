import * as React from 'react';
import { useContext } from 'react';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import ApprovalIcon from '@mui/icons-material/Approval';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import PostAddIcon from '@mui/icons-material/PostAdd';
import Web3Context from '../../../store/web3-context';
import web3 from '../../../connection/web3';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Logout from '@mui/icons-material/Logout';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      minHeight : '100vh' ,
      backgroundColor: '#444',
      color: 'white',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);


function Menubar(props) {
  const history = useNavigate();
  const CurrentPage = props.CurrentPage;

  const web3Ctx = useContext(Web3Context);

  const connectWalletHandler = async() => {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch(error) {
      console.error(error);
    }

    // Load accounts
    await web3Ctx.loadAccount(web3);
    await web3Ctx.loadNetworkId(web3);
    await web3Ctx.loadContracts(web3);
  };

  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openmenu = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (event) => {
    setAnchorEl(null);
  };

  const disconnectHandleClick = (event) => {
    web3Ctx.setAccount(null);
  }

  return (
    <div >
      <AppBar position="absolute" open={open}>
        <Toolbar
          sx={{
            pr: '24px', // keep right padding when drawer closed
            backgroundColor: 'black',
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            {CurrentPage}
          </Typography>
          {web3Ctx.account ?
            <Button size="large" variant="contained" sx={{borderRadius : "30px"}} >
              {web3Ctx.account.substr(0, 7)}...{web3Ctx.account.substr(web3Ctx.account.length-5)}
            </Button>
            : <Button size="large" variant="contained" sx={{borderRadius : "30px"}} onClick={connectWalletHandler}>
              Connect Wallet
            </Button>
          }
          
          {web3Ctx.account && 
            <>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleClick}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={openmenu ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={openmenu ? 'true' : undefined}
                >
                  <img src="avatar.png" style={{width:40, height:40, cursor : "pointer"}}/>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={openmenu}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem button='true' onClick={disconnectHandleClick}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Disconnect
                </MenuItem>
              </Menu>
            </>}
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
            backgroundColor: '#1c1c1c'
          }}
        >
          <Grid sx={{ width: '50%' }}>
            <IconButton onClick={() => {history('/')}}>
              <img src="logo.png" style={{width:50, height:50, cursor : "pointer"}}/>
            </IconButton>
          </Grid>
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon sx={{color: 'white'}}/>
          </IconButton>
        </Toolbar>
        
        <Divider />

        <List >
          <ListItem button onClick={() => {history('/members')}} selected={CurrentPage==='Members'}>
            <ListItemIcon>
              <ManageAccountsIcon sx={{color:'white'}}/>
            </ListItemIcon>
            <ListItemText primary="Members" />
          </ListItem>
          <ListItem button onClick={() => {history('/requests')}} selected={CurrentPage==='All Requests'}>
            <ListItemIcon>
              <FeaturedPlayListIcon sx={{color:'white'}}/>
            </ListItemIcon>
            <ListItemText primary="All Requests" />
          </ListItem>
          <ListItem button onClick={() => {history('/my-requests')}} selected={CurrentPage==='My Requests'}>
            <ListItemIcon>
              <PostAddIcon sx={{color:'white'}}/>
            </ListItemIcon>
            <ListItemText primary="My Requests" />
          </ListItem>
          <ListItem button onClick={() => {history('/approve-requests')}} selected={CurrentPage==='Approve Requests'}>
            <ListItemIcon>
              <ApprovalIcon sx={{color:'white'}}/>
            </ListItemIcon>
            <ListItemText primary="Approve Requests" />
          </ListItem>
        </List>

      </Drawer>
      
    </div>
  );
};

export default Menubar;