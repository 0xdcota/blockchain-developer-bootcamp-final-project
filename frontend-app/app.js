const forwarderOrigin = 'http://localhost:9010'
const URL1 = "https://api.redstone.finance/prices?symbol=MXNUSD=X&provider=redstone-stocks&limit=1";
const URL2 = "https://api.redstone.finance/prices?symbol=ETH&provider=redstone&limit=1";

//Elements of the Website
// Buttons
const onboardButton = document.getElementById('connectButton');
const depositButton = document.getElementById('depositButton');
const withdrawButton = document.getElementById('withdrawButton');
const mintButton = document.getElementById('mintButton');
const paybackButton = document.getElementById('paybackButton');
const triggerOnChainButton = document.getElementById('triggerOnChain');
// Inputs
const wethDepositInput = document.getElementById('wethDepositInput');
const wethWithdrawInput = document.getElementById('wethWithdrawInput');
const efiatMintInput = document.getElementById('efiatMintInput');
const reserveAddrToUse = document.getElementById('reserveAddrToUse');
const efiatPaybackInput = document.getElementById('efiatPaybackInput');
// Labels
const getAccountsResult = document.getElementById('getAccountsResult');
const getAccountBalance = document.getElementById('getAccountBalance');
const mockwethAddr = document.getElementById('mockwethAddr');
const getWETHBalance = document.getElementById('getWETHBalance');
const yourReserves = document.getElementById('yourReserves');
const lockedReserves = document.getElementById('lockedReserves');
const eFIATBalance = document.getElementById('eFIATBalance');
const yourMinted = document.getElementById('yourMinted');
const mintPower = document.getElementById('yourMintPower');
const oraclePrice1 = document.getElementById('oraclePrice1');
const oraclePrice2 = document.getElementById('oraclePrice2');
const oraclePrice3 = document.getElementById('oraclePrice3');
const onChainPrice = document.getElementById('onChainPrice');

// Global Scopte Variables
const contractpaths = [
  "./../build/contracts/AssetsAccountant.json",
  "./../build/contracts/HouseOfCoin.json",
  "./../build/contracts/HouseOfReserve.json",
  "./../build/contracts/MockOracle.json",
  "./../build/contracts/DigitalFiat.json",
  "./../build/contracts/MockWETH.json"
]
let provider;
let signer;
let accounts;
let accountant;
let coinhouse;
let reservehouse;
let mockoracle;
let efiat;
let mockweth;

//********** Functions  **********/

// Contract Loader Functions

const loadContracts = async (paths, signer) => {
  let contractCollector = new Array(paths.length);
  for (let i = 0; i < paths.length; i++) {
      let json = await $.getJSON(paths[i]);
      let abi = json.abi;
      let lastMigration = getLastMigration(json);
      let contract = new ethers.Contract(
        lastMigration.address,
        abi,
        signer
      );
      contractCollector[i] = contract;
      // contractCollector[i] = await redstoneWrap(contract);
  }
  return contractCollector;
}
const getLastMigration = (artifact) => {
  let networks = artifact.networks;
  let timestamps = Object.keys(networks);
  let lastItem = timestamps.length - 1;
  return networks[timestamps[lastItem]];
}

const redstoneWrap = async (contract) => {
  return redstoneFlashStorage.WrapperBuilder
  .wrapLite(contract)
  .usingPriceFeed("redstone");
}

const redstoneAuthorize = async(wrappedContract) => {
  let authTx = await wrappedContract.authorizeProvider();
  let receipt = await authTx.wait(); 
  console.log("authorizeProvider OK", receipt);
}

// Get View Functions

const getNativeBalance = async () => {
  try {
    let balance = await provider.getBalance(accounts[0]);
    balance = balance/1e18;
    getAccountsResult.innerHTML = accounts[0] || 'Not able to get accounts';
    getAccountBalance.innerHTML = balance.toFixed(4) || 'N/A';
  } catch (error) {
    console.log("failed getNativeBalance");
    console.log(error);
  }

}

const getMockWETHBalance = async () => {
  try {
    let mockWETHbal = await mockweth.balanceOf(accounts[0]);
    mockWETHbal = mockWETHbal/1e18;
    mockwethAddr.innerHTML = mockweth.address;
    getWETHBalance.innerHTML = mockWETHbal.toFixed(4);
  } catch (error) {
    console.log("failed getMockWETHBalance");
    console.log(error);
  }
}

const getDepositReservesBalance = async () => {
  try {
    let tokenID = await reservehouse.reserveTokenID();
    let reserveBal = await accountant.balanceOf(accounts[0],tokenID);
    reserveBal = reserveBal/1e18;
    yourReserves.innerHTML = reserveBal.toFixed(4);
    return reserveBal;
  } catch (error) {
    console.log("failed getDepositReservesBalance");
    console.log(error);
  }
}

const geteFiatBalance = async () => {
  try {
    let efiatBal = await efiat.balanceOf(accounts[0]);
    efiatBal = efiatBal/1e18;
    eFIATBalance.innerHTML = moneyFormat(efiatBal);
  } catch (error) {
    console.log("failed geteFiatBalance");
    console.log(error);
  }
}

const getMintefiatBalance = async () => {
  try {
    let tokenID = await reservehouse.backedTokenID();
    let mintedBal = await accountant.balanceOf(accounts[0],tokenID);
    mintedBal = mintedBal/1e18;
    yourMinted.innerHTML = moneyFormat(mintedBal);
  } catch (error) {
    console.log("failed getMintefiatBalance");
    console.log(error);
  }
}

const getMintPower = async () => {
  try {
    let power  = await coinhouse.checkMintingPower(
      accounts[0],
      reservehouse.address,
      mockweth.address
      )
      power = power/1e18;
      mintPower.innerHTML = moneyFormat(power);  
  } catch (error) {
    console.log("failed getMintPower");
    console.log(error); 
  }
}

const getLockedReserves = async () => {
  try {
    let max = await reservehouse.checkMaxWithdrawal(accounts[0]);
    max = max/1e18;
    let reserve = await getDepositReservesBalance();
    let locked = reserve - max;
    console.log(`locked: ${locked.toFixed(4)}, reserve: ${reserve.toFixed(4)}, max: ${max.toFixed(4)}`)
    lockedReserves.innerHTML = locked.toFixed(6);
  } catch (error) {
    console.log("failed getLockedReserves");
    console.log(error); 
  }
}

const moneyFormat = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
}

const priceFetcher = async (url) => {
  try {
    let response = await fetch(url);
    let data = await response.json();
    console.log(data[0]);
    return data[0].value;
  } catch (error) {
    console.log("failed priceFetcher");
    console.log(error);
  }
}

const getOraclePrices = async () => {
  try {
    let priceusdefiat = await priceFetcher(URL1);
    let priceusdeth = await priceFetcher(URL2);
    let compute = priceusdeth / priceusdefiat;
    oraclePrice1.innerHTML = moneyFormat(priceusdefiat);
    oraclePrice2.innerHTML = moneyFormat(priceusdeth);
    oraclePrice3.innerHTML = moneyFormat(compute);
  } catch (error) {
    console.log("failed getOraclePrices");
    console.log(error);
  }
}

const getOnChainOraclePrice = async () => {
  try {
    let price = await mockoracle.redstoneGetLastPrice();
    console.log('daigaro');
    //onChainPrice.innerHTML = price.toFixed(8);  
  } catch (error) {
    console.log("failed getOnChainOraclePrice");
    console.log(error);
  }
}

const getAllUpdateView = async () => {
  getNativeBalance();
  getMockWETHBalance();
  getDepositReservesBalance();
  geteFiatBalance();
  getMintefiatBalance();
  getMintPower();
  getLockedReserves();
  getOraclePrices();
  onboardButton.innerText = 'Refresh Balances';
}

// Interaction Functions

const approveERC20 = async () => {
  try {
    // Check and read Inputvalue
    let inputVal = document.getElementById("wethDepositInput").value;
    let mockWETHbal = await mockweth.balanceOf(accounts[0]);
    if(!inputVal) {
      alert("enter deposit amount value!");
    } else {
      let approvaltx = await mockweth.approve(
        reservehouse.address,
        inputVal
      );
      console.log('approval TxHash', approvaltx);
      await depositReserve(inputVal);
    }
  } catch (error) {
    alert('ERC20 Approval Failed!', error);
  }
}

const depositReserve = async (amount) => {
  try {
    let depositTx = await reservehouse.deposit(amount);
    console.log('deposit TxHash', depositTx);
    let receipt = await depositTx.wait();
    console.log("receipt", receipt);
    await getAllUpdateView();
    alert('Successful Transaction!');
  } catch (error) {
    alert('Deposit Failed!', error);
  }
}

const withdrawReserve = async () => {
  try {
    // Check and read Inputvalue
    let inputVal = document.getElementById("wethWithdrawInput").value;
    let tokenID = await reservehouse.reserveTokenID();
    let reserveBal = await accountant.balanceOf(accounts[0],tokenID);
    let inputValBN;
    if (!inputVal) {
      alert("enter withdraw amount value!");
    } else {
      inputValBN = ethers.BigNumber.from(inputVal);
      if (inputValBN.gt(reserveBal)) {
        alert("cannot withdraw more that reserves!");
      } else {
        let withdrawTx = await reservehouse.withdraw(inputValBN)
        console.log('withdraw TxHash', withdrawTx);
        let receipt = await withdrawTx.wait();
        console.log("receipt", receipt);
        await getAllUpdateView();
        alert('Successful Transaction!');
      } 
    } 
  } catch (error) {
    alert('Withdraw Failed!'+error.data.message);
  }  
}

const mintEfiat = async () => {
  try {
    let inputVal = document.getElementById("efiatMintInput").value;
    let reserveAddress = document.getElementById("reserveAddrToUse").value;
    if(!inputVal) {
      alert("enter amount value!");
    } else {
      if (!reserveAddress) {
        alert("enter address value!");
      } else {
        let inputValBN = ethers.BigNumber.from(inputVal);
        let tokenID = await reservehouse.reserveTokenID();
        let hOfReserve = await accountant.houseOfReserves(tokenID);
        console.log(reserveAddress,hOfReserve,inputValBN);
        let mintTx = await coinhouse.mintCoin(
          reserveAddress,
          hOfReserve,
          inputValBN
        )
        console.log('mintCoin TxHash', mintTx);
        let receipt = await mintTx.wait();
        console.log("receipt", receipt);
        await getAllUpdateView();
        alert('Successful Transaction!');
      }
    }
  } catch (error) {
    alert('Mint Failed!'+error.data.message);
  }
}

const paybackEfiat = async () => {
  let inputVal = document.getElementById("efiatPaybackInput").value;
  if(!inputVal) {
    alert("enter amount value!");
  } else {
    try {
      let inputValBN = ethers.BigNumber.from(inputVal);
      let tokenID = await reservehouse.backedTokenID();
      let paybackTx = await coinhouse.paybackCoin(
        tokenID,
        inputValBN
      )
      console.log('paybackCoin TxHash', paybackTx);
      let receipt = await paybackTx.wait();
      console.log("receipt", receipt);
      await getAllUpdateView();
      alert("Succesful Transaction!");
    } catch (error) {
      alert("Payback Failed!"+error.data.message);
    }

  }
}

const initialize = async() => {

  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();

  const runContractLoader = async () => {
    [
      accountant,
      coinhouse,
      reservehouse,
      mockoracle,
      efiat,
      mockweth
    ] = await loadContracts(contractpaths, signer);
  }

  await runContractLoader();
  // await redstoneAuthorize(mockoracle);


  //Created check function to see if the MetaMask extension is installed
  const isMetaMaskInstalled = () => {
    //Have to check the ethereum binding on the window object to see if it's installed
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  const MetaMaskClientCheck = () => {
    //Now we check to see if MetaMask is installed
    if (!isMetaMaskInstalled()) {
      //If it isn't installed we ask the user to click to install it
      onboardButton.innerText = 'Click here to install MetaMask!';
      //When the button is clicked we call this function
      onboardButton.onclick = onClickInstall;
      //The button is now disabled
      onboardButton.disabled = false;
    } else {
      //If it is installed we change our button text
      onboardButton.innerText = 'Connect';
      //When the button is clicked we call this function to connect the users MetaMask Wallet
      onboardButton.onclick = onClickConnect;
      //The button is now disabled
      onboardButton.disabled = false;
    }
  };

  //We create a new MetaMask onboarding object to use in our app
  const onboarding = new MetaMaskOnboarding({ forwarderOrigin });

  //This will start the onboarding proccess
  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress';
    onboardButton.disabled = true;
    //On this object we have startOnboarding which will start the onboarding process for our end user
    onboarding.startOnboarding();
  };

  // Will connect to metamask
  const onClickConnect = async () => {
    try {
      // Will open the MetaMask UI
      // You should disable this button while the request is pending!
      getAllUpdateView();

    } catch (error) {
      console.error(error);
    }
  };

  /// Application running
  MetaMaskClientCheck();
  accounts = await ethereum.request({ method: 'eth_requestAccounts' });  
}

window.addEventListener('DOMContentLoaded', initialize);

depositButton.onclick = approveERC20;
withdrawButton.onclick = withdrawReserve;
mintButton.onclick = mintEfiat;
paybackButton.onclick = paybackEfiat;
triggerOnChainButton.onclick = getOnChainOraclePrice;


