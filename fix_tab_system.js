const fs = require('fs');
const file = 'src/components/TabSystem.tsx';
let txt = fs.readFileSync(file, 'utf8');

const regexNftCol = /\{nft\.collection\}/g;
txt = txt.replace(regexNftCol, '{cleanDisplayName(nft.collection)}');

const regexNftName = /\{nft\.name\}/g;
txt = txt.replace(regexNftName, '{cleanDisplayName(nft.name)}');

const regexItemName = /\{item\.name\}/g;
txt = txt.replace(regexItemName, '{cleanDisplayName(item.name)}');

const regexFolderName = />\{folder\.name\}<\//g;
txt = txt.replace(regexFolderName, '>{cleanDisplayName(folder.name)}</');

const regexFolderDetails = /\{activeFolder\.name\}/g;
txt = txt.replace(regexFolderDetails, '{cleanDisplayName(activeFolder.name)}');

const regexSelectedItem = /\{selectedItem\.name\}/g;
txt = txt.replace(regexSelectedItem, '{cleanDisplayName(selectedItem.name)}');

const regexCollItems = /\{collectionItems\[0\]\?\.collectionName \|\| 'Collection'\}/g;
txt = txt.replace(regexCollItems, '{cleanDisplayName(collectionItems[0]?.collectionName || collectionItems[0]?.collection || "Collection")}');

if (!txt.includes('export const cleanDisplayName')) {
  txt = txt.replace('export interface TabSystemProps', 'export const cleanDisplayName = (name: string | undefined) => {\n  if (!name) return "";\n  return name.split("-")[0].trim();\n};\n\nexport interface TabSystemProps');
}

fs.writeFileSync(file, txt);
