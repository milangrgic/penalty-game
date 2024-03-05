export const setItem = (key, item) => {
    if(item) {
        window.localStorage.setItem(key, item);
    } else {
        window.localStorage.removeItem(key);
    }
}

export const getItem = (key) => {
    if(key) {
        return window.localStorage.getItem(key);
    }
}

export const isAuthenticated = () => {
    if(getItem('access_token')) {
        return true ;
    }
    return false ;
}

export const getMembers = async (community, token) => {
    const allMembers = await community.methods.getMembers().call();

    const members = [];
    for(let member of allMembers) {
      if (await community.methods.isMember(member).call()) {
        const balance = await token.methods.balanceOf(member).call();
        members.push({address: member, balance: (Number(balance) / Math.pow(10, 18)).toFixed(2)});
      }
    }

    return members;
}

export const getTransactionRequests = async (contract) => {
    const allRequests = await contract.methods.getTransferRequests().call();
    const requests = allRequests.map((request, id) => ({id, ...request}));
    return requests;
}

export const isAdmin = (web3Ctx) => {
    return web3Ctx.account === web3Ctx.contracts.admin;
}

const getErrorMessage = (str) => {
    const reason = str?.indexOf('execution reverted: ') === 0 ? str.substr('execution reverted: '.length) : str;
    const text = reason ? reason.split(':') : [];
    const fullText = text.join(', ');
    return fullText.charAt(0).toUpperCase() + fullText.slice(1);
};
  
const parseGasLimitError = (message) => {
    const defaultMessage = 'Unable to determine gas limit';
    try {
      // Find the string reason="" and match anything that isn't a " within the quotes
      const regex = /reason="([^"]+)"/g;
      const reMatch = regex.exec(message);
      if (!reMatch || reMatch.length !== 2) return defaultMessage;
      return reMatch[1];
    } catch (e) {
      return defaultMessage;
    }
};

export const displayErrorMessage = (enqueSnackbar, error) => {
    const err = error;
    let errMessage;
    const errCode = err.code?.toString();
    switch (errCode) {
      case '4001':
        errMessage = 'Transaction rejected by user';
        break;
      case 'UNPREDICTABLE_GAS_LIMIT':
        errMessage = parseGasLimitError(err.message);
        break;
      case 'INSUFFICIENT_FUNDS':
        errMessage = 'Insufficient balance';
        break;
      case '-32603':
        errMessage =
          getErrorMessage(err.data.message) ?? getErrorMessage(err.message) ?? 'Something went wrong. Try again later';
        break;
      case 'INVALID_ARGUMENT':
        errMessage = error?.reason ?? 'Something went wrong. Please try again later.';
        break;
      default:
        errMessage = 'Something went wrong. Please try again later.';
        break;
    }
    enqueSnackbar(errMessage, { variant: 'error' });
  };
  