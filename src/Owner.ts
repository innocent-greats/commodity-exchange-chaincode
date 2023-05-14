/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object as DataType } from 'fabric-contract-api';
@DataType()
export class Account {
    orgName = '';
    accountID= '';  
    accountType= '';
    tradingName= '';
    commodityCategory = '';
    commodityName = '';
    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<Account> = {}): Account {
        return {
            orgName: state.orgName ?? '',
            accountID: state.accountID ?? '',
            accountType: state.accountType ?? '',
            tradingName: state.tradingName ?? '',
            commodityCategory: state.commodityCategory ?? '',
            commodityName: state.commodityName ?? '',
        };
    }
}

@DataType()
export class Owner {
    orgName = '';
    accountID = '';
    role = '';
    imageUrl = '';
    constructor() {
        // Nothing to do
    }

    

    static newInstance(state: Partial<Owner> = {}): Owner {
        return {
            accountID: assertHasValue(state.accountID, 'Missing accountID'),
            orgName: state.orgName ?? '',
            role: state.role ?? '',
            imageUrl: state.imageUrl ?? '',
        };
    }
}

@DataType()
export class Bid {
    ID = '';
    bidderID = '';
    certificateID = '';
    price = '';
    quantity = '';
    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<Bid> = {}): Bid {
        return {
            ID: assertHasValue(state.ID, 'Missing ID'),
            certificateID: assertHasValue(state.certificateID, 'Missing commodityID'),
            bidderID: assertHasValue(state.bidderID, 'Missing bidderID'),
            quantity: state.quantity ?? '',
            price: state.price ?? ''
        };
    }
}

function assertHasValue<T>(value: T | undefined | null, message: string): T {
    if (value == undefined || (typeof value === 'string' && value.length === 0)) {
        throw new Error(message);
    }

    return value;
}
