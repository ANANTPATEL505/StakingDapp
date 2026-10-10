// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is ReentrancyGuard{
    IERC20 public s_stakingtoken;
    IERC20 public s_rewardtoken;

    uint public constant rewardrate=10;
    uint private totalstakedtoken;
    uint public rewardpertokenstored;
    uint public lastupdatetime;

    mapping (address=>uint)public stakebalance;
    mapping (address=>uint)public rewards;
    mapping (address=>uint)public userrewardpertokenpaid;

    event Staked(address indexed user, uint  indexed amount);
    event withdraw(address indexed user, uint  indexed amount);
    event rewardsclaimed(address indexed user, uint  indexed amount);

    constructor(address stakingtoken,address rewardtoken){
        s_stakingtoken=IERC20(stakingtoken);
        s_rewardtoken=IERC20(rewardtoken);
    }

    function RewardPerToken() public view returns(uint){
        if(totalstakedtoken==0){
            return rewardpertokenstored;
        }
        uint totaltime=block.timestamp-lastupdatetime;
        uint totalrewards=rewardrate*totaltime;
        return rewardpertokenstored+totalrewards/totalstakedtoken;
    }

    function earned(address account)public view returns(uint){
        return((stakebalance[account]*(RewardPerToken()-userrewardpertokenpaid[account])));
    }

    modifier updatereward(address account){
        rewardpertokenstored=RewardPerToken();
        lastupdatetime=block.timestamp;
        rewards[account]=earned(account);
        userrewardpertokenpaid[account]=rewardpertokenstored;
        _;
    }

    function stake(uint amount) external nonReentrant updatereward(msg.sender){
        require(amount>0);
        totalstakedtoken+=amount;
        stakebalance[msg.sender]+=amount;
        emit Staked(msg.sender,amount);

        bool success=s_stakingtoken.transferFrom(msg.sender,address(this),amount);
        require(success,"transfer failed");
    }
    function Withdraw(uint amount) external nonReentrant updatereward(msg.sender){
        require(amount>0);
        totalstakedtoken-=amount;
        stakebalance[msg.sender]-=amount;
        emit withdraw(msg.sender,amount);

        bool success=s_stakingtoken.transfer(msg.sender,amount);
        require(success,"transfer failed");
    }

    function GetReward() external nonReentrant updatereward(msg.sender){
        uint reward=rewards[msg.sender];
        require(reward>0);
        rewards[msg.sender]=0;
        emit rewardsclaimed(msg.sender,reward);

        bool success=s_rewardtoken.transfer(msg.sender,reward);
        require(success,"transfer failed");
    }
}