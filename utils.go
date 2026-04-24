package main

import (
	"crypto/rand"
	"html"
	"net"
	"net/http"
	"regexp"
	"strings"
)

var WORD_LIST = []string{
	// 3-letter words
	"ACE", "AGE", "AXE", "BAG", "BAR", "BAT", "BAY", "BED", "BEE", "BEG",
	"BET", "BUD", "BUN", "BUS", "CAB", "CAN", "CAP", "CAR", "CAT", "CUB",
	"CUP", "CUT", "DAM", "DAY", "DEN", "DEW", "DRY", "DUN", "EAR", "EEL",
	"EGG", "ELK", "ELM", "EWE", "FAD", "FAR", "FAT", "FAX", "FED", "FEW",
	"FLY", "FUN", "FUR", "GAP", "GAS", "GEL", "GEM", "GUN", "GUT", "GUY",
	"GYM", "HAM", "HAT", "HAY", "HEN", "HEW", "HUB", "HUG", "HUM", "JAB",
	"JAM", "JAR", "JAW", "JAY", "JET", "JUG", "KEG", "KEY", "LAB", "LAD",
	"LAP", "LAW", "LAX", "LAY", "LEG", "LET", "LUG", "MAD", "MAP", "MAR",
	"MAT", "MAY", "MUD", "MUG", "NAB", "NAG", "NAP", "NAY", "NET", "NEW",
	"NUB", "NUN", "NUT", "PAD", "PAN", "PAR", "PAT", "PAW", "PAY", "PEA",
	"PEG", "PEN", "PEP", "PET", "PEW", "PUN", "PUP", "PUT", "RAG", "RAM",
	"RAN", "RAP", "RAT", "RAW", "RAY", "RED", "RUB", "RUG", "RUM", "RUN",
	"RUT", "SAD", "SAP", "SAT", "SAW", "SAY", "SEA", "SET", "SEW", "SKY",
	"SLY", "SPY", "SUB", "SUM", "SUN", "TAB", "TAD", "TAN", "TAP", "TAR",
	"TAX", "TEA", "TEN", "TUB", "TUG", "URN", "VAN", "VAT", "VET", "VEX",
	"WAD", "WAR", "WAX", "WAY", "WEB", "WED", "WET", "WRY", "YAK", "YAM",
	"YAP", "YEA", "YEW", "ZAP", "ZEN",
	// 4-letter words
	"ABLE", "ARCH", "ARMY", "AUNT", "BACK", "BALL", "BAND", "BANK", "BARN", "BASE",
	"BATH", "BEAR", "BEAT", "BECK", "BELL", "BELT", "BEST", "BLEW", "BLUE", "BLUR",
	"BULK", "BURN", "BUSY", "CALM", "CAME", "CAMP", "CANE", "CARD", "CARE", "CASE",
	"CASH", "CAST", "CAVE", "CLAM", "CLAP", "CLAW", "CLAY", "CLUE", "CLUB", "CREW",
	"CURE", "CUTE", "DARK", "DATA", "DATE", "DAWN", "DAYS", "DEAD", "DEAF", "DEAL",
	"DEAR", "DEBT", "DEED", "DEEP", "DEER", "DELL", "DENY", "DESK", "DRAW", "DRUM",
	"DUAL", "DUNE", "DUSK", "DUST", "DUTY", "EACH", "EARN", "EASE", "EAST", "EDGE",
	"ELSE", "EVEN", "EVER", "EXAM", "FACE", "FACT", "FALL", "FAME", "FARM", "FAST",
	"FATE", "FEEL", "FEET", "FELL", "FELT", "FERN", "FLAT", "FLAW", "FLAX", "FLEX",
	"FLEW", "FUND", "FUSE", "GALE", "GAME", "GANG", "GAZE", "GEAR", "GENE", "GLAD",
	"GLUE", "GRAB", "GRAM", "GRAY", "GREW", "GULF", "GUST", "HALF", "HALL", "HALT",
	"HAND", "HANG", "HARD", "HARM", "HARP", "HAVE", "HAWK", "HAZE", "HEAD", "HEAL",
	"HEAP", "HEAT", "HEEL", "HELM", "HELP", "HERB", "HERE", "HULL", "HUNT", "HURT",
	"HUSK", "JADE", "JAZZ", "JUMP", "JUST", "KEEN", "KEEP", "KNEW", "LACE", "LACK",
	"LAKE", "LAMP", "LAND", "LANE", "LARK", "LASH", "LAST", "LATE", "LAVA", "LAWN",
	"LEAD", "LEAF", "LEAK", "LEAN", "LEAP", "LEND", "LENS", "LUCK", "LURE", "LUSH",
	"MACE", "MALL", "MALT", "MARE", "MARK", "MART", "MAST", "MAZE", "MEAL", "MEAN",
	"MEAT", "MEET", "MELT", "MEND", "MENU", "MESH", "MUCH", "MULE", "MURK", "MUSE",
	"NAME", "NECK", "NEED", "NEST", "NEXT", "NULL", "PACE", "PACK", "PAGE", "PALE",
	"PALM", "PARK", "PART", "PAST", "PATH", "PEAK", "PEAR", "PEAT", "PEEL", "PEER",
	"PLAN", "PLUM", "PLUS", "PREY", "PULL", "PUMP", "PURE", "PUSH", "RACE", "RACK",
	"RAMP", "RANK", "RASP", "READ", "REAL", "REED", "REEF", "REEL", "RELY", "REST",
	"RUBY", "RULE", "RUSH", "RUST", "SAFE", "SAGE", "SALT", "SAND", "SCAR", "SEAL",
	"SEAM", "SEEN", "SELF", "SELL", "SHED", "SHUT", "SLAB", "SLAP", "SLEW", "SLUM",
	"SNAP", "SPAN", "SPAR", "SPUR", "STAR", "STAY", "STEM", "STEP", "STUB", "SUCH",
	"SULK", "SURF", "SWAN", "SWAP", "TALE", "TALL", "TANK", "TARP", "TASK", "TEAL",
	"TEAR", "TELL", "TERM", "TEXT", "THAN", "THAT", "THEM", "THEN", "THEY", "TRAP",
	"TRAY", "TREE", "TREK", "TRUE", "TUBE", "TUNE", "TURF", "TURN", "TUSK", "TYPE",
	"VALE", "VANE", "VAST", "VENT", "VEST", "WADE", "WAKE", "WALK", "WALL", "WARD",
	"WARM", "WARP", "WART", "WAVE", "WEAK", "WELD", "WELL", "WEST", "WHEY", "WREN",
	"YANK", "YEAR", "YELL", "ZEAL", "ZEST",
	// 5-letter words
	"BEACH", "BEARD", "BEAST", "BLACK", "BLADE", "BLAME", "BLAND", "BLANK", "BLAST", "BLAZE",
	"BLEAK", "BLEED", "BLEND", "BLESS", "BLUFF", "BLUNT", "BLUSH", "BRAND", "BRAVE", "BRAWL",
	"BRAWN", "BREAD", "BREAK", "BREAM", "BREED", "BRUSH", "BRUTE", "BULGE", "BUNCH", "BURST",
	"CAMEL", "CANDY", "CARRY", "CEDAR", "CHALK", "CHAMP", "CHANT", "CHASE", "CHEEK", "CHEER",
	"CHESS", "CHEST", "CHURN", "CLAMP", "CLANG", "CLANK", "CLEAT", "CLERK", "CLUNG", "CRAFT",
	"CRANE", "CREAK", "CREAM", "CREEK", "CREEP", "CREPT", "CREST", "CRUMB", "CRUSH", "CRUST",
	"DELTA", "DENSE", "DEPTH", "DRAFT", "DRAMA", "DRAPE", "DRANK", "DRAWL", "DREAD", "DREAM",
	"DRESS", "DWELL", "DWELT", "EAGLE", "EARLY", "EARTH", "ERASE", "EXACT", "EXTRA", "EXULT",
	"FABLE", "FATAL", "FAULT", "FEAST", "FENCE", "FERRY", "FETCH", "FEVER", "FEWER", "FLAME",
	"FLANK", "FLASK", "FLASH", "FLEET", "FLESH", "FLUNG", "FLUTE", "FLYER", "FREAK", "FRESH",
	"FUDGE", "FULLY", "GAUNT", "GAVEL", "GLAND", "GLARE", "GLASS", "GLEAM", "GLEAN", "GNASH",
	"GRAFT", "GRAND", "GRANT", "GRASP", "GRASS", "GRAZE", "GREET", "GRUFF", "GRUEL", "GRUNT",
	"GUARD", "GUESS", "GUEST", "GULCH", "HARSH", "HASTE", "HAVEN", "HAZEL", "HEARD", "HEART",
	"HEAVE", "HEAVY", "HEDGE", "HENCE", "HUMAN", "HYDRA", "KAYAK", "KNACK", "KNEEL", "LANCE",
	"LARGE", "LASER", "LATCH", "LATER", "LAUGH", "LAYER", "LEARN", "LEASH", "LEDGE", "LUCKY",
	"LUNAR", "LUNGE", "LUSTY", "MAKER", "MAPLE", "MARCH", "MARSH", "MATCH", "MEDAL", "MERRY",
	"METAL", "METER", "NAMED", "NERVE", "NEVER", "PATCH", "PAUSE", "PEACE", "PEACH", "PEDAL",
	"PERCH", "PHASE", "PLANK", "PLANT", "PLATE", "PLAZA", "PLEAD", "PLEAT", "PLUCK", "PLUMB",
	"PLUME", "PLUNK", "PLUSH", "PRANK", "PRESS", "PRUNE", "PSALM", "PUMPS", "PURSE", "PYGMY",
	"QUART", "QUASH", "QUEEN", "QUELL", "QUERY", "QUEST", "QUEUE", "RANCH", "REACH", "REACT",
	"REALM", "REBUT", "RELAX", "REPAY", "REPEL", "RESET", "REUSE", "REVEL", "RUGBY", "RULED",
	"RUPEE", "RURAL", "RUSTY", "SADLY", "SAUCE", "SCALD", "SCALE", "SCALP", "SCALY", "SCAMP",
	"SCANT", "SCARE", "SCARY", "SCENE", "SCENT", "SCRUB", "SEEDY", "SERVE", "SETUP", "SEVEN",
	"SHADE", "SHADY", "SHAKE", "SHALL", "SHALE", "SHAME", "SHAPE", "SHARE", "SHARK", "SHARP",
	"SHAVE", "SHAWL", "SHEAR", "SHEEN", "SHELF", "SHELL", "SHRUG", "SHUNT", "SKATE", "SKULL",
	"SKUNK", "SLACK", "SLANT", "SLAVE", "SLEEK", "SLEET", "SLEPT", "SLURP", "SMACK", "SMALL",
	"SMASH", "SMELL", "SMELT", "SNACK", "SNARE", "SNARL", "SNEAK", "SNEER", "SNUCK", "SNUFF",
	"SPARE", "SPARK", "SPASM", "SPAWN", "SPEAK", "SPEAR", "SPELL", "SPELT", "SPEND", "SPENT",
	"SPUNK", "SQUAD", "SQUAT", "STACK", "STAFF", "STAGE", "STALE", "STALL", "STAMP", "STAND",
	"STARE", "STARK", "START", "STEAL", "STEEL", "STEEP", "STEER", "STERN", "STUNG", "STUNK",
	"STUNT", "STYLE", "SUPER", "SURGE", "SWAMP", "SWATH", "SWEAR", "SWEAT", "SWEEP", "SWEET",
	"SWELL", "SWUNG", "TAMED", "TEACH", "TENSE", "TENTH", "TERMS", "THANK", "THEME", "THERE",
	"THESE", "TRACE", "TRACK", "TRADE", "TRAMP", "TRASH", "TRAWL", "TREAD", "TREAT", "TREND",
	"TRUCE", "TRUCK", "TRULY", "TRUMP", "TRUNK", "TRUSS", "TRUST", "ULCER", "ULTRA", "UNDER",
	"UNDUE", "UNSET", "UPSET", "URBAN", "USAGE", "USHER", "USURP", "VAGUE", "VALUE", "VAULT",
	"VEGAN", "VENUE", "VERSE", "VERGE", "VERVE", "VEXED", "WAGER", "WAKEN", "WATER", "WEARY",
	"WEDGE", "WEEDY", "WELCH", "WHALE", "WHACK", "WHEAT", "WHEEL", "WHELP", "WHERE", "ZAPPY", "ZEBRA",
}

// ValidateNoteID checks if a note ID is valid
func ValidateNoteID(noteID string) bool {
	if noteID == "" || len(noteID) > 32 {
		return false
	}
	matched, _ := regexp.MatchString("^[A-HJ-NP-Z2-9]{3,32}$", noteID)
	return matched
}

// GenerateNoteID creates a random note ID
func GenerateNoteID() string {
	wordBytes := make([]byte, 1)
	_, _ = rand.Read(wordBytes)
	word := WORD_LIST[int(wordBytes[0])%len(WORD_LIST)]

	digitCharset := "23456789"
	digitBytes := make([]byte, 2)
	_, _ = rand.Read(digitBytes)

	d1 := digitCharset[int(digitBytes[0])%len(digitCharset)]
	d2 := digitCharset[int(digitBytes[1])%len(digitCharset)]

	return word + string(d1) + string(d2)
}

// EscapeHTML escapes HTML special characters
func EscapeHTML(s string) string {
	return html.EscapeString(s)
}

// ClientIP attempts to determine the real client IP when running behind proxies.
// Preference order:
// - Forwarded: for=...
// - X-Forwarded-For: first IP in list
// - X-Real-IP
// - r.RemoteAddr
func ClientIP(r *http.Request) string {
	if r == nil {
		return ""
	}

	if fwd := r.Header.Get("Forwarded"); fwd != "" {
		// Example: Forwarded: for=203.0.113.60;proto=https;by=203.0.113.43
		parts := strings.Split(fwd, ";")
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if strings.HasPrefix(strings.ToLower(p), "for=") {
				v := strings.TrimSpace(p[4:])
				v = strings.Trim(v, "\"")
				// Could be: ip, [ip]:port, ip:port
				v = strings.TrimPrefix(v, "[")
				v = strings.TrimSuffix(v, "]")
				if host, _, err := net.SplitHostPort(v); err == nil {
					return host
				}
				// Might be just an IP without port
				if ip := net.ParseIP(v); ip != nil {
					return v
				}
				return v
			}
		}
	}

	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// First IP is the original client.
		first := strings.TrimSpace(strings.Split(xff, ",")[0])
		first = strings.Trim(first, "\"")
		first = strings.TrimPrefix(first, "[")
		first = strings.TrimSuffix(first, "]")
		if host, _, err := net.SplitHostPort(first); err == nil {
			return host
		}
		return first
	}

	if xrip := strings.TrimSpace(r.Header.Get("X-Real-IP")); xrip != "" {
		if host, _, err := net.SplitHostPort(xrip); err == nil {
			return host
		}
		return xrip
	}

	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		return host
	}
	return r.RemoteAddr
}
