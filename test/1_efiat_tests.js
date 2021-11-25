// Parameters required to test implementation of RedStone Oracle
// Redstone wrapperBuilder requires Contracts in Ethers.js

const { ethers } = require("ethers");
const { WrapperBuilder } = require("redstone-flash-storage");

const getSigners = function (accounts) {
    let arraySigners = [];
    for (let index = 0; index < accounts.length; index++) {
        arraySigners.push(provider.getSigner(index));
    }
    return arraySigners;
}

const transformToEthers = function(web3Contract, signer) {
    return new ethers.Contract(
        web3Contract.address,
        web3Contract.contract._jsonInterface,
        signer
    );
}

const redstoneWrap = function (contract) {
    return WrapperBuilder.wrapLite(contract)
    .usingPriceFeed("redstone-stocks");
}

const provider = new ethers.providers.JsonRpcProvider();
let ethersAccounts;
let signers;

const ethersRoutine = async () => {
    ethersAccounts = await  provider.listAccounts();
    signers = getSigners(ethersAccounts);
}

ethersRoutine();

/**********************************************************/

const AssetsAccountant = artifacts.require("AssetsAccountant");
const HouseOfCoin = artifacts.require("HouseOfCoin");
const HouseOfReserve = artifacts.require("HouseOfReserve");
const DigitalFiat = artifacts.require("MockeFiat");
const MockWETH = artifacts.require("MockWETH");

const DEPOSIT_AMOUNT = ethers.utils.parseUnits("2", 18);
const WITHDRAW_AMOUNT = ethers.utils.parseUnits("0.25", 18);
const MINT_AMOUNT = ethers.utils.parseUnits("10000", 18);
const PAYBACK_AMOUNT = ethers.utils.parseUnits("5000", 18);

const {
    takeSnapshot,
    revertToSnapShot
} = require("./helpers.js");

const { catchRevert } = require("./exceptionsHelpers.js");

// start a ganacha-cli by running: < ganache-cli -d >

describe('efiat Sytem Tests', function () {
    this.timeout(0)

    // Global Test variables
    let accountant;
    let coinhouse;
    let reservehouse;
    let fiat;
    let mockweth;
    let snapshotId;

    let rid;
    let bid;

    before(async () => {

        // Getting contracts in global test scope using web3js
        accountant = await AssetsAccountant.deployed();
        coinhouse = await HouseOfCoin.deployed();
        reservehouse = await HouseOfReserve.deployed();
        fiat = await DigitalFiat.deployed();
        mockweth = await MockWETH.deployed();

        // Contracts must be transformed to ethersjs and get RedstoneWrapped
        accountant = redstoneWrap(transformToEthers(accountant, signers[0]));
        coinhouse = redstoneWrap(transformToEthers(coinhouse, signers[0]));
        reservehouse = redstoneWrap(transformToEthers(reservehouse, signers[0]));
        fiat = redstoneWrap(transformToEthers(fiat, signers[0]));
        mockweth = redstoneWrap(transformToEthers(mockweth, signers[0]));

        rid = await reservehouse.reserveTokenID();
        bid = await reservehouse.backedTokenID();

        /// The remaining of the code is written using ethers.js library.

        // Load first accounts with mockweth
        for(let i =0; i < 7; i++) {
            await mockweth.connect(signers[i]).deposit({ value: ethers.utils.parseUnits("20", "ether")});
        }

        snapshotId = takeSnapshot();
    });

    // Test cases
    contract('HouseOfReserve', async() => {

        afterEach(async () => {
            // Revert back to snapshotID
            revertToSnapShot(snapshotId);
        });

        // it("Should deposit and balance match in AssetsAccountant", async () => {
        //     let user = signers[1];
        //     let userAddress = ethersAccounts[1];
        //     // ERC20 Allowance
        //     await mockweth.connect(user).approve(reservehouse.address, DEPOSIT_AMOUNT);

        //     // Do deposit
        //     await reservehouse.connect(user).deposit(DEPOSIT_AMOUNT);

        //     // Get minted balance in accountant
        //     const balanceAtAccountant = await accountant.balanceOf(userAddress, rid);

        //     // Final Assert
        //     assert(
        //         balanceAtAccountant.eq(DEPOSIT_AMOUNT),
        //         "balance and DEPOSIT_AMOUNT don't match!" 
        //     );
        // });

        // it("should log a deposit event when a deposit is made", async () => {
        //     let user = signers[2];
        //     let userAddress = ethersAccounts[2];
        //     // ERC20 Allowance
        //     await mockweth.connect(user).approve(reservehouse.address, DEPOSIT_AMOUNT);

        //     // Do deposit
        //     const tx = await reservehouse.connect(user).deposit(DEPOSIT_AMOUNT);
        //     const result = await tx.wait();
        //     let eventData = (result.events).filter( element => element.event == 'UserDeposit');
        //     eventData = eventData[0];

        //     const expectedEventResult = { 
        //         user: userAddress,
        //         asset: mockweth.address,
        //         amount: DEPOSIT_AMOUNT 
        //     };
        
        //     const logUser = eventData.args[0];
        //     const logAsset = eventData.args[1];
        //     const logAmount = eventData.args[2];
        
        //     assert(
        //       expectedEventResult.user == logUser &&
        //       expectedEventResult.asset == logAsset &&
        //       logAmount.eq(expectedEventResult.amount),
        //       "UserDeposit event properties not emitted correctly, check method",
        //     );
        //   });

        it("Should deposit and withdraw, with balance in AssetsAccountant matching difference", async () => {
            let user = signers[3];
            let userAddress = ethersAccounts[3];
            // ERC20 Allowance
            await mockweth.connect(user).approve(reservehouse.address, DEPOSIT_AMOUNT);

            // Do deposit
            await reservehouse.connect(user).deposit(DEPOSIT_AMOUNT);

            // Do withdraw
            await reservehouse.connect(user).withdraw(WITHDRAW_AMOUNT);

            // Get minted balance in accountant
            const balanceAtAccountant = await accountant.balanceOf(userAddress, rid);
            const computedDiff = DEPOSIT_AMOUNT.sub(WITHDRAW_AMOUNT);

            // Final Assert
            assert(
                balanceAtAccountant.eq(computedDiff),
                "balanceAtAccountant and computedAmount don't match!" 
            );
        });

        // it("should log a UserWithdraw event when a withdraw is made", async () => {
        //     let user = signers[4];
        //     let userAddress = ethersAccounts[4];
        //     // ERC20 Allowance
        //     await mockweth.connect(user).approve(
        //         reservehouse.address,
        //         DEPOSIT_AMOUNT
        //     );
        //     // Do deposit
        //     await reservehouse.connect(user).deposit(DEPOSIT_AMOUNT);

        //     // Do withdraw
        //     const result = await reservehouseconnect(user).withdraw(WITHDRAW_AMOUNT);

        //     const expectedEventResult = { 
        //         user: user.address,
        //         asset: mockweth.address,
        //         amount: WITHDRAW_AMOUNT 
        //     };
        
        //     const logUser = result.logs[0].args.user;
        //     const logAsset = result.logs[0].args.asset;
        //     const logAmount = result.logs[0].args.amount;

        //     assert(
        //       expectedEventResult.user == logUser &&
        //       expectedEventResult.asset == logAsset &&
        //       logAmount.eq(expectedEventResult.amount),
        //       "UserWithdraw event properties not emitted correctly, check method",
        //     );
        //   });

        // it("Only DEFAULT_ADMIN should be able to change collateralRatio", async () => {
        //     const admin = accounts[0];
        //     const baduser = accounts[5];

        //     // Get original collateralization ratio
        //     const orignalCollateralRatio = await reservehouse.collateralRatio();
            
        //     // BadUser tries to change collateralization ratio
        //     await catchRevert(reservehouse.connect(baduser).setCollateralRatio(3, 1));

        //     const attempCollateralRatio = await reservehouse.collateralRatio();

        //     // Assert that collateralization has not changed
        //     assert(
        //         orignalCollateralRatio != attempCollateralRatio,
        //         "Wrong user changed collateralRatio, check function"
        //     );

        //     // Now try with Admin 
        //     await reservehouse.connect(admin).setCollateralRatio(3, 1);

        //     // Get new collateralization ratio
        //     const newCollateralRatio = await reservehouse.collateralRatio();

        //     // Final Assert
        //     assert(
        //         newCollateralRatio[0].eq(ethers.BigNumber.from("3")) &&
        //         newCollateralRatio[1].eq(ethers.BigNumber.from("1")),
        //         "Collateral ratio not change properly by admin, check function"
        //     );
        // });

        // it("When no minted backed asset, max withdrawal amount should equal deposited amount", async () => {
        //     let user = accounts[5];
        //     // ERC20 Allowance
        //     await mockweth.connect(user).approve(
        //         reservehouse.address,
        //         DEPOSIT_AMOUNT
        //     );

        //     // Do deposit
        //     await reservehouse.connect(user).deposit(DEPOSIT_AMOUNT);

        //     let maxwithdrawal = await reservehouse.checkMaxWithdrawal(user.address);

        //     // Final assert
        //     assert(
        //         maxwithdrawal.eq(DEPOSIT_AMOUNT),
        //         "Check function computation"
        //     );
        // });
    });

    // contract('HouseOfCoin', async() => {
    //     afterEach(async() => {
    //         // Revert back to snapshotID
    //         revertToSnapShot(snapshotId);
    //      });

    //      it("Should not mint coin, when no reserves", async () => {
    //         let user = accounts[1];
    //         // Assert User has no reserve
    //         const userReserves = await accountant.balanceOf(user, rid);
    //         assert(
    //             userReserves.eq(web3.utils.toBN("0")),
    //             "User has reserves"

    //         );
    //         // Try to mint coin with no reserves
    //         await catchRevert(coinhouse.mintCoin(
    //             mockweth.address,
    //             reservehouse.address,
    //             MINT_AMOUNT,
    //             {from: user}
    //         ));
    //     });

    //     it("Should compute minting power properly", async () => {
    //         let user = accounts[6];
    //         // Compute expected minting power
    //         const price = await coinhouse.redstoneGetLastPrice();
    //         const collateralRatio = await reservehouse.collateralRatio();
    //         const reducedReserve = 
    //             DEPOSIT_AMOUNT.mul(collateralRatio.denominator).div(collateralRatio.numerator);
            
    //         const UNIT = web3.utils.toBN("100000000");
    //         const expMintPower = reducedReserve.mul(price).div(UNIT);

    //         // ERC20 Allowance
    //         await mockweth.approve(
    //             reservehouse.address,
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Do deposit
    //         await reservehouse.deposit(
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );

    //         const mintPower = await coinhouse.checkMintingPower(
    //             user, mockweth.address
    //         );

    //         assert(
    //             expMintPower.eq(mintPower),
    //             "Expected and on-chain mintPower do not match, check function!"
    //         );
    //     });

    //     it("Should mint coin; erc20 bal and bal at accountant should match", async () => {
    //         let user = accounts[2];
    //         // ERC20 Allowance
    //         await mockweth.approve(
    //             reservehouse.address,
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Do deposit
    //         await reservehouse.deposit(
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Mint coin
    //         await coinhouse.mintCoin(
    //             mockweth.address,
    //             reservehouse.address,
    //             MINT_AMOUNT,
    //             {from: user}
    //         );

    //         const expAcctBalance = await accountant.balanceOf(user, bid);
    //         const erc20Bal = await fiat.balanceOf(user);

    //         assert(
    //             expAcctBalance.eq(MINT_AMOUNT) &&
    //             erc20Bal.eq(expAcctBalance),
    //             "Minted coin do not match, check function"
    //         );
    //     });

    //     it("Should emit a CoinMinted event when coin is minted", async () => {
    //         let user = accounts[3];
    //         // ERC20 Allowance
    //         await mockweth.approve(
    //             reservehouse.address,
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Do deposit
    //         await reservehouse.deposit(
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Mint coin
    //         const result = await coinhouse.mintCoin(
    //             mockweth.address,
    //             reservehouse.address,
    //             MINT_AMOUNT,
    //             {from: user}
    //         );

    //         const expectedEventResult = { 
    //             user: user,
    //             backedtokenID: bid,
    //             amount: MINT_AMOUNT 
    //         };
    //         const logUser = result.logs[0].args.user;
    //         const logbackedtokenID = result.logs[0].args.backedtokenID;
    //         const logAmount = result.logs[0].args.amount;
    //         assert(
    //           expectedEventResult.user == logUser &&
    //           logbackedtokenID.eq(expectedEventResult.backedtokenID) &&
    //           logAmount.eq(expectedEventResult.amount),
    //           "CoinMinted event properties not emitted correctly, check method",
    //         );
    //     });

    //     it("Should payback coin; erc20 bal and bal at accountant change should match", async () => {
    //         let user = accounts[4];
    //         // ERC20 Allowance
    //         await mockweth.approve(
    //             reservehouse.address,
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Do deposit
    //         await reservehouse.deposit(
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Mint coin
    //         await coinhouse.mintCoin(
    //             mockweth.address,
    //             reservehouse.address,
    //             MINT_AMOUNT,
    //             { from: user}
    //         );
    //         // Mint coin
    //         await coinhouse.paybackCoin(
    //             bid,
    //             PAYBACK_AMOUNT,
    //             { from: user}
    //         );
    //         const experc20bal = await fiat.balanceOf(user);
    //         const expDiff = MINT_AMOUNT.sub(PAYBACK_AMOUNT);
    //         assert(
    //             expDiff.eq(experc20bal),
    //             "Expected ERc20 balance and computed diff do not match, check function"
    //         );
    //     });

    //     it("Should emit a CoinPayback event when coin is payback", async () => {
    //         let user = accounts[5];
    //         // ERC20 Allowance
    //         await mockweth.approve(
    //             reservehouse.address,
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Do deposit
    //         await reservehouse.deposit(
    //             DEPOSIT_AMOUNT,
    //             {from: user}
    //         );
    //         // Mint coin
    //         await coinhouse.mintCoin(
    //             mockweth.address,
    //             reservehouse.address,
    //             MINT_AMOUNT,
    //             {from: user}
    //         );
    //         // Mint coin
    //         const result = await coinhouse.paybackCoin(
    //             bid,
    //             PAYBACK_AMOUNT,
    //             { from: user}
    //         );

    //         const expectedEventResult = { 
    //             user: user,
    //             backedtokenID: bid,
    //             amount: PAYBACK_AMOUNT 
    //         };
    //         const logUser = result.logs[0].args.user;
    //         const logbackedtokenID = result.logs[0].args.backedtokenID;
    //         const logAmount = result.logs[0].args.amount;
    //         assert(
    //           expectedEventResult.user == logUser &&
    //           logbackedtokenID.eq(expectedEventResult.backedtokenID) &&
    //           logAmount.eq(expectedEventResult.amount),
    //           "CoinPayback event properties not emitted correctly, check method",
    //         );
    //     });
    // });
  });