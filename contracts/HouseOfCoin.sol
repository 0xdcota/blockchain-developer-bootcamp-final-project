// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

/**
* @title The house Of coin minting contract.
* @author daigaro.eth
* @notice  Allows users with acceptable reserves to mint backedAsset.
* @notice  Allows user to burn their minted asset to release their reserve.
* @dev  Contracts are split into state and functionality.
*/

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./interfaces/IERC20Extension.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IAssetsAccountant.sol";
import "./interfaces/IAssetsAccountantState.sol";
import "./interfaces/IHouseOfReserveState.sol";

contract HouseOfCoinState {

    bytes32 public constant HOUSE_TYPE = keccak256("COIN_HOUSE");

    address public backedAsset;

    address public assetsAccountant;

    IOracle public oracle;
}

contract HouseOfCoin is Initializable, HouseOfCoinState {
    
    // HouseOfCoinMinting Events

    /**
   * @dev Log when a user is mints coin.
   * @param user Address of user that minted coin.
   * @param backedtokenID Token Id number of asset in {AssetsAccountant}.
   * @param amount minted.
   */
    event CoinMinted(address indexed user, uint indexed backedtokenID, uint amount);

    /**
   * @dev Log when a user paybacks minted coin.
   * @param user Address of user that minted coin.
   * @param backedtokenID Token Id number of asset in {AssetsAccountant}.
   * @param amount payback.
   */
    event CoinPayback(address indexed user, uint indexed backedtokenID, uint amount);

    /**
   * @dev Initializes this contract by setting:
   * @param _backedAsset ERC20 address of the asset type of coin to be minted in this contract.
   * @param _assetsAccountant Address of the {AssetsAccountant} contract.
   * @param _oracle Address of the oracle that will return price in _backedAsset units per reserve asset units.
   */
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

    /**
   * @notice  Function to mint ERC20 'backedAsset' of this HouseOfCoin.
   * @dev  Requires user to have reserves for this backed asset at HouseOfReserves.
   * @param reserveAsset ERC20 address of asset to be used to back the minted coins.
   * @param houseOfReserve Address of the {HouseOfReserves} contract that manages the 'reserveAsset'.
   * @param amount To mint. 
   * Emits a {CoinMinted} event.
   */
    function mintCoin(address reserveAsset, address houseOfReserve, uint amount) public {

        IHouseOfReserveState hOfReserve = IHouseOfReserveState(houseOfReserve);
        IERC20Extension bAsset = IERC20Extension(backedAsset);

        uint reserveTokenID = hOfReserve.reserveTokenID();

        // Validate reserveAsset and houseOfReserve inputs.
        require(
            IAssetsAccountantState(assetsAccountant).houseOfReserves(reserveTokenID) != address(0) &&
            hOfReserve.reserveAsset() == reserveAsset,
            "Not valid reserveAsset!"
        );

        // Validate that HouseOfCoin can mint backedAsset
        require(bAsset.hasRole(keccak256("MINTER_ROLE"), address(this)), "houseOfCoin not authorized to mint backedAsset!" );

        // Checks minting power of msg.sender.
        uint mintingPower = checkMintingPower(msg.sender, hOfReserve, reserveAsset);
        require(
            mintingPower > 0 &&
            mintingPower >= amount,
             "Not enough reserves to mint amount!"
        );

        // Update state in AssetAccountant
        uint backedTokenID = getTokenID(reserveAsset);
        IAssetsAccountant(assetsAccountant).mint(
            msg.sender,
            backedTokenID,
            amount,
            ""
        );

        // Mint backedAsset Coins
        bAsset.mint(msg.sender, amount);

        // Emit Event
        emit CoinMinted(msg.sender, backedTokenID, amount);
    }

    /**
   * @notice  Function to payback ERC20 'backedAsset' of this HouseOfCoin.
   * @dev Requires knowledge of the reserve asset used to back the minted coins.
   * @param _backedTokenID Token Id in {AssetsAccountant}, releases the reserve asset used in 'getTokenID'.
   * @param amount To payback. 
   * Emits a {CoinPayback} event.
   */
    function paybackCoin(uint _backedTokenID, uint amount) public {

        IAssetsAccountant accountant = IAssetsAccountant(assetsAccountant);
        IERC20Extension bAsset = IERC20Extension(backedAsset);

        uint userTokenIDBal = accountant.balanceOf(msg.sender, _backedTokenID);

        // Check in {AssetsAccountant} that msg.sender backedAsset was created with assets '_backedTokenID'
        require(userTokenIDBal >= 0, "No _backedTokenID balance!");

        // Check that amount is less than '_backedTokenID' in {Assetsaccountant}
        require(userTokenIDBal >= amount, "amount >  _backedTokenID balance!");

        // Check that msg.sender has the intended backed ERC20 asset.
        require(bAsset.balanceOf(msg.sender) >= amount, "No ERC20 allowance!");

        // Burn amount of ERC20 tokens paybacked.
        bAsset.burn(msg.sender, amount);

        // Burn amount of _backedTokenID in {AssetsAccountant}
        accountant.burn(msg.sender, _backedTokenID, amount);

        emit CoinPayback(msg.sender, _backedTokenID, amount);
    }

    /**
   * @dev  Get backedTokenID to be used in {AssetsAccountant}
   * @param _reserveAsset ERC20 address of the reserve asset used to back coin.
   */
    function getTokenID(address _reserveAsset) public view returns(uint) {
        return uint(keccak256(abi.encodePacked(_reserveAsset, backedAsset, "backedAsset")));
    }

    /**
   * @notice  Returns the amount of backed asset coins user can mint with unused reserve asset.
   * @param user to check minting power.
   * @param hOfReserve Address of the HouseOfReserve contract that handles the reserve asset.
   * @param reserveAsset ERC20 address of the reserve asset. 
   */
    function checkMintingPower(address user, IHouseOfReserveState hOfReserve, address reserveAsset) public view returns(uint) {
        // Need balances for tokenIDs of both reserves and backed asset in {AssetsAccountant}
        (uint reserveBal, uint mintedCoinBal) =  _checkBalances(
            user,
            hOfReserve.reserveTokenID(),
            getTokenID(reserveAsset)
        );

        // Check if msg.sender has reserves
        if (reserveBal == 0) {
            // If msg.sender has NO reserves, minting power = 0.
            return 0;
        } else {
            // Check that user is not Liquidatable
            (bool liquidatable, uint mintingPower) = _checkIfLiquidatable(
                reserveBal,
                mintedCoinBal,
                hOfReserve
            );
            if(liquidatable) {
                // If msg.sender is liquidatable, minting power = 0.
                return 0;
            } else {
                return mintingPower;
            }
        }
    }

    /**
   * @dev  Internal function to check if user is liquidatable
   */
    function _checkIfLiquidatable(
        uint reserveBal,
        uint mintedCoinBal,
        IHouseOfReserveState hOfReserve
    ) internal view returns (bool liquidatable, uint mintingPower) {
        // Get price
        // Price should be: backedAsset per unit of reserveAsset {backedAsset / reserveAsset}
        uint price = oracle.getLastPrice();

        // Get collateralization ratio
        IHouseOfReserveState.Factor memory collatRatio = hOfReserve.collatRatio();

        uint reserveBalreducedByFactor =
            ( reserveBal * collatRatio.denominator) / collatRatio.numerator;
            
        uint maxMintableAmount =
            (reserveBalreducedByFactor * price) / 10**(oracle.oraclePriceDecimals());

        liquidatable = mintedCoinBal > maxMintableAmount? true : false;

        mintingPower = !liquidatable ? (maxMintableAmount - mintedCoinBal) : 0;
    }

    /**
   * @dev  Internal function to query balances in {AssetsAccountant}
   */
    function _checkBalances(
        address user,
        uint _reservesTokenID,
        uint _bAssetRTokenID
    ) internal view returns (uint reserveBal, uint mintedCoinBal) {
        reserveBal = IERC1155(assetsAccountant).balanceOf(user, _reservesTokenID);
        mintedCoinBal = IERC1155(assetsAccountant).balanceOf(user, _bAssetRTokenID);
    }

}