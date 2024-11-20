export const BACKEND_API_BASE_URL = "http://127.0.0.1:8000";
export const BACKEND_WS_BASE_URL = "ws://127.0.0.1:8000";

export const EditorCanvasDefaultCardTypes = {
  Email: { description: "Send and email to a user", type: "Action" },
  Condition: {
    description: "Boolean operator that creates different conditions lanes.",
    type: "Action",
  },
  AI: {
    description:
      "Use the power of AI to summarize, respond, create and much more.",
    type: "Action",
  },
  Slack: { description: "Send a notification to slack", type: "Action" },
  "Google Drive": {
    description:
      "Connect with Google drive to trigger actions or to create files and folders.",
    type: "Trigger",
  },
  Notion: { description: "Create entries directly in notion.", type: "Action" },
  Discord: {
    description: "Post messages to your discord server",
    type: "Action",
  },
  "Google Calendar": {
    description: "Create a calendar invite.",
    type: "Action",
  },
  Trigger: {
    description: "An event that starts the workflow.",
    type: "Trigger",
  },
  Action: {
    description: "An event that happens after the workflow begins",
    type: "Action",
  },
  Wait: {
    description: "Delay the next action step by using the wait timer.",
    type: "Action",
  },
  "GPT-4o": {
    description: "Use the power of AI GPT-4o to generate text.",
    type: "Trigger",
  },
  "GPT-o1": {
    description: "Use the reflective power of AI GPT-o1 to generate high quality results.",
    type: "Trigger",
  },
  "Pinecone": {
    description: "Use the power of Vector Databases",
    type: "Action",
  },
  "Qdrant": {
    description: "A high-performance vector database for storing and searching embeddings, optimized for AI and machine learning applications..",
    type: "Action",
  },
  "File Upload": {
    description: "Upload a file to the workflow.",
    type: "Action",
  },
  "URL Scraper": {
    description: "Scrape contents of a web URL.",
    type: "Action",
  },
  "Wikipedia Search": {
    description: "Search Wikipedia without going to it",
    type: "Action",
  },

  "Docker": {
    description: "Dockerize your workflow.",
    type: "Action",
  },
  "Webhook": {
    description: "Connect any app that has an API key and send data to your applicaiton.",
    type: "Action",
  },
  "SQL DB": {
    description: "Connect your Database to give more context to your AI Agent",
    type: "Trigger",
  },
};

export const accordionData: AccordionItemData[] = [
  {
    title: "AI",
    subItems: [
      "GPT-4o",
      "GPT-o1",
    ],
  },
  {
    title: "Vector Databases",
    subItems: [
    //"Pinecone", For now let's just use Qdrant
    "Qdrant"
    ],
  },
  {
    title: "Databases",
    subItems: [
      "SQL DB"
    ]
  },
  {
    title: "Raw Data",
    subItems: [
      "File Upload",
      "URL Scraper",
      "Google Drive",
      "Wikipedia Search"
    ]
  },
];
{/*  {
    title: "Dev Tools",
    subItems: [
      "Docker",
    ]
  },
  {
    title: "Triggers",
    subItems: [
      "Webhook",
    ]
  } */}


type AccordionItemData = {
  title: string;
  subItems: string[];
};

export const ChatTooltipMessages = [
  "Hello! How can I assist you today?",
  "Need help with something?",
  "I'm here to chat!",
  "What's on your mind?",
  "Let's talk!",
]


// Stripe Constants
export const stripePlans = [
  {
    "name": "Basic",
    "id": "price_1PuuvCGOogTn3fHQmuw0tRx7",
    "object": "plan",
    "active": true,
    "amount": 2000,
    "currency": "eur",
    "interval": "month",
    "interval_count": 1,
    "livemode": false,
    "metadata": {},
    "nickname": null,
    "product": "prod_QmTsfxm1SgzMqx",
    "tiers": [],
    "tiers_mode": null,
    "transform_usage": null,
    "usage_type": "licensed",
    "aggregate_usage": null,
    "billing_scheme": "per_unit",
    "created": 1725362958,
    "meter": null,
    "trial_period_days": null
  }
]

export const testimonials = [
  {
    quote:
      "This AI tool is like my best friend—well, second best after Ryan. It’s made me 100% more productive, which, if you think about it, is like being 200% productive. Now, I can focus on what really matters: managing my employees and planning office parties!",
    name: "Michael Scott",
    title: "Regional Manager, Dunder Mifflin Scranton",
    user_logo: "/placeholder1.png",
  },
  {
    quote:
      "This AI is the beet of technology—durable, efficient, and always ready to work. Since integrating it into my daily routine, my Schrute Farms sales have increased by 17.2%. And yes, it helps with paper sales too, but that’s less important.",
    name: "Dwight Schrute",
    title: "Assistant (to the) Regional Manager, Dunder Mifflin Scranton",
    user_logo: "/placeholder2.png",
  },
  {
    quote:
      "At first, I thought this AI was just another annoying tech upgrade. But now, it handles all the boring tasks so I can focus on pranking Dwight. It’s like having an intern who actually does their job—and doesn’t steal my stapler!",
    name: "Jim Halpert",
    title: "Sales Representative, Dunder Mifflin Scranton",
    user_logo: "/placeholder3.png",
  },
  {
    quote:
      "I was skeptical at first, but this AI has made managing Michael’s calendar a breeze. It even helped me design my art website on the side. Now I have more time to dream about leaving this place… I mean, focus on my creative projects.",
    name: "Pam Beesly",
    title: "Receptionist (and aspiring artist), Dunder Mifflin Scranton",
    user_logo: "/pam_beesly.png",
  },
  {
    quote:
      "This AI SaaS is the future. It’s like I always said: Technology is the key to disrupting the paper industry. Now that I’m back in the office, it’s nice to have an AI assistant that actually listens to me. Plus, it’s way less needy than Michael.",
    name: "Ryan Howard",
    title: "Former Temp, Dunder Mifflin Scranton",
    user_logo: "/placeholder5.png",
  },
  {
    quote:
      "I don’t care much about fancy technology, but this AI does my job for me so I can spend more time on my crossword puzzles. It’s a win-win. Now, if you’ll excuse me, it’s Pretzel Day.",
    name: "Stanley Hudson",
    title: "Sales Representative, Dunder Mifflin Scranton",
    user_logo: "/placeholder6.png",
  },
  {
    quote:
      "OMG, this AI is like the Ryan of technology—so smart, so cool, and it always knows what to say. My customer service response time has improved, which gives me more time to talk about fashion, celebrities, and, of course, Ryan.",
    name: "Kelly Kapoor",
    title: "Customer Service Representative, Dunder Mifflin Scranton",
    user_logo: "/placeholder7.png",
  },
  {
    quote:
      "This AI is ‘Nard Dog’ approved! It helped me organize all my Cornell alumni emails and automate my sales pipeline. Now I can spend more time jamming with my a cappella group. Who knew technology could be so aca-awesome?",
    name: "Andy Bernard",
    title: "Regional Director in Charge of Sales, Dunder Mifflin Scranton",
    user_logo: "/placeholder8.png",
  },
  {
    quote:
      "I was hesitant to trust this AI with the finances, but it’s as precise and meticulous as I am. Plus, it doesn’t ask questions about my personal life or try to pet my cats. It’s the perfect coworker.",
    name: "Angela Martin",
    title: "Head of Accounting, Dunder Mifflin Scranton",
    user_logo: "/placeholder9.png",
  },
  {
    quote:
      "I don’t know what this AI thing does, but it’s definitely not a narc. It lets me do my own thing and never asks questions. Also, if you need passports, I know a guy. Totally unrelated.",
    name: "Creed Bratton",
    title: "Quality Assurance, Dunder Mifflin Scranton",
    user_logo: "/placeholder10.png",
  },
  {
    quote:
      "Ever since I started using this AI, I've been able to consolidate my role as Assistant Regional Manager and Assistant Regional Director of Sales into one. Now, I have more time to attend to my secret potato farm. It’s productivity with a side of root vegetables!",
    name: "Dwight Schrute",
    title: "Assistant (to the) Regional Manager, Dunder Mifflin Scranton",
    user_logo: "/placeholder1.png",
  },
  {
    quote:
      "I was skeptical about technology, but this AI is better than a good hair day. It organizes everything, including my complex love life with Jim. Now, I just need it to organize my dreams about moving to Paris!",
    name: "Pam Beesly",
    title: "Receptionist (and aspiring artist), Dunder Mifflin Scranton",
    user_logo: "/pam_beesly.png",
  },
  {
    quote:
      "This AI is like a magic wand for my sales targets. My numbers are so high now that I’ve had to start wearing sunglasses inside. It’s like having my own personal sales superhero, without the cape!",
    name: "Jim Halpert",
    title: "Sales Representative, Dunder Mifflin Scranton",
    user_logo: "/placeholder3.png",
  },
  {
    quote:
      "I trust this AI more than I trust most of my coworkers. It’s perfect for streamlining all my HR files. Now I can spend more time creating elaborate spreadsheets and less time doing actual work. Who knew productivity could be so much fun?",
    name: "Toby Flenderson",
    title: "Human Resources, Dunder Mifflin Scranton",
    user_logo: "/placeholder4.png",
  },
  {
    quote:
      "Thanks to this AI, my workdays are smoother than a well-buttered pretzel. It handles all the tech stuff, so I can focus on what really matters—prepping for Pretzel Day. Plus, it never tries to eat my lunch!",
    name: "Stanley Hudson",
    title: "Sales Representative, Dunder Mifflin Scranton",
    user_logo: "/placeholder5.png",
  },
  {
    quote:
      "I thought AI was a passing trend until this one started organizing my customer service tickets. It’s like having a personal assistant who doesn’t complain about the air conditioning and never steals my coffee!",
    name: "Kelly Kapoor",
    title: "Customer Service Representative, Dunder Mifflin Scranton",
    user_logo: "/placeholder6.png",
  },
  {
    quote:
      "This AI has made my job so much easier. It’s like having a team of interns who never complain and always get my orders right. Now I have time to perfect my karaoke routine and work on my sea shanties!",
    name: "Andy Bernard",
    title: "Regional Director in Charge of Sales, Dunder Mifflin Scranton",
    user_logo: "/placeholder7.png",
  },
  {
    quote:
      "My AI assistant is so good that it has convinced me to embrace technology. It even helps me with my cat’s complicated schedule. Finally, I can spend less time on paperwork and more time with my precious feline friends!",
    name: "Angela Martin",
    title: "Head of Accounting, Dunder Mifflin Scranton",
    user_logo: "/placeholder8.png",
  },
  {
    quote:
      "This AI is my personal guru. It handles everything from my daily schedules to my side hustles. If only it could manage my existential crises and my secret stashes of questionable documents!",
    name: "Creed Bratton",
    title: "Quality Assurance, Dunder Mifflin Scranton",
    user_logo: "/placeholder9.png",
  },
  {
    quote:
      "I have no idea how this AI works, but it’s helped me solve more problems than Dwight’s beet juice. If you need a reliable assistant that doesn’t judge your eccentricities or require frequent motivational speeches, this is it!",
    name: "Michael Scott",
    title: "Regional Manager, Dunder Mifflin Scranton",
    user_logo: "/placeholder10.png",
  },
];