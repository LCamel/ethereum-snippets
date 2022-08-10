```
npm init
npm install --save ethers
npm install --save solc


echo "node_modules/" >> .gitignore

cat .env.goerli| sed -e 's/^/export /' | source /dev/stdin
```
