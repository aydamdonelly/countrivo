import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { FEEDBACK_REPORT_REASONS, feedbackIdInput, feedbackReportInput, isAllowedPublicFeedback } from '../src/lib/feedback-moderation';
import { validateFeedback, saveFeedback, type FeedbackDatabase } from '../src/lib/site-feedback';
import { publicFeedback } from '../src/lib/feedback-board';

let checks = 0;
function check(value: unknown, message: string) { assert(value, message); checks++; }
const input = { message: 'Please improve the game.', scope: 'site', context: 'site', website: '', submissionId: randomUUID(), visibility: 'public' };
for (const message of ['Please improve country comparisons.', 'Support should reply faster.', 'The admin page needs work.', 'Scunthorpe is a place.', 'I disagree. This game feels unfair!', 'Please fix the spelling class.', 'Population 13457 is wrong.']) {
  check(isAllowedPublicFeedback(message), `Ordinary text allowed: ${message}`);
  check(validateFeedback({ ...input, message }).valid, 'Ordinary criticism can be submitted');
}
for (const message of ['fuck!', 'This is SHIT.', 'f.u.c.k', 'f u c k', 'sh!t', 'sh1t', 'ＦＵＣＫ', 'f\u200buck', 'you are a bitch']) {
  check(!isAllowedPublicFeedback(message), 'Common offensive language and obfuscation rejected');
  check(!validateFeedback({ ...input, message }).valid, 'Public publication rejects harmful language');
  check(validateFeedback({ ...input, visibility: 'private', message: `Private report: ${message}` }).valid, 'Legacy private reports are preserved');
}
for (const reason of FEEDBACK_REPORT_REASONS) check(feedbackReportInput({ feedbackId: 12, reason })?.reason === reason, 'Bounded report reason accepted');
for (const value of [null, {}, {feedbackId:0,reason:FEEDBACK_REPORT_REASONS[0]}, {feedbackId:12,reason:'Free text / personal data'}, {feedbackId:Number.MAX_SAFE_INTEGER+1,reason:FEEDBACK_REPORT_REASONS[0]}]) check(feedbackReportInput(value) === null, 'Malformed report cannot cross the server boundary');
for (const id of [0,-1,NaN,Infinity,'12',null]) check(feedbackIdInput(id) === null, 'Invalid block target rejected');
check(feedbackIdInput(12) === 12, 'Valid numeric target accepted');
const row={id:1,message:'A safe public idea.',scope:'site',context:'site',game_slug:null,created_at:new Date().toISOString(),source:'player',upvotes:0,downvotes:0,vote:0,own:true,device_id:'PRIVATE_AUTHOR',ip_hash:'PRIVATE_NETWORK'};
const dto=publicFeedback(row);
check(dto?.own===true&&!JSON.stringify(dto).includes('PRIVATE_'),'Own boolean hides self-controls without revealing identifiers');
check(publicFeedback({...row,own:'yes'})===null,'Malformed own flag fails closed');
const valid=validateFeedback(input);
async function main(){
  if(!valid.valid)throw new Error('Fixture invalid');
  for(const message of ['publisher_banned','feedback_content_rejected']){
    const db:FeedbackDatabase={rpc:async()=>({error:{message}})};
    const result=await saveFeedback(valid.value,randomUUID(),db);
    check(!result.success&&result.code==='invalid','Database guard gives an actionable failure, never fake success');
  }
  console.log(`Feedback moderation: ${checks} public/private validation and privacy checks passed.`);
}
void main();
