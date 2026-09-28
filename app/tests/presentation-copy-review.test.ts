import {describe,expect,it} from 'vitest';
import {changesForOperation} from '@/components/atlas/refresh-operation-review';
describe('review matches optional copy publication semantics',()=>{
 it('shows an explicit clear, without presenting an omitted teaser as deletion',()=>{
  const operation={operation:'update_child',operationId:'copy',entityType:'capability',parentId:'org',targetId:'cap',before:{summary:'Existing narrative',presentationCopy:{displayLead:'Old lead',catalogueTeaser:'Kept teaser'}},after:{summary:'Reviewed longer narrative',presentationCopy:{displayLead:null}},evidenceIds:['e'],reviewerExplanation:'The introduction needs clearing while the full narrative is updated.'} as Parameters<typeof changesForOperation>[0];
  expect(changesForOperation(operation)).toEqual([{field:'summary',before:'Existing narrative',after:'Reviewed longer narrative',isNew:false},{field:'presentationCopy.displayLead',before:'Old lead',after:null,isNew:false}]);
 });
});
