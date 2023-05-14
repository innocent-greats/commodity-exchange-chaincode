/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrivateCommodity } from './privateCommodity';
import { CommodityTrading } from './CommodityTrading';

export { CommodityTrading } from './CommodityTrading';
export { PrivateCommodity } from './privateCommodity';


export const contracts: any[] = [PrivateCommodity, CommodityTrading  ]; // eslint-disable-line @typescript-eslint/no-explicit-any
