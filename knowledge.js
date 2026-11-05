/*
  Disha's knowledge. EDIT THIS FILE to change what she says.

  Every fact below comes from IIT Hyderabad's public web pages, checked on 5 November 2026
  (iith.ac.in, library.iith.ac.in, hospital.iith.ac.in, hostel.iith.ac.in), plus Wikipedia for
  the founding history and the fest. Re-check before each showcase.

  How it works:
  - Each topic has keywords. Disha picks the topic whose keywords best match the question.
  - A keyword ending in ^2 counts double. A keyword with a space must appear as a phrase.
  - "answer" can be text, or a function that gets the current time (used for library hours).
  - "say" (optional) is how the answer is read out loud, when the written form reads badly.
  - "chips" are the suggested next questions shown after the answer.
  - "offer" starts a short booking flow (see app.js), which is the call-to-action demo.
*/
window.DISHA = {
  name: "Disha",
  greeting:
    "Hi, I'm Disha, your IIT Hyderabad campus guide. Ask me about the library, hostels, the hospital, departments, campus visits or getting here.",
  fallback:
    "I don't have that one yet, and I won't guess. Try asking about the library, the hospital, hostels, departments, campus visits or getting to campus. For anything else, iith.ac.in is the best place to check.",
  fallbackSay:
    "I don't have that one yet, and I won't guess. Try asking about the library, the hospital, hostels, departments, campus visits or getting to campus.",
  starters: [
    "Is the library open now?",
    "Is the hospital open right now?",
    "Can my parents visit on Saturday?",
    "Who do I contact about my hostel room?",
    "Which departments offer a PhD?",
    "How do I get here from the airport?",
    "Where do I ask about placements?",
    "Where can I get a free coffee?"
  ],

  topics: [
    {
      id: "hello",
      keywords: ["hi", "hello", "hey", "namaste", "hii", "good morning", "good evening", "good afternoon"],
      answer: "Hi! What can I help you find? I know about the library, hostels, the hospital, departments, campus visits and getting to IITH."
    },
    {
      id: "who",
      keywords: ["who are you", "what are you", "are you real", "real person^3", "a person^2", "are you human", "human", "bot", "robot", "chatbot", "official", "are you ai", "are you an ai", "your name", "talking to"],
      answer:
        "I'm Disha, a voice orb and chatbot built as a student demo for the IIT Hyderabad marketing showcase. I'm not an official IITH service. Think of me as a person at the front desk of a website, ready to talk.",
      chips: ["How could a business use you?", "Is the library open now?"]
    },
    {
      id: "business",
      keywords: ["business", "my website", "for my", "price", "cost", "buy", "company", "how do you work", "how does this work", "clients", "customers", "use you"],
      answer:
        "Any college, clinic, real-estate firm or local business can put an orb like me on their website. I greet every visitor, answer from their own information, and turn questions into bookings and enquiries, day or night. Ask Hari at the stand for the full pitch.",
      chips: ["Can my parents visit on Saturday?", "Are you official?"]
    },
    {
      id: "library",
      keywords: ["library^2", "krc^2", "books", "reading", "study", "circulation", "cyber library", "periodicals"],
      answer: function (now) {
        var d = now.getDay();
        if (d === 0 || d === 6) {
          return "It's the weekend, so the library's reading areas are open from 9 AM to 2 AM. It's closed between 6:30 and 9 AM on Saturdays and Sundays. The circulation desk runs 9 AM to 8:30 PM.";
        }
        return "On weekdays the library's reading areas are open from 9 AM to 1:50 AM, and the ground floor stays open round the clock after that. The circulation desk runs 9 AM to 8:30 PM.";
      },
      chips: ["Library email?", "Where can I get a free coffee?"]
    },
    {
      id: "library-contact",
      keywords: ["library email^3", "library contact^3", "library mail^3"],
      answer: "You can email the library at office.library@iith.ac.in. Its website is library.iith.ac.in.",
      say: "You can email the library at office dot library at i i t h dot a c dot in."
    },
    {
      id: "hospital",
      keywords: ["hospital^2", "doctor", "sick", "fever", "medical", "ambulance^2", "pharmacy", "medicine", "emergency^2", "clinic", "health", "unwell", "injured", "hurt"],
      answer:
        "Yes. The campus hospital runs 24x7 with emergency services at all times, and there's an Apollo Pharmacy on campus. For an ambulance, call the ICU ambulance on +91 81791 86827.",
      say:
        "Yes. The campus hospital runs twenty four by seven, with emergency services at all times, and there's an Apollo Pharmacy on campus. For an ambulance, call the ICU ambulance on 8 1 7 9 1, 8 6 8 2 7.",
      chips: ["Speciality clinic booking?", "Who do I contact about my hostel room?"]
    },
    {
      id: "speciality",
      keywords: ["speciality^2", "specialist^2", "appointment", "dentist", "physiotherapy", "x-ray", "xray", "ultrasound"],
      answer:
        "Speciality clinics are booked between 9 AM and 5:30 PM on +91 83310 36233. The hospital also has OPD, physiotherapy, X-ray, ultrasound and lab tests.",
      say:
        "Speciality clinics are booked between 9 AM and 5:30 PM on 8 3 3 1 0, 3 6 2 3 3. The hospital also has OPD, physiotherapy, X-ray, ultrasound and lab tests."
    },
    {
      id: "hostel",
      keywords: ["hostel^2", "room^2", "warden", "allotment", "block", "accommodation", "stay"],
      answer:
        "For anything about your room, contact the Hostel Coordinating Unit in the Pavilion Block, between Kautilya and Vyasa. Email office.hostel@iith.ac.in or call 040 2301 6833.",
      say:
        "For anything about your room, contact the Hostel Coordinating Unit in the Pavilion Block, between Kautilya and Vyasa. You can email office dot hostel at i i t h dot a c dot in.",
      chips: ["What food is there?", "Is the hospital open right now?"]
    },
    {
      id: "food",
      keywords: ["food^2", "mess^2", "dining^2", "eat", "lunch", "dinner", "breakfast", "menu", "canteen"],
      answer:
        "Students, staff and faculty share a common dining hall that serves North and South Indian food, and student representatives check the quality. I don't have today's menu, so check the dining website for that.",
      chips: ["Where can I get a free coffee?"]
    },
    {
      id: "coffee",
      keywords: ["coffee^2", "cafe^2", "shiru^3", "tea", "drink", "drinks"],
      answer:
        "Try Shiru Cafe. It was the first Shiru Cafe outside Japan, it's run with Japanese student interns, and drinks are free for the IITH community."
    },
    {
      id: "departments",
      keywords: ["department^2", "departments^2", "branch", "branches", "phd^2", "research", "school", "schools"],
      answer:
        "IITH has 18 departments across engineering, sciences, and liberal arts, design and management, and every one of them offers a PhD. There's also a School of Innovation and Entrepreneurship and a School of Sustainability.",
      chips: ["Which programmes are offered?", "How big is the campus?"]
    },
    {
      id: "programmes",
      keywords: ["programme^2", "programmes^2", "program^2", "programs^2", "course", "courses", "btech^2", "b.tech^2", "mtech^2", "m.tech^2", "admission^2", "admissions^2", "jee^2", "apply", "degree", "masters", "mdes", "bdes"],
      answer:
        "IITH offers B.Tech, B.Des, M.Tech, M.Des, M.Sc, MA and PhD, plus online M.Tech and M.Des programmes. B.Tech admission is through JEE Advanced and JoSAA counselling. For the other programmes, check the admissions section under Academics on iith.ac.in.",
      say:
        "IITH offers B Tech, B Des, M Tech, M Des, M Sc, M A and PhD, plus online M Tech and M Des programmes. B Tech admission is through JEE Advanced and JoSAA counselling. For the others, check the admissions section on the IITH website."
    },
    {
      id: "visit",
      keywords: ["visit^2", "visiting", "parents^2", "tour^2", "saturday", "see the campus", "walk in", "visitors", "guest"],
      answer:
        "Yes! Guided campus visits run every Saturday in 2-hour slots. You need to register online first, because walk-ins aren't allowed, and everyone needs a photo ID. Want me to help you pick a slot?",
      offer: "visit",
      chips: ["Yes, help me pick", "Not now"]
    },
    {
      id: "reach",
      keywords: ["airport^2", "reach^2", "get here", "get to", "directions", "metro^2", "train", "mmts", "lingampally", "how far", "distance", "location", "where is iith", "address", "route"],
      answer:
        "IITH is at Kandi, Sangareddy, about 64 km from the airport. By road, take the Outer Ring Road from Gandiguda, exit 3 at Muthangi, then NH 65, and IITH is on the right. By metro, go to Miyapur. By MMTS train, go to Lingampally, where IITH buses run to the campus.",
      chips: ["What are the bus timings?"]
    },
    {
      id: "bus",
      keywords: ["bus timing^3", "bus timings^3", "bus schedule^3", "bus^2", "shuttle^2", "next bus"],
      answer:
        "IITH runs buses between Lingampally station and the campus. Timings change, so I don't read them out. Check iith.ac.in/bus_schedule for the latest.",
      say:
        "IITH runs buses between Lingampally station and the campus. Timings change, so I don't read them out. Check the bus schedule page on the IITH website for the latest."
    },
    {
      id: "careers",
      keywords: ["placement^2", "placements^2", "internship^2", "internships^2", "job", "jobs", "career^2", "careers^2", "recruit", "ocs"],
      answer:
        "Placements, internships and career guidance are handled by the Office of Career Services. Their site is ocs.iith.ac.in.",
      say: "Placements, internships and career guidance are handled by the Office of Career Services. Their site is o c s dot i i t h dot a c dot in."
    },
    {
      id: "wellbeing",
      keywords: ["stress^2", "stressed^2", "sad", "depressed^2", "anxious^2", "anxiety^2", "lonely", "counselling^2", "counseling^2", "counsellor", "mental", "can't sleep", "cant sleep", "talk to someone", "overwhelmed", "suicide^3", "hurt myself^3"],
      answer:
        "I'm really glad you asked. You don't have to deal with this alone. Sunshine, IITH's counselling cell, is there for you at sunshine.iith.ac.in. You can also call Tele MANAS, India's free 24x7 mental health helpline, on 14416. If you're in danger right now, call the ICU ambulance on +91 81791 86827 or go to the campus hospital, which runs 24x7.",
      say:
        "I'm really glad you asked. You don't have to deal with this alone. Sunshine, IITH's counselling cell, is there for you. You can also call Tele MANAS, India's free mental health helpline, on 1 4 4 1 6, any time. If you're in danger right now, call the ICU ambulance or go to the campus hospital, which runs twenty four by seven."
    },
    {
      id: "about",
      keywords: ["history", "established", "founded", "started", "when was", "how old", "about iith", "tell me about"],
      answer:
        "IIT Hyderabad started on 18 August 2008 from a temporary campus at Ordnance Factory Medak, and moved to its permanent 576-acre campus at Kandi in July 2015. It was set up with help from the Government of Japan.",
      chips: ["Who is the director?", "What is IITH's ranking?"]
    },
    {
      id: "size",
      keywords: ["acres^2", "how big", "campus size", "size", "area", "students", "how many students"],
      answer:
        "The campus covers 576 acres, and IITH has over 5,750 students across UG, PG and PhD programmes."
    },
    {
      id: "director",
      keywords: ["director^2", "head", "murty"],
      answer: "The director of IIT Hyderabad is Prof. B. S. Murty. The founding director was Prof. U. B. Desai.",
      say: "The director of IIT Hyderabad is Professor B S Murty. The founding director was Professor U B Desai."
    },
    {
      id: "ranking",
      keywords: ["rank^2", "ranking^2", "rankings^2", "nirf^3", "qs", "best"],
      answer:
        "In NIRF 2025, IITH ranked 7th among engineering institutes in India and 12th overall. In the QS World University Rankings 2026, it's at 664."
    },
    {
      id: "fest",
      keywords: ["fest^2", "elan^3", "nvision^3", "festival", "events", "cultural", "pronite"],
      answer:
        "Elan and nVision is IITH's annual techno-cultural fest, usually held in January or February. Check the fest's official channels for this year's dates."
    },
    {
      id: "safety",
      keywords: ["security^2", "lost", "theft", "stolen", "harassment^3", "complaint^2", "icc^2", "unsafe"],
      answer:
        "For campus security, go to the Security office at security.iith.ac.in. For a harassment complaint, the Internal Complaints Committee is at icc.iith.ac.in.",
      say: "For campus security, contact the Security office. For a harassment complaint, contact the Internal Complaints Committee. Both have pages on the IITH website."
    },
    {
      id: "contact",
      keywords: ["contact", "phone number", "email", "pin code", "pincode", "postal"],
      answer:
        "IIT Hyderabad's address is Kandi, Sangareddy, Telangana 502284. For general questions, the Public Relations Office is at pro@iith.ac.in, and the full phone directory is on iith.ac.in.",
      say: "IIT Hyderabad's address is Kandi, Sangareddy, Telangana, 5 0 2 2 8 4. For general questions, email the Public Relations Office at p r o at i i t h dot a c dot in."
    },
    {
      id: "thanks",
      keywords: ["thanks^2", "thank you^2", "thank", "great", "awesome", "cool", "nice", "bye", "ok", "okay"],
      answer: "Happy to help! Ask me anything else about IITH, any time."
    }
  ],

  /* The booking flow: how a website orb turns a question into an enquiry (the call to action). */
  flows: {
    visit: {
      askSlot:
        "Great. Which Saturday slot suits you: 9 to 11 AM, 10 AM to 12 noon, 11 AM to 1 PM, 2 to 4 PM, or 3 to 5 PM?",
      slots: [
        { label: "9 to 11 AM", match: ["9", "nine", "9am", "early"] },
        { label: "10 AM to 12 noon", match: ["10", "ten", "10am"] },
        { label: "11 AM to 1 PM", match: ["11", "eleven", "11am"] },
        { label: "2 to 4 PM", match: ["2", "two", "2pm"] },
        { label: "3 to 5 PM", match: ["3", "three", "3pm", "evening", "late"] }
      ],
      confirm: function (slot) {
        return "Nice choice: Saturday, " + slot + ". On a business website, this is where I'd take your name and number and send the booking straight to the team, so no enquiry is lost. This demo doesn't store anything, so please register for real at iith.ac.in/visit.";
      },
      confirmSay: function (slot) {
        return "Nice choice: Saturday, " + slot + ". On a business website, this is where I'd take your name and number and send the booking straight to the team, so no enquiry is lost. This demo doesn't store anything, so please register for real on the IITH visit page.";
      },
      decline: "No problem. Ask me anything else about IITH."
    }
  }
};
