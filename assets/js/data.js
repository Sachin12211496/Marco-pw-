/* ------------------------------------------------------------------
 * SachinCoderX — Premium 3D Batch Hub
 * Content / data layer.  No framework, no build step: this file just
 * publishes a frozen object on `window.SCX_DATA`.
 *
 * Owner: apna access code aur batch links niche `config` me bharein.
 * Links intentionally empty hain — jo bhi link dena ho, owner khud
 * `accessUrl` me daalega.
 * ------------------------------------------------------------------ */
(function (global) {
  'use strict';

  var IMG_BASE = 'https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/';

  /** Categories — id, label, accent hue (used for badges + fallback covers). */
  var CATEGORIES = [
    { id: 'class910', label: 'Class 9-10', hue: 168 },
    { id: 'upboard', label: 'UP Board', hue: 32 },
    { id: 'class1112', label: 'Class 11-12', hue: 262 },
    { id: 'commerce', label: 'Commerce', hue: 200 },
    { id: 'humanities', label: 'Humanities', hue: 340 },
    { id: 'neet', label: 'NEET', hue: 148 },
    { id: 'jee', label: 'JEE', hue: 22 },
    { id: 'nda', label: 'NDA', hue: 96 },
    { id: 'skills', label: 'Skills', hue: 288 },
    { id: 'finance', label: 'Finance', hue: 46 }
  ];

  /**
   * `accessUrl` khali chhoda gaya hai. Jab owner ke paas apna link ho,
   * wahan daal dein — UI khud "Locked" se "Ready" par switch ho jayega.
   */
  var BATCHES = [
    { id: 'neev-2027', title: 'Neev 2027', cat: 'class910', year: '2027', tag: 'Live + Recorded', badge: 'Popular', subjects: ['Maths', 'Science', 'SST'], pop: 98, accessUrl: '', img: IMG_BASE + '66bccdb9-40a0-411d-8aec-9d6cbd7af02a.png' },
    { id: 'neev-up-2027', title: 'Neev UP Board 2027', cat: 'upboard', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Maths', 'Science', 'Hindi'], pop: 82, accessUrl: '', img: IMG_BASE + '7294faa6-12c5-4f20-a3eb-b227b6ad8d30.png' },
    { id: 'udaan-2027', title: 'Udaan 2027', cat: 'class910', year: '2027', tag: 'Live + Recorded', badge: 'Popular', subjects: ['Maths', 'Science', 'SST'], pop: 96, accessUrl: '', img: IMG_BASE + '65ca4b7b-e751-4c8a-8139-7204e06eddc8.png' },
    { id: 'udaan-up-2027', title: 'Udaan UP Board 2027', cat: 'upboard', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Maths', 'Science', 'SST'], pop: 79, accessUrl: '', img: IMG_BASE + '9208abb4-205e-433d-bafb-8ff1efdc2382.png' },
    { id: 'uday-2027', title: 'Uday 2027', cat: 'class1112', year: '2027', tag: 'Live + Recorded', badge: 'Popular', subjects: ['Physics', 'Chemistry', 'Maths'], pop: 99, accessUrl: '', img: IMG_BASE + '509fffaf-7bca-41bc-8bb1-20a9b77f5a36.png' },
    { id: 'uday-2-2027', title: 'Uday 2.0 2027', cat: 'class1112', year: '2027', tag: 'Live + Recorded', badge: 'New', subjects: ['Physics', 'Chemistry', 'Maths'], pop: 94, accessUrl: '', img: IMG_BASE + 'd815b48b-c5d6-4b6f-9dec-a1a59ebd0647.png' },
    { id: 'uday-commerce-2027', title: 'Uday Commerce 2027', cat: 'commerce', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Accounts', 'Business', 'Eco'], pop: 74, accessUrl: '', img: IMG_BASE + '82b82785-4e1c-45bc-b7e8-d850741b9258.png' },
    { id: 'uday-humanities-2027', title: 'Uday Humanities 2027', cat: 'humanities', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['History', 'Polity', 'Geo'], pop: 68, accessUrl: '', img: IMG_BASE + 'bcdfa46b-cbb0-41a6-8a63-9ee77c8b85fc.png' },
    { id: 'parishram-2027', title: 'Parishram 2027', cat: 'class1112', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Physics', 'Chemistry', 'Maths'], pop: 90, accessUrl: '', img: IMG_BASE + 'c6145313-9d24-4782-8f9d-e6c89b276726.png' },
    { id: 'parishram-commerce-2027', title: 'Parishram Commerce 2027', cat: 'commerce', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Accounts', 'Business', 'Eco'], pop: 71, accessUrl: '', img: IMG_BASE + 'e928d773-6f3e-442f-91c2-49f0062b019b.png' },
    { id: 'parishram-humanities-2027', title: 'Parishram Humanities 2027', cat: 'humanities', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['History', 'Polity', 'Geo'], pop: 64, accessUrl: '', img: IMG_BASE + 'a3eac15e-953d-4003-ab39-d18a643d3140.png' },
    { id: 'avadh-2027', title: 'Avadh 2027', cat: 'class1112', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Physics', 'Chemistry', 'Maths'], pop: 85, accessUrl: '', img: IMG_BASE + '3e903963-c511-4bd4-861d-abfe904c5e86.png' },
    { id: 'arjuna-neet-2027-hindi', title: 'Arjuna NEET 2027 Hindi Medium', cat: 'neet', year: '2027', tag: 'Live + Recorded', badge: 'Hindi', subjects: ['Physics', 'Chemistry', 'Biology'], pop: 88, accessUrl: '', img: IMG_BASE + 'fb391e14-75a6-41dd-88a2-001bb647c027.png' },
    { id: 'arjuna-jee-2027', title: 'Arjuna JEE 2027', cat: 'jee', year: '2027', tag: 'Live + Recorded', badge: 'Popular', subjects: ['Physics', 'Chemistry', 'Maths'], pop: 97, accessUrl: '', img: IMG_BASE + '2819ecfc-efc7-4215-a779-20a45e1655cf.png' },
    { id: 'arjuna-jee-2-2027', title: 'Arjuna JEE 2.0 2027', cat: 'jee', year: '2027', tag: 'Live + Recorded', badge: 'New', subjects: ['Physics', 'Chemistry', 'Maths'], pop: 91, accessUrl: '', img: IMG_BASE + 'ff6f86a3-0a86-4d7d-be30-4ccba12fa838.png' },
    { id: 'arjuna-neet-2027', title: 'Arjuna NEET 2027', cat: 'neet', year: '2027', tag: 'Live + Recorded', badge: 'Popular', subjects: ['Physics', 'Chemistry', 'Biology'], pop: 95, accessUrl: '', img: IMG_BASE + '64c5b9e3-9554-4a7f-8411-c155f81e2185.png' },
    { id: 'lakshay-jee-2027', title: 'Lakshay JEE 2027', cat: 'jee', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Physics', 'Chemistry', 'Maths'], pop: 89, accessUrl: '', img: IMG_BASE + '4b362dbb-e08d-47fa-8cb5-dc5c10b6a897.png' },
    { id: 'lakshay-neet-2027', title: 'Lakshay NEET 2027', cat: 'neet', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Physics', 'Chemistry', 'Biology'], pop: 87, accessUrl: '', img: IMG_BASE + '6f914ec9-5300-422d-8935-6e2f781571fd.png' },
    { id: 'parishram-up-2027', title: 'Parishram UP Board 2027', cat: 'upboard', year: '2027', tag: 'Live + Recorded', badge: '', subjects: ['Physics', 'Chemistry', 'Maths'], pop: 76, accessUrl: '', img: IMG_BASE + 'a5497de2-7617-44e4-bb14-ba19f9901091.png' },
    { id: 'uday-nda-2027', title: 'Uday 2027 + NDA Foundation 2027', cat: 'nda', year: '2027', tag: 'Live + Recorded', badge: 'Combo', subjects: ['Maths', 'GK', 'English'], pop: 72, accessUrl: '', img: IMG_BASE + 'ce2532d3-0e62-4b5f-bb58-b375b03bc3f4.png' },
    { id: 'yakeen-neet-2-2027', title: 'Yakeen NEET 2.0 2027', cat: 'neet', year: '2027', tag: 'Live + Recorded', badge: 'New', subjects: ['Physics', 'Chemistry', 'Biology'], pop: 93, accessUrl: '', img: IMG_BASE + '8341792b-fcd2-4877-a275-3b479acf0fbe.png' },
    { id: 'earners-pw', title: 'Earners PW', cat: 'skills', year: 'Skill', tag: 'Live + Recorded', badge: 'Skill', subjects: ['Freelancing', 'AI Tools', 'Growth'], pop: 66, accessUrl: '', img: IMG_BASE + 'd23c8375-3c43-45da-8328-f296efdbd418.jpg' },
    { id: 'finx-cfa-l1', title: 'Fin-X CFA Level 1 Batch', cat: 'finance', year: 'Skill', tag: 'Live + Recorded', badge: 'Pro', subjects: ['CFA L1', 'Finance', 'Markets'], pop: 61, accessUrl: '', img: IMG_BASE + 'b4c38d49-d18a-4f8a-a241-c4f7c24625cc.png' }
  ];

  var CONFIG = {
    owner: 'SachinCoderX',
    ownerHandle: '@SachinCoderX',
    /* One-time unlock code. Owner yahan apna code set kare. */
    accessCode: 'SACHIN2027',
    /* Unlock ke baad kaunsa label dikhe. */
    unlockedLabel: 'Access Ready',
    lockedLabel: 'Unlock to Access'
  };

  var STATS = [
    { value: BATCHES.length, suffix: '+', label: 'Live Batches' },
    { value: 24, suffix: '/7', label: 'Full Access' },
    { value: 100, suffix: '%', label: 'HD Lectures' },
    { value: CATEGORIES.length, suffix: '+', label: 'Categories' }
  ];

  var FEATURES = [
    { icon: 'bolt', title: 'Ek Jagah Sab Batches', text: 'Neev se Yakeen tak — NDA, Commerce, Humanities, NEET aur JEE ke saare batches ek hi clean hub me, dhundhne me zero time waste.' },
    { icon: 'shield', title: 'One-Time Access Code', text: 'Ek baar code daaliye, poori library unlock. Code dobara maangne ki zaroorat nahi — device par safely yaad rehta hai.' },
    { icon: 'heart', title: 'Favorites Top Par', text: 'Jis batch ko ❤️ karte ho wo sabse upar aa jata hai. Aapki pasand aapke browser me save, koi account nahi chahiye.' },
    { icon: 'sparkle', title: 'Buttery 60fps UI', text: 'GPU-only animations, lazy images aur zero heavy framework — mobile par bhi scroll makkhan jaisa smooth chalta hai.' }
  ];

  var STEPS = [
    { n: '01', title: 'Batch chuno', text: 'Category chip ya search se apna batch dhoondho — filter turant apply hota hai, page reload nahi.' },
    { n: '02', title: 'Code se unlock karo', text: 'Card par "Unlock to Access" dabao, one-time code daalo aur library khul jayegi.' },
    { n: '03', title: 'Padhai shuru', text: 'Live + recorded lectures, HD quality, 24/7 access — favorites me save karke daily wapas aao.' }
  ];

  var FAQS = [
    { q: 'Access code kahan se milega?', a: 'Code owner se milta hai — ' + CONFIG.owner + '. Ek hi baar dena hota hai, uske baad aapke device par unlock state save ho jati hai.' },
    { q: 'Kya ye mobile par chalega?', a: 'Haan. Poora layout responsive hai, touch devices par 3D tilt automatically band ho jata hai taaki scroll smooth rahe.' },
    { q: 'Mere favorites delete ho gaye?', a: 'Favorites aapke browser ke localStorage me rehte hain. Browser data clear karne par wo hat jate hain, dobara ❤️ karna padega.' },
    { q: 'Naye batches kab add honge?', a: 'Neev, Udaan, Uday, Parishram, Arjuna, Lakshay aur Yakeen ke naye drops jaise hi aate hain, hub me update kar diye jate hain.' },
    { q: 'Kya login karna zaroori hai?', a: 'Nahi. Koi account, koi email verification nahi — sirf ek access code aur aap andar.' }
  ];

  global.SCX_DATA = Object.freeze({
    categories: Object.freeze(CATEGORIES),
    batches: Object.freeze(BATCHES),
    config: Object.freeze(CONFIG),
    stats: Object.freeze(STATS),
    features: Object.freeze(FEATURES),
    steps: Object.freeze(STEPS),
    faqs: Object.freeze(FAQS)
  });
})(typeof window !== 'undefined' ? window : globalThis);
