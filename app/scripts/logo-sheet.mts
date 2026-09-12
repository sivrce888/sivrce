import sharp from 'sharp'
import fs from 'fs'
const slugs = fs.readFileSync('/tmp/need-logo.txt','utf8').trim().split('\n')
const cell=140, cols=6
const rows=Math.ceil(slugs.length/cols)
const comps: sharp.OverlayOptions[] = []
for (let i=0;i<slugs.length;i++){
  const x=(i%cols)*cell, y=Math.floor(i/cols)*cell
  const buf=await sharp('public/images/developers/'+slugs[i]+'.webp').resize(cell-20,cell-20,{fit:'contain',background:{r:235,g:235,b:235,alpha:1}}).png().toBuffer()
  comps.push({input:buf,left:x+10,top:y+8})
  const label=Buffer.from('<svg width="'+cell+'" height="20"><text x="70" y="15" font-size="11" text-anchor="middle" font-family="sans-serif" fill="#000">'+slugs[i]+'</text></svg>')
  comps.push({input:await sharp(label).png().toBuffer(),left:x,top:y+cell-21})
}
await sharp({create:{width:cols*cell,height:rows*cell,channels:4,background:{r:255,g:255,b:255,alpha:1}}}).composite(comps).png().toFile('/tmp/logo-sheet.png')
console.log('done', slugs.length)
