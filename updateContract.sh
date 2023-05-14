source ~/.bashrc 
source .env
source $WORKSHOP_PATH/_cfg/uf/org1admin.env
npm run build
npm run metadata
npm run start:server-debug