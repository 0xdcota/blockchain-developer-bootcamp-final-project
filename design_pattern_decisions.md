# Design Pattern Decisions

## Design patterns used in Efiat.world
- Inter-Contract Execution
The eFIAT system contains 3 core contract that need to interact for each other. This is done to maintain simplicity in the code for associated functions. The {HouseOfReserve} contract custodies user deposited funds, and only only to deposit and withdraw reserves. A seperate HouseOfReserve is needed to backed different types of backed assets (or fiat curerncies). The {HouseOfCoin} allows users to mint and burn the backed asset. It considers the reserve asset type the user wants to use to back the minted amount. The {AssetAccountant} keeps log of all deposit and minted amounts, as well as withdrawals and paybacks via ERC1155 tokens. The interaction between these contracts require inter-contract execution.
- Inheritance and Interfaces
To allow easy future integration of an upgradeable system, the contract logic for {HouseOfReserves}, {HouseOfCoin} and {AssetsAccountant} are split into state variables and functions. For each the functionality contract inherits from the contract containing the state variables. 
