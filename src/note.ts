// Validation: uppercase letters (no I or O) and digits (no 1 or 0), 3–32 chars
// Generation: WORDnn format e.g. "BLAST47" (word from list + 2 digits 2-9)
const NOTE_ID_PATTERN = /^[A-HJ-NP-Z2-9]{3,32}$/;
const NOTE_MAX_ID_LENGTH = 32;
const NOTE_ID_DIGIT_CHARSET = "23456789"; // 8 digits, avoids ambiguous 0 and 1

// Common, easy-to-spell English words — uppercase, 3–5 letters, no letter I or O
const WORD_LIST = [
  // 3-letter words
  "ACE","AGE","AXE","BAG","BAR","BAT","BAY","BED","BEE","BEG",
  "BET","BUD","BUN","BUS","CAB","CAN","CAP","CAR","CAT","CUB",
  "CUP","CUT","DAM","DAY","DEN","DEW","DRY","DUN","EAR","EEL",
  "EGG","ELK","ELM","EWE","FAD","FAR","FAT","FAX","FED","FEW",
  "FLY","FUN","FUR","GAP","GAS","GEL","GEM","GUN","GUT","GUY",
  "GYM","HAM","HAT","HAY","HEN","HEW","HUB","HUG","HUM","JAB",
  "JAM","JAR","JAW","JAY","JET","JUG","KEG","KEY","LAB","LAD",
  "LAP","LAW","LAX","LAY","LEG","LET","LUG","MAD","MAP","MAR",
  "MAT","MAY","MUD","MUG","NAB","NAG","NAP","NAY","NET","NEW",
  "NUB","NUN","NUT","PAD","PAN","PAR","PAT","PAW","PAY","PEA",
  "PEG","PEN","PEP","PET","PEW","PUN","PUP","PUT","RAG","RAM",
  "RAN","RAP","RAT","RAW","RAY","RED","RUB","RUG","RUM","RUN",
  "RUT","SAD","SAP","SAT","SAW","SAY","SEA","SET","SEW","SKY",
  "SLY","SPY","SUB","SUM","SUN","TAB","TAD","TAN","TAP","TAR",
  "TAX","TEA","TEN","TUB","TUG","URN","VAN","VAT","VET","VEX",
  "WAD","WAR","WAX","WAY","WEB","WED","WET","WRY","YAK","YAM",
  "YAP","YEA","YEW","ZAP","ZEN",
  // 4-letter words
  "ABLE","ARCH","ARMY","AUNT","BACK","BALL","BAND","BANK","BARN","BASE",
  "BATH","BEAR","BEAT","BECK","BELL","BELT","BEST","BLEW","BLUE","BLUR",
  "BULK","BURN","BUSY","CALM","CAME","CAMP","CANE","CARD","CARE","CASE",
  "CASH","CAST","CAVE","CLAM","CLAP","CLAW","CLAY","CLUE","CLUB","CREW",
  "CURE","CUTE","DARK","DATA","DATE","DAWN","DAYS","DEAD","DEAF","DEAL",
  "DEAR","DEBT","DEED","DEEP","DEER","DELL","DENY","DESK","DRAW","DRUM",
  "DUAL","DUNE","DUSK","DUST","DUTY","EACH","EARN","EASE","EAST","EDGE",
  "ELSE","EVEN","EVER","EXAM","FACE","FACT","FALL","FAME","FARM","FAST",
  "FATE","FEEL","FEET","FELL","FELT","FERN","FLAT","FLAW","FLAX","FLEX",
  "FLEW","FUND","FUSE","GALE","GAME","GANG","GAZE","GEAR","GENE","GLAD",
  "GLUE","GRAB","GRAM","GRAY","GREW","GULF","GUST","HALF","HALL","HALT",
  "HAND","HANG","HARD","HARM","HARP","HAVE","HAWK","HAZE","HEAD","HEAL",
  "HEAP","HEAT","HEEL","HELM","HELP","HERB","HERE","HULL","HUNT","HURT",
  "HUSK","JADE","JAZZ","JUMP","JUST","KEEN","KEEP","KNEW","LACE","LACK",
  "LAKE","LAMP","LAND","LANE","LARK","LASH","LAST","LATE","LAVA","LAWN",
  "LEAD","LEAF","LEAK","LEAN","LEAP","LEND","LENS","LUCK","LURE","LUSH",
  "MACE","MALL","MALT","MARE","MARK","MART","MAST","MAZE","MEAL","MEAN",
  "MEAT","MEET","MELT","MEND","MENU","MESH","MUCH","MULE","MURK","MUSE",
  "NAME","NECK","NEED","NEST","NEXT","NULL","PACE","PACK","PAGE","PALE",
  "PALM","PARK","PART","PAST","PATH","PEAK","PEAR","PEAT","PEEL","PEER",
  "PLAN","PLUM","PLUS","PREY","PULL","PUMP","PURE","PUSH","RACE","RACK",
  "RAMP","RANK","RASP","READ","REAL","REED","REEF","REEL","RELY","REST",
  "RUBY","RULE","RUSH","RUST","SAFE","SAGE","SALT","SAND","SCAR","SEAL",
  "SEAM","SEEN","SELF","SELL","SHED","SHUT","SLAB","SLAP","SLEW","SLUM",
  "SNAP","SPAN","SPAR","SPUR","STAR","STAY","STEM","STEP","STUB","SUCH",
  "SULK","SURF","SWAN","SWAP","TALE","TALL","TANK","TARP","TASK","TEAL",
  "TEAR","TELL","TERM","TEXT","THAN","THAT","THEM","THEN","THEY","TRAP",
  "TRAY","TREE","TREK","TRUE","TUBE","TUNE","TURF","TURN","TUSK","TYPE",
  "VALE","VANE","VAST","VENT","VEST","WADE","WAKE","WALK","WALL","WARD",
  "WARM","WARP","WART","WAVE","WEAK","WELD","WELL","WEST","WHEY","WREN",
  "YANK","YEAR","YELL","ZEAL","ZEST",
  // 5-letter words
  "BEACH","BEARD","BEAST","BLACK","BLADE","BLAME","BLAND","BLANK","BLAST","BLAZE",
  "BLEAK","BLEED","BLEND","BLESS","BLUFF","BLUNT","BLUSH","BRAND","BRAVE","BRAWL",
  "BRAWN","BREAD","BREAK","BREAM","BREED","BRUSH","BRUTE","BULGE","BUNCH","BURST",
  "CAMEL","CANDY","CARRY","CEDAR","CHALK","CHAMP","CHANT","CHASE","CHEEK","CHEER",
  "CHESS","CHEST","CHURN","CLAMP","CLANG","CLANK","CLEAT","CLERK","CLUNG","CRAFT",
  "CRANE","CREAK","CREAM","CREEK","CREEP","CREPT","CREST","CRUMB","CRUSH","CRUST",
  "DELTA","DENSE","DEPTH","DRAFT","DRAMA","DRAPE","DRANK","DRAWL","DREAD","DREAM",
  "DRESS","DWELL","DWELT","EAGLE","EARLY","EARTH","ERASE","EXACT","EXTRA","EXULT",
  "FABLE","FATAL","FAULT","FEAST","FENCE","FERRY","FETCH","FEVER","FEWER","FLAME",
  "FLANK","FLASK","FLASH","FLEET","FLESH","FLUNG","FLUTE","FLYER","FREAK","FRESH",
  "FUDGE","FULLY","GAUNT","GAVEL","GLAND","GLARE","GLASS","GLEAM","GLEAN","GNASH",
  "GRAFT","GRAND","GRANT","GRASP","GRASS","GRAZE","GREET","GRUFF","GRUEL","GRUNT",
  "GUARD","GUESS","GUEST","GULCH","HARSH","HASTE","HAVEN","HAZEL","HEARD","HEART",
  "HEAVE","HEAVY","HEDGE","HENCE","HUMAN","HYDRA","KAYAK","KNACK","KNEEL","LANCE",
  "LARGE","LASER","LATCH","LATER","LAUGH","LAYER","LEARN","LEASH","LEDGE","LUCKY",
  "LUNAR","LUNGE","LUSTY","MAKER","MAPLE","MARCH","MARSH","MATCH","MEDAL","MERRY",
  "METAL","METER","NAMED","NERVE","NEVER","PATCH","PAUSE","PEACE","PEACH","PEDAL",
  "PERCH","PHASE","PLANK","PLANT","PLATE","PLAZA","PLEAD","PLEAT","PLUCK","PLUMB",
  "PLUME","PLUNK","PLUSH","PRANK","PRESS","PRUNE","PSALM","PUMPS","PURSE","PYGMY",
  "QUART","QUASH","QUEEN","QUELL","QUERY","QUEST","QUEUE","RANCH","REACH","REACT",
  "REALM","REBUT","RELAX","REPAY","REPEL","RESET","REUSE","REVEL","RUGBY","RULED",
  "RUPEE","RURAL","RUSTY","SADLY","SAUCE","SCALD","SCALE","SCALP","SCALY","SCAMP",
  "SCANT","SCARE","SCARY","SCENE","SCENT","SCRUB","SEEDY","SERVE","SETUP","SEVEN",
  "SHADE","SHADY","SHAKE","SHALL","SHALE","SHAME","SHAPE","SHARE","SHARK","SHARP",
  "SHAVE","SHAWL","SHEAR","SHEEN","SHELF","SHELL","SHRUG","SHUNT","SKATE","SKULL",
  "SKUNK","SLACK","SLANT","SLAVE","SLEEK","SLEET","SLEPT","SLURP","SMACK","SMALL",
  "SMASH","SMELL","SMELT","SNACK","SNARE","SNARL","SNEAK","SNEER","SNUCK","SNUFF",
  "SPARE","SPARK","SPASM","SPAWN","SPEAK","SPEAR","SPELL","SPELT","SPEND","SPENT",
  "SPUNK","SQUAD","SQUAT","STACK","STAFF","STAGE","STALE","STALL","STAMP","STAND",
  "STARE","STARK","START","STEAL","STEEL","STEEP","STEER","STERN","STUNG","STUNK",
  "STUNT","STYLE","SUPER","SURGE","SWAMP","SWATH","SWEAR","SWEAT","SWEEP","SWEET",
  "SWELL","SWUNG","TAMED","TEACH","TENSE","TENTH","TERMS","THANK","THEME","THERE",
  "THESE","TRACE","TRACK","TRADE","TRAMP","TRASH","TRAWL","TREAD","TREAT","TREND",
  "TRUCE","TRUCK","TRULY","TRUMP","TRUNK","TRUSS","TRUST","ULCER","ULTRA","UNDER",
  "UNDUE","UNSET","UPSET","URBAN","USAGE","USHER","USURP","VAGUE","VALUE","VAULT",
  "VEGAN","VENUE","VERSE","VERGE","VERVE","VEXED","WAGER","WAKEN","WATER","WEARY",
  "WEDGE","WEEDY","WELCH","WHALE","WHACK","WHEAT","WHEEL","WHELP","WHERE","ZAPPY","ZEBRA",
];

export function validateNoteId(noteId: string): boolean {
  return noteId.length > 0 && noteId.length <= NOTE_MAX_ID_LENGTH && NOTE_ID_PATTERN.test(noteId);
}

export function generateNoteId(): string {
  const wordBytes = new Uint8Array(1);
  crypto.getRandomValues(wordBytes);
  const word = WORD_LIST[wordBytes[0] % WORD_LIST.length];

  const digitBytes = new Uint8Array(2);
  crypto.getRandomValues(digitBytes);
  const d1 = NOTE_ID_DIGIT_CHARSET[digitBytes[0] % NOTE_ID_DIGIT_CHARSET.length];
  const d2 = NOTE_ID_DIGIT_CHARSET[digitBytes[1] % NOTE_ID_DIGIT_CHARSET.length];

  return `${word}${d1}${d2}`;
}

export function escapeHTML(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&#34;")
    .replaceAll("'", "&#39;");
}

export function extractPathNoteId(pathname: string): string {
  const match = pathname.match(/(?:^|\/)noteid\/([^/]+)\/?$/);
  return match ? match[1] : "";
}

export function isCurlRequest(request: Request): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  return userAgent.toLowerCase().includes("curl");
}

export function getBasePath(pathname: string): string {
  const idx = pathname.indexOf("/noteid/");
  const base = idx === -1 ? pathname : pathname.slice(0, idx);
  return base.endsWith("/") ? base : `${base}/`;
}
