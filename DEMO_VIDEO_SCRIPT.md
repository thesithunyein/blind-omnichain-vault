# Blind Omnichain Vault — Demo Video Script

**Format:** Screen recording + HeyGen AI voiceover (professional male, calm/authoritative tone)
**Duration:** ~3 minutes
**Background music:** Subtle lo-fi ambient (volume 15%)

---

## [0:00–0:12] Cold Open

**Screen:** Slow zoom into the BOV landing page hero. Logo pulses.

**Voiceover:**
> "What if your portfolio could rebalance across Bitcoin, Ethereum, and Sui — privately — without a single number ever being revealed on-chain?"
> "That's exactly what Blind Omnichain Vault does."

---

## [0:12–0:35] Problem

**Screen:** Show a public Etherscan transaction, then a DeFi dashboard with plaintext balances.

**Voiceover:**
> "Today, every DeFi position is public. Any address you interact with can see your exact holdings, your entry prices, and when you move."
> "That's not a feature — it's a surveillance system."
> "Existing privacy tools either wrap your assets into synthetic tokens, rely on bridges that get hacked, or only work on one chain."
> "We needed something fundamentally better."

---

## [0:35–1:05] Solution

**Screen:** Scroll slowly through the architecture diagram in `docs/architecture.md`.

**Voiceover:**
> "Blind Omnichain Vault combines three cutting-edge technologies."
> "First: Ika Network's dWallets — MPC custody that holds real Bitcoin, Ethereum, and Sui natively on their home chains. No wrapping. No bridging."
> "Second: Encrypt's Fully Homomorphic Encryption — every balance is stored as a ciphertext. The Solana program computes over encrypted numbers without ever decrypting them."
> "Third: A Solana Anchor program as the coordination layer — storing encrypted state, emitting rebalance events, and enforcing policy — all without seeing a single plaintext number."

---

## [1:05–1:42] Live Demo — Deposit

**Screen:** Open `https://blind-omnichain-vault.vercel.app/deposit`. Connect Phantom wallet.

**Voiceover:**
> "Let me show you a real deposit — live on Solana devnet."

*[Select Bitcoin, enter amount, click "Encrypt and Record Deposit"]*

> "I select Bitcoin as my chain and enter the amount I've already sent to my Ika dWallet address."

*[Phantom approval popup appears — approve it]*

> "The flow has three automatic steps."
> "First — if this is my first time, the program creates my personal vault PDA on-chain."
> "Second — my amount is encrypted client-side using the Encrypt FHE SDK. The number becomes a ciphertext blob."
> "Third — only the ciphertext is submitted to the Solana program. The number never leaves my browser unencrypted."

*[Success screen with Solscan link appears]*

> "Done. A real on-chain transaction."

*[Click the Solscan link — devnet transaction visible]*

> "On Solscan you can see the instruction. But the balance field? Just opaque bytes. Completely unreadable — by anyone."

---

## [1:42–2:12] Live Demo — Dashboard

**Screen:** Navigate to `/dashboard`.

**Voiceover:**
> "The dashboard shows my position — isolated to my wallet. Other users see only their own data."

*[Position card shows "Position Active" and deposit count]*

> "The chain allocation bars show configured target weights. The actual encrypted balances? Shown as ciphertext badges — because that's all that exists on-chain."

*[Click "Rebalance" — wallet approval — TX link appears in activity table]*

> "Requesting a rebalance emits a signed on-chain event. In production, Ika's MPC network reads this event and executes the cross-chain trade — while the weights stay encrypted throughout."

*[Point to the activity table with real TX link]*

> "Every action is verifiable on Solana. But the amounts? Permanently invisible."

---

## [2:12–2:38] Technical Depth

**Screen:** Show `programs/bov/src/lib.rs` — the `enc_shares: Vec<u8>` field.

**Voiceover:**
> "The Anchor program stores balances as raw bytes — `Vec<u8>`. There is no `u64`. There is no decimal. There is no amount."
> "FHE executor nodes compute rebalancing decisions homomorphically. They determine which chain is overweight and which is underweight — without decrypting a single value."
> "Even the Solana validators are completely blind to your portfolio."

**Screen:** Switch to the competitor table on the landing page.

> "Privacy coins hide sender and receiver. Tornado Cash hides transfers. But neither does multi-chain yield optimization with encrypted portfolio weights."
> "BOV is the only system where the portfolio manager, the blockchain, and the validator — none of them know your balance — and you still earn yield across four chains simultaneously."

---

## [2:38–3:00] Close

**Screen:** Landing page. Logo centered. Tagline: "The Blind Omnichain Vault."

**Voiceover:**
> "Blind Omnichain Vault. The first omnichain vault where privacy is enforced by mathematics — not policy."
> "Live on Solana devnet. Open source on GitHub."
> "Because your portfolio is nobody's business but yours."

---

## HeyGen Setup Instructions

1. **Avatar:** Professional male presenter. Business casual. Neutral background or dark studio.
2. **Voice tone:** Senior engineer presenting to investors. Calm, precise, confident. No hype.
3. **Pace:** Medium-slow. Pause briefly after each concept sentence.
4. **Emphasis** (speak slightly slower and stronger):
   - "never revealed on-chain"
   - "real Bitcoin"
   - "ciphertext blob"
   - "completely unreadable — by anyone"
   - "mathematics — not policy"
5. **Music:** Subtle ambient electronic (not distracting). Fade out at 2:55.
6. **Screen recording:** 1080p, 60fps. Use a dark browser theme. Zoom in on key UI elements.
7. **Edit cut:** Hard cut between sections. No transitions needed — clean cuts feel more professional.

---

## Screen Recording Checklist

- [ ] Phantom wallet connected on devnet with at least 0.1 SOL
- [ ] Start at landing page hero
- [ ] Deposit flow: select chain → enter amount → approve wallet → show Solscan TX
- [ ] Dashboard: show position card → click Rebalance → show activity table TX link
- [ ] Show `lib.rs` `enc_shares: Vec<u8>` field (GitHub or VSCode)
- [ ] End on landing page
