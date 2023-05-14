/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object as DataType } from 'fabric-contract-api';

@DataType()
export class User {
    org = '';
    userID = '';
    firstName = '';
    lastName = '';
    role = '';
    imageUrl = '';
    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<User> = {}): User {
        return {
            userID: assertHasValue(state.userID, 'Missing userID'),
            org: state.firstName ?? '',
            firstName: state.firstName ?? '',
            lastName: state.lastName ?? '',
            role: state.role ?? '',
            imageUrl: state.imageUrl ?? '',
        };
    }
}


@DataType()
export class UserToken {
    org = '';
    userID = '';
    farmerId = '';
    marketPrice = 0;

    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<UserToken> = {}): UserToken {
        return {
            userID: assertHasValue(state.userID, 'Missing userID'),
            org: assertHasValue(state.org, 'Missing org'),
            farmerId: assertHasValue(state.farmerId, 'Missing farmerId'),
            marketPrice: state.marketPrice ?? 0
        };
    }
}
function assertHasValue<T>(value: T | undefined | null, message: string): T {
    if (value == undefined || (typeof value === 'string' && value.length === 0)) {
        throw new Error(message);
    }

    return value;
}
