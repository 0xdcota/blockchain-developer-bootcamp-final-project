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
  await deployer.deploy(MockeFiat);
  await deployer.deploy(MockWETH);

  let wallets = await accounts;

  // Get the contract objects
  let accountant = await AssetsAccountant.deployed();
  let coinhouse = await HouseOfCoin.deployed();
  let reservehouse = await HouseOfReserve.deployed();
  let fiat = await MockeFiat.deployed();
  let mockweth = await MockWETH.deployed();

  // PRE-STAGING
  // 1.- Initialize house contracts and register with accountant
  await coinhouse.initialize(
    fiat.address,
    accountant.address
  );
  await reservehouse.initialize(
    mockweth.address,
    fiat.address,
    accountant.address
  );
  await accountant.registerHouse(
    coinhouse.address,
    fiat.address
  );
  await accountant.registerHouse(
    reservehouse.address,
    mockweth.address
  );

  // 2.- Assign minter and burner role to coinhouse in fiat ERC20
  const minter = await fiat.MINTER_ROLE();
  const burner = await fiat.BURNER_ROLE();
  await fiat.grantRole(minter, coinhouse.address);
  await fiat.grantRole(burner, coinhouse.address);

  // 3. Authorize Provider
  // 3.1 Build ethers.js contract instance
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = provider.getSigner();

  const simpleABI = [
    "function maxDelay() view returns (uint)",
    "function trustedSigner() view returns (address)",
    "function setMaxDelay(uint maxDelay)",
    "function authorizeSigner(address trustedSigner)",
    "function redstoneGetLastPrice() view returns (uint)"
  ];
  
  const ethersreservehouse = new ethers.Contract(
    reservehouse.address,
    simpleABI,
    signer
  );

  const etherscoinhouse = new ethers.Contract(
    coinhouse.address,
    simpleABI,
    signer
  );

  // 3.2 Wrap the ethers.js contract with Redstone WrapperBuilder
  const wrappedEthersReservehouse = WrapperBuilder
                                    .wrapLite(ethersreservehouse)
                                    .usingPriceFeed("redstone-stocks");
  const wrappedEthersCoinhouse = WrapperBuilder
                                    .wrapLite(etherscoinhouse)
                                    .usingPriceFeed("redstone-stocks");
  
  // 3.3 Authorize the Providers for Redstone wrapped contract requiring price feed.
  let tx1 = await wrappedEthersReservehouse.authorizeProvider();
  await tx1.wait();
  let tx2 = await wrappedEthersCoinhouse.authorizeProvider();
  await tx2.wait();

  // 3.4 Console log test of price feed.
  const priceReserveHouse = await wrappedEthersReservehouse.redstoneGetLastPrice();
  console.log('ReserveHouse redstone price', priceReserveHouse.toString());
  const priceCoinHouse = await wrappedEthersCoinhouse.redstoneGetLastPrice();
  console.log('CoinHouse redstone price', priceCoinHouse.toString());

};