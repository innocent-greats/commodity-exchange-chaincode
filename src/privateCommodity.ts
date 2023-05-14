'use strict';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { Context, Contract, Returns, Transaction } from 'fabric-contract-api';
import { Commodity } from './Commodity';
// import { TextDecoder } from 'util';
// import { X509Certificate } from 'crypto';
// import { KeyEndorsementPolicy } from 'fabric-shim';
// // import { Commodity } from './Commodity';
// const utf8Decoder = new TextDecoder();

const commodityCollection = "commodityCollection"
const transferAgreementObjectType = "transferAgreement"

// PrivateData SmartContract
export class PrivateCommodity extends Contract {

// CreateCommodity creates a new commodity by placing the main commodity details in the commodityCollection
// that can be read by both organizations. The appraisal value is stored in the owners org specific collection.
@Transaction()
async CreateCommodity(ctx: Context) {
  // Get the new commodity from transient map
  console.log(`----- Evaluate Transactions: CreateCommodity`);

  const transientMap = ctx.stub.getTransient();
    console.log('transientMap Dist updated')
    console.log(transientMap)
  // Commodity properties are private, therefore they get passed in transient field, instead of func args
  const transientCommodityJSON : any = transientMap.get("commodity");
  if (!transientCommodityJSON) {
      throw new Error('The commodity was not found in the transient map input.');
  }

  let commodityInput = JSON.parse(transientCommodityJSON);
  // inputs validation
  if (!commodityInput.assetType && commodityInput.assetType === "") {
      throw new Error('assetType field is required, it must be a non-empty string.');
  }
  if (!commodityInput.commodityID && commodityInput.commodityID === "") {
      throw new Error('commodityID field is required, it must be a non-empty string');
  }

  // Check if commodity already exists
  console.log('Check if commodity already exists', commodityCollection, commodityInput.commodityID)

  const commodityAsBytes : any | Error = await ctx.stub.getPrivateData(commodityCollection, commodityInput.commodityID);
  if (commodityAsBytes === undefined){
  console.log('Check if commodity', commodityAsBytes)
  }
  if (commodityAsBytes != '') {
      throw new Error(`This commodity (${commodityInput.commodityID}) already exists`);
  }

  // Get the id of submitting client identity
  console.log('Get the id of submitting client identity')
  const ClientID = await this.submittingClientIdentity(ctx);
  console.log('ClientID', ClientID)

  // Verify that the client is submitting request to peer in their organization
  // This is to ensure that a client from another org doesn't attempt to read or
  // write private data from this peer.
  await this.VerifyClientOrgMatchesPeerOrg(ctx);

  const commodityPublicData = {
      assetType: commodityInput.assetType,
      accountID: commodityInput.accountID,
      commodityID: commodityInput.commodityID,
      name: commodityInput.name,
      category: commodityInput.category,
      tradingStatus: commodityInput.tradingStatus,
      createdDate: commodityInput.createdDate,
      publicDescription: commodityInput.publicDescription,
      species: commodityInput.species,
      weight: commodityInput.weight,
      marketPrice: commodityInput.marketPrice,
      imageUrl: commodityInput.imageUrl,
      warehouseCertificateUrl: commodityInput.warehouseCertificateUrl,   
      tradingCertificateUrl: commodityInput.tradingCertificateUrl,   
      salt: commodityInput.salt
  };

  // Save commodityPublicData to private data collection
  // Typical logger, logs to stdout/file in the fabric managed docker container, running this chaincode
  // Look for container name like dev-peer0.org1.example.com-{chaincodename_version}-xyz
  console.log(`CreateCommodity Put: collection ${commodityCollection}, id ${commodityInput.commodityID}, owner ${ClientID}`);
  try {
  console.log('commodityCollection', commodityCollection,'commodityPublicData', commodityPublicData)

      await ctx.stub.putPrivateData(commodityCollection, commodityInput.commodityID, Buffer.from(stringify(sortKeysRecursive(commodityPublicData))))
  } catch (error) {
      throw Error('Failed to put commodity into private data collecton.')
  }

  // Save commodity details to collection visible to owning organization
  const commodityPrivateData = {
      accountID: commodityInput.accountID,
      createdDate: commodityInput.createdDate,
      commodityID:commodityInput.commodityID,
      marketPrice: commodityInput.marketPrice,
      orderTrackerHash: commodityInput.orderTrackerHash,
      ownershipDeedUrl: commodityInput.ownershipDeedUrl,
      medicalCertificateUrl: commodityInput.medicalCertificateUrl,
      imageUrl: commodityInput.imageUrl,
      location: commodityInput.location,
      warehouseCertificateUrl: commodityInput.warehouseCertificateUrl,   
      tradingCertificateUrl: commodityInput.tradingCertificateUrl,   
  }

  console.log('getCollectionName')
  const orgCollection = await this.getCollectionName(ctx);
  console.log('orgCollection', orgCollection, 'commodityPrivateData',commodityPrivateData)

  // Put commodity appraised value into owners org specific private data collection
  await ctx.stub.putPrivateData(orgCollection, commodityInput.commodityID, Buffer.from(stringify(sortKeysRecursive(commodityPrivateData))));
}
@Transaction()
@Returns('commodity[]')
async  GetPublicCommodityByRange(ctx: Context): Promise<Commodity[]> {
  console.log(`----- Evaluate Transactions: GetCommodityByRange commodityCollection`);
  // let startKey: string = '', endKey: string = ''
  let promiseOfIterator = ctx.stub.getPrivateDataByRange(commodityCollection, "", "");
  let results = await this.getAllResults(promiseOfIterator);
  return results;
}

@Transaction()
@Returns('string')
async  GetPrivateCommodityByRange(ctx: Context, collection: string ): Promise<Commodity[]> {
  console.log(`----- Evaluate Transactions: GetCommodityByRange commodityCollection`);
  let promiseOfIterator = ctx.stub.getPrivateDataByRange(collection, "", "");
  let results = await this.getAllResults(promiseOfIterator);
  return results;
}
// QueryAssetByOwner queries for assets based on assetType, Owner.
// This is an example of a parameterized query where the query logic is baked into the chaincode,
// and accepting a single query parameter (owner).
// Only available on state databases that support rich query (e.g. CouchDB)
// =========================================================================================
@Transaction()
@Returns('string')
async QueryAssetByOwner(ctx: Context, assetType: string, accountID: string): Promise<Commodity[]>  {
  console.log('Read public data about the commodity from QueryAssetByOwner:', assetType,accountID )
    const queryString = `{"selector":{"assetType":"${assetType}","accountID": "${accountID}"}}`;
    console.log('typeof queryString', typeof queryString, queryString )

    const queryResults =  ctx.stub.getPrivateDataQueryResult(commodityCollection, queryString);
    let results =  this.getAllResults(queryResults);
    console.log('typeof results', typeof results, results )

    return results;
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
@Transaction()
@Returns('commodity')
async  ReadCommodityPrivateDetails(ctx: Context, collection: string, commodityID: string): Promise<string> {
  console.log('Read private data about the commodityfrom collection:', collection)
  
  const commodityDetailsJSON = await ctx.stub.getPrivateData(collection, commodityID);

  if(!commodityDetailsJSON.toString()){
      throw Error('Failed to read commodity details.')
  }
  return commodityDetailsJSON.toString();
}

async  TransferCommodity(ctx: any): Promise<void> {
  const transientMap = await ctx.stub.getTransient();

  // Commodity properties are private, therefore they get passed in transient field
  const transientTransferJSON = transientMap.get("commodity_owner");
  if (!transientTransferJSON) {
      throw new Error(`The commodity owner not found in the transient map`);
  }
  const commodityTransferInput = {
      id: JSON.parse(transientTransferJSON).commodityID,
      buyerMSP: JSON.parse(transientTransferJSON).buyerMSP
  }

  if (!commodityTransferInput.id && commodityTransferInput.id === "") {
      throw new Error('The commodityID field is required, it must be a non-empty string.');
  }

  if (!commodityTransferInput.buyerMSP && commodityTransferInput.buyerMSP === "") {
      throw new Error('The buyerMSP field is required, it must be a non-empty string.');
  }

  // Read commodity from the private data collection
  let commodity = JSON.parse(await this.ReadCommodity(ctx, commodityTransferInput.id));

  if(!commodity){
      throw new Error(`${commodityTransferInput.id} does not exist.`);
  }

  // Verify that the client is submitting request to peer in their organization
  await this.VerifyClientOrgMatchesPeerOrg(ctx);

  // Verify transfer details and transfer owner
  await this.VerifyAgreement(ctx, commodityTransferInput.id, commodity.owner, commodityTransferInput.buyerMSP);

  const transferAgreement = JSON.parse(await this.ReadTransferAgreement(ctx, commodityTransferInput.id));

  if(!transferAgreement){
      throw new Error(`There has been no agreement related to this commodity ${commodityTransferInput.id}.`);
  }


  if(!transferAgreement.buyerID){
      throw new Error(`The buyerID was not found in TransferAgreement for ${commodityTransferInput.id}.`);
  }

  // Transfer commodity in private data collection to new owner
  console.log(commodity);
//   commodity = JSON.parse(commodity);
  commodity.owner = transferAgreement.buyerID;
  console.log(commodity);

  await ctx.stub.putPrivateData(commodityCollection, commodityTransferInput.id, Buffer.from(stringify(sortKeysRecursive(commodity))));

  // Get collection name for this organization
  const ownerCollection = await this.getCollectionName(ctx);

  // Delete the commodity appraised value from this organization's private data collection
  await ctx.stub.deletePrivateData(ownerCollection, commodityTransferInput.id);

  // Delete the transfer agreement from the commodity collection
  let transferAgreeKey = await ctx.stub.createCompositeKey(transferAgreementObjectType, [commodityTransferInput.id]);

  await ctx.stub.deletePrivateData(commodityCollection, transferAgreeKey);
}
@Transaction()
@Returns('commodity')
async  ReadCommodity(ctx: Context, commodityID: string): Promise<string> {
    console.log('Read public data about the commodity from collection:', commodityCollection)
    const commodityJSON = await ctx.stub.getPrivateData(commodityCollection, commodityID);
    const commodity = commodityJSON.toString();
  
    //No Commodity found, return empty response
    if (!commodity) {
      throw new Error(`${commodityID} does not exist in collection ${commodityCollection}.`);
    }
  
    return commodity;
  }
  async AgreeToTransfer(ctx: any): Promise<void> {
    // Get id of submitting client identity
    const ClientID : any = await this.submittingClientIdentity(ctx);
  
    // Value is private, therefore it gets passed in transient field
    const transientMap = await ctx.stub.getTransient();
  
    // Persist the JSON bytes as-is so that there is no risk of nondeterministic marshaling.
    const transientCommodityJSON = transientMap.get("commodity_value");
  
    if (!transientCommodityJSON) {
      throw new Error(`The commodity was not found in the transient map input.`);
    }
  
    let valueJSON = JSON.parse(transientCommodityJSON);
  
    // Do some error checking since we get the chance
    if (!valueJSON.commodityID && valueJSON.commodityID === '') {
      throw new Error(`commodityID field must be a non-empty string`);
    }
  
    if (valueJSON.appraisedValue <= 0) {
      throw new Error(`AppraisedValue field must be a non-empty string`);
    }
  
    // Read commodity from the private data collection
    const commodity = await this.ReadCommodity(ctx, valueJSON.commodityID);
    if(!commodity){
      throw new Error(`${valueJSON.commodityID} does not exist.`);
    }
  
    // Verify that the client is submitting request to peer in their organization
    await this.VerifyClientOrgMatchesPeerOrg(ctx);
  
    // Get collection name for this organization. Needs to be read by a member of the organization.
    const orgCollection = await this.getCollectionName(ctx);
  
    // Put agreed value in the org specifc private data collection
    await ctx.stub.putPrivateData(orgCollection, valueJSON.commodityID, Buffer.from(JSON.stringify(sortKeysRecursive(valueJSON))));
  
    // Create agreeement that indicates which identity has agreed to purchase
    // In a more realistic transfer scenario, a transfer agreement would be secured to ensure that it cannot
    // be overwritten by another channel member.
    let transferAgreeKey = await ctx.stub.createCompositeKey(transferAgreementObjectType, [valueJSON.commodityID])
  
    await ctx.stub.putPrivateData(commodityCollection, transferAgreeKey, Buffer.from(JSON.stringify(sortKeysRecursive(ClientID))));
  }
    //   / DeleteTranferAgreement can be used by the buyer to withdraw a proposal from
  // the commodity collection and from his own collection.
  @Transaction()
  async DeleteTransferAgreement(ctx: Context) {
  
      const transientMap = ctx.stub.getTransient();
      if (!transientMap) {
          throw new Error(`error getting transient`);
      }
  
      // Commodity properties are private, therefore they get passed in transient field
      const transientDeleteJSON : any = transientMap.get("agreement_delete");
      if (!transientDeleteJSON) {
          throw new Error(`Commodity not found in the transient map input`);
      }
  
      let commodityDelete = JSON.parse(transientDeleteJSON);
      if (!commodityDelete.commodityID && commodityDelete.commodityID === "") {
          throw new Error(`commodityID field must be a non-empty string`);
      }
  
      // Verify that the client is submitting request to peer in their organization
      await this.VerifyClientOrgMatchesPeerOrg(ctx);
  
      // Delete private details of agreement
      const orgCollection = await this.getCollectionName(ctx);
  
      let transferAgreeKey = ctx.stub.createCompositeKey(transferAgreementObjectType, [commodityDelete.commodityID])
  
      const valAsBytes = await ctx.stub.getPrivateData(commodityCollection, transferAgreeKey);
  
      if (!valAsBytes) {
          throw new Error(`Commodity's transfer_agreement does not exist.`);
      }
  
      await ctx.stub.deletePrivateData(orgCollection, commodityDelete.commodityID);
  
      // Delete transfer agreement record
      await ctx.stub.deletePrivateData(commodityCollection, transferAgreeKey);
  }
  
  // ReadTransferAgreement gets the buyer's identity from the transfer agreement from collection
  @Transaction()
  @Returns('string')
  async ReadTransferAgreement(ctx: Context, commodityID: string): Promise<string>{
      const transferAgreeKey = ctx.stub.createCompositeKey(transferAgreementObjectType, [commodityID]);
      const buyerIdentity = await ctx.stub.getPrivateData(commodityCollection, transferAgreeKey);
  
      if (!buyerIdentity.toString()) {
          return `TransferAgreement for ${commodityID} does not exist.`;
      }
  
      const agreement = {
          id: commodityID,
          buyerID: buyerIdentity.toString()
      }
      return JSON.stringify(agreement);
  }
  // DeleteCommodity can be used by the owner of the commodity to delete the commodity
  @Transaction()
  async DeleteCommodity(ctx: Context) {

    const transientMap = ctx.stub.getTransient();
    if (!transientMap) {
      throw new Error(`error getting transient`);
    }
    // Commodity properties are private, therefore they get passed in transient field
    const transientDeleteJSON:any = transientMap.get("commodity_delete");
  
    if (!transientDeleteJSON) {
      throw new Error(`commodity not found in the transient map input`);
    }
  
    let commodityDelete = JSON.parse(transientDeleteJSON);
    if (!commodityDelete.commodityID && commodityDelete.commodityID === "") {
      throw new Error(`commodityID field must be a non-empty string`);
    }
  
    // Verify that the client is submitting request to peer in their organization
    await this.VerifyClientOrgMatchesPeerOrg(ctx);
  
    let commodityAsBytes: any = await ctx.stub.getPrivateData(commodityCollection, commodityDelete.commodityID);
    if (commodityAsBytes == '') {
      throw new Error(`The commodity not found`);
    }
  
    const ownerCollection = await this.getCollectionName(ctx);
  
    commodityAsBytes = await ctx.stub.getPrivateData(ownerCollection, commodityDelete.commodityID);
    if (commodityAsBytes == '') {
      throw new Error(`The commodity not found in owner s private collection.`);
    }
  
    // delete the commodity from state
    await ctx.stub.deletePrivateData(commodityCollection, commodityDelete.commodityID)
  
    // Finally, delete private details of commodity
    await ctx.stub.deletePrivateData(ownerCollection, commodityDelete.commodityID)
  
  }
  
    // submittingClientIdentity is an internal function to get client identity who submit the transaction.
    // async submittingClientIdentity(ctx: Context){
    //     const ClientID = await ctx.clientIdentity.getID();
    //     if (!ClientID && ClientID === '') {
    //         throw new Error(`Failed to read clientID`);
    //     }
    //     return ClientID;
    // }
  // VerifyClientOrgMatchesPeerOrg is an internal function used verify client org id and matches peer org id.
  async VerifyClientOrgMatchesPeerOrg(ctx: Context) {

    const ClientMSPID = ctx.clientIdentity.getMSPID();
    if (!ClientMSPID && ClientMSPID === '') {
      throw new Error("Failed getting the client's MSPID.");
    }
  
    const peerMSPID = ctx.stub.getMspID();
    if (!peerMSPID && peerMSPID === '') {
      throw new Error("Failed getting the peer's MSPID.");
    }
  
    if (ClientMSPID !== peerMSPID) {
      throw new Error(`Client from org ${ClientMSPID} is not authorized to read or write private data from an org ${peerMSPID} peer.`);
    }
  }
  
  // getCollectionName is an internal helper function to get collection of submitting client identity.
  async getCollectionName(ctx: Context) {
    const ClientMSPID = ctx.clientIdentity.getMSPID();
    if (!ClientMSPID && ClientMSPID === '') {
      throw new Error("Failed getting the client's MSPID.");
    }
    // Create the collection name
    const orgCollection = ClientMSPID + "PrivateCollection";
    return orgCollection;
  }
  
  // VerifyAgreement is an internal helper function used by TransferCommodity to verify
  // that the transfer is being initiated by the owner and that the buyer has agreed
  // to the same appraisal value as the owner
  async VerifyAgreement(ctx: Context, commodityID: string, owner: string, buyerMSP: string) {
  
    // Check 1: verify that the transfer is being initiatied by the owner
  
    // Get id of submitting client identity
    const ClientID = await this.submittingClientIdentity(ctx);
    if (ClientID !== owner) {
      return Error("Error: Submitting client identity does not own the commodity.")
    }
  
    // Check 2: verify that the buyer has agreed to the appraised value
  
    // Get collection names
    const collectionOwner = await this.getCollectionName(ctx); // get owner collection from caller identity
  
    const collectionBuyer = buyerMSP + "PrivateCollection"; // get buyers collection
  
    // Get hash of owners agreed to value
    const ownerAppraisedValueHash = await ctx.stub.getPrivateDataHash(collectionOwner, commodityID);
  
    if (!ownerAppraisedValueHash) {
      throw Error(`Hash of appraised value for ${commodityID} does not exist in collection ${collectionOwner}.`)
    }
  
    // Get hash of buyers agreed to value
    const buyerAppraisedValueHash = await ctx.stub.getPrivateDataHash(collectionBuyer, commodityID);
  
    if (!buyerAppraisedValueHash) {
      throw Error(`Hash of appraised value for ${commodityID} does not exist in collection ${collectionOwner}.`)
    }
  
    console.log("collectionOwner", collectionOwner);
    console.log("collectionBuyer", collectionBuyer);
  
  
    console.log("ownerAppraisedValueHash", ownerAppraisedValueHash);
    console.log("buyerAppraisedValueHash", buyerAppraisedValueHash);
  
    // Verify that the two hashes match
    if (ownerAppraisedValueHash !== buyerAppraisedValueHash) {
      throw new Error(`Hash for the appraised value for owner ${ownerAppraisedValueHash} does not match the value for seller which is ${buyerAppraisedValueHash}.`);
    }
    return true;
  }
  
  // submittingClientIdentity is an internal function to get client identity who submit the transaction.
  async submittingClientIdentity(ctx: Context) {
    const ClientID = ctx.clientIdentity.getID();
    if (!ClientID && ClientID === '') {
      throw new Error(`Failed to read clientID`);
    }
    return ClientID;
  }


}


// function unmarshal(bytes: Uint8Array | string): object {
//   const json = typeof bytes === 'string' ? bytes : utf8Decoder.decode(bytes);
//   const parsed: unknown = JSON.parse(json);
//   if (parsed === null || typeof parsed !== 'object') {
//       throw new Error(`Invalid JSON type (${typeof parsed}): ${json}`);
//   }

//   return parsed;
// }

// function marshal(o: object): Buffer {
//   return Buffer.from(toJSON(o));
// }

// function toJSON(o: object): string {
//   // Insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
//   return stringify(sortKeysRecursive(o));
// }

// interface OwnerIdIdentifier {
//   org: string;
//   user: string;
// }

// function hasWritePermission(ctx: Context, commodity: Commodity): boolean {
//   const clientId = clientIdentifier(ctx);
//   const OwnerIdId = unmarshal(commodity.owner) as OwnerIdIdentifier;
//   return clientId.org === OwnerIdId.org;
// }

// function clientIdentifier(ctx: Context, user?: string): OwnerIdIdentifier {
//   return {
//       org: ctx.clientIdentity.getMSPID(),
//       user: user || clientCommonName(ctx),
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

// function OwnerIdIdentifier(user: string, org: string): OwnerIdIdentifier {
//   return { org, user };
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