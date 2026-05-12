Hog Exe Matchup Codex — Card Icons
===================================

By default the codex pulls icons from the RoyaleAPI CDN:
  https://cdn.royaleapi.com/static/img/cards-150/<slug>.png

To go local instead:
  1. Drop PNGs in this folder named exactly <slug>.png (lowercase, hyphenated).
  2. In extra/codex.js change the top constant:
       const CARD_BASE = 'https://cdn.royaleapi.com/static/img/cards-150';
     to:
       const CARD_BASE = './cards';
     (or '../cards' depending on where the HTML lives)

Slugs currently referenced (download these PNGs):
-------------------------------------------------
Player deck (Hog Exe):
  hog-rider.png
  executioner.png
  valkyrie.png
  goblins.png
  ice-spirit.png
  the-log.png
  tornado.png
  rocket.png

Opponent cards across the 24 matchups:
  archers.png
  archer-queen.png
  baby-dragon.png
  balloon.png
  bandit.png
  barbarian-barrel.png
  battle-ram.png
  bomb-tower.png
  bowler.png
  bush.png
  cannon.png
  cannon-cart.png
  dark-goblin.png
  dart-goblin.png
  demolisher.png            (alt slug: goblin-demolisher — verify on royaleapi)
  drill.png                 (alt slug: goblin-drill)
  electro-giant.png
  electro-spirit.png
  electro-wizard.png
  elite-barbarians.png
  elixir-collector.png
  fireball.png
  fisherman.png
  flying-machine.png
  freeze.png
  furnace.png
  ghost.png                 (alt slug: royal-ghost — used in code)
  giant.png
  giant-skeleton.png
  giant-snowball.png
  goblin-barrel.png
  goblin-cage.png
  goblin-curse.png
  goblin-demolisher.png
  goblinstein.png
  golem.png
  golden-knight.png
  heal-spirit.png
  hog-rider.png
  hunter.png
  iceberg.png
  ice-golem.png
  ice-wizard.png
  inferno-dragon.png
  knight.png
  lava-hound.png
  lightning.png
  lumberjack.png
  magic-archer.png
  mega-minion.png
  mighty-miner.png
  miner.png
  mini-pekka.png
  minions.png
  monk.png
  mortar.png
  mother-witch.png
  musketeer.png
  pekka.png
  poison.png
  prince.png
  dark-prince.png
  rascals.png
  rocket.png
  royal-delivery.png
  royal-ghost.png
  royal-giant.png
  royal-hogs.png
  royal-recruits.png
  skeletons.png
  skeleton-barrel.png
  tesla.png
  three-musketeers.png
  tombstone.png
  tornado.png
  valkyrie.png
  wall-breakers.png
  wizard.png
  x-bow.png                 (alt slug: xbow — verify on royaleapi)
  zap.png
  zappies.png

If any image 404s the chip stays — only the icon dims (handled by onerror).
If a slug is wrong, fix it in extra/codex.js (search for the bad slug in the
deck arrays). Display name is auto-derived from the slug.
