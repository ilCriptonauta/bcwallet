const fs = require('fs');

const path = 'src/components/TabSystem.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('const cleanDisplayName')) {
  const insertPos = code.indexOf('export interface TabSystemProps');
  const helper = `
export const cleanDisplayName = (name: string | undefined) => {
  if (!name) return '';
  return name.split('-')[0].trim();
};

`;
  code = code.slice(0, insertPos) + helper + code.slice(insertPos);
}

// Replace occurrences
code = code.replace(/\{nft\.collection\}/g, '{cleanDisplayName(nft.collection)}');
code = code.replace(/\{item\.name\}/g, '{item.type === \\'folder\\' ? cleanDisplayName(item.name) : cleanDisplayName(item.name)}');
code = code.replace(/>\{folder\.name\}<\/h3>/g, '>{cleanDisplayName(folder.name)}</h3>');
code = code.replace(/>\{folder\.name\}<\/h4>/g, '>{cleanDisplayName(folder.name)}</h4>');
code = code.replace(/\{nft\.name\}/g, '{cleanDisplayName(nft.name)}');
code = code.replace(/\{collectionItems\[0\]\?\.collectionName \|\| 'Collection'\}/g, '{cleanDisplayName(collectionItems[0]?.collectionName) || \\'Collection\\'}');
code = code.replace(/cleanDisplayName\(cleanDisplayName\(/g, 'cleanDisplayName(');

fs.writeFileSync(path, code);
