// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// The HouseOfReserve contract custodies all deposits, to allow minting of the backedAsset. 
// Users can only deposit and withdraw from this contract.

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAssetsAccountant.sol";

contract HouseOfReserveState {

  bytes32 public constant HOUSE_TYPE = keccak256("RESERVE_HOUSE");

  struct Factor{
    uint numerator;
    uint denominator;
  }

  address public reserveAsset;

  address public backedAsset;

  uint public tokenID;

  Factor public collaterizationRatio;

  IAssetsAccountant public assetsAccountant;

  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
}

contract HouseOfReserve is Initializable, HouseOfReserveState {

  // HouseOfReserve Events

  /* 
   * Emit when user makes an asset deposit in HouseOfReserve
   */
  event UserDeposit(address indexed user, address indexed asset, uint amount);
  /* 
   * Emit when user makes an asset withdrawal from HouseOfReserve
   */
  event UserWithdraw(address indexed user, address indexed asset, uint amount);


  function initialize(
    address _reserveAsset,
    address _backedAsset,
    Factor calldata _collaterizationRatio,
    address _assetsAccountant
  ) public initializer()
  {
    reserveAsset = _reserveAsset;
    backedAsset = _backedAsset;
    tokenID = uint(keccak256(abi.encodePacked(reserveAsset, backedAsset, "collateral")));
    collaterizationRatio = _collaterizationRatio;
    assetsAccountant = IAssetsAccountant(_assetsAccountant);
  }

  function deposit(uint amount) public {
    // Validate input amount.
    require(amount>0, "Zero input amount!");

    // Check ERC20 approval of msg.sender.
    require(IERC20(reserveAsset).allowance(msg.sender, address.this) >= amount, "Not enough ERC20 allowance!");

    // Transfer reserveAsset amount to this contract.
    IERC20(reserveAsset).transferFrom(msg.sender, address.this, amount);

    // Mint in AssetsAccountant received amount.
    assetsAccountant.mint(msg.sender, tokenID, amount, "");
    
    // Emit deposit event.
    emit UserDeposit(msg.sender, reserveAsset, amount);
  }

  function withdraw(uint amount) public returns(bool) {
    // Validate input amount.
    require(
      amount > 0 && 
      amount <= IERC1155(address(assetsAccountant)).balanceOf(msg.sender, tokenID),
      "Invalid input amount!"
    );

    // Check if msg.sender has minted backedAsset.

    // Check if withdrawal amount does not result in insolvency or undercollateralization or msg.sender.

    // Burn in AssetsAccountant amount.

    // Transfer reserveAsset to msg.sender

    return false;
  }

}
