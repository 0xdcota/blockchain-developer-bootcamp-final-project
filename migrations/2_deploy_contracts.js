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
