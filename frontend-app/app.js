$('#loadcircle').hide();
const forwarderOrigin = 'http://localhost:9010'
const URL1 = "https://api.redstone.finance/prices?symbol=MXNUSD=X&provider=redstone-stocks&limit=1";
const URL2 = "https://api.redstone.finance/prices?symbol=ETH&provider=redstone&limit=1";

//Elements of the Website
// Buttons
const onboardButton = document.getElementById('connectButton');
const getSomeButton = document.getElementById('getSomeButton');
const depositButton = document.getElementById('depositButton');
const withdrawButton = document.getElementById('withdrawButton');
const mintButton = document.getElementById('mintButton');
const paybackButton = document.getElementById('paybackButton');
const triggerOnChainButton = document.getElementById('triggerOnChain');
// Inputs
const wethDepositInput = document.getElementById('wethDepositInput');
const wethWithdrawInput = document.getElementById('wethWithdrawInput');
const efiatMintInput = document.getElementById('efiatMintInput');
const efiatPaybackInput = document.getElementById('efiatPaybackInput');
// Labels
const getAccountsResult = document.getElementById('getAccountsResult');
const getAccountBalance = document.getElementById('getAccountBalance');
const mockwethAddr = document.getElementById('mockwethAddr');
const getWETHBalance = document.getElementById('getWETHBalance');
const yourReserves = document.getElementById('yourReserves');
const lockedReserves = document.getElementById('lockedReserves');
const collateralRatio = document.getElementById('collateralRatio');
const efiatAddr = document.getElementById('efiatAddr');
const MockeFiatBalance = document.getElementById('mockEfiatBalance');
const yourMinted = document.getElementById('yourMinted');
const mintPower = document.getElementById('yourMintPower');
const oraclePrice1 = document.getElementById('oraclePrice1');
const oraclePrice2 = document.getElementById('oraclePrice2');
const oraclePrice3 = document.getElementById('oraclePrice3');
// const onChainPrice = document.getElementById('onChainPrice');

// Other Elements
const loaderCircle = document.getElementById('loadcircle');

// Global Scopte Variables
const contractpaths = [
  "./../build/contracts/AssetsAccountant.json",
  "./../build/contracts/HouseOfCoin.json",
  "./../build/contracts/HouseOfReserve.json",
  "./../build/contracts/MockOracle.json",
  "./../build/contracts/MockeFiat.json",
  "./../build/contracts/MockWETH.json"
]

// const addressespath = "./frontend-app/deployed_addresses.json";

let provider;
let signer;
let chainId;
let accounts;
let accountant;
let coinhouse;
let reservehouse;
let mockoracle;
let mockefiat;
let mockweth;

//********** Functions  **********/

// Contract Loader Functions

const loadContracts = async (paths, signer) => {
  let contractCollector = new Array(paths.length);
  // const addresses = await $.getJSON(addressespath); // CHANGE HERE FOR WEBSITE
  for (let i = 0; i < paths.length; i++) {
      let json = await $.getJSON(paths[i]);
      let abi = json.abi;
      let lastMigration = getLastMigration(json);
      let contract = new ethers.Contract(
        lastMigration.address,
        // addresses[i], // CHANGE HERE FOR WEBSITE
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

const redstoneWrap = (contract) => {
  return redstoneFlashStorage.WrapperBuilder
  .wrapLite(contract)
  .usingPriceFeed("redstone-stocks");
}

const redstoneAuthorize = async(wrappedContract) => {
  let authTx = await wrappedContract.authorizeProvider();
  let receipt = await authTx.wait(); 
  console.log("authorizeProvider OK", receipt);
}

// Website
const handleChain = (_chainId) => {
  // We recommend reloading the page, unless you must do otherwise
  if(_chainId != 42 && _chainId != 1337) {
    alert('Switch to Kovan TestNet! or to Localhost if using local development environment');
    window.location.reload();
  } 
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

const getMockeFiatBalance = async () => {
  try {
    let mefiatBal = await mockefiat.balanceOf(accounts[0]);
    mefiatBal = mefiatBal/1e18;
    efiatAddr.innerHTML = mockefiat.address;
    MockeFiatBalance.innerHTML = moneyFormat(mefiatBal);
  } catch (error) {
    console.log("failed getMockeFiatBalance");
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
    let tokenID = await reservehouse.reserveTokenID();
    let power  = await coinhouse.checkMintingPower(
      accounts[0],
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
    lockedReserves.innerHTML = locked.toFixed(6);
  } catch (error) {
    console.log("failed getLockedReserves");
    console.log(error); 
  }
}

const getCollateralRatio = async () => {
  try {
    let factor = await reservehouse.collateralRatio();
    factor = (factor.numerator.toNumber()*100) / (factor.denominator.toNumber());
    collateralRatio.innerText = factor.toFixed(1);
  } catch (error) {
    console.log("failed getCollateralRatio");
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

const syncTime = async function () {
  const now = Math.ceil(new Date().getTime() / 1000);
  try {
    await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
  } catch (error) {
    //Skipping time sync - block is ahead of current time
  }
}

const getOnChainOraclePrice = async () => {
  try {
    let wmockoracle = redstoneWrap(mockoracle);
    let price = await wmockoracle.redstoneGetLastPrice();
    price = price/1e8;
    console.log("onChainOraclePrice: ", price.toFixed(2));
    onChainPrice.innerHTML = moneyFormat(price);  
  } catch (error) {
    console.log("failed getOnChainOraclePrice");
    console.log(error);
  }
}

const getAllUpdateView = async () => {
  getNativeBalance();
  getMockWETHBalance();
  getDepositReservesBalance();
  getMockeFiatBalance();
  getMintefiatBalance();
  getMintPower();
  getLockedReserves();
  getCollateralRatio();
  getOraclePrices();
  onboardButton.innerText = 'Refresh Balances';
}

// Interaction Functions

const getMockWETHFaucet = async () => {
  $('#loadcircle').show();
  try {
    const faucetTX = await mockweth.getFromFaucet();
    console.log('getMockFaucet, Txhash', faucetTX);
    const receipt = await faucetTX.wait();
    console.log("receipt", receipt);
    await getAllUpdateView();
    alert('Successful Transaction!');
  } catch (error) {
    alert('Faucet Failed!');
    console.log(error);
    $('#loadcircle').hide();
  }
  $('#loadcircle').hide();
}

const holdTime = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const approveERC20 = async () => {
  // Check and read Inputvalue
  let inputVal = document.getElementById("wethDepositInput").value;
  if(!inputVal) {
    alert("enter deposit amount value to approve!");
  } else {
    $('#loadcircle').show();
    try {
      inputVal = ethers.utils.parseUnits(inputVal.toString(), 18);
      let approvaltx = await mockweth.approve(
        reservehouse.address,
        inputVal
      );
      console.log('approval TxHash', approvaltx);
      await holdTime(10000);
      await depositReserve(inputVal);
    } catch (error) {
      alert(`ERC20 Approval Failed!`);
      console.log(error);
      $('#loadcircle').hide();
    }
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
    alert(`Deposit Failed!`);
    console.log(error);
    $('#loadcircle').hide();
  }
  $('#loadcircle').hide();
}

const withdrawReserve = async () => {
  // Check and read Inputvalue
  let inputVal = document.getElementById("wethWithdrawInput").value;
  let tokenID = await reservehouse.reserveTokenID();
  let reserveBal = await accountant.balanceOf(accounts[0],tokenID);
  let inputValBN;
  if (!inputVal) {
    alert("enter withdraw amount value!");
  } else {
    inputVal = ethers.utils.parseUnits(inputVal.toString(), 18);
    inputValBN = ethers.BigNumber.from(inputVal);
    if (inputValBN.gt(reserveBal)) {
      alert("cannot withdraw more than reserves!");
    } else {
      $('#loadcircle').show();
      try {
        let withdrawTx = await reservehouse.withdraw(inputValBN)
        console.log('withdraw TxHash', withdrawTx);
        let receipt = await withdrawTx.wait();
        console.log("receipt", receipt);
        await getAllUpdateView();
        alert('Successful Transaction!');
      } catch (error) {
        alert(`Withdraw Failed!`);
        console.log(error);
        $('#loadcircle').hide();
      }
      $('#loadcircle').hide();
    } 
  }
}
    
const mintEfiat = async () => {
  let inputVal = document.getElementById("efiatMintInput").value;
  if(!inputVal) {
    alert("enter amount value!");
  } else {
    $('#loadcircle').show();
    try {
      inputVal = ethers.utils.parseUnits(inputVal.toString(), 18);
      let inputValBN = ethers.BigNumber.from(inputVal);
      let tokenID = await reservehouse.reserveTokenID();
      let hOfReserve = await accountant.houseOfReserves(tokenID);
      let mintTx = await coinhouse.mintCoin(
        mockweth.address,
        hOfReserve,
        inputValBN
      )
      console.log('mintCoin TxHash', mintTx);
      let receipt = await mintTx.wait();
      console.log("receipt", receipt);
      await getAllUpdateView();
      alert('Successful Transaction!');
    } catch (error) {
      alert(`mintEfiat Failed!`);
      console.log(error);
      $('#loadcircle').hide(); 
    }
    $('#loadcircle').hide();
  }
}

const paybackEfiat = async () => {
  let inputVal = document.getElementById("efiatPaybackInput").value;
  if(!inputVal) {
    alert("enter amount value!");
  } else {
    $('#loadcircle').show();
    try {
      inputVal = ethers.utils.parseUnits(inputVal.toString(), 18);
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
      alert(`Payback Failed!`);
      console.log(error);
      $('#loadcircle').hide();
    }
    $('#loadcircle').hide();
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
      mockefiat,
      mockweth
    ] = await loadContracts(contractpaths, signer);
  }

  await runContractLoader();

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
    handleChain(chainId);
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
  chainId = await ethereum.request({ method: 'eth_chainId' });
}

window.addEventListener('DOMContentLoaded', initialize);

getSomeButton.onclick = getMockWETHFaucet;
depositButton.onclick = approveERC20;
withdrawButton.onclick = withdrawReserve;
mintButton.onclick = mintEfiat;
paybackButton.onclick = paybackEfiat;
triggerOnChainButton.onclick = getOnChainOraclePrice;

ethereum.on('chainChanged', (chainId) => {
  console.log('detected chain change, ChainID:',chainId);
  handleChain(chainId);
});