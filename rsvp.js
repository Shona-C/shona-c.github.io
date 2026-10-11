const form = document.getElementById('rsvpForm');
const steps = Array.from(document.querySelectorAll('.form-step'));
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const submitBtn = document.getElementById('submitBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressName = document.getElementById('progressName');
const partySize = document.getElementById('partySize');
const partySizeWrap = document.getElementById('partySizeWrap');
const guestContainer = document.getElementById('guestContainer');
const flightFields = document.getElementById('flightFields');
const reviewContent = document.getElementById('reviewContent');
const formMessage = document.getElementById('formMessage');
let currentStep = 0;
let activeSteps = ['party','guests','stay','travel','final','review'];

const stepNames = {party:'Your party',guests:'Your guests',stay:'Accommodation',travel:'Travel',final:'Final details',review:'Review'};

function selected(name){const el=form.querySelector(`[name="${name}"]:checked`);return el?el.value:'';}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function updateFlow(){
  const attendance=selected('Party attendance');
  const declining=attendance==='Unfortunately no';
  activeSteps=declining?['party','final','review']:['party','guests','stay','travel','final','review'];
  partySizeWrap.hidden=declining;
  partySize.required=!declining;
  if(declining){partySize.value='';guestContainer.innerHTML='';}
}

function buildGuestCards(){
  const count=Number(partySize.value||0);
  const existing={};
  new FormData(form).forEach((value,key)=>{existing[key]=value;});
  guestContainer.innerHTML='';
  for(let i=1;i<=count;i++){
    const card=document.createElement('article');
    card.className='guest-card';
    card.innerHTML=`
      <h3>Guest ${i}</h3>
      <label for="guest${i}Name">Full name <span aria-hidden="true">*</span></label>
      <input id="guest${i}Name" name="Guest ${i} name" type="text" required value="${escapeHtml(existing[`Guest ${i} name`]||'')}">
      <div class="guest-attending-fields" data-guest="${i}">
        <label for="guest${i}Menu">Menu choice</label>
        <select id="guest${i}Menu" name="Guest ${i} menu">
          <option value="">Choose a menu</option>
          ${option('Beef',existing[`Guest ${i} menu`])}${option('Vegetarian',existing[`Guest ${i} menu`])}${option('Vegan',existing[`Guest ${i} menu`])}
          ${option("Children's menu - small portion",existing[`Guest ${i} menu`])}${option("Children's menu - large portion",existing[`Guest ${i} menu`])}
        </select>
        <label for="guest${i}Diet">Dietary requirements or allergies</label>
        <input id="guest${i}Diet" name="Guest ${i} dietary requirements" type="text" placeholder="Enter None if not applicable" value="${escapeHtml(existing[`Guest ${i} dietary requirements`]||'')}">
        <label for="guest${i}Song">Song request</label>
        <input id="guest${i}Song" name="Guest ${i} song request" type="text" placeholder="One song guaranteed to get you dancing" value="${escapeHtml(existing[`Guest ${i} song request`]||'')}">
      </div>`;
    guestContainer.appendChild(card);
  }
}
function option(value,current){return `<option value="${value}" ${current===value?'selected':''}>${value}</option>`;}

function visibleStepElement(){return steps.find(s=>s.dataset.step===activeSteps[currentStep]);}
function showStep(index){
  currentStep=Math.max(0,Math.min(index,activeSteps.length-1));
  steps.forEach(s=>s.classList.toggle('active',s.dataset.step===activeSteps[currentStep]));
  const key=activeSteps[currentStep];
  progressText.textContent=`Step ${currentStep+1} of ${activeSteps.length}`;
  progressName.textContent=stepNames[key];
  progressBar.style.width=`${((currentStep+1)/activeSteps.length)*100}%`;
  backBtn.hidden=currentStep===0;
  nextBtn.hidden=currentStep===activeSteps.length-1;
  submitBtn.hidden=currentStep!==activeSteps.length-1;
  if(key==='guests')buildGuestCards();
  if(key==='review')buildReview();
  window.scrollTo({top:0,behavior:'smooth'});
}
function validateCurrent(){
  const step=visibleStepElement();
  const controls=Array.from(step.querySelectorAll('input,select,textarea')).filter(el=>!el.closest('[hidden]'));
  for(const control of controls){if(!control.checkValidity()){control.reportValidity();return false;}}
  return true;
}

function reviewGroup(title,rows){return `<section class="review-group"><h3>${escapeHtml(title)}</h3>${rows.filter(r=>r[1]).map(r=>`<div class="review-row"><span class="review-label">${escapeHtml(r[0])}</span><span>${escapeHtml(r[1])}</span></div>`).join('')}</section>`;}
function value(name){const radioValue=selected(name);if(radioValue)return radioValue;const el=form.querySelector(`[name="${name}"]`);return el?el.value:'';}
function buildReview(){
  const attendance=value('Party attendance');
  let html=reviewGroup('Your party', [['Lead guest',value('Lead guest')],['Email',value('email')],['Attendance',attendance],['Party size',value('Party size')]]);
  if(attendance!=='Unfortunately no'){
    const count=Number(value('Party size'));
    for(let i=1;i<=count;i++)html+=reviewGroup(`Guest ${i}`, [['Name',value(`Guest ${i} name`)],['Menu',value(`Guest ${i} menu`)],['Dietary requirements',value(`Guest ${i} dietary requirements`)],['Song request',value(`Guest ${i} song request`)]]);
    html+=reviewGroup('Accommodation',[['Likely stay',value('Accommodation')]]);
    html+=reviewGroup('Travel',[['Travelling by air',value('Travelling by air')],['Departure airport',value('Departure airport')],['Arrival airport',value('Arrival airport')],['Airline',value('Airline')],['Flight number',value('Flight number')],['Arrival date',value('Arrival date')],['Arrival time',value('Arrival time')],['Coordinate transport',value('Coordinate transport')]]);
  } else html+='<p class="decline-note">Thank you for letting us know. We are sorry you cannot join us.</p>';
  html+=reviewGroup('Final details',[['Anything else',value('Other information')]]);
  reviewContent.innerHTML=html;
  document.getElementById('rsvpSummary').value=reviewContent.innerText;
}

form.addEventListener('change',e=>{
  if(e.target.name==='Party attendance'){updateFlow();showStep(Math.min(currentStep,activeSteps.length-1));}
  if(e.target.id==='partySize'&&guestContainer.children.length)buildGuestCards();
  if(e.target.name==='Travelling by air')flightFields.hidden=e.target.value!=='Yes';
});
nextBtn.addEventListener('click',()=>{updateFlow();if(!validateCurrent())return;showStep(currentStep+1);});
backBtn.addEventListener('click',()=>showStep(currentStep-1));

form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!validateCurrent())return;
  const accessKey=form.elements.access_key.value;
  if(accessKey==='YOUR_WEB3FORMS_ACCESS_KEY'){
    formMessage.textContent='Setup needed: replace YOUR_WEB3FORMS_ACCESS_KEY in rsvp.html with your Web3Forms access key.';
    formMessage.className='form-message error-notice';return;
  }
  buildReview();
  submitBtn.disabled=true;submitBtn.textContent='Sending...';formMessage.textContent='';
  try{
    const data=Object.fromEntries(new FormData(form));
    const response=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});
    const result=await response.json();
    if(!response.ok||!result.success)throw new Error(result.message||'Submission failed');
    window.location.href='thank-you.html';
  }catch(error){formMessage.textContent='Your RSVP could not be sent. Please check your connection and try again.';formMessage.className='form-message error-notice';submitBtn.disabled=false;submitBtn.textContent='Submit RSVP';}
});
updateFlow();showStep(0);
