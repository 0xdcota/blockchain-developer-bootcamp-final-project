const AssetsAccountant = artifacts.require("AssetsAccountant");
const HouseOfCoin = artifacts.require("HouseOfCoin");
const HouseOfReserve = artifacts.require("HouseOfReserve");
const MockOracle = artifacts.require("MockOracle");
const DigitalFiat = artifacts.require("DigitalFiat");
const MockWETH = artifacts.require("MockWETH");

module.exports = async function (deployer, network, accounts) {

  await deployer.deploy(AssetsAccountant);
  await deployer.deploy(HouseOfCoin);
  await deployer.deploy(HouseOfReserve);
  await deployer.deploy(MockOracle, "eFIAT", 18);
  await deployer.deploy(DigitalFiat);
  await deployer.deploy(MockWETH);

  let wallets = await accounts;

  // Get the contract objects
  let accountant = await AssetsAccountant.deployed();
  let coinhouse = await HouseOfCoin.deployed();
  let reservehouse = await HouseOfReserve.deployed();
  let mockoracle = await MockOracle.deployed();
  let fiat = await DigitalFiat.deployed();
  let mockweth = await MockWETH.deployed();

  // PRE-STAGING
  // 1.- Set oracle price in oracle mock
  await mockoracle.setPrice(web3.utils.toWei("90500", "ether"));

  // 2.- Load first 5 accounts with mockweth
  for(let i =0; i < 5; i++) {
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

