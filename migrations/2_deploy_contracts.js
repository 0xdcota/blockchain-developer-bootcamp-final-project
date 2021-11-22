const AssetsAccountant = artifacts.require("AssetsAccountant");
const HouseOfCoin = artifacts.require("HouseOfCoin");
const HouseOfReserve = artifacts.require("HouseOfReserve");
const MockOracle = artifacts.require("MockOracle");
const MockeFiat = artifacts.require("MockeFiat");
const MockWETH = artifacts.require("MockWETH");

module.exports = async function (deployer, network, accounts) {

  const { ethers } = require("ethers");
  const { WrapperBuilder } = require("redstone-flash-storage");

  await deployer.deploy(AssetsAccountant);
  await deployer.deploy(HouseOfCoin);
  await deployer.deploy(HouseOfReserve);
  await deployer.deploy(MockOracle, "eFIAT", 18);
  await deployer.deploy(MockeFiat);
  await deployer.deploy(MockWETH);

  let wallets = await accounts;

  // Get the contract objects
  let accountant = await AssetsAccountant.deployed();
  let coinhouse = await HouseOfCoin.deployed();
  let reservehouse = await HouseOfReserve.deployed();
  let mockoracle = await MockOracle.deployed();
  let fiat = await MockeFiat.deployed();
  let mockweth = await MockWETH.deployed();

  // PRE-STAGING
  // 1.- Set oracle price in oracle mock
  await mockoracle.setPrice(web3.utils.toWei("90500", "ether"));

  // 2.- Initialize house contracts and register with accountant
  await coinhouse.initialize(
    fiat.address,
    accountant.address,
    mockoracle.address
  );
  await reservehouse.initialize(
    mockweth.address,
    fiat.address,
    accountant.address,
    mockoracle.address
  );
  await accountant.registerHouse(
    coinhouse.address,
    fiat.address
  );
  await accountant.registerHouse(
    reservehouse.address,
    mockweth.address
  );

  // 4.- Assign minter and burner role to coinhouse in fiat ERC20
  const minter = await fiat.MINTER_ROLE();
  const burner = await fiat.BURNER_ROLE();
  await fiat.grantRole(minter, coinhouse.address);
  await fiat.grantRole(burner, coinhouse.address);

  // 5. Authorize Provider
  // 5.1 Build ethers.js contract instance
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = provider.getSigner();

  const mockOraclesimpleABI = [
    "function trackingAssetSymbol() view returns (string)",
    "function lastPrice() view returns (uint)",
    "function oraclePriceDecimals() view returns (uint)",
    "function getLastPrice() view returns (uint)",
    "function setPrice(uint newPrice)",
    "function redstoneGetLastPrice() view returns (uint)",
    "function maxDelay() view (uint)",
    "function trustedSigner() view returns (address)",
    "funtion setMaxDelay(uint256 _maxDelay)",
    "function authorizeSigner(address _trustedSigner)",
  ];
  
  const ethersmockoracle = new ethers.Contract(
    mockoracle.address,
    mockOraclesimpleABI,
    signer
  );

  const wrappedEthersMockOracle = WrapperBuilder
                                    .wrap(ethersmockoracle)
                                    .usingPriceFeed("redstone-stocks");
              
 await wrappedEthersMockOracle.authorizeProvider();
                    
};