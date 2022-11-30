const hre = require('hardhat');
const ethers = require('ethers');
const { TASK_NODE_CREATE_SERVER } = require('hardhat/builtin-tasks/task-names');
const { Protocol } = require('@uniswap/router-sdk');
const { AlphaRouter, SwapRoute, SwapType } = require('@uniswap/smart-order-router');
const { CurrencyAmount, Percent, Token, TradeType } = require('@uniswap/sdk-core');
const JSBI = require('jsbi');

(async () => {

  const jsonRpcServer = await hre.run(TASK_NODE_CREATE_SERVER, {
    hostname: 'localhost',
    port: 8545,
    provider: hre.network.provider,
  });

  await jsonRpcServer.listen();

  const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
  const MY_ADDRESS = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
  const rpc = 'http://localhost:8545';
  const web3Provider = new ethers.providers.JsonRpcProvider(rpc);

  const router = new AlphaRouter({ chainId: 1, provider: web3Provider });

  const WETH = new Token(
    1,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
  );

  const USDC = new Token(
    1,// ChainId.MAINNET,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    6,
    'USDC',
    'USD//C'
  );

  const typedValueParsed = '100000000000000000000'
  const wethAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(typedValueParsed));

  const route = await router.route(
    wethAmount,
    USDC,
    TradeType.EXACT_INPUT,
    // {}
    {
      recipient: MY_ADDRESS,
      slippageTolerance: new Percent(5, 100),
      deadline: Math.floor(Date.now()/1000 +1800)
    }
  );

  console.log(`Quote Exact In: ${route.quote.toFixed(2)}`);
  console.log(`Gas Adjusted Quote In: ${route.quoteGasAdjusted.toFixed(2)}`);
  console.log(`Gas Used USD: ${route.estimatedGasUsedUSD.toFixed(6)}`);

  const transaction = {
    data: route.methodParameters.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: BigNumber.from(route.methodParameters.value),
    from: MY_ADDRESS,
    gasPrice: BigNumber.from(route.gasPriceWei),
  };

  const tx = await web3Provider.sendTransaction(transaction);
  console.log('tx', tx);
  const r = await tx.wait(1);
  console.log('r', r);

  // const WETH = new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether');
  // const outputAmount = '100000000000000000000';
  // const amount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(outputAmount));
  // console.log('AMOUNT===', amount);

  // const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C');
  // const uniswapRouter = new AlphaRouter({ chainId: 1, provider: web3Provider });
  // console.log('Getting Route');

  // const route = await uniswapRouter.route(
  //   amount,
  //   USDC,
  //   TradeType.EXACT_OUTPUT,
  //   undefined,
  //   {
  //     protocols: [Protocol.V3]
  //   }
  //   //   , {
  //   //   type: SwapType.SWAP_ROUTER_02,
  //   //   recipient: migrator.address,
  //   //   slippageTolerance: new Percent(5, 100),
  //   //   deadline: Math.floor(Date.now() / 1000 + 1800)
  //   // }
  // );

  // console.log('r', route);


})().catch(console.error);