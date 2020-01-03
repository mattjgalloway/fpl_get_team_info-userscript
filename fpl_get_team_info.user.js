// ==UserScript==
// @name        FPL get team info
// @namespace   mattjgalloway
// @include     https://fantasy.premierleague.com/leagues/*/standings/*
// @run-at      document-idle
// @version     1.0.2
// @license     GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

// Fork of Nick Child's fantastic plugin: https://openuserjs.org/scripts/nickchild/FPL_get_team_info

var gwnum = 0;
var playersObj = [];
var livePlayersObj = [];
var teamsObj = [];
var fixturesObj = [];

var config_items = new Array("teamval", "bankval", "totalval", "tt", "gwt", "hitpts", "wc", "chips", "captain", "livepoints", "livetotal", "wide", "played");
var config_values = {};
var config_strs = {};
config_strs.teamval = "Team value";
config_strs.bankval = "Bank value";
config_strs.totalval = "Total value";
config_strs.tt = "Total transfers";
config_strs.gwt = "Gameweek transfers";
config_strs.wc = "Wildcard";
config_strs.chips = "Chips";
config_strs.captain = "Captain";
config_strs.livepoints = "Live gameweek points";
config_strs.livetotal = "Live total points";
config_strs.wide = "Extra wide";
config_strs.played = "Playing stats";
config_strs.hitpts = "Transfer points hit";

for (var i = 0; i < config_items.length; i++) {
  let c = config_items[i];
  config_values[c] = getCookie(c);
}

var optionWidth = "220px";
var refreshWidth = "";
if (config_values.wide == 1) {
  refreshWidth = "1100px";
} else {
  refreshWidth = "880px";
}

function GetXmlHttpObject() {
  var xmlHttp = null;
  try {
    xmlHttp = new XMLHttpRequest();
  }
  catch (e) {
    try {
      xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
    }
    catch (e) {
      xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
  }
  return xmlHttp;
}

function apiPromise(path) {
  let url = "https://fantasy.premierleague.com/api/" + path;
  let xmlHttp = GetXmlHttpObject();
  return new Promise(function (resolve, reject) {
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState !== 4) return;
      if (xmlHttp.status >= 200 && xmlHttp.status < 300) {
        resolve(xmlHttp);
      } else {
        reject({
          status: xmlHttp.status,
          statusText: xmlHttp.statusText
        });
      }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
  });
}

function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "1";
}

function supplementHeaderRow(table) {
  var headstr = "";
  if (config_values.teamval == 1) {
    headstr += "<th title='Team value'>Value</th>";
  }
  if (config_values.bankval == 1) {
    headstr += "<th title='Bank value'>Bank</th>";
  }
  if (config_values.totalval == 1) {
    headstr += "<th title='Total value'>Total</th>";
  }
  if (config_values.tt == 1) {
    headstr += "<th><abbr title='Total transfers'>TT</abbr></th>";
  }
  if (config_values.gwt == 1) {
    headstr += "<th><abbr title='Gameweek transfers'>GWT</abbr></th>";
  }
  if (config_values.hitpts == 1) {
    headstr += "<th><abbr title='Transfer points hit'>TPH</abbr></th>";
  }
  if (config_values.wc == 1) {
    headstr += "<th><abbr title='Wildcard available'>WC</abbr></th>";
  }
  if (config_values.chips == 1) {
    headstr += "<th><abbr title='Chips played'>Chips</abbr></th>";
  }
  if (config_values.captain == 1) {
    headstr += "<th>Captain</th>";
  }
  if (config_values.livepoints == 1) {
    headstr += "<th><abbr title='Live gameweek points'>Live</abbr></th>";
  }
  if (config_values.livetotal == 1) {
    headstr += "<th><abbr title='Live points total'>Total</abbr></th>";
  }
  if (config_values.played == 1) {
    headstr += "<th><abbr title='Players played'>P</abbr></th>";
    headstr += "<th><abbr title='Players to play'>TP</abbr></th>";
    headstr += "<th><abbr title='Players who did not play'>DNP</abbr></th>";
  }

  let thead = table.getElementsByTagName("thead")[0];
  let theadRow = thead.getElementsByTagName("tr")[0];
  let ths = theadRow.getElementsByTagName("th");
  ths[0].className = "sorttable_nosort";
  ths[0].innerHTML = '<abbr onclick="divs=document.getElementsByTagName(\'div\');onoff=\'\';for(i=0;i<divs.length;i++){tmpid=divs[i].id;if(tmpid.lastIndexOf(\'teamdiv_\', 0) === 0){if(onoff==\'\'){if(divs[i].style.display == \'none\'){onoff=\'on\'}else{onoff=\'off\'}}if(onoff==\'on\'){divs[i].style.display=\'\'}else{divs[i].style.display=\'none\'}}}" title="Toggle teams">T</abbr>';
  ths[1].className = "sorttable_nosort";
  theadRow.innerHTML = theadRow.innerHTML + headstr;
}

function supplementTeamRow(teamId, teamRow) {
  var rowstr = "";
  if (config_values.teamval == 1) {
    rowstr += "<td id='teamval" + teamId + "' align='right' nowrap>&nbsp;</td>";
  }
  if (config_values.bankval == 1) {
    rowstr += "<td id='bankval" + teamId + "' align='right' nowrap>&nbsp;</td>";
  }
  if (config_values.totalval == 1) {
    rowstr += "<td id='totalval" + teamId + "' align='right' nowrap>&nbsp;</td>";
  }
  if (config_values.tt == 1) {
    rowstr += "<td id='tt" + teamId + "'>&nbsp;</td>";
  }
  if (config_values.gwt == 1) {
    rowstr += "<td id='gwt" + teamId + "'>&nbsp;</td>";
  }
  if (config_values.hitpts == 1) {
    rowstr += "<td id='hitpts" + teamId + "'>&nbsp;</td>";
  }
  if (config_values.wc == 1) {
    rowstr += "<td id='wc" + teamId + "' align='center'>&nbsp;</td>";
  }
  if (config_values.chips == 1) {
    rowstr += "<td id='chips" + teamId + "' align='center'>&nbsp;</td>";
  }
  if (config_values.captain == 1) {
    rowstr += "<td id='captain" + teamId +"' nowrap>&nbsp;</td>";
  }
  if (config_values.livepoints == 1) {
    rowstr += "<td id='livescore" + teamId +"'>&nbsp;</td>";
  }
  if (config_values.livetotal == 1) {
    rowstr += "<td id='livetotal" + teamId + "' nowrap>&nbsp;</td>";
  }
  if (config_values.played == 1) {
    rowstr += "<td id='played" + teamId + "' nowrap>&nbsp;</td>";
    rowstr += "<td id='toplay" + teamId + "' nowrap>&nbsp;</td>";
    rowstr += "<td id='didntplay" + teamId + "' nowrap>&nbsp;</td>";
  }

  teamRow.innerHTML = teamRow.innerHTML + rowstr;
  let tmpCells = teamRow.getElementsByTagName("td");
  let teamDiv = "<div id='teamdiv_" + teamId + "' style='display: none; position: absolute; overflow: auto; height: 100%; width: 1000px; left: 0; background: white; color: black; line-height: 25px; font-size: 11px; top: 0;'>&nbsp;</div>";
  tmpCells[2].style.position = "relative";
  tmpCells[2].innerHTML = tmpCells[2].innerHTML + teamDiv;
  tmpCells[0].innerHTML = tmpCells[0].innerHTML + "<abbr onclick=\"tmpdiv=document.getElementById('teamdiv_" + teamId + "');if(tmpdiv.style.display=='block'){tmpdiv.style.display='none'}else{tmpdiv.style.display='block'}\" title='Toggle Team'>T</abbr>";
}

function addConfigRow(table) {
  table.innerHTML = table.innerHTML + "<tbody><tr><td colspan=21><div id='configrow'></div></td></tr></tbody>";
  var configrow = document.getElementById("configrow");

  for (i = 0; i < config_items.length; i++) {
    let c = config_items[i];

    var div, span, a;

    div = document.createElement('div');
    div.style.display = "inline-block";
    div.style.float = "left";
    div.style.width = optionWidth;

    span = document.createElement('span');
    span.appendChild(document.createTextNode(config_strs[c] + ': '));
    div.appendChild(span);

    a = document.createElement('a');
    if (config_values[c] == 0) {
      a.style.color = "#bbb";
    }
    a.id = c + '_on';
    a.appendChild(document.createTextNode('On'));
    a.href = 'javascript:null(0)';
    eval("a.addEventListener('click', function(){document.getElementById(\"" + c + "_on\").style.color='#000'; document.getElementById(\"" + c + "_off\").style.color='#bbb'; setCookie(\"" + c + "\", 1,1);}, false);");
    div.appendChild(a);

    span = document.createElement('span');
    span.appendChild(document.createTextNode(' | '));
    div.appendChild(span);

    a = document.createElement('a');
    if (config_values[c] == 1) {
      a.style.color = "#bbb";
    }
    a.id = c + '_off';
    a.appendChild(document.createTextNode('Off'));
    a.href = 'javascript:null(0)';
    eval("a.addEventListener('click', function(){document.getElementById(\"" + c + "_off\").style.color='#000'; document.getElementById(\"" + c + "_on\").style.color='#bbb'; setCookie(\"" + c + "\", 0, 1);}, false);");
    div.appendChild(a);
    configrow.appendChild(div);
  }

  div = document.createElement('div');
  div.style.display = "inline-block";
  div.style.float = "left";
  div.style.width = optionWidth;

  span = document.createElement('span');
  span.appendChild(document.createTextNode('All: '));
  div.appendChild(span);

  a = document.createElement('a');
  a.id = 'all_on';
  a.appendChild(document.createTextNode('On'));
  a.href = 'javascript:null(0)';
  a.addEventListener('click', function () {
    for (i = 0; i < config_items.length; i++) {
      let c = config_items[i];
      document.getElementById(c + "_on").style.color = '#000';
      document.getElementById(c + "_off").style.color = '#bbb';
      setCookie(c, 1);
    }
  }, false);
  div.appendChild(a);

  span = document.createElement('span');
  span.appendChild(document.createTextNode(' | '));
  div.appendChild(span);

  a = document.createElement('a');
  a.id = 'all_off';
  a.appendChild(document.createTextNode('Off'));
  a.href = 'javascript:null(0)';
  a.addEventListener('click', function () {
    for (i = 0; i < config_items.length; i++) {
      let c = config_items[i];
      document.getElementById(c + "_off").style.color = '#000';
      document.getElementById(c + "_on").style.color = '#bbb';
      setCookie(c, 0);
    }
  }, false);
  div.appendChild(a);
  configrow.appendChild(div);

  div = document.createElement('div');
  div.style.display = "inline-block";
  div.style.float = "left";
  div.style.width = optionWidth;

  span = document.createElement('span');
  span.appendChild(document.createTextNode('Quick picks: '));
  div.appendChild(span);

  a = document.createElement('a');
  a.id = 'all_on';
  a.appendChild(document.createTextNode('Team Info'));
  a.href = 'javascript:null(0)';
  a.addEventListener('click', function () {
    for (i = 0; i < config_items.length; i++) {
      if (i < 8) {
        let c = config_items[i];
        document.getElementById(c + "_on").style.color = '#000';
        document.getElementById(c + "_off").style.color = '#bbb';
        setCookie(c, 1);
      }
      else {
        let c = config_items[i];
        document.getElementById(c + "_off").style.color = '#000';
        document.getElementById(c + "_on").style.color = '#bbb';
        setCookie(c, 0);
      }
    }
  }, false);
  div.appendChild(a);

  span = document.createElement('span');
  span.appendChild(document.createTextNode(' | '));
  div.appendChild(span);

  a = document.createElement('a');
  a.id = 'all_off';
  a.appendChild(document.createTextNode('Live Data'));
  a.href = 'javascript:null(0)';
  a.addEventListener('click', function () {
    for (i = 0; i < config_items.length; i++) {
      if (i == 7 || i == 8 || i == 10 || i == 11 || i == 13) {
        let c = config_items[i];
        document.getElementById(c + "_on").style.color = '#000';
        document.getElementById(c + "_off").style.color = '#bbb';
        setCookie(c, 1);
      }
      else {
        let c = config_items[i];
        document.getElementById(c + "_off").style.color = '#000';
        document.getElementById(c + "_on").style.color = '#bbb';
        setCookie(c, 0);
      }
    }
  }, false);
  div.appendChild(a);
  configrow.appendChild(div);

  div = document.createElement('div');
  div.style.display = "inline-block";
  div.style.width = refreshWidth;
  div.style.float = "bottom";
  div.style.paddingTop = "10px";

  span = document.createElement('span');

  a = document.createElement('a');
  a.appendChild(document.createTextNode('Reload'));
  a.href = 'javascript:location.reload()';
  a.style.border = "1px solid #000";
  a.style.padding = "3px";
  a.style.borderRadius = "6px";
  span.appendChild(a);
  div.appendChild(span);
  configrow.appendChild(div);
}

function getData() {
  let rootDiv = document.getElementById("root");
  let tables = rootDiv.getElementsByTagName("table");
  let table = tables[0];

  supplementHeaderRow(table);
  addConfigRow(table);

  let tbody = table.getElementsByTagName("tbody")[0];
  let teamRows = tbody.getElementsByTagName("tr");
  let teamDataPromises = Array.prototype.map.call(teamRows, function(teamRow) {
    let tds = teamRow.getElementsByTagName("td");
    let anc = tds[1].getElementsByTagName("a");
    let teamId = anc[0].pathname.match(/\/entry\/(\d+)\/event\/\d+/)[1];
    let idpn = "row" + teamId;
    teamRow.id = idpn;

    supplementTeamRow(teamId, teamRow);

    let picksPromise = apiPromise("entry/" + teamId + "/event/" + gwnum + "/picks/");
    let historyPromise = apiPromise("entry/" + teamId + "/history/");

    Promise.all([picksPromise, historyPromise])
      .then(function(response) {
        updateTeamRow(teamId, response[0], response[1]);
      });
  });

  return teamDataPromises;
}

function updateTeamRow(teamId, picksResponse, historyResponse) {
  let teamObj = JSON.parse(picksResponse.responseText);

  let gwTransfers = teamObj.entry_history.event_transfers;
  let transfersHit = teamObj.entry_history.event_transfers_cost;
  let picks = teamObj.picks;

  var liveScore = 0;
  var playedStr = "";
  var playedNum = 0;
  var toPlayStr = "";
  var toPlayNum = 0;
  var didntPlayStr = "";
  var didntPlayNum = 0;
  var startingStr = "";
  var benchStr = "";

  var captain = "";
  var viceCaptain = "";

  var captainDNP = false;
  picks.forEach(function(pick) {
    let playerData = playersObj[pick.element];

    if (pick.position < 12) {
      liveScore = liveScore + playerData.event_points * pick.multiplier;
      if (startingStr != "") {
        startingStr += ", ";
      }
      startingStr += playerData.web_name;
      if (pick.is_captain == true) {
        startingStr += " (c)";
      }
      if (pick.is_vice_captain == true) {
        startingStr += " (vc)";
      }
    } else {
      if (benchStr != "") {
        benchStr += ", ";
      }
      benchStr += playerData.web_name;
    }

    let isCaptain = false;
    let isViceCaptain = false;
    if (pick.is_captain == true) {
      captain = playerData.web_name;
      isCaptain = true;
    } else if (pick.is_vice_captain == true) {
      viceCaptain = playerData.web_name;
      isViceCaptain = true;
    }

    if (pick.position < 12) {
      let tmpPlayerTeamId = playerData.team;
      var tmpFixtureId = 0;
      Object.values(fixturesObj).forEach(function(fixture) {
        if (fixture.team_h === tmpPlayerTeamId || fixture.team_a === tmpPlayerTeamId) {
          tmpFixtureId = fixture.id;
        }
      });

      if (fixturesObj[tmpFixtureId].started == true) {
        var hasPlayed = false;
        if (livePlayersObj[playerData.id].stats.minutes > 0) {
          hasPlayed = true
        };

        if (hasPlayed) {
          if (playedStr != "") {
            playedStr += "\n";
          }
          playedNum++;
          playedStr += playerData.web_name
        } else {
          if (didntPlayStr != "") {
            didntPlayStr += "\n";
          }
          didntPlayNum++;
          didntPlayStr += playerData.web_name;
          if (isCaptain) {
            captainDNP = true;
          }
        }
      } else {
        if (toPlayStr != "") {
          toPlayStr += "\n";
        }
        toPlayNum++;
        toPlayStr += playerData.web_name
      }
    }
  });

  let squadStr = "<div style='margin-left: 10px'>Starting XI: " + startingStr + "<br />Subs: " + benchStr + '</div>';
  let currentPoints = teamObj.entry_history.total_points;
  let weekPoints = teamObj.entry_history.points;
  let liveTotal = (currentPoints - weekPoints) + liveScore;

  let entryObj = JSON.parse(historyResponse.responseText);
  let chipsObj = entryObj.chips;
  let info = entryObj.current;

  var totalTransfers = 0, value = 0, bank = 0;
  for (i = 0; i < info.length; i++) {
    totalTransfers += info[i].event_transfers;
    value = info[i].value / 10;
    bank = info[i].bank / 10;
  }
  let totalValue = Math.round((value + bank) * 10) / 10;

  let chipCount = chipsObj.length;
  var chipStr = "";
  var chipActive = false;

  var wildcard1Used = 0;
  var wildcard2Used = 0;
  chipsObj.forEach(function(chip) {
    if (chip.event == gwnum) {
      chipActive = true
    }

    var chipName = chip.name;
    if (chipName == "bboost") {
      chipName = "Bench Boost";
    } else if (chipName == "wildcard") {
      chipName = "Wildcard";
    } else if (chipName == "bboost") {
      chipName = "Bench Boost";
    } else if (chipName == "3xc") {
      chipName = "Triple Captain";
    } else if (chipName == "fhit" || chipName == "freehit") {
      chipName = "Free Hit";
    }

    if (chipStr != "") {
      chipStr += "\n";
    }
    chipStr += chipName + " (GW" + chip.event + ")";

    if (chip.name == "wildcard") {
      if (chip.event <= 20) {
        wildcard1Used = chip.event;
      } else {
        wildcard2Used = chip.event;
      }
    }
  });

  var rowstr = "";
  if (config_values.teamval == 1) {
    document.getElementById("teamval" + teamId).innerHTML = value.toFixed(1);
  }
  if (config_values.bankval == 1) {
    document.getElementById("bankval" + teamId).innerHTML = bank.toFixed(1);
  }
  if (config_values.totalval == 1) {
    document.getElementById("totalval" + teamId).innerHTML = totalValue.toFixed(1);
  }
  if (config_values.tt == 1) {
    document.getElementById("tt" + teamId).innerHTML = totalTransfers;
  }
  if (config_values.gwt == 1) {
    document.getElementById("gwt" + teamId).innerHTML = gwTransfers;
  }
  if (config_values.hitpts == 1) {
    document.getElementById("hitpts" + teamId).innerHTML = transfersHit;
  }
  if (config_values.wc == 1) {
    var html = "";
    if (wildcard1Used == 0) {
      html += "<span title='Available' style='color: green'>&#10003;</span>";
    } else {
      html += "<span title='Used GW" + wildcard1Used + "' style='color: red'>X</span>";
    }
    html += " / ";
    if (wildcard2Used == 0) {
      html += "<span title='Available' style='color: green'>&#10003;</span>";
    } else {
      html += "<span title='Used GW" + wildcard2Used + "' style='color: red'>X</span>";
    }
    document.getElementById("wc" + teamId).innerHTML = html;
  }
  if (config_values.chips == 1) {
    var chipStyleStr = "";
    if (chipActive) {
      chipStyleStr = " style='background-color: #ffe6e6; padding: 10px'";
    }
    document.getElementById("chips" + teamId).innerHTML = "<span title='" + chipStr + "'" + chipStyleStr + ">" + chipCount + "</span>";
  }
  if (config_values.captain == 1) {
    document.getElementById("captain" + teamId).innerHTML = captain + "<br/><span style='font-size: 0.8; color: #999;'>" + viceCaptain + "</span>";
  }
  if (config_values.livepoints == 1) {
    document.getElementById("livescore" + teamId).innerHTML = liveScore;
  }
  if (config_values.livetotal == 1) {
    document.getElementById("livetotal" + teamId).innerHTML = numberWithCommas(liveTotal);
  }
  if (config_values.played == 1) {
    document.getElementById("played" + teamId).innerHTML = playedNum;
    document.getElementById("played" + teamId).title = playedStr;
    document.getElementById("toplay" + teamId).innerHTML = toPlayNum;
    document.getElementById("toplay" + teamId).title = toPlayStr;
    document.getElementById("didntplay" + teamId).innerHTML = didntPlayNum;
    document.getElementById("didntplay" + teamId).title = didntPlayStr;
  }

  let teamDiv = document.getElementById("teamdiv_" + teamId);
  teamDiv.innerHTML = squadStr;
}

function startScript() {
  var links = document.getElementsByTagName("a");
  for (i = 0; i < links.length; i++) {
    var match = links[i].pathname.match(/\/entry\/\d+\/event\/(\d+)/);
    if (match !== null) {
      gwnum = match[1];
      break;
    }
  }
  if (gwnum == 0) {
    setTimeout(function () {
      startScript();
    }, 100);
    return;
  }

  let playersPromise = apiPromise("bootstrap-static/")
    .then(function(response) {
      let responseObject = JSON.parse(response.responseText);
      responseObject.elements.forEach(function(player) {
        playersObj[player.id] = player;
      });
      responseObject.teams.forEach(function(team) {
        teamsObj[team.id] = team;
      });
    });
  let livePromise = apiPromise("event/" + gwnum + "/live/")
    .then(function(response) {
      let responseObject = JSON.parse(response.responseText);
      responseObject.elements.forEach(function(livePlayer) {
        livePlayersObj[livePlayer.id] = livePlayer;
      });
    });
  let fixturesPromise = apiPromise("fixtures/?event=" + gwnum)
    .then(function(response) {
      let responseObject = JSON.parse(response.responseText);
      responseObject.forEach(function(fixture) {
        fixturesObj[fixture.id] = fixture;
      });
    });

  Promise.all([playersPromise, livePromise, fixturesPromise])
    .then(function() {
      return getData();
    })
    .catch(function(error) {
      console.log("Error running script: " + error);
    });
}
startScript();

