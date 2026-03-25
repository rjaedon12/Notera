"use client"

import { useState, useRef, useEffect, useMemo } from "react"

// Comprehensive emoji dataset with search keywords
interface EmojiEntry {
  emoji: string
  keywords: string[]
}

const EMOJI_DATA: { name: string; entries: EmojiEntry[] }[] = [
  {
    name: "Smileys & People",
    entries: [
      { emoji: "😀", keywords: ["grinning", "happy", "smile"] },
      { emoji: "😃", keywords: ["grinning", "big eyes", "happy"] },
      { emoji: "😄", keywords: ["grinning", "squint", "happy"] },
      { emoji: "😁", keywords: ["beaming", "grin", "happy"] },
      { emoji: "😆", keywords: ["laughing", "satisfied"] },
      { emoji: "😅", keywords: ["sweat", "laugh", "relief"] },
      { emoji: "🤣", keywords: ["rofl", "rolling", "laugh"] },
      { emoji: "😂", keywords: ["joy", "tears", "laugh"] },
      { emoji: "🙂", keywords: ["slightly smiling", "happy"] },
      { emoji: "🙃", keywords: ["upside down", "sarcasm"] },
      { emoji: "😉", keywords: ["wink", "flirt"] },
      { emoji: "😊", keywords: ["blush", "happy", "smile"] },
      { emoji: "😇", keywords: ["angel", "halo", "innocent"] },
      { emoji: "🥰", keywords: ["love", "hearts", "adore"] },
      { emoji: "😍", keywords: ["heart eyes", "love"] },
      { emoji: "🤩", keywords: ["star struck", "excited"] },
      { emoji: "😘", keywords: ["kiss", "love"] },
      { emoji: "😗", keywords: ["kissing", "whistle"] },
      { emoji: "😚", keywords: ["kissing", "closed eyes"] },
      { emoji: "😋", keywords: ["yummy", "delicious", "tongue"] },
      { emoji: "😛", keywords: ["tongue", "playful"] },
      { emoji: "😜", keywords: ["wink", "tongue", "crazy"] },
      { emoji: "🤪", keywords: ["zany", "crazy", "wild"] },
      { emoji: "😎", keywords: ["cool", "sunglasses"] },
      { emoji: "🤓", keywords: ["nerd", "glasses", "smart"] },
      { emoji: "🧐", keywords: ["monocle", "curious"] },
      { emoji: "🤔", keywords: ["thinking", "hmm"] },
      { emoji: "🤫", keywords: ["shushing", "quiet", "secret"] },
      { emoji: "🤭", keywords: ["giggle", "cover mouth"] },
      { emoji: "😏", keywords: ["smirk", "sly"] },
      { emoji: "😌", keywords: ["relieved", "calm", "peace"] },
      { emoji: "😴", keywords: ["sleeping", "zzz", "tired"] },
      { emoji: "🤤", keywords: ["drooling", "want"] },
      { emoji: "😷", keywords: ["mask", "sick", "medical"] },
      { emoji: "🤒", keywords: ["thermometer", "sick", "fever"] },
      { emoji: "🤕", keywords: ["bandage", "hurt"] },
      { emoji: "🤢", keywords: ["nauseated", "sick"] },
      { emoji: "🤮", keywords: ["vomit", "sick"] },
      { emoji: "🥵", keywords: ["hot", "sweating"] },
      { emoji: "🥶", keywords: ["cold", "freezing"] },
      { emoji: "😶", keywords: ["no mouth", "silent"] },
      { emoji: "😐", keywords: ["neutral", "blank"] },
      { emoji: "😑", keywords: ["expressionless", "blank"] },
      { emoji: "😬", keywords: ["grimacing", "awkward"] },
      { emoji: "🙄", keywords: ["eye roll", "bored"] },
      { emoji: "😳", keywords: ["flushed", "embarrassed"] },
      { emoji: "🥺", keywords: ["pleading", "puppy eyes"] },
      { emoji: "😢", keywords: ["crying", "sad", "tear"] },
      { emoji: "😭", keywords: ["sobbing", "crying", "sad"] },
      { emoji: "😤", keywords: ["angry", "frustrated", "steam"] },
      { emoji: "😠", keywords: ["angry", "mad"] },
      { emoji: "😡", keywords: ["furious", "rage"] },
      { emoji: "🤬", keywords: ["swearing", "angry", "curse"] },
      { emoji: "👋", keywords: ["wave", "hello", "hi", "bye"] },
      { emoji: "🤚", keywords: ["raised hand", "stop"] },
      { emoji: "✋", keywords: ["hand", "high five", "stop"] },
      { emoji: "👌", keywords: ["ok", "perfect"] },
      { emoji: "✌️", keywords: ["peace", "victory"] },
      { emoji: "🤞", keywords: ["fingers crossed", "luck"] },
      { emoji: "👍", keywords: ["thumbs up", "like", "good"] },
      { emoji: "👎", keywords: ["thumbs down", "dislike", "bad"] },
      { emoji: "👏", keywords: ["clap", "applause", "bravo"] },
      { emoji: "🙌", keywords: ["raising hands", "celebration"] },
      { emoji: "🤝", keywords: ["handshake", "agreement"] },
      { emoji: "💪", keywords: ["flexed bicep", "strong", "muscle"] },
      { emoji: "🧠", keywords: ["brain", "smart", "think"] },
      { emoji: "👀", keywords: ["eyes", "look", "see"] },
      { emoji: "👁️", keywords: ["eye", "look"] },
      { emoji: "👤", keywords: ["person", "silhouette", "user"] },
      { emoji: "👥", keywords: ["people", "group", "team"] },
      { emoji: "🧑‍💻", keywords: ["technologist", "programmer", "developer"] },
      { emoji: "🧑‍🎓", keywords: ["student", "graduate", "education"] },
      { emoji: "🧑‍🏫", keywords: ["teacher", "instructor"] },
      { emoji: "🧑‍🔬", keywords: ["scientist", "research"] },
      { emoji: "🧑‍🎨", keywords: ["artist", "creative"] },
      { emoji: "🧑‍🚀", keywords: ["astronaut", "space"] },
    ],
  },
  {
    name: "Animals & Nature",
    entries: [
      { emoji: "🐶", keywords: ["dog", "puppy", "pet"] },
      { emoji: "🐱", keywords: ["cat", "kitten", "pet"] },
      { emoji: "🐭", keywords: ["mouse", "rodent"] },
      { emoji: "🐹", keywords: ["hamster", "pet"] },
      { emoji: "🐰", keywords: ["rabbit", "bunny"] },
      { emoji: "🦊", keywords: ["fox", "animal"] },
      { emoji: "🐻", keywords: ["bear", "animal"] },
      { emoji: "🐼", keywords: ["panda", "bear"] },
      { emoji: "🐨", keywords: ["koala", "animal"] },
      { emoji: "🐯", keywords: ["tiger", "animal"] },
      { emoji: "🦁", keywords: ["lion", "animal", "king"] },
      { emoji: "🐮", keywords: ["cow", "animal"] },
      { emoji: "🐷", keywords: ["pig", "animal"] },
      { emoji: "🐸", keywords: ["frog", "animal"] },
      { emoji: "🐵", keywords: ["monkey", "animal"] },
      { emoji: "🐔", keywords: ["chicken", "bird"] },
      { emoji: "🐧", keywords: ["penguin", "bird"] },
      { emoji: "🐦", keywords: ["bird", "animal"] },
      { emoji: "🦅", keywords: ["eagle", "bird"] },
      { emoji: "🦆", keywords: ["duck", "bird"] },
      { emoji: "🦉", keywords: ["owl", "bird", "wisdom"] },
      { emoji: "🦋", keywords: ["butterfly", "insect", "beautiful"] },
      { emoji: "🐝", keywords: ["bee", "honey", "insect"] },
      { emoji: "🐛", keywords: ["bug", "insect"] },
      { emoji: "🐌", keywords: ["snail", "slow"] },
      { emoji: "🐞", keywords: ["ladybug", "insect"] },
      { emoji: "🐢", keywords: ["turtle", "slow", "animal"] },
      { emoji: "🐍", keywords: ["snake", "animal"] },
      { emoji: "🐙", keywords: ["octopus", "sea"] },
      { emoji: "🐠", keywords: ["fish", "sea"] },
      { emoji: "🐬", keywords: ["dolphin", "sea", "smart"] },
      { emoji: "🐳", keywords: ["whale", "sea"] },
      { emoji: "🦈", keywords: ["shark", "sea", "danger"] },
      { emoji: "🦀", keywords: ["crab", "sea"] },
      { emoji: "🐊", keywords: ["crocodile", "alligator"] },
      { emoji: "🦕", keywords: ["dinosaur", "sauropod"] },
      { emoji: "🦖", keywords: ["t-rex", "dinosaur"] },
      { emoji: "🌸", keywords: ["cherry blossom", "flower", "spring"] },
      { emoji: "🌹", keywords: ["rose", "flower", "love"] },
      { emoji: "🌺", keywords: ["hibiscus", "flower"] },
      { emoji: "🌻", keywords: ["sunflower", "flower", "sun"] },
      { emoji: "🌼", keywords: ["blossom", "flower"] },
      { emoji: "🌷", keywords: ["tulip", "flower"] },
      { emoji: "🌿", keywords: ["herb", "plant", "green"] },
      { emoji: "🍀", keywords: ["clover", "luck", "four leaf"] },
      { emoji: "🌴", keywords: ["palm tree", "tropical"] },
      { emoji: "🌳", keywords: ["tree", "nature", "deciduous"] },
      { emoji: "🌲", keywords: ["evergreen", "tree", "pine"] },
      { emoji: "🍁", keywords: ["maple", "leaf", "fall", "autumn"] },
      { emoji: "🍂", keywords: ["fallen leaf", "autumn"] },
      { emoji: "🌾", keywords: ["rice", "harvest", "grain"] },
      { emoji: "🌵", keywords: ["cactus", "desert"] },
      { emoji: "🍄", keywords: ["mushroom", "fungus"] },
      { emoji: "🌙", keywords: ["moon", "night", "crescent"] },
      { emoji: "⭐", keywords: ["star", "favorite", "bookmark"] },
      { emoji: "🌟", keywords: ["glowing star", "sparkle"] },
      { emoji: "✨", keywords: ["sparkles", "magic", "special"] },
      { emoji: "☀️", keywords: ["sun", "sunny", "bright"] },
      { emoji: "🌈", keywords: ["rainbow", "color"] },
      { emoji: "🌊", keywords: ["wave", "ocean", "sea", "water"] },
      { emoji: "❄️", keywords: ["snowflake", "cold", "winter"] },
      { emoji: "🔥", keywords: ["fire", "hot", "lit", "flame"] },
      { emoji: "💧", keywords: ["droplet", "water"] },
      { emoji: "⚡", keywords: ["lightning", "zap", "electric"] },
    ],
  },
  {
    name: "Food & Drink",
    entries: [
      { emoji: "🍎", keywords: ["apple", "red", "fruit"] },
      { emoji: "🍐", keywords: ["pear", "fruit"] },
      { emoji: "🍊", keywords: ["orange", "tangerine", "fruit"] },
      { emoji: "🍋", keywords: ["lemon", "citrus", "fruit"] },
      { emoji: "🍌", keywords: ["banana", "fruit"] },
      { emoji: "🍉", keywords: ["watermelon", "fruit", "summer"] },
      { emoji: "🍇", keywords: ["grapes", "fruit", "wine"] },
      { emoji: "🍓", keywords: ["strawberry", "fruit", "berry"] },
      { emoji: "🫐", keywords: ["blueberry", "fruit", "berry"] },
      { emoji: "🍑", keywords: ["peach", "fruit"] },
      { emoji: "🥑", keywords: ["avocado", "fruit", "guac"] },
      { emoji: "🥕", keywords: ["carrot", "vegetable"] },
      { emoji: "🌽", keywords: ["corn", "vegetable", "maize"] },
      { emoji: "🍕", keywords: ["pizza", "food"] },
      { emoji: "🍔", keywords: ["hamburger", "burger", "food"] },
      { emoji: "🍟", keywords: ["fries", "french fries", "food"] },
      { emoji: "🌮", keywords: ["taco", "food", "mexican"] },
      { emoji: "🌯", keywords: ["burrito", "wrap", "food"] },
      { emoji: "🍜", keywords: ["noodles", "ramen", "food"] },
      { emoji: "🍝", keywords: ["spaghetti", "pasta", "food"] },
      { emoji: "🍣", keywords: ["sushi", "fish", "food", "japanese"] },
      { emoji: "🍰", keywords: ["cake", "dessert", "birthday"] },
      { emoji: "🧁", keywords: ["cupcake", "dessert"] },
      { emoji: "🍩", keywords: ["donut", "doughnut", "dessert"] },
      { emoji: "🍪", keywords: ["cookie", "dessert"] },
      { emoji: "🍫", keywords: ["chocolate", "bar", "dessert"] },
      { emoji: "🍭", keywords: ["lollipop", "candy"] },
      { emoji: "☕", keywords: ["coffee", "hot", "drink"] },
      { emoji: "🍵", keywords: ["tea", "hot", "drink", "matcha"] },
      { emoji: "🧃", keywords: ["juice", "box", "drink"] },
      { emoji: "🥤", keywords: ["cup", "straw", "soda", "drink"] },
      { emoji: "🍷", keywords: ["wine", "glass", "drink"] },
      { emoji: "🍺", keywords: ["beer", "mug", "drink"] },
    ],
  },
  {
    name: "Activities",
    entries: [
      { emoji: "⚽", keywords: ["soccer", "football", "sport"] },
      { emoji: "🏀", keywords: ["basketball", "sport"] },
      { emoji: "🏈", keywords: ["football", "american", "sport"] },
      { emoji: "⚾", keywords: ["baseball", "sport"] },
      { emoji: "🎾", keywords: ["tennis", "sport"] },
      { emoji: "🏐", keywords: ["volleyball", "sport"] },
      { emoji: "🎱", keywords: ["pool", "billiard"] },
      { emoji: "🏓", keywords: ["ping pong", "table tennis"] },
      { emoji: "🎯", keywords: ["target", "dart", "bullseye", "goal"] },
      { emoji: "🎮", keywords: ["video game", "gaming", "controller"] },
      { emoji: "🕹️", keywords: ["joystick", "gaming", "arcade"] },
      { emoji: "🎲", keywords: ["dice", "game", "chance"] },
      { emoji: "🧩", keywords: ["puzzle", "jigsaw", "piece"] },
      { emoji: "🎭", keywords: ["performing arts", "theater", "drama"] },
      { emoji: "🎨", keywords: ["art", "palette", "paint", "creative"] },
      { emoji: "🎬", keywords: ["movie", "film", "clapper"] },
      { emoji: "🎤", keywords: ["microphone", "singing", "karaoke"] },
      { emoji: "🎧", keywords: ["headphones", "music", "listen"] },
      { emoji: "🎵", keywords: ["music", "note", "song"] },
      { emoji: "🎶", keywords: ["music", "notes", "song"] },
      { emoji: "🎸", keywords: ["guitar", "music", "rock"] },
      { emoji: "🎹", keywords: ["piano", "keyboard", "music"] },
      { emoji: "🥁", keywords: ["drum", "music", "beat"] },
      { emoji: "🎪", keywords: ["circus", "tent"] },
      { emoji: "🏆", keywords: ["trophy", "winner", "award", "prize"] },
      { emoji: "🥇", keywords: ["gold medal", "first", "winner"] },
      { emoji: "🥈", keywords: ["silver medal", "second"] },
      { emoji: "🥉", keywords: ["bronze medal", "third"] },
      { emoji: "🏅", keywords: ["medal", "sports", "award"] },
    ],
  },
  {
    name: "Travel & Places",
    entries: [
      { emoji: "🏠", keywords: ["house", "home"] },
      { emoji: "🏡", keywords: ["house", "garden", "home"] },
      { emoji: "🏢", keywords: ["office", "building"] },
      { emoji: "🏫", keywords: ["school", "education", "building"] },
      { emoji: "🏥", keywords: ["hospital", "medical", "health"] },
      { emoji: "🏛️", keywords: ["classical", "building", "government"] },
      { emoji: "⛪", keywords: ["church", "religion", "building"] },
      { emoji: "🕌", keywords: ["mosque", "religion", "building"] },
      { emoji: "🗼", keywords: ["tower", "tokyo", "landmark"] },
      { emoji: "🗽", keywords: ["statue of liberty", "new york"] },
      { emoji: "🗺️", keywords: ["map", "world", "globe"] },
      { emoji: "🌍", keywords: ["globe", "earth", "world", "africa", "europe"] },
      { emoji: "🌎", keywords: ["globe", "earth", "world", "americas"] },
      { emoji: "🌏", keywords: ["globe", "earth", "world", "asia"] },
      { emoji: "✈️", keywords: ["airplane", "travel", "flight"] },
      { emoji: "🚀", keywords: ["rocket", "launch", "space"] },
      { emoji: "🛸", keywords: ["ufo", "flying saucer", "alien"] },
      { emoji: "🚗", keywords: ["car", "drive", "vehicle"] },
      { emoji: "🚕", keywords: ["taxi", "cab", "car"] },
      { emoji: "🚌", keywords: ["bus", "transit", "vehicle"] },
      { emoji: "🚂", keywords: ["train", "locomotive", "rail"] },
      { emoji: "🚢", keywords: ["ship", "boat", "cruise"] },
      { emoji: "🚲", keywords: ["bicycle", "bike", "cycle"] },
      { emoji: "⛵", keywords: ["sailboat", "boat", "sail"] },
      { emoji: "🏔️", keywords: ["mountain", "snow", "peak"] },
      { emoji: "🗻", keywords: ["mount fuji", "mountain"] },
      { emoji: "🏖️", keywords: ["beach", "umbrella", "vacation"] },
      { emoji: "🏕️", keywords: ["camping", "tent", "outdoors"] },
      { emoji: "🎢", keywords: ["roller coaster", "amusement"] },
      { emoji: "🌅", keywords: ["sunrise", "morning"] },
      { emoji: "🌄", keywords: ["sunrise", "mountain"] },
      { emoji: "🌃", keywords: ["night", "city", "stars"] },
    ],
  },
  {
    name: "Objects",
    entries: [
      { emoji: "📝", keywords: ["memo", "note", "write", "pencil"] },
      { emoji: "📒", keywords: ["notebook", "ledger"] },
      { emoji: "📓", keywords: ["notebook"] },
      { emoji: "📔", keywords: ["notebook", "decorative"] },
      { emoji: "📕", keywords: ["book", "closed", "red"] },
      { emoji: "📗", keywords: ["book", "green"] },
      { emoji: "📘", keywords: ["book", "blue"] },
      { emoji: "📙", keywords: ["book", "orange"] },
      { emoji: "📚", keywords: ["books", "library", "study"] },
      { emoji: "📖", keywords: ["book", "open", "read"] },
      { emoji: "📰", keywords: ["newspaper", "news"] },
      { emoji: "📋", keywords: ["clipboard", "list"] },
      { emoji: "📎", keywords: ["paperclip", "attach"] },
      { emoji: "📌", keywords: ["pin", "pushpin", "location"] },
      { emoji: "📍", keywords: ["pin", "location", "marker"] },
      { emoji: "📏", keywords: ["ruler", "straight", "measure"] },
      { emoji: "📐", keywords: ["ruler", "triangular", "math"] },
      { emoji: "✏️", keywords: ["pencil", "write", "edit"] },
      { emoji: "🖊️", keywords: ["pen", "write"] },
      { emoji: "🖋️", keywords: ["fountain pen", "write"] },
      { emoji: "✒️", keywords: ["nib", "pen", "write"] },
      { emoji: "🔍", keywords: ["magnifying glass", "search", "find"] },
      { emoji: "🔎", keywords: ["magnifying glass", "search", "find"] },
      { emoji: "🔒", keywords: ["lock", "security", "private"] },
      { emoji: "🔓", keywords: ["unlock", "open"] },
      { emoji: "🔑", keywords: ["key", "password", "access"] },
      { emoji: "🗝️", keywords: ["old key", "vintage", "secret"] },
      { emoji: "📦", keywords: ["package", "box", "delivery"] },
      { emoji: "🎁", keywords: ["gift", "present", "wrapped"] },
      { emoji: "🛒", keywords: ["shopping cart", "buy"] },
      { emoji: "💼", keywords: ["briefcase", "work", "business"] },
      { emoji: "👓", keywords: ["glasses", "eyeglasses"] },
      { emoji: "🕶️", keywords: ["sunglasses", "cool"] },
      { emoji: "👑", keywords: ["crown", "king", "queen", "royal"] },
      { emoji: "💍", keywords: ["ring", "diamond", "wedding"] },
      { emoji: "💎", keywords: ["gem", "diamond", "jewel"] },
      { emoji: "🧲", keywords: ["magnet", "attract"] },
      { emoji: "🪄", keywords: ["magic wand", "wizard", "magic"] },
      { emoji: "🎈", keywords: ["balloon", "party"] },
      { emoji: "🎉", keywords: ["party", "celebrate", "tada"] },
      { emoji: "🎊", keywords: ["confetti", "celebrate"] },
      { emoji: "🏷️", keywords: ["label", "tag", "price"] },
      { emoji: "🗂️", keywords: ["card index", "dividers", "organize"] },
      { emoji: "📁", keywords: ["folder", "file", "directory"] },
      { emoji: "📂", keywords: ["folder", "open", "file"] },
      { emoji: "🗃️", keywords: ["card file box", "archive"] },
      { emoji: "🗄️", keywords: ["file cabinet", "storage"] },
      { emoji: "📊", keywords: ["chart", "bar", "graph", "data"] },
      { emoji: "📈", keywords: ["chart", "increasing", "growth"] },
      { emoji: "📉", keywords: ["chart", "decreasing", "decline"] },
    ],
  },
  {
    name: "Technology",
    entries: [
      { emoji: "💻", keywords: ["laptop", "computer"] },
      { emoji: "🖥️", keywords: ["desktop", "computer", "monitor"] },
      { emoji: "🖨️", keywords: ["printer", "print"] },
      { emoji: "⌨️", keywords: ["keyboard", "type"] },
      { emoji: "🖱️", keywords: ["mouse", "computer", "click"] },
      { emoji: "📱", keywords: ["phone", "mobile", "smartphone"] },
      { emoji: "📲", keywords: ["phone", "arrow", "call"] },
      { emoji: "📡", keywords: ["satellite", "antenna", "signal"] },
      { emoji: "🔋", keywords: ["battery", "power", "charge"] },
      { emoji: "🔌", keywords: ["plug", "electric", "power"] },
      { emoji: "💾", keywords: ["floppy disk", "save"] },
      { emoji: "💿", keywords: ["cd", "optical disc"] },
      { emoji: "📀", keywords: ["dvd", "disc"] },
      { emoji: "🔬", keywords: ["microscope", "science", "research"] },
      { emoji: "🔭", keywords: ["telescope", "space", "astronomy"] },
      { emoji: "🧪", keywords: ["test tube", "science", "experiment"] },
      { emoji: "🧬", keywords: ["dna", "genetics", "science"] },
      { emoji: "🧮", keywords: ["abacus", "math", "calculator"] },
      { emoji: "🤖", keywords: ["robot", "ai", "technology"] },
      { emoji: "⚙️", keywords: ["gear", "settings", "config"] },
      { emoji: "🔧", keywords: ["wrench", "tool", "fix"] },
      { emoji: "🔨", keywords: ["hammer", "tool", "build"] },
      { emoji: "🛠️", keywords: ["tools", "hammer", "wrench"] },
      { emoji: "⏰", keywords: ["alarm clock", "time", "wake"] },
      { emoji: "⏱️", keywords: ["stopwatch", "timer"] },
      { emoji: "📺", keywords: ["tv", "television", "screen"] },
      { emoji: "📻", keywords: ["radio", "music"] },
      { emoji: "🎙️", keywords: ["microphone", "studio", "podcast"] },
      { emoji: "💡", keywords: ["light bulb", "idea", "tip"] },
      { emoji: "🔦", keywords: ["flashlight", "torch"] },
    ],
  },
  {
    name: "Symbols",
    entries: [
      { emoji: "❤️", keywords: ["heart", "love", "red"] },
      { emoji: "🧡", keywords: ["heart", "orange"] },
      { emoji: "💛", keywords: ["heart", "yellow"] },
      { emoji: "💚", keywords: ["heart", "green"] },
      { emoji: "💙", keywords: ["heart", "blue"] },
      { emoji: "💜", keywords: ["heart", "purple"] },
      { emoji: "🖤", keywords: ["heart", "black"] },
      { emoji: "🤍", keywords: ["heart", "white"] },
      { emoji: "💔", keywords: ["broken heart", "heartbreak"] },
      { emoji: "💯", keywords: ["hundred", "perfect", "score"] },
      { emoji: "💫", keywords: ["dizzy", "star", "sparkle"] },
      { emoji: "💥", keywords: ["boom", "collision", "explosion"] },
      { emoji: "💦", keywords: ["sweat", "droplets", "water"] },
      { emoji: "💨", keywords: ["dash", "wind", "fast"] },
      { emoji: "🕳️", keywords: ["hole", "void"] },
      { emoji: "💬", keywords: ["speech", "bubble", "chat", "comment"] },
      { emoji: "💭", keywords: ["thought", "bubble", "think"] },
      { emoji: "🗯️", keywords: ["anger", "bubble", "mad"] },
      { emoji: "♻️", keywords: ["recycle", "environment", "green"] },
      { emoji: "☮️", keywords: ["peace", "symbol"] },
      { emoji: "☯️", keywords: ["yin yang", "balance"] },
      { emoji: "✅", keywords: ["check", "done", "complete", "yes"] },
      { emoji: "❌", keywords: ["cross", "wrong", "no", "delete"] },
      { emoji: "❓", keywords: ["question", "help", "what"] },
      { emoji: "❗", keywords: ["exclamation", "important", "alert"] },
      { emoji: "‼️", keywords: ["double exclamation", "bangbang"] },
      { emoji: "⚠️", keywords: ["warning", "caution", "alert"] },
      { emoji: "🚫", keywords: ["prohibited", "forbidden", "no"] },
      { emoji: "🔴", keywords: ["red circle", "dot"] },
      { emoji: "🟠", keywords: ["orange circle", "dot"] },
      { emoji: "🟡", keywords: ["yellow circle", "dot"] },
      { emoji: "🟢", keywords: ["green circle", "dot"] },
      { emoji: "🔵", keywords: ["blue circle", "dot"] },
      { emoji: "🟣", keywords: ["purple circle", "dot"] },
      { emoji: "⬛", keywords: ["black square"] },
      { emoji: "⬜", keywords: ["white square"] },
      { emoji: "🔶", keywords: ["orange diamond", "large"] },
      { emoji: "🔷", keywords: ["blue diamond", "large"] },
      { emoji: "▶️", keywords: ["play", "start"] },
      { emoji: "⏸️", keywords: ["pause", "break"] },
      { emoji: "⏹️", keywords: ["stop"] },
      { emoji: "⏭️", keywords: ["next", "skip"] },
      { emoji: "🔀", keywords: ["shuffle", "random"] },
      { emoji: "🔁", keywords: ["repeat", "loop"] },
      { emoji: "➕", keywords: ["plus", "add"] },
      { emoji: "➖", keywords: ["minus", "subtract"] },
      { emoji: "➗", keywords: ["divide", "division"] },
      { emoji: "✖️", keywords: ["multiply", "times"] },
      { emoji: "♾️", keywords: ["infinity", "forever"] },
      { emoji: "🔗", keywords: ["link", "chain", "url"] },
      { emoji: "📧", keywords: ["email", "mail", "envelope"] },
    ],
  },
  {
    name: "Flags & Misc",
    entries: [
      { emoji: "🏁", keywords: ["checkered flag", "race", "finish"] },
      { emoji: "🚩", keywords: ["triangular flag", "red flag"] },
      { emoji: "🎌", keywords: ["crossed flags"] },
      { emoji: "🏴", keywords: ["black flag"] },
      { emoji: "🏳️", keywords: ["white flag", "surrender"] },
      { emoji: "🏳️‍🌈", keywords: ["rainbow flag", "pride", "lgbtq"] },
      { emoji: "🇺🇸", keywords: ["usa", "united states", "america"] },
      { emoji: "🇬🇧", keywords: ["uk", "united kingdom", "britain"] },
      { emoji: "🇫🇷", keywords: ["france", "french"] },
      { emoji: "🇩🇪", keywords: ["germany", "german"] },
      { emoji: "🇯🇵", keywords: ["japan", "japanese"] },
      { emoji: "🇨🇳", keywords: ["china", "chinese"] },
      { emoji: "🇰🇷", keywords: ["korea", "south korea", "korean"] },
      { emoji: "🇮🇳", keywords: ["india", "indian"] },
      { emoji: "🇧🇷", keywords: ["brazil", "brazilian"] },
      { emoji: "🇲🇽", keywords: ["mexico", "mexican"] },
      { emoji: "🇨🇦", keywords: ["canada", "canadian"] },
      { emoji: "🇦🇺", keywords: ["australia", "australian"] },
      { emoji: "🇮🇹", keywords: ["italy", "italian"] },
      { emoji: "🇪🇸", keywords: ["spain", "spanish"] },
    ],
  },
]

function getRecentEmojis(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem("recentEmojis") || "[]")
  } catch {
    return []
  }
}

function addRecentEmoji(emoji: string) {
  const recent = getRecentEmojis().filter((e) => e !== emoji)
  recent.unshift(emoji)
  localStorage.setItem("recentEmojis", JSON.stringify(recent.slice(0, 24)))
}

interface IconPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string | null) => void
  currentIcon: string | null
}

export function IconPicker({ isOpen, onClose, onSelect, currentIcon }: IconPickerProps) {
  const [search, setSearch] = useState("")
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setRecentEmojis(getRecentEmojis())
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen, onClose])

  const filteredCategories = useMemo(() => {
    if (!search) {
      const result: { name: string; emojis: string[] }[] = []
      if (recentEmojis.length > 0) {
        result.push({ name: "Recent", emojis: recentEmojis })
      }
      for (const cat of EMOJI_DATA) {
        result.push({ name: cat.name, emojis: cat.entries.map((e) => e.emoji) })
      }
      return result
    }
    const q = search.toLowerCase()
    const allMatches: string[] = []
    for (const cat of EMOJI_DATA) {
      for (const entry of cat.entries) {
        if (entry.keywords.some((kw) => kw.includes(q)) || entry.emoji.includes(q)) {
          allMatches.push(entry.emoji)
        }
      }
    }
    if (allMatches.length === 0) return []
    return [{ name: "Results", emojis: allMatches }]
  }, [search, recentEmojis])

  const handleSelect = (emoji: string) => {
    addRecentEmoji(emoji)
    onSelect(emoji)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-2 w-80 rounded-lg border z-50"
      style={{
        background: "var(--popover)",
        borderColor: "var(--border)",
        boxShadow:
          "rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 3px 6px, rgba(15,15,15,0.2) 0 9px 24px",
      }}
    >
      <div className="p-2 border-b" style={{ borderColor: "var(--border)" }}>
        <input
          type="text"
          placeholder="Search emoji…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-7 rounded bg-transparent px-2 text-sm outline-none"
          style={{ background: "var(--muted)" }}
          autoFocus
        />
      </div>

      <div className="max-h-64 overflow-y-auto p-2">
        {filteredCategories.length === 0 ? (
          <div className="py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            No emoji found
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.name} className="mb-2">
              <div
                className="text-[10px] font-semibold uppercase tracking-wider mb-1 px-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                {category.name}
              </div>
              <div className="grid grid-cols-9 gap-0.5">
                {category.emojis.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    onClick={() => handleSelect(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {currentIcon && (
        <div className="border-t p-2" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => {
              onSelect(null)
              onClose()
            }}
            className="w-full text-center text-xs py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--destructive)" }}
          >
            Remove icon
          </button>
        </div>
      )}
    </div>
  )
}
