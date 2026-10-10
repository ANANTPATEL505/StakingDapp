// Human-readable ABIs (ethers v6). Function names match your Solidity exactly,
// including the capitalised ones: RewardPerToken, Withdraw, GetReward.

export const STAKING_ABI = [
  "function s_stakingtoken() view returns (address)",
  "function s_rewardtoken() view returns (address)",
  "function rewardrate() view returns (uint256)",
  "function stakebalance(address) view returns (uint256)",
  "function earned(address account) view returns (uint256)",
  "function RewardPerToken() view returns (uint256)",
  "function stake(uint256 amount)",
  "function Withdraw(uint256 amount)",
  "function GetReward()",
];

export const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];
