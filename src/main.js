Moralis.initialize("JinbuFRfNtDG80ckeMEJGzZdPYMMJukhb2X89W5u"); // Application id from moralis.io
Moralis.serverURL = "https://bziqvkacfng7.grandmoralis.com:2053/server"; //Server url from moralis.io

let currentTrade = {};
let currentSelectSide;
let tokens;

let typingTimer;                
let amountTypingInterval = 2000;  

let from_amount = document.getElementById("from_amount");
let to_amount = document.getElementById("to_amount");
let estimated_gas = document.getElementById("estimated_gas");


async function init() {
    resetInputs();
    await Moralis.initPlugins();
    await Moralis.enable();
    await getSupportedTokens();
    document.getElementById("swap_button").disabled = Moralis.User.current();
    document.getElementById("login_button").hidden = !Moralis.User.current();
}

async function login() {
    try {
        currentUser = Moralis.User.current();
        if(!currentUser){
            currentUser = await Moralis.Web3.authenticate();
        }
        document.getElementById("swap_button").disabled = false;
    } catch (error) {
        console.log(error);
    }
}

function openTokensMenu(side) {
    currentSelectSide = side;
    document.getElementById('tokens_menu').style.display = "block";
}

function closeTokensMenu() {
    document.getElementById('tokens_menu').style.display = "none";
}

async function getSupportedTokens() {
    const result = await Moralis.Plugins.oneInch.getSupportedTokens({
      chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
    });

    const parentDiv = document.getElementById("token_list");
    tokens = result.tokens;
    
    for(const address in tokens)
    {
        const token = tokens[address];
        const tokenRowDiv = document.createElement("div");
        tokenRowDiv.className = "token-row";
        const html = `
        <img class="token-logo" src="${token.logoURI}">
        <span class="token-symbol">${token.symbol}</span>
        `
        tokenRowDiv.onclick = (() => { selectToken(address) });
        tokenRowDiv.innerHTML = html;
        parentDiv.appendChild(tokenRowDiv);
    }
    console.log(tokens);
}

function resetInputs() {
    to_amount.value = "";
    from_amount.value = "";
}

function selectToken(address) {
    currentTrade[currentSelectSide] = tokens[address]
    console.log(currentTrade);
    renderSelectedToken();
    closeTokensMenu();
    // getQuote(from_amount);
}

function renderSelectedToken() {
    if(currentTrade.from) {
        document.getElementById("from_token_logo").src = currentTrade.from.logoURI;
        document.getElementById("from_token_symbol").innerHTML = currentTrade.from.symbol;
    }
    if(currentTrade.to) {
        document.getElementById("to_token_logo").src = currentTrade.to.logoURI;
        document.getElementById("to_token_symbol").innerHTML = currentTrade.to.symbol;
    }
}

from_amount.addEventListener('keyup', () => {
    clearTimeout(typingTimer);
    if (from_amount.value) {
        typingTimer = setTimeout((() => { getQuoteBasedOnFromAmount(from_amount.value) }), amountTypingInterval);
    }
});


to_amount.addEventListener('keyup', () => {
    clearTimeout(typingTimer);
    if (to_amount.value) {
        typingTimer = setTimeout((() => { getQuoteBasedOnToAmount(to_amount.value) }), amountTypingInterval);
    }
});

async function getQuoteBasedOnFromAmount(value) {
    // console.log(currentTrade[currentSelectSide], value);

    if (!currentTrade.from || !currentTrade.to || !value)
    {
        return;
    }

    let amount = Number(value * 10**currentTrade.from.decimals);

    console.log(amount);
    const quote = await Moralis.Plugins.oneInch.quote({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress: currentTrade.from.address, // The token you want to swap
        toTokenAddress: currentTrade.to.address, // The token you want to receive
        amount: amount,
    });
    console.log(quote);
    to_amount.value = quote.toTokenAmount / (10**quote.toToken.decimals);
    estimated_gas.innerHTML = quote.estimatedGas;
}

async function getQuoteBasedOnToAmount(value) {
    // console.log(currentTrade[currentSelectSide], value);

    if (!currentTrade.from || !currentTrade.to || !value)
    {
        return;
    }

    let amount = Number(value * 10**currentTrade.to.decimals);

    console.log(amount);
    const quote = await Moralis.Plugins.oneInch.quote({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress: currentTrade.to.address, // The token you want to swap
        toTokenAddress: currentTrade.from.address, // The token you want to receive
        amount: amount,
    });
    console.log(quote);
    from_amount.value = quote.toTokenAmount / (10**quote.fromToken.decimals);
    estimated_gas.innerHTML = quote.estimatedGas;
}

async function trySwap() {
    let userAddress = Moralis.User.current().get("ethAddress");
    
    let amount = Number(value * 10**currentTrade.from.decimals);
    if(currentTrade.from.symbol !== "ETH") {
        const allowance = await Moralis.Plugins.oneInch.hasAllowance({
            chain: 'eth',
            fromTokenAddress: currentTrade.from.address,
            fromAddress: userAddress,
            amount: amount
        })

        if(!allowance) {
            await Moralis.Plugins.oneInch.approve({
                chain: 'eth',
                tokenAddres: currentTrade.from.address,
                fromAddress: userAddress
            })  
        }
    }

    let receipt = perfromSwap(userAddress, amount);
    console.log(receipt);
    alert("Swap Complete");
}

function perfromSwap(userAddress, amount) {
    return Moralis.Plugins.oneInch.swap({
        chain: 'eth',
        fromTokenAddress: currentTrade.from.address,
        toTokenAddress: currentTrade.to.address,
        amount: amount,
        fromAddress: userAddress,
        slippage: 1
    })
}

init();
document.getElementById("from_token_select").onclick = (() => { openTokensMenu("from") });
document.getElementById("to_token_select").onclick = (() => { openTokensMenu("to") });
document.getElementById("close_menu").onclick = closeTokensMenu;
document.getElementById("login_button").onclick = login;
document.getElementById("swap_button").onclick = trySwap;