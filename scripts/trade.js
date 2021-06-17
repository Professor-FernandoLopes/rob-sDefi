const Router = artifacts.require('Router.sol');
const Weth = artifacts.require('Weth.sol');
const Dai = artifacts.require('Dai.sol');

const ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const WETH_ADDRESS = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
const DAI_ADDRESS = '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa'; 

// quantidade de wrappedEther
const amountIn = web3.utils.toWei('0.1');

module.exports = async done => {
  try {
    const [admin, _] = await web3.eth.getAccounts();
    
    const router = await Router.at(ROUTER_ADDRESS);
    const weth = await Weth.at(WETH_ADDRESS);
    const dai = await Dai.at(DAI_ADDRESS);

    await weth.deposit({value: amountIn}) 
    
    // aprovar do router da uniswap gastar ether
    await weth.approve(router.address, amountIn);

       //estimativa                                                     //tradingPath wethTodai
    const amountsOut = await router.getAmountsOut(amountIn, [WETH_ADDRESS, DAI_ADDRESS]);
    
    // máxima tolerância 10% menos que amountOut
    
    const amountOutMin = amountsOut[1].mul(web3.utils.toBN(90)).div(web3.utils.toBN(100));
    
    const balanceDaiBefore = await dai.balanceOf(admin);

    
    await router.swapExactTokensForTokens(
      // amount wethe
      amountIn, 
      // minimun dai
      amountOutMin,
      // tradingPath
      [WETH_ADDRESS, DAI_ADDRESS],
      admin,
      // recebe em mili e divide para transformar para segundo, e transforma dec para integer com Math.floor
      // adiciona 10 minutos 60 *10
      Math.floor((Date.now() / 1000)) + 60 * 10
    );

    // balance após a transação
    const balanceDaiAfter = await dai.balanceOf(admin);
    
    // quanto mais próximo de 1 melhor a performance
    const executionPerf = balanceDaiAfter.sub(balanceDaiBefore).div(amountsOut[1]);
    
    console.log(executionPerf.toString());
  } catch(e) {
    console.log(e);
  }
  done();
};
