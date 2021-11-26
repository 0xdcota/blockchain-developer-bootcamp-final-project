# Avoiding Common Attack Vectors

## Attack Vectors addressed in Efiat.world
- SWC-135: Code with No Effects
In {AssetsAccount} contract, the 'SafeTransferFrom' functions are disabled. However, they are done by adding a revert function call to avoid 'SW-135'. The rationale for disabling transfer is because AssetsAccountant is based on ERC1155 standard but it the tokens are not meant to be transferable as they represent users deposited reserves and minted amounts. 
- SWC-107: Reentrancy attack
Withdraw operation in the {HouseOfReserve} contract is done usingt the Checks-Effects-Interactions pattern.
