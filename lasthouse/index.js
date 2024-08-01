/// <reference types="../CTAutocomplete" />

let prefix = '&d>'

const removeRanks = (playername) => playername.replace(/\[(.*)\] ?/g, '');
const getTabFooter = (formatted) => formatted ? TabList.getFooterMessage().getFormattedText() : TabList.getFooterMessage().getUnformattedText();
const inHousing = () => /HOUSING/.test(Scoreboard.getTitle()) && /You are in (.*), by (.*)/ .test(getTabFooter(false))
const hasPlayerName = (text) => new RegExp(Player.getName()).test(text);

function getHouseInfo(formatted=false) {
  // house and player name index 1 2
  let footer = getTabFooter(formatted).split('\n')
    .filter(foot => /You are in (.*), by (.*)/.test(foot))
    .join('')
    .match(/You are in (.*), by (.*)/);
  // housing has weird ascii characters in the scoreboard :P
  let serverID = Scoreboard.getLineByIndex(Scoreboard.getLines().length-1).toString().removeFormatting().replace(/[^\x00-\x7F]/g, '').match(/ m\d+?\w+? /i).join('').replace(/\s/g, '');

  return { name: footer[1], owner: formatted ? footer[2] : removeRanks(footer[2]), id: serverID };
}

import Promise from "../PromiseV2";

let current_house = null;
let last_houses = [];

register('worldLoad', () => {
  new Promise((resolve, reject) => {
    const loop = () => {
      if (TabList.getFooterMessage()?.getUnformattedText() && Scoreboard.getTitle()) return resolve();

      setTimeout(() => loop(), 200);
    }
    loop();
  }).then(() => {
    if (inHousing()) current_house = getHouseInfo(true);
  })
});

register('worldUnload', () => last_houses[0] !== current_house ? last_houses.unshift(current_house) : "");

register('command', () => {
  if (last_houses.length <= 0) return ChatLib.chat(`${prefix} &cno last house to visit!`);
  hasPlayerName(last_houses[0].owner.removeFormatting())
  ? ChatLib.command(`home ${last_houses[0].name.removeFormatting()}`, false)
  : ChatLib.command(`visit ${removeRanks(last_houses[0].owner.removeFormatting())} ${last_houses[0].name.removeFormatting()}`, false)
}).setName('lasthouse').setAliases("lh");

register('command', () => {
  let list = new Message(ChatLib.getCenteredText("&8===================&6Last Houses&8===================\n"))
  if (last_houses.length > 10) last_houses = last_houses.slice(0, 11);
  if (ChatLib.getChatLines().map(chat => new Message(chat)).some(msg => msg.getChatLineId() === 5054236)) ChatLib.clearChat(5054236);

  function makeHouseComponent(house) {
    let comp = new TextComponent(ChatLib.getCenteredText(`&7[${house.id}] - ${house.name} by ${house.owner}\n`))
    hasPlayerName(house.owner.removeFormatting())
    ? comp.setClick('run_command', `/home ${house.name.removeFormatting()}`)
    : comp.setClick('run_command', `/visit ${removeRanks(house.owner.removeFormatting())} ${house.name.removeFormatting()}`);
    comp.setHover('show_text', 'visit this house!')

    return comp;
  }

  last_houses.filter(e => e).forEach(house => list.addTextComponent(makeHouseComponent(house)));
  list.addTextComponent(ChatLib.getCenteredText("&8======================================"))
  list.setChatLineId(5054236);
  list.chat();
}).setName('lasthouses').setAliases("lhs");
