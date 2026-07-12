// travelers.ts — authored travelers per day.
// Every traveler's intendedVerdict is for TESTING only; the resolver
// independently derives the correct verdict from rulebook + documents.
import type { Traveler } from "../types";

export const TRAVELERS_BY_DAY: Record<number, Traveler[]> = {
  // ============================ DAY 1 ============================
  1: [
    {
      id: "d1_t1",
      name: "Anya Holvik",
      portrait: " tired woman, rainhat",
      line: "Cold morning, isn't it. Papers, please.",
      intendedVerdict: "APPROVE",
      documents: [
        {
          type: "passport",
          title: "Passport — Anya Holvik",
          fields: [
            { label: "name", value: "Anya Holvik" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Anya Holvik",
          fields: [
            { label: "name", value: "Anya Holvik" },
            { label: "purpose", value: "tourism" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
      ],
    },
    {
      id: "d1_t2",
      name: "Petr Šimek",
      portrait: " sunburnt man with a fishing creel",
      line: "Just here to sell some fish. Two days, maybe three.",
      intendedVerdict: "APPROVE",
      documents: [
        {
          type: "passport",
          title: "Passport — Petr Šimek",
          fields: [
            { label: "name", value: "Petr Šimek" },
            { label: "origin", value: "Kaspen" },
            { label: "expires_on", value: "D50" },
          ],
          seals: [{ id: "kaspen_stamp", label: "Kaspen seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Petr Šimek",
          fields: [
            { label: "name", value: "Petr Šimek" },
            { label: "purpose", value: "work" },
            { label: "valid_until", value: "D12" },
          ],
          seals: [],
        },
      ],
    },
    {
      id: "d1_t3",
      name: "Lena Brod",
      portrait: " nervous, gripping her permit",
      line: "I— it's a holiday, I brought the wrong form, please.",
      // expired entry permit -> DENY (derived)
      intendedVerdict: "DENY",
      documents: [
        {
          type: "passport",
          title: "Passport — Lena Brod",
          fields: [
            { label: "name", value: "Lena Brod" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Lena Brod",
          fields: [
            { label: "name", value: "Lena Brod" },
            { label: "purpose", value: "return" },
            { label: "valid_until", value: "D0" },
          ],
          seals: [],
        },
      ],
      hook: {
        kind: "plea",
        boredomThreshold: 25,
        prompt:
          "She fumbles a coin across the counter. 'Please. My mother is sick. Just this once.'",
        acceptLine:
          "Her shoulders fall with relief, and she presses a hand to the glass.",
        refuseLine:
          "She nods, eyes wet, and takes her papers back without a word.",
      },
    },
    {
      id: "d1_t4",
      name: "Jorje Vos",
      portrait: " a man with one glove and a slick moustache",
      line: "Business. Pleasure. A bit of both, eh?",
      intendedVerdict: "DENY",
      // name mismatch between passport and permit -> DENY
      documents: [
        {
          type: "passport",
          title: "Passport — Jorje Vos",
          fields: [
            { label: "name", value: "Jorje Vos" },
            { label: "origin", value: "Veldar" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "veldar_stamp", label: "Veldar seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Jorge Vos",
          fields: [
            { label: "name", value: "Jorge Vos" },
            { label: "purpose", value: "tourism" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
      ],
    },
    {
      id: "d1_t5",
      name: "Marta Čič",
      portrait: " a courier with a battered valise",
      line: "Hullo again, clerk. Cold today. Here's the usual.",
      // recurring regular #1 — the courier. Valid day 1 docs.
      intendedVerdict: "APPROVE",
      regularId: "marta",
      documents: [
        {
          type: "passport",
          title: "Passport — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "origin", value: "Kaspen" },
            { label: "expires_on", value: "D60" },
          ],
          seals: [{ id: "kaspen_stamp", label: "Kaspen seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "purpose", value: "transit" },
            { label: "valid_until", value: "D22" },
          ],
          seals: [],
        },
      ],
      hook: {
        kind: "courier",
        boredomThreshold: 15,
        prompt:
          "She slides a folded note under the glass. 'For a quiet crossing. There's a wheel of cheese in it for you, clerk.'",
        acceptLine:
          "She winks, tucks the note into your palm, and slips out the gate.",
        refuseLine:
          "'Your loss,' she says, and tucks the note back into her coat.",
      },
    },
    {
      id: "d1_t6",
      name: "Iliya Teren",
      portrait: " a hollow-eyed musician clutching a violin case",
      line: "I'd rather not explain. Only — I'd like to be somewhere warmer.",
      // defector regular #2. Valid papers day 1 — DENY only because purpose
      // is "study" which is NOT in the allowed list.
      intendedVerdict: "DENY",
      regularId: "iliya",
      documents: [
        {
          type: "passport",
          title: "Passport — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "purpose", value: "study" },
            { label: "valid_until", value: "D40" },
          ],
          seals: [],
        },
      ],
      hook: {
        kind: "defector",
        boredomThreshold: 20,
        prompt:
          "He rests his case against the glass. 'I'd rather play somewhere they let me. Please. Don't stamp DENY.'",
        acceptLine:
          "He doesn't smile, but his hand trembles. 'Thank you. I will remember this booth.'",
        refuseLine:
          "He nods, once, and walks back the way he came, case knocking his knee.",
      },
    },
  ],

  // ============================ DAY 2 ============================
  2: [
    {
      id: "d2_t1",
      name: "Oto Krause",
      portrait: " a brick-mason with chalky hands",
      line: "Work permit. Should all be in order, but I'm told there's new rules.",
      // Day 2 needs a work slip with tomac_work_seal — he has it. APPROVE.
      intendedVerdict: "APPROVE",
      documents: [
        {
          type: "passport",
          title: "Passport — Oto Krause",
          fields: [
            { label: "name", value: "Oto Krause" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Oto Krause",
          fields: [
            { label: "name", value: "Oto Krause" },
            { label: "purpose", value: "work" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Oto Krause",
          fields: [
            { label: "name", value: "Oto Krause" },
            { label: "trade", value: "mason" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
    },
    {
      id: "d2_t2",
      name: "Nadia Pol",
      portrait: " a nurse with bloodshot eyes from a long shift",
      line: "Work. Home. Then sleep, hopefully.",
      // missing work slip entirely -> Day 2 denial
      intendedVerdict: "DENY",
      documents: [
        {
          type: "passport",
          title: "Passport — Nadia Pol",
          fields: [
            { label: "name", value: "Nadia Pol" },
            { label: "origin", value: "Kaspen" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "kaspen_stamp", label: "Kaspen seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Nadia Pol",
          fields: [
            { label: "name", value: "Nadia Pol" },
            { label: "purpose", value: "work" },
            { label: "valid_until", value: "D20" },
          ],
          seals: [],
        },
      ],
      hook: {
        kind: "plea",
        boredomThreshold: 35,
        prompt:
          "'They never told me about the work slip, I swear. I've been on my feet ten hours. Please.'",
        acceptLine:
          "She exhales as if she'd been holding her breath the whole shift.",
        refuseLine:
          "'Of course. Of course.' She takes the papers back and limps away.",
      },
    },
    {
      id: "d2_t3",
      name: "Bruno Hes",
      portrait: " a man whose work slip is suspiciously crisp",
      line: "Newly printed. Just now. Today. Fresh.",
      // work slip has no recognised seal -> DENY
      intendedVerdict: "DENY",
      documents: [
        {
          type: "passport",
          title: "Passport — Bruno Hes",
          fields: [
            { label: "name", value: "Bruno Hes" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Bruno Hes",
          fields: [
            { label: "name", value: "Bruno Hes" },
            { label: "purpose", value: "work" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Bruno Hes",
          fields: [
            { label: "name", value: "Bruno Hes" },
            { label: "trade", value: "plumber" },
          ],
          seals: [],
        },
      ],
    },
    {
      id: "d2_t4",
      name: "Marta Čič",
      portrait: " the courier with the battered valise",
      line: "Back again, clerk. Bit heavier today, the valise.",
      intendedVerdict: "APPROVE",
      regularId: "marta",
      documents: [
        {
          type: "passport",
          title: "Passport — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "origin", value: "Kaspen" },
            { label: "expires_on", value: "D60" },
          ],
          seals: [{ id: "kaspen_stamp", label: "Kaspen seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "purpose", value: "transit" },
            { label: "valid_until", value: "D18" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "trade", value: "courier" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
      hook: {
        kind: "courier",
        boredomThreshold: 10,
        prompt:
          "'Bigger note this time. And there's a parrot in the bag — don't open it at the window.' Want in?",
        acceptLine:
          "She whistles low. 'You're getting bolder, clerk. I like it.'",
        refuseLine:
          "'Mmm. Shame.' She pats the valise, which squawks once.",
      },
    },
    {
      id: "d2_t5",
      name: "Iliya Teren",
      portrait: " the hollow-eyed musician, case in hand",
      line: "Still here, clerk. Still cold.",
      intendedVerdict: "DENY",
      regularId: "iliya",
      documents: [
        {
          type: "passport",
          title: "Passport — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "purpose", value: "study" },
            { label: "valid_until", value: "D40" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "trade", value: "musician" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
      hook: {
        kind: "defector",
        boredomThreshold: 15,
        prompt:
          "'They took my teaching post. There's nothing left for me here. If you have ever liked a piece of music in your life…'",
        acceptLine:
          "He sets the case down and plays one note through the glass. A small gift, and a promise.",
        refuseLine:
          "He picks up the case. 'I understand. Don't we all.'",
      },
    },
    {
      id: "d2_t6",
      name: "Officer Reck",
      portrait: " a grey man in a grey coat, no papers in hand",
      line: "Don't mind me. Just observing the booth today. Carry on.",
      // Officer Reck — internal affairs. He has no documents; the resolver
      // DENIES him (missing everything) — but the player isn't really meant
      // to stamp him. We surface him as a non-traveler encounter via hook.
      intendedVerdict: "DENY",
      regularId: "reck",
      documents: [],
      hook: {
        kind: "forgery_request",
        boredomThreshold: 0,
        prompt:
          "'I've no papers, clerk. That's the point. Stamp me APPROVE anyway, would you? See what happens.'",
        acceptLine:
          "Reck watches you slam APPROVE onto nothing. He notes something in a small book and leaves.",
        refuseLine:
          "'Wise.' He watches you a moment longer, then walks back down the road.",
      },
    },
  ],

  // ============================ DAY 3 ============================
  3: [
    {
      id: "d3_t1",
      name: "Dora Lin",
      portrait: " a Veldar woman, plain-faced, anxious",
      line: "I've crossed here a dozen times. What's changed?",
      // Veldar now restricted -> DENY (derived)
      intendedVerdict: "DENY",
      documents: [
        {
          type: "passport",
          title: "Passport — Dora Lin",
          fields: [
            { label: "name", value: "Dora Lin" },
            { label: "origin", value: "Veldar" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "veldar_stamp", label: "Veldar seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Dora Lin",
          fields: [
            { label: "name", value: "Dora Lin" },
            { label: "purpose", value: "return" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Dora Lin",
          fields: [
            { label: "name", value: "Dora Lin" },
            { label: "trade", value: "weaver" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
      hook: {
        kind: "plea",
        boredomThreshold: 20,
        prompt:
          "'My family is on the other side. They wrote me yesterday. Please, just this once, look the other way.'",
        acceptLine:
          "She presses her forehead to the glass. 'Thank you. Thank you.'",
        refuseLine:
          "'I understand.' She gathers her papers and turns back to the rain.",
      },
    },
    {
      id: "d3_t2",
      name: "Mikha Vance",
      portrait: " a smuggler with a too-perfect set of papers",
      line: "All in order, yes? Every stamp. Every field. Boring, isn't it.",
      // Day 3: too clean — but it IS valid. APPROVE because everything matches.
      intendedVerdict: "APPROVE",
      documents: [
        {
          type: "passport",
          title: "Passport — Mikha Vance",
          fields: [
            { label: "name", value: "Mikha Vance" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Mikha Vance",
          fields: [
            { label: "name", value: "Mikha Vance" },
            { label: "purpose", value: "tourism" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Mikha Vance",
          fields: [
            { label: "name", value: "Mikha Vance" },
            { label: "trade", value: "merchant" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
      hook: {
        kind: "note",
        boredomThreshold: 30,
        prompt:
          "He leaves a folded bill under the glass. 'For not asking what I'm carrying, clerk.'",
        acceptLine:
          "He taps the glass twice and is gone, leaving a faint smell of engine oil.",
        refuseLine:
          "'Careful, clerk.' He slides the bill back. 'People who ask questions sometimes get answers.'",
      },
    },
    {
      id: "d3_t3",
      name: "Marta Čič",
      portrait: " the courier, valise squawking faintly",
      line: "Same as ever, clerk. Though the parrot's learned a new word.",
      intendedVerdict: "APPROVE",
      regularId: "marta",
      documents: [
        {
          type: "passport",
          title: "Passport — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "origin", value: "Kaspen" },
            { label: "expires_on", value: "D60" },
          ],
          seals: [{ id: "kaspen_stamp", label: "Kaspen seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "purpose", value: "transit" },
            { label: "valid_until", value: "D14" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "trade", value: "courier" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
      hook: {
        kind: "courier",
        boredomThreshold: 5,
        prompt:
          "'Bolder goods now, clerk. Banned records — the Veldar warblers, you know them. Worth a fortune in Tomač. In?'",
        acceptLine:
          "'Good. The parrot approves too.' It squawks something unprintable.",
        refuseLine:
          "'Your funeral. These sell themselves.' She tucks the records away.",
      },
    },
    {
      id: "d3_t4",
      name: "Iliya Teren",
      portrait: " the musician, lighter on his feet today",
      line: "I keep coming back, clerk. I keep hoping.",
      intendedVerdict: "DENY",
      regularId: "iliya",
      documents: [
        {
          type: "passport",
          title: "Passport — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "purpose", value: "study" },
            { label: "valid_until", value: "D40" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "trade", value: "musician" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
      hook: {
        kind: "defector",
        boredomThreshold: 5,
        prompt:
          "'I sold the violin. For a ticket. If you stamp me through, I'm gone for good this time, I swear.' Wave him through?",
        acceptLine:
          "He doesn't look back. Somewhere south, a stage is waiting for him.",
        refuseLine:
          "He nods, the violin's shadow still on his hand, and turns back.",
      },
    },
    {
      id: "d3_t5",
      name: "Officer Reck",
      portrait: " the grey man in the grey coat",
      line: "Still watching, clerk. Still watching.",
      intendedVerdict: "DENY",
      regularId: "reck",
      documents: [],
      hook: {
        kind: "forgery_request",
        boredomThreshold: 0,
        prompt:
          "'You've been interesting lately, clerk. Want to be more interesting? Stamp this blank page APPROVE for me. Off the record.'",
        acceptLine:
          "Reck pockets the stamped page. 'Now we have an arrangement,' he says, almost warmly.",
        refuseLine:
          "Reck shrugs. 'Pity. We could have worked well together.'",
      },
    },
    {
      id: "d3_t6",
      name: "Hana Vos",
      portrait: " a young woman, first time at a border",
      line: "Is this the line? Is this the booth? I've never done this.",
      // perfectly valid, nervous newbie
      intendedVerdict: "APPROVE",
      documents: [
        {
          type: "passport",
          title: "Passport — Hana Vos",
          fields: [
            { label: "name", value: "Hana Vos" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Hana Vos",
          fields: [
            { label: "name", value: "Hana Vos" },
            { label: "purpose", value: "tourism" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Hana Vos",
          fields: [
            { label: "name", value: "Hana Vos" },
            { label: "trade", value: "student" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
    },
  ],

  // ============================ DAY 4 ============================
  4: [
    {
      id: "d4_t1",
      name: "Gil Marten",
      portrait: " a tired bus driver with a clipboard",
      line: "Transit pass. Here. New rule, I know.",
      // Day 4: needs transit_pass, he has it. APPROVE.
      intendedVerdict: "APPROVE",
      documents: [
        {
          type: "passport",
          title: "Passport — Gil Marten",
          fields: [
            { label: "name", value: "Gil Marten" },
            { label: "origin", value: "Kaspen" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "kaspen_stamp", label: "Kaspen seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Gil Marten",
          fields: [
            { label: "name", value: "Gil Marten" },
            { label: "purpose", value: "transit" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Gil Marten",
          fields: [
            { label: "name", value: "Gil Marten" },
            { label: "trade", value: "driver" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
        {
          type: "transit_pass",
          title: "Transit Pass — Gil Marten",
          fields: [
            { label: "name", value: "Gil Marten" },
            { label: "route", value: "Kaspen-Tomač" },
          ],
          seals: [],
        },
      ],
    },
    {
      id: "d4_t2",
      name: "Elmo Rist",
      portrait: " a man with no transit pass and a guilty look",
      line: "I— wasn't told about the new pass. Honestly.",
      intendedVerdict: "DENY",
      documents: [
        {
          type: "passport",
          title: "Passport — Elmo Rist",
          fields: [
            { label: "name", value: "Elmo Rist" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Elmo Rist",
          fields: [
            { label: "name", value: "Elmo Rist" },
            { label: "purpose", value: "work" },
            { label: "valid_until", value: "D30" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Elmo Rist",
          fields: [
            { label: "name", value: "Elmo Rist" },
            { label: "trade", value: "baker" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
      hook: {
        kind: "plea",
        boredomThreshold: 25,
        prompt:
          "'I'll bake you a loaf, clerk. A good one. Just let me through to my shop on the other side.'",
        acceptLine:
          "He names his shop and promises the loaf is waiting whenever you cross.",
        refuseLine:
          "'Of course. The rules.' He gathers his papers and walks back into the rain.",
      },
    },
    {
      id: "d4_t3",
      name: "Marta Čič",
      portrait: " the courier, valise quieter now",
      line: "Last run, clerk. Last run for me, maybe. You've been good to me.",
      intendedVerdict: "APPROVE",
      regularId: "marta",
      documents: [
        {
          type: "passport",
          title: "Passport — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "origin", value: "Kaspen" },
            { label: "expires_on", value: "D60" },
          ],
          seals: [{ id: "kaspen_stamp", label: "Kaspen seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "purpose", value: "transit" },
            { label: "valid_until", value: "D9" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "trade", value: "courier" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
        {
          type: "transit_pass",
          title: "Transit Pass — Marta Čič",
          fields: [
            { label: "name", value: "Marta Čič" },
            { label: "route", value: "Kaspen-Tomač" },
          ],
          seals: [],
        },
      ],
      hook: {
        kind: "courier",
        boredomThreshold: 0,
        prompt:
          "'One last thing, clerk. A letter — for you. Not notes this time. A letter. It says thank you. Want it?'",
        acceptLine:
          "She presses the letter through the slot, tips an invisible hat, and is gone for the last time.",
        refuseLine:
          "'Fair enough. You were always the careful one.' She slips the letter into her coat and leaves.",
      },
    },
    {
      id: "d4_t4",
      name: "Iliya Teren",
      portrait: " the musician — but lighter, somehow, without the case",
      line: "I sold it. The violin. I've a ticket south. If you'll let me, this is goodbye.",
      intendedVerdict: "DENY",
      regularId: "iliya",
      documents: [
        {
          type: "passport",
          title: "Passport — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "origin", value: "Tomač" },
            { label: "expires_on", value: "D40" },
          ],
          seals: [{ id: "tomac_stamp", label: "Tomač crest" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "purpose", value: "study" },
            { label: "valid_until", value: "D40" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Iliya Teren",
          fields: [
            { label: "name", value: "Iliya Teren" },
            { label: "trade", value: "musician" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
      ],
      hook: {
        kind: "defector",
        boredomThreshold: 0,
        prompt:
          "'No case. No violin. Just a ticket, and a country warm enough to remember my own name in. Let me go, clerk. Let me go for good.'",
        acceptLine:
          "He steps through, and for the first time his shoulders are not bent under the weight of a violin he no longer carries. The arc closes.",
        refuseLine:
          "He nods once, and turns back, the ticket still creased in his hand.",
      },
    },
    {
      id: "d4_t5",
      name: "Officer Reck",
      portrait: " the grey man in the grey coat, smaller at the edges",
      line: "End of the week, clerk. Time we had a proper talk.",
      intendedVerdict: "DENY",
      regularId: "reck",
      documents: [],
      hook: {
        kind: "forgery_request",
        boredomThreshold: 0,
        prompt:
          "'You and I have an understanding, or we could. Stamp this and we're partners — I keep the heat off, you keep the gate open. Or refuse, and find out what heat feels like.'",
        acceptLine:
          "Reck extends a cool hand through the slot. 'Partners, then. Welcome to the interesting side of the booth.'",
        refuseLine:
          "Reck nods. 'Then I'll be seeing you. One way or another.' He walks back down the road, and the booth feels emptier — and safer — for it.",
      },
    },
    {
      id: "d4_t6",
      name: "Petr Šimek",
      portrait: " the sunburnt fisherman, creel empty now",
      line: "Last crossing of the season. Thought I'd say goodbye to the booth.",
      intendedVerdict: "APPROVE",
      documents: [
        {
          type: "passport",
          title: "Passport — Petr Šimek",
          fields: [
            { label: "name", value: "Petr Šimek" },
            { label: "origin", value: "Kaspen" },
            { label: "expires_on", value: "D50" },
          ],
          seals: [{ id: "kaspen_stamp", label: "Kaspen seal" }],
        },
        {
          type: "entry_permit",
          title: "Entry Permit — Petr Šimek",
          fields: [
            { label: "name", value: "Petr Šimek" },
            { label: "purpose", value: "transit" },
            { label: "valid_until", value: "D12" },
          ],
          seals: [],
        },
        {
          type: "work_slip",
          title: "Work Slip — Petr Šimek",
          fields: [
            { label: "name", value: "Petr Šimek" },
            { label: "trade", value: "fisherman" },
          ],
          seals: [{ id: "tomac_work_seal", label: "Tomač work seal" }],
        },
        {
          type: "transit_pass",
          title: "Transit Pass — Petr Šimek",
          fields: [
            { label: "name", value: "Petr Šimek" },
            { label: "route", value: "Kaspen-Tomač" },
          ],
          seals: [],
        },
      ],
    },
  ],
};

export function getTravelersForDay(day: number): Traveler[] {
  return TRAVELERS_BY_DAY[day] ?? [];
}

export function totalDays(): number {
  return Object.keys(TRAVELERS_BY_DAY).length;
}