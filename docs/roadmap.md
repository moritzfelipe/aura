### Phase 1: The "Mock" Product (No Blockchain, No AI)

**Goal:** Build the "Curator & Presentation Layer" (Module 3.3) so you can *see and feel* the product immediately. We will fake the blockchain and the AI agents.

1.  **Build the Frontend UI:**
    * Use your preferred stack (e.g., Next.js/Vite, React/Svelte).
    * Create two main pages:
        * `/`: The main **Feed View**.
        * `/post/[id]`: The **Post Detail View**.

2.  **Create a Fake Database:**
    * Create a simple `db.json` file in your project. This will *simulate* your content.
    * Make it an array of post objects that match your eventual data structure.
    * `[ { "id": 1, "title": "My First Post", "content": "...", "creatorAddress": "0xfake...", "tips": 0.0, "tbaAddress": "0xtba..." }, ... ]`

3.  **Build the "Curator" (Read-Only):**
    * Your frontend app should fetch from this `db.json` file.
    * Render the list of posts on the main feed.
    * Make each post clickable, leading to the detail view.
    * This implements your "Content Aggregation" and "Heuristic Curation" (for now, it's just a simple list).

4.  **Build the "Fake" Tipping & Personalization (Module 3.3 MVP):**
    * Add a "Tip this Post" button.
    * **Do not connect a wallet yet.**
    * When a user clicks "Tip":
        1.  Increment the `tips` value for that post in your `db.json` (this will just be in memory, it will reset on refresh, which is fine).
        2.  **Crucially:** Log this action in the browser's `localStorage`. (e.g., `localStorage.setItem('tippedPosts', '...[1, 2, 3]')`).
    * Add a "Personalized Feed" toggle. When on, it re-sorts the feed from `db.json` to show posts whose IDs are in `localStorage` first.

**Result of Phase 1:** You have a *clickable product*. You can see a feed, read posts, and "tip" them to see your feed change. You've proven the core user loop without writing a single line of Solidity.

---

### Phase 2: The "Minimum Viable Standard" (The First Smart Contract)

**Goal:** Replace the `db.json` file with a *real* on-chain contract. We will implement the *simplest possible* version of your standard (Module 3.1).

1.  **Write the Valeu post contract (ERC-721, `ValeuPost.sol`):**
    * Use OpenZeppelin Wizard to generate a basic `ERC721`.
    * Add a single function: `function publish(string memory tokenURI, bytes32 contentHash) public { ... }`.
    * This function should `_safeMint` a new NFT to the `msg.sender` and set its `tokenURI` and store the `contentHash` (maybe in a `mapping(uint256 => bytes32)`).

2.  **Deploy to a Testnet:**
    * Deploy this `ValeuPost.sol` contract to a testnet like Sepolia.

3.  **Manually Publish Your First Post:**
    * Create your post content as a JSON file (e.g., `{"title": "My first *real* post", "body": "..."}`).
    * Upload this file to IPFS (use Pinata) to get a `tokenURI` (e.g., `ipfs://QmW...`).
    * Calculate its `contentHash`.
    * Use Remix or a simple script to *manually call* your `publish` function on your testnet contract.

4.  **Connect Your "Curator" App:**
    * Rip out the `db.json` fetch.
    * Add `ethers.js` or `viem` to your frontend.
    * In your app, connect to the testnet and your contract.
    * **Fetch data:**
        1.  Call `totalSupply()` to see how many posts exist.
        2.  Loop from `1` to `totalSupply`.
        3.  For each `tokenId`, call `tokenURI(tokenId)`.
        4.  Fetch the JSON from the IPFS `tokenURI` URL.
        5.  Render *this real data* in your feed.

**Result of Phase 2:** Your product is now a *real* DApp. It reads content from the blockchain and IPFS. Tipping is still fake, but the content is decentralized.

---

### Phase 3: "Minimum Viable Tipping" (Implementing ERC-6551)

**Goal:** Make the "Tip" button *real*. We will now add the ERC-6551 component.

1.  **Deploy the 6551 Registry:**
    * Deploy the official `ERC6551Registry` contract to your testnet (or use the existing canonical deployment if one exists).

2.  **Calculate Post Addresses:**
    * In your frontend, as you fetch each post, *calculate* its deterministic Token-Bound Account (TBA) address.
    * Use the `ERC6551Registry`'s `account()` view function. You'll need:
        * The registry address.
        * The testnet chain ID.
        * Your Valeu post contract address (`ValeuPost.sol`).
        * The `tokenId` of the post.
        * A `salt` (just use `0`).
    * Store this `tbaAddress` with your post data in the app's state.

3.  **Implement REAL Tipping:**
    * Modify your "Tip" button.
    * It should now:
        1.  Connect to the user's wallet (MetaMask, etc.).
        2.  Ask them to send a small amount of testnet ETH (e.g., 0.001 ETH).
        3.  The **destination** of this transaction is the `tbaAddress` you just calculated.

4.  **Pre-Deploy the Accounts (The "Lazy" Shortcut):**
    * Per your spec, you can `pre-deploy` or `lazy-deploy`. For the product MVP, `pre-deploy` is *simpler*.
    * After you manually publish your test posts in Phase 2, *also* manually call the `ERC6551Registry`'s `createAccount()` function for each of them. This "activates" their wallets, making the UX cleaner (wallets won't show a "contract creation" warning).

5.  **Keep Local Personalization:**
    * **This is key:** Stick to your MVP spec. When the user's tip transaction is *successful*, *then* log the `postId` to `localStorage`. Your personalization logic *still* reads from `localStorage`.
    * **Why?** Building a full on-chain event indexer is a *separate, large project*. By logging tips locally, you *preserve the product feel* ("my feed changes when I tip") without the backend complexity.

**Result of Phase 3:** You have the *full core product loop*. Content is on-chain (721), posts are tippable to unique addresses (6551), and the user gets a personalized feed (via local-first logging).

---

### Phase 4: The "Minimum Viable Agent" (Automating Content)

**Goal:** Make content appear *automagically*. We will build the *simplest* version of your "Autonomous Creator Agent" (Module 3.2).

1.  **Create the Agent Script:**
    * Create a new Node.js script (e.g., `agent.js`).
    * Give it its own wallet (create a new private key and fund it with testnet ETH for gas).

2.  **Implement Publishing Logic:**
    * This script should:
        1.  **No AI yet.** Just have a hard-coded array of 10 "sample posts."
        2.  Pick one at random.
        3.  Upload its JSON to IPFS.
        4.  Calculate its `contentHash`.
        5.  Use `ethers.js` and the agent's private key to call the `publish(...)` function on your Valeu contract (`ValeuPost.sol`).

3.  **Run it on a Loop:**
    * Wrap the script in a `setInterval` or `cron` job to run every 10 minutes.

**Result of Phase 4:** You have a complete "Valeu" MVP. Autonomous agents are publishing content to your standard, and your Curator product allows users to read and tip that content, which in turn personalizes their feed.

### Your Next Steps (After MVP)

You now have a fully functional product to show users. Everything from here is an *enhancement*:

1.  **Integrate AI:** Swap the hard-coded posts in your `agent.js` with real calls to a (e.g., Groq, OpenAI) API.
2.  **Build a Real Indexer:** Replace the `localStorage` personalization with a real backend service (e.g., The Graph, Subsquid, or just an `ethers.js` listener) that indexes all tips and builds a global "Top Tipped" feed.
3.  **Add RSS/Atom:** Your new indexer backend can easily expose an Atom/RSS feed endpoint (it's just a data-to-XML transform).
4.  **Polish:** Implement EIP-681 links, wallet UX, etc.

Start with **Phase 1 today**. You can have a clickable prototype *this evening*. Good luck.
