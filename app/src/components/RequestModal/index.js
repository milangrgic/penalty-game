import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import { TextField } from '@mui/material';
import Web3Context from '../../store/web3-context';
import { ethers } from 'ethers';
import { useSnackbar } from 'notistack';
import { displayErrorMessage } from '../../utils/helper';
import { LoadingButton } from '@mui/lab';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

export default function RequestModal({open, handleClose, to, isTransfer}) {
    const [amount, setAmount] = React.useState(0);
    const web3Ctx = React.useContext(Web3Context);
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const requestTransactionHandler = async () => {
        setIsSubmitting(true);
        try {
            if(!isTransfer) {
                await web3Ctx.contracts.community.methods.requestTransfer(to, Number(ethers.utils.parseEther(amount))).send({from: web3Ctx.account});
                enqueueSnackbar('Request sent successfully', { variant: 'success' });
                handleClose();
            } else {
                await web3Ctx.contracts.token.methods.transfer(to, Number(ethers.utils.parseEther(amount))).send({from: web3Ctx.account});
                enqueueSnackbar('Token transferred successfully', { variant: 'success' });
                handleClose();
            }
        } catch (error) {
            console.log(error);
            displayErrorMessage(enqueueSnackbar, error);
        }
        setIsSubmitting(false);
    }

    return (
        <Box>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <TextField label='Amount' placeholder='0' variant="outlined" value={amount} onChange={(e) => {setAmount(e.target.value)}} sx={{ width: '100%' }} />
                    <br/>
                    <LoadingButton disabled={isSubmitting} loading={isSubmitting} variant='contained' color='success' onClick={requestTransactionHandler}>{isTransfer ? 'Transfer' : 'Request'}</LoadingButton>
                </Box>
            </Modal>
        </Box>
    );
}