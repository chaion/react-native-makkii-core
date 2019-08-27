import {broadcastTransaction, getUnspentTx} from "./jsonrpc";
import keystore from "../keystore";
import BigNumber from "bignumber.js";

const sendTransaction = (account, symbol, to, value, extraParams, data, network = 'BTC', shouldBroadCast=true) =>
    new Promise((resolve, reject) => {
        value = BigNumber.isBigNumber(value)? value: BigNumber(value);
        getUnspentTx(account.address, network)
            .then(utxos => {
                const tx = {
                    amount: value.shiftedBy(8).toNumber(),
                    change_address: account.address,
                    to_address: to,
                    byte_fee: 2,
                    private_key: account.private_key,
                    utxos,
                };
                const valueIn = utxos.reduce((valueIn, el)=>{
                    return valueIn.plus(BigNumber(el.amount))
                }, BigNumber(0));
                let fee = network.match('BTC')? BigNumber(2*(148 * utxos.length + 34 * 2 + 10)):BigNumber(40000);
                keystore.signTransaction(tx, network)
                    .then(res => {
                        console.log('[keystore sign resp]=>', res);
                        let vout =  [
                            {addr:to, value:value.toNumber()},
                        ];
                        if(valueIn.toNumber()> value.shiftedBy(8).toNumber() + fee.toNumber()){
                            vout.push({addr:account.address, value:valueIn.minus(value.shiftedBy(8)).minus(fee).toNumber()});
                        }
                        const txObj = {
                            from: [{addr:account.address, value:valueIn.shiftedBy(-8).toNumber()}],
                            to:vout,
                            fee: fee.shiftedBy(-8).toNumber(),
                        };
                        if(shouldBroadCast) {
                            broadcastTransaction(res.encoded, network)
                                .then(txid => {
                                    const pendingTx = {
                                        ...txObj,
                                        hash: txid,
                                        status: 'PENDING',
                                    };
                                    resolve({pendingTx});
                                })
                                .catch(e => reject(e));
                        }else{
                            resolve({encoded: res, txObj})
                        }
                    })
                    .catch(e => reject(e));
            })
            .catch(e => reject(e));
    });

const getTransactionUrlInExplorer = (txHash, network = 'BTC') => {
    switch (network) {
        case "BTC":
            return `https://insight.bitpay.com/tx/${txHash}`;
        case "BTCTEST":
            return `https://test-insight.bitpay.com/tx/${txHash}`;
        case "LTC":
            return `https://insight.litecore.io/tx/${txHash}`;
        case "LTCTEST":
            return `https://testnet.litecore.io/tx/${txHash}`;
    }
};

export {
    sendTransaction,
    getTransactionUrlInExplorer
}