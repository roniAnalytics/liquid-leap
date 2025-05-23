// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSwap is Ownable {
    IERC20Metadata public xToken;
    IERC20Metadata public usdtToken;
    
    // Price of XToken in USDT (scaled by PRICE_PRECISION for precision)
    // 1.2 USDT per 1 XToken = 1.2 * PRICE_PRECISION
    uint256 public xTokenPriceInUSDT = 1.2e18; // 1 XToken = 1.2 USDT
    
    // Price precision factor (18 decimals for high precision)
    uint256 public constant PRICE_PRECISION = 1e18;
    
    // Cache token decimals to save gas
    uint8 public xTokenDecimals;
    uint8 public usdtTokenDecimals;

    event Swap(address indexed user, uint256 amountIn, uint256 amountOut, string swapType);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, address updatedBy);

    constructor(address _xToken, address _usdtToken) Ownable(msg.sender) {
        xToken = IERC20Metadata(_xToken);
        usdtToken = IERC20Metadata(_usdtToken);
        
        // Cache decimals
        xTokenDecimals = xToken.decimals();
        usdtTokenDecimals = usdtToken.decimals();
    }

    // Admin function to update XToken price in USDT
    function updateXTokenPrice(uint256 _newPriceInUSDT) external onlyOwner {
        require(_newPriceInUSDT > 0, "Price must be greater than 0");
        require(_newPriceInUSDT <= 1000e18, "Price too high"); // Max 1000 USDT per XToken
        
        uint256 oldPrice = xTokenPriceInUSDT;
        xTokenPriceInUSDT = _newPriceInUSDT;
        
        emit PriceUpdated(oldPrice, _newPriceInUSDT, msg.sender);
    }

    // Get amount of XToken for given USDT amount (accounting for decimals)
    function getXTokenAmountForUSDT(uint256 usdtAmount) public view returns (uint256) {
        // Formula: (usdtAmount * 10^xTokenDecimals * PRICE_PRECISION) / (xTokenPriceInUSDT * 10^usdtTokenDecimals)
        // This accounts for different decimal places in both tokens
        return (usdtAmount * (10 ** xTokenDecimals) * PRICE_PRECISION) / 
               (xTokenPriceInUSDT * (10 ** usdtTokenDecimals));
    }
    
    // Get amount of USDT for given XToken amount (accounting for decimals)
    function getUSDTAmountForXToken(uint256 xTokenAmount) public view returns (uint256) {
        // Formula: (xTokenAmount * xTokenPriceInUSDT * 10^usdtTokenDecimals) / (PRICE_PRECISION * 10^xTokenDecimals)
        // This accounts for different decimal places in both tokens
        return (xTokenAmount * xTokenPriceInUSDT * (10 ** usdtTokenDecimals)) / 
               (PRICE_PRECISION * (10 ** xTokenDecimals));
    }

    // Swap USDT for XToken
    function swapUSDTForXToken(uint256 usdtAmount) external {
        require(usdtAmount > 0, "Amount must be greater than 0");
        require(
            usdtToken.balanceOf(msg.sender) >= usdtAmount,
            "Insufficient USDT balance"
        );
        require(
            usdtToken.allowance(msg.sender, address(this)) >= usdtAmount,
            "USDT allowance too low"
        );
        
        uint256 xTokenAmount = getXTokenAmountForUSDT(usdtAmount);
        require(xTokenAmount > 0, "XToken amount too small");
        require(
            xToken.balanceOf(address(this)) >= xTokenAmount,
            "Insufficient XToken liquidity"
        );

        // Transfer USDT from user to contract
        bool success = usdtToken.transferFrom(
            msg.sender,
            address(this),
            usdtAmount
        );
        require(success, "USDT transfer failed");

        // Transfer XToken to user
        success = xToken.transfer(msg.sender, xTokenAmount);
        require(success, "XToken transfer failed");

        emit Swap(msg.sender, usdtAmount, xTokenAmount, "USDT_TO_XTOKEN");
    }

    // Swap XToken for USDT
    function swapXTokenForUSDT(uint256 xTokenAmount) external {
        require(xTokenAmount > 0, "Amount must be greater than 0");
        require(
            xToken.balanceOf(msg.sender) >= xTokenAmount,
            "Insufficient XToken balance"
        );
        require(
            xToken.allowance(msg.sender, address(this)) >= xTokenAmount,
            "XToken allowance too low"
        );
        
        uint256 usdtAmount = getUSDTAmountForXToken(xTokenAmount);
        require(usdtAmount > 0, "USDT amount too small");
        require(
            usdtToken.balanceOf(address(this)) >= usdtAmount,
            "Insufficient USDT liquidity"
        );

        // Transfer XToken from user to contract
        bool success = xToken.transferFrom(msg.sender, address(this), xTokenAmount);
        require(success, "XToken transfer failed");

        // Transfer USDT to user
        success = usdtToken.transfer(msg.sender, usdtAmount);
        require(success, "USDT transfer failed");

        emit Swap(msg.sender, xTokenAmount, usdtAmount, "XTOKEN_TO_USDT");
    }

    // Allow owner to withdraw tokens in case of emergency
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    // Get current price info and token decimals
    function getPriceInfo() external view returns (
        uint256 priceInUSDT, 
        uint256 precision,
        uint8 xTokenDecimals_,
        uint8 usdtTokenDecimals_
    ) {
        return (xTokenPriceInUSDT, PRICE_PRECISION, xTokenDecimals, usdtTokenDecimals);
    }
    
    // Helper function to calculate exchange rate for UI (returns human-readable values)
    function getExchangeRates() external view returns (
        uint256 usdtPerXToken,  // How much USDT for 1 XToken (scaled by PRICE_PRECISION)
        uint256 xTokenPerUSDT   // How much XToken for 1 USDT (scaled by PRICE_PRECISION)
    ) {
        // 1 XToken (in smallest units) to USDT (in smallest units)
        uint256 oneXToken = 10 ** xTokenDecimals;
        uint256 oneUSDT = 10 ** usdtTokenDecimals;
        
        usdtPerXToken = getUSDTAmountForXToken(oneXToken) * PRICE_PRECISION / oneUSDT;
        xTokenPerUSDT = getXTokenAmountForUSDT(oneUSDT) * PRICE_PRECISION / oneXToken;
    }
}