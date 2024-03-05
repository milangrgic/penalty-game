import { useReducer } from 'react';

import Web3Context from './web3-context';
const deployments = require('../static/contracts.json');
const tokenContractAbi = require('../static/abi/MyToken.json');
const communityContractAbi = require('../static/abi/CommunityContract.json');
const poolContractAbi = require('../static/abi/PoolContract.json');

const defaultWeb3State = {
  account: null,
  networkId: null,
  contracts: null,
};

const web3Reducer = (state, action) => {
  if(action.type === 'ACCOUNT') {
    return {
      account: action.account,
      networkId: state.networkId,
      contracts: state.contracts
    };
  } 
  
  if(action.type === 'NETWORKID') {
    return {
      account: state.account,
      networkId: action.networkId,
      contracts: state.contracts
    };
  }
  
  if(action.type === 'CONTRACTS') {
    return {
      account: state.account,
      networkId: state.networkId,
      contracts: action.contracts
    };
  }

  if(action.type === 'DISCONNECT') {
    return {
      account: null,
      networkId: null,
      contracts: null
    };
  }
  
  return defaultWeb3State;
};

const Web3Provider = props => {
  const [web3State, dispatchWeb3Action] = useReducer(web3Reducer, defaultWeb3State);

  const setAccountHandler = async (newAccount) => {
    if(newAccount === null) {
      dispatchWeb3Action({type: 'DISCONNECT'});
    } else {
      dispatchWeb3Action({type: 'ACCOUNT', account: newAccount});
    }
  }
  
  const loadAccountHandler = async (web3) => {
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    dispatchWeb3Action({type: 'ACCOUNT', account: account});
    return account;
  };

  const loadNetworkIdHandler = async (web3) => {
    const networkId = await web3.eth.net.getId();
    dispatchWeb3Action({type: 'NETWORKID', networkId: networkId});
    return networkId;   
  };
  
  const loadContractsHandler = async (web3) => {
    const token = new web3.eth.Contract(tokenContractAbi, deployments.token);
    const pool = new web3.eth.Contract(poolContractAbi, deployments.pool);
    const community = new web3.eth.Contract(communityContractAbi, deployments.community);
    
    const admin = await community.methods.admin().call();

    const contracts = {token, pool, community, admin};
    dispatchWeb3Action({type: 'CONTRACTS', contracts: contracts});
    return contracts;
  };
  
  const web3Context = {
    account:web3State.account,
    networkId: web3State.networkId,
    contracts: web3State.contracts,
    data: web3State.data,
    loadAccount: loadAccountHandler,
    loadNetworkId: loadNetworkIdHandler,
    loadContracts: loadContractsHandler,
    setAccount: setAccountHandler
  };
  
  return (
    <Web3Context.Provider value={web3Context}>
      {props.children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;