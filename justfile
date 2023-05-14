#
# Copyright contributors to the Hyperledgendary Full Stack Asset Transfer project
#
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at:
#
# 	  http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Main justfile to run all the development scripts
# To install 'just' see https://github.com/casey/just#installation


###############################################################################
# COMMON TARGETS                                                              #
###############################################################################


# Ensure all properties are exported as shell env-vars
set export

# set the current directory, and the location of the test dats
CWDIR := justfile_directory()

_default: 
  @just -f {{justfile()}} --list

# Run the check script to validate tool versions installed
check:
  ${CWDIR}/check.sh

set_env:
  source ~/.bashrc  

runcc:
  export CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999
  export CHAINCODE_ID=$(peer lifecycle chaincode calculatepackageid agri-assets-portfolio.tgz)
  npm run build
  npm run metadata
  # pm2 start dist/index.js --name exchange-assets-cc --node-args "npm run build && npm run metadata && set -x && NODE_OPTIONS='--inspect=0.0.0.0:9229' fabric-chaincode-node server --chaincode-address=$CHAINCODE_SERVER_ADDRESS --chaincode-id=$CHAINCODE_ID"
  npm run start:server-debug

deploy:
  npm run deploy