const AssetsAccountant = artifacts.require("AssetsAccountant");
const HouseOfCoin = artifacts.require("HouseOfCoin");
const HouseOfReserve = artifacts.require("HouseOfReserve");
const MockOracle = artifacts.require("MockOracle");
const DigitalFiat = artifacts.require("DigitalFiat");
const MockWETH = artifacts.require("MockWETH");

module.exports = async function (deployer) {
  deployer.deploy(AssetsAccountant);
  deployer.deploy(HouseOfCoin);
  deployer.deploy(HouseOfReserve);
  deployer.deploy(MockOracle, "eFIAT", 18);
  deployer.deploy(DigitalFiat);
  deployer.deploy(MockWETH);
};

// let wallets = await web3.eth.getAccounts();
// let accountant = await AssetsAccountant.deployed();
// let coinhouse = await HouseOfCoin.deployed();
// let reserverhouse = await HouseOfReserve.deployed();
// let oracle = await MockOracle.deployed();
// let fiat = await DigitalFiat.deployed();
// let weth = await MockWETH.deployed();

// PRE-STAGING
// await weth.deposit({value: 20e18});
// await oracle.setPrice(9.560000999999999e+22);

// SET_UP
// let minter = await fiat.MINTER_ROLE();
// await fiat.grantRole(minter, coinhouse.address);
// await coinhouse.initialize(fiat.address, accountant.address, oracle.address);

