/* eslint-disable prefer-const */
import { BigDecimal, Address } from "@graphprotocol/graph-ts/index";
import { Pair, Token, Bundle } from "../generated/schema";
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD } from "./utils";

let WOVA_ADDRESS = "0x517e9e5d46c1ea8ab6f78677d6114ef47f71f6c4";
let USDC_WOVA_PAIR = "0x8c4CAd9f34103940CD34F40C5670C4c98BA70d2F"; 

export function getOvaPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdcPair = Pair.load(USDC_WOVA_PAIR); // usdc is token1
  
  if (usdcPair !== null) {
    return usdcPair.token1Price;
  } else {
    return ZERO_BD;
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  "0x79302701f4390Eb41Dd86eda7B96BaDd5366bc2E", // WOVA
  "0x802c3e839e4fdb10af583e3e759239ec7703501e", // ETH
  "0xF5dC99e620976C61Fea2e6525889E4eaFbB9401F", // USDC
  "0xb9ae03e3320235d3a8ae537f87ff8529b445b590", // FilDA
  "0xa4E35E88a8b9739E37d62312E12F8aB6EEb5FFEA", // OXDEX
  "0xeceefc50f9aacf0795586ed90a8b9e24f55ce3f3", // HT
  "0xf9ca2ea3b1024c0db31adb224b407441becc18bb"  // HUSD
];

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_OVA = BigDecimal.fromString("10");

/**
 * Search through graph to find derived OVA per token.
 * @todo update to be derived OVA (add stablecoin estimates)
 **/
export function findOvaPerToken(token: Token): BigDecimal {
  if (token.id == WOVA_ADDRESS) {
    return ONE_BD;
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]));
    if (pairAddress.toHex() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHex());
      if (pair.token0 == token.id && pair.reserveOVA.gt(MINIMUM_LIQUIDITY_THRESHOLD_OVA)) {
        let token1 = Token.load(pair.token1);
        return pair.token1Price.times(token1.derivedOVA as BigDecimal); // return token1 per our token * OVA per token 1
      }
      if (pair.token1 == token.id && pair.reserveOVA.gt(MINIMUM_LIQUIDITY_THRESHOLD_OVA)) {
        let token0 = Token.load(pair.token0);
        return pair.token0Price.times(token0.derivedOVA as BigDecimal); // return token0 per our token * OVA per token 0
      }
    }
  }
  return ZERO_BD; // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedOVA.times(bundle.ovaPrice);
  let price1 = token1.derivedOVA.times(bundle.ovaPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1)).div(BigDecimal.fromString("2"));
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0);
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1);
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedOVA.times(bundle.ovaPrice);
  let price1 = token1.derivedOVA.times(bundle.ovaPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1));
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString("2"));
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString("2"));
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}
