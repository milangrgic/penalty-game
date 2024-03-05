import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import Web3Provider from './store/Web3Provider';
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';

import reportWebVitals from './utils/reportWebVitals';

const getLibrary = (provider) => {
  return new ethers.providers.Web3Provider(provider) ;
}

ReactDOM.render(
  <Web3Provider>
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  </Web3Provider>,
  document.getElementById('root')
);

reportWebVitals();
