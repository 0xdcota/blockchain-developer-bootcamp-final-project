const AssetsAccountant = artifacts.require("AssetsAccountant");
const HouseOfCoin = artifacts.require("HouseOfCoin");
const HouseOfReserve = artifacts.require("HouseOfReserve");
const MockOracle = artifacts.require("MockOracle");
const DigitalFiat = artifacts.require("DigitalFiat");
const MockWETH = artifacts.require("MockWETH");

const DEPOSIT_AMOUNT = web3.utils.toBN(web3.utils.toWei("0.5", "ether"));
const WITHDRAW_AMOUNT = web3.utils.toBN(web3.utils.toWei("0.25", "ether"));

const {
    takeSnapshot,
    revertToSnapShot
} = require("./helpers.js");

// start a ganacha-cli by running: < ganache-cli -d >

describe('efiat Sytem Tests', function () {
    this.timeout(0)

    // Global variables
    let accounts;
    let accountant;
    let coinhouse;
    let reservehouse;
    let mockoracle;
    let fiat;
    let mockweth;
    let snapshotId;

    before(async () => {

        // Pre-staging
        accounts = await web3.eth.getAccounts();
        accountant = await AssetsAccountant.deployed();
        coinhouse = await HouseOfCoin.deployed();
        reservehouse = await HouseOfReserve.deployed();
        mockoracle = await MockOracle.deployed();
        fiat = await DigitalFiat.deployed();
        mockweth = await MockWETH.deployed();
        
        // Load first 5 accounts with mockweth
        for(let i =0; i < 5; i++) {
            await mockweth.deposit(
                {
                    from: accounts[i],
                    value: web3.utils.toWei("20", "ether")
                });
        }


        // Mock Oracle Price setting
        await mockoracle.setPrice(web3.utils.toWei("90500", "ether"));

        // Initialize house contracts and register with accountant
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

        // Grant minter and burner roles  for HouseOfCoin in DigitalFiat contract
        const minter = await fiat.MINTER_ROLE();
        const burner = await fiat.BURNER_ROLE();
        await fiat.grantRole(minter, coinhouse.address);
        await fiat.grantRole(burner, coinhouse.address);

        snapshotId = takeSnapshot();
    });

    // Test cases
    contract('HouseOfReserve', async() => {

        afterEach(async () => {
            // Revert back to snapshotID
            revertToSnapShot(snapshotId);
          });

        it("Should deposit and balance match in AssetsAccountant", async () => {
            let user = accounts[1];
            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {
                    from: user
                }
            );

            // Do deposit
            await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {
                    from: user
                }
            );

            // Get minted balance in accountant
            const id = await reservehouse.reserveTokenID();
            const balanceAtAccountant = await accountant.balanceOf(user,id);

            // Final Assert
            assert(
                balanceAtAccountant.eq(DEPOSIT_AMOUNT),
                "balance and DEPOSIT_AMOUNT don't match!" 
            );
        });

        it("Should deposit and withdraw and balance in AssetsAccountant should match difference", async () => {
            let user = accounts[2];
            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {
                    from: user
                }
            );

            // Do deposit
            await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {
                    from: user
                }
            );

            // Do withdraw
            await reservehouse.withdraw(
                WITHDRAW_AMOUNT,
                {
                    from: user
                }
            );

            // Get minted balance in accountant
            const id = await reservehouse.reserveTokenID();
            const balanceAtAccountant = await accountant.balanceOf(user,id);
            const difference = DEPOSIT_AMOUNT.sub(WITHDRAW_AMOUNT);

            // Final Assert
            assert(
                balanceAtAccountant.eq(difference),
                "balanceAtAccountant and computedAmount don't match!" 
            );
        });

    });
  });