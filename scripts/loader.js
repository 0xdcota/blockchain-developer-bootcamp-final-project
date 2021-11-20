const { ethers } = require("ethers");
const { WrapperBuilder } = require("redstone-flash-storage");

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();

const contractpaths = [
    "./../build/contracts/AssetsAccountant.json",
    "./../build/contracts/HouseOfCoin.json",
    "./../build/contracts/HouseOfReserve.json",
    "./../build/contracts/MockOracle.json",
    "./../build/contracts/DigitalFiat.json",
    "./../build/contracts/MockWETH.json"
  ];
  
  let provider;
  let signer;
  let accounts;
  let accountant;
  let coinhouse;
  let reservehouse;
  let mockoracle;
  let efiat;
  let mockweth;

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
        contractCollector[i] = await redstoneWrap(contract);
    }
    return contractCollector;
}

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

runContractLoader();
