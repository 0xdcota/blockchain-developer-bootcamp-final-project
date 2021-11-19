// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

/**
* @title The house of reserves contract.
* @author daigaro.eth
* @notice Custodies all deposits, to allow minting of the backedAsset.
* @notice Users can only deposit and withdraw from this contract.
* @dev  Contracts are split into state and functionality.
* @dev A HouseOfReserve is required to back a specific backedAsset. 
*/

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAssetsAccountant.sol";
import "./interfaces/IOracle.sol";

contract HouseOfReserveState {

  // HouseOfReserve Events

  /**  
  * @dev Emit when user makes an asset deposit in this contract.
  * @param user Address of depositor.
  * @param asset ERC20 address of the reserve asset.
  * @param amount deposited.
  */
  event UserDeposit(address indexed user, address indexed asset, uint amount);
  /**  
  * @dev Emit when user makes an asset withdrawal from this HouseOfReserve
  * @param user Address of user withdrawing.
  * @param asset ERC20 address of the reserve asset.
  * @param amount withraw.
  */
  event UserWithdraw(address indexed user, address indexed asset, uint amount);

  struct Factor{
      uint numerator;
      uint denominator;
  }

  address public reserveAsset;

  address public backedAsset;

  uint public reserveTokenID;

  uint public  backedTokenID;

  /**
  * Requirements:
  * - should be numerator > denominator
  */
  Factor public collatRatio;

  IAssetsAccountant public assetsAccountant;

  IOracle public oracle;

  bytes32 public constant HOUSE_TYPE = keccak256("RESERVE_HOUSE");

  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
}

contract HouseOfReserve is Initializable, HouseOfReserveState {

    /**
   * @dev Initializes this contract by setting:
   * @param _reserveAsset ERC20 address of reserve asset handled in this contract.
   * @param _backedAsset ERC20 address of the asset type of coin that can be backed with this reserves.
   * @param _assetsAccountant Address of the {AssetsAccountant} contract.
   * @param _oracle Address of the oracle that will return price in _backedAsset units per reserve asset units.
   */
  function initialize(
    address _reserveAsset,
    address _backedAsset,
    address _assetsAccountant,
    address _oracle
  ) public initializer() {

    reserveAsset = _reserveAsset;
    backedAsset = _backedAsset;
    reserveTokenID = uint(keccak256(abi.encodePacked(reserveAsset, backedAsset, "collateral")));
    backedTokenID = uint(keccak256(abi.encodePacked(reserveAsset, backedAsset, "backedAsset")));
    collatRatio.numerator = 150;
    collatRatio.denominator = 100;
    assetsAccountant = IAssetsAccountant(_assetsAccountant);
    oracle = IOracle(_oracle);

  }

  /**
   * @notice Function to deposit reserves in this contract.
   * @notice DO NOT!! send direct ERC20 transfers to this contract.
   * @dev Requires user's ERC20 approval prior to calling.
   * @param amount To deposit. 
   * Emits a {UserDeposit} event.
   */
  function deposit(uint amount) public {
    // Validate input amount.
    require(amount>0, "Zero input amount!");

    // Check ERC20 approval of msg.sender.
    require(IERC20(reserveAsset).allowance(msg.sender, address(this)) >= amount, "Not enough ERC20 allowance!");

    // Transfer reserveAsset amount to this contract.
    IERC20(reserveAsset).transferFrom(msg.sender, address(this), amount);

    // Mint in AssetsAccountant received amount.
    assetsAccountant.mint(msg.sender, reserveTokenID, amount, "");
    
    // Emit deposit event.
    emit UserDeposit(msg.sender, reserveAsset, amount);
  }

  /**
   * @notice Function to withdraw reserves in this contract.
   * @dev Function checks if user can withdraw specified amount.
   * @param amount To withdraw. 
   * Emits a {UserWitdhraw} event.
   */
  function withdraw(uint amount) public {
    // Need balances for tokenIDs of both reserves and backed asset in {AssetsAccountant}
    (uint reserveBal, uint mintedCoinBal) =  _checkBalances(msg.sender, reserveTokenID, backedTokenID);
    
    // Validate user has reserveBal, and input amount is greater than zero, and less than msg.sender reserves deposits.
    require(
      reserveBal > 0 &&
      amount > 0 && 
      amount <= reserveBal,
      "Invalid input amount!"
    );

    // Get max withdrawal amount
    uint maxWithdrawal = _checkMaxWithdrawal(reserveBal, mintedCoinBal);

    // Check maxWithdrawal is greater than or equal to the withdraw amount.
    require(maxWithdrawal >= amount, "Invalid input amount!");

    // Burn at AssetAccountant withdrawal amount.
    assetsAccountant.burn(
      msg.sender,
      reserveTokenID,
      amount
    );

    // Transfer Asset to msg.sender
    IERC20(reserveAsset).transfer(msg.sender, amount);

    // Emit withdraw event.
    emit UserWithdraw(msg.sender, reserveAsset, amount);
  }

  /**
   * @notice Function to calculate the max reserves user can withdraw from contract.
   * @param user Address to check. 
   */
  function checkMaxWithdrawal(address user) external view returns (uint max) {
    // Need balances for tokenIDs of both reserves and backed asset in {AssetsAccountant}
    (uint reserveBal, uint mintedCoinBal) =  _checkBalances(user, reserveTokenID, backedTokenID);
    max = reserveBal == 0 ? 0 : _checkMaxWithdrawal(reserveBal, mintedCoinBal);
  }

  /**
   * @dev  Internal function to check max withdrawal amount.
   */
  function _checkMaxWithdrawal(uint _reserveBal, uint _mintedCoinBal) internal view returns(uint) {
    // Get price
    // Price should be: backedAsset per unit of reserveAsset {backedAsset / reserveAsset}
    uint price = oracle.getLastPrice();

    // Check if msg.sender has minted backedAsset, if yes compute:
    // The minimum required balance to back 100% all minted coins of backedAsset.
    // Else, return 0.
    uint minReqReserveBal = _mintedCoinBal > 0 ? 
      (_mintedCoinBal * 10**(oracle.oraclePriceDecimals())) / price :
      0
    ;

    // Reduce _reserveBal by collateralization factor.
    uint reserveBalreducedByFactor =
        ( _reserveBal * collatRatio.denominator) / collatRatio.numerator;

    if(minReqReserveBal > reserveBalreducedByFactor) {
      // Return zero if undercollateralized or insolvent
      return 0;
    } else if (minReqReserveBal <= reserveBalreducedByFactor && minReqReserveBal > 0 ) {
      // Return the max withrawal amount, if msg.sender has mintedCoin balance and in healthy collateralized
      return (reserveBalreducedByFactor - minReqReserveBal);
    } else {
      // Return _reserveBal if msg.sender has no minted coin.
      return _reserveBal;
    }
  }

  /**
   * @dev  Internal function to query balances in {AssetsAccountant}
   */
  function _checkBalances(
    address user,
    uint _reservesTokenID,
    uint _bAssetRTokenID
  ) internal view returns (uint reserveBal, uint mintedCoinBal) {
      reserveBal = IERC1155(address(assetsAccountant)).balanceOf(user, _reservesTokenID);
      mintedCoinBal = IERC1155(address(assetsAccountant)).balanceOf(user, _bAssetRTokenID);
  }
}
