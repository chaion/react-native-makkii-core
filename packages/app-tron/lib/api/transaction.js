"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_common_util_js_1 = require("lib-common-util-js");
const bignumber_js_1 = require("bignumber.js");
const keystore_1 = require("../keystore");
const jsonrpc_1 = require("./jsonrpc");
const utils_1 = require("../utils");
const network_1 = require("../network");
function sendTransaction(account, symbol, to, value, network = 'mainnet', shouldBroadCast = true) {
    return new Promise((resolve, reject) => {
        value = bignumber_js_1.default.isBigNumber(value) ? value : bignumber_js_1.default(value);
        jsonrpc_1.getLatestBlock(network)
            .then(block => {
            console.log('get latest block =>', block);
            const latest_block = {
                hash: block.blockID,
                number: block.block_header.raw_data.number,
            };
            const now = new Date().getTime();
            const expire = now + 10 * 60 * 60 * 1000;
            const tx = {
                timestamp: now,
                expiration: expire,
                to_address: to,
                amount: value.shiftedBy(6).toNumber(),
                owner_address: account.address,
                private_key: account.private_key,
                latest_block,
            };
            keystore_1.default.signTransaction(tx)
                .then(signRes => {
                console.log('sign result =>', signRes);
                const signedTx = {
                    signature: signRes.signature,
                    txID: signRes.txID,
                    raw_data: {
                        contract: [
                            {
                                parameter: {
                                    value: {
                                        amount: tx.amount,
                                        owner_address: utils_1.base58check2HexString(tx.owner_address),
                                        to_address: utils_1.base58check2HexString(tx.to_address),
                                    },
                                    type_url: 'type.googleapis.com/protocol.TransferContract',
                                },
                                type: 'TransferContract',
                            },
                        ],
                        ref_block_bytes: signRes.ref_block_bytes,
                        ref_block_hash: signRes.ref_block_hash,
                        expiration: tx.expiration,
                        timestamp: tx.timestamp,
                    },
                };
                if (shouldBroadCast) {
                    jsonrpc_1.broadcastTransaction(signedTx, network)
                        .then(broadcastRes => {
                        if (broadcastRes.result) {
                            const pendingTx = {
                                hash: `${signedTx.txID}`,
                                timestamp: now,
                                from: account.address,
                                to,
                                value,
                                status: 'PENDING',
                            };
                            resolve({ pendingTx, pendingTokenTx: undefined });
                        }
                        else {
                            reject(new Error(`${broadcastRes}`));
                        }
                    })
                        .catch(err => {
                        console.log('keystore broadcast tx failed', err);
                        reject(err);
                    });
                }
                else {
                    const txObj = {
                        timestamp: now,
                        from: account.address,
                        to,
                        value,
                    };
                    resolve({ encoded: signedTx, txObj });
                }
            })
                .catch(err => {
                console.log('keystore sign tx failed', err);
                reject(err);
            });
        })
            .catch(err => {
            console.log('keystore get latest block failed.', err);
            reject(err);
        });
    });
}
exports.sendTransaction = sendTransaction;
function getTransactionStatus(txHash, network = 'mainnet') {
    return new Promise((resolve, reject) => {
        jsonrpc_1.getTransactionInfoById(txHash, network)
            .then(res => {
            const { blockNumber } = res;
            jsonrpc_1.getTransactionById(txHash, network)
                .then(tx => {
                if (tx.ret !== undefined &&
                    tx.ret instanceof Array &&
                    tx.ret.length > 0 &&
                    tx.ret[0].contractRet !== undefined) {
                    resolve({
                        blockNumber,
                        status: tx.ret[0].contractRet === 'SUCCESS',
                    });
                    return;
                }
                resolve(undefined);
            })
                .catch(err => {
                reject(err);
            });
        })
            .catch(err => {
            reject(err);
        });
    });
}
exports.getTransactionStatus = getTransactionStatus;
function getTransactionsByAddress(address, page = 0, size = 25, timestamp = undefined, network = 'mainnet') {
    const url = `${network_1.config.networks[network].explorer_api}/transfer?sort=-timestamp&limit=${size}&start=${page * size}&address=${address}`;
    console.log(`[tron req] get tron txs by address: ${url}`);
    return new Promise((resolve, reject) => {
        lib_common_util_js_1.HttpClient.get(url, false)
            .then(res => {
            const { data } = res.data;
            const txs = {};
            data.forEach(t => {
                if (t.tokenName === '_') {
                    const tx = {};
                    tx.hash = `${t.transactionHash}`;
                    tx.timestamp = t.timestamp;
                    tx.from = t.transferFromAddress;
                    tx.to = t.transferToAddress;
                    tx.value = new bignumber_js_1.default(t.amount, 10).shiftedBy(-6).toNumber();
                    tx.blockNumber = t.block;
                    tx.status = t.confirmed ? 'CONFIRMED' : 'FAILED';
                    txs[tx.hash] = tx;
                }
            });
            resolve(txs);
        })
            .catch(err => {
            reject(err);
        });
    });
}
exports.getTransactionsByAddress = getTransactionsByAddress;
function getTransactionUrlInExplorer(txHash, network = 'mainnet') {
    txHash = txHash.startsWith('0x') ? txHash.slice(2) : txHash;
    return `${network_1.config.networks[network].explorer}/${txHash}`;
}
exports.getTransactionUrlInExplorer = getTransactionUrlInExplorer;
//# sourceMappingURL=transaction.js.map