import type { SpeakingTask } from "@/domain/types";

export const SPEAKING_TASKS: SpeakingTask[] = [
  // ───────────── Part 1: interview ─────────────
  {
    id: "sp-01",
    part: "interview",
    title: "Interview: home, work and free time",
    level: "C1",
    theme: "work",
    instructions:
      "I’m going to ask you a few questions about yourself. Answer each one in a few sentences, giving reasons or examples where you can.",
    prompts: [
      "Where are you from, and what do you like most about living there?",
      "Tell us about your job or your studies. What do you find most rewarding about it?",
      "How do you usually spend your free time at weekends?",
      "Is there a skill you would like to learn in the near future? Why?",
    ],
    questions: [
      "Can you give a specific example to support what you said?",
      "Has this changed since you were younger?",
      "What would you change about it if you could?",
    ],
    prepSeconds: 0,
    speakSeconds: 45,
    usefulLanguage: [
      "What I appreciate most is …",
      "To be honest, …",
      "As far as … is concerned, …",
      "I’d say that …",
      "It’s something I’ve been meaning to do for a while",
      "I tend to …",
      "Funnily enough, …",
      "It’s fair to say that …",
    ],
    sample:
      "I’m from a medium-sized coastal city, and what I appreciate most is the pace of life. Everything is within walking distance, and you can be on the beach in ten minutes after work, which does wonders for your stress levels. As far as my job is concerned, I work in project management for a logistics firm. The most rewarding part is seeing a complicated plan come together, although to be honest the deadlines can be quite demanding. At weekends I tend to unwind by cycling or meeting friends for a long lunch. Funnily enough, I’ve also been meaning to learn the guitar for ages, and I’d say that this year I’m finally going to sign up for lessons, because I’ve realised that waiting for the perfect moment simply means never starting.",
  },
  {
    id: "sp-02",
    part: "interview",
    title: "Interview: learning, travel and technology",
    level: "C1",
    theme: "education",
    instructions:
      "I’m going to ask you some questions about learning, travel and everyday life. Try to develop your answers rather than replying with a single sentence.",
    prompts: [
      "What is the most useful thing you have learnt outside a classroom?",
      "Do you prefer to plan a trip carefully or to improvise as you go? Why?",
      "How has technology changed the way you keep in touch with friends and family?",
    ],
    questions: [
      "Can you remember a time when a plan went wrong? What happened?",
      "Do you think this is the same for people of different ages?",
      "What do you think the downsides might be?",
    ],
    prepSeconds: 0,
    speakSeconds: 45,
    usefulLanguage: [
      "On the whole, …",
      "I’d much rather … than …",
      "It depends on …",
      "Looking back, …",
      "That’s a tricky one, but …",
      "if anything, …",
      "I’m quite fond of …",
      "to a certain extent",
    ],
    sample:
      "That’s a tricky one, but I’d say the most useful thing I’ve learnt outside a classroom is how to cook properly, because it taught me patience and how to improvise when something goes wrong. As for travel, I’d much rather leave room for surprises than follow a strict schedule. I usually book the first couple of nights and the transport, and on the whole I let the rest unfold. Looking back, some of my best memories come from getting lost in a new city. Technology has changed things enormously, of course. I’m in constant contact with my family now, mostly through voice messages, so I probably talk to them more often than I did when I lived at home. If anything, the danger is that we confuse quick messages with genuine conversation, so I try to phone people regularly as well.",
  },

  // ───────────── Part 2: long turn ─────────────
  {
    id: "sp-03",
    part: "long-turn",
    title: "Long turn: working in different places",
    level: "C1",
    theme: "work",
    instructions:
      "Here are three pictures showing people working in different places. Compare TWO of the pictures, and say why the people might have chosen to work in these places and how they might be feeling. You have 15 seconds to look at the pictures, then speak for about a minute.",
    prompts: [
      "Picture A: A woman in a bright, noisy open-plan office. Colleagues are gathered around a whiteboard and a wall of sticky notes, and several people are laughing as they talk through a problem.",
      "Picture B: A man sitting at a small kitchen table in a quiet flat, working on a laptop with a mug of coffee beside him. A cat is asleep on the chair next to his, and rain is running down the window.",
      "Picture C: A young woman perched on a rock beside a mountain lake, typing on a laptop. A rucksack lies at her feet and the sun is just rising over the peaks behind her.",
    ],
    questions: [
      "Why might the people have chosen to work in these places?",
      "How might each person be feeling?",
      "Which of these settings would suit you best, and why?",
    ],
    prepSeconds: 15,
    speakSeconds: 60,
    usefulLanguage: [
      "Whereas the first picture shows …, the second …",
      "Both pictures have … in common, although …",
      "He/She might well have chosen … because …",
      "I get the impression that …",
      "It could be that …",
      "Judging by …, I’d say …",
      "The obvious advantage is …, whereas the drawback might be …",
      "If I had to choose, …",
    ],
    sample:
      "Whereas the first picture shows a busy open-plan office, the second shows someone working alone at home. In the office, the woman might well have chosen to work there because collaboration matters in her job, and judging by the laughter, I’d say she feels energised and part of a team. The obvious advantage is that ideas can be bounced around instantly, although the drawback might be the noise and the constant interruptions. The man, on the other hand, seems to be enjoying the peace and quiet, and I get the impression that he values flexibility, since he can work in comfort and avoid a long commute. It could be that he is slightly isolated, though, especially on a gloomy, rainy day. Both people have chosen environments that match their working style. If I had to choose, I’d probably go for a mixture, working at home when I need to concentrate and going into the office when I need to brainstorm.",
  },
  {
    id: "sp-04",
    part: "long-turn",
    title: "Long turn: different kinds of holiday",
    level: "C1",
    theme: "travel",
    instructions:
      "Here are three pictures showing different kinds of holiday. Compare TWO of the pictures, and say what the advantages of each kind of holiday might be and which one would be more memorable. You have 15 seconds to look at the pictures, then speak for about a minute.",
    prompts: [
      "Picture A: A group of backpackers in muddy walking boots, climbing a narrow trail through a misty forest. They look tired but are smiling and pointing at a waterfall in the distance.",
      "Picture B: A family relaxing by a hotel swimming pool under parasols. Children splash in the water while the parents read books and a waiter brings cold drinks on a tray.",
      "Picture C: Two travellers sitting at a plastic table in a crowded night market, sharing steaming bowls of noodles with a street vendor who is explaining something with big gestures.",
    ],
    questions: [
      "What might be the advantages of each kind of holiday?",
      "Which holiday is likely to be more memorable, and why?",
      "How important is it to try something different when you travel?",
    ],
    prepSeconds: 15,
    speakSeconds: 60,
    usefulLanguage: [
      "One key difference is that …",
      "In contrast, …",
      "They’re probably looking for …",
      "What appeals to me about … is …",
      "It’s likely to stay with them for years",
      "On the one hand … on the other hand …",
      "I’d argue that …",
      "stepping out of your comfort zone",
    ],
    sample:
      "One key difference is that the backpackers are clearly looking for adventure, whereas the family at the hotel pool is probably looking for rest. The advantage of the hiking trip is that it’s physically rewarding, and I’d imagine the group feels a strong sense of achievement, even if they’re exhausted. In contrast, the family can relax completely, with everything organised for them, which is ideal when you have small children. On the one hand, the poolside holiday is stress-free and predictable; on the other hand, it could be rather similar to every other resort around the world. I’d argue that the trek is likely to be more memorable, because shared challenges tend to bond people, and the scenery is something that will stay with them for years. That said, I wouldn’t say one kind of holiday is better than the other. It depends on what people need at that point in their lives, and stepping out of your comfort zone isn’t always what you want after a stressful year.",
  },
  {
    id: "sp-05",
    part: "long-turn",
    title: "Long turn: ways of learning",
    level: "C1",
    theme: "education",
    instructions:
      "Here are three pictures showing people learning in different ways. Compare TWO of the pictures, and say why people might choose to learn in these ways and how effective each might be. You have 15 seconds to look at the pictures, then speak for about a minute.",
    prompts: [
      "Picture A: A teacher stands at the front of a traditional classroom with rows of desks. Teenagers are copying notes from a board, and one student at the back is hesitantly raising her hand.",
      "Picture B: A middle-aged man in headphones sits in front of a laptop in a living room. A video lecture is paused on the screen, and he is jotting something in a notebook beside a half-finished cup of tea.",
      "Picture C: A small group of adults in aprons stand around a wooden workbench in a carpentry workshop. An instructor is guiding one woman’s hands as she cuts a piece of wood.",
    ],
    questions: [
      "Why might people choose to learn in these ways?",
      "How effective might each way of learning be?",
      "What do you think is the best way to learn a new skill?",
    ],
    prepSeconds: 15,
    speakSeconds: 60,
    usefulLanguage: [
      "Both … involve …, but …",
      "The main benefit of … is that …",
      "I suspect that …",
      "Learners are more likely to … if …",
      "It strikes me that …",
      "Having said that, …",
      "is bound to be …",
      "hands-on experience",
    ],
    sample:
      "Both the classroom and the workshop involve a teacher, but the way people learn is quite different. The teenagers are probably in a classroom because they have to be, as it’s the standard way to deliver a curriculum to a large group. The main benefit of this is that everyone gets the same information, but I suspect that it’s not always effective, because pupils are mostly passive, copying from the board rather than engaging. In the workshop, on the other hand, the adults have probably chosen to be there, so they’re likely to be more motivated. Learners are more likely to remember something if they actually do it, and it strikes me that the instructor guiding the woman’s hands offers precisely the kind of personal feedback you can’t get from a lecture. Having said that, the workshop is only suitable for practical skills. If I wanted to learn a language, I think I’d combine both: structured lessons and plenty of hands-on practice.",
  },
  {
    id: "sp-06",
    part: "long-turn",
    title: "Long turn: living in a city",
    level: "C1+",
    theme: "environment",
    instructions:
      "Here are three pictures showing people dealing with city life in different ways. Compare TWO of the pictures, and say what the benefits and drawbacks of each way of living might be and which is more sustainable. You have 15 seconds to look at the pictures, then speak for about a minute.",
    prompts: [
      "Picture A: A wide city street closed to cars. Cyclists and pedestrians fill the road, café tables spill onto the pavement and a street musician is playing under a row of newly planted trees.",
      "Picture B: A multi-lane motorway at rush hour. Lines of cars are stuck in a haze of exhaust fumes, and a driver in the foreground is drumming impatiently on the steering wheel.",
      "Picture C: A rooftop vegetable garden above a block of flats. Neighbours of different ages are watering raised beds and picking tomatoes, with the city skyline stretching out behind them.",
    ],
    questions: [
      "What are the benefits and drawbacks of each way of living?",
      "Which of these is more sustainable in the long term?",
      "What could cities do to encourage more people to live like this?",
    ],
    prepSeconds: 15,
    speakSeconds: 60,
    usefulLanguage: [
      "What strikes me about the first picture is …",
      "In stark contrast, …",
      "The upside is …, while the downside is …",
      "is far more sustainable in the long run",
      "It’s a question of …",
      "there’s no denying that …",
      "Admittedly, …",
      "would go a long way towards …",
    ],
    sample:
      "What strikes me about the first picture is how pleasant the street looks once cars have been removed. In stark contrast, the motorway shows the less attractive side of urban life. The upside of the pedestrian street is that it’s healthier and quieter, and it clearly encourages people to spend time and money locally. Admittedly, some shop owners might worry about deliveries and customers who can’t walk far. The motorway, on the other hand, offers speed and convenience in theory, but there’s no denying that it’s polluting and that the drivers don’t seem to be going anywhere fast. Clearly, the pedestrian street is far more sustainable in the long run, because it reduces emissions and makes public space available to everyone. As for what cities could do, I think affordable, reliable public transport would go a long way towards persuading people to leave their cars at home, since few commuters will give up driving unless the alternative is genuinely better.",
  },

  // ───────────── Part 3: collaborative task ─────────────
  {
    id: "sp-07",
    part: "collaborative",
    title: "Collaborative task: preparing students for the future",
    level: "C1",
    theme: "education",
    instructions:
      "A secondary school wants to help its students prepare for working life. Here are some ideas the school is considering. Talk to your partner about how useful each idea might be, then decide which TWO ideas the school should put in place first. You have 15 seconds to read the options, then about two minutes to discuss them.",
    prompts: [
      "Work placements with local businesses",
      "Workshops on managing money",
      "Public speaking and debating clubs",
      "Coding and digital skills classes",
      "Visits from people with different careers",
    ],
    questions: [
      "How might each of these ideas help students prepare for working life?",
      "Which TWO ideas should the school put in place first?",
    ],
    prepSeconds: 15,
    speakSeconds: 120,
    usefulLanguage: [
      "Shall we start with …?",
      "I’d say … is particularly valuable because …",
      "That’s a fair point, but …",
      "I see what you mean, although …",
      "What do you make of …?",
      "Where I’d disagree is …",
      "So, are we agreed that …?",
      "On balance, I’d go for …",
    ],
    sample:
      "Shall we start with work placements? I’d say they’re particularly valuable because students see what a job is really like, and they can build contacts. That’s a fair point about the logistics, but I think most local firms would be willing to help. Money workshops are also useful, since many young people leave school without knowing how to budget, though I’d say it’s less directly linked to getting a job. Public speaking is interesting. It would boost confidence, which employers really value, but not everyone would want to join a club. What do you make of coding? I see what you mean about digital skills being essential, although I’m not sure every student needs to write code. Visits from professionals are inspiring, but passive. So, on balance, I’d go for work placements, because they give practical experience, and public speaking, because confident communication helps in every career. Are we agreed that those two should come first?",
  },
  {
    id: "sp-08",
    part: "collaborative",
    title: "Collaborative task: attracting visitors to a town",
    level: "C1",
    theme: "travel",
    instructions:
      "A small historic town would like to attract more visitors without harming the lives of the people who live there. Here are some ideas the town council is considering. Talk to your partner about the possible advantages and drawbacks of each idea, then decide which TWO the council should adopt. You have 15 seconds to read the options, then about two minutes to discuss them.",
    prompts: [
      "A summer music and food festival",
      "A network of signposted cycle and walking routes",
      "A small tourist tax on overnight stays",
      "Longer opening hours for museums and shops",
      "A ban on cars in the town centre",
    ],
    questions: [
      "What might be the advantages and drawbacks of each idea?",
      "Which TWO ideas should the council adopt?",
    ],
    prepSeconds: 15,
    speakSeconds: 120,
    usefulLanguage: [
      "Let’s think about the pros and cons of …",
      "One potential drawback is …",
      "I’m not entirely convinced that …",
      "That’s true up to a point, but …",
      "We could always …",
      "Would you agree that …?",
      "Come to think of it, …",
      "I’d be inclined to rule out …",
    ],
    sample:
      "Let’s think about the pros and cons of each one. A festival would bring in a lot of money, but one potential drawback is that it might make the town unbearably crowded for a few weeks. I’m not entirely convinced that a tourist tax would attract visitors, though it could fund improvements. That’s true up to a point, but a small charge is unlikely to put people off. Cycle and walking routes sound like a safe option: they’re cheap, they spread visitors around, and residents benefit as well. Would you agree that a car ban might be too drastic? Come to think of it, it could actually be popular if there were good parking on the edge of town, but it would upset shopkeepers at first. I’d be inclined to rule out longer opening hours, as they wouldn’t draw new people. So I’d suggest the cycle routes and the festival, as long as it’s limited to a weekend or two. What do you think?",
  },

  // ───────────── Part 4: discussion ─────────────
  {
    id: "sp-09",
    part: "discussion",
    title: "Discussion: competition and cooperation",
    level: "C1",
    theme: "society",
    instructions:
      "Now I’d like to ask you some more general questions related to the topic you have just discussed. Answer each question in turn, giving reasons and examples.",
    prompts: [
      "Some people say that competition brings out the best in us, while others believe that cooperation is more productive.",
    ],
    questions: [
      "To what extent do you think competition is healthy for young people?",
      "Is it better to reward individual achievement or team success?",
      "Do you think society puts too much emphasis on winning?",
      "How might competition have a negative effect in the workplace?",
    ],
    prepSeconds: 0,
    speakSeconds: 60,
    usefulLanguage: [
      "To a large extent, …",
      "There’s a lot to be said for …",
      "I’m inclined to think that …",
      "It all comes down to …",
      "Up to a point, …",
      "The danger is that …",
      "It’s not so much … as …",
      "Few people would deny that …",
    ],
    sample:
      "To a large extent, I think competition can be healthy for young people, but it all comes down to how it’s handled. There’s a lot to be said for friendly rivalry, because it pushes people to improve and teaches them to cope with disappointment. Few people would deny that a bit of pressure can be motivating. The danger is that if everything becomes a contest, children start to measure their self-worth by results. As for rewards, I’m inclined to think that team success should matter at least as much as individual achievement, since almost every real job involves collaboration. It’s not so much that winning is bad as that we sometimes celebrate it at the expense of effort and kindness. In the workplace, constant competition between colleagues can encourage people to hide information from each other, which ultimately damages the company as a whole.",
  },
  {
    id: "sp-10",
    part: "discussion",
    title: "Discussion: technology, privacy and tradition",
    level: "C1+",
    theme: "technology",
    instructions:
      "Now I’d like to ask you some more general questions on the theme of change and tradition. Answer each question in turn, giving reasons and examples.",
    prompts: [
      "Modern technology collects more information about our lives than ever before, while many traditional ways of living are disappearing.",
    ],
    questions: [
      "How far should people be willing to give up privacy in exchange for convenience?",
      "Is it important to preserve traditions in a rapidly changing world?",
      "Do you think older generations adapt well to new technology?",
      "What responsibility do companies have to protect personal data?",
    ],
    prepSeconds: 0,
    speakSeconds: 60,
    usefulLanguage: [
      "That’s a thorny issue",
      "I’d argue that …",
      "By and large, …",
      "It’s a delicate balance between … and …",
      "One could argue that …",
      "In my view, …",
      "much depends on …",
      "I wouldn’t go so far as to say …",
    ],
    sample:
      "That’s a thorny issue. By and large, I think people give up their privacy far too readily, often without understanding what they’re agreeing to. We click “accept” on long terms and conditions because it’s convenient, but I’d argue that this is a poor trade, because data can be misused in ways we can’t foresee. It’s a delicate balance between enjoying useful services and keeping some control over our lives. As for traditions, I wouldn’t go so far as to say that everything old deserves to be preserved, but customs that bring communities together, such as local festivals, are worth protecting precisely because technology tends to isolate us. Much depends on whether people choose to keep them alive. Finally, companies have a clear duty to protect the data they hold, and I think strict laws with heavy fines are the only effective way to make sure they take that duty seriously.",
  },
];
