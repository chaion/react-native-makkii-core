"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keypair_1 = require("./keypair");
const address_1 = require("./address");
const hdkey_1 = require("./hdkey");
exports.default = {
    getAccountFromMnemonic: hdkey_1.getAccountFromMnemonic,
    keyPair: keypair_1.keyPair,
    validateAddress: address_1.validateAddress
};
//# sourceMappingURL=index.js.map