import {initChoices,refreshChoices} from './personal-ui.js';
export function initPersonalWizard(){
 const form=document.querySelector('#personal-form');initChoices(form);
 const old=[...form.querySelectorAll('.personal-section')];
 const photo=old[0];photo.querySelector('legend').remove();
 const questions=[photo,...photo.querySelectorAll('.field'),...old[1].querySelectorAll('.field')];
 // Each preference is its own slide; the optional photo keeps its consent controls together.
 old[1].remove();form.querySelector(':scope > .sub').textContent='A little about you. Each answer is optional, and you can change it later.';
 const actions=form.querySelector(':scope > .actions');
 const progress=document.createElement('div');progress.className='wizard-progress';form.insertBefore(progress,photo);
 questions.forEach((q,i)=>{q.classList.add('wizard-slide');q.dataset.step=i;form.insertBefore(q,actions);});
 actions.insertAdjacentHTML('afterbegin','<button type="button" class="btn" data-wizard="back">Back</button><button type="button" class="btn primary" data-wizard="next">Next →</button>');
 let step=0;
 function show(focus=false){refreshChoices(form);questions.forEach((q,i)=>{q.hidden=i!==step;});progress.innerHTML=`<span>YOUR STYLE STORY</span><span>${step+1} / ${questions.length}</span><div><i style="width:${(step+1)/questions.length*100}%"></i></div>`;form.dataset.final=String(step===questions.length-1);form.querySelector('[data-wizard="back"]').hidden=step===0;form.querySelector('[data-wizard="next"]').hidden=step===questions.length-1;form.querySelector('#personal-save').hidden=step!==questions.length-1;if(focus)questions[step].querySelector('input:not([type=hidden]),button')?.focus({preventScroll:true});document.querySelector('#modal').scrollTop=0;}
 form.addEventListener('click',e=>{const b=e.target.closest('[data-wizard]');if(!b)return;step=Math.max(0,Math.min(questions.length-1,step+(b.dataset.wizard==='next'?1:-1)));show(true);});
 form.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input[type=text]')&&step<questions.length-1){e.preventDefault();step++;show(true);}});
 show();
}
