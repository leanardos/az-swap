Moralis.initialize("JinbuFRfNtDG80ckeMEJGzZdPYMMJukhb2X89W5u"); // Application id from moralis.io
Moralis.serverURL = "https://bziqvkacfng7.grandmoralis.com:2053/server"; //Server url from moralis.io

let currentTrade = {};
let currentSelectSide;
let tokens;

async function login() {
    try {
        currentUser = Moralis.User.current();
        if(!currentUser){
            currentUser = await Moralis.Web3.authenticate();
        }
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

async function init() {
    await Moralis.initPlugins();
    await Moralis.enable();
    await getSupportedTokens();
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

function selectToken(address) {
    currentTrade[currentSelectSide] = tokens[address]
    console.log(currentTrade);
    renderSelectedToken(tokens[address]);
    closeTokensMenu();
}

function renderSelectedToken(token) {
    document.getElementById("from_token_logo").src = token.logoURI;
    document.getElementById("from_token_symbol").innerHTML = token.symbol;
}

init();
document.getElementById("from_token_select").onclick = (() => { openTokensMenu("from") });
document.getElementById("close_menu").onclick = closeTokensMenu;
document.getElementById("login_button").onclick = login;