// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// The AssetsAccountant keeps records of all deposits, withdrawals, and minted assets by user.

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IAssetsAccountant.sol";
import "./interfaces/IHouseOfReserve.sol";

contract AssetsAccountantState {

    mapping(address => address) public houseOfReserveForAsset;

    mapping(address => bool) internal _isARegisteredHouseOfReserve;

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

}

contract AssetsAccountant is IAssetsAccountant, ERC1155, AccessControl, AssetsAccountantState {

    // AssetsAccountant Events

    /* 
    * Emit when a HouseOfReserve is registered with AssetsAccountant
    */
    event HouseOfReserveRegistered(address houseOfReserve, address reserveAsset);

    constructor() ERC1155("") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(URI_SETTER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
    }

    function registerHouse(address houseAddress, address asset) 
        external override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        // Check if House is not registered
        require(!isARegisteredHouseOfReserve[houseOfReserve], "HouseOfReserved already registered!");

        // Check if asset already has a House assigned
        require(houseOfReserveForAsset[reserveAsset] != address(0), "reserveAsset already registered!");

        // Check intended asset matches House
        require(IHouseOfReserve.reserveAsset() == reserveAsset(), "intended reserveAsset and HouseOfReserve do not match!");
        require();

        // Register mappings
        houseOfReserveForAsset[reserveAsset] = houseOfReserve;
        _isARegisteredHouseOfReserve[houseOfReserve] = true;

        // Assign Roles
        _setupRole(MINTER_ROLE, houseOfReserve);
        _setupRole(BURNER_ROLE, houseOfReserve);
    }

    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        external override
        onlyRole(MINTER_ROLE)
    {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        external override
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public onlyRole(BURNER_ROLE) {
        _burn(account, id, value);
    }

    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public onlyRole(BURNER_ROLE) {
        _burnBatch(account, ids, values);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}