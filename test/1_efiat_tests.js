const AssetsAccountant = artifacts.require("AssetsAccountant");
const HouseOfCoin = artifacts.require("HouseOfCoin");
const HouseOfReserve = artifacts.require("HouseOfReserve");
const MockOracle = artifacts.require("MockOracle");
const DigitalFiat = artifacts.require("DigitalFiat");
const MockWETH = artifacts.require("MockWETH");

const DEPOSIT_AMOUNT = web3.utils.toBN(web3.utils.toWei("2", "ether"));
const WITHDRAW_AMOUNT = web3.utils.toBN(web3.utils.toWei("0.25", "ether"));
const MINT_AMOUNT = web3.utils.toBN(web3.utils.toWei("10000", "ether"));
const PAYBACK_AMOUNT = web3.utils.toBN(web3.utils.toWei("5000", "ether"));

const {
    takeSnapshot,
    revertToSnapShot
} = require("./helpers.js");
const { catchRevert } = require("./exceptionsHelpers.js");

// start a ganacha-cli by running: < ganache-cli -d >

describe('efiat Sytem Tests', function () {
    this.timeout(0)

    // Global Test variables
    let accounts;
    let accountant;
    let coinhouse;
    let reservehouse;
    let mockoracle;
    let fiat;
    let mockweth;
    let snapshotId;

    let rid;
    let bid;

    before(async () => {

        // Getting contracts in global test scope
        accounts = await web3.eth.getAccounts();
        accountant = await AssetsAccountant.deployed();
        coinhouse = await HouseOfCoin.deployed();
        reservehouse = await HouseOfReserve.deployed();
        mockoracle = await MockOracle.deployed();
        fiat = await DigitalFiat.deployed();
        mockweth = await MockWETH.deployed();

        rid = await reservehouse.reserveTokenID();
        bid = await reservehouse.backedTokenID();

        // Load first accounts with mockweth
        for(let i =0; i < 7; i++) {
            await mockweth.deposit(
                {
                    from: accounts[i],
                    value: web3.utils.toWei("20", "ether")
                });
        }

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

        it("should log a deposit event when a deposit is made", async () => {
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
            const result = await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {
                    from: user
                }
            );
            const expectedEventResult = { 
                user: user,
                asset: mockweth.address,
                amount: DEPOSIT_AMOUNT 
            };
        
            const logUser = result.logs[0].args.user;
            const logAsset = result.logs[0].args.asset;
            const logAmount = result.logs[0].args.amount;
        
            assert(
              expectedEventResult.user == logUser &&
              expectedEventResult.asset == logAsset &&
              logAmount.eq(expectedEventResult.amount),
              "UserDeposit event properties not emitted correctly, check method",
            );
          });

        it("Should deposit and withdraw, with balance in AssetsAccountant matching difference", async () => {
            let user = accounts[3];
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
            const computedDiff = DEPOSIT_AMOUNT.sub(WITHDRAW_AMOUNT);

            // Final Assert
            assert(
                balanceAtAccountant.eq(computedDiff),
                "balanceAtAccountant and computedAmount don't match!" 
            );
        });

        it("should log a UserWithdraw event when a withdraw is made", async () => {
            let user = accounts[4];
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
            const result = await reservehouse.withdraw(
                WITHDRAW_AMOUNT,
                {
                    from: user
                }
            );
            const expectedEventResult = { 
                user: user,
                asset: mockweth.address,
                amount: WITHDRAW_AMOUNT 
            };
        
            const logUser = result.logs[0].args.user;
            const logAsset = result.logs[0].args.asset;
            const logAmount = result.logs[0].args.amount;

            assert(
              expectedEventResult.user == logUser &&
              expectedEventResult.asset == logAsset &&
              logAmount.eq(expectedEventResult.amount),
              "UserWithdraw event properties not emitted correctly, check method",
            );
          });

        it("Only DEFAULT_ADMIN should be able to change collateralRatio", async () => {
            const admin = accounts[0];
            const baduser = accounts[5];

            // Get original collateralization ratio
            const orignalCollateralRatio = await reservehouse.collateralRatio();
            
            // BadUser tries to change collateralization ratio
            await catchRevert(reservehouse.setCollateralRatio(3, 1, {from: baduser}));

            const attempCollateralRatio = await reservehouse.collateralRatio();

            // Assert that collateralization has not changed
            assert(
                orignalCollateralRatio != attempCollateralRatio,
                "Wrong user changed collateralRatio, check function"
            );

            // Now try with Admin 
            await reservehouse.setCollateralRatio(3, 1, {from: admin});

            // Get new collateralization ratio
            const newCollateralRatio = await reservehouse.collateralRatio();

            // Final Assert
            assert(
                newCollateralRatio[0].eq(web3.utils.toBN("3")) &&
                newCollateralRatio[1].eq(web3.utils.toBN("1")),
                "Collateral ratio not change properly by admin, check function"
            );
        });

        it("When no minted backed asset, max withdrawal amount should equal deposited amount", async () => {
            let user = accounts[5];
            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {
                    from: user
                }
            );
            // Do deposit
            const result = await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {
                    from: user
                }
            );
            let maxwithdrawal = await reservehouse.checkMaxWithdrawal(user);

            // Final assert
            assert(
                maxwithdrawal.eq(DEPOSIT_AMOUNT),
                "Check function computation"
            );
        });
    });

    contract('HouseOfCoin', async() => {
        afterEach(async() => {
            // Revert back to snapshotID
            revertToSnapShot(snapshotId);
         });

         it("Should not mint coin, when no reserves", async () => {
            let user = accounts[1];
            // Assert User has no reserve
            const userReserves = await accountant.balanceOf(user, rid);
            assert(
                userReserves.eq(web3.utils.toBN("0")),
                "User has reserves"

            );
            // Try to mint coin with no reserves
            await catchRevert(coinhouse.mintCoin(
                mockweth.address,
                reservehouse.address,
                MINT_AMOUNT,
                {from: user}
            ));
        });

        it("Should compute minting power properly", async () => {
            let user = accounts[6];
            // Compute expected minting power
            const price = await mockoracle.getLastPrice();
            const collateralRatio = await reservehouse.collateralRatio();
            const reducedReserve = 
                DEPOSIT_AMOUNT.mul(collateralRatio.denominator).div(collateralRatio.numerator);
            
            const ETH_UNIT = web3.utils.toBN(web3.utils.toWei("1", "ether"));
            const expMintPower = reducedReserve.mul(price).div(ETH_UNIT);

            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Do deposit
            await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {from: user}
            );

            const mintPower = await coinhouse.checkMintingPower(
                user, mockweth.address
            );

            assert(
                expMintPower.eq(mintPower),
                "Expected and on-chain mintPower do not match, check function!"
            );
        });

        it("Should mint coin; erc20 bal and bal at accountant should match", async () => {
            let user = accounts[2];
            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Do deposit
            await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Mint coin
            await coinhouse.mintCoin(
                mockweth.address,
                reservehouse.address,
                MINT_AMOUNT,
                {from: user}
            );

            const expAcctBalance = await accountant.balanceOf(user, bid);
            const erc20Bal = await fiat.balanceOf(user);

            assert(
                expAcctBalance.eq(MINT_AMOUNT) &&
                erc20Bal.eq(expAcctBalance),
                "Minted coin do not match, check function"
            );
        });

        it("Should emit a CoinMinted event when coin is minted", async () => {
            let user = accounts[3];
            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Do deposit
            await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Mint coin
            const result = await coinhouse.mintCoin(
                mockweth.address,
                reservehouse.address,
                MINT_AMOUNT,
                {from: user}
            );

            const expectedEventResult = { 
                user: user,
                backedtokenID: bid,
                amount: MINT_AMOUNT 
            };
            const logUser = result.logs[0].args.user;
            const logbackedtokenID = result.logs[0].args.backedtokenID;
            const logAmount = result.logs[0].args.amount;
            assert(
              expectedEventResult.user == logUser &&
              logbackedtokenID.eq(expectedEventResult.backedtokenID) &&
              logAmount.eq(expectedEventResult.amount),
              "CoinMinted event properties not emitted correctly, check method",
            );
        });

        it("Should payback coin; erc20 bal and bal at accountant change should match", async () => {
            let user = accounts[4];
            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Do deposit
            await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Mint coin
            await coinhouse.mintCoin(
                mockweth.address,
                reservehouse.address,
                MINT_AMOUNT,
                { from: user}
            );
            // Mint coin
            await coinhouse.paybackCoin(
                bid,
                PAYBACK_AMOUNT,
                { from: user}
            );
            const experc20bal = await fiat.balanceOf(user);
            const expDiff = MINT_AMOUNT.sub(PAYBACK_AMOUNT);
            assert(
                expDiff.eq(experc20bal),
                "Expected ERc20 balance and computed diff do not match, check function"
            );
        });

        it("Should emit a CoinPayback event when coin is payback", async () => {
            let user = accounts[5];
            // ERC20 Allowance
            await mockweth.approve(
                reservehouse.address,
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Do deposit
            await reservehouse.deposit(
                DEPOSIT_AMOUNT,
                {from: user}
            );
            // Mint coin
            await coinhouse.mintCoin(
                mockweth.address,
                reservehouse.address,
                MINT_AMOUNT,
                {from: user}
            );
            // Mint coin
            const result = await coinhouse.paybackCoin(
                bid,
                PAYBACK_AMOUNT,
                { from: user}
            );

            const expectedEventResult = { 
                user: user,
                backedtokenID: bid,
                amount: PAYBACK_AMOUNT 
            };
            const logUser = result.logs[0].args.user;
            const logbackedtokenID = result.logs[0].args.backedtokenID;
            const logAmount = result.logs[0].args.amount;
            assert(
              expectedEventResult.user == logUser &&
              logbackedtokenID.eq(expectedEventResult.backedtokenID) &&
              logAmount.eq(expectedEventResult.amount),
              "CoinPayback event properties not emitted correctly, check method",
            );
        });
    });
  });