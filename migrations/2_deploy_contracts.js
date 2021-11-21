const AssetsAccountant = artifacts.require("AssetsAccountant");
const HouseOfCoin = artifacts.require("HouseOfCoin");
const HouseOfReserve = artifacts.require("HouseOfReserve");
const MockOracle = artifacts.require("MockOracle");
const MockeFiat = artifacts.require("MockeFiat");
const MockWETH = artifacts.require("MockWETH");

module.exports = async function (deployer, network, accounts) {

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

  // 2.- Load first 5 accounts with mockweth
  for(let i =0; i < 7; i++) {
    await mockweth.deposit(
        {
            from: accounts[i],
            value: web3.utils.toWei("20", "ether")
        });
  }

  // 3.- Initialize house contracts and register with accountant
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

  // Authorize Provider
  // mockoracle = WrapperBuilder.wrapLite(mockoracle).usingPriceFeed("redstone-stocks");
  // // console.log(mockoracle);
  // await mockoracle.authorizeSigner('0x926E370fD53c23f8B71ad2B3217b227E41A92b12');
                    
};