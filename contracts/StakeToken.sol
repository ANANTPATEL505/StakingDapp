// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StakeToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("StakeToken", "STK") {
        _mint(msg.sender, initialSupply);
    }
    function decimals()public pure override returns(uint8){
        return 0;
    }
}
