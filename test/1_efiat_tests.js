const AssetsAccountant = artifacts.require("AssetsAccountant");
const HouseOfCoin = artifacts.require("HouseOfCoin");
const HouseOfReserve = artifacts.require("HouseOfReserve");
const MockOracle = artifacts.require("MockOracle");
const DigitalFiat = artifacts.require("DigitalFiat");
const MockWETH = artifacts.require("MockWETH");

const DEPOSIT_AMOUNT = web3.utils.toBN(web3.utils.toWei("0.5", "ether"));
const WITHDRAW_AMOUNT = web3.utils.toBN(web3.utils.toWei("0.25", "ether"));

describe('efiat Sytem Tests', function () {
    this.timeout(0)

    // Global variables
    let accounts;
    let USER;;
    let accountant;
    let coinhouse;
    let reservehouse;
    let mockoracle;
    let fiat;
    let mockweth;

    before(async () => {

        // Pre-staging
        accounts = await web3.eth.getAccounts();
        USER = accounts[1];
        accountant = await AssetsAccountant.deployed();
        coinhouse = await HouseOfCoin.deployed();
        reservehouse = await HouseOfReserve.deployed();
        mockoracle = await MockOracle.deployed();
        fiat = await DigitalFiat.deployed();
        mockweth = await MockWETH.deployed();
        
        // Load accounts[0] with mockweth
        await mockweth.deposit(
            {
                from: USER,
                value: web3.utils.toWei("20", "ether")
            });

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
    });

    // Test cases
    contract('HouseOfReserve', async() => {

        it("Should deposit and balance match in AssetsAccountant", async () => {
            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {
                    from: USER
                }
            );

            // Do deposit
            await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {
                    from: USER
                }
            );

            // Get minted balance in accountant
            const id = await reservehouse.reserveTokenID();
            const balanceAtAccountant = await accountant.balanceOf(USER,id);

            // Final Assert
            assert(
                balanceAtAccountant.eq(DEPOSIT_AMOUNT),
                "balance and DEPOSIT_AMOUNT don't match!" 
            );
        });

    });
  });