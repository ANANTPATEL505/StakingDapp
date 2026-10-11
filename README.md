# Stake & Earn — staking dapp frontend

Next.js 14 (App Router) + Tailwind CSS + ethers v6. Talks to your `Staking`, `StakeToken` and `RewardToken` contracts through any browser wallet (MetaMask etc.).

## Run it

```bash
npm install
cp .env.example .env.local   # then edit it
npm run dev                  # http://localhost:3000
```

`.env.local`:

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_STAKING_ADDRESS` | Address of your deployed `Staking` contract |
| `NEXT_PUBLIC_CHAIN_ID` | Chain it's deployed on (11155111 Sepolia, 84532 Base Sepolia, 80002 Polygon Amoy, 31337 local, 1 mainnet) |

The staking and reward token addresses are read from the Staking contract, so you don't configure them. To support another chain, add it to `lib/config.ts`.

## Before the dapp is useful

1. Deploy `StakeToken`, `RewardToken`, then `Staking(stakeTokenAddr, rewardTokenAddr)` from Remix using the "Injected Provider" environment (Remix's built-in VM chains can't be reached from a browser wallet).
2. **Fund the Staking contract with RWT** (`RewardToken.transfer(stakingAddress, amount)`). It pays rewards out of its own balance; with an empty pool, claims revert.
3. Send some STK to the wallet(s) you want to test with.

## What the UI does

- Connect / disconnect, remembers the session, reacts to account and network changes
- Detects the wrong network and offers a one-click switch (adds the chain if the wallet doesn't know it)
- Stake tab: validates input, shows an Approve → Stake two-step, approves only the exact amount
- Withdraw tab with 25/50/75/Max shortcuts
- Claimable rewards card with claim button and estimated reward per second
- Transaction toasts (pending → confirmed / failed) with explorer links and readable errors
- Data refreshes every 5 seconds and right after each transaction

## Notes about the contract

- **Total staked is approximate in the UI.** `totalstakedtoken` is `private`, so the dapp shows the Staking contract's STK balance instead. Make it `public` if you want the exact figure.
- **Reward precision loss.** `RewardPerToken()` does `rewardrate * time / totalstakedtoken` in integer math, and both tokens use 0 decimals. Whenever `10 * seconds < totalStaked` the increment rounds to 0, but `lastupdatetime` still advances, so those rewards are lost. This is most visible with a large total stake or frequent interactions. The usual fix is to scale by 1e18 (`rewardrate * time * 1e18 / totalstaked`) and divide by 1e18 in `earned`.
- `Withdraw` doesn't check the balance explicitly; over-withdrawing reverts via checked arithmetic (the UI blocks it earlier).
<img width="1897" height="903" alt="Screenshot 2026-10-10 211405" src="https://github.com/user-attachments/assets/5051e5fa-e4e6-44bf-a9b1-b613bec4d20b" />
