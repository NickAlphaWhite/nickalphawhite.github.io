import {muralNotes} from '../data/mural-notes.js?v=stories1';
export function createMuralInfo(wall,lang='en'){
  const note=muralNotes[wall.id]?.[lang]||muralNotes[wall.id]?.en;
  const details=document.createElement('details');details.className='mural-info';details.open=true;
  const summary=document.createElement('summary');summary.textContent=note?.title||wall.label[lang]||wall.label.en;details.append(summary);
  for(const text of note?.paragraphs||[]){const p=document.createElement('p');p.textContent=text;details.append(p)}
  const sources=document.createElement('p');
  for(const source of note?.sources||[]){const a=document.createElement('a');a.href=source.url;a.textContent=source.label;a.target='_blank';a.rel='noopener noreferrer';sources.append(a)}
  details.append(sources);return details;
}
