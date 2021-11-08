// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// The HouseOfCoinMinting contract:
// - allows users with acceptable reserves to mint backedAsset.
// - allows user to burn their minted asset to release their reserve.

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "./interfaces/IERC20Extension.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IAssetsAccountant.sol";
import "./interfaces/IAssetsAccountantState.sol";
import "./interfaces/IHouseOfReserveState.sol";

contract HouseOfCoinState {

    bytes32 public constant HOUSE_TYPE = keccak256("COIN_HOUSE");

    struct Factor{
        uint numerator;
        uint denominator;
    }

    address public backedAsset;

    address public assetsAccountant;

    IOracle public oracle;
}

contract HouseOfCoin is Initializable, HouseOfCoinState {

    // HouseOfCoinMinting Events
    event CoinMinted(address indexed user, address backedAsset, uint amount, address indexed reserveAsset);


    function initialize(
        address _backedAsset,
        address _assetsAccountant,
        address _oracle
    ) public initializer() 
    {
        backedAsset = _backedAsset;
        assetsAccountant = _assetsAccountant;
        oracle = IOracle(_oracle);
    }

    function mintCoin(address reserveAsset, address houseOfReserve, uint amount) public {

        IHouseOfReserveState hOfReserve = IHouseOfReserveState(houseOfReserve);
        IERC20Extension bAsset = IERC20Extension(backedAsset);

        // Validate reserveAsset and houseOfReserve inputs.
        require(
            IAssetsAccountantState(assetsAccountant).houseOfReserves(reserveAsset) != address(0) &&
            hOfReserve.reserveAsset() == reserveAsset,
            "Not valid reserveAsset!"
        );

        // Validate that HouseOfCoin can mint backedAsset
        require(bAsset.hasRole(keccak256("MINTER_ROLE"), address(this)), "houseOfCoin not authorized to mint backedAsset!" );

        // Checks minting power of msg.sender.
        uint mintingPower = _checkMintingPower(hOfReserve, reserveAsset);
        require(
            mintingPower > 0 &&
            mintingPower >= amount,
             "Not enough reserves to mint amount!"
        );


        // Mint at AssetAccountant
        IAssetsAccountant(assetsAccountant).mint(
            msg.sender,
            _getTokenID(reserveAsset),
            amount,
            ""
        );

        // Mint backedAsset Coins
        bAsset.mint(msg.sender, amount);

        // Emit Event
        emit CoinMinted(msg.sender, backedAsset, amount, reserveAsset);
    }

    function burnCoin() public {

    }

    function _checkMintingPower(IHouseOfReserveState hOfReserve, address reserveAsset) internal view returns(uint) {
        // Need tokenIDs of botch reserves and backedAsset {AssetsAccountant}
        (uint reserveBal, uint mintedCoinBal) =  _checkBalances(
            hOfReserve.tokenID(),
            _getTokenID(reserveAsset)
        );

        // Check if msg.sender has reserves
        if (reserveBal == 0) {
            return 0;
        } else {

            // Check that user is not Liquidatable
            (bool liquidatable, uint mintingPower) = _checkIfLiquidatable(
                reserveBal,
                mintedCoinBal,
                hOfReserve
            );

            if(liquidatable) {
                return 0;
            } else {
                return mintingPower;
            }
        }
    }

    function _checkIfLiquidatable(
        uint reserveBal,
        uint mintedCoinBal,
        IHouseOfReserveState hOfReserve
    ) internal view returns (bool liquidatable, uint mintingPower) {
        // Get price
        // Price should be: backedAsset per unit of reserveAsset {backedAsset / reserveAsset}
        uint price = oracle.getLastPrice();

        // Get collateralization ratio
        Factor memory collatRatio = hOfReserve.collaterizationRatio();

        uint reserveBalreducedByFactor =
            ( reserveBal * collatRatio.denominator) / collatRatio.numerator;
            
        uint maxMintableAmount =
            (reserveBalreducedByFactor * price) / 10**(oracle.oraclePriceDecimals());

        liquidatable = mintedCoinBal > maxMintableAmount? true : false;

        mintingPower = !liquidatable ? (maxMintableAmount - mintedCoinBal) : 0;
    }

    function _getTokenID(address _reserveAsset) internal view returns(uint) {
        return uint(keccak256(abi.encodePacked(backedAsset, _reserveAsset, "backedAsset")));
    }

    function _checkBalances(
        uint _reservesTokenID,
        uint _bAssetRTokenID
    ) internal view returns (uint reserveBal, uint mintedCoinBal) {

        uint[] memory ids = new uint[](2);
        ids[0] = _reservesTokenID;
        ids[1] = _bAssetRTokenID;
        address[] memory accounts = new address[](2);
        accounts[0] = msg.sender;
        accounts[1] = msg.sender;

        uint balances = IERC1155(assetsAccountant).balanceOfBatch(accounts, ids);

        reserveBal = balances[0];
        mintedCoinBal = balances[1];
    }

}