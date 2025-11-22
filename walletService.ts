
export const connectWallet = async (): Promise<string | null> => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error("User denied account access or error occurred", error);
      return null;
    }
  } else {
    alert("No crypto wallet found. Please install MetaMask, Rabby, or Coinbase Wallet.");
    return null;
  }
};

export const getConnectedAccount = async (): Promise<string | null> => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            return accounts && accounts.length > 0 ? accounts[0] : null;
        } catch (e) {
            return null;
        }
    }
    return null;
};

export const listenForAccountChanges = (callback: (account: string | null) => void) => {
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
            callback(accounts.length > 0 ? accounts[0] : null);
        });
    }
};
