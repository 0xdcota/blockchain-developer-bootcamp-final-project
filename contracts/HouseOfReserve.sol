// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// The HouseOfReserve contract custodies all deposits, to allow minting of the backedAsset. 
// Users can only deposit and withdraw from this contract.

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract HouseOfReserve is Initializable {

  struct Factor{
    uint numerator;
    uint denominator;
  }

  Factor public collaterizationRatio;

  address public backedAsset;

  address public reserveAsset;

  uint public tokenID;

  function initialize(address _backedAsset, address _reserveAsset, Factor calldata _collaterizationRatio) public initializer() {
    backedAsset = _backedAsset;
    reserveAsset = _reserveAsset;
    tokenID = uint(keccak256(abi.encodePacked(backedAsset, reserveAsset, "collateral")));
    collaterizationRatio = _collaterizationRatio;
  }

  function deposit(uint amount) public returns(bool){
    // Validate input amount.

    // Check ERC20 approval of msg.sender.

    // Transfer reserveAsset amount to this contract.

    // Mint in AssetsAccountant received amount.

    // Emit deposit event.

    return false;
  }

  function withdraw(uint amount) public returns(bool) {
    // Validate input amount.

    // Check if msg.sender has minted backedAsset.

    // Check if withdrawal amount does not result in insolvency or undercollateralization or msg.sender.

    // Burn in AssetsAccountant amount.

    // Transfer reserveAsset to msg.sender

    return false;
  }

}
