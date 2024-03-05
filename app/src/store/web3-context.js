import React from 'react';

const Web3Context = React.createContext({
  account: null,
  networkId: null,
  contracts: null,
  loadAccount: () => {},
  loadNetworkId: () => {},
  loadContracts: () => {},
  setAccount: () => {}
});

export default Web3Context;