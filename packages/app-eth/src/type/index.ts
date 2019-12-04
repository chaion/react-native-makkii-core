import BigNumber from "bignumber.js";

/**
 * Ethereum unsigned transaction
 * @category Coin ETH
 */
export interface EthUnsignedTx {
    to: string;
    from: string;
    nonce: string;
    value: BigNumber;
    gasPrice: number;
    gasLimit: number;
    data?: any;
    network: string;
}

/**
 * Ethereum pending transaction
 * @category Coin ETH
 */
export interface EthPendingTx {
    hash: string;
    status: "PENDING";
    to: string;
    from: string;
    value: BigNumber;
    /**
     * token transfer to
     */
    tknTo?: string;
    /**
     * token transfer value
     */
    tknValue: BigNumber;
    gasPrice: number;
    gasLimit: number;
}