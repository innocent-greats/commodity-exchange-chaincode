'use strict';
// import { X509Certificate } from 'crypto';
import { 
  // Context, 
  Contract} from 'fabric-contract-api';
// import { KeyEndorsementPolicy } from 'fabric-shim';
import stringify from 'json-stringify-deterministic'; // Deterministic JSON.stringify()
import sortKeysRecursive from 'sort-keys-recursive';
import { Owner } from './Owner';
// import { Commodity } from './Commodity';
import { TextDecoder } from 'util';
const utf8Decoder = new TextDecoder();
// export class PrivateCommodity extends Contract {
export class CommodityTrading extends Contract {

  async initLedger(ctx: { stub: { putState: (arg0: string, arg1: Buffer) => any; }; }) {
    // Initialize the ledger with some sample commodities.
    console.log('initLedger in cotract')

    const commodities = [
      { ID: 'commodity001', name: 'coffee', quantity: 100, price: 50 },
      { ID: 'commodity002', name: 'sugar', quantity: 200, price: 30 },
      { ID: 'commodity003', name: 'cotton', quantity: 300, price: 20 },
    ];

    for (const commodity of commodities) {
      await ctx.stub.putState(commodity.ID, Buffer.from(JSON.stringify(commodity)));
    }
  }

  async getCommodity(ctx: { stub: { getState: (arg0: any) => any; putState: (arg0: any, arg1: Buffer) => any; }; }, commodityID: any, bidder: any, price: number) {
    // Get the commodity from the ledger.
    console.log('check commodity')
    const commodityBuffer = await ctx.stub.getState(commodityID);
    if (!commodityBuffer || commodityBuffer.length === 0) {
      throw new Error(`Commodity ${commodityID} does not exist.`);
    }
    const commodity = JSON.parse(commodityBuffer.toString());


    // Update the commodity with the new price and bidder.
    commodity.price = price;
    commodity.bidder = bidder;
    await ctx.stub.putState(commodityID, Buffer.from(JSON.stringify(commodity)));

    // Return the updated commodity.
    return commodity;
  }

  async bid(ctx: { stub: { getState: (arg0: any) => any; putState: (arg0: any, arg1: Buffer) => any; }; }, commodityID: any, bidder: any, price: number) {
    console.log('bidCommodity')
    // Get the commodity from the ledger.
    // bidCommodity
    console.log('Get the commodity from the ledger.')
    const commodityBuffer = await ctx.stub.getState(commodityID);
    if (!commodityBuffer || commodityBuffer.length === 0) {
      throw new Error(`Commodity ${commodityID} does not exist.`);
    }
    const commodity = JSON.parse(commodityBuffer.toString());

    // Check that the bidder is not the seller.
    console.log('Check that the bidder is not the seller')

    if (commodity.owner === bidder) {
      throw new Error(`Bidder ${bidder} is the owner of commodity ${commodityID}.`);
    }

    // Check that the bid price is greater than the current price.
    if (+price <= commodity.price) {
      throw new Error(`Bid price ${price} is not greater than current price ${commodity.price}.`);
    }

    // Update the commodity with the new price and bidder.
    commodity.price = price;
    commodity.bidder = bidder;
    await ctx.stub.putState(commodityID, Buffer.from(JSON.stringify(commodity)));

    // Return the updated commodity.
    console.log('commodity')
    console.log(commodity)
    return commodity;
  }

  async getHighestBidder(ctx: { stub: { getState: (arg0: any) => any; }; }, commodityID: any) {
    // Get the commodity from the ledger.
    console.log('Get the getHighestBidder from the ledger.')

    const commodityBuffer = await ctx.stub.getState(commodityID);
    if (!commodityBuffer || commodityBuffer.length === 0) {
      throw new Error(`Commodity ${commodityID} does not exist.`);
    }
    const commodity = JSON.parse(commodityBuffer.toString());

    // Check that the commodity has been bid on.
    if (!commodity.bidder) {
      throw new Error(`Commodity ${commodityID} has not been bid on yet.`);
    }

    // Return the highest bidder commodity.
    console.log('commodity')
    console.log(commodity)

    // Return the highest bidder.
    console.log('commodity.bidder')
    console.log(commodity.bidder)
    return commodity.bidder;
  }
  // 
  async getHighestBid(ctx:any) {
    console.log('commodity getHighestBid')

    const iterator = await ctx.stub.getStateByRange('', '');
    let highestRecord = null;
  
    while (true) {
      const result = await iterator.next();
  
      if (result.value && result.value.value.length > 0) {
        const record = JSON.parse(result.value.value.toString());
  
        if (!highestRecord || record.amount < highestRecord.price) {
          highestRecord = record;
        }
      }
  
      if (result.done) {
        await iterator.close();
        break;
      }
    }
      // Return the highest bidder.
      console.log('commodity highestRecord')
      console.log(highestRecord)
    return Buffer.from(JSON.stringify(highestRecord));
  }

  async getAllBids(ctx:any) {
    console.log('getAllBids')

    const iterator = await ctx.stub.getStateByRange('', '');
    // let highestRecord = null;

    const bids: any[] = [];
    for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
        const userBytes = result.value.value;
        try {
            const user = Owner.newInstance(unmarshal(userBytes));
            bids.push(user);
        } catch (err) {
            console.log(err);
        }
    }

    return marshal(bids).toString();

  }

  async  getAllResults(promiseOfIterator: any) {
    const allResults = [];
    for await (const res of promiseOfIterator) {
        // no more res.value.value ...
        // if not a getHistoryForKey iterator then key is contained in res.key
        let dt = res.value.toString('utf8')
        allResults.push(JSON.parse(dt));
        
    }
    // iterator will be automatically closed on exit from the loop
    // either by reaching the end, or a break or throw terminated the loop
    return allResults;
  }
  

  async getLowestBidder(ctx: { stub: { getState: (arg0: any) => any; }; }, commodityID: any) {
    // Get the commodity from the ledger.
    console.log('Get the getLowestBidder from the ledger.')

    const commodityBuffer = await ctx.stub.getState(commodityID);
    if (!commodityBuffer || commodityBuffer.length === 0) {
      throw new Error(`Commodity ${commodityID} does not exist.`);
    }
    const commodity = JSON.parse(commodityBuffer.toString());

    // Check that the commodity has been bid on.
    if (!commodity.bidder) {
      throw new Error(`Commodity ${commodityID} has not been bid on yet.`);
    }
    // Return the lowest bidder commodity.
    console.log('commodity')
    console.log(commodity)
    // Return the lowest bidder.
    console.log('commodity.bidder')
    console.log(commodity.bidder)
    return commodity.bidder;
  }
}
function unmarshal(bytes: Uint8Array | string): object {
  const json = typeof bytes === 'string' ? bytes : utf8Decoder.decode(bytes);
  const parsed: unknown = JSON.parse(json);
  if (parsed === null || typeof parsed !== 'object') {
      throw new Error(`Invalid JSON type (${typeof parsed}): ${json}`);
  }

  return parsed;
}

function marshal(o: object): Buffer {
  return Buffer.from(toJSON(o));
}

function toJSON(o: object): string {
  // Insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
  return stringify(sortKeysRecursive(o));
}

// interface OwnerIdIdentifier {
//   org: string;
//   accountID: string;
//   user: string;
// }

// function hasWritePermission(ctx: Context, commodity: Commodity): boolean {
//   const clientId = clientIdentifier(ctx);
//   const OwnerIdId = unmarshal(commodity.accountID) as OwnerIdIdentifier;
//   return clientId.org === OwnerIdId.org;
// }

// function clientIdentifier(ctx: Context, user?: string, accountID?: string): OwnerIdIdentifier {
//   return {
//       org: ctx.clientIdentity.getMSPID(),
//       user: user || clientCommonName(ctx),
//       accountID: accountID || clientCommonName(ctx),
//   };
// }

// function clientCommonName(ctx: Context): string {
//   const clientCert = new X509Certificate(ctx.clientIdentity.getIDBytes());
//   const matches = clientCert.subject.match(/^CN=(.*)$/m); // [0] Matching string; [1] capture group
//   if (matches?.length !== 2) {
//       throw new Error(`Unable to identify client identity common name: ${clientCert.subject}`);
//   }

//   return matches[1];
// }

// function OwnerIdIdentifier(user: string, org: string, accountID: string): OwnerIdIdentifier {
//   return { org, user, accountID };
// }

// async function setEndorsingOrgs(ctx: Context, ledgerKey: string, ...orgs: string[]): Promise<void> {
//   const policy = newMemberPolicy(...orgs);
//   await ctx.stub.setStateValidationParameter(ledgerKey, policy.getPolicy());
// }

// function newMemberPolicy(...orgs: string[]): KeyEndorsementPolicy {
//   const policy = new KeyEndorsementPolicy();
//   policy.addOrgs('MEMBER', ...orgs);
//   return policy;
// }