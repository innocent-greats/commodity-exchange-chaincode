/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object as DataType } from 'fabric-contract-api';

@DataType()
export class Commodity { 
    commodityID = '';
    createdDate= '';
    assetType= ''; 
    category= ''; 
    accountID = '';
    ownerOrg = '';    
    name= ''; 
    species = '';
    marketPrice= 0;
    weight= 0;
    orderTrackerHash = '';
    location = '';
    imageUrl= '';
    ownershipDeedUrl= '';
    medicalCertificateUrl= '';    
    warehouseCertificateUrl= '';    
    tradingCertificateUrl= '';    
    publicDescription= ''; 
    tradingStatus= ''; 

    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<Commodity> = {}): Commodity {
        return {
            assetType: state.assetType ?? '',
            commodityID: assertHasValue(state.commodityID, 'Missing commodityID'),
            ownerOrg: assertHasValue(state.ownerOrg, 'Missing ownerOrg'),
            orderTrackerHash: assertHasValue(state.orderTrackerHash, 'Missing orderTrackerHash'),
            accountID: assertHasValue(state.accountID, 'Missing accountID'),
            tradingCertificateUrl: state.tradingCertificateUrl ?? '',
            warehouseCertificateUrl: state.warehouseCertificateUrl ?? '',
            medicalCertificateUrl: state.medicalCertificateUrl ?? '',
            ownershipDeedUrl: state.ownershipDeedUrl ?? '',
            category: state.category ?? '',
            name: state.name ?? '',
            createdDate: state.createdDate ?? '',
            imageUrl: state.imageUrl ?? '',
            publicDescription: state.publicDescription ?? '',
            species: state.species ?? '',
            location: state.location ?? '',
            marketPrice: state.marketPrice ?? 0,
            weight: state.weight ?? 0,
            tradingStatus: state.tradingStatus ?? '',
        };
    }
}

@DataType()
export class CommodityToken {
    commodityID = '';
    owner = '';
    marketPrice = 0;


    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<CommodityToken> = {}): CommodityToken {
        return {
            commodityID: assertHasValue(state.commodityID, 'Missing commodityID'),
            owner: assertHasValue(state.owner, 'Missing owner'),
            marketPrice: state.marketPrice ?? 0
        };
    }
}

@DataType()
export class Agreement {
    buyerID = '';
    commodityID = '';
    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<Agreement> = {}): Agreement {
        return {
            buyerID: state.buyerID ?? '',
            commodityID: state.commodityID ?? ''
        };
    }
}

function assertHasValue<T>(value: T | undefined | null, message: string): T {
    if (value == undefined || (typeof value === 'string' && value.length === 0)) {
        throw new Error(message);
    }

    return value;
}
